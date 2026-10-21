import type { Channel } from "@/db/schema";
import { env } from "@/lib/env";
import { ConsoleProvider } from "./providers/console";
import { ResendProvider } from "./providers/resend";
import { TwilioSmsProvider, TwilioWhatsappProvider } from "./providers/twilio";
import type { ChannelProvider } from "./types";

export type { ChannelProvider, OutboundMessage, MessageKey } from "./types";

let overrides: Partial<Record<Channel, ChannelProvider | null>> = {};

/** Tests swap providers here. */
export function setProviderOverrides(next: Partial<Record<Channel, ChannelProvider | null>>) {
  overrides = next;
}

/**
 * The provider for a channel, or null when the channel is switched off.
 * To add a provider (MSG91, Meta Cloud API, SES...), implement ChannelProvider
 * in ./providers and add a case below.
 */
export function providerFor(channel: Channel): ChannelProvider | null {
  if (channel in overrides) return overrides[channel] ?? null;
  const e = env();
  const twilio = {
    accountSid: e.TWILIO_ACCOUNT_SID,
    authToken: e.TWILIO_AUTH_TOKEN,
    smsFrom: e.TWILIO_SMS_FROM,
    messagingServiceSid: e.TWILIO_MESSAGING_SERVICE_SID,
    whatsappFrom: e.TWILIO_WHATSAPP_FROM,
    whatsappTemplates: { reminder: e.TWILIO_WA_TEMPLATE_REMINDER, release: e.TWILIO_WA_TEMPLATE_RELEASE },
  };
  switch (channel) {
    case "email":
      return e.EMAIL_PROVIDER === "resend" ? new ResendProvider(e.RESEND_API_KEY, e.EMAIL_FROM) : new ConsoleProvider("email");
    case "sms":
      if (e.SMS_PROVIDER === "none") return null;
      return e.SMS_PROVIDER === "twilio" ? new TwilioSmsProvider(twilio) : new ConsoleProvider("sms");
    case "whatsapp":
      if (e.WHATSAPP_PROVIDER === "none") return null;
      return e.WHATSAPP_PROVIDER === "twilio" ? new TwilioWhatsappProvider(twilio) : new ConsoleProvider("whatsapp");
  }
}

export function channelEnabled(channel: Channel): boolean {
  return providerFor(channel) !== null;
}
