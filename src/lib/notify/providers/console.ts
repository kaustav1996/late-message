import type { Channel } from "@/db/schema";
import type { ChannelProvider, OutboundMessage, SendResult } from "../types";
import { randomToken } from "@/lib/crypto";

/** Development provider: prints the message instead of sending it. */
export class ConsoleProvider implements ChannelProvider {
  readonly name = "console";
  constructor(readonly channel: Channel) {}

  async send(message: OutboundMessage): Promise<SendResult> {
    const rule = "─".repeat(60);
    console.info(
      `\n${rule}\n[${this.channel}] to ${message.to}\n${this.channel === "email" ? `Subject: ${message.subject}\n\n` : ""}${message.text}\n${rule}`,
    );
    return { providerId: `console_${randomToken(6)}` };
  }
}
