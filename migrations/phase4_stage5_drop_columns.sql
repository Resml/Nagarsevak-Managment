BEGIN;

-- =============================================================================
-- Phase 4 Stage 5: Pre-Drop Policy Fix + Drop Legacy Columns
--
-- ROOT CAUSE: Phase 4 Stage 3 re-created "Tenant Isolation Update" policies
-- that still reference plan and category columns on child tables.
-- Those policies must be dropped/replaced BEFORE the columns can be dropped.
--
-- This migration:
--   1. Drops the legacy plan/category-referencing UPDATE policies on all 28 tables
--   2. Re-creates them as clean tenant-isolation-only + has_feature_access() policies
--   3. Drops the plan column from all 28 tables
--   4. Drops the category column from the 22 non-domain tables
--   5. Preserves category on: gallery, complaints, schemes, staff, ward_provisions, personal_requests
-- =============================================================================

-- -----------------------------------------------------------------------
-- STEP 1: Replace legacy UPDATE policies (that reference plan/category)
-- with clean policies that use only tenant_id + has_feature_access()
-- -----------------------------------------------------------------------

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."ai_history";
CREATE POLICY "Tenant Isolation Update" ON public."ai_history"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'ai_content'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."event_rsvps";
CREATE POLICY "Tenant Isolation Update" ON public."event_rsvps"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'events'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."events";
CREATE POLICY "Tenant Isolation Update" ON public."events"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'events'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."gallery";
CREATE POLICY "Tenant Isolation Update" ON public."gallery"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'gallery'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."gb_diary";
CREATE POLICY "Tenant Isolation Update" ON public."gb_diary"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'gb_register'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."housing_societies";
CREATE POLICY "Tenant Isolation Update" ON public."housing_societies"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'housing_societies'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."improvements";
CREATE POLICY "Tenant Isolation Update" ON public."improvements"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'improvements'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."incoming_letters";
CREATE POLICY "Tenant Isolation Update" ON public."incoming_letters"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'letters'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."letter_requests";
CREATE POLICY "Tenant Isolation Update" ON public."letter_requests"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'letters'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."letter_types";
CREATE POLICY "Tenant Isolation Update" ON public."letter_types"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'letters'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."message_logs";
CREATE POLICY "Tenant Isolation Update" ON public."message_logs"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'public_comm'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."non_voters";
CREATE POLICY "Tenant Isolation Update" ON public."non_voters"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'voters'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."personal_requests";
CREATE POLICY "Tenant Isolation Update" ON public."personal_requests"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'complaints'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."sadasya";
CREATE POLICY "Tenant Isolation Update" ON public."sadasya"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'sadasya'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."schemes";
CREATE POLICY "Tenant Isolation Update" ON public."schemes"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'schemes'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."social_organizations";
CREATE POLICY "Tenant Isolation Update" ON public."social_organizations"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'social_organizations'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."staff";
CREATE POLICY "Tenant Isolation Update" ON public."staff"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'staff'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."survey_responses";
CREATE POLICY "Tenant Isolation Update" ON public."survey_responses"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'surveys'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."surveys";
CREATE POLICY "Tenant Isolation Update" ON public."surveys"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'surveys'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."visitors";
CREATE POLICY "Tenant Isolation Update" ON public."visitors"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'visitors'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."voters";
CREATE POLICY "Tenant Isolation Update" ON public."voters"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'voters'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."ward_provisions";
CREATE POLICY "Tenant Isolation Update" ON public."ward_provisions"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'provision'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."work_trackers";
CREATE POLICY "Tenant Isolation Update" ON public."work_trackers"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'work_history'))
  );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."works";
CREATE POLICY "Tenant Isolation Update" ON public."works"
  FOR UPDATE TO public
  USING (
    (tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))
     OR EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE user_tenant_mapping.user_id = auth.uid() AND user_tenant_mapping.role = 'super_admin'))
    AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'work_history'))
  );

-- election_results has no plan/category in its Update policy per Stage 3, but drop/recreate for safety
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."election_results";
-- (no legacy plan/category reference on election_results Update - no recreate needed)

