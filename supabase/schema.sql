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
  warehouse_id text not null,
  synced_to_shopee boolean not null default false,
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
  full_name text not null default '',
  address text not null default '',
  contact_number text not null default '',
  updated_at timestamptz not null default now()
);

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

create policy "Users manage own categories" on public.categories
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own products" on public.products
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own transactions" on public.transactions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own profile" on public.profiles
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create unique index if not exists products_name_unique
  on public.products (user_id, lower(trim(name)));

create unique index if not exists categories_name_unique
  on public.categories (user_id, lower(trim(name)));

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
