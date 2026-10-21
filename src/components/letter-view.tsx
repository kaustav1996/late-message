import { firstName, formatDate } from "@/lib/format";
import { PrintButton } from "./print-button";
import styles from "./letter-view.module.css";

type Props = {
  ownerName: string;
  recipientName: string;
  lastHeardAt: Date;
  letters: { id: string; title: string; body: string }[];
  tz: string;
  banner?: React.ReactNode;
};

/** What a recipient sees. Also used, unchanged, for the owner's preview. */
export function LetterView({ ownerName, recipientName, lastHeardAt, letters, tz, banner }: Props) {
  const from = firstName(ownerName);
  return (
    <div className={styles.page}>
      {banner}
      <header className={styles.masthead}>
        <span className={styles.brand}>Keepsake</span>
        <hr className="rule-double" />
      </header>
      <main id="main" className={styles.main}>
        <div className={styles.address}>
          <h1 className={`hand ${styles.to}`}>
            For {firstName(recipientName)},
            <span className={styles.from}>from {ownerName}</span>
          </h1>
          <p className={styles.note}>
            {from} asked us to keep {letters.length === 1 ? "this letter" : "these letters"} and send{" "}
            {letters.length === 1 ? "it" : "them"} to you if they ever stopped checking in with us. We last heard from them
            on {formatDate(lastHeardAt, tz)}.
          </p>
        </div>

        {letters.map((l) => (
          <article key={l.id} className={styles.sheet} aria-labelledby={`letter-${l.id}`}>
            <h2 id={`letter-${l.id}`} className={styles.title}>
              {l.title}
            </h2>
            <div className={`read ${styles.body}`}>{l.body}</div>
          </article>
        ))}

        <footer className={styles.footer}>
          <p>This page is only for you. Please don&rsquo;t share the link.</p>
          <PrintButton />
        </footer>
      </main>
    </div>
  );
}
