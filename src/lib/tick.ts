import { and, asc, eq, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { authTokens, deliveries, recipients, switches, users, type Channel, type Delivery, type Switch, type User } from "@/db/schema";
import { randomToken, recipientToken, sha256 } from "./crypto";
import { appUrl } from "./env";
import { providerFor } from "./notify";
import { forChannel, releaseMessage, releasedOwnerMessage, reminderMessage, type ReminderStage } from "./notify/messages";
import { letterCounts, listLetters, listRecipients, lettersFor } from "./queries";
import { nextStep, STAGE, timeline, type Stage } from "./schedule";
import { rhythmOf } from "./clock";

const BATCH = 200;
export const MAX_ATTEMPTS = 6;

const REMINDER_FOR_STAGE: Record<Exclude<Stage, 0>, ReminderStage> = {
  [STAGE.headsUp]: "heads_up",
  [STAGE.missed]: "missed",
  [STAGE.finalWarning]: "final_warning",
};

export type TickSummary = { checked: number; advanced: number; released: number; sent: number; failed: number };

/** One pass of the clock. Safe to run concurrently and as often as you like. */
export async function runTick(now = new Date()): Promise<TickSummary> {
  const summary: TickSummary = { checked: 0, advanced: 0, released: 0, sent: 0, failed: 0 };
  const due = await db
    .select()
    .from(switches)
    .where(and(eq(switches.status, "armed"), lte(switches.nextActionAt, now)))
    .orderBy(asc(switches.nextActionAt))
    .limit(BATCH);

  for (const sw of due) {
    summary.checked++;
    try {
      const outcome = await processSwitch(sw, now);
      if (outcome === "advanced") summary.advanced++;
      if (outcome === "released") summary.released++;
    } catch (err) {
      console.error(`[tick] switch ${sw.userId} failed`, err);
    }
  }

  const sent = await sendPending(now);
  summary.sent = sent.sent;
  summary.failed = sent.failed;
  return summary;
}

/**
 * Every write is guarded by the row's `stage` and `lastCheckInAt` as read, so
 * a check-in that lands mid-tick always wins and nothing is sent twice.
 */
async function processSwitch(sw: Switch, now: Date): Promise<"waited" | "advanced" | "released" | "skipped"> {
  const step = nextStep(sw, rhythmOf(sw), now);
  const unchanged = and(
    eq(switches.userId, sw.userId),
    eq(switches.status, "armed"),
    eq(switches.stage, sw.stage),
    eq(switches.lastCheckInAt, sw.lastCheckInAt),
  );

  if (step.type === "wait") {
    await db.update(switches).set({ nextActionAt: step.until }).where(unchanged);
    return "waited";
  }

  if (step.type === "advance") {
    const kind = REMINDER_FOR_STAGE[step.to as Exclude<Stage, 0>];
    return db.transaction(async (tx) => {
      const [row] = await tx
        .update(switches)
        .set({
          stage: step.to,
          nextActionAt: step.nextActionAt,
          finalWarningAt: step.to === STAGE.finalWarning ? now : sw.finalWarningAt,
          updatedAt: now,
        })
        .where(unchanged)
        .returning();
      if (!row) return "skipped";
      const owner = await tx.query.users.findFirst({ where: eq(users.id, sw.userId) });
      if (!owner) return "skipped";
      const rows = ownerChannels(owner).map((c) => ({
        userId: owner.id,
        kind,
        channel: c.channel,
        destination: c.destination,
        nextAttemptAt: now,
        createdAt: now,
      }));
      if (rows.length) await tx.insert(deliveries).values(rows);
      return "advanced";
    });
  }

  // Release.
  const people = await listRecipients(sw.userId);
  const counts = letterCounts(people, await listLetters(sw.userId));
  const receiving = people.filter((p) => (counts.get(p.id) ?? 0) > 0);

  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(switches)
      .set({ status: "released", releasedAt: now, nextActionAt: null, updatedAt: now })
      .where(unchanged)
      .returning();
    if (!row) return "skipped";
    const owner = await tx.query.users.findFirst({ where: eq(users.id, sw.userId) });
    if (!owner) return "skipped";

    const rows: (typeof deliveries.$inferInsert)[] = [];
    for (const person of receiving) {
      await tx
        .update(recipients)
        .set({ accessTokenHash: sha256(recipientToken(person.id, now)) })
        .where(eq(recipients.id, person.id));
      for (const c of recipientChannels(person)) {
        rows.push({ userId: owner.id, recipientId: person.id, kind: "release", channel: c.channel, destination: c.destination, nextAttemptAt: now, createdAt: now });
      }
    }
    rows.push({ userId: owner.id, kind: "released_owner", channel: "email", destination: owner.email, nextAttemptAt: now, createdAt: now });
    await tx.insert(deliveries).values(rows).onConflictDoNothing();
    return "released";
  });
}

function ownerChannels(owner: User): { channel: Channel; destination: string }[] {
  const out: { channel: Channel; destination: string }[] = [{ channel: "email", destination: owner.email }];
  if (owner.phone && owner.remindBySms && providerFor("sms")) out.push({ channel: "sms", destination: owner.phone });
  if (owner.phone && owner.remindByWhatsapp && providerFor("whatsapp")) out.push({ channel: "whatsapp", destination: owner.phone });
  return out;
}

