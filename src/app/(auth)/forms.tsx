"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { forgotPassword, login, resetPassword, signup, verifyEmail } from "@/app/actions/auth";
import { checkInWithToken } from "@/app/actions/app";
import { FieldError, FormMessage, invalid, SubmitButton } from "@/components/form-bits";
import { Postmark } from "@/components/postmark";
import { postmarkParts } from "@/lib/format";
import styles from "./auth.module.css";

export function SignupForm() {
  const [state, action] = useActionState(signup, null);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) setTimezone(tz);
  }, []);

  return (
    <form action={action} className={styles.form} noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="timezone" value={timezone} />
      <div className="field">
        <label htmlFor="name">Your name</label>
        <input id="name" name="name" className="input" autoComplete="name" required {...invalid(state, "name")} />
        <p className="hint">It&rsquo;s how your letters will be signed off when they&rsquo;re delivered.</p>
        <FieldError state={state} name="name" />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" inputMode="email" required {...invalid(state, "email")} />
        <FieldError state={state} name="email" />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" autoComplete="new-password" minLength={10} required {...invalid(state, "password")} />
        <p className="hint">At least 10 characters.</p>
        <FieldError state={state} name="password" />
      </div>
      <div className={styles.actions}>
        <SubmitButton pending="Opening your account…">Open my account</SubmitButton>
        <p className={styles.small}>
          Already have one? <Link href="/login">Log in</Link>
        </p>
      </div>
    </form>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, null);
  return (
    <form action={action} className={styles.form} noValidate>
      <FormMessage state={state} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" inputMode="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      <div className={styles.actions}>
        <SubmitButton pending="Checking…">Log in and check in</SubmitButton>
        <p className={styles.small}>
          <Link href="/forgot">Forgot your password?</Link>
        </p>
      </div>
    </form>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState(forgotPassword, null);
  if (state?.done === "sent") {
    return (
      <p className="notice notice-ok" role="status">
        If there&rsquo;s an account for that email, a reset link is on its way. It works for one hour.
      </p>
    );
  }
  return (
    <form action={action} className={styles.form} noValidate>
      <FormMessage state={state} />
      <div className="field">
        <label htmlFor="email">The email you signed up with</label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" inputMode="email" required {...invalid(state, "email")} />
        <FieldError state={state} name="email" />
      </div>
      <div className={styles.actions}>
        <SubmitButton pending="Sending…">Send me a link</SubmitButton>
        <p className={styles.small}>
          <Link href="/login">Back to log in</Link>
        </p>
      </div>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, null);
  return (
    <form action={action} className={styles.form} noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      <div className="field">
        <label htmlFor="password">New password</label>
        <input id="password" name="password" type="password" className="input" autoComplete="new-password" minLength={10} required {...invalid(state, "password")} />
        <p className="hint">At least 10 characters. You&rsquo;ll be logged out everywhere else.</p>
        <FieldError state={state} name="password" />
      </div>
      <div className={styles.actions}>
        <SubmitButton pending="Saving…">Save and log in</SubmitButton>
      </div>
    </form>
  );
}

export function VerifyForm({ token }: { token: string }) {
  const [state, action] = useActionState(verifyEmail, null);
  if (state?.done === "confirmed") {
    return (
      <div className={styles.stamped}>
        <p className="notice notice-ok" role="status">
          Thank you. Your email is confirmed, so our reminders will reach you.
        </p>
        <Link href="/app" className="btn">
          Go to my letters
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className={styles.form}>
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      <div className={styles.actions}>
        <SubmitButton pending="Confirming…">Confirm my email</SubmitButton>
      </div>
    </form>
  );
}

export function CheckinForm({ token }: { token: string }) {
  const [state, action] = useActionState(checkInWithToken, null);
  if (state?.done === "checked-in") {
    const now = postmarkParts(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone);
    return (
      <div className={styles.stamped} role="status">
        <Postmark date={now.date} time={now.time} className={styles.postmark} title={`Checked in ${now.date} at ${now.time}`} />
        <p>Thank you. That&rsquo;s all we needed. The clock has started again from now.</p>
        <Link href="/app">See my next check-in</Link>
      </div>
    );
  }
  return (
    <form action={action} className={styles.form}>
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      <div className={styles.actions}>
        <SubmitButton className="btn btn-big" pending="Stamping…">
          Yes, I&rsquo;m still here
        </SubmitButton>
      </div>
    </form>
  );
}
