
-- V7.1: modelo de licença permanente + atualizações pagas
create table if not exists public.ai_products (
 id uuid primary key default gen_random_uuid(),
 code text unique not null,
 name text not null,
 version text not null,
 description text,
 price_cents integer not null default 0,
 active boolean not null default true,
 created_at timestamptz not null default now()
);

create table if not exists public.ai_purchases (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 product_id uuid not null references public.ai_products(id),
 provider text not null default 'mercadopago',
 provider_payment_id text,
 provider_preference_id text,
 status text not null default 'pending',
 amount_cents integer not null,
 purchased_at timestamptz,
 created_at timestamptz not null default now()
);

alter table public.ai_licenses
 add column if not exists product_id uuid references public.ai_products(id),
 add column if not exists licensed_version text,
 add column if not exists license_type text not null default 'perpetual',
 add column if not exists updates_included_until timestamptz;

create table if not exists public.ai_updates (
 id uuid primary key default gen_random_uuid(),
 from_version text not null,
 to_version text not null,
 name text not null,
 description text,
 price_cents integer not null,
 active boolean not null default true,
 created_at timestamptz not null default now()
);

insert into public.ai_products(code,name,version,description,price_cents)
values('assistant_v1','Assistente do Instrutor','1.0','Licença permanente da versão 1.0',5000)
on conflict(code) do update set price_cents=excluded.price_cents,active=true;

alter table public.ai_products enable row level security;
alter table public.ai_purchases enable row level security;
alter table public.ai_updates enable row level security;

drop policy if exists "public active products" on public.ai_products;
create policy "public active products" on public.ai_products for select using (active=true);

drop policy if exists "users own purchases" on public.ai_purchases;
create policy "users own purchases" on public.ai_purchases for select using (auth.uid()=user_id);

drop policy if exists "public active updates" on public.ai_updates;
create policy "public active updates" on public.ai_updates for select using (active=true);
