-- Support Stripe deposit-payment bookings (ported from fattmatt.me architecture)
alter table public.bookings
  add column body_location text,
  add column session_length text,
  add column stripe_session_id text unique,
  add column deposit_paid boolean not null default false;
