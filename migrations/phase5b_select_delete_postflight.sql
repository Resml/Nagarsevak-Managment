-- phase5b_select_delete_postflight.sql
-- Run this AFTER the SELECT/DELETE migration to verify correct application of policies.

DO $$
DECLARE
    v_count INT;
BEGIN
    -- 1. Ensure the 10 legacy ALL policies are gone
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd = 'ALL'
      AND policyname IN (
          'Allow all for everyone',
          'Enable all access for authenticated users on housing_societies',
          'Public Access Letters',
          'Public Access Letter Types',
          'letter_types_tenant_isolation',
          'personal_requests_tenant_isolation',
          'Enable all access for authenticated users',
          'Enable all access for authenticated users on social_organizatio',
          'Public Access Visitors'
      );

    IF v_count > 0 THEN
        RAISE EXCEPTION 'POSTFLIGHT FAIL: Found % remaining legacy ALL policies!', v_count;
    ELSE
        RAISE NOTICE 'POSTFLIGHT PASS: All 10 legacy ALL policies successfully removed.';
    END IF;

    -- 2. Ensure the 18 table-specific Tenant Select/Delete policies exist
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd IN ('SELECT', 'DELETE')
      AND (
          (tablename = 'gb_diary' AND policyname IN ('Tenant Select gb_diary', 'Tenant Delete gb_diary')) OR
          (tablename = 'housing_societies' AND policyname IN ('Tenant Select housing_societies', 'Tenant Delete housing_societies')) OR
          (tablename = 'letter_requests' AND policyname IN ('Auth Letter Select', 'Auth Letter Delete')) OR
          (tablename = 'letter_types' AND policyname IN ('Tenant Select letter_types', 'Tenant Delete letter_types')) OR
          (tablename = 'personal_requests' AND policyname IN ('Tenant Select personal_requests', 'Tenant Delete personal_requests')) OR
          (tablename = 'sadasya' AND policyname IN ('Auth Sadasya Select', 'Auth Sadasya Delete')) OR
          (tablename = 'social_organizations' AND policyname IN ('Tenant Select social_organizations', 'Tenant Delete social_organizations')) OR
          (tablename = 'surveys' AND policyname IN ('Tenant Select surveys', 'Tenant Delete surveys')) OR
          (tablename = 'visitors' AND policyname IN ('Tenant Select visitors', 'Tenant Delete visitors'))
      );

    IF v_count < 18 THEN
        RAISE EXCEPTION 'POSTFLIGHT FAIL: Expected 18 table-specific Select/Delete policies, found %', v_count;
    ELSE
        RAISE NOTICE 'POSTFLIGHT PASS: All 18 table-specific Select/Delete policies successfully provisioned.';
    END IF;

    -- 3. Ensure Anon Survey Select exists with correct casing
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd = 'SELECT'
      AND policyname = 'Anon Survey Select'
      AND tablename = 'surveys'
      AND qual ILIKE '%status = ''Active''%';

    IF v_count = 0 THEN
        RAISE EXCEPTION 'POSTFLIGHT FAIL: Anon Survey Select policy is missing or does not have status = ''Active''!';
    ELSE
        RAISE NOTICE 'POSTFLIGHT PASS: Anon Survey Select policy successfully provisioned.';
    END IF;

END;
$$;
