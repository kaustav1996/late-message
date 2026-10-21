import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { authTokens, deliveries, users, type User } from "@/db/schema";
import { randomToken, sha256 } from "@/lib/crypto";
import { appUrl } from "@/lib/env";
import { providerFor } from "@/lib/notify";
import { forChannel, resetPasswordMessage, verifyEmailMessage } from "@/lib/notify/messages";

type Purpose = (typeof authTokens.purpose.enumValues)[number];

export async function issueToken(userId: string, purpose: Purpose, ttlMs: number): Promise<string> {
  const token = randomToken();
  await db.insert(authTokens).values({ id: sha256(token), userId, purpose, expiresAt: new Date(Date.now() + ttlMs) });
  return token;
}

/** Looks a token up without using it. */
export async function peekToken(token: string, purpose: Purpose) {
  return db.query.authTokens.findFirst({
    where: and(eq(authTokens.id, sha256(token)), eq(authTokens.purpose, purpose), isNull(authTokens.usedAt), gt(authTokens.expiresAt, new Date())),
  });
}

/** Marks a token used and returns its user id, or null if it is spent, expired or wrong. */
export async function consumeToken(token: string, purpose: Purpose): Promise<string | null> {
  const [row] = await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(authTokens.id, sha256(token)), eq(authTokens.purpose, purpose), isNull(authTokens.usedAt), gt(authTokens.expiresAt, new Date())))
    .returning({ userId: authTokens.userId });
  return row?.userId ?? null;
}

async function sendAccountEmail(user: User, kind: "verify_email" | "reset_password", message: ReturnType<typeof verifyEmailMessage>) {
  const provider = providerFor("email");
  const [row] = await db
    .insert(deliveries)
    .values({ userId: user.id, kind, channel: "email", destination: user.email, attempts: 1 })
    .returning();
  try {
    if (!provider) throw new Error("Email is switched off");
    const { providerId } = await provider.send(forChannel("email", user.email, message));
    await db.update(deliveries).set({ status: "sent", sentAt: new Date(), providerId }).where(eq(deliveries.id, row!.id));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db.update(deliveries).set({ status: "failed", lastError: msg.slice(0, 500) }).where(eq(deliveries.id, row!.id));
    throw err;
  }
}

export async function sendVerificationEmail(user: User): Promise<void> {
  const token = await issueToken(user.id, "verify_email", 2 * 24 * 3600_000);
  await sendAccountEmail(user, "verify_email", verifyEmailMessage({ name: user.name, link: appUrl(`/verify/${token}`) }));
}

export async function sendPasswordReset(email: string): Promise<void> {
  const user = await db.query.users.findFirst({ where: (u, { sql }) => sql`lower(${u.email}) = ${email.toLowerCase()}` });
  if (!user) return; // Same response either way, so addresses can't be probed.
  const token = await issueToken(user.id, "reset_password", 3600_000);
  await sendAccountEmail(user, "reset_password", resetPasswordMessage({ name: user.name, link: appUrl(`/reset/${token}`) }));
}

export async function markEmailVerified(userId: string): Promise<void> {
  await db.update(users).set({ emailVerifiedAt: new Date() }).where(and(eq(users.id, userId), isNull(users.emailVerifiedAt)));
}
