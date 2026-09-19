-- StockBase database schema
-- Run this file in the Supabase SQL Editor.
-- The statements are safe to run again after application updates.

-- ============================================================================
-- 1. Core inventory tables
-- ============================================================================

create table if not exists public.categories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  created_at timestamptz not null default now()
);

-- Products belong to one user and optionally reference a category.
create table if not exists public.products (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  product_code text not null,
  category_id text references public.categories(id) on delete set null,
  price numeric not null default 0,
  quantity numeric not null default 0,
  reorder_level numeric not null default 0,
  image text not null,
  physical_store boolean not null default true,
  shopee boolean not null default false,
  created_at timestamptz not null default now()
);

-- Rename the old SKU column when upgrading an older database.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'sku'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'product_code'
  ) then
    alter table public.products rename column sku to product_code;
  end if;
end $$;

-- Every stock change is recorded as a transaction.
create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  type text not null check (type in ('in', 'out', 'adjust')),
  quantity numeric not null,
  date timestamptz not null default now(),
  note text not null default ''
);

-- One profile is created for each authenticated administrator.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role = 'admin'),
  full_name text not null default '',
  address text not null default '',
  contact_number text not null default '',
  updated_at timestamptz not null default now()
);

-- Keep the profile role restricted to administrators.
alter table public.profiles add column if not exists role text not null default 'admin';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role = 'admin');

-- ============================================================================
-- 2. Authentication helpers
-- ============================================================================

create or replace function public.create_admin_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, role)
  values (new.id, 'admin')
  on conflict (user_id) do nothing;
  insert into public.operation_security (user_id, enabled)
  values (new.id, false)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_admin_profile();

insert into public.profiles (user_id, role)
select id, 'admin' from auth.users
on conflict (user_id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================================
-- 3. Row-level security
-- ============================================================================

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.transactions enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Public inventory access" on public.categories;
drop policy if exists "Public product access" on public.products;
drop policy if exists "Public transaction access" on public.transactions;
drop policy if exists "Users manage own categories" on public.categories;
drop policy if exists "Users manage own products" on public.products;
drop policy if exists "Users manage own transactions" on public.transactions;
drop policy if exists "Users read own categories" on public.categories;
drop policy if exists "Users read own products" on public.products;
drop policy if exists "Users read own transactions" on public.transactions;
drop policy if exists "Users manage own profile" on public.profiles;
drop policy if exists "Admins read own profile" on public.profiles;
drop policy if exists "Admins insert own profile" on public.profiles;
drop policy if exists "Admins update own profile" on public.profiles;

create policy "Users read own categories" on public.categories
  for select to authenticated using (public.is_admin() and auth.uid() = user_id);
create policy "Users read own products" on public.products
  for select to authenticated using (public.is_admin() and auth.uid() = user_id);
create policy "Users read own transactions" on public.transactions
  for select to authenticated using (public.is_admin() and auth.uid() = user_id);
create policy "Admins read own profile" on public.profiles
  for select to authenticated using (public.is_admin() and auth.uid() = user_id);
create policy "Admins insert own profile" on public.profiles
  for insert to authenticated with check (public.is_admin() and auth.uid() = user_id and role = 'admin');
create policy "Admins update own profile" on public.profiles
  for update to authenticated using (public.is_admin() and auth.uid() = user_id)
  with check (public.is_admin() and auth.uid() = user_id and role = 'admin');

-- Prevent duplicate names for the same user while allowing different users
-- to use the same product or category names.

-- ============================================================================
-- 4. Data integrity and compatibility migrations
-- ============================================================================

create unique index if not exists products_name_unique
  on public.products (user_id, lower(trim(name)));

create unique index if not exists categories_name_unique
  on public.categories (user_id, lower(trim(name)));

-- Rename legacy Shopee and warehouse columns when upgrading older databases.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'synced_to_shopee'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'shopee'
  ) then
    alter table public.products rename column synced_to_shopee to shopee;
  end if;
end $$;

alter table public.products
  alter column shopee set default false;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'warehouse_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'physical_store'
  ) then
    alter table public.products rename column warehouse_id to physical_store;
  end if;
end $$;

-- Normalize legacy warehouse values to the current boolean field.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products'
      and column_name = 'physical_store' and data_type <> 'boolean'
  ) then
    alter table public.products
      alter column physical_store drop default;
    alter table public.products
      alter column physical_store type boolean
      using lower(trim(physical_store::text)) in ('true', 'physical store', 'wh-1');
  end if;
end $$;

alter table public.products
  alter column physical_store set default true;

update public.products
set physical_store = true
where physical_store is distinct from true;

-- ============================================================================
-- 5. Realtime inventory updates
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'categories'
  ) then
    alter publication supabase_realtime add table public.categories;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'transactions'
  ) then
    alter publication supabase_realtime add table public.transactions;
  end if;
end $$;

-- ============================================================================
-- 6. Operation Security
-- ============================================================================
-- When enabled, inventory_mutation requires a short-lived authorization token
-- created by authorize_operation after the administrator's password is checked.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.operation_security (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.operation_authorizations (
  token uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null,
  expires_at timestamptz not null
);

