import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePerson } from "@/app/actions/app";
import { ConfirmAction } from "@/components/confirm-action";
import { db } from "@/db";
import { recipients } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { firstName } from "@/lib/format";
import { channelEnabled } from "@/lib/notify";
import { lettersFor } from "@/lib/queries";
import styles from "../../app.module.css";
import { PersonForm } from "../person-form";

export const metadata: Metadata = { title: "Edit person" };

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const person = await db.query.recipients.findFirst({ where: and(eq(recipients.id, id), eq(recipients.userId, user.id)) });
  if (!person) notFound();
  const theirs = await lettersFor(user.id, person.id);

  return (
    <>
      <div>
        <p className={styles.small}>
          <Link href="/app/people">People</Link>
        </p>
        <h1 className={styles.pageTitle}>{person.name}</h1>
        <p className={styles.pageLede}>
          {theirs.length === 0
            ? `${firstName(person.name)} has no letter yet, so nothing would be sent to them.`
            : `${firstName(person.name)} will receive ${theirs.length === 1 ? "1 letter" : `${theirs.length} letters`}: ${theirs.map((l) => l.title).join(", ")}.`}{" "}
          <Link href={`/app/letters/new?for=${person.id}`}>Write to {firstName(person.name)}</Link>
        </p>
      </div>
      <PersonForm person={person} channels={{ sms: channelEnabled("sms"), whatsapp: channelEnabled("whatsapp") }} />
      <div className={styles.danger}>
        <p className={styles.small}>Removing {firstName(person.name)} also deletes the personal letters written only to them.</p>
        <ConfirmAction
          action={deletePerson}
          fields={{ id: person.id }}
          label={`Remove ${firstName(person.name)}`}
          confirmLabel="Yes, remove"
          question={`Remove ${firstName(person.name)} and their personal letters?`}
        />
      </div>
    </>
  );
}
