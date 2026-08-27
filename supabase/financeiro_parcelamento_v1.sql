-- Assistente do Instrutor V6 — Financeiro e parcelamento de contratos
-- Execute UMA VEZ no Supabase SQL Editor antes de testar o novo fluxo.
-- Este script preserva os dados existentes e torna RECEITA/DESPESA e
-- PENDENTE/PAGO/ATRASADO/CANCELADO os valores válidos usados pelo app.

begin;

-- 1) Compatibilidade dos CHECKs existentes.
-- O projeto atual apresentou ai_finance_type_check e ai_finance_status_check.
-- Normalizamos valores antigos antes de recriar os CHECKs.
update public.ai_finance
set type = case upper(coalesce(type, ''))
  when 'ENTRADA' then 'RECEITA'
  when 'RECEITA' then 'RECEITA'
  when 'SAIDA' then 'DESPESA'
  when 'SAÍDA' then 'DESPESA'
  when 'DESPESA' then 'DESPESA'
  else 'RECEITA'
end;

update public.ai_finance
set status = case upper(coalesce(status, ''))
  when 'PAGO' then 'PAGO'
  when 'QUITADO' then 'PAGO'
  when 'LIQUIDADO' then 'PAGO'
  when 'PENDENTE' then 'PENDENTE'
  when 'ABERTO' then 'PENDENTE'
  when 'EM_ABERTO' then 'PENDENTE'
  when 'ATRASADO' then 'ATRASADO'
  when 'VENCIDO' then 'ATRASADO'
  when 'CANCELADO' then 'CANCELADO'
  else 'PENDENTE'
end;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'ai_finance_type_check') then
    alter table public.ai_finance drop constraint ai_finance_type_check;
  end if;
  if exists (select 1 from pg_constraint where conname = 'ai_finance_status_check') then
    alter table public.ai_finance drop constraint ai_finance_status_check;
  end if;
end $$;

alter table public.ai_finance
  add constraint ai_finance_type_check
  check (type in ('RECEITA', 'DESPESA'));

alter table public.ai_finance
  add constraint ai_finance_status_check
  check (status in ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO'));

-- 2) Campos financeiros do contrato.
alter table public.ai_service_contracts
  add column if not exists contractor_name text,
  add column if not exists installments_count integer not null default 1,
  add column if not exists first_due_date date,
  add column if not exists entry_amount numeric(12,2) not null default 0,
  add column if not exists financed_amount numeric(12,2) not null default 0;

-- 3) Cronograma financeiro do contrato.
create table if not exists public.ai_contract_installments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_contract_id uuid not null references public.ai_service_contracts(id) on delete cascade,
  student_id uuid not null references public.ai_students(id) on delete cascade,
  installment_number integer not null,
  due_date date not null,
  amount numeric(12,2) not null default 0,
  status text not null default 'PENDENTE',
  payment_method text,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(service_contract_id, installment_number)
);

alter table public.ai_contract_installments
  add column if not exists paid_at timestamptz,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'ai_contract_installments_status_check') then
    alter table public.ai_contract_installments drop constraint ai_contract_installments_status_check;
  end if;
end $$;

alter table public.ai_contract_installments
  add constraint ai_contract_installments_status_check
  check (status in ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO'));

create index if not exists ai_contract_installments_contract_idx
  on public.ai_contract_installments(service_contract_id, installment_number);

create index if not exists ai_contract_installments_student_due_idx
  on public.ai_contract_installments(user_id, student_id, due_date);

-- 4) Liga cada parcela ao lançamento correspondente no financeiro.
alter table public.ai_finance
  add column if not exists contract_installment_id uuid references public.ai_contract_installments(id) on delete set null;

create index if not exists ai_finance_contract_installment_idx
  on public.ai_finance(contract_installment_id)
  where contract_installment_id is not null;

-- 5) RLS do cronograma.
alter table public.ai_contract_installments enable row level security;

drop policy if exists "users own contract installments select" on public.ai_contract_installments;
create policy "users own contract installments select"
  on public.ai_contract_installments for select
  using (auth.uid() = user_id);

drop policy if exists "users own contract installments insert" on public.ai_contract_installments;
create policy "users own contract installments insert"
  on public.ai_contract_installments for insert
  with check (auth.uid() = user_id);

drop policy if exists "users own contract installments update" on public.ai_contract_installments;
create policy "users own contract installments update"
  on public.ai_contract_installments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users own contract installments delete" on public.ai_contract_installments;
create policy "users own contract installments delete"
  on public.ai_contract_installments for delete
  using (auth.uid() = user_id);

-- 6) Atualização automática do updated_at.
create or replace function public.touch_ai_contract_installment_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ai_contract_installments_updated_at on public.ai_contract_installments;
create trigger trg_ai_contract_installments_updated_at
before update on public.ai_contract_installments
for each row execute function public.touch_ai_contract_installment_updated_at();

commit;
