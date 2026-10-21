import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { closeDb, db } from "@/db";
import { deliveries, letterRecipients, letters, recipients, switches, users } from "@/db/schema";
import { arm, checkIn, getSwitch, setRhythm, takeBack } from "@/lib/clock";
import { encrypt, recipientToken, sha256 } from "@/lib/crypto";
import { setProviderOverrides, type OutboundMessage } from "@/lib/notify";
import type { ChannelProvider } from "@/lib/notify/types";
import { creditPayment } from "@/lib/payments/dodo";
import { timeline } from "@/lib/schedule";
import { runTick } from "@/lib/tick";

type Sent = { channel: string; message: OutboundMessage };
let outbox: Sent[] = [];
let failNext = 0;

function capture(channel: "email" | "sms" | "whatsapp"): ChannelProvider {
  return {
    channel,
    name: "test",
    async send(message) {
      if (failNext > 0) {
        failNext--;
        throw new Error("provider down");
      }
      outbox.push({ channel, message });
      return { providerId: `test_${outbox.length}` };
    },
  };
}

const t0 = new Date("2026-05-04T09:00:00Z");
const weekly = { unit: "week", count: 1 } as const;

async function seed() {
  const [owner] = await db
    .insert(users)
    .values({ email: "ravi@example.com", name: "Ravi Menon", passwordHash: "x", emailVerifiedAt: t0, phone: "+919800000001", remindByWhatsapp: true })
    .returning();
  const [asha, dev] = await db
    .insert(recipients)
    .values([
      { userId: owner!.id, name: "Asha Menon", email: "asha@example.com", phone: "+919800000002", viaEmail: true, viaWhatsapp: true },
      { userId: owner!.id, name: "Dev", email: "dev@example.com", viaEmail: true },
    ])
    .returning();
  const [letter] = await db
    .insert(letters)
    .values({ userId: owner!.id, kind: "personal", title: "For Asha", body: encrypt("Dear {name}, the keys are with Mrs Pillai.") })
    .returning();
  await db.insert(letterRecipients).values({ letterId: letter!.id, recipientId: asha!.id });
  return { owner: owner!, asha: asha!, dev: dev! };
}

beforeEach(async () => {
  await db.execute(sql`truncate users, sessions, auth_tokens, switches, check_ins, recipients, letters, letter_recipients, deliveries, payments cascade`);
  outbox = [];
  failNext = 0;
  setProviderOverrides({ email: capture("email"), sms: capture("sms"), whatsapp: capture("whatsapp") });
});

afterAll(async () => {
  await closeDb();
});

