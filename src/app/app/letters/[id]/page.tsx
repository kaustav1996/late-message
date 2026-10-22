import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteLetter } from "@/app/actions/app";
import { ConfirmAction } from "@/components/confirm-action";
import { requireUser } from "@/lib/auth/session";
import { getLetter, listRecipients } from "@/lib/queries";
import styles from "../../app.module.css";
import { LetterEditor } from "../letter-editor";

export const metadata: Metadata = { title: "Letter" };

export default async function LetterPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const { saved } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [letter, people] = await Promise.all([getLetter(user.id, id), listRecipients(user.id)]);
  if (!letter) notFound();

  return (
    <>
      <div>
        <p className={styles.small}>
          <Link href="/app/letters">Letters</Link>
        </p>
        <h1 className={styles.pageTitle}>{letter.title}</h1>
      </div>
      {saved ? (
        <p className="notice notice-ok" role="status">
          Saved and sealed. <Link href={`/preview/${letter.id}`}>See it as they will</Link>
        </p>
      ) : null}
      <LetterEditor
        key={letter.updatedAt.toISOString()}
        people={people.map((p) => ({ id: p.id, name: p.name }))}
        letter={{ id: letter.id, title: letter.title, kind: letter.kind, body: letter.plain, toEveryone: letter.toEveryone, recipientIds: letter.recipientIds }}
      />
      <div className={styles.danger}>
        <ConfirmAction
          action={deleteLetter}
          fields={{ id: letter.id }}
          label="Delete this letter"
          confirmLabel="Yes, delete it"
          question="Delete it for good? There's no undo."
        />
      </div>
    </>
  );
}
