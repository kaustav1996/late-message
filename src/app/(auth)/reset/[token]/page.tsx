import type { Metadata } from "next";
import Link from "next/link";
import { peekToken } from "@/lib/auth/tokens";
import styles from "../../auth.module.css";
import { ResetForm } from "../../forms";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = await peekToken(token, "reset_password");
  return (
    <>
      <div className={styles.intro}>
        <h1 className={styles.title}>A new password.</h1>
        {valid ? <p>Choose something you&rsquo;ll remember, even if you only log in once a month.</p> : null}
      </div>
      <section className={styles.box} aria-label="New password">
        {valid ? (
          <ResetForm token={token} />
        ) : (
          <div className={styles.form}>
            <p className="notice notice-alarm">This link has expired or was already used.</p>
            <Link href="/forgot" className="btn">
              Send me a new link
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
