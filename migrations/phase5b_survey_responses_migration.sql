-- phase5b_survey_responses_migration.sql
-- Removes the vulnerable and redundant legacy policies while preserving the correct architecture.

BEGIN;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.survey_responses;
DROP POLICY IF EXISTS "Enable insert for public" ON public.survey_responses;

COMMIT;
