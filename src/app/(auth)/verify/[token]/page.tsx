import type { Metadata } from "next";
import styles from "../../auth.module.css";
import { VerifyForm } from "../../forms";

export const metadata: Metadata = { title: "Confirm your email", robots: { index: false } };

export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <>
      <div className={styles.intro}>
        <h1 className={styles.title}>One small thing.</h1>
        <p>Confirming your email means our reminders will reach you before anything is ever sent.</p>
      </div>
      <section className={styles.box} aria-label="Confirm your email">
        <VerifyForm token={token} />
      </section>
    </>
  );
}
