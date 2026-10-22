import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { decrypt } from "@/lib/crypto";
import { firstName, formatDate } from "@/lib/format";
import { excerpt } from "@/lib/letters";
import { listLetters, listRecipients } from "@/lib/queries";
import styles from "../app.module.css";

export const metadata: Metadata = { title: "Letters" };

function addressedTo(names: string[], toEveryone: boolean): string {
  if (toEveryone) return "For everyone";
  if (names.length === 0) return "Not addressed to anyone yet";
  if (names.length <= 2) return `For ${names.join(" and ")}`;
  return `For ${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;
}

export default async function LettersPage() {
  const user = await requireUser();
  const [letters, people] = await Promise.all([listLetters(user.id), listRecipients(user.id)]);
  const nameOf = new Map(people.map((p) => [p.id, firstName(p.name)]));

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Letters</h1>
          <p className={styles.pageLede}>Sealed until the day they&rsquo;re needed. Only you can read them until then.</p>
        </div>
        <Link href="/app/letters/new" className="btn">
          Write a letter
        </Link>
      </div>

      {letters.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>The first one is the hardest.</p>
          <p className={styles.muted}>
            It doesn&rsquo;t have to be long. Where the papers are, a password, or just something you never got round to
            saying.
          </p>
          <Link href="/app/letters/new" className="btn">
            Write a letter
          </Link>
        </div>
      ) : (
        <ul className={styles.rows}>
          {letters.map((l) => {
            const names = l.recipientIds.map((id) => nameOf.get(id)).filter((n): n is string => Boolean(n));
            return (
              <li key={l.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <Link href={`/app/letters/${l.id}`} className={styles.rowTitle}>
                    {l.title}
                  </Link>
                  <span className={styles.rowMeta}>
                    <span className={styles.tag}>{l.kind === "personal" ? "Personal" : "Template"}</span>
                    <span>{addressedTo(names, l.toEveryone)}</span>
                    <span>Edited {formatDate(l.updatedAt, user.timezone)}</span>
                  </span>
                  <p className={styles.excerpt}>{excerpt(decrypt(l.body))}</p>
                </div>
                <Link href={`/app/letters/${l.id}`} className="btn btn-small btn-quiet">
                  Open
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
