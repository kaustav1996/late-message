"use server";

import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, currentUser, destroyAllSessions, destroySession } from "@/lib/auth/session";
import { consumeToken, markEmailVerified, sendPasswordReset, sendVerificationEmail } from "@/lib/auth/tokens";
import { checkIn, getSwitch } from "@/lib/clock";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { fieldErrors, str, type FormState } from "@/lib/form";
import { rateLimit } from "@/lib/rate-limit";

const password = z.string().min(10, "Use at least 10 characters").max(200, "That's too long");
const email = z.string().trim().toLowerCase().email("That doesn't look like an email address").max(254);

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "local";
}

export async function signup(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = z
    .object({ name: z.string().trim().min(1, "Tell us your name").max(80), email, password })
    .safeParse({ name: str(form, "name"), email: str(form, "email"), password: form.get("password") });
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };
  if (!rateLimit(`signup:${await clientIp()}`, 10, 60 * 60_000)) return { error: "Too many sign-ups from here. Try again in an hour." };

  const existing = await db.query.users.findFirst({ where: sql`lower(${users.email}) = ${parsed.data.email}` });
  if (existing) return { fields: { email: "There's already an account with this email. Log in instead?" } };

  const timezone = str(form, "timezone") || "Asia/Kolkata";
  const [user] = await db
    .insert(users)
    .values({ name: parsed.data.name, email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password), timezone })
    .returning();
  await getSwitch(user!.id);
  await createSession(user!.id);
  try {
    await sendVerificationEmail(user!);
  } catch (err) {
    console.error("[signup] verification email failed", err);
  }
  redirect("/app");
}

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const address = str(form, "email").toLowerCase();
  const pass = form.get("password");
  if (!address || typeof pass !== "string" || !pass) return { error: "Enter your email and password." };
  if (!rateLimit(`login:${address}`, 8, 15 * 60_000) || !rateLimit(`login-ip:${await clientIp()}`, 30, 15 * 60_000)) {
    return { error: "Too many attempts. Wait 15 minutes, or reset your password." };
  }
  const user = await db.query.users.findFirst({ where: sql`lower(${users.email}) = ${address}` });
  if (!user || !(await verifyPassword(pass, user.passwordHash))) return { error: "That email and password don't match." };
  await createSession(user.id);
  // Logging in is proof of life.
  await checkIn(user.id, "login");
  const next = str(form, "next");
  redirect(next.startsWith("/app") ? next : "/app");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function forgotPassword(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = email.safeParse(str(form, "email"));
  if (!parsed.success) return { fields: { email: "Enter the email you signed up with." } };
  if (!rateLimit(`reset:${parsed.data}`, 3, 60 * 60_000)) return { done: "sent" };
  try {
    await sendPasswordReset(parsed.data);
  } catch (err) {
    console.error("[forgot] reset email failed", err);
    return { error: "We couldn't send the email just now. Try again in a few minutes." };
  }
  return { done: "sent" };
}

export async function resetPassword(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = password.safeParse(form.get("password"));
  if (!parsed.success) return { fields: { password: parsed.error.issues[0]!.message } };
  const userId = await consumeToken(str(form, "token"), "reset_password");
  if (!userId) return { error: "This link has expired or was already used. Ask for a new one." };
  await db.update(users).set({ passwordHash: await hashPassword(parsed.data) }).where(eq(users.id, userId));
  await destroyAllSessions(userId);
  await markEmailVerified(userId);
  await createSession(userId);
  await checkIn(userId, "link");
  redirect("/app?reset=1");
}

export async function verifyEmail(_prev: FormState, form: FormData): Promise<FormState> {
  const userId = await consumeToken(str(form, "token"), "verify_email");
  if (!userId) return { error: "This link has expired or was already used. You can send a new one from your account." };
  await markEmailVerified(userId);
  return { done: "confirmed" };
}

export async function resendVerification(): Promise<FormState> {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.emailVerifiedAt) return { ok: "Already confirmed." };
  if (!rateLimit(`verify:${user.id}`, 3, 60 * 60_000)) return { error: "We've sent a few already. Check your spam folder, or try again in an hour." };
  try {
    await sendVerificationEmail(user);
  } catch {
    return { error: "We couldn't send the email just now. Try again shortly." };
  }
  return { ok: `Sent to ${user.email}.` };
}
