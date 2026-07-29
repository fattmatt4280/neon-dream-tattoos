
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS body_location text,
  ADD COLUMN IF NOT EXISTS session_length text,
  ADD COLUMN IF NOT EXISTS stripe_session_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS deposit_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_amount_cents integer;
