"use client";

import { useState } from "react";
import { formatDuration, timeline, type Rhythm } from "@/lib/schedule";
import styles from "./rhythm-demo.module.css";

const CHOICES: { label: string; rhythm: Rhythm }[] = [
  { label: "6 hours", rhythm: { unit: "hour", count: 6 } },
  { label: "12 hours", rhythm: { unit: "hour", count: 12 } },
  { label: "day", rhythm: { unit: "day", count: 1 } },
  { label: "week", rhythm: { unit: "week", count: 1 } },
  { label: "two weeks", rhythm: { unit: "week", count: 2 } },
  { label: "month", rhythm: { unit: "month", count: 1 } },
  { label: "3 months", rhythm: { unit: "month", count: 3 } },
];

// Monday 2 November 2026, 9:00 am in India.
const START = new Date("2026-11-02T03:30:00Z");

const when = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function fmt(d: Date) {
  return when.format(d).replace(/\b(am|pm)\b/i, (m) => m.toLowerCase());
}

export function RhythmDemo() {
  const [index, setIndex] = useState(3);
  const choice = CHOICES[index]!;
  const t = timeline(START, choice.rhythm);

  const stops = [
    { at: t.checkedInAt, title: "You check in", note: "One tap on a reminder, or logging in." },
    { at: t.headsUpAt, title: "We nudge you", note: "Email, plus SMS or WhatsApp if you turn them on." },
    { at: t.dueAt, title: "Your check-in is due", note: "Missed it? We tell you, kindly." },
    { at: t.finalWarningAt, title: "Last reminder", note: "Every channel, one more time." },
    { at: t.releaseAt, title: "Your letters go out", note: `${formatDuration(t.graceMs)} after it was due, if we still haven't heard from you.`, release: true },
  ];

  return (
    <div className={styles.demo}>
      <fieldset className={styles.choices}>
        <legend className={styles.legend}>I&rsquo;ll check in every</legend>
        <div className={styles.chips}>
          {CHOICES.map((c, i) => (
            <label key={c.label} className={styles.chip}>
              <input type="radio" name="demo-rhythm" checked={i === index} onChange={() => setIndex(i)} />
              <span>{c.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className={styles.caption}>If your last check-in was Monday at 9 in the morning and then you went quiet:</p>

      <ol className={styles.track} key={index} aria-live="polite">
        {stops.map((s, i) => (
          <li key={s.title} className={s.release ? `${styles.stop} ${styles.release}` : styles.stop} style={{ animationDelay: `${i * 70}ms` }}>
            <time className={styles.when} dateTime={s.at.toISOString()}>
              {fmt(s.at)}
            </time>
            <span className={styles.title}>{s.title}</span>
            <span className={styles.note}>{s.note}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
