import type { ChannelProvider, MessageKey, OutboundMessage, SendResult } from "../types";
import { ProviderNotConfiguredError } from "../types";

type TwilioConfig = {
  accountSid?: string;
  authToken?: string;
  smsFrom?: string;
  messagingServiceSid?: string;
  whatsappFrom?: string;
  whatsappTemplates: Partial<Record<MessageKey, string>>;
};

async function createMessage(cfg: TwilioConfig, params: Record<string, string>): Promise<SendResult> {
  const { accountSid, authToken } = cfg;
  if (!accountSid || !authToken) throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string; code?: number };
  if (!res.ok || !data.sid) throw new Error(`Twilio ${res.status}${data.code ? ` (${data.code})` : ""}: ${data.message ?? "unknown error"}`);
  return { providerId: data.sid };
}

export class TwilioSmsProvider implements ChannelProvider {
  readonly channel = "sms" as const;
  readonly name = "twilio";
  constructor(private readonly cfg: TwilioConfig) {}

  async send(message: OutboundMessage): Promise<SendResult> {
    const sender: Record<string, string> | null = this.cfg.messagingServiceSid
      ? { MessagingServiceSid: this.cfg.messagingServiceSid }
      : this.cfg.smsFrom
        ? { From: this.cfg.smsFrom }
        : null;
    if (!sender) throw new ProviderNotConfiguredError("sms", "set TWILIO_SMS_FROM or TWILIO_MESSAGING_SERVICE_SID");
    return createMessage(this.cfg, { To: message.to, Body: message.text, ...sender });
  }
}

/**
 * WhatsApp through Twilio. Messages to people who have not written to you in
 * the last 24 hours must use an approved template, so each message key maps
 * to a Content SID. Without one, the plain body is sent, which only works in
 * the Twilio sandbox or inside a 24-hour session.
 */
export class TwilioWhatsappProvider implements ChannelProvider {
  readonly channel = "whatsapp" as const;
  readonly name = "twilio";
  constructor(private readonly cfg: TwilioConfig) {}

  async send(message: OutboundMessage): Promise<SendResult> {
    if (!this.cfg.whatsappFrom) throw new ProviderNotConfiguredError("whatsapp", "TWILIO_WHATSAPP_FROM is missing");
    const from = this.cfg.whatsappFrom.startsWith("whatsapp:") ? this.cfg.whatsappFrom : `whatsapp:${this.cfg.whatsappFrom}`;
    const contentSid = this.cfg.whatsappTemplates[message.key];
    const params: Record<string, string> = { From: from, To: `whatsapp:${message.to}` };
    if (contentSid && message.templateVars) {
      params.ContentSid = contentSid;
      params.ContentVariables = JSON.stringify(
        Object.fromEntries(message.templateVars.map((v, i) => [String(i + 1), v])),
      );
    } else {
      params.Body = message.text;
    }
    return createMessage(this.cfg, params);
  }
}
