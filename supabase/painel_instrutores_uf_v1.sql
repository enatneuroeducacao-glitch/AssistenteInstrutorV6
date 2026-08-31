-- ENAT Assistente do Instrutor — Painel Nacional de Instrutores por UF v1
-- Brasil -> UF -> instrutores -> perfil
-- Dados individuais somente para administradores cadastrados em ai_admin_users.

begin;

create table if not exists public.ai_admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists ai_admin_users_email_uq
  on public.ai_admin_users(lower(email))
  where email is not null;

alter table public.ai_admin_users enable row level security;
drop policy if exists "ai_admin_users_self" on public.ai_admin_users;
create policy "ai_admin_users_self" on public.ai_admin_users
  for select using (auth.uid() = user_id);

create or replace function public.is_ai_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.ai_admin_users a
    where a.user_id = auth.uid() and a.active = true
  );
$$;

revoke all on function public.is_ai_admin() from public;
grant execute on function public.is_ai_admin() to authenticated;

create or replace function public.admin_list_instructor_ufs()
returns table (uf text, state_name text, instructor_count bigint)
language sql security definer stable set search_path = public
as $$
  select
    upper(coalesce(p.uf, '')) as uf,
    case upper(coalesce(p.uf, ''))
      when 'AC' then 'Acre' when 'AL' then 'Alagoas' when 'AP' then 'Amapá'
      when 'AM' then 'Amazonas' when 'BA' then 'Bahia' when 'CE' then 'Ceará'
      when 'DF' then 'Distrito Federal' when 'ES' then 'Espírito Santo'
      when 'GO' then 'Goiás' when 'MA' then 'Maranhão' when 'MT' then 'Mato Grosso'
      when 'MS' then 'Mato Grosso do Sul' when 'MG' then 'Minas Gerais'
      when 'PA' then 'Pará' when 'PB' then 'Paraíba' when 'PR' then 'Paraná'
      when 'PE' then 'Pernambuco' when 'PI' then 'Piauí' when 'RJ' then 'Rio de Janeiro'
      when 'RN' then 'Rio Grande do Norte' when 'RS' then 'Rio Grande do Sul'
      when 'RO' then 'Rondônia' when 'RR' then 'Roraima' when 'SC' then 'Santa Catarina'
      when 'SP' then 'São Paulo' when 'SE' then 'Sergipe' when 'TO' then 'Tocantins'
      else 'Não informado'
    end as state_name,
    count(*)::bigint
  from public.ai_profiles p
  where public.is_ai_admin()
    and coalesce(lower(p.role), 'instrutor') = 'instrutor'
  group by upper(coalesce(p.uf, ''))
  order by instructor_count desc, uf;
$$;

create or replace function public.admin_list_instructors_by_uf(p_uf text)
returns table (
  user_id uuid, full_name text, email text, phone text, city text, acting_city text,
  uf text, credential text, credential_uf text, category text,
  employment_type text, teaching_type text, created_at timestamptz
)
language sql security definer stable set search_path = public
as $$
  select
    p.id, p.full_name, p.email, p.phone, p.city, p.acting_city,
    upper(coalesce(p.uf, '')), p.credential, p.credential_uf, p.category,
    p.employment_type, p.teaching_type, coalesce(u.created_at, now())
  from public.ai_profiles p
  left join auth.users u on u.id = p.id
  where public.is_ai_admin()
    and coalesce(lower(p.role), 'instrutor') = 'instrutor'
    and upper(coalesce(p.uf, '')) = upper(trim(p_uf))
  order by lower(coalesce(p.full_name, '')), lower(coalesce(p.email, ''));
$$;

create or replace function public.admin_get_instructor_profile(p_user_id uuid)
returns jsonb language plpgsql security definer stable set search_path = public
as $$
declare result jsonb;
begin
  if not public.is_ai_admin() then
    raise exception 'Acesso administrativo não autorizado';
  end if;
  select jsonb_build_object(
    'profile', to_jsonb(p),
    'students', (select count(*) from public.ai_students s where s.user_id = p.id),
    'lessons', (select count(*) from public.ai_lessons l where l.user_id = p.id),
    'rpa_reports', (select count(*) from public.ai_rpa_reports r where r.user_id = p.id)
  ) into result
  from public.ai_profiles p
  where p.id = p_user_id and coalesce(lower(p.role), 'instrutor') = 'instrutor';
  return coalesce(result, '{}'::jsonb);
end;
$$;

revoke all on function public.admin_list_instructor_ufs() from public;
revoke all on function public.admin_list_instructors_by_uf(text) from public;
revoke all on function public.admin_get_instructor_profile(uuid) from public;
grant execute on function public.admin_list_instructor_ufs() to authenticated;
grant execute on function public.admin_list_instructors_by_uf(text) to authenticated;
grant execute on function public.admin_get_instructor_profile(uuid) to authenticated;

commit;
