import type { Metadata } from "next";
import styles from "../auth.module.css";
import { ForgotForm } from "../forms";

export const metadata: Metadata = { title: "Forgot your password" };

export default function ForgotPage() {
  return (
    <>
      <div className={styles.intro}>
        <h1 className={styles.title}>It happens.</h1>
        <p>We&rsquo;ll email you a link to choose a new password.</p>
      </div>
      <section className={styles.box} aria-label="Reset your password">
        <ForgotForm />
      </section>
    </>
  );
}
