BEGIN;

-- NeuroDrive Phase 1: lesson integrity.
-- Applied to the ENAT HSI production database before the application build change.

ALTER TABLE public.ai_lessons
  DROP CONSTRAINT IF EXISTS ai_lessons_status_check;

ALTER TABLE public.ai_lessons
  ADD CONSTRAINT ai_lessons_status_check
  CHECK (status = ANY (ARRAY['scheduled'::text, 'running'::text, 'paused'::text, 'completed'::text, 'cancelled'::text]));

ALTER TABLE public.ai_lessons
  ADD COLUMN IF NOT EXISTS phase_completed_at timestamptz;

UPDATE public.ai_rpa_reports
SET status = 'EM_FORMACAO'
WHERE status IS NULL OR status = 'rascunho';

ALTER TABLE public.ai_rpa_reports
  ALTER COLUMN status SET DEFAULT 'EM_FORMACAO';

COMMIT;