describe("the clock", () => {
  it("does nothing while it is a draft", async () => {
    const { owner } = await seed();
    await getSwitch(owner.id);
    await runTick(new Date(t0.getTime() + 60 * 24 * 3600_000));
    expect(outbox).toHaveLength(0);
  });

  it("nudges, then a check-in resets everything", async () => {
    const { owner } = await seed();
    await arm(owner.id, t0);
    const t = timeline(t0, weekly);

    await runTick(t.headsUpAt);
    expect(outbox.map((o) => o.channel).sort()).toEqual(["email", "whatsapp"]);
    expect(outbox[0]!.message.text).toContain("/checkin/");

    // Running again at the same moment sends nothing new.
    await runTick(t.headsUpAt);
    expect(outbox).toHaveLength(2);

    const later = new Date(t.headsUpAt.getTime() + 3600_000);
    await checkIn(owner.id, "button", later);
    const sw = await getSwitch(owner.id);
    expect(sw.stage).toBe(0);
    expect(sw.nextActionAt?.getTime()).toBe(timeline(later, weekly).headsUpAt.getTime());

    // The old due date passes without anything happening.
    outbox = [];
    await runTick(t.releaseAt);
    expect(outbox).toHaveLength(0);
  });

  it("releases only to people with letters, after every warning", async () => {
    const { owner, asha, dev } = await seed();
    await arm(owner.id, t0);
    const t = timeline(t0, weekly);

    for (const moment of [t.headsUpAt, t.dueAt, t.finalWarningAt]) await runTick(moment);
    const kinds = (await db.select().from(deliveries)).map((d) => d.kind);
    expect(kinds.filter((k) => k === "heads_up")).toHaveLength(2);
    expect(kinds.filter((k) => k === "missed")).toHaveLength(2);
    expect(kinds.filter((k) => k === "final_warning")).toHaveLength(2);
    expect((await getSwitch(owner.id)).status).toBe("armed");

    outbox = [];
    // Two workers firing at once must not double-send.
    await Promise.all([runTick(t.releaseAt), runTick(t.releaseAt)]);
    const sw = await getSwitch(owner.id);
    expect(sw.status).toBe("released");

    const toAsha = outbox.filter((o) => o.message.to === "asha@example.com" || o.message.to === "+919800000002");
    expect(toAsha.map((o) => o.channel).sort()).toEqual(["email", "whatsapp"]);
    expect(outbox.some((o) => o.message.to === "dev@example.com")).toBe(false);
    expect(outbox.some((o) => o.message.to === "ravi@example.com" && o.message.subject === "We've sent your letters")).toBe(true);

    const token = recipientToken(asha.id, sw.releasedAt!);
    expect(toAsha[0]!.message.text).toContain(`/l/${token}`);
    const found = await db.query.recipients.findFirst({ where: eq(recipients.accessTokenHash, sha256(token)) });
    expect(found?.id).toBe(asha.id);
    const devRow = await db.query.recipients.findFirst({ where: eq(recipients.id, dev.id) });
    expect(devRow?.accessTokenHash).toBeNull();

    // Logging in afterwards doesn't silently undo a release.
    await checkIn(owner.id, "login", new Date(t.releaseAt.getTime() + 1000));
    expect((await getSwitch(owner.id)).status).toBe("released");

    // Taking it back closes the links.
    await takeBack(owner.id, new Date(t.releaseAt.getTime() + 2000));
    expect((await db.query.recipients.findFirst({ where: eq(recipients.id, asha.id) }))?.accessTokenHash).toBeNull();
    expect((await getSwitch(owner.id)).status).toBe("draft");
  });

  it("retries failed deliveries and drops reminders made stale by a check-in", async () => {
    const { owner } = await seed();
    await arm(owner.id, t0);
    const t = timeline(t0, weekly);

    failNext = 2;
    await runTick(t.headsUpAt);
    expect(outbox).toHaveLength(0);
    const pending = await db.select().from(deliveries).where(eq(deliveries.status, "pending"));
    expect(pending).toHaveLength(2);

    await checkIn(owner.id, "link", new Date(t.headsUpAt.getTime() + 30_000));
    await runTick(new Date(t.headsUpAt.getTime() + 5 * 60_000));
    expect(outbox).toHaveLength(0);
    const cancelled = await db.select().from(deliveries).where(eq(deliveries.status, "failed"));
    expect(cancelled.every((d) => d.lastError?.startsWith("Superseded"))).toBe(true);
  });

  it("restarts the clock when the rhythm changes", async () => {
    const { owner } = await seed();
    await arm(owner.id, t0);
    const later = new Date(t0.getTime() + 3 * 24 * 3600_000);
    await setRhythm(owner.id, { unit: "hour", count: 6 }, later);
    const sw = await db.query.switches.findFirst({ where: eq(switches.userId, owner.id) });
    expect(sw?.rhythmUnit).toBe("hour");
    expect(sw?.lastCheckInAt.getTime()).toBe(later.getTime());
  });
});

describe("payments", () => {
  it("credits a pack once per payment", async () => {
    const { owner } = await seed();
    const payment = {
      payment_id: "pay_123",
      metadata: { user_id: owner.id, packs: "99" },
      product_cart: [{ product_id: "pdt_pack", quantity: 2 }],
      total_amount: 4000,
      currency: "INR",
    };
    expect(await creditPayment(payment)).toBe("credited");
    expect(await creditPayment(payment)).toBe("duplicate");
    const user = await db.query.users.findFirst({ where: eq(users.id, owner.id) });
    expect(user?.extraSlots).toBe(40);
  });
});
