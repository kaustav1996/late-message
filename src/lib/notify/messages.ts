import type { Channel } from "@/db/schema";
import { firstName, formatDate, formatWhen } from "@/lib/format";
import type { OutboundMessage } from "./types";

/** A message before it is addressed. `smsText` is the short form for SMS and WhatsApp. */
type Rendered = Omit<OutboundMessage, "to"> & { smsText?: string };

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** A plain, on-brand email: inland-letter blue, indigo ink, one red rule. */
function emailHtml(paragraphs: string[], action?: { label: string; href: string }): string {
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px">${escapeHtml(p)}</p>`).join("");
  const button = action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(action.href)}" style="display:inline-block;background:#1f2b63;color:#f3f7fb;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600">${escapeHtml(action.label)}</a></p>
       <p style="margin:0 0 16px;font-size:13px;color:#3d4a7a">Or paste this link into your browser:<br><span style="word-break:break-all">${escapeHtml(action.href)}</span></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#cfdde9;padding:24px 12px">
  <div style="max-width:520px;margin:0 auto;background:#e8f0f6;border-top:4px solid #b3262d;padding:28px 24px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.55;color:#1f2b63">
    ${body}${button}
    <p style="margin:24px 0 0;font-family:'Anek Latin',Verdana,sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#3d4a7a">Keepsake</p>
  </div></body></html>`;
}

export type ReminderStage = "heads_up" | "missed" | "final_warning";

export function reminderMessage(
  stage: ReminderStage,
  ctx: { ownerName: string; dueAt: Date; releaseAt: Date; recipientCount: number; link: string; tz: string },
): Rendered {
  const name = firstName(ctx.ownerName);
  const due = formatWhen(ctx.dueAt, ctx.tz);
  const release = formatWhen(ctx.releaseAt, ctx.tz);
  const people = ctx.recipientCount === 1 ? "1 person" : `${ctx.recipientCount} people`;

  const copy: Record<ReminderStage, { subject: string; lines: string[]; sms: string }> = {
    heads_up: {
      subject: `Your check-in is due by ${due}`,
      lines: [
        `Hi ${name},`,
        `A small nudge from Keepsake: your next check-in is due by ${due}. One tap tells us you're still here.`,
        `If we don't hear from you, we'll keep trying until ${release}. After that, your letters go to ${people}.`,
      ],
      sms: `Keepsake: your check-in is due by ${due}. Tap to check in: ${ctx.link}`,
    },
    missed: {
      subject: "We haven't heard from you",
      lines: [
        `Hi ${name},`,
        `Your check-in was due ${due} and we haven't heard from you. If it's been a busy week, one tap sorts it out.`,
        `If we still haven't heard from you by ${release}, we will send your letters to ${people}.`,
      ],
      sms: `Keepsake: you missed your check-in. Your letters go to ${people} on ${release} unless you check in: ${ctx.link}`,
    },
    final_warning: {
      subject: `Last reminder: your letters go out ${release}`,
      lines: [
        `${name}, this is the last reminder.`,
        `Unless you check in, we will send your letters to ${people} on ${release}. Once they are sent, they can't be unsent.`,
      ],
      sms: `Keepsake, last reminder: your letters go to ${people} on ${release}. Tap now to stop it: ${ctx.link}`,
    },
  };

  const c = copy[stage];
  return {
    key: "reminder",
    subject: c.subject,
    text: `${c.lines.join("\n\n")}\n\nCheck in: ${ctx.link}\n\nKeepsake`,
    html: emailHtml(c.lines, { label: "I'm still here", href: ctx.link }),
    templateVars: [name, stage === "heads_up" ? due : release, ctx.link],
    smsText: c.sms,
  };
}

export function releaseMessage(ctx: {
  recipientName: string;
  ownerName: string;
  lastCheckInAt: Date;
  letterCount: number;
  link: string;
  tz: string;
}): Rendered {
  const to = firstName(ctx.recipientName);
  const since = formatDate(ctx.lastCheckInAt, ctx.tz);
  const what = ctx.letterCount === 1 ? "a letter" : `${ctx.letterCount} letters`;
  const lines = [
    `Dear ${to},`,
    `${ctx.ownerName} asked us to get in touch with you if they ever stopped checking in with us. We haven't heard from them since ${since}.`,
    `They left ${what} for you. The link below is only for you, so please don't forward it.`,
  ];
  return {
    key: "release",
    subject: `${ctx.ownerName} left something for you`,
    text: `${lines.join("\n\n")}\n\n${ctx.link}\n\nKeepsake`,
    html: emailHtml(lines, { label: ctx.letterCount === 1 ? "Read the letter" : "Read the letters", href: ctx.link }),
    templateVars: [to, ctx.ownerName, ctx.link],
    smsText: `${to}, ${ctx.ownerName} left ${what} for you and asked Keepsake to send it if they stopped checking in. Read it here: ${ctx.link}`,
  };
}

export function releasedOwnerMessage(ctx: { ownerName: string; releasedAt: Date; recipientCount: number; link: string; tz: string }): Rendered {
  const people = ctx.recipientCount === 1 ? "1 person" : `${ctx.recipientCount} people`;
  const lines = [
    `Hi ${firstName(ctx.ownerName)},`,
    `We didn't hear from you, so on ${formatWhen(ctx.releasedAt, ctx.tz)} we sent your letters to ${people}.`,
    `If you're reading this and you're all right, log in. You can close the links so nobody can open the letters.`,
  ];
  return {
    key: "account",
    subject: "We've sent your letters",
    text: `${lines.join("\n\n")}\n\n${ctx.link}\n\nKeepsake`,
    html: emailHtml(lines, { label: "Log in to Keepsake", href: ctx.link }),
  };
}

export function verifyEmailMessage(ctx: { name: string; link: string }): Rendered {
  const lines = [
    `Hi ${firstName(ctx.name)},`,
    "Please confirm this is your email. It's how we reach you before anything is ever sent, so it has to work.",
    "The link works for 2 days.",
  ];
  return {
    key: "account",
    subject: "Confirm your email for Keepsake",
    text: `${lines.join("\n\n")}\n\n${ctx.link}`,
    html: emailHtml(lines, { label: "Confirm my email", href: ctx.link }),
  };
}

export function resetPasswordMessage(ctx: { name: string; link: string }): Rendered {
  const lines = [
    `Hi ${firstName(ctx.name)},`,
    "Someone asked to reset your Keepsake password. If it was you, use the link below. It works for one hour.",
    "If it wasn't you, ignore this email and nothing will change.",
  ];
  return {
    key: "account",
    subject: "Reset your Keepsake password",
    text: `${lines.join("\n\n")}\n\n${ctx.link}`,
    html: emailHtml(lines, { label: "Choose a new password", href: ctx.link }),
  };
}

/** SMS and WhatsApp get the short form; email gets the letter. */
export function forChannel(channel: Channel, to: string, m: Rendered): OutboundMessage {
  if (channel === "email") return { to, key: m.key, subject: m.subject, text: m.text, html: m.html };
  return { to, key: m.key, subject: m.subject, text: m.smsText ?? m.text, templateVars: m.templateVars };
}
