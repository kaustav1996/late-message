import { SiteFooter } from "@/components/site-footer";
import { Wordmark } from "@/components/wordmark";
import styles from "./legal.module.css";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className={styles.header}>
        <Wordmark />
      </header>
      <main id="main" className={styles.main}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
