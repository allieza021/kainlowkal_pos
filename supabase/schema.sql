create extension if not exists "pgcrypto";

do $$ begin
  create type public.staff_role as enum ('admin', 'cashier');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_type as enum ('Dine In', 'Take Out', 'Pick Up', 'Delivery');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('Cash', 'GCash', 'Maya', 'MariBank', 'Bank Transfer', 'Other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('Paid', 'Unpaid');
exception when duplicate_object then null; end $$;

create table if not exists public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role public.staff_role not null default 'cashier',
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  price numeric(10,2) not null default 0,
  is_sold_out boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  price_modifier numeric(10,2) not null default 0,
  sort_order integer not null default 0
);

create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number integer not null unique default nextval('public.order_number_seq'),
  order_type public.order_type not null,
  customer_name text not null default 'Walk-in',
  customer_contact text,
  delivery_address text,
  delivery_fee numeric(10,2) not null default 0,
  subtotal numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  payment_method public.payment_method not null default 'Cash',
  payment_status public.payment_status not null default 'Unpaid',
  cashier_id uuid references public.staff_profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  variant_name text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null default 0,
  total_price numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at before update on public.products for each row execute function public.touch_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at before update on public.orders for each row execute function public.touch_updated_at();

drop trigger if exists trg_app_settings_updated_at on public.app_settings;
create trigger trg_app_settings_updated_at before update on public.app_settings for each row execute function public.touch_updated_at();

-- PostgREST connects as the anon/authenticated roles. Without table-level
-- privileges every request is rejected with "permission denied for table"
-- (SQLSTATE 42501) before row level security is even evaluated, which makes the
-- whole app appear frozen (no products load, orders/price edits silently fail).
-- RLS policies below restrict which rows each role may touch.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

alter table public.staff_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "authenticated read staff_profiles" on public.staff_profiles;
create policy "authenticated read staff_profiles" on public.staff_profiles for select to authenticated using (true);
create policy "authenticated write staff_profiles" on public.staff_profiles for insert to authenticated with check (true);
create policy "authenticated update staff_profiles" on public.staff_profiles for update to authenticated using (true) with check (true);
create policy "authenticated delete staff_profiles" on public.staff_profiles for delete to authenticated using (true);

drop policy if exists "authenticated read categories" on public.categories;
create policy "authenticated read categories" on public.categories for select to authenticated using (true);
create policy "authenticated write categories" on public.categories for insert to authenticated with check (true);
create policy "authenticated update categories" on public.categories for update to authenticated using (true) with check (true);
create policy "authenticated delete categories" on public.categories for delete to authenticated using (true);

drop policy if exists "authenticated read products" on public.products;
create policy "authenticated read products" on public.products for select to authenticated using (true);
create policy "authenticated write products" on public.products for insert to authenticated with check (true);
create policy "authenticated update products" on public.products for update to authenticated using (true) with check (true);
create policy "authenticated delete products" on public.products for delete to authenticated using (true);

drop policy if exists "authenticated read product_variants" on public.product_variants;
create policy "authenticated read product_variants" on public.product_variants for select to authenticated using (true);
create policy "authenticated write product_variants" on public.product_variants for insert to authenticated with check (true);
create policy "authenticated update product_variants" on public.product_variants for update to authenticated using (true) with check (true);
create policy "authenticated delete product_variants" on public.product_variants for delete to authenticated using (true);

drop policy if exists "authenticated read orders" on public.orders;
create policy "authenticated read orders" on public.orders for select to authenticated using (true);
create policy "authenticated write orders" on public.orders for insert to authenticated with check (true);
create policy "authenticated update orders" on public.orders for update to authenticated using (true) with check (true);
create policy "authenticated delete orders" on public.orders for delete to authenticated using (true);

drop policy if exists "authenticated read order_items" on public.order_items;
create policy "authenticated read order_items" on public.order_items for select to authenticated using (true);
create policy "authenticated write order_items" on public.order_items for insert to authenticated with check (true);
create policy "authenticated update order_items" on public.order_items for update to authenticated using (true) with check (true);
create policy "authenticated delete order_items" on public.order_items for delete to authenticated using (true);

drop policy if exists "authenticated read app_settings" on public.app_settings;
create policy "authenticated read app_settings" on public.app_settings for select to authenticated using (true);
create policy "authenticated write app_settings" on public.app_settings for insert to authenticated with check (true);
create policy "authenticated update app_settings" on public.app_settings for update to authenticated using (true) with check (true);
create policy "authenticated delete app_settings" on public.app_settings for delete to authenticated using (true);

insert into public.app_settings (key, value) values
  ('business_name', 'KAINLOWKAL'),
  ('tagline', 'Since 2019'),
  ('logo_url', ''),
  ('receipt_footer', 'This is an order slip only and not an official receipt.')
on conflict (key) do update set value = excluded.value;

