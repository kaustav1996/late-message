import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listRecipients } from "@/lib/queries";
import styles from "../../app.module.css";
import { LetterEditor } from "../letter-editor";

export const metadata: Metadata = { title: "Write a letter" };

export default async function NewLetterPage({ searchParams }: { searchParams: Promise<{ for?: string }> }) {
  const user = await requireUser();
  const people = await listRecipients(user.id);
  const { for: forId } = await searchParams;
  const preselect = people.find((p) => p.id === forId)?.id;
  return (
    <>
      <div>
        <p className={styles.small}>
          <Link href="/app/letters">Letters</Link>
        </p>
        <h1 className={styles.pageTitle}>Write a letter</h1>
      </div>
      <LetterEditor people={people.map((p) => ({ id: p.id, name: p.name }))} preselect={preselect} />
    </>
  );
}
