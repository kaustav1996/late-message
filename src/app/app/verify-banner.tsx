"use client";

import { useActionState } from "react";
import { resendVerification } from "@/app/actions/auth";
import styles from "./app.module.css";

export function VerifyBanner({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendVerification, null);
  return (
    <div className={styles.banner} role="note">
      <p>
        Please confirm <strong>{email}</strong>. Until you do, we can&rsquo;t be sure our reminders will reach you, so the clock
        can&rsquo;t start.
      </p>
      <form action={action}>
        {state?.ok || state?.error ? (
          <span className={styles.bannerResult}>{state.ok ?? state.error}</span>
        ) : (
          <button type="submit" className="btn btn-small btn-quiet" disabled={pending}>
            {pending ? "Sending…" : "Send the link again"}
          </button>
        )}
      </form>
    </div>
  );
}
