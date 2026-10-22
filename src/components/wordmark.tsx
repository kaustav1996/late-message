import Link from "next/link";
import styles from "./wordmark.module.css";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className={styles.mark} aria-label="Keepsake home">
      <span className={styles.word}>Keepsake</span>
      <span className={styles.sub} lang="hi" aria-hidden="true">
        पत्र
      </span>
    </Link>
  );
}
