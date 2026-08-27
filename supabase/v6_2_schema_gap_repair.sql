-- ENAT Assistente do Instrutor V6.2 — reparo de lacunas de esquema
-- Idempotente. Execute no Supabase SQL Editor após as migrations V6/V6.1.

begin;

-- Veículos usados pelo fluxo de aulas e pelo cálculo operacional.
create table if not exists public.ai_vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand text not null,
  model text not null,
  model_year integer,
  plate text not null,
  fuel_type text,
  consumption_km_l numeric(10,2),
  current_km numeric(12,2),
  insurance_annual numeric(12,2) default 0,
  taxes_annual numeric(12,2) default 0,
  other_annual numeric(12,2) default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_vehicles_user_id
  on public.ai_vehicles(user_id);

alter table public.ai_vehicles enable row level security;

drop policy if exists "ai_vehicles_select_own" on public.ai_vehicles;
create policy "ai_vehicles_select_own"
  on public.ai_vehicles for select
  using (auth.uid() = user_id);

drop policy if exists "ai_vehicles_insert_own" on public.ai_vehicles;
create policy "ai_vehicles_insert_own"
  on public.ai_vehicles for insert
  with check (auth.uid() = user_id);

drop policy if exists "ai_vehicles_update_own" on public.ai_vehicles;
create policy "ai_vehicles_update_own"
  on public.ai_vehicles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "ai_vehicles_delete_own" on public.ai_vehicles;
create policy "ai_vehicles_delete_own"
  on public.ai_vehicles for delete
  using (auth.uid() = user_id);

-- Contas bancárias usadas pelo módulo financeiro.
create table if not exists public.ai_finance_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bank_name text not null,
  account_name text not null,
  account_type text not null default 'CORRENTE',
  agency text,
  account_number text,
  initial_balance numeric(14,2) not null default 0,
  status text not null default 'ATIVA',
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_finance_accounts_user_id
  on public.ai_finance_accounts(user_id);

alter table public.ai_finance_accounts enable row level security;

drop policy if exists "ai_finance_accounts_select_own" on public.ai_finance_accounts;
create policy "ai_finance_accounts_select_own"
  on public.ai_finance_accounts for select
  using (auth.uid() = user_id);

drop policy if exists "ai_finance_accounts_insert_own" on public.ai_finance_accounts;
create policy "ai_finance_accounts_insert_own"
  on public.ai_finance_accounts for insert
  with check (auth.uid() = user_id);

drop policy if exists "ai_finance_accounts_update_own" on public.ai_finance_accounts;
create policy "ai_finance_accounts_update_own"
  on public.ai_finance_accounts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "ai_finance_accounts_delete_own" on public.ai_finance_accounts;
create policy "ai_finance_accounts_delete_own"
  on public.ai_finance_accounts for delete
  using (auth.uid() = user_id);

-- Vínculos utilizados diretamente pelo frontend.
alter table public.ai_lessons
  add column if not exists vehicle_id uuid;

alter table public.ai_finance
  add column if not exists account_id uuid;

create index if not exists idx_ai_lessons_vehicle_id
  on public.ai_lessons(vehicle_id);

create index if not exists idx_ai_finance_account_id
  on public.ai_finance(account_id);

commit;