function recipientChannels(r: typeof recipients.$inferSelect): { channel: Channel; destination: string }[] {
  const out: { channel: Channel; destination: string }[] = [];
  if (r.email && r.viaEmail) out.push({ channel: "email", destination: r.email });
  if (r.phone && r.viaSms && providerFor("sms")) out.push({ channel: "sms", destination: r.phone });
  if (r.phone && r.viaWhatsapp && providerFor("whatsapp")) out.push({ channel: "whatsapp", destination: r.phone });
  return out;
}

/** Sends queued deliveries, retrying failures with backoff (1, 2, 4, 8, 16 minutes). */
export async function sendPending(now = new Date()): Promise<{ sent: number; failed: number }> {
  const result = { sent: 0, failed: 0 };
  const pending = await db
    .select()
    .from(deliveries)
    .where(and(eq(deliveries.status, "pending"), lte(deliveries.nextAttemptAt, now)))
    .orderBy(asc(deliveries.createdAt))
    .limit(BATCH);

  for (const d of pending) {
    // Claim it: bump attempts and push the next attempt out, so a concurrent tick skips it.
    const backoffMs = 60_000 * 2 ** d.attempts;
    const [claimed] = await db
      .update(deliveries)
      .set({ attempts: sql`${deliveries.attempts} + 1`, nextAttemptAt: new Date(now.getTime() + backoffMs) })
      .where(and(eq(deliveries.id, d.id), eq(deliveries.status, "pending"), eq(deliveries.attempts, d.attempts)))
      .returning();
    if (!claimed) continue;

    try {
      const outcome = await deliver(claimed, now);
      if (outcome === "cancelled") continue;
      await db.update(deliveries).set({ status: "sent", sentAt: new Date(), providerId: outcome.providerId, lastError: null }).where(eq(deliveries.id, d.id));
      result.sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const gaveUp = claimed.attempts >= MAX_ATTEMPTS;
      await db
        .update(deliveries)
        .set({ status: gaveUp ? "failed" : "pending", lastError: message.slice(0, 500) })
        .where(eq(deliveries.id, d.id));
      if (gaveUp) result.failed++;
      console.error(`[deliver] ${d.kind}/${d.channel} attempt ${claimed.attempts} failed: ${message}`);
    }
  }
  return result;
}

async function cancel(d: Delivery, reason: string): Promise<"cancelled"> {
  await db.update(deliveries).set({ status: "failed", lastError: reason }).where(eq(deliveries.id, d.id));
  return "cancelled";
}

/** Renders at send time from current state, so retries never send stale news. */
async function deliver(d: Delivery, now: Date): Promise<{ providerId: string } | "cancelled"> {
  const provider = providerFor(d.channel);
  if (!provider) return cancel(d, `${d.channel} is switched off`);
  const owner = await db.query.users.findFirst({ where: eq(users.id, d.userId) });
  const sw = await db.query.switches.findFirst({ where: eq(switches.userId, d.userId) });
  if (!owner || !sw) return cancel(d, "Owner no longer exists");

  if (d.kind === "heads_up" || d.kind === "missed" || d.kind === "final_warning") {
    if (sw.status !== "armed" || sw.lastCheckInAt > d.createdAt) return cancel(d, "Superseded: the owner checked in");
    const t = timeline(sw.lastCheckInAt, rhythmOf(sw));
    const token = randomToken();
    await db.insert(authTokens).values({
      id: sha256(token),
      userId: owner.id,
      purpose: "check_in",
      expiresAt: new Date(t.releaseAt.getTime() + 7 * 24 * 3600_000),
    });
    const people = await listRecipients(owner.id);
    const counts = letterCounts(people, await listLetters(owner.id));
    const message = reminderMessage(d.kind, {
      ownerName: owner.name,
      dueAt: t.dueAt,
      releaseAt: sw.stage >= STAGE.finalWarning && sw.nextActionAt ? sw.nextActionAt : t.releaseAt,
      recipientCount: [...counts.values()].filter((n) => n > 0).length,
      link: appUrl(`/checkin/${token}`),
      tz: owner.timezone,
    });
    return provider.send(forChannel(d.channel, d.destination, message));
  }

  if (d.kind === "release") {
    if (sw.status !== "released" || !sw.releasedAt || !d.recipientId) return cancel(d, "Release was taken back");
    const person = await db.query.recipients.findFirst({ where: eq(recipients.id, d.recipientId) });
    if (!person?.accessTokenHash) return cancel(d, "Recipient link is closed");
    const letterCount = (await lettersFor(owner.id, person.id)).length;
    const message = releaseMessage({
      recipientName: person.name,
      ownerName: owner.name,
      lastCheckInAt: sw.lastCheckInAt,
      letterCount,
      link: appUrl(`/l/${recipientToken(person.id, sw.releasedAt)}`),
      tz: owner.timezone,
    });
    return provider.send(forChannel(d.channel, d.destination, message));
  }

  if (d.kind === "released_owner") {
    if (sw.status !== "released" || !sw.releasedAt) return cancel(d, "Release was taken back");
    const count = await db
      .select({ n: sql<number>`count(distinct ${deliveries.recipientId})::int` })
      .from(deliveries)
      .where(and(eq(deliveries.userId, owner.id), eq(deliveries.kind, "release"), inArray(deliveries.status, ["pending", "sent"])));
    const message = releasedOwnerMessage({
      ownerName: owner.name,
      releasedAt: sw.releasedAt,
      recipientCount: count[0]?.n ?? 0,
      link: appUrl("/login"),
      tz: owner.timezone,
    });
    return provider.send(forChannel("email", d.destination, message));
  }

  return cancel(d, `Unknown delivery kind ${d.kind}`);
}

