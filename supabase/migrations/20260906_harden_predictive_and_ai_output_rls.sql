-- ENAT / NEURODRIVE security hardening
-- Applied to Supabase production project gicjsuagmiyoqvttbqjw on 2026-09-06.
-- Purpose: replace broad authenticated access on predictive/AI output tables with ownership-aware RLS.

begin;

drop policy if exists authenticated_read_hsi_predictive_predictions on public.hsi_predictive_predictions;
drop policy if exists authenticated_insert_hsi_predictive_predictions on public.hsi_predictive_predictions;
drop policy if exists authenticated_read_ai_intelligence_outputs on public.ai_intelligence_outputs;
drop policy if exists authenticated_insert_ai_intelligence_outputs on public.ai_intelligence_outputs;

alter table public.hsi_predictive_predictions enable row level security;
alter table public.ai_intelligence_outputs enable row level security;

create policy hsi_predictive_select_owner_or_admin
on public.hsi_predictive_predictions for select to authenticated
using (
  (select public.is_admin())
  or exists (select 1 from public.ai_students s where s.id = hsi_predictive_predictions.subject_id and s.user_id = (select auth.uid()))
  or exists (select 1 from public.hsi_participants p where p.id = hsi_predictive_predictions.subject_id and p.user_id = (select auth.uid()))
  or exists (select 1 from public.hsi_results r where r.participant_id = hsi_predictive_predictions.subject_id and r.user_id = (select auth.uid()))
);

create policy hsi_predictive_insert_owner_or_admin
on public.hsi_predictive_predictions for insert to authenticated
with check (
  (select public.is_admin())
  or exists (select 1 from public.ai_students s where s.id = hsi_predictive_predictions.subject_id and s.user_id = (select auth.uid()))
  or exists (select 1 from public.hsi_participants p where p.id = hsi_predictive_predictions.subject_id and p.user_id = (select auth.uid()))
  or exists (select 1 from public.hsi_results r where r.participant_id = hsi_predictive_predictions.subject_id and r.user_id = (select auth.uid()))
);

create policy ai_intelligence_outputs_select_owner_or_admin
on public.ai_intelligence_outputs for select to authenticated
using (
  (select public.is_admin())
  or user_id = (select auth.uid())
  or exists (select 1 from public.ai_students s where s.id = ai_intelligence_outputs.student_id and s.user_id = (select auth.uid()))
  or exists (select 1 from public.ai_lessons l where l.id = ai_intelligence_outputs.lesson_id and l.user_id = (select auth.uid()))
  or exists (select 1 from public.ai_rpa_reports r where r.id = ai_intelligence_outputs.rpa_report_id and r.user_id = (select auth.uid()))
);

create policy ai_intelligence_outputs_insert_owner_or_admin
on public.ai_intelligence_outputs for insert to authenticated
with check (
  (select public.is_admin())
  or user_id = (select auth.uid())
  or exists (select 1 from public.ai_students s where s.id = ai_intelligence_outputs.student_id and s.user_id = (select auth.uid()))
  or exists (select 1 from public.ai_lessons l where l.id = ai_intelligence_outputs.lesson_id and l.user_id = (select auth.uid()))
);

revoke all on table public.hsi_predictive_predictions from anon;
revoke all on table public.ai_intelligence_outputs from anon;

commit;