insert into public.operation_security (user_id, enabled)
select id, false from auth.users
on conflict (user_id) do nothing;

alter table public.operation_security enable row level security;
alter table public.operation_authorizations enable row level security;

drop policy if exists "Users read own operation security" on public.operation_security;
create policy "Users read own operation security" on public.operation_security
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.authorize_operation(requested_operation text, admin_password text)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  stored_hash text;
  token uuid := gen_random_uuid();
begin
  select encrypted_password into stored_hash from auth.users where id = auth.uid();
  if stored_hash is null or stored_hash not like '$%' or crypt(admin_password, stored_hash) <> stored_hash then
    return null;
  end if;
  insert into public.operation_authorizations(token, user_id, operation, expires_at)
  values (token, auth.uid(), requested_operation, now() + interval '2 minutes');
  return token;
end;
$$;

-- Disabling Operation Security requires a matching security.disable token.
drop function if exists public.set_operation_security(boolean);
create or replace function public.set_operation_security(next_enabled boolean, authorization_token uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not next_enabled then
    delete from public.operation_authorizations
    where token = authorization_token
      and user_id = auth.uid()
      and operation = 'security.disable'
      and expires_at > now();
    if not found then raise exception 'Admin authorization required'; end if;
  end if;
  insert into public.operation_security(user_id, enabled, updated_at)
  values (auth.uid(), next_enabled, now())
  on conflict (user_id) do update set enabled = excluded.enabled, updated_at = excluded.updated_at;
end;
$$;

-- All remote inventory writes go through this function so the authorization
-- check cannot be bypassed by calling the tables directly from the client.
create or replace function public.inventory_mutation(operation text, payload jsonb, authorization_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  security_enabled boolean;
  authorization_count integer;
begin
  select coalesce(enabled, false) into security_enabled
  from public.operation_security where user_id = auth.uid();
  if security_enabled then
    delete from public.operation_authorizations
    where token = authorization_token and user_id = auth.uid()
      and operation = inventory_mutation.operation and expires_at > now();
    get diagnostics authorization_count = row_count;
    if authorization_count = 0 then raise exception 'Admin authorization required'; end if;
  end if;

  -- Product operations
  if operation = 'product.add' then
    insert into public.products (id, user_id, name, product_code, category_id, price, quantity, reorder_level, image, physical_store, shopee, created_at)
    values ((payload->>'id'), auth.uid(), payload->>'name', payload->>'product_code', payload->>'category_id',
      (payload->>'price')::numeric, (payload->>'quantity')::numeric, (payload->>'reorder_level')::numeric,
      payload->>'image', (payload->>'physical_store')::boolean, (payload->>'shopee')::boolean, (payload->>'created_at')::timestamptz);
  elsif operation = 'product.update' then
    update public.products set
      name = coalesce(payload->'patch'->>'name', name), product_code = coalesce(payload->'patch'->>'product_code', product_code),
      category_id = coalesce(payload->'patch'->>'category_id', category_id),
      price = coalesce((payload->'patch'->>'price')::numeric, price),
      quantity = coalesce((payload->'patch'->>'quantity')::numeric, quantity),
      reorder_level = coalesce((payload->'patch'->>'reorder_level')::numeric, reorder_level),
      image = coalesce(payload->'patch'->>'image', image),
      physical_store = coalesce((payload->'patch'->>'physical_store')::boolean, physical_store),
      shopee = coalesce((payload->'patch'->>'shopee')::boolean, shopee)
    where id = payload->>'id' and user_id = auth.uid();
  elsif operation = 'product.delete' then
    delete from public.products where id = payload->>'id' and user_id = auth.uid();
  -- Category operations
  elsif operation = 'category.add' then
    insert into public.categories (id, user_id, name, color, created_at)
    values (payload->>'id', auth.uid(), payload->>'name', payload->>'color', (payload->>'created_at')::timestamptz);
  elsif operation = 'category.update' then
    update public.categories set name = coalesce(payload->'patch'->>'name', name), color = coalesce(payload->'patch'->>'color', color)
    where id = payload->>'id' and user_id = auth.uid();
  elsif operation = 'category.delete' then
    delete from public.categories where id = payload->>'id' and user_id = auth.uid();
  -- Stock movement operation
  elsif operation = 'transaction.add' then
    update public.products set quantity = case
      when payload->>'type' = 'in' then quantity + (payload->>'quantity')::numeric
      when payload->>'type' = 'out' then greatest(0, quantity - (payload->>'quantity')::numeric)
      else (payload->>'quantity')::numeric end
    where id = payload->>'product_id' and user_id = auth.uid();
    insert into public.transactions (id, user_id, product_id, type, quantity, date, note)
    values (payload->>'id', auth.uid(), payload->>'product_id', payload->>'type', (payload->>'quantity')::numeric,
      (payload->>'date')::timestamptz, coalesce(payload->>'note', ''));
  -- Remove all inventory data for the current user.
  elsif operation = 'inventory.reset' then
    delete from public.transactions where user_id = auth.uid();
    delete from public.products where user_id = auth.uid();
    delete from public.categories where user_id = auth.uid();
  else
    raise exception 'Unsupported inventory operation';
  end if;
  return jsonb_build_object('ok', true);
end;
$$;
