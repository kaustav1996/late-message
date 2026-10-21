import type { Channel } from "@/db/schema";

/**
 * Which message is being sent. WhatsApp providers map these to pre-approved
 * templates; email and SMS use the rendered text.
 */
export type MessageKey = "reminder" | "release" | "account";

export type OutboundMessage = {
  to: string;
  key: MessageKey;
  subject: string;
  text: string;
  html?: string;
  /** Ordered values for a WhatsApp template's {{1}}, {{2}}, ... */
  templateVars?: string[];
};

export type SendResult = { providerId: string };

export interface ChannelProvider {
  readonly channel: Channel;
  readonly name: string;
  send(message: OutboundMessage): Promise<SendResult>;
}

export class ProviderNotConfiguredError extends Error {
  constructor(channel: Channel, detail: string) {
    super(`${channel} provider is not configured: ${detail}`);
  }
}
