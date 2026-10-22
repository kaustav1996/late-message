"use client";

import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/form";

export function SubmitButton({
  children,
  pending: pendingLabel,
  className = "btn",
  disabled,
}: {
  children: React.ReactNode;
  pending?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending || disabled} aria-busy={pending}>
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

export function FieldError({ state, name }: { state: FormState; name: string }) {
  const message = state?.fields?.[name];
  if (!message) return null;
  return (
    <p className="form-error" id={`${name}-error`} role="alert">
      {message}
    </p>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state?.error) {
    return (
      <p className="notice notice-alarm" role="alert">
        {state.error}
      </p>
    );
  }
  if (state?.ok) {
    return (
      <p className="notice notice-ok" role="status">
        {state.ok}
      </p>
    );
  }
  return null;
}

export function invalid(state: FormState, name: string) {
  return state?.fields?.[name]
    ? { "aria-invalid": true as const, "aria-describedby": `${name}-error` }
    : {};
}
