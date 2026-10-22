"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { letterRecipients, letters, recipients, users } from "@/db/schema";
import { currentUser, destroySession, requireUser } from "@/lib/auth/session";
import { consumeToken } from "@/lib/auth/tokens";
import { arm, checkIn, disarm, getSwitch, setRhythm, takeBack } from "@/lib/clock";
import { encrypt, hashPassword, verifyPassword } from "@/lib/crypto";
import { normalisePhone } from "@/lib/format";
import { bool, fieldErrors, str, type FormState } from "@/lib/form";
import { createCheckout, paymentsConfigured } from "@/lib/payments/dodo";
import { capacity, MAX_PACKS_PER_PURCHASE } from "@/lib/pricing";
import { countRecipients } from "@/lib/queries";
import { isValidRhythm, MAX_MONTHS, RHYTHM_PRESETS, type Rhythm } from "@/lib/schedule";

// ---- The clock ----

export async function checkInNow(): Promise<FormState> {
  const user = await requireUser();
  const sw = await checkIn(user.id, "button");
  revalidatePath("/app");
  return sw.status === "released" ? { error: "Your letters were already sent." } : { done: sw.lastCheckInAt.toISOString() };
}

/** From a reminder link. Works without a session. */
export async function checkInWithToken(_prev: FormState, form: FormData): Promise<FormState> {
  const userId = await consumeToken(str(form, "token"), "check_in");
  if (!userId) {
    const user = await currentUser();
    if (user) {
      await checkIn(user.id, "button");
      return { done: "checked-in" };
    }
    return { error: "This link has already been used or has expired. Log in to check in instead." };
  }
  const sw = await checkIn(userId, "link");
  if (sw.status === "released") return { error: "Your letters were already sent. Log in to close their links." };
  return { done: "checked-in" };
}

function parseRhythm(form: FormData): Rhythm | null {
  const choice = str(form, "rhythm");
  const preset = RHYTHM_PRESETS.find((p) => p.id === choice);
  if (preset) return preset.rhythm;
  if (choice === "months") {
    const n = Number(str(form, "months"));
    const r: Rhythm = { unit: "month", count: n };
    return isValidRhythm(r) && n <= MAX_MONTHS ? r : null;
  }
  return null;
}

export async function saveRhythm(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const rhythm = parseRhythm(form);
  if (!rhythm) return { error: "Choose how often we should hear from you." };
  await setRhythm(user.id, rhythm);
  revalidatePath("/app", "layout");
  return { ok: "Saved. The clock starts again from now." };
}

export async function startClock(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!user.emailVerifiedAt) return { error: "Confirm your email first, so our reminders can reach you." };
  const rhythm = parseRhythm(form);
  await arm(user.id, new Date(), rhythm ?? undefined);
  revalidatePath("/app", "layout");
  return { ok: "The clock is running." };
}

export async function stopClock(): Promise<void> {
  const user = await requireUser();
  await disarm(user.id);
  revalidatePath("/app", "layout");
}

export async function takeLettersBack(): Promise<void> {
  const user = await requireUser();
  const sw = await getSwitch(user.id);
  if (sw.status === "released") await takeBack(user.id);
  revalidatePath("/app", "layout");
}

// ---- People ----

const personSchema = z
  .object({
    name: z.string().trim().min(1, "Add their name").max(80),
    relation: z.string().trim().max(60).optional(),
    email: z.union([z.literal(""), z.string().trim().toLowerCase().email("That doesn't look like an email address")]),
    phone: z.string().trim(),
    viaEmail: z.boolean(),
    viaSms: z.boolean(),
    viaWhatsapp: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.phone && !normalisePhone(v.phone)) ctx.addIssue({ code: "custom", path: ["phone"], message: "Include the country code, like +91 98123 45678" });
    if (v.viaEmail && !v.email) ctx.addIssue({ code: "custom", path: ["email"], message: "Add an email address, or untick email" });
    if ((v.viaSms || v.viaWhatsapp) && !v.phone) ctx.addIssue({ code: "custom", path: ["phone"], message: "Add a phone number for SMS or WhatsApp" });
    if (!v.viaEmail && !v.viaSms && !v.viaWhatsapp) ctx.addIssue({ code: "custom", path: ["channels"], message: "Choose at least one way to reach them" });
  });

