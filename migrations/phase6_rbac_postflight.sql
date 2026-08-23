-- =============================================================================
-- PHASE 6 POSTFLIGHT
-- DESCRIPTION: Aborts the CI pipeline if Phase 6 verification failed.
-- =============================================================================

DO $$
DECLARE
    v_fail_count INT;
BEGIN
    SELECT COUNT(*) INTO v_fail_count
    FROM public.phase6_verify_results
    WHERE status = 'FAIL';

    IF v_fail_count > 0 THEN
        RAISE EXCEPTION 'POSTFLIGHT FAILED: % tests failed verification. Check public.phase6_verify_results.', v_fail_count;
    END IF;

    RAISE NOTICE 'POSTFLIGHT PASSED: Phase 6 is completely verified secure.';
END $$;
