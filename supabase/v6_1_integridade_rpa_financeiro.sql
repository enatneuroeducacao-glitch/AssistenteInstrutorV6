-- ENAT Assistente do Instrutor V6.1
-- Integridade e compatibilidade do RPA ÚNICO / Financeiro.
-- Execute no Supabase SQL Editor.

begin;

-- RPA: garante os campos usados pela evolução e pelos indicadores.
alter table public.ai_rpa_reports
  add column if not exists first_lesson_id uuid references public.ai_lessons(id) on delete set null,
  add column if not exists latest_lesson_id uuid references public.ai_lessons(id) on delete set null,
  add column if not exists total_lessons integer not null default 0,
  add column if not exists status text not null default 'EM_FORMACAO',
  add column if not exists baseline_captured boolean not null default false,
  add column if not exists baseline_at timestamptz,
  add column if not exists baseline_km_start numeric,
  add column if not exists baseline_objective text,
  add column if not exists baseline_cnh_category text,
  add column if not exists latest_quality_score numeric,
  add column if not exists latest_hsi_score numeric,
  add column if not exists latest_average numeric,
  add column if not exists latest_evaluation jsonb,
  add column if not exists latest_notes text,
  add column if not exists continuity_plan text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists ai_rpa_reports_user_student_uidx
  on public.ai_rpa_reports(user_id, student_id);

-- Aula: separa explicitamente a categoria ministrada da categoria cadastral do aluno.
alter table public.ai_lessons
  add column if not exists lesson_number integer,
  add column if not exists cnh_category text,
  add column if not exists service_contract_item_id uuid references public.ai_service_contract_items(id) on delete set null,
  add column if not exists exam_scheduled_at timestamptz,
  add column if not exists exam_type text,
  add column if not exists exam_location text,
  add column if not exists exam_status text;

-- Financeiro: garante os campos utilizados pelo dashboard e pelos lançamentos.
alter table public.ai_finance
  add column if not exists student_id uuid references public.ai_students(id) on delete set null,
  add column if not exists lesson_id uuid references public.ai_lessons(id) on delete set null,
  add column if not exists service_contract_id uuid references public.ai_service_contracts(id) on delete set null,
  add column if not exists service_contract_item_id uuid references public.ai_service_contract_items(id) on delete set null,
  add column if not exists person_type text default 'PF',
  add column if not exists document text,
  add column if not exists counterparty_name text,
  add column if not exists account_id uuid;

commit;
