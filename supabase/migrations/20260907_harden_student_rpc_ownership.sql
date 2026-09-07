-- Student-scoped RPCs must never disclose another instructor's student data.
create or replace function public.get_student_category_availability(p_student_id uuid)
returns table(cnh_category text, planned_lessons integer, completed_lessons integer, remaining_lessons integer, unit_price numeric, service_contract_id uuid)
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.ai_students s
    where s.id = p_student_id and (s.user_id = (select auth.uid()) or public.is_admin())
  ) then
    raise exception 'Acesso ao aluno não autorizado' using errcode = '42501';
  end if;
  return query
  select upper(p.cnh_category), p.planned_lessons, p.completed_lessons,
         greatest(0, p.planned_lessons - p.completed_lessons), p.unit_price, p.service_contract_id
  from public.ai_student_category_plans p
  where p.student_id = p_student_id
  order by upper(p.cnh_category);
end;
$$;

create or replace function public.get_student_rpa_summary(p_student_id uuid)
returns table(total_lessons bigint, completed_lessons bigint, categories text, average_quality numeric, average_hsi numeric, last_lesson_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.ai_students s
    where s.id = p_student_id and (s.user_id = (select auth.uid()) or public.is_admin())
  ) then
    raise exception 'Acesso ao aluno não autorizado' using errcode = '42501';
  end if;
  return query
  select count(l.id),
         count(l.id) filter (where lower(coalesce(l.status,'')) in ('completed','concluida','concluído','finalizada')),
         coalesce(string_agg(distinct upper(l.cnh_category), ', ' order by upper(l.cnh_category)), ''),
         round(avg(r.quality_score), 2), round(avg(r.hsi_score), 2), max(l.ended_at)
  from public.ai_lessons l
  left join public.ai_rpa_reports r on r.lesson_id = l.id
  where l.student_id = p_student_id;
end;
$$;

create or replace function public.create_enat_referral_code(p_instructor_user_id uuid)
returns text language plpgsql security definer set search_path=''
as $$
declare existing_code text; generated_code text;
begin
  if (select auth.uid()) is null or (select auth.uid()) <> p_instructor_user_id then raise exception 'Acesso não autorizado'; end if;
  select referral_code into existing_code from public.enat_referral_codes where instructor_user_id=p_instructor_user_id;
  if existing_code is not null then return existing_code; end if;
  generated_code := public.generate_enat_referral_code();
  insert into public.enat_referral_codes(instructor_user_id,referral_code) values(p_instructor_user_id,generated_code);
  return generated_code;
end;
$$;

create or replace function public.enat_qualified_referral_count(p_instructor_user_id uuid)
returns integer language plpgsql security definer set search_path=''
as $$
begin
  if (select auth.uid()) is null or (select auth.uid()) <> p_instructor_user_id then raise exception 'Acesso não autorizado'; end if;
  return (select count(*)::integer from public.enat_referrals where referrer_user_id=p_instructor_user_id and status='qualified');
end;
$$;
