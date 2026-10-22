import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LetterView } from "@/components/letter-view";
import { requireUser } from "@/lib/auth/session";
import { firstName } from "@/lib/format";
import { fillTemplate } from "@/lib/letters";
import { getLetter, listRecipients } from "@/lib/queries";
import { getSwitch } from "@/lib/clock";
import styles from "@/app/app/letters/letters.module.css";

export const metadata: Metadata = { title: "Preview", robots: { index: false } };

export default async function PreviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ as?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const { as } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [letter, people, sw] = await Promise.all([getLetter(user.id, id), listRecipients(user.id), getSwitch(user.id)]);
  if (!letter) notFound();

  const readers = letter.toEveryone ? people : people.filter((p) => letter.recipientIds.includes(p.id));
  const reader = readers.find((p) => p.id === as) ?? readers[0];
  const name = reader?.name ?? "Asha";

  const banner = (
    <div className={styles.previewBar}>
      <span>
        Preview{reader ? ` as ${firstName(name)}` : " with a sample name"}. Only this letter is shown.
      </span>
      {readers.length > 1 ? (
        <span className={styles.previewPeople}>
          {readers.map((p) => (
            <Link key={p.id} href={`/preview/${letter.id}?as=${p.id}`} aria-current={p.id === reader?.id}>
              {firstName(p.name)}
            </Link>
          ))}
        </span>
      ) : null}
      <Link href={`/app/letters/${letter.id}`}>Back to editing</Link>
    </div>
  );

  return (
    <LetterView
      banner={banner}
      ownerName={user.name}
      recipientName={name}
      lastHeardAt={sw.lastCheckInAt}
      tz={user.timezone}
      letters={[{ id: letter.id, title: letter.title, body: fillTemplate(letter.plain, { name, myName: user.name }) }]}
    />
  );
}
