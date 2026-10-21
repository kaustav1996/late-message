"use client";

import { useState } from "react";
import { SubmitButton } from "./form-bits";

type Props = {
  action: (form: FormData) => Promise<void>;
  label: string;
  confirmLabel: string;
  question: string;
  fields?: Record<string, string>;
  className?: string;
};

/** A destructive action that asks once, in place, before it runs. */
export function ConfirmAction({ action, label, confirmLabel, question, fields = {}, className }: Props) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" className="btn btn-danger btn-small" onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  }
  return (
    <form action={action} className={className} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem 1.25rem" }}>
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <span role="alert">{question}</span>
      <SubmitButton className="btn btn-danger btn-small" pending="Working…">
        {confirmLabel}
      </SubmitButton>
      <button type="button" className="link-button" onClick={() => setAsking(false)}>
        Cancel
      </button>
    </form>
  );
}
