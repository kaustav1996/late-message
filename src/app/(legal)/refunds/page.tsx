import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = { title: "Refunds" };

export default function RefundsPage() {
  return (
    <>
      <h1>Refunds</h1>
      <p className={styles.updated}>Packs are small and paid once, so the policy is simple.</p>
      <p>
        If you bought a pack by mistake, or Keepsake didn&rsquo;t work for you, ask for a refund within 14 days of buying it
        and we&rsquo;ll return the full amount through Dodo Payments. The extra places are removed when the refund is issued.
      </p>
      <p>To ask, reply to any email from Keepsake with the email address you used to pay.</p>
    </>
  );
}
