import { Wordmark } from "@/components/wordmark";
import styles from "./auth.module.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Wordmark />
      </header>
      <main id="main" className={styles.main}>
        {children}
      </main>
    </div>
  );
}
