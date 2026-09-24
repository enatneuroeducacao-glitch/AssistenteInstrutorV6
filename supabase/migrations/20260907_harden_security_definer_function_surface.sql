-- Security hardening applied to production project gicjsuagmiyoqvttbqjw.
-- Keep API-callable functions explicit; trigger-only functions are not remotely executable.

revoke execute on function public.enat_log_central_change() from anon, authenticated, public;
revoke execute on function public.enat_trigger_subscription_reward() from anon, authenticated, public;
revoke execute on function public.handle_new_ai_profile() from anon, authenticated, public;
revoke execute on function public.handle_new_ai_user() from anon, authenticated, public;
revoke execute on function public.sync_admin_access_with_subscription() from anon, authenticated, public;
revoke execute on function public.sync_lesson_category_and_rpa() from anon, authenticated, public;
revoke execute on function public.sync_student_category_plan_from_contract_item() from anon, authenticated, public;

revoke execute on function public.admin_get_instructor_profile(uuid) from anon, public;
revoke execute on function public.admin_get_overview() from anon, public;
revoke execute on function public.admin_get_municipality_summary(text) from anon, public;
revoke execute on function public.admin_get_organization_summary(uuid) from anon, public;
revoke execute on function public.admin_get_risk_distribution() from anon, public;
revoke execute on function public.admin_get_state_summary(text) from anon, public;
revoke execute on function public.admin_get_temporal_analysis(timestamptz,timestamptz) from anon, public;
revoke execute on function public.admin_get_trigger_summary() from anon, public;
revoke execute on function public.admin_get_professional_dashboard() from anon, public;
revoke execute on function public.admin_list_access_users(text) from anon, public;
revoke execute on function public.admin_list_instructor_ufs() from anon, public;
revoke execute on function public.admin_list_instructors_by_uf(text) from anon, public;
revoke execute on function public.admin_grant_free_access(text,timestamptz,text) from anon, public;
revoke execute on function public.admin_revoke_free_access(uuid) from anon, public;

revoke execute on function public.get_student_category_availability(uuid) from anon, public;
revoke execute on function public.get_student_rpa_summary(uuid) from anon, public;

revoke execute on function public.ai_is_admin() from anon, public;
revoke execute on function public.ai_license_status() from anon, public;
revoke execute on function public.is_ai_admin() from anon, public;
revoke execute on function cmnt_core.has_role(uuid,text) from anon, public;
