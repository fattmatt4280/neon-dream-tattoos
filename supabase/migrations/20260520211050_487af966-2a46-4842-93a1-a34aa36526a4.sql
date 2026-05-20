
-- Fix function search paths
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

-- Revoke execute on SECURITY DEFINER functions from public/authenticated
revoke execute on function public.has_role(uuid, app_role) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Tighten booking insert: prevent forging user_id for someone else
drop policy if exists "Bookings: public insert" on public.bookings;
create policy "Bookings: anon or self insert" on public.bookings
for insert with check (user_id is null or auth.uid() = user_id);
