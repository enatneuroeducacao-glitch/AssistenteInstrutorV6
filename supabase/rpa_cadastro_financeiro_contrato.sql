-- ENAT Assistente do Instrutor - Cadastro financeiro e contrato do aluno
-- Execute no Supabase SQL Editor do projeto correto.
alter table public.ai_students
  add column if not exists payment_method text,
  add column if not exists contract_status text,
  add column if not exists contract_notes text;

create index if not exists ai_students_user_cpf_idx
  on public.ai_students(user_id, cpf)
  where cpf is not null and length(trim(cpf)) > 0;

comment on column public.ai_students.payment_method is 'Forma de pagamento contratada pelo aluno';
comment on column public.ai_students.contract_status is 'Status operacional do contrato do aluno';
comment on column public.ai_students.contract_notes is 'Condições e observações do contrato de prestação de serviço';

-- A unicidade por CPF é aplicada por instrutor para impedir duplicidade de cadastro.
create unique index if not exists ai_students_user_cpf_unique
  on public.ai_students(user_id, cpf)
  where cpf is not null and length(trim(cpf)) > 0;


-- Cadastro PF/PJ do instrutor
alter table public.ai_profiles
  add column if not exists person_type text default 'PF',
  add column if not exists cnpj text,
  add column if not exists company_name text,
  add column if not exists trade_name text;

create unique index if not exists ai_profiles_cnpj_unique
  on public.ai_profiles(cnpj)
  where cnpj is not null and length(trim(cnpj)) > 0;

-- PF/PJ nos lançamentos financeiros
alter table public.ai_finance
  add column if not exists person_type text default 'PF',
  add column if not exists document text,
  add column if not exists counterparty_name text;

-- Agendamento de prova
alter table public.ai_lessons
  add column if not exists exam_scheduled_at timestamptz,
  add column if not exists exam_type text,
  add column if not exists exam_location text,
  add column if not exists exam_status text;

create index if not exists ai_lessons_user_exam_schedule_idx
  on public.ai_lessons(user_id, exam_scheduled_at)
  where exam_scheduled_at is not null;


-- Atualiza o gatilho de perfil para persistir PF/PJ no cadastro profissional.
create or replace function public.handle_new_ai_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ai_profiles (
    id, full_name, cpf, cnpj, person_type, company_name, trade_name, birth_date,
    email, uf, acting_city, credential, credential_uf, category,
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
    nullif(new.raw_user_meta_data->>'uf', ''),
    nullif(new.raw_user_meta_data->>'acting_city', ''),
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
    uf = excluded.uf,
    acting_city = excluded.acting_city,
    credential = excluded.credential,
    credential_uf = excluded.credential_uf,
    category = excluded.category,
    employment_type = excluded.employment_type,
    teaching_type = excluded.teaching_type;

  return new;
end;
$$;

-- ============================================================
-- RPA ÚNICO: início automático na 1ª aula e evolução contínua
-- ============================================================
alter table public.ai_lessons
  add column if not exists lesson_number integer,
  add column if not exists cnh_category text;

create index if not exists ai_lessons_student_lesson_number_idx
  on public.ai_lessons(user_id, student_id, lesson_number);

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

create index if not exists ai_rpa_reports_user_student_idx
  on public.ai_rpa_reports(user_id, student_id);

alter table public.ai_rpa_reports enable row level security;

drop policy if exists "users own rpa select" on public.ai_rpa_reports;
create policy "users own rpa select"
  on public.ai_rpa_reports for select
  using (auth.uid() = user_id);

drop policy if exists "users own rpa insert" on public.ai_rpa_reports;
create policy "users own rpa insert"
  on public.ai_rpa_reports for insert
  with check (auth.uid() = user_id);

drop policy if exists "users own rpa update" on public.ai_rpa_reports;
create policy "users own rpa update"
  on public.ai_rpa_reports for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

with numbered as (
  select
    id,
    row_number() over (partition by user_id, student_id order by created_at, id) as rn
  from public.ai_lessons
  where coalesce(status, '') <> 'exam_scheduled'
)
update public.ai_lessons l
set lesson_number = n.rn
from numbered n
where l.id = n.id
  and l.lesson_number is null;

create or replace function public.touch_ai_rpa_reports_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ai_rpa_reports_updated_at on public.ai_rpa_reports;
create trigger trg_ai_rpa_reports_updated_at
before update on public.ai_rpa_reports
for each row execute function public.touch_ai_rpa_reports_updated_at();
