export const DEFAULT_TZ = "Asia/Kolkata";

function safeTz(tz: string | undefined): string {
  if (!tz) return DEFAULT_TZ;
  try {
    new Intl.DateTimeFormat("en-IN", { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TZ;
  }
}

/** "Tue 21 Oct, 9:40 pm" */
export function formatWhen(date: Date, tz?: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: safeTz(tz),
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .replace(/\b(am|pm)\b/i, (m) => m.toLowerCase());
}

/** "21 October 2026" */
export function formatDate(date: Date, tz?: string): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: safeTz(tz), day: "numeric", month: "long", year: "numeric" }).format(date);
}

/** Postmark parts: "21 OCT 26" and "21:40" */
export function postmarkParts(date: Date, tz?: string): { date: string; time: string } {
  const zone = safeTz(tz);
  const d = new Intl.DateTimeFormat("en-GB", { timeZone: zone, day: "2-digit", month: "short", year: "2-digit" })
    .format(date)
    .toUpperCase();
  const t = new Intl.DateTimeFormat("en-GB", { timeZone: zone, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  return { date: d, time: t };
}

/** "in 3 days", "in 5 hours", "2 hours ago" */
export function relative(date: Date, now = new Date()): string {
  const diff = date.getTime() - now.getTime();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (abs < hour) return rtf.format(Math.round(diff / minute), "minute");
  if (abs < 2 * day) return rtf.format(Math.round(diff / hour), "hour");
  return rtf.format(Math.round(diff / day), "day");
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** Light E.164 normalisation. Bare 10-digit numbers are taken as Indian. */
export function normalisePhone(input: string): string | null {
  const trimmed = input.replace(/[\s\-().]/g, "");
  if (!trimmed) return null;
  let digits = trimmed;
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (/^[6-9]\d{9}$/.test(digits)) digits = `+91${digits}`;
  if (/^0[6-9]\d{9}$/.test(digits)) digits = `+91${digits.slice(1)}`;
  if (!digits.startsWith("+")) digits = `+${digits}`;
  return /^\+[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

export function maskDestination(value: string): string {
  if (value.includes("@")) {
    const [user = "", domain = ""] = value.split("@");
    return `${user.slice(0, 2)}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
  }
  return `${value.slice(0, 3)}${"•".repeat(Math.max(1, value.length - 6))}${value.slice(-3)}`;
}
