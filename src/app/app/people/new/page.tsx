import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { channelEnabled } from "@/lib/notify";
import { capacity } from "@/lib/pricing";
import { countRecipients } from "@/lib/queries";
import styles from "../../app.module.css";
import { PersonForm } from "../person-form";

export const metadata: Metadata = { title: "Add someone" };

export default async function NewPersonPage() {
  const user = await requireUser();
  const full = (await countRecipients(user.id)) >= capacity(user.extraSlots);
  return (
    <>
      <div>
        <p className={styles.small}>
          <Link href="/app/people">People</Link>
        </p>
        <h1 className={styles.pageTitle}>Add someone</h1>
      </div>
      {full ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Every place is taken.</p>
          <p className={styles.muted}>Add a pack of 20 places to make room.</p>
          <Link href="/app/people#room-title" className="btn">
            Make room
          </Link>
        </div>
      ) : (
        <PersonForm channels={{ sms: channelEnabled("sms"), whatsapp: channelEnabled("whatsapp") }} />
      )}
    </>
  );
}
