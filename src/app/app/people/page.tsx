import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, Smartphone } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { firstName } from "@/lib/format";
import { paymentsConfigured } from "@/lib/payments/dodo";
import { capacity, FREE_RECIPIENTS, PACK_PRICE_INR, PACK_SIZE } from "@/lib/pricing";
import { letterCounts, listLetters, listRecipients } from "@/lib/queries";
import styles from "../app.module.css";
import { BuyPacks } from "./buy-packs";

export const metadata: Metadata = { title: "People" };

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ paid?: string; saved?: string }> }) {
  const user = await requireUser();
  const { paid, saved } = await searchParams;
  const [people, letters] = await Promise.all([listRecipients(user.id), listLetters(user.id)]);
  const counts = letterCounts(people, letters);
  const cap = capacity(user.extraSlots);
  const full = people.length >= cap;

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>People</h1>
          <p className={styles.pageLede}>The people who&rsquo;ll hear from you. They aren&rsquo;t told anything until the day it matters.</p>
        </div>
        {full ? null : (
          <Link href="/app/people/new" className="btn">
            Add someone
          </Link>
        )}
      </div>

      {paid ? (
        <p className="notice notice-ok" role="status">
          Thank you. Your new places appear here as soon as Dodo confirms the payment, usually within a minute.
        </p>
      ) : null}
      {saved ? (
        <p className="notice notice-ok" role="status">
          Saved. Nobody is contacted until the day it matters.
        </p>
      ) : null}

      <div className={styles.capacity}>
        <p className={styles.small}>
          <strong>
            {people.length} of {cap}
          </strong>{" "}
          places used
        </p>
        {cap <= 60 ? (
          <div className={styles.slots} aria-hidden="true">
            {Array.from({ length: cap }, (_, i) => (
              <span key={i} className={i < people.length ? `${styles.slot} ${styles.slotUsed}` : styles.slot} />
            ))}
          </div>
        ) : null}
      </div>

      {people.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Who would you want to hear from you?</p>
          <p className={styles.muted}>
            Start with one person. You&rsquo;ll need their email or phone number. Your first {FREE_RECIPIENTS} places are free.
          </p>
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
                    {p.viaEmail && p.email ? (
                      <span>
                        <Mail aria-hidden="true" />
                        {p.email}
                      </span>
                    ) : null}
                    {p.viaWhatsapp && p.phone ? (
                      <span>
                        <MessageCircle aria-hidden="true" />
                        WhatsApp
                      </span>
                    ) : null}
                    {p.viaSms && p.phone ? (
                      <span>
                        <Smartphone aria-hidden="true" />
                        SMS
                      </span>
                    ) : null}
                    {n ? <span>{n === 1 ? "1 letter" : `${n} letters`}</span> : <span className={styles.warn}>No letter yet</span>}
                  </span>
                </div>
                {n === 0 ? (
                  <Link href={`/app/letters/new?for=${p.id}`} className="btn btn-small btn-quiet">
                    Write to {firstName(p.name)}
                  </Link>
                ) : (
                  <Link href={`/app/people/${p.id}`} className="btn btn-small btn-quiet">
                    Edit
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <section className={`${styles.section} ${styles.sheet}`} aria-labelledby="room-title">
        <h2 className={styles.sectionTitle} id="room-title">
          {full ? "You've used every place" : "Need room for more people?"}
        </h2>
        <p className={styles.muted}>
          Each pack adds {PACK_SIZE} places for ₹{PACK_PRICE_INR}, paid once through Dodo Payments. They&rsquo;re yours for good.
        </p>
        <BuyPacks enabled={paymentsConfigured()} />
      </section>
    </>
  );
}
