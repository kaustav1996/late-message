import { eq, isNull, and } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LetterView } from "@/components/letter-view";
import { db } from "@/db";
import { recipients, switches, users } from "@/db/schema";
import { decrypt, sha256 } from "@/lib/crypto";
import { fillTemplate } from "@/lib/letters";
import { lettersFor } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "A letter for you", robots: { index: false, follow: false } };

export default async function RecipientLetterPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) notFound();

  const person = await db.query.recipients.findFirst({ where: eq(recipients.accessTokenHash, sha256(token)) });
  if (!person) notFound();
  const [owner, sw] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, person.userId) }),
    db.query.switches.findFirst({ where: eq(switches.userId, person.userId) }),
  ]);
  if (!owner || !sw || sw.status !== "released") notFound();

  const letters = (await lettersFor(owner.id, person.id)).map((l) => ({
    id: l.id,
    title: l.title,
    body: fillTemplate(decrypt(l.body), { name: person.name, myName: owner.name }),
  }));
  if (letters.length === 0) notFound();

  await db
    .update(recipients)
    .set({ firstOpenedAt: new Date() })
    .where(and(eq(recipients.id, person.id), isNull(recipients.firstOpenedAt)));

  return <LetterView ownerName={owner.name} recipientName={person.name} lastHeardAt={sw.lastCheckInAt} letters={letters} tz={owner.timezone} />;
}
