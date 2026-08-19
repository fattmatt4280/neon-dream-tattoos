-- Bookings must stay insertable by anonymous visitors (no account required
-- to request a session), but Lovable's security scan flagged that with no
-- rate limiting, that open insert path could be used to spam the table with
-- garbage submissions carrying PII-shaped fields (email/phone). Add a
-- lightweight per-email rate limit rather than app-layer CAPTCHA, so the
-- public booking form stays frictionless for real clients.
--
-- SECURITY DEFINER is required here: anon has no SELECT grant on bookings
-- (by design -- "Bookings: own select" is authenticated-only), so a plain
-- trigger couldn't count existing rows for the incoming email without it.
-- This function is never exposed as a callable RPC, only fired by the
-- trigger below, so it doesn't widen anyone's actual privileges.
CREATE OR REPLACE FUNCTION public.check_booking_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    SELECT count(*) FROM public.bookings
    WHERE client_email = NEW.client_email
      AND created_at > now() - interval '1 hour'
  ) >= 5 THEN
    RAISE EXCEPTION 'Too many booking requests from this email recently -- please wait a bit and try again, or email us directly.'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.check_booking_rate_limit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS bookings_rate_limit ON public.bookings;
CREATE TRIGGER bookings_rate_limit
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.check_booking_rate_limit();
