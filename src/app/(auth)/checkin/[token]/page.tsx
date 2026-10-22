import type { Metadata } from "next";
import Link from "next/link";
import { peekToken } from "@/lib/auth/tokens";
import { currentUser } from "@/lib/auth/session";
import styles from "../../auth.module.css";
import { CheckinForm } from "../../forms";

export const metadata: Metadata = { title: "Are you still here?", robots: { index: false } };

/**
 * Reminder links land here. Checking in takes a tap on a button rather than
 * happening on page load, so email scanners that open links can't check
 * someone in by accident.
 */
export default async function CheckinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = Boolean(await peekToken(token, "check_in")) || Boolean(await currentUser());
  return (
    <>
      <div className={styles.intro}>
        <h1 className={styles.title}>Are you still here?</h1>
        <p>One tap and we&rsquo;ll stop the reminders and start your clock again.</p>
      </div>
      <section className={styles.box} aria-label="Check in">
        {valid ? (
          <CheckinForm token={token} />
        ) : (
          <div className={styles.form}>
            <p className="notice notice-alarm">This link has expired or was already used. Logging in counts as a check-in too.</p>
            <Link href="/login" className="btn">
              Log in to check in
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
