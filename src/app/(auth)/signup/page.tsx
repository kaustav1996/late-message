import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { FREE_RECIPIENTS } from "@/lib/pricing";
import styles from "../auth.module.css";
import { SignupForm } from "../forms";

export const metadata: Metadata = { title: "Start writing" };

export default async function SignupPage() {
  if (await currentUser()) redirect("/app");
  return (
    <>
      <div className={styles.intro}>
        <h1 className={styles.title}>Start with one letter.</h1>
        <p>
          Your first {FREE_RECIPIENTS} people are free, and you don&rsquo;t need a card. Nothing is sent to anyone until
          you&rsquo;ve set up your check-ins and then stopped answering them.
        </p>
      </div>
      <section className={styles.box} aria-label="Open an account">
        <p className={styles.boxLabel}>
          From <span lang="hi">/ प्रेषक</span>
        </p>
        <SignupForm />
      </section>
    </>
  );
}
