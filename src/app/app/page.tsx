import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { checkIns } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { clockView, getSwitch, rhythmOf } from "@/lib/clock";
import { firstName, formatWhen, postmarkParts, relative } from "@/lib/format";
import { capacity } from "@/lib/pricing";
import { letterCounts, listLetters, listRecipients } from "@/lib/queries";
import { describeRhythm, formatDuration, STAGE } from "@/lib/schedule";
import styles from "./app.module.css";
import { ClockPanel, StartClockForm, StopClock, TakeBack } from "./today";

const METHOD: Record<string, string> = {
  login: "Logged in",
  button: "Tapped “I’m still here”",
  link: "From a reminder",
  armed: "Started the clock",
};

export default async function TodayPage() {
  const user = await requireUser();
  const [sw, people, letters, register] = await Promise.all([
    getSwitch(user.id),
    listRecipients(user.id),
    listLetters(user.id),
    db.select().from(checkIns).where(eq(checkIns.userId, user.id)).orderBy(desc(checkIns.at)).limit(6),
  ]);
  const tz = user.timezone;
  const counts = letterCounts(people, letters);
  const withoutLetters = people.filter((p) => (counts.get(p.id) ?? 0) === 0);
  const view = clockView(sw);
  const now = new Date();
  const last = { ...postmarkParts(sw.lastCheckInAt, tz), iso: sw.lastCheckInAt.toISOString() };
  const releaseAt = sw.stage >= STAGE.finalWarning && sw.nextActionAt ? sw.nextActionAt : view.releaseAt;
  const nextMoment = view.overdue ? releaseAt : view.dueAt;

  return (
    <>
      <div>
        <h1 className={styles.pageTitle}>Hello, {firstName(user.name)}</h1>
      </div>

      {sw.status === "released" ? (
        <section className={`${styles.clock} ${styles.alarm} ${styles.released}`} aria-labelledby="released-title">
          <div className={styles.clockText}>
            <h2 className={styles.dueLabel} id="released-title">
              Your letters were sent on
            </h2>
            <p className={styles.due}>{sw.releasedAt ? formatWhen(sw.releasedAt, tz) : "—"}</p>
            <p className={styles.small}>
              We hadn&rsquo;t heard from you since {formatWhen(sw.lastCheckInAt, tz)}. If you&rsquo;re all right, you can
              close the links so nobody can open the letters.
            </p>
          </div>
          <div className={styles.clockAction}>
            <TakeBack />
          </div>
        </section>
      ) : sw.status === "armed" ? (
        <>
          <ClockPanel
            last={last}
            due={formatWhen(nextMoment, tz)}
            dueLabel={view.overdue ? "You missed a check-in. Your letters go out on" : "Check in again by"}
            dueRelative={relative(nextMoment, now)}
            meta={`${describeRhythm(rhythmOf(sw))}. If you miss one, we chase you for ${formatDuration(view.graceMs)} before sending anything.`}
            alarm={view.overdue}
          />
          <p className={styles.small}>
            <Link href="/app/settings#rhythm">Change how often</Link>
            <span aria-hidden="true"> · </span>
            <StopClock />
          </p>
        </>
      ) : (
        <section className={styles.section} aria-labelledby="setup-title">
          <div>
            <h2 className={styles.sectionTitle} id="setup-title">
              Your clock isn&rsquo;t running yet
            </h2>
            <p className={styles.pageLede}>
              Nothing is sent to anyone until it is. Here&rsquo;s what&rsquo;s left to do:
            </p>
          </div>
          <ol className={styles.steps}>
            <li className={user.emailVerifiedAt ? `${styles.step} ${styles.stepDone}` : styles.step}>
              <span className={styles.stepTitle}>Confirm your email</span>
              <span className={styles.stepBody}>
                {user.emailVerifiedAt ? "Done. Reminders will reach you." : `We sent a link to ${user.email}.`}
              </span>
            </li>
            <li className={people.length ? `${styles.step} ${styles.stepDone}` : styles.step}>
              <span className={styles.stepTitle}>Add the people who should hear from you</span>
              <span className={styles.stepBody}>
                {people.length ? `${people.length} added.` : "Their email or phone, nothing else."}
                <Link href={people.length ? "/app/people" : "/app/people/new"}>{people.length ? "See people" : "Add someone"}</Link>
              </span>
            </li>
            <li className={letters.length ? `${styles.step} ${styles.stepDone}` : styles.step}>
              <span className={styles.stepTitle}>Write a letter</span>
              <span className={styles.stepBody}>
                {letters.length ? `${letters.length} written.` : "One for everyone, or one for each person."}
                <Link href={letters.length ? "/app/letters" : "/app/letters/new"}>{letters.length ? "See letters" : "Start writing"}</Link>
              </span>
            </li>
            <li className={styles.step}>
              <span className={styles.stepTitle}>Choose your rhythm and start the clock</span>
              <span className={styles.stepBody}>From then on, we&rsquo;ll ask now and then whether you&rsquo;re still here.</span>
            </li>
          </ol>
          <div className={styles.sheet}>
            <StartClockForm rhythm={rhythmOf(sw)} ready={people.length > 0 && letters.length > 0} verified={Boolean(user.emailVerifiedAt)} />
          </div>
        </section>
      )}

      <div className={styles.split}>
        <section className={styles.section} aria-labelledby="who-title">
          <h2 className={styles.sectionTitle} id="who-title">
            Who hears from you
          </h2>
          {people.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Nobody yet.</p>
              <p className={styles.muted}>Add the first person. You can write their letter straight after.</p>
              <Link href="/app/people/new" className="btn">
                Add someone
              </Link>
            </div>
          ) : (
            <ul className={styles.rows}>
              {people.map((p) => {
                const n = counts.get(p.id) ?? 0;
                return (
                  <li key={p.id} className={styles.row}>
                    <div className={styles.rowMain}>
                      <Link href={`/app/people/${p.id}`} className={styles.rowTitle}>
                        {p.name}
                      </Link>
                      <span className={styles.rowMeta}>
                        {p.relation ? <span>{p.relation}</span> : null}
                        {n ? <span>{n === 1 ? "1 letter" : `${n} letters`}</span> : <span className={styles.warn}>No letter yet</span>}
                      </span>
                    </div>
                    {n === 0 ? (
                      <Link href={`/app/letters/new?for=${p.id}`} className="btn btn-small btn-quiet">
                        Write to {firstName(p.name)}
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          <p className={styles.small}>
            {people.length} of {capacity(user.extraSlots)} places used.{" "}
            {withoutLetters.length > 0 && people.length > 0
              ? `${withoutLetters.length === 1 ? "One person has" : `${withoutLetters.length} people have`} no letter, so nothing would be sent to them.`
              : null}
          </p>
        </section>

        <section className={styles.section} aria-labelledby="register-title">
          <h2 className={styles.sectionTitle} id="register-title">
            Recent check-ins
          </h2>
          {register.length === 0 ? (
            <p className={styles.muted}>None yet. Starting the clock counts as your first.</p>
          ) : (
            <table className={styles.register}>
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">How</th>
                </tr>
              </thead>
              <tbody>
                {register.map((c) => (
                  <tr key={c.id}>
                    <td className="num">{formatWhen(c.at, tz)}</td>
                    <td>{METHOD[c.method] ?? c.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
