import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { getSwitch, rhythmOf } from "@/lib/clock";
import { formatDate } from "@/lib/format";
import { channelEnabled } from "@/lib/notify";
import { formatInr } from "@/lib/pricing";
import styles from "../app.module.css";
import { DeleteAccountForm, PasswordForm, ProfileForm, RemindersForm, RhythmForm } from "./forms";

export const metadata: Metadata = { title: "Settings" };

const COMMON_ZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Kathmandu",
  "Asia/Dhaka",
  "Asia/Colombo",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Toronto",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
];

export default async function SettingsPage() {
  const user = await requireUser();
  const [sw, paid] = await Promise.all([
    getSwitch(user.id),
    db.select().from(payments).where(eq(payments.userId, user.id)).orderBy(desc(payments.createdAt)),
  ]);
  const zones = COMMON_ZONES.includes(user.timezone) ? COMMON_ZONES : [user.timezone, ...COMMON_ZONES];

  return (
    <>
      <div>
        <h1 className={styles.pageTitle}>Settings</h1>
      </div>

      <section id="rhythm" className={styles.section} aria-labelledby="rhythm-title">
        <h2 className={styles.sectionTitle} id="rhythm-title">
          Your rhythm
        </h2>
        {sw.status === "released" ? <p className="notice notice-alarm">Your letters have been sent. Close their links from Today first.</p> : null}
        <RhythmForm rhythm={rhythmOf(sw)} disabled={sw.status === "released"} />
      </section>

      <section className={styles.section} aria-labelledby="reminders-title">
        <h2 className={styles.sectionTitle} id="reminders-title">
          Reminders
        </h2>
        <RemindersForm
          email={user.email}
          phone={user.phone ?? ""}
          bySms={user.remindBySms}
          byWhatsapp={user.remindByWhatsapp}
          channels={{ sms: channelEnabled("sms"), whatsapp: channelEnabled("whatsapp") }}
        />
      </section>

      <section className={styles.section} aria-labelledby="profile-title">
        <h2 className={styles.sectionTitle} id="profile-title">
          You
        </h2>
        <ProfileForm name={user.name} timezone={user.timezone} zones={zones} />
      </section>

      <section className={styles.section} aria-labelledby="password-title">
        <h2 className={styles.sectionTitle} id="password-title">
          Password
        </h2>
        <PasswordForm />
      </section>

      <section className={styles.section} aria-labelledby="payments-title">
        <h2 className={styles.sectionTitle} id="payments-title">
          Payments
        </h2>
        {paid.length === 0 ? (
          <p className={styles.muted}>None yet. Your first 3 places are free.</p>
        ) : (
          <table className={styles.register}>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Places</th>
                <th scope="col">Amount</th>
              </tr>
            </thead>
            <tbody>
              {paid.map((p) => (
                <tr key={p.id}>
                  <td className="num">{formatDate(p.createdAt, user.timezone)}</td>
                  <td className="num">+{p.slots}</td>
                  <td className="num">{p.currency === "INR" ? formatInr(p.amount / 100) : `${(p.amount / 100).toFixed(2)} ${p.currency}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={`${styles.section} ${styles.danger}`} aria-labelledby="delete-title">
        <h2 className={styles.sectionTitle} id="delete-title">
          Delete your account
        </h2>
        <DeleteAccountForm />
      </section>
    </>
  );
}
