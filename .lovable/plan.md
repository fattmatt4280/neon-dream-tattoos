# Booking Deposits: Seamless Stripe on TanStack Start

You confirmed there's no actual merge — I'll build the deposit-payment booking flow from scratch on this project, using Lovable's Seamless Stripe (no API key needed) and TanStack server routes (no Supabase edge functions). Booking emails will go to **shyftd.ink@gmail.com**.

## Prereqs (before I can code)

1. **Resume Lovable Cloud.** The DB has been paused since the multi-image upload task. Migrations can't run until you resume it from the backend panel.
2. **Enable Seamless Stripe Payments.** I'll trigger the enable flow — you fill out the small form (business email/name). This provisions test-mode Stripe automatically. No `STRIPE_SECRET_KEY` needed from your other project; no manual webhook setup in a Stripe dashboard. Going live later is a separate verification step in the Payments panel.

## Schema changes (one migration)

Extend `bookings`:

- `body_location text`
- `session_length text`
- `stripe_session_id text` (unique, nullable)
- `deposit_paid boolean not null default false`
- `deposit_amount_cents integer`

Also: create a `deposit_price_cents` project setting (constant in code for now — e.g. $100 deposit). If you want tiered deposits by session length, tell me and I'll make it a small `deposit_tiers` table instead.

## New files

- `src/lib/booking.functions.ts` — `createBookingDraft` server fn: validates the intake (AI or manual), writes a `bookings` row with `deposit_paid=false`, returns the row id.
- `src/lib/checkout.functions.ts` — `startDepositCheckout` server fn: takes booking id, uses Seamless Stripe client to create a Checkout Session for the deposit, stores `stripe_session_id`, returns the redirect URL.
- `src/routes/api/public/stripe-webhook.ts` — TanStack server route. Verifies Seamless Stripe signature, handles `checkout.session.completed`, flips `deposit_paid=true`, fires the booking-notification email. Public prefix bypasses auth (Stripe calls it directly); signature verification is the gate.
- `src/lib/email.server.ts` + `src/lib/email.functions.ts` — sends the booking notification via **Lovable Emails** (built-in, no Resend key needed). Recipient hardcoded to `shyftd.ink@gmail.com`.
- `src/routes/book.success.tsx` + `src/routes/book.cancel.tsx` — Stripe redirect targets.

## Updated files

- `src/routes/book.tsx` — add tabs (AI intake / Manual intake), submit calls `createBookingDraft` then `startDepositCheckout` and redirects to Stripe.
- `src/routes/admin.tsx` — Bookings tab shows `deposit_paid` badge and new columns.

## Webhook URL (for your records)

Once deployed, Stripe (Seamless) points at:
`https://project--0522489c-3c64-4334-a7a1-fbe4146ef139.lovable.app/api/public/stripe-webhook`

You do NOT create this endpoint manually in a Stripe dashboard — Seamless Stripe registers it for you when the route deploys. If you later switch to bring-your-own-key Stripe, that changes; I'll only mention it if you ask.

## Emails

Using Lovable Emails means no `RESEND_API_KEY`. First send from a Lovable-managed domain requires the email-domain setup dialog — I'll surface it in the same turn I wire the email code, and you complete DNS at your registrar. Until then, notifications will queue and start delivering once the domain verifies.

If you'd rather use Resend with the same key as your other project, say so and I'll swap the email module — you'd then paste the key into the secure secret form (I can't copy it across projects).

## What I need from you to start

1. Resume Lovable Cloud.
2. Confirm: proceed with **Seamless Stripe** (I'll trigger the enable form), **Lovable Emails** (I'll trigger the domain setup dialog), and a **flat deposit amount** (default $100) — or tell me to make it tiered.
