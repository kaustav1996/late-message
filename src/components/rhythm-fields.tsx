"use client";

import { useState } from "react";
import { MAX_MONTHS, RHYTHM_PRESETS, type Rhythm } from "@/lib/schedule";
import styles from "./rhythm-fields.module.css";

function initialChoice(r: Rhythm): { choice: string; months: number } {
  const preset = RHYTHM_PRESETS.find((p) => p.rhythm.unit === r.unit && p.rhythm.count === r.count);
  if (preset) return { choice: preset.id, months: 3 };
  if (r.unit === "month") return { choice: "months", months: r.count };
  return { choice: "1w", months: 3 };
}

const HINTS: Record<string, string> = {
  "6h": "For when someone should know within the day.",
  "12h": "Morning and night.",
  "1d": "A daily habit, like checking messages.",
  "1w": "Most people choose this.",
  "2w": "Fewer reminders, still close.",
  "1m": "Once a month, for the patient.",
};

export function RhythmFields({ current, legend = "How often should we hear from you?" }: { current: Rhythm; legend?: string }) {
  const start = initialChoice(current);
  const [choice, setChoice] = useState(start.choice);
  const [months, setMonths] = useState(start.months);

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {RHYTHM_PRESETS.map((p) => (
          <label key={p.id} className={styles.option}>
            <input type="radio" name="rhythm" value={p.id} checked={choice === p.id} onChange={() => setChoice(p.id)} />
            <span className={styles.optionText}>
              <span className={styles.optionLabel}>{p.label}</span>
              <span className={styles.optionHint}>{HINTS[p.id]}</span>
            </span>
          </label>
        ))}
        <label className={styles.option}>
          <input type="radio" name="rhythm" value="months" checked={choice === "months"} onChange={() => setChoice("months")} />
          <span className={styles.optionText}>
            <span className={styles.optionLabel}>
              Every{" "}
              <select
                name="months"
                className={styles.months}
                value={months}
                aria-label="Number of months"
                onChange={(e) => {
                  setMonths(Number(e.target.value));
                  setChoice("months");
                }}
              >
                {Array.from({ length: MAX_MONTHS - 1 }, (_, i) => i + 2).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>{" "}
              months
            </span>
            <span className={styles.optionHint}>For people who would rather be left alone.</span>
          </span>
        </label>
      </div>
    </fieldset>
  );
}
