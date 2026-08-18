-- Replaces the free-text "session_length" booking field with a fixed set of
-- pricing tiers. session_length is left in place (unused going forward) so
-- no existing data is lost.
CREATE TYPE public.booking_type AS ENUM (
  'smaller_tattoo',
  'half_day',
  'whole_day',
  'multiple_days',
  'consultation'
);

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_type public.booking_type,
  ADD COLUMN IF NOT EXISTS payment_link_url text;