export async function savePerson(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = personSchema.safeParse({
    name: str(form, "name"),
    relation: str(form, "relation") || undefined,
    email: str(form, "email"),
    phone: str(form, "phone"),
    viaEmail: bool(form, "viaEmail"),
    viaSms: bool(form, "viaSms"),
    viaWhatsapp: bool(form, "viaWhatsapp"),
  });
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };
  const v = parsed.data;
  const values = {
    name: v.name,
    relation: v.relation ?? null,
    email: v.email || null,
    phone: v.phone ? normalisePhone(v.phone) : null,
    viaEmail: v.viaEmail,
    viaSms: v.viaSms,
    viaWhatsapp: v.viaWhatsapp,
  };

  const id = str(form, "id");
  if (id) {
    await db.update(recipients).set(values).where(and(eq(recipients.id, id), eq(recipients.userId, user.id)));
  } else {
    if ((await countRecipients(user.id)) >= capacity(user.extraSlots)) return { error: "You've used every place you have. Add a pack of 20 to make room." };
    await db.insert(recipients).values({ ...values, userId: user.id });
  }
  revalidatePath("/app", "layout");
  redirect("/app/people?saved=1");
}

export async function deletePerson(form: FormData): Promise<void> {
  const user = await requireUser();
  const id = str(form, "id");
  await db.transaction(async (tx) => {
    const person = await tx.query.recipients.findFirst({ where: and(eq(recipients.id, id), eq(recipients.userId, user.id)) });
    if (!person) return;
    // Personal letters have exactly one reader; without them they'd be orphans.
    const theirs = tx.select({ id: letterRecipients.letterId }).from(letterRecipients).where(eq(letterRecipients.recipientId, id));
    await tx.delete(letters).where(and(eq(letters.userId, user.id), eq(letters.kind, "personal"), inArray(letters.id, theirs)));
    await tx.delete(recipients).where(eq(recipients.id, id));
  });
  revalidatePath("/app", "layout");
  redirect("/app/people");
}

// ---- Letters ----

const letterSchema = z
  .object({
    title: z.string().trim().min(1, "Give it a title, just for you").max(120),
    kind: z.enum(["personal", "template"]),
    body: z.string().trim().min(1, "Write something first").max(50_000, "That's longer than we can keep (50,000 characters)"),
    toEveryone: z.boolean(),
    recipientIds: z.array(z.string().uuid()),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "personal" && v.recipientIds.length !== 1) ctx.addIssue({ code: "custom", path: ["to"], message: "Choose who this letter is for" });
    if (v.kind === "template" && !v.toEveryone && v.recipientIds.length === 0)
      ctx.addIssue({ code: "custom", path: ["to"], message: "Choose at least one person, or everyone" });
  });

