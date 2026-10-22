import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { letterRecipients, letters, recipients, type Letter, type Recipient } from "@/db/schema";
import { decrypt } from "./crypto";

export type LetterWithPeople = Letter & { recipientIds: string[] };

export async function countRecipients(userId: string): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(recipients).where(eq(recipients.userId, userId));
  return row?.n ?? 0;
}

export async function listRecipients(userId: string): Promise<Recipient[]> {
  return db.select().from(recipients).where(eq(recipients.userId, userId)).orderBy(asc(recipients.createdAt));
}

export async function listLetters(userId: string): Promise<LetterWithPeople[]> {
  const rows = await db.select().from(letters).where(eq(letters.userId, userId)).orderBy(desc(letters.updatedAt));
  if (rows.length === 0) return [];
  const links = await db
    .select()
    .from(letterRecipients)
    .where(inArray(letterRecipients.letterId, rows.map((r) => r.id)));
  return rows.map((l) => ({ ...l, recipientIds: links.filter((x) => x.letterId === l.id).map((x) => x.recipientId) }));
}

export async function getLetter(userId: string, letterId: string): Promise<(LetterWithPeople & { plain: string }) | null> {
  const letter = await db.query.letters.findFirst({ where: and(eq(letters.id, letterId), eq(letters.userId, userId)) });
  if (!letter) return null;
  const links = await db.select().from(letterRecipients).where(eq(letterRecipients.letterId, letterId));
  return { ...letter, recipientIds: links.map((l) => l.recipientId), plain: decrypt(letter.body) };
}

/** Letters a recipient will receive: addressed to them, or to everyone. */
export async function lettersFor(userId: string, recipientId: string): Promise<Letter[]> {
  const linked = db.select({ id: letterRecipients.letterId }).from(letterRecipients).where(eq(letterRecipients.recipientId, recipientId));
  return db
    .select()
    .from(letters)
    .where(and(eq(letters.userId, userId), or(eq(letters.toEveryone, true), inArray(letters.id, linked))))
    .orderBy(asc(letters.createdAt));
}

/** How many letters each recipient will get. Recipients with none are left out of a release. */
export function letterCounts(people: Recipient[], all: LetterWithPeople[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of people) {
    counts.set(p.id, all.filter((l) => l.toEveryone || l.recipientIds.includes(p.id)).length);
  }
  return counts;
}
