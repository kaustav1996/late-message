"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { saveLetter } from "@/app/actions/app";
import { FieldError, FormMessage, invalid, SubmitButton } from "@/components/form-bits";
import { PLACEHOLDERS, STARTERS } from "@/lib/letters";
import styles from "./letters.module.css";

type Person = { id: string; name: string };

type Props = {
  people: Person[];
  letter?: { id: string; title: string; kind: "personal" | "template"; body: string; toEveryone: boolean; recipientIds: string[] };
  preselect?: string;
};

export function LetterEditor({ people, letter, preselect }: Props) {
  const [state, action] = useActionState(saveLetter, null);
  const [kind, setKind] = useState<"personal" | "template">(letter?.kind ?? (preselect || people.length === 1 ? "personal" : "template"));
  const [title, setTitle] = useState(letter?.title ?? "");
  const [body, setBody] = useState(letter?.body ?? "");
  const [toEveryone, setToEveryone] = useState(letter?.toEveryone ?? !preselect);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const personId = letter?.kind === "personal" ? letter.recipientIds[0] : preselect;

  function insert(token: string) {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  function applyStarter(id: string) {
    const s = STARTERS.find((x) => x.id === id);
    if (!s) return;
    if (body.trim() && !window.confirm("Replace what you've written with this starting point?")) return;
    setTitle(s.title);
    setBody(s.body);
    if (s.kind === "personal" && people.length > 0) setKind("personal");
    if (s.kind === "template") setKind("template");
  }

  return (
    <form action={action} className={styles.editor} noValidate>
      {letter ? <input type="hidden" name="id" value={letter.id} /> : null}
      <input type="hidden" name="kind" value={kind} />
      <FormMessage state={state} />

      {!letter ? (
        <div className={styles.starters}>
          <span className={styles.startersLabel}>Not sure how to begin? Start from</span>
          {STARTERS.map((s) => (
            <button key={s.id} type="button" className={styles.starter} onClick={() => applyStarter(s.id)}>
              {s.title}
            </button>
          ))}
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="For Amma, about the house"
          {...invalid(state, "title")}
        />
        <p className="hint">The person sees this above your letter.</p>
        <FieldError state={state} name="title" />
      </div>

      <fieldset className={styles.kinds}>
        <legend className="label">Who is it for?</legend>
        <label className={styles.kind}>
          <input type="radio" name="kindChoice" checked={kind === "personal"} onChange={() => setKind("personal")} disabled={people.length === 0} />
          <span>
            <strong>One person</strong>
            <span className={styles.kindHint}>A personal letter, only they will read it.</span>
          </span>
        </label>
        <label className={styles.kind}>
          <input type="radio" name="kindChoice" checked={kind === "template"} onChange={() => setKind("template")} />
          <span>
            <strong>Several people</strong>
            <span className={styles.kindHint}>One letter, sent to each of them with their own name in it.</span>
          </span>
        </label>
      </fieldset>

      {kind === "personal" ? (
        <div className="field">
          <label htmlFor="personId">Addressed to</label>
          {people.length ? (
            <select id="personId" name="personId" className="select" defaultValue={personId ?? ""} {...invalid(state, "to")}>
              <option value="" disabled>
                Choose someone
              </option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="hint">
              <Link href="/app/people/new">Add someone</Link> first, then come back to write to them.
            </p>
          )}
          <FieldError state={state} name="to" />
        </div>
      ) : (
        <fieldset className={styles.people}>
          <legend className="label">Addressed to</legend>
          <label className="check">
            <input type="checkbox" name="toEveryone" checked={toEveryone} onChange={(e) => setToEveryone(e.target.checked)} />
            <span>Everyone, including people I add later</span>
          </label>
          {!toEveryone
            ? people.map((p) => (
                <label key={p.id} className="check">
                  <input type="checkbox" name="recipientIds" value={p.id} defaultChecked={letter?.recipientIds.includes(p.id)} />
                  <span>{p.name}</span>
                </label>
              ))
            : null}
          <FieldError state={state} name="to" />
        </fieldset>
      )}

      <div className="field">
        <div className={styles.bodyHead}>
          <label htmlFor="body">Your letter</label>
          <span className={styles.inserts}>
            {PLACEHOLDERS.map((p) => (
              <button key={p.token} type="button" className={styles.insert} onClick={() => insert(p.token)}>
                Insert {p.label}
              </button>
            ))}
          </span>
        </div>
        <textarea
          id="body"
          name="body"
          ref={bodyRef}
          className={styles.paper}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={kind === "template" ? "Dear {name}," : "Dear …"}
          rows={16}
          {...invalid(state, "body")}
        />
        <p className="hint">
          {"{name}"} becomes the reader&rsquo;s name and {"{my_name}"} becomes yours. Your letter is encrypted when you save it.
        </p>
        <FieldError state={state} name="body" />
      </div>

      <div className={styles.saveBar}>
        <SubmitButton pending="Saving…">{letter ? "Save changes" : "Save letter"}</SubmitButton>
        {letter ? <Link href={`/preview/${letter.id}`}>See it as they will</Link> : null}
      </div>
    </form>
  );
}