-- -----------------------------------------------------------------------
-- STEP 2: Drop 'plan' from all 28 legacy tables
-- -----------------------------------------------------------------------
ALTER TABLE public.ai_history DROP COLUMN IF EXISTS plan;
ALTER TABLE public.complaints DROP COLUMN IF EXISTS plan;
ALTER TABLE public.election_results DROP COLUMN IF EXISTS plan;
ALTER TABLE public.event_rsvps DROP COLUMN IF EXISTS plan;
ALTER TABLE public.events DROP COLUMN IF EXISTS plan;
ALTER TABLE public.gallery DROP COLUMN IF EXISTS plan;
ALTER TABLE public.gb_diary DROP COLUMN IF EXISTS plan;
ALTER TABLE public.housing_societies DROP COLUMN IF EXISTS plan;
ALTER TABLE public.improvements DROP COLUMN IF EXISTS plan;
ALTER TABLE public.incoming_letters DROP COLUMN IF EXISTS plan;
ALTER TABLE public.letter_requests DROP COLUMN IF EXISTS plan;
ALTER TABLE public.letter_types DROP COLUMN IF EXISTS plan;
ALTER TABLE public.message_logs DROP COLUMN IF EXISTS plan;
ALTER TABLE public.non_voters DROP COLUMN IF EXISTS plan;
ALTER TABLE public.personal_requests DROP COLUMN IF EXISTS plan;
ALTER TABLE public.sadasya DROP COLUMN IF EXISTS plan;
ALTER TABLE public.schemes DROP COLUMN IF EXISTS plan;
ALTER TABLE public.social_organizations DROP COLUMN IF EXISTS plan;
ALTER TABLE public.staff DROP COLUMN IF EXISTS plan;
ALTER TABLE public.survey_responses DROP COLUMN IF EXISTS plan;
ALTER TABLE public.surveys DROP COLUMN IF EXISTS plan;
ALTER TABLE public.tasks DROP COLUMN IF EXISTS plan;
ALTER TABLE public.visitors DROP COLUMN IF EXISTS plan;
ALTER TABLE public.voter_applications DROP COLUMN IF EXISTS plan;
ALTER TABLE public.voters DROP COLUMN IF EXISTS plan;
ALTER TABLE public.ward_provisions DROP COLUMN IF EXISTS plan;
ALTER TABLE public.work_trackers DROP COLUMN IF EXISTS plan;
ALTER TABLE public.works DROP COLUMN IF EXISTS plan;

-- -----------------------------------------------------------------------
-- STEP 3: Drop 'category' from the 22 non-domain tables
-- PRESERVED on: gallery, complaints, schemes, staff, ward_provisions, personal_requests
-- -----------------------------------------------------------------------
ALTER TABLE public.ai_history DROP COLUMN IF EXISTS category;
ALTER TABLE public.election_results DROP COLUMN IF EXISTS category;
ALTER TABLE public.event_rsvps DROP COLUMN IF EXISTS category;
ALTER TABLE public.events DROP COLUMN IF EXISTS category;
ALTER TABLE public.gb_diary DROP COLUMN IF EXISTS category;
ALTER TABLE public.housing_societies DROP COLUMN IF EXISTS category;
ALTER TABLE public.improvements DROP COLUMN IF EXISTS category;
ALTER TABLE public.incoming_letters DROP COLUMN IF EXISTS category;
ALTER TABLE public.letter_requests DROP COLUMN IF EXISTS category;
ALTER TABLE public.letter_types DROP COLUMN IF EXISTS category;
ALTER TABLE public.message_logs DROP COLUMN IF EXISTS category;
ALTER TABLE public.non_voters DROP COLUMN IF EXISTS category;
ALTER TABLE public.sadasya DROP COLUMN IF EXISTS category;
ALTER TABLE public.social_organizations DROP COLUMN IF EXISTS category;
ALTER TABLE public.survey_responses DROP COLUMN IF EXISTS category;
ALTER TABLE public.surveys DROP COLUMN IF EXISTS category;
ALTER TABLE public.tasks DROP COLUMN IF EXISTS category;
ALTER TABLE public.visitors DROP COLUMN IF EXISTS category;
ALTER TABLE public.voter_applications DROP COLUMN IF EXISTS category;
ALTER TABLE public.voters DROP COLUMN IF EXISTS category;
ALTER TABLE public.work_trackers DROP COLUMN IF EXISTS category;
ALTER TABLE public.works DROP COLUMN IF EXISTS category;

COMMIT;
