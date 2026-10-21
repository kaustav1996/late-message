import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const ts = (name: string) => timestamp(name, { withTimezone: true });

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    emailVerifiedAt: ts("email_verified_at"),
    // E.164, e.g. +919812345678. Used for SMS and WhatsApp reminders.
    phone: text("phone"),
    remindBySms: boolean("remind_by_sms").notNull().default(false),
    remindByWhatsapp: boolean("remind_by_whatsapp").notNull().default(false),
    timezone: text("timezone").notNull().default("Asia/Kolkata"),
    // Recipient slots bought on top of the free allowance.
    extraSlots: integer("extra_slots").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_email_idx").on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  "sessions",
  {
    // SHA-256 of the cookie token; the raw token is never stored.
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: ts("expires_at").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const tokenPurpose = pgEnum("token_purpose", ["verify_email", "reset_password", "check_in"]);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: text("id").primaryKey(), // SHA-256 of the token
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: tokenPurpose("purpose").notNull(),
    expiresAt: ts("expires_at").notNull(),
    usedAt: ts("used_at"),
    createdAt: createdAt(),
  },
  (t) => [index("auth_tokens_user_idx").on(t.userId, t.purpose)],
);

export const switchStatus = pgEnum("switch_status", ["draft", "armed", "released"]);
export const rhythmUnit = pgEnum("rhythm_unit", ["hour", "day", "week", "month"]);

/**
 * One per user: the check-in clock. `stage` walks 0 (quiet) → 1 (heads-up sent)
 * → 2 (missed, told) → 3 (final warning sent) → release. `nextActionAt` is when
 * the cron should look at this row again.
 */
export const switches = pgTable(
  "switches",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    status: switchStatus("status").notNull().default("draft"),
    rhythmUnit: rhythmUnit("rhythm_unit").notNull().default("week"),
    rhythmCount: integer("rhythm_count").notNull().default(1),
    lastCheckInAt: ts("last_check_in_at").notNull().defaultNow(),
    stage: integer("stage").notNull().default(0),
    nextActionAt: ts("next_action_at"),
    finalWarningAt: ts("final_warning_at"),
    releasedAt: ts("released_at"),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [index("switches_due_idx").on(t.status, t.nextActionAt)],
);

export const checkInMethod = pgEnum("check_in_method", ["login", "button", "link", "armed"]);

export const checkIns = pgTable(
  "check_ins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    method: checkInMethod("method").notNull(),
    at: ts("at").notNull().defaultNow(),
  },
  (t) => [index("check_ins_user_idx").on(t.userId, t.at)],
);

export const recipients = pgTable(
  "recipients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    relation: text("relation"),
    email: text("email"),
    phone: text("phone"),
    viaEmail: boolean("via_email").notNull().default(true),
    viaSms: boolean("via_sms").notNull().default(false),
    viaWhatsapp: boolean("via_whatsapp").notNull().default(false),
    // Set at release time: SHA-256 of the token in the recipient's link.
    accessTokenHash: text("access_token_hash"),
    firstOpenedAt: ts("first_opened_at"),
    createdAt: createdAt(),
  },
  (t) => [
    index("recipients_user_idx").on(t.userId),
    uniqueIndex("recipients_token_idx").on(t.accessTokenHash),
  ],
);

export const letterKind = pgEnum("letter_kind", ["personal", "template"]);

export const letters = pgTable(
  "letters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: letterKind("kind").notNull(),
    title: text("title").notNull(),
    // AES-256-GCM ciphertext, see lib/crypto.ts
    body: text("body").notNull(),
    // Templates only: also goes to everyone added later.
    toEveryone: boolean("to_everyone").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [index("letters_user_idx").on(t.userId)],
);

export const letterRecipients = pgTable(
  "letter_recipients",
  {
    letterId: uuid("letter_id")
      .notNull()
      .references(() => letters.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => recipients.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.letterId, t.recipientId] }), index("letter_recipients_recipient_idx").on(t.recipientId)],
);

export const channel = pgEnum("channel", ["email", "sms", "whatsapp"]);
export const deliveryKind = pgEnum("delivery_kind", [
  "heads_up",
  "missed",
  "final_warning",
  "released_owner",
  "release",
  "verify_email",
  "reset_password",
]);
export const deliveryStatus = pgEnum("delivery_status", ["pending", "sent", "failed"]);

/** Every message we send, so releases can be retried and audited. */
export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id").references(() => recipients.id, { onDelete: "cascade" }),
    kind: deliveryKind("kind").notNull(),
    channel: channel("channel").notNull(),
    destination: text("destination").notNull(),
    status: deliveryStatus("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: ts("next_attempt_at").notNull().defaultNow(),
    lastError: text("last_error"),
    providerId: text("provider_id"),
    sentAt: ts("sent_at"),
    createdAt: createdAt(),
  },
  (t) => [
    index("deliveries_pending_idx").on(t.status, t.nextAttemptAt),
    index("deliveries_user_idx").on(t.userId, t.createdAt),
    // One release message per recipient and channel for each release.
    uniqueIndex("deliveries_release_once_idx")
      .on(t.recipientId, t.channel, t.createdAt)
      .where(sql`kind = 'release'`),
  ],
);

export const payments = pgTable(
  "payments",
  {
    // Dodo payment_id
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    packs: integer("packs").notNull(),
    slots: integer("slots").notNull(),
    amount: integer("amount").notNull(), // smallest currency unit
    currency: text("currency").notNull(),
    raw: jsonb("raw"),
    createdAt: createdAt(),
  },
  (t) => [index("payments_user_idx").on(t.userId)],
);

export type User = typeof users.$inferSelect;
export type Switch = typeof switches.$inferSelect;
export type Recipient = typeof recipients.$inferSelect;
export type Letter = typeof letters.$inferSelect;
export type Delivery = typeof deliveries.$inferSelect;
export type Channel = (typeof channel.enumValues)[number];
export type DeliveryKind = (typeof deliveryKind.enumValues)[number];
export type RhythmUnit = (typeof rhythmUnit.enumValues)[number];
