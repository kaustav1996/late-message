import type { ChannelProvider, OutboundMessage, SendResult } from "../types";
import { ProviderNotConfiguredError } from "../types";

/** Email through Resend's REST API (https://resend.com/docs/api-reference/emails/send-email). */
export class ResendProvider implements ChannelProvider {
  readonly channel = "email" as const;
  readonly name = "resend";

  constructor(
    private readonly apiKey: string | undefined,
    private readonly from: string,
  ) {}

  async send(message: OutboundMessage): Promise<SendResult> {
    if (!this.apiKey) throw new ProviderNotConfiguredError("email", "RESEND_API_KEY is missing");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok || !data.id) throw new Error(`Resend ${res.status}: ${data.message ?? "unknown error"}`);
    return { providerId: data.id };
  }
}
