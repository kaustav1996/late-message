"use client";

import { useActionState, useState } from "react";
import { checkInNow, startClock, stopClock, takeLettersBack } from "@/app/actions/app";
import { FormMessage, SubmitButton } from "@/components/form-bits";
import { Postmark } from "@/components/postmark";
import { RhythmFields } from "@/components/rhythm-fields";
import type { Rhythm } from "@/lib/schedule";
import styles from "./app.module.css";

type ClockProps = {
  last: { date: string; time: string; iso: string };
  due: string;
  dueRelative: string;
  dueLabel: string;
  meta: string;
  alarm: boolean;
};

export function ClockPanel({ last, due, dueRelative, dueLabel, meta, alarm }: ClockProps) {
  const [state, action] = useActionState(checkInNow, null);
  // Re-key the postmark so a fresh check-in stamps it again.
  const pressed = Boolean(state?.done);

  return (
    <section className={alarm ? `${styles.clock} ${styles.alarm}` : styles.clock} aria-labelledby="clock-title">
      <Postmark
        key={last.iso}
        date={last.date}
        time={last.time}
        className={pressed ? `${styles.clockMark} ${styles.pressed}` : styles.clockMark}
        title={`Last check-in ${last.date} at ${last.time}`}
      />
      <div className={styles.clockText}>
        <p className={styles.dueLabel} id="clock-title">
          {dueLabel}
        </p>
        <p className={styles.due}>{due}</p>
        <p className={styles.dueRelative}>{dueRelative}</p>
      </div>
      <form action={action} className={styles.clockAction}>
        <SubmitButton className="btn btn-big" pending="Stamping…">
          I&rsquo;m still here
        </SubmitButton>
        <p className={styles.clockMeta}>{meta}</p>
        <FormMessage state={state?.error ? state : null} />
      </form>
    </section>
  );
}

export function StartClockForm({ rhythm, ready, verified }: { rhythm: Rhythm; ready: boolean; verified: boolean }) {
  const [state, action] = useActionState(startClock, null);
  return (
    <form action={action} className={styles.form}>
      <RhythmFields current={rhythm} />
      <FormMessage state={state} />
      <div className={styles.formActions}>
        <SubmitButton className="btn btn-big" pending="Starting…" disabled={!verified}>
          Start the clock
        </SubmitButton>
        {!verified ? (
          <p className={styles.small}>Confirm your email first.</p>
        ) : !ready ? (
          <p className={styles.small}>You can start now and add people and letters later.</p>
        ) : null}
      </div>
    </form>
  );
}

export function StopClock() {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" className="link-button" onClick={() => setAsking(true)}>
        Stop the clock
      </button>
    );
  }
  return (
    <form action={stopClock} className={styles.formActions}>
      <span className={styles.small}>Nothing will be sent while it&rsquo;s stopped.</span>
      <SubmitButton className="btn btn-small btn-danger" pending="Stopping…">
        Yes, stop it
      </SubmitButton>
      <button type="button" className="link-button" onClick={() => setAsking(false)}>
        Keep it running
      </button>
    </form>
  );
}

export function TakeBack() {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" className="btn" onClick={() => setAsking(true)}>
        I&rsquo;m fine. Close the links
      </button>
    );
  }
  return (
    <form action={takeLettersBack} className={styles.formActions}>
      <span className={styles.small}>Nobody will be able to open your letters, and the clock goes back to stopped.</span>
      <SubmitButton className="btn btn-danger" pending="Closing…">
        Close every link
      </SubmitButton>
      <button type="button" className="link-button" onClick={() => setAsking(false)}>
        Cancel
      </button>
    </form>
  );
}
