import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import styles from "../auth.module.css";
import { LoginForm } from "../forms";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await currentUser()) redirect("/app");
  const { next } = await searchParams;
  return (
    <>
      <div className={styles.intro}>
        <h1 className={styles.title}>Welcome back.</h1>
        <p>Logging in counts as a check-in, so this is all it takes to tell us you&rsquo;re still here.</p>
      </div>
      <section className={styles.box} aria-label="Log in">
        <p className={styles.boxLabel}>
          From <span lang="hi">/ प्रेषक</span>
        </p>
        <LoginForm next={next} />
      </section>
    </>
  );
}
