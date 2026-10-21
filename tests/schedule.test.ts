import { describe, expect, it } from "vitest";
import { addRhythm, isValidRhythm, nextStep, STAGE, timeline, type Rhythm } from "@/lib/schedule";

const H = 3600_000;
const D = 24 * H;
const start = new Date("2026-01-31T10:00:00Z");

describe("addRhythm", () => {
  it("adds hours, days and weeks exactly", () => {
    expect(addRhythm(start, { unit: "hour", count: 6 }).getTime() - start.getTime()).toBe(6 * H);
    expect(addRhythm(start, { unit: "day", count: 1 }).getTime() - start.getTime()).toBe(D);
    expect(addRhythm(start, { unit: "week", count: 2 }).getTime() - start.getTime()).toBe(14 * D);
  });

  it("clamps months to the end of shorter months", () => {
    expect(addRhythm(start, { unit: "month", count: 1 }).toISOString()).toBe("2026-02-28T10:00:00.000Z");
    expect(addRhythm(start, { unit: "month", count: 3 }).toISOString()).toBe("2026-04-30T10:00:00.000Z");
    expect(addRhythm(start, { unit: "month", count: 12 }).toISOString()).toBe("2027-01-31T10:00:00.000Z");
  });
});

describe("isValidRhythm", () => {
  it("accepts the offered choices and any month count up to 12", () => {
    expect(isValidRhythm({ unit: "hour", count: 6 })).toBe(true);
    expect(isValidRhythm({ unit: "hour", count: 12 })).toBe(true);
    expect(isValidRhythm({ unit: "week", count: 2 })).toBe(true);
    expect(isValidRhythm({ unit: "month", count: 7 })).toBe(true);
  });
  it("rejects anything else", () => {
    expect(isValidRhythm({ unit: "hour", count: 1 })).toBe(false);
    expect(isValidRhythm({ unit: "day", count: 3 })).toBe(false);
    expect(isValidRhythm({ unit: "month", count: 13 })).toBe(false);
    expect(isValidRhythm({ unit: "month", count: 0 })).toBe(false);
  });
});

describe("timeline", () => {
  it("gives a 6-hour rhythm a 3-hour grace", () => {
    const t = timeline(start, { unit: "hour", count: 6 });
    expect(t.headsUpAt.getTime() - start.getTime()).toBe(4.5 * H);
    expect(t.dueAt.getTime() - start.getTime()).toBe(6 * H);
    expect(t.releaseAt.getTime() - start.getTime()).toBe(9 * H);
    expect(t.finalWarningAt.getTime() - start.getTime()).toBe(8 * H);
  });

  it("caps grace at 14 days for long rhythms", () => {
    const t = timeline(start, { unit: "month", count: 6 });
    expect(t.releaseAt.getTime() - t.dueAt.getTime()).toBe(14 * D);
    expect(t.dueAt.getTime() - t.headsUpAt.getTime()).toBe(3 * D);
  });

  it("always orders the moments", () => {
    const rhythms: Rhythm[] = [
      { unit: "hour", count: 6 },
      { unit: "hour", count: 12 },
      { unit: "day", count: 1 },
      { unit: "week", count: 1 },
      { unit: "week", count: 2 },
      { unit: "month", count: 1 },
      { unit: "month", count: 12 },
    ];
    for (const r of rhythms) {
      const t = timeline(start, r);
      expect(t.headsUpAt < t.dueAt).toBe(true);
      expect(t.dueAt < t.finalWarningAt).toBe(true);
      expect(t.finalWarningAt < t.releaseAt).toBe(true);
    }
  });
});

describe("nextStep", () => {
  const weekly: Rhythm = { unit: "week", count: 1 };
  const t = timeline(start, weekly);
  const at = (d: Date, offsetMs = 0) => new Date(d.getTime() + offsetMs);
  const state = (stage: number, finalWarningAt: Date | null = null) => ({ stage, lastCheckInAt: start, finalWarningAt });

  it("waits quietly until the heads-up", () => {
    expect(nextStep(state(0), weekly, at(start, D))).toEqual({ type: "wait", until: t.headsUpAt });
  });

  it("walks heads-up → missed → final warning", () => {
    expect(nextStep(state(0), weekly, at(t.headsUpAt))).toEqual({ type: "advance", to: STAGE.headsUp, nextActionAt: t.dueAt });
    expect(nextStep(state(1), weekly, at(t.headsUpAt, H))).toEqual({ type: "wait", until: t.dueAt });
    expect(nextStep(state(1), weekly, at(t.dueAt))).toEqual({ type: "advance", to: STAGE.missed, nextActionAt: t.finalWarningAt });
    expect(nextStep(state(2), weekly, at(t.dueAt, H))).toEqual({ type: "wait", until: t.finalWarningAt });
    expect(nextStep(state(2), weekly, at(t.finalWarningAt))).toEqual({
      type: "advance",
      to: STAGE.finalWarning,
      nextActionAt: t.releaseAt,
    });
  });

  it("releases only after the final warning has had its time", () => {
    const warned = t.finalWarningAt;
    expect(nextStep(state(3, warned), weekly, at(t.releaseAt, -1))).toEqual({ type: "wait", until: t.releaseAt });
    expect(nextStep(state(3, warned), weekly, at(t.releaseAt))).toEqual({ type: "release" });
  });

  it("never releases straight from silence, even if the worker was down for weeks", () => {
    const late = at(t.releaseAt, 30 * D);
    const step = nextStep(state(0), weekly, late);
    expect(step).toEqual({ type: "advance", to: STAGE.finalWarning, nextActionAt: at(late, t.finalLeadMs) });
    // And after that warning, it still waits the full lead time.
    expect(nextStep(state(3, late), weekly, at(late, t.finalLeadMs - 1)).type).toBe("wait");
    expect(nextStep(state(3, late), weekly, at(late, t.finalLeadMs)).type).toBe("release");
  });

  it("skips stale reminders when it wakes up late", () => {
    expect(nextStep(state(0), weekly, at(t.dueAt, H))).toEqual({ type: "advance", to: STAGE.missed, nextActionAt: t.finalWarningAt });
  });
});
