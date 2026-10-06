alter table public.neurodrive_course_access_tokens
  add column if not exists access_scope text not null default 'course';

alter table public.neurodrive_course_access_tokens
  alter column course_id drop not null;

create index if not exists idx_neurodrive_course_access_scope
  on public.neurodrive_course_access_tokens(access_scope);

notify pgrst, 'reload schema';