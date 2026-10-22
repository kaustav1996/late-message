import Link from "next/link";
import styles from "./site-footer.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <hr className="rule-double" />
      <div className={styles.inner}>
        <p className={styles.note}>Keepsake carries your words. It isn&rsquo;t a will and doesn&rsquo;t replace one.</p>
        <nav aria-label="Footer" className={styles.links}>
          <Link href="/login">Log in</Link>
          <Link href="/signup">Start free</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/refunds">Refunds</Link>
        </nav>
      </div>
    </footer>
  );
}
