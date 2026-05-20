
-- Roles enum & table
create type public.app_role as enum ('admin', 'user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique(user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Auto create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- Portfolio
create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text not null,
  tags text[] default '{}',
  featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger portfolio_items_updated before update on public.portfolio_items
for each row execute function public.set_updated_at();

-- Flash designs
create table public.flash_designs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text not null,
  price_cents int not null default 0,
  claimed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger flash_designs_updated before update on public.flash_designs
for each row execute function public.set_updated_at();

-- Merch
create type public.merch_type as enum ('print', 'sticker', 'apparel', 'other');
create table public.merch_products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text not null,
  price_cents int not null default 0,
  product_type merch_type not null default 'print',
  stock int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger merch_products_updated before update on public.merch_products
for each row execute function public.set_updated_at();

-- Bookings
create type public.booking_status as enum ('pending', 'confirmed', 'declined', 'completed');
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  client_name text not null,
  client_email text not null,
  phone text,
  concept text not null,
  size_estimate text,
  placement text,
  reference_urls text[] default '{}',
  preferred_date date,
  status booking_status not null default 'pending',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger bookings_updated before update on public.bookings
for each row execute function public.set_updated_at();

-- Orders (merch)
create type public.order_status as enum ('pending', 'paid', 'fulfilled', 'cancelled');
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  items jsonb not null,
  total_cents int not null,
  status order_status not null default 'pending',
  stripe_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger orders_updated before update on public.orders
for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.flash_designs enable row level security;
alter table public.merch_products enable row level security;
alter table public.bookings enable row level security;
alter table public.orders enable row level security;

-- profiles
create policy "Profiles: self select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Profiles: self update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Profiles: admin select all" on public.profiles for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- user_roles
create policy "Roles: self read" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "Roles: admin manage" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- portfolio (public read, admin write)
create policy "Portfolio: public read" on public.portfolio_items for select using (true);
create policy "Portfolio: admin write" on public.portfolio_items for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- flash
create policy "Flash: public read" on public.flash_designs for select using (true);
create policy "Flash: admin write" on public.flash_designs for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- merch
create policy "Merch: public read" on public.merch_products for select using (active = true or public.has_role(auth.uid(), 'admin'));
create policy "Merch: admin write" on public.merch_products for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- bookings
create policy "Bookings: public insert" on public.bookings for insert with check (true);
create policy "Bookings: own select" on public.bookings for select to authenticated using (auth.uid() = user_id);
create policy "Bookings: admin all" on public.bookings for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- orders
create policy "Orders: own select" on public.orders for select to authenticated using (auth.uid() = user_id);
create policy "Orders: admin all" on public.orders for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
