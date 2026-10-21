"use client";

import { useActionState, useState } from "react";
import { buyPacks } from "@/app/actions/app";
import { FormMessage, SubmitButton } from "@/components/form-bits";
import { formatInr, MAX_PACKS_PER_PURCHASE, PACK_SIZE, priceForPacks } from "@/lib/pricing";
import styles from "../app.module.css";

export function BuyPacks({ enabled }: { enabled: boolean }) {
  const [state, action] = useActionState(buyPacks, null);
  const [packs, setPacks] = useState(1);
  return (
    <form action={action} className={styles.formActions}>
      <label className="field" style={{ width: "13rem" }}>
        <span className="label">Packs</span>
        <select name="packs" className="select" value={packs} onChange={(e) => setPacks(Number(e.target.value))}>
          {Array.from({ length: MAX_PACKS_PER_PURCHASE }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} ({n * PACK_SIZE} people)
            </option>
          ))}
        </select>
      </label>
      <SubmitButton pending="Opening payment…" disabled={!enabled}>
        Pay {formatInr(priceForPacks(packs))}
      </SubmitButton>
      {!enabled ? <p className={styles.small}>Payments aren&rsquo;t switched on yet.</p> : null}
      <FormMessage state={state} />
    </form>
  );
}
