import type { RhythmUnit } from "@/db/schema";

export type Rhythm = { unit: RhythmUnit; count: number };

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** The choices offered in the UI. "months" lets people pick any count. */
export const RHYTHM_PRESETS = [
  { id: "6h", label: "Every 6 hours", rhythm: { unit: "hour", count: 6 } },
  { id: "12h", label: "Every 12 hours", rhythm: { unit: "hour", count: 12 } },
  { id: "1d", label: "Every day", rhythm: { unit: "day", count: 1 } },
  { id: "1w", label: "Every week", rhythm: { unit: "week", count: 1 } },
  { id: "2w", label: "Every two weeks", rhythm: { unit: "week", count: 2 } },
  { id: "1m", label: "Every month", rhythm: { unit: "month", count: 1 } },
] as const satisfies ReadonlyArray<{ id: string; label: string; rhythm: Rhythm }>;

export const MAX_MONTHS = 12;

export function isValidRhythm(r: Rhythm): boolean {
  if (!Number.isInteger(r.count) || r.count < 1) return false;
  switch (r.unit) {
    case "hour":
      return r.count === 6 || r.count === 12;
    case "day":
      return r.count === 1;
    case "week":
      return r.count === 1 || r.count === 2;
    case "month":
      return r.count <= MAX_MONTHS;
  }
}

export function describeRhythm(r: Rhythm): string {
  const preset = RHYTHM_PRESETS.find((p) => p.rhythm.unit === r.unit && p.rhythm.count === r.count);
  if (preset) return preset.label;
  if (r.unit === "month") return `Every ${r.count} months`;
  return `Every ${r.count} ${r.unit}s`;
}

/** Short form for tight spaces: "6 hours", "week", "3 months". */
export function rhythmNoun(r: Rhythm): string {
  if (r.count === 1) return r.unit;
  if (r.unit === "week" && r.count === 2) return "two weeks";
  return `${r.count} ${r.unit}s`;
}

/** Calendar-aware: adding a month to 31 Jan lands on the last day of February. */
export function addRhythm(from: Date, r: Rhythm): Date {
  switch (r.unit) {
    case "hour":
      return new Date(from.getTime() + r.count * HOUR);
    case "day":
      return new Date(from.getTime() + r.count * DAY);
    case "week":
      return new Date(from.getTime() + r.count * 7 * DAY);
    case "month": {
      const d = new Date(from.getTime());
      const day = d.getUTCDate();
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() + r.count);
      const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
      d.setUTCDate(Math.min(day, lastDay));
      return d;
    }
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/**
 * Every moment the clock cares about after a check-in.
 *
 *   check-in ─── heads-up ─── due ─── final warning ─── release
 *
 * - heads-up: a quarter of the rhythm before it is due (1 hour to 3 days)
 * - grace: half the rhythm after it is due (3 hours to 14 days)
 * - final warning: a third of the grace before release (1 hour to 3 days)
 */
export type Timeline = {
  checkedInAt: Date;
  headsUpAt: Date;
  dueAt: Date;
  finalWarningAt: Date;
  releaseAt: Date;
  graceMs: number;
  finalLeadMs: number;
};

export function timeline(checkedInAt: Date, r: Rhythm): Timeline {
  const dueAt = addRhythm(checkedInAt, r);
  const span = dueAt.getTime() - checkedInAt.getTime();
  const graceMs = clamp(span / 2, 3 * HOUR, 14 * DAY);
  const headsUpLead = clamp(span / 4, HOUR, 3 * DAY);
  const finalLeadMs = clamp(graceMs / 3, HOUR, 3 * DAY);
  const releaseAt = new Date(dueAt.getTime() + graceMs);
  return {
    checkedInAt,
    headsUpAt: new Date(dueAt.getTime() - headsUpLead),
    dueAt,
    finalWarningAt: new Date(releaseAt.getTime() - finalLeadMs),
    releaseAt,
    graceMs,
    finalLeadMs,
  };
}

export const STAGE = { quiet: 0, headsUp: 1, missed: 2, finalWarning: 3 } as const;
export type Stage = (typeof STAGE)[keyof typeof STAGE];

export type Step =
  | { type: "wait"; until: Date }
  | { type: "advance"; to: Stage; nextActionAt: Date }
  | { type: "release" };

/**
 * Decides what the clock should do now. Pure, so it is easy to test.
 *
 * If the worker was down and several moments have passed, it jumps to the
 * latest one rather than sending a burst of stale reminders. It never jumps
 * straight to release: the final warning is always sent first, and release
 * waits at least `finalLeadMs` after it, whatever the timeline says.
 */
export function nextStep(
  state: { stage: number; lastCheckInAt: Date; finalWarningAt: Date | null },
  r: Rhythm,
  now: Date,
): Step {
  const t = timeline(state.lastCheckInAt, r);
  const n = now.getTime();

  if (state.stage >= STAGE.finalWarning) {
    const warnedAt = state.finalWarningAt ?? now;
    const earliest = Math.max(t.releaseAt.getTime(), warnedAt.getTime() + t.finalLeadMs);
    return n >= earliest ? { type: "release" } : { type: "wait", until: new Date(earliest) };
  }

  if (n >= t.finalWarningAt.getTime()) {
    const releaseAfter = Math.max(t.releaseAt.getTime(), n + t.finalLeadMs);
    return { type: "advance", to: STAGE.finalWarning, nextActionAt: new Date(releaseAfter) };
  }
  if (n >= t.dueAt.getTime() && state.stage < STAGE.missed) {
    return { type: "advance", to: STAGE.missed, nextActionAt: t.finalWarningAt };
  }
  if (n >= t.headsUpAt.getTime() && n < t.dueAt.getTime() && state.stage < STAGE.headsUp) {
    return { type: "advance", to: STAGE.headsUp, nextActionAt: t.dueAt };
  }

  const upcoming = [t.headsUpAt, t.dueAt, t.finalWarningAt].find(
    (d, i) => d.getTime() > n && i + 1 > state.stage,
  );
  return { type: "wait", until: upcoming ?? t.finalWarningAt };
}

/** Where a freshly checked-in clock should next be looked at. */
export function firstActionAt(checkedInAt: Date, r: Rhythm): Date {
  return timeline(checkedInAt, r).headsUpAt;
}

export function formatDuration(ms: number): string {
  const hours = Math.round(ms / HOUR);
  if (hours < 48) return hours === 1 ? "1 hour" : `${hours} hours`;
  const days = Math.round(ms / DAY);
  return days === 1 ? "1 day" : `${days} days`;
}
