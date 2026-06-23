-- Trigger: first user to sign up gets admin, everyone after gets user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _role public.app_role;
begin
  select
    case when exists (select 1 from public.user_roles where role = 'admin')
      then 'user'::public.app_role
      else 'admin'::public.app_role
    end
  into _role;

  insert into public.user_roles (user_id, role)
  values (new.id, _role);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
