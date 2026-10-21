# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router, TypeScript) + PostgreSQL, deployable to any Node host or Vercel with an external cron. Confirmed by the owner.

## Users

People who want the words they never got round to saying to reach the right people if something happens to them: a parent with passwords and policies only they know, someone living alone abroad, someone with a health scare, someone who just wants a last note to land. They use it on phones as much as laptops, mostly in short visits (a check-in tap) with occasional long sittings to write.

Second audience: the recipients. They open a link from WhatsApp, SMS, or email at the worst possible moment, often on a phone, and need to read what was left for them without friction or sales talk.

## Product Purpose

Keepsake is a dead man's switch for letters. The owner picks a check-in rhythm (every 6 hours, 12 hours, day, week, two weeks, month, or every N months), adds the people who should hear from them, and writes either a template letter that goes to several people or a personal letter to one person. If they stop checking in, Keepsake chases them first on their own channels, then sends each recipient a WhatsApp message, SMS, and/or email with a private link to the letters left for them.

Success: no letter is ever sent while the owner is alive and reachable, and every letter is delivered when they are not.

## Positioning

The check-in is the product. Keepsake is built around a rhythm the owner chooses, a visible clock, and an escalation that always warns them before it releases anything. Letters are delivered to the phone and inbox, where people in India actually read things (WhatsApp first).

## Operating Context

- Check-in happens by logging in, tapping "I'm still here" on the dashboard, or confirming from a reminder link.
- Reminders reach the owner by email, SMS, and WhatsApp before the deadline, at it, and once more before release.
- Recipients get a link, not the letter body, in the notification; the letter page is the product's most important screen for them.
- Payment is through Dodo Payments in INR.

## Capabilities and Constraints

- Free: 3 recipients. Paid: ₹20 one-time per pack of 20 more recipients, lasts forever (confirmed).
- Channels: email (Resend), SMS and WhatsApp through a pluggable provider interface (owner chose "decide later"; Twilio is the first adapter).
- Letters are encrypted at rest; recipients' links are unguessable and only exist after release.
- Built to be extended with more features later (owner's request); pricing and channels must stay easy to change.

## Brand Commitments

- Name: Keepsake (chosen by the owner).
- Owner's brief for the look: "artistic, humanly". Must not read as AI-generated; checked with impeccable's detector.

## Evidence on Hand

No testimonials, user counts, press, or partner logos exist. Do not invent any.

## Product Principles

1. Never release by accident: always warn, always wait, always let the owner stop it.
2. Write like a person: plain, warm, specific language; no dread, no hype.
3. The recipient's moment matters most: their page loads fast, reads well on a phone, and asks nothing of them.
4. Cheap and honest: the price is small and stated plainly.

## Accessibility & Inclusion

Readable on low-end Android phones and slow connections; WCAG AA contrast; works with screen readers; respects reduced motion. Recipients may be elderly.
