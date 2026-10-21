import styles from "@/components/letter-view.module.css";

export default function LetterNotFound() {
  return (
    <div className={styles.page}>
      <header className={styles.masthead}>
        <span className={styles.brand}>Keepsake</span>
        <hr className="rule-double" />
      </header>
      <main id="main" className={styles.main}>
        <h1 className={`hand ${styles.to}`}>This link is closed.</h1>
        <p className={styles.note}>
          Either the address isn&rsquo;t quite right, or the person who wrote to you has checked in again and closed it. If you
          copied the link from a message, try opening it straight from the message instead.
        </p>
      </main>
    </div>
  );
}
