import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy</h1>
      <p className={styles.updated}>What Keepsake keeps, why, and who sees it.</p>

      <h2>What we store</h2>
      <ul>
        <li>Your name, email, password (hashed, never readable), phone number if you add one, and time zone.</li>
        <li>The names, emails and phone numbers of the people you add.</li>
        <li>Your letters, encrypted in our database.</li>
        <li>When you check in, and a record of every message we send for you.</li>
        <li>Payment records from Dodo Payments. We never see or store your card or UPI details.</li>
      </ul>

      <h2>Who can read your letters</h2>
      <p>
        Before release, only you, through your account. After release, each person you addressed can read only the letters
        meant for them, through their private link. Letters are encrypted at rest but are not end-to-end encrypted: our server
        decrypts a letter when it is shown to you or to its recipient.
      </p>

      <h2>Who we share data with</h2>
      <p>
        Only the services that deliver the product: our email provider, our SMS and WhatsApp provider, our database host, and
        Dodo Payments for purchases. We don&rsquo;t sell data or show advertising.
      </p>

      <h2>The people you add</h2>
      <p>
        We don&rsquo;t contact them before release. If they write to ask what we hold about them, we will tell them and remove
        it on request.
      </p>

      <h2>Deleting everything</h2>
      <p>You can delete your account from Settings at any time. It removes your people and letters immediately.</p>
    </>
  );
}
