"use client";

import { useActionState } from "react";
import { changePassword, deleteAccount, saveProfile, saveReminders, saveRhythm } from "@/app/actions/app";
import { FieldError, FormMessage, invalid, SubmitButton } from "@/components/form-bits";
import { RhythmFields } from "@/components/rhythm-fields";
import type { Rhythm } from "@/lib/schedule";
import styles from "../app.module.css";

export function RhythmForm({ rhythm, disabled }: { rhythm: Rhythm; disabled: boolean }) {
  const [state, action] = useActionState(saveRhythm, null);
  return (
    <form action={action} className={styles.form}>
      <RhythmFields current={rhythm} legend="Check in with me" />
      <FormMessage state={state} />
      <div className={styles.formActions}>
        <SubmitButton pending="Saving…" disabled={disabled}>
          Save rhythm
        </SubmitButton>
        <p className={styles.small}>Saving counts as a check-in.</p>
      </div>
    </form>
  );
}

export function RemindersForm({
  email,
  phone,
  bySms,
  byWhatsapp,
  channels,
}: {
  email: string;
  phone: string;
  bySms: boolean;
  byWhatsapp: boolean;
  channels: { sms: boolean; whatsapp: boolean };
}) {
  const [state, action] = useActionState(saveReminders, null);
  return (
    <form action={action} className={styles.form} noValidate>
      <p className={styles.muted}>
        Every reminder goes to <strong>{email}</strong>. Add your phone and we&rsquo;ll also text or WhatsApp you, which is much
        harder to miss.
      </p>
      <div className="field">
        <label htmlFor="phone">Your phone</label>
        <input id="phone" name="phone" type="tel" inputMode="tel" className="input" defaultValue={phone} placeholder="+91 98123 45678" {...invalid(state, "phone")} />
        <FieldError state={state} name="phone" />
      </div>
      <fieldset className={styles.fieldset}>
        <legend>Also remind me by</legend>
        <label className="check">
          <input type="checkbox" name="remindByWhatsapp" defaultChecked={byWhatsapp} disabled={!channels.whatsapp} />
          <span>WhatsApp {!channels.whatsapp ? <span className={styles.muted}>(not available yet)</span> : null}</span>
        </label>
        <label className="check">
          <input type="checkbox" name="remindBySms" defaultChecked={bySms} disabled={!channels.sms} />
          <span>SMS {!channels.sms ? <span className={styles.muted}>(not available yet)</span> : null}</span>
        </label>
      </fieldset>
      <FormMessage state={state} />
      <div className={styles.formActions}>
        <SubmitButton pending="Saving…">Save reminders</SubmitButton>
      </div>
    </form>
  );
}

export function ProfileForm({ name, timezone, zones }: { name: string; timezone: string; zones: string[] }) {
  const [state, action] = useActionState(saveProfile, null);
  return (
    <form action={action} className={styles.form} noValidate>
      <div className={styles.twoCol}>
        <div className="field">
          <label htmlFor="name">Your name</label>
          <input id="name" name="name" className="input" defaultValue={name} autoComplete="name" {...invalid(state, "name")} />
          <FieldError state={state} name="name" />
        </div>
        <div className="field">
          <label htmlFor="timezone">Time zone</label>
          <select id="timezone" name="timezone" className="select" defaultValue={timezone} {...invalid(state, "timezone")}>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <p className="hint">Reminders show times in this zone.</p>
          <FieldError state={state} name="timezone" />
        </div>
      </div>
      <FormMessage state={state} />
      <div className={styles.formActions}>
        <SubmitButton pending="Saving…">Save</SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, null);
  return (
    <form action={action} className={styles.form} noValidate>
      <div className={styles.twoCol}>
        <div className="field">
          <label htmlFor="current">Current password</label>
          <input id="current" name="current" type="password" className="input" autoComplete="current-password" {...invalid(state, "current")} />
          <FieldError state={state} name="current" />
        </div>
        <div className="field">
          <label htmlFor="next">New password</label>
          <input id="next" name="next" type="password" className="input" autoComplete="new-password" minLength={10} {...invalid(state, "next")} />
          <FieldError state={state} name="next" />
        </div>
      </div>
      <FormMessage state={state} />
      <div className={styles.formActions}>
        <SubmitButton pending="Saving…">Change password</SubmitButton>
      </div>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteAccount, null);
  return (
    <form action={action} className={styles.form} noValidate>
      <p className={styles.muted}>
        This deletes your account, your people and every letter, immediately. Nothing will ever be sent. There&rsquo;s no undo.
      </p>
      <div className="field" style={{ maxWidth: "20rem" }}>
        <label htmlFor="confirm">Type delete to confirm</label>
        <input id="confirm" name="confirm" className="input" autoComplete="off" {...invalid(state, "confirm")} />
        <FieldError state={state} name="confirm" />
      </div>
      <div className={styles.formActions}>
        <SubmitButton className="btn btn-danger" pending="Deleting…">
          Delete my account
        </SubmitButton>
      </div>
    </form>
  );
}
