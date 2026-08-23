-- phase5b_survey_responses_postflight.sql
-- Verifies the successful removal of vulnerable policies and the integrity of the remaining architecture.

DO $$
DECLARE
    v_count INT;
    v_with_check TEXT;
BEGIN
    -- 1. Verify unwanted policies are absent
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'survey_responses'
      AND policyname IN (
          'Enable insert for authenticated users',
          'Enable insert for public'
      );
      
    IF v_count > 0 THEN
        RAISE EXCEPTION 'Verification Failed: Unwanted policies were not dropped successfully.';
    END IF;

    -- 2. Verify Anon Survey Insert exists exactly once
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'survey_responses'
      AND policyname = 'Anon Survey Insert'
      AND cmd = 'INSERT';

    IF v_count != 1 THEN
        RAISE EXCEPTION 'Verification Failed: Anon Survey Insert must exist exactly once, found %', v_count;
    END IF;

    -- 3. Verify Anon Survey Insert contains get_survey_tenant in WITH CHECK
    SELECT with_check INTO v_with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'survey_responses'
      AND policyname = 'Anon Survey Insert'
      AND cmd = 'INSERT';

    IF v_with_check NOT ILIKE '%get_survey_tenant%' THEN
        RAISE EXCEPTION 'Verification Failed: Anon Survey Insert WITH CHECK missing get_survey_tenant. Found: %', v_with_check;
    END IF;

    -- 4. Verify Tenant Isolation Insert exists and contains has_member_feature_access
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'survey_responses'
      AND policyname = 'Tenant Isolation Insert'
      AND cmd = 'INSERT'
      AND with_check ILIKE '%has_member_feature_access%';

    IF v_count != 1 THEN
        RAISE EXCEPTION 'Verification Failed: Tenant Isolation Insert with has_member_feature_access is missing or improperly defined.';
    END IF;

    -- 5. List all remaining INSERT policies as a final sanity check
    RAISE NOTICE 'Remaining INSERT policies on survey_responses:';
    FOR v_with_check IN 
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'survey_responses' AND cmd = 'INSERT'
    LOOP
        RAISE NOTICE ' - %', v_with_check;
    END LOOP;

    RAISE NOTICE 'survey_responses postflight verified successfully.';
END;
$$;
