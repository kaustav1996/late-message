import DodoPayments from "dodopayments";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { payments, users, type User } from "@/db/schema";
import { appUrl, env } from "@/lib/env";
import { MAX_PACKS_PER_PURCHASE, slotsForPacks } from "@/lib/pricing";

export function paymentsConfigured(): boolean {
  const e = env();
  return Boolean(e.DODO_PAYMENTS_API_KEY && e.DODO_PRODUCT_ID);
}

function client(): DodoPayments {
  const e = env();
  return new DodoPayments({
    bearerToken: e.DODO_PAYMENTS_API_KEY,
    webhookKey: e.DODO_PAYMENTS_WEBHOOK_KEY ?? null,
    environment: e.DODO_PAYMENTS_ENVIRONMENT,
  });
}

/**
 * Starts a Dodo checkout for `packs` packs. The product in Dodo is a one-time
 * ₹20 product; the quantity is the number of packs.
 */
export async function createCheckout(user: User, packs: number): Promise<string> {
  if (!Number.isInteger(packs) || packs < 1 || packs > MAX_PACKS_PER_PURCHASE) throw new Error("Choose between 1 and 50 packs");
  const productId = env().DODO_PRODUCT_ID;
  if (!productId) throw new Error("Payments aren't set up yet");
  const session = await client().checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: packs }],
    customer: { email: user.email, name: user.name },
    billing_currency: "INR",
    metadata: { user_id: user.id, packs: String(packs) },
    return_url: appUrl("/app/people?paid=1"),
  });
  if (!session.checkout_url) throw new Error("Dodo didn't return a checkout link");
  return session.checkout_url;
}

type WebhookOutcome = "credited" | "duplicate" | "ignored";

/** Verifies the Standard Webhooks signature and credits slots once per payment. */
export async function handleWebhook(rawBody: string, headers: Record<string, string>): Promise<WebhookOutcome> {
  if (!env().DODO_PAYMENTS_WEBHOOK_KEY) throw new Error("DODO_PAYMENTS_WEBHOOK_KEY is not set");
  const event = client().webhooks.unwrap(rawBody, { headers });
  if (event.type !== "payment.succeeded") return "ignored";
  return creditPayment(event.data);
}

export async function creditPayment(payment: {
  payment_id: string;
  metadata: Record<string, string | number | boolean>;
  product_cart?: Array<{ product_id: string; quantity: number }> | null;
  total_amount: number;
  currency: string;
}): Promise<WebhookOutcome> {
  const userId = payment.metadata.user_id;
  if (typeof userId !== "string" || !/^[0-9a-f-]{36}$/i.test(userId)) return "ignored";
  const productId = env().DODO_PRODUCT_ID;
  // Trust what was paid for, not the metadata.
  const line = payment.product_cart?.find((p) => p.product_id === productId);
  const packs = line?.quantity ?? 0;
  if (packs < 1) return "ignored";

  return db.transaction(async (tx) => {
    const user = await tx.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) return "ignored";
    const [inserted] = await tx
      .insert(payments)
      .values({
        id: payment.payment_id,
        userId,
        packs,
        slots: slotsForPacks(packs),
        amount: payment.total_amount,
        currency: payment.currency,
        raw: payment,
      })
      .onConflictDoNothing()
      .returning();
    if (!inserted) return "duplicate";
    await tx
      .update(users)
      .set({ extraSlots: sql`${users.extraSlots} + ${slotsForPacks(packs)}` })
      .where(eq(users.id, userId));
    return "credited";
  });
}