export async function saveLetter(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const kind = str(form, "kind") === "template" ? "template" : "personal";
  const parsed = letterSchema.safeParse({
    title: str(form, "title"),
    kind,
    body: typeof form.get("body") === "string" ? (form.get("body") as string) : "",
    toEveryone: kind === "template" && bool(form, "toEveryone"),
    recipientIds: kind === "personal" ? [str(form, "personId")].filter(Boolean) : form.getAll("recipientIds").map(String),
  });
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };
  const v = parsed.data;

  const owned = v.recipientIds.length
    ? await db.select({ id: recipients.id }).from(recipients).where(and(eq(recipients.userId, user.id), inArray(recipients.id, v.recipientIds)))
    : [];
  if (owned.length !== v.recipientIds.length) return { error: "One of those people no longer exists. Reload and try again." };

  const id = str(form, "id");
  const letterId = await db.transaction(async (tx) => {
    let lid = id;
    const values = { title: v.title, kind: v.kind, body: encrypt(v.body), toEveryone: v.toEveryone, updatedAt: new Date() };
    if (lid) {
      const [row] = await tx.update(letters).set(values).where(and(eq(letters.id, lid), eq(letters.userId, user.id))).returning({ id: letters.id });
      if (!row) return null;
    } else {
      const [row] = await tx.insert(letters).values({ ...values, userId: user.id }).returning({ id: letters.id });
      lid = row!.id;
    }
    await tx.delete(letterRecipients).where(eq(letterRecipients.letterId, lid));
    if (v.recipientIds.length) await tx.insert(letterRecipients).values(v.recipientIds.map((recipientId) => ({ letterId: lid, recipientId })));
    return lid;
  });
  if (!letterId) return { error: "We couldn't find that letter." };
  revalidatePath("/app", "layout");
  redirect(`/app/letters/${letterId}?saved=1`);
}

export async function deleteLetter(form: FormData): Promise<void> {
  const user = await requireUser();
  await db.delete(letters).where(and(eq(letters.id, str(form, "id")), eq(letters.userId, user.id)));
  revalidatePath("/app", "layout");
  redirect("/app/letters");
}

// ---- Settings ----

export async function saveReminders(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const raw = str(form, "phone");
  const phone = raw ? normalisePhone(raw) : null;
  if (raw && !phone) return { fields: { phone: "Include the country code, like +91 98123 45678" } };
  const bySms = bool(form, "remindBySms");
  const byWhatsapp = bool(form, "remindByWhatsapp");
  if ((bySms || byWhatsapp) && !phone) return { fields: { phone: "Add your phone number for SMS or WhatsApp reminders" } };
  await db.update(users).set({ phone, remindBySms: bySms, remindByWhatsapp: byWhatsapp }).where(eq(users.id, user.id));
  revalidatePath("/app", "layout");
  return { ok: "Reminder settings saved." };
}

export async function saveProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = str(form, "name");
  const timezone = str(form, "timezone");
  if (!name) return { fields: { name: "Your name appears on every letter, so it can't be empty" } };
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
  } catch {
    return { fields: { timezone: "Choose a time zone from the list" } };
  }
  await db.update(users).set({ name: name.slice(0, 80), timezone }).where(eq(users.id, user.id));
  revalidatePath("/app", "layout");
  return { ok: "Saved." };
}

export async function changePassword(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const current = form.get("current");
  const next = form.get("next");
  if (typeof current !== "string" || !(await verifyPassword(current, user.passwordHash))) return { fields: { current: "That isn't your current password" } };
  if (typeof next !== "string" || next.length < 10) return { fields: { next: "Use at least 10 characters" } };
  await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, user.id));
  return { ok: "Password changed." };
}

export async function deleteAccount(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  if (str(form, "confirm").toLowerCase() !== "delete") return { fields: { confirm: "Type delete to confirm" } };
  await db.delete(users).where(eq(users.id, user.id));
  await destroySession();
  redirect("/?deleted=1");
}

// ---- Billing ----

export async function buyPacks(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!paymentsConfigured()) return { error: "Payments aren't switched on yet. Add your Dodo Payments keys to enable them." };
  const packs = Number(str(form, "packs"));
  if (!Number.isInteger(packs) || packs < 1 || packs > MAX_PACKS_PER_PURCHASE) return { error: `Choose between 1 and ${MAX_PACKS_PER_PURCHASE} packs.` };
  let url: string;
  try {
    url = await createCheckout(user, packs);
  } catch (err) {
    console.error("[checkout]", err);
    return { error: "We couldn't open the payment page. Please try again in a minute." };
  }
  redirect(url);
}
