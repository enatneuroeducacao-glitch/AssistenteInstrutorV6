-- ENAT Assistente do Instrutor V6 — consolidação do fluxo operacional
-- Execute no Supabase SQL Editor antes de usar o V6 consolidado.
-- Este script é idempotente para as estruturas adicionadas por esta revisão.

begin;

-- ============================================================
-- 1. Alunos
-- ============================================================
alter table public.ai_students
  add column if not exists payment_method text,
  add column if not exists contract_status text,
  add column if not exists contract_notes text,
  add column if not exists lesson_goal integer,
  add column if not exists contract_amount numeric(12,2),
  add column if not exists start_date date,
  add column if not exists notes text;

-- ============================================================
-- 1.1. Perfil profissional do instrutor
-- ============================================================
alter table public.ai_profiles
  add column if not exists phone text,
  add column if not exists city text,
  add column if not exists acting_city text,
  add column if not exists person_type text default 'PF',
  add column if not exists cnpj text,
  add column if not exists company_name text,
  add column if not exists trade_name text,
  add column if not exists birth_date date,
  add column if not exists credential text,
  add column if not exists credential_uf text,
  add column if not exists uf text,
  add column if not exists category text,
  add column if not exists employment_type text,
  add column if not exists teaching_type text,
  add column if not exists role text default 'instrutor';

create or replace function public.handle_new_ai_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ai_profiles (
    id, full_name, cpf, cnpj, person_type, company_name, trade_name, birth_date,
    email, phone, city, acting_city, uf, credential, credential_uf, category,
    employment_type, teaching_type, role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'cpf', ''),
    nullif(new.raw_user_meta_data->>'cnpj', ''),
    coalesce(nullif(new.raw_user_meta_data->>'person_type', ''), 'PF'),
    nullif(new.raw_user_meta_data->>'company_name', ''),
    nullif(new.raw_user_meta_data->>'trade_name', ''),
    nullif(new.raw_user_meta_data->>'birth_date', '')::date,
    new.email,
    nullif(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'acting_city', ''),
    nullif(new.raw_user_meta_data->>'acting_city', ''),
    nullif(new.raw_user_meta_data->>'uf', ''),
    nullif(new.raw_user_meta_data->>'credential', ''),
    nullif(new.raw_user_meta_data->>'credential_uf', ''),
    nullif(new.raw_user_meta_data->>'category', ''),
    nullif(new.raw_user_meta_data->>'employment_type', ''),
    nullif(new.raw_user_meta_data->>'teaching_type', ''),
    coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'instrutor')
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    cpf = excluded.cpf,
    cnpj = excluded.cnpj,
    person_type = excluded.person_type,
    company_name = excluded.company_name,
    trade_name = excluded.trade_name,
    birth_date = excluded.birth_date,
    email = excluded.email,
    phone = excluded.phone,
    city = excluded.city,
    acting_city = excluded.acting_city,
    uf = excluded.uf,
    credential = excluded.credential,
    credential_uf = excluded.credential_uf,
    category = excluded.category,
    employment_type = excluded.employment_type,
    teaching_type = excluded.teaching_type;
  return new;
end;
$$;

drop trigger if exists trg_auth_user_ai_profile on auth.users;
create trigger trg_auth_user_ai_profile
after insert on auth.users
for each row execute function public.handle_new_ai_profile();

-- ============================================================
-- 2. Contrato principal
-- ============================================================
create table if not exists public.ai_service_contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references public.ai_students(id) on delete cascade,
  contract_amount numeric(12,2) not null default 0,
  planned_lessons integer not null default 0,
  payment_method text,
  start_date date,
  status text not null default 'NAO_GERADO',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_service_contracts
  add column if not exists contract_amount numeric(12,2) not null default 0,
  add column if not exists planned_lessons integer not null default 0,
  add column if not exists payment_method text,
  add column if not exists start_date date,
  add column if not exists status text not null default 'NAO_GERADO',
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists ai_service_contracts_user_student_idx
  on public.ai_service_contracts(user_id, student_id, created_at desc);

