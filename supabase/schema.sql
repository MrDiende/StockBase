create table if not exists public.categories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sku text not null,
  category_id text references public.categories(id) on delete set null,
  price numeric not null default 0,
  quantity numeric not null default 0,
  reorder_level numeric not null default 0,
  image text not null,
  physical_store boolean not null default true,
  shopee boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  type text not null check (type in ('in', 'out', 'adjust')),
  quantity numeric not null,
  date timestamptz not null default now(),
  note text not null default ''
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role = 'admin'),
  full_name text not null default '',
  address text not null default '',
  contact_number text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists role text not null default 'admin';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role = 'admin');

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
drop policy if exists "Users manage own profile" on public.profiles;
drop policy if exists "Admins read own profile" on public.profiles;
drop policy if exists "Admins insert own profile" on public.profiles;
drop policy if exists "Admins update own profile" on public.profiles;

create policy "Users manage own categories" on public.categories
  for all to authenticated using (public.is_admin() and auth.uid() = user_id) with check (public.is_admin() and auth.uid() = user_id);
create policy "Users manage own products" on public.products
  for all to authenticated using (public.is_admin() and auth.uid() = user_id) with check (public.is_admin() and auth.uid() = user_id);
create policy "Users manage own transactions" on public.transactions
  for all to authenticated using (public.is_admin() and auth.uid() = user_id) with check (public.is_admin() and auth.uid() = user_id);
create policy "Admins read own profile" on public.profiles
  for select to authenticated using (public.is_admin() and auth.uid() = user_id);
create policy "Admins insert own profile" on public.profiles
  for insert to authenticated with check (public.is_admin() and auth.uid() = user_id and role = 'admin');
create policy "Admins update own profile" on public.profiles
  for update to authenticated using (public.is_admin() and auth.uid() = user_id)
  with check (public.is_admin() and auth.uid() = user_id and role = 'admin');

create unique index if not exists products_name_unique
  on public.products (user_id, lower(trim(name)));

create unique index if not exists categories_name_unique
  on public.categories (user_id, lower(trim(name)));

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
