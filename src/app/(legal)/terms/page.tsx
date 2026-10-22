import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <>
      <h1>Terms</h1>
      <p className={styles.updated}>The plain version of what you&rsquo;re agreeing to.</p>

      <h2>What Keepsake does</h2>
      <p>
        You write letters and choose people to receive them. You choose how often to check in. If you stop checking in, we
        remind you, and if you still don&rsquo;t respond within the grace period, we send your recipients a link to their
        letters by the channels you chose.
      </p>

      <h2>What it doesn&rsquo;t do</h2>
      <ul>
        <li>It isn&rsquo;t a will, and letters sent through it have no legal effect.</li>
        <li>We can&rsquo;t know why someone stopped checking in. A release means only that we didn&rsquo;t hear from you.</li>
        <li>
          Delivery depends on email, SMS and WhatsApp networks we don&rsquo;t control. We retry failed messages, but we
          can&rsquo;t guarantee that every message arrives.
        </li>
      </ul>

      <h2>Your part</h2>
      <ul>
        <li>Keep your email and phone up to date, so reminders reach you.</li>
        <li>Only add people you&rsquo;re comfortable contacting, and don&rsquo;t use Keepsake to send anything unlawful or abusive.</li>
      </ul>

      <h2>Payments</h2>
      <p>Packs of extra places are one-time purchases processed by Dodo Payments, our merchant of record.</p>
    </>
  );
}
