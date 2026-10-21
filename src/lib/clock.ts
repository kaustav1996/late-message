import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { checkIns, deliveries, recipients, switches, type Switch } from "@/db/schema";
import { firstActionAt, isValidRhythm, timeline, type Rhythm } from "./schedule";

export type CheckInMethod = (typeof checkIns.method.enumValues)[number];

export async function getSwitch(userId: string): Promise<Switch> {
  const existing = await db.query.switches.findFirst({ where: eq(switches.userId, userId) });
  if (existing) return existing;
  const [created] = await db.insert(switches).values({ userId }).onConflictDoNothing().returning();
  return created ?? (await db.query.switches.findFirst({ where: eq(switches.userId, userId) }))!;
}

export function rhythmOf(sw: Pick<Switch, "rhythmUnit" | "rhythmCount">): Rhythm {
  return { unit: sw.rhythmUnit, count: sw.rhythmCount };
}

/**
 * "I'm still here." Resets the clock. Does nothing once letters are released:
 * that state is only left deliberately, through takeBack().
 */
export async function checkIn(userId: string, method: CheckInMethod, now = new Date()): Promise<Switch> {
  const sw = await getSwitch(userId);
  if (sw.status === "released") return sw;
  const [updated] = await db
    .update(switches)
    .set({
      lastCheckInAt: now,
      stage: 0,
      finalWarningAt: null,
      nextActionAt: sw.status === "armed" ? firstActionAt(now, rhythmOf(sw)) : null,
      updatedAt: now,
    })
    .where(and(eq(switches.userId, userId), inArray(switches.status, ["draft", "armed"])))
    .returning();
  await db.insert(checkIns).values({ userId, method, at: now });
  return updated ?? sw;
}

export async function setRhythm(userId: string, rhythm: Rhythm, now = new Date()): Promise<Switch> {
  if (!isValidRhythm(rhythm)) throw new Error("That rhythm isn't one we offer");
  await getSwitch(userId);
  await db
    .update(switches)
    .set({ rhythmUnit: rhythm.unit, rhythmCount: rhythm.count, updatedAt: now })
    .where(and(eq(switches.userId, userId), inArray(switches.status, ["draft", "armed"])));
  // Changing the rhythm is proof of life, and restarts the clock on the new rhythm.
  return checkIn(userId, "button", now);
}

export async function arm(userId: string, now = new Date()): Promise<Switch> {
  const sw = await getSwitch(userId);
  if (sw.status === "released") throw new Error("Your letters have already been sent");
  await db
    .update(switches)
    .set({ status: "armed", updatedAt: now })
    .where(and(eq(switches.userId, userId), eq(switches.status, "draft")));
  return checkIn(userId, "armed", now);
}

export async function disarm(userId: string, now = new Date()): Promise<void> {
  await db
    .update(switches)
    .set({ status: "draft", stage: 0, nextActionAt: null, finalWarningAt: null, updatedAt: now })
    .where(and(eq(switches.userId, userId), eq(switches.status, "armed")));
}

/**
 * The owner is alive after all. Closes every recipient link, cancels
 * deliveries that haven't gone out, and returns the clock to draft.
 */
export async function takeBack(userId: string, now = new Date()): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(recipients)
      .set({ accessTokenHash: null })
      .where(and(eq(recipients.userId, userId), isNotNull(recipients.accessTokenHash)));
    await tx
      .update(deliveries)
      .set({ status: "failed", lastError: "Cancelled: the owner took the letters back" })
      .where(and(eq(deliveries.userId, userId), eq(deliveries.kind, "release"), eq(deliveries.status, "pending")));
    await tx
      .update(switches)
      .set({ status: "draft", stage: 0, nextActionAt: null, finalWarningAt: null, releasedAt: null, lastCheckInAt: now, updatedAt: now })
      .where(eq(switches.userId, userId));
    await tx.insert(checkIns).values({ userId, method: "login", at: now });
  });
}

export function clockView(sw: Switch, now = new Date()) {
  const t = timeline(sw.lastCheckInAt, rhythmOf(sw));
  const overdue = now >= t.dueAt;
  return { ...t, overdue, stage: sw.stage, status: sw.status };
}
