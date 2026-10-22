"use client";

import { useActionState } from "react";
import { savePerson } from "@/app/actions/app";
import { FieldError, FormMessage, invalid, SubmitButton } from "@/components/form-bits";
import type { Recipient } from "@/db/schema";
import styles from "../app.module.css";

type Props = {
  person?: Recipient;
  channels: { sms: boolean; whatsapp: boolean };
};

export function PersonForm({ person, channels }: Props) {
  const [state, action] = useActionState(savePerson, null);
  return (
    <form action={action} className={styles.form} noValidate>
      <FormMessage state={state} />
      {person ? <input type="hidden" name="id" value={person.id} /> : null}
      <div className={styles.twoCol}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" className="input" defaultValue={person?.name} autoComplete="off" required {...invalid(state, "name")} />
          <p className="hint">What you call them. A letter&rsquo;s &ldquo;Dear {"{name}"}&rdquo; uses this.</p>
          <FieldError state={state} name="name" />
        </div>
        <div className="field">
          <label htmlFor="relation">
            Who they are to you <span className={styles.muted}>(optional)</span>
          </label>
          <input id="relation" name="relation" className="input" defaultValue={person?.relation ?? ""} placeholder="Sister, old friend, my lawyer" autoComplete="off" />
          <p className="hint">Only you see this.</p>
        </div>
      </div>
      <div className={styles.twoCol}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" inputMode="email" className="input" defaultValue={person?.email ?? ""} autoComplete="off" {...invalid(state, "email")} />
          <FieldError state={state} name="email" />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" className="input" defaultValue={person?.phone ?? ""} placeholder="+91 98123 45678" autoComplete="off" {...invalid(state, "phone")} />
          <p className="hint">Indian numbers can skip the +91.</p>
          <FieldError state={state} name="phone" />
        </div>
      </div>
      <fieldset className={styles.fieldset}>
        <legend>How should we reach them?</legend>
        <label className="check">
          <input type="checkbox" name="viaEmail" defaultChecked={person ? person.viaEmail : true} />
          <span>Email</span>
        </label>
        <label className="check">
          <input type="checkbox" name="viaWhatsapp" defaultChecked={person?.viaWhatsapp ?? false} disabled={!channels.whatsapp} />
          <span>
            WhatsApp {!channels.whatsapp ? <span className={styles.muted}>(not available yet)</span> : null}
          </span>
        </label>
        <label className="check">
          <input type="checkbox" name="viaSms" defaultChecked={person?.viaSms ?? false} disabled={!channels.sms} />
          <span>SMS {!channels.sms ? <span className={styles.muted}>(not available yet)</span> : null}</span>
        </label>
        <p className="hint">We use every channel you tick, once, on the day. Nobody is contacted before then.</p>
        <FieldError state={state} name="channels" />
      </fieldset>
      <div className={styles.formActions}>
        <SubmitButton pending="Saving…">{person ? "Save changes" : "Add them"}</SubmitButton>
      </div>
    </form>
  );
}
