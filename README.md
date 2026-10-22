# Keepsake

Letters for the people you love, sent only if you stop checking in.

People write letters, either a personal letter for one person or a template for several (`{name}` becomes each reader's name). They choose how often Keepsake should hear from them: every 6 hours, 12 hours, day, week, two weeks, month, or every 2–12 months. If they go quiet, Keepsake reminds them by email, SMS and WhatsApp. If there's still no answer after a final warning, each recipient gets a message with a private link to the letters meant for them.

The first 3 recipients are free. Each pack of 20 more costs ₹20, paid once through Dodo Payments.

## Stack

- Next.js 16 (App Router, server actions), React 19, TypeScript
- PostgreSQL with Drizzle ORM (`src/db/schema.ts`, migrations in `drizzle/`)
- Email through Resend; SMS and WhatsApp through a pluggable provider (Twilio adapter included)
- Payments through Dodo Payments (checkout sessions and Standard Webhooks)
- Plain CSS with design tokens (`src/app/globals.css`), self-hosted fonts (Anek, Kalam, Martel)

## Run it locally

```bash
npm install
cp .env.example .env.local     # then fill APP_SECRET and ENCRYPTION_KEY (commands are in the file)
createdb keepsake
npm run db:migrate
npm run dev                    # http://localhost:3000
npm run worker                 # in a second terminal: runs the clock every 60 seconds
```

With the default `console` providers, every email, SMS and WhatsApp message is printed in the terminal running `npm run dev` or the worker, including the email-confirmation and check-in links. Use those to test the whole flow without any accounts.

```bash
npm test          # unit tests plus the clock against a real Postgres (TEST_DATABASE_URL, default keepsake_test)
npm run typecheck
```

## How the clock works

Every check-in (logging in, tapping **I'm still here**, a reminder link, or changing the rhythm) restarts the clock. After that:

| Moment | When | What happens |
| --- | --- | --- |
| Heads-up | a quarter of the rhythm before it's due (1 hour to 3 days) | Reminder on every channel the owner turned on |
| Due | one rhythm after the last check-in | "We haven't heard from you" |
| Final warning | a third of the grace period before release (1 hour to 3 days) | "Last reminder" |
| Release | half a rhythm after it was due (3 hours to 14 days) | Each recipient with at least one letter gets their link; the owner gets an email |

For a weekly rhythm: nudge after about 5 days, due at 7, last reminder at about 9⅓, release at 10½.

Safeguards, all covered by tests in `tests/`:

- Release never happens straight from silence. The final warning always goes out first, and release waits at least the final-warning lead time after it, even if the worker was down for weeks.
- Every state change is a compare-and-set on the clock's stage and last check-in, so a check-in that lands mid-tick wins, and two workers running at once never send twice.
- Reminders are rendered when sent. A queued reminder that a check-in has made stale is dropped instead of sent.
- Failed messages are retried with backoff (1, 2, 4, 8, 16 minutes; 6 attempts).
- After a release, the owner can log in and close every link (**I'm fine. Close the links**).

The logic lives in `src/lib/schedule.ts` (pure timing rules), `src/lib/clock.ts` (check-ins) and `src/lib/tick.ts` (the worker).

### Running the clock in production

Something has to call the tick every few minutes:

- **Vercel**: `vercel.json` schedules `/api/cron/tick` every 5 minutes. Set `CRON_SECRET` and Vercel sends it automatically. Schedules more frequent than daily need a Pro plan; on Hobby, use an external cron instead.
- **Any external cron** (cron-job.org, GitHub Actions, a server's crontab): `curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://your-domain/api/cron/tick`
- **A server or VPS**: `npm run build && npm start`, plus `npm run worker` under systemd or pm2.

A 6-hour rhythm has a 3-hour grace period, so tick at least every 5–10 minutes.

## Messages

Pick providers with `EMAIL_PROVIDER`, `SMS_PROVIDER` and `WHATSAPP_PROVIDER` (`console`, `resend`/`twilio`, or `none` to switch a channel off). A channel set to `none` shows as unavailable in the app and is never used.

### Email (Resend)

Set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` and `EMAIL_FROM` with an address on a domain you've verified in Resend.

### SMS (Twilio)

Set `SMS_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and either `TWILIO_SMS_FROM` or `TWILIO_MESSAGING_SERVICE_SID`. Sending SMS to Indian numbers requires DLT registration of your sender ID and message templates; the SMS texts are in `src/lib/notify/messages.ts`.

### WhatsApp (Twilio)

WhatsApp only lets businesses message someone who hasn't written to them in the last 24 hours using pre-approved templates. Create two templates in Twilio's Content Template Builder, get them approved, and put their `HX...` SIDs in the env:

`TWILIO_WA_TEMPLATE_REMINDER`, with variables `{{1}}` the owner's first name, `{{2}}` the due or release time, and `{{3}}` the check-in link:

> Hi {{1}}, this is Keepsake. Please check in by {{2}} so we know you're all right: {{3}}

`TWILIO_WA_TEMPLATE_RELEASE`, with variables `{{1}}` the recipient's first name, `{{2}}` the owner's name, and `{{3}}` the letter link:

> Dear {{1}}, {{2}} left a letter for you with Keepsake, to be sent if we stopped hearing from {{2}}. Read it here: {{3}}

Without template SIDs the plain text is sent, which works only in the Twilio sandbox.

### Adding another provider

Implement `ChannelProvider` (`src/lib/notify/types.ts`) in `src/lib/notify/providers/` (for example MSG91, Gupshup, Meta's WhatsApp Cloud API, or Amazon SES), then add it to `providerFor()` in `src/lib/notify/index.ts`.

## Payments (Dodo Payments)

1. In the Dodo dashboard, create a **one-time** product priced at ₹20 named something like "20 more people". Put its ID in `DODO_PRODUCT_ID`.
2. Create an API key and set `DODO_PAYMENTS_API_KEY`. Use `DODO_PAYMENTS_ENVIRONMENT=test_mode` until you go live.
3. Add a webhook pointing at `https://your-domain/api/webhooks/dodo` for `payment.succeeded` and `refund.succeeded`, and put its signing secret in `DODO_PAYMENTS_WEBHOOK_KEY`.

Buying N packs opens a Dodo checkout with quantity N. When `payment.succeeded` arrives, the webhook is verified and the user gets `20 × quantity` places, counted from the paid cart rather than from metadata, and credited once per payment ID. A full refund removes the places again.

To change the price or pack size, edit `src/lib/pricing.ts` and the Dodo product.

## Security notes

- Letters are encrypted at rest with AES-256-GCM (`ENCRYPTION_KEY`). This is not end-to-end encryption: the server decrypts a letter when it is shown. Never change `ENCRYPTION_KEY` once letters exist, or they can't be read.
- Recipient links are 256-bit HMAC tokens; only their SHA-256 is stored, and they exist only after release.
- Sessions, password resets and check-in links store only token hashes. Passwords use scrypt.
- Reminder links need a tap on a button, so email scanners that open links can't check someone in.
- Login rate limiting is in-memory, so it's per instance. Behind several instances, move it to a shared store (`src/lib/rate-limit.ts`).

## Before going live

- Review `/privacy`, `/terms` and `/refunds` (`src/app/(legal)/`). They're plain-language drafts, and the refund window (14 days) is a placeholder for you to decide.
- Set `APP_URL` to the public URL: every link in every message is built from it.
- Change `EXAMPLE_HOST` in `src/app/page.tsx` to your domain; it's the host shown in the landing page's example message.
- Run `npm run db:migrate` against the production database.

## Design

The look is an India Post inland letter card: blue letter paper, indigo printing ink, red printed rules, a violet postmark for every check-in, and marigold stamps for the price. `PRODUCT.md` records product context and `DESIGN.md` records the design system.

It was built with [Impeccable](https://impeccable.style), whose skill is vendored in `.claude/skills/impeccable`. To check for AI-design tells after changing the UI:

```bash
npx impeccable detect http://localhost:3000/   # live pages, the full rule set
npx impeccable detect src/                     # source files, regex rules only
```

## Extending it

- New delivery channel: see "Adding another provider".
- New kinds of content (files, voice notes, photos): add a table next to `letters` and render it in `src/components/letter-view.tsx`, which is the recipient's page and the owner's preview.
- Trusted contacts who confirm before release, or a pause for holidays: add a stage to `nextStep()` in `src/lib/schedule.ts`; the tests in `tests/schedule.test.ts` describe the current rules.
