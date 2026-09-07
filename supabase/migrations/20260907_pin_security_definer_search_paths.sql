-- Pin search_path and fully qualify security-sensitive helper references.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(select 1 from public.admin_profiles where id=(select auth.uid()) and role='admin' and active=true);
$$;

create or replace function private.is_system_admin()
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(select 1 from public.admin_profiles where id=(select auth.uid()) and role='admin' and active=true);
$$;

create or replace function public.is_ai_admin()
returns boolean language sql stable security definer set search_path=''
as $$ select public.is_admin(); $$;

create or replace function public.ai_is_admin()
returns boolean language sql security definer set search_path=''
as $$ select exists(select 1 from public.ai_profiles where id=(select auth.uid()) and role='admin'); $$;

create or replace function public.ai_license_status()
returns table(license_id uuid, license_key text, license_status text, plan_code text, offline_grace_until timestamptz, expires_at timestamptz)
language sql security definer set search_path=''
as $$
  select l.id,l.license_key,l.status,p.code,l.offline_grace_until,l.expires_at
  from public.ai_licenses l
  left join public.ai_subscriptions s on s.id=l.subscription_id
  left join public.ai_plans p on p.id=s.plan_id
  where l.user_id=(select auth.uid())
  order by l.created_at desc limit 1;
$$;

create or replace function cmnt_core.has_role(p_user uuid,p_role text)
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from cmnt_core.user_roles where user_id=p_user and role_code=p_role); $$;

create or replace function public.current_user_role() returns text language sql stable set search_path='' as $$ select up.role from public.user_profiles up where up.user_id=(select auth.uid()) limit 1 $$;
create or replace function public.current_user_organization_id() returns uuid language sql stable set search_path='' as $$ select up.organization_id from public.user_profiles up where up.user_id=(select auth.uid()) limit 1 $$;
create or replace function public.current_user_company_id() returns uuid language sql stable set search_path='' as $$ select up.company_id from public.user_profiles up where up.user_id=(select auth.uid()) limit 1 $$;
create or replace function public.current_effective_role() returns text language sql stable set search_path='' as $$ select coalesce((select up.role from public.user_profiles up where up.user_id=(select auth.uid()) limit 1),(select ap.role from public.admin_profiles ap where ap.id=(select auth.uid()) limit 1)) $$;
create or replace function public.current_effective_organization_id() returns uuid language sql stable set search_path='' as $$ select up.organization_id from public.user_profiles up where up.user_id=(select auth.uid()) limit 1 $$;
create or replace function public.current_effective_company_id() returns uuid language sql stable set search_path='' as $$ select up.company_id from public.user_profiles up where up.user_id=(select auth.uid()) limit 1 $$;
create or replace function public.current_effective_state_id() returns uuid language sql stable set search_path='' as $$ select up.state_id from public.user_profiles up where up.user_id=(select auth.uid()) limit 1 $$;
create or replace function public.current_effective_municipality_id() returns uuid language sql stable set search_path='' as $$ select up.municipality_id from public.user_profiles up where up.user_id=(select auth.uid()) limit 1 $$;

alter function public.enat_touch_updated_at() set search_path='public';
alter function public.set_ai_service_contract_updated_at() set search_path='public';
alter function public.refresh_service_contract_total() set search_path='public';
alter function public.touch_ai_contract_installment_updated_at() set search_path='public';
alter function public.set_enat_public_content_updated_at() set search_path='public';
alter function public.set_enat_public_testimonials_updated_at() set search_path='public';
alter function public.set_hsi_tenant_from_user_profiles() set search_path='public';
alter function public.render_ai_service_contract(uuid) set search_path='public,auth';
alter function cmnt_core.calculate_hsi_total(numeric,numeric,numeric,numeric,numeric) set search_path='';
alter function cmnt_core.classify_hsi(numeric) set search_path='';