-- ============================================================
-- 3. Itens do contrato por categoria
-- ============================================================
create table if not exists public.ai_service_contract_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_contract_id uuid not null references public.ai_service_contracts(id) on delete cascade,
  student_id uuid not null references public.ai_students(id) on delete cascade,
  cnh_category text not null,
  planned_lessons integer not null default 0,
  completed_lessons integer not null default 0,
  unit_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(service_contract_id, cnh_category)
);

alter table public.ai_service_contract_items
  add column if not exists completed_lessons integer not null default 0,
  add column if not exists unit_price numeric(12,2) not null default 0,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists ai_service_contract_items_contract_category_uq
  on public.ai_service_contract_items(service_contract_id, cnh_category);

create index if not exists ai_service_contract_items_student_category_idx
  on public.ai_service_contract_items(user_id, student_id, cnh_category);

-- ============================================================
-- 4. Planejamento do aluno por categoria
-- ============================================================
create table if not exists public.ai_student_category_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references public.ai_students(id) on delete cascade,
  cnh_category text not null,
  planned_lessons integer not null default 0,
  completed_lessons integer not null default 0,
  unit_price numeric(12,2) not null default 0,
  service_contract_id uuid references public.ai_service_contracts(id) on delete set null,
  service_contract_item_id uuid references public.ai_service_contract_items(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, cnh_category)
);

create unique index if not exists ai_student_category_plans_student_category_uq
  on public.ai_student_category_plans(student_id, cnh_category);

create index if not exists ai_student_category_plans_user_student_idx
  on public.ai_student_category_plans(user_id, student_id);

-- ============================================================
-- 5. Aulas: vínculo obrigatório com categoria/item quando aplicável
-- ============================================================
alter table public.ai_lessons
  add column if not exists lesson_number integer,
  add column if not exists cnh_category text,
  add column if not exists service_contract_item_id uuid references public.ai_service_contract_items(id) on delete set null,
  add column if not exists exam_scheduled_at timestamptz,
  add column if not exists exam_type text,
  add column if not exists exam_location text,
  add column if not exists exam_status text;

create index if not exists ai_lessons_user_student_category_idx
  on public.ai_lessons(user_id, student_id, cnh_category);

create index if not exists ai_lessons_contract_item_idx
  on public.ai_lessons(service_contract_item_id)
  where service_contract_item_id is not null;

-- ============================================================
-- 6. Financeiro: ligação com contrato/categoria
-- ============================================================
alter table public.ai_finance
  add column if not exists student_id uuid references public.ai_students(id) on delete set null,
  add column if not exists lesson_id uuid references public.ai_lessons(id) on delete set null,
  add column if not exists service_contract_id uuid references public.ai_service_contracts(id) on delete set null,
  add column if not exists service_contract_item_id uuid references public.ai_service_contract_items(id) on delete set null,
  add column if not exists person_type text default 'PF',
  add column if not exists document text,
  add column if not exists counterparty_name text,
  add column if not exists account_id uuid;

create index if not exists ai_finance_contract_idx
  on public.ai_finance(user_id, service_contract_id)
  where service_contract_id is not null;

-- ============================================================
-- 7. RPA ÚNICO
-- ============================================================
create table if not exists public.ai_rpa_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references public.ai_students(id) on delete cascade,
  first_lesson_id uuid references public.ai_lessons(id) on delete set null,
  latest_lesson_id uuid references public.ai_lessons(id) on delete set null,
  total_lessons integer not null default 0,
  status text not null default 'EM_FORMACAO',
  baseline_captured boolean not null default false,
  baseline_at timestamptz,
  baseline_km_start numeric,
  baseline_objective text,
  baseline_cnh_category text,
  latest_quality_score numeric,
  latest_hsi_score numeric,
  latest_average numeric,
  latest_evaluation jsonb,
  latest_notes text,
  continuity_plan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, student_id)
);

