import { z } from "zod";

const optional = z.string().trim().min(1).optional();

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_URL: z.string().url().default("http://localhost:3000"),
  // Signs session-independent tokens (recipient links). 32+ random characters.
  APP_SECRET: z.string().min(32, "APP_SECRET must be at least 32 characters"),
  // 32 bytes, base64. Encrypts letter bodies at rest.
  ENCRYPTION_KEY: z.string().min(1),
  CRON_SECRET: optional,

  EMAIL_PROVIDER: z.enum(["console", "resend"]).default("console"),
  EMAIL_FROM: z.string().default("Keepsake <letters@localhost>"),
  RESEND_API_KEY: optional,

  SMS_PROVIDER: z.enum(["console", "twilio", "none"]).default("console"),
  WHATSAPP_PROVIDER: z.enum(["console", "twilio", "none"]).default("console"),
  TWILIO_ACCOUNT_SID: optional,
  TWILIO_AUTH_TOKEN: optional,
  TWILIO_SMS_FROM: optional,
  TWILIO_MESSAGING_SERVICE_SID: optional,
  TWILIO_WHATSAPP_FROM: optional,
  // Twilio Content API template SIDs (HX...). WhatsApp only allows approved
  // templates for messages a person did not reply to in the last 24 hours.
  TWILIO_WA_TEMPLATE_REMINDER: optional,
  TWILIO_WA_TEMPLATE_RELEASE: optional,

  DODO_PAYMENTS_API_KEY: optional,
  DODO_PAYMENTS_WEBHOOK_KEY: optional,
  DODO_PAYMENTS_ENVIRONMENT: z.enum(["test_mode", "live_mode"]).default("test_mode"),
  DODO_PRODUCT_ID: optional,
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`Invalid environment: ${issues}`);
    }
    cached = parsed.data;
  }
  return cached;
}

export function appUrl(path = "/"): string {
  return new URL(path, env().APP_URL).toString();
}
