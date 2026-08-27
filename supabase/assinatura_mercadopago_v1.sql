-- ENAT Assistente do Instrutor — Assinatura recorrente Mercado Pago v1
-- Modelo: R$ 50,00/mês. O status local é atualizado por Webhook e não pelo retorno do navegador.

create table if not exists public.ai_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'mercadopago',
  plan_code text not null default 'enat_profissional_50_mensal',
  provider_subscription_id text unique,
  provider_customer_id text,
  checkout_url text,
  status text not null default 'pending',
  amount_cents integer not null default 5000,
  currency text not null default 'BRL',
  frequency integer not null default 1,
  frequency_type text not null default 'months',
  current_period_start timestamptz,
  current_period_end timestamptz,
  next_due_date timestamptz,
  last_payment_id text,
  last_payment_status text,
  last_payment_at timestamptz,
  canceled_at timestamptz,
  paused_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_subscriptions_user_status_idx
  on public.ai_subscriptions(user_id, status);

create index if not exists ai_subscriptions_provider_id_idx
  on public.ai_subscriptions(provider_subscription_id);

create table if not exists public.ai_subscription_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'mercadopago',
  event_type text,
  action text,
  provider_resource_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_subscription_events_resource_idx
  on public.ai_subscription_events(provider_resource_id);

alter table public.ai_subscriptions enable row level security;
alter table public.ai_subscription_events enable row level security;

drop policy if exists "users read own subscription" on public.ai_subscriptions;
create policy "users read own subscription"
  on public.ai_subscriptions
  for select
  using (auth.uid() = user_id);

-- Eventos são somente servidor-side. Não concedemos INSERT/UPDATE ao cliente.

-- View segura para o frontend consultar somente o essencial.
create or replace view public.ai_my_subscription as
select
  id,
  user_id,
  provider,
  plan_code,
  provider_subscription_id,
  checkout_url,
  status,
  amount_cents,
  currency,
  frequency,
  frequency_type,
  current_period_start,
  current_period_end,
  next_due_date,
  last_payment_status,
  last_payment_at,
  canceled_at,
  paused_at,
  created_at,
  updated_at
from public.ai_subscriptions;

-- Mantém updated_at atualizado quando o webhook alterar a assinatura.
create or replace function public.set_ai_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ai_subscriptions_updated_at on public.ai_subscriptions;
create trigger trg_ai_subscriptions_updated_at
before update on public.ai_subscriptions
for each row execute function public.set_ai_subscriptions_updated_at();