alter table public.ai_rpa_reports
  add column if not exists latest_hsi_score numeric,
  add column if not exists latest_quality_score numeric,
  add column if not exists latest_average numeric,
  add column if not exists latest_evaluation jsonb,
  add column if not exists latest_notes text,
  add column if not exists continuity_plan text,
  add column if not exists updated_at timestamptz not null default now();

-- RPA RLS
alter table public.ai_rpa_reports enable row level security;
drop policy if exists "ai_rpa_reports_select_own" on public.ai_rpa_reports;
create policy "ai_rpa_reports_select_own" on public.ai_rpa_reports for select using (auth.uid() = user_id);
drop policy if exists "ai_rpa_reports_insert_own" on public.ai_rpa_reports;
create policy "ai_rpa_reports_insert_own" on public.ai_rpa_reports for insert with check (auth.uid() = user_id);
drop policy if exists "ai_rpa_reports_update_own" on public.ai_rpa_reports;
create policy "ai_rpa_reports_update_own" on public.ai_rpa_reports for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 8. RLS das novas estruturas
-- ============================================================
alter table public.ai_service_contracts enable row level security;
alter table public.ai_service_contract_items enable row level security;
alter table public.ai_student_category_plans enable row level security;

-- Contratos
 drop policy if exists "ai_service_contracts_select_own" on public.ai_service_contracts;
create policy "ai_service_contracts_select_own" on public.ai_service_contracts
  for select using (auth.uid() = user_id);
 drop policy if exists "ai_service_contracts_insert_own" on public.ai_service_contracts;
create policy "ai_service_contracts_insert_own" on public.ai_service_contracts
  for insert with check (auth.uid() = user_id);
 drop policy if exists "ai_service_contracts_update_own" on public.ai_service_contracts;
create policy "ai_service_contracts_update_own" on public.ai_service_contracts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
 drop policy if exists "ai_service_contracts_delete_own" on public.ai_service_contracts;
create policy "ai_service_contracts_delete_own" on public.ai_service_contracts
  for delete using (auth.uid() = user_id);

-- Itens
 drop policy if exists "ai_service_contract_items_select_own" on public.ai_service_contract_items;
create policy "ai_service_contract_items_select_own" on public.ai_service_contract_items
  for select using (auth.uid() = user_id);
 drop policy if exists "ai_service_contract_items_insert_own" on public.ai_service_contract_items;
create policy "ai_service_contract_items_insert_own" on public.ai_service_contract_items
  for insert with check (auth.uid() = user_id);
 drop policy if exists "ai_service_contract_items_update_own" on public.ai_service_contract_items;
create policy "ai_service_contract_items_update_own" on public.ai_service_contract_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
 drop policy if exists "ai_service_contract_items_delete_own" on public.ai_service_contract_items;
create policy "ai_service_contract_items_delete_own" on public.ai_service_contract_items
  for delete using (auth.uid() = user_id);

-- Planejamento
 drop policy if exists "ai_student_category_plans_select_own" on public.ai_student_category_plans;
create policy "ai_student_category_plans_select_own" on public.ai_student_category_plans
  for select using (auth.uid() = user_id);
 drop policy if exists "ai_student_category_plans_insert_own" on public.ai_student_category_plans;
create policy "ai_student_category_plans_insert_own" on public.ai_student_category_plans
  for insert with check (auth.uid() = user_id);
 drop policy if exists "ai_student_category_plans_update_own" on public.ai_student_category_plans;
create policy "ai_student_category_plans_update_own" on public.ai_student_category_plans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
 drop policy if exists "ai_student_category_plans_delete_own" on public.ai_student_category_plans;
create policy "ai_student_category_plans_delete_own" on public.ai_student_category_plans
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 9. Dados históricos: numerar aulas existentes
-- ============================================================
with numbered as (
  select
    id,
    row_number() over (
      partition by user_id, student_id
      order by coalesce(started_at, created_at), id
    ) as rn
  from public.ai_lessons
  where coalesce(status, '') <> 'exam_scheduled'
)
update public.ai_lessons l
set lesson_number = n.rn
from numbered n
where l.id = n.id
  and l.lesson_number is null;

commit;
