-- ============================================================
-- phase5b_unified_migration.sql
-- Generated strictly from confirmed live pg_policies output.
--
-- Targets: letter_requests, sadasya, letter_types, personal_requests
-- DO NOT EXECUTE until postflight is reviewed.
-- Idempotent: all DROPs use IF EXISTS.
--
-- WHAT THIS MIGRATION DOES:
--
-- Phase 5B requires feature entitlement (has_member_feature_access)
-- on ALL operations (SELECT, INSERT, UPDATE, DELETE).
-- The existing SELECT/DELETE policies were found to omit this check,
-- so they are being completely replaced with Unified policies.
--
-- letter_requests:
--   DROP: Auth Letter Select/Insert/Update/Delete
--   DROP: Tenant Isolation Select/Insert/Update/Delete
--   DROP: Public Access Letters_ins/upd
--   CREATE: Unified Letter Select/Insert/Update/Delete (all enforce feature access; Insert/Update enforce FK spoofing)
--
-- sadasya:
--   DROP: Auth Sadasya Select/Insert/Update/Delete
--   DROP: Tenant Isolation Select/Insert/Update/Delete
--   DROP: Enable all access for authenticated users_ins/upd
--   DROP: Enable read access for all users of same tenant
--   CREATE: Unified Sadasya Select/Insert/Update/Delete
--
-- letter_types:
--   DROP: Tenant Select/Delete letter_types
--   DROP: Tenant Isolation Select/Delete (if any)
--   DROP: Public Access Letter Types_ins/upd
--   DROP: letter_types_tenant_isolation_ins/upd
--   DROP: Tenant Isolation Insert/Update (lacks feature access)
--   CREATE: Unified Letter Types Select/Insert/Update/Delete (enforces feature access)
--
-- personal_requests:
--   DROP: Tenant Select/Delete personal_requests
--   DROP: Tenant Isolation Select/Delete (if any)
--   DROP: personal_requests_tenant_isolation_ins/upd
--   DROP: Tenant Isolation Insert/Update (lacks feature access)
--   CREATE: Unified Personal Requests Select/Insert/Update/Delete (enforces feature access)
-- ============================================================

BEGIN;

-- ============================================================
-- PREFLIGHT SAFETY GUARDS
-- Ensure the known live policies exist before we begin.
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'letter_requests' AND policyname = 'Auth Letter Select' AND cmd = 'SELECT') THEN
        RAISE EXCEPTION 'SAFETY ABORT: Auth Letter Select missing on letter_requests.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sadasya' AND policyname = 'Auth Sadasya Select' AND cmd = 'SELECT') THEN
        RAISE EXCEPTION 'SAFETY ABORT: Auth Sadasya Select missing on sadasya.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'letter_types' AND policyname = 'Tenant Select letter_types' AND cmd = 'SELECT') THEN
        RAISE EXCEPTION 'SAFETY ABORT: Tenant Select letter_types missing on letter_types.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'personal_requests' AND policyname = 'Tenant Select personal_requests' AND cmd = 'SELECT') THEN
        RAISE EXCEPTION 'SAFETY ABORT: Tenant Select personal_requests missing on personal_requests.';
    END IF;

    RAISE NOTICE 'All safety guards passed. Proceeding with migration.';
END;
$$;


-- ============================================================
-- 1. letter_requests
-- ============================================================

DROP POLICY IF EXISTS "Auth Letter Select"           ON public.letter_requests;
DROP POLICY IF EXISTS "Auth Letter Insert"           ON public.letter_requests;
DROP POLICY IF EXISTS "Auth Letter Update"           ON public.letter_requests;
DROP POLICY IF EXISTS "Auth Letter Delete"           ON public.letter_requests;
DROP POLICY IF EXISTS "Tenant Isolation Select"      ON public.letter_requests;
DROP POLICY IF EXISTS "Tenant Isolation Insert"      ON public.letter_requests;
DROP POLICY IF EXISTS "Tenant Isolation Update"      ON public.letter_requests;
DROP POLICY IF EXISTS "Tenant Isolation Delete"      ON public.letter_requests;
DROP POLICY IF EXISTS "Public Access Letters_ins"    ON public.letter_requests;
DROP POLICY IF EXISTS "Public Access Letters_upd"    ON public.letter_requests;

DROP POLICY IF EXISTS "Unified Letter Select"        ON public.letter_requests;
DROP POLICY IF EXISTS "Unified Letter Insert"        ON public.letter_requests;
DROP POLICY IF EXISTS "Unified Letter Update"        ON public.letter_requests;
DROP POLICY IF EXISTS "Unified Letter Delete"        ON public.letter_requests;

CREATE POLICY "Unified Letter Select" ON public.letter_requests
    FOR SELECT TO authenticated
    USING (
        tenant_id IN (SELECT public.get_authorized_tenants())
        AND public.has_member_feature_access(tenant_id, auth.uid(), 'letters')
    );

CREATE POLICY "Unified Letter Delete" ON public.letter_requests
    FOR DELETE TO authenticated
    USING (
        tenant_id IN (SELECT public.get_authorized_tenants())
        AND public.has_member_feature_access(tenant_id, auth.uid(), 'letters')
    );

CREATE POLICY "Unified Letter Insert" ON public.letter_requests
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id IN (SELECT public.get_authorized_tenants())
        AND public.has_member_feature_access(tenant_id, auth.uid(), 'letters')
        AND (
            voter_id IS NULL
            OR tenant_id = (
                SELECT v.tenant_id FROM public.voters v
                WHERE v.id::text = letter_requests.voter_id::text
            )
        )
    );

CREATE POLICY "Unified Letter Update" ON public.letter_requests
    FOR UPDATE TO authenticated
    USING (
        tenant_id IN (SELECT public.get_authorized_tenants())
        AND public.has_member_feature_access(tenant_id, auth.uid(), 'letters')
    )
    WITH CHECK (
        tenant_id IN (SELECT public.get_authorized_tenants())
        AND public.has_member_feature_access(tenant_id, auth.uid(), 'letters')
        AND (
            voter_id IS NULL
            OR tenant_id = (
                SELECT v.tenant_id FROM public.voters v
                WHERE v.id::text = letter_requests.voter_id::text
            )
        )
    );


-- ============================================================
-- 2. sadasya
-- ============================================================

DROP POLICY IF EXISTS "Auth Sadasya Select"                           ON public.sadasya;
DROP POLICY IF EXISTS "Auth Sadasya Insert"                           ON public.sadasya;
DROP POLICY IF EXISTS "Auth Sadasya Update"                           ON public.sadasya;
DROP POLICY IF EXISTS "Auth Sadasya Delete"                           ON public.sadasya;
DROP POLICY IF EXISTS "Tenant Isolation Select"                       ON public.sadasya;
DROP POLICY IF EXISTS "Tenant Isolation Insert"                       ON public.sadasya;
DROP POLICY IF EXISTS "Tenant Isolation Update"                       ON public.sadasya;
DROP POLICY IF EXISTS "Tenant Isolation Delete"                       ON public.sadasya;
DROP POLICY IF EXISTS "Enable all access for authenticated users_ins" ON public.sadasya;
DROP POLICY IF EXISTS "Enable all access for authenticated users_upd" ON public.sadasya;
DROP POLICY IF EXISTS "Enable read access for all users of same tenant" ON public.sadasya;

DROP POLICY IF EXISTS "Unified Sadasya Select"                        ON public.sadasya;
DROP POLICY IF EXISTS "Unified Sadasya Insert"                        ON public.sadasya;
DROP POLICY IF EXISTS "Unified Sadasya Update"                        ON public.sadasya;
DROP POLICY IF EXISTS "Unified Sadasya Delete"                        ON public.sadasya;

CREATE POLICY "Unified Sadasya Select" ON public.sadasya
    FOR SELECT TO authenticated
    USING (
        tenant_id IN (SELECT public.get_authorized_tenants())
        AND public.has_member_feature_access(tenant_id, auth.uid(), 'sadasya')
    );

CREATE POLICY "Unified Sadasya Delete" ON public.sadasya
    FOR DELETE TO authenticated
    USING (
        tenant_id IN (SELECT public.get_authorized_tenants())
        AND public.has_member_feature_access(tenant_id, auth.uid(), 'sadasya')
    );

CREATE POLICY "Unified Sadasya Insert" ON public.sadasya
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id IN (SELECT public.get_authorized_tenants())
        AND public.has_member_feature_access(tenant_id, auth.uid(), 'sadasya')
        AND (
            linked_voter_id IS NULL
            OR tenant_id = (
                SELECT v.tenant_id FROM public.voters v
                WHERE v.id = sadasya.linked_voter_id
            )
        )
    );

CREATE POLICY "Unified Sadasya Update" ON public.sadasya
    FOR UPDATE TO authenticated
    USING (
        tenant_id IN (SELECT public.get_authorized_tenants())
        AND public.has_member_feature_access(tenant_id, auth.uid(), 'sadasya')
    )
    WITH CHECK (
        tenant_id IN (SELECT public.get_authorized_tenants())
        AND public.has_member_feature_access(tenant_id, auth.uid(), 'sadasya')
        AND (
            linked_voter_id IS NULL
            OR tenant_id = (
                SELECT v.tenant_id FROM public.voters v
                WHERE v.id = sadasya.linked_voter_id
            )
        )
    );


-- ============================================================
-- 3. letter_types
-- ============================================================

DROP POLICY IF EXISTS "Tenant Select letter_types"             ON public.letter_types;
DROP POLICY IF EXISTS "Tenant Delete letter_types"             ON public.letter_types;
DROP POLICY IF EXISTS "Tenant Isolation Select"                ON public.letter_types;
DROP POLICY IF EXISTS "Tenant Isolation Delete"                ON public.letter_types;
DROP POLICY IF EXISTS "Tenant Isolation Insert"                ON public.letter_types;
DROP POLICY IF EXISTS "Tenant Isolation Update"                ON public.letter_types;
DROP POLICY IF EXISTS "Public Access Letter Types_ins"         ON public.letter_types;
DROP POLICY IF EXISTS "Public Access Letter Types_upd"         ON public.letter_types;
DROP POLICY IF EXISTS "letter_types_tenant_isolation_ins"      ON public.letter_types;
DROP POLICY IF EXISTS "letter_types_tenant_isolation_upd"      ON public.letter_types;

DROP POLICY IF EXISTS "Unified Letter Types Select"            ON public.letter_types;
DROP POLICY IF EXISTS "Unified Letter Types Delete"            ON public.letter_types;
DROP POLICY IF EXISTS "Unified Letter Types Insert"            ON public.letter_types;
DROP POLICY IF EXISTS "Unified Letter Types Update"            ON public.letter_types;

CREATE POLICY "Unified Letter Types Select" ON public.letter_types
    FOR SELECT TO authenticated
    USING (
        tenant_id IN (SELECT public.get_authorized_tenants())
        AND public.has_member_feature_access(tenant_id, auth.uid(), 'letters')
    );

CREATE POLICY "Unified Letter Types Delete" ON public.letter_types
    FOR DELETE TO authenticated
    USING (
        tenant_id IN (SELECT public.get_authorized_tenants())
        AND public.has_member_feature_access(tenant_id, auth.uid(), 'letters')
    );

CREATE POLICY "Unified Letter Types Insert" ON public.letter_types
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id IN (SELECT public.get_authorized_tenants())
        AND public.has_member_feature_access(tenant_id, auth.uid(), 'letters')
    );

CREATE POLICY "Unified Letter Types Update" ON public.letter_types
    FOR UPDATE TO authenticated
    USING (
        tenant_id IN (SELECT public.get_authorized_tenants())
        AND public.has_member_feature_access(tenant_id, auth.uid(), 'letters')
    )
    WITH CHECK (
        tenant_id IN (SELECT public.get_authorized_tenants())
        AND public.has_member_feature_access(tenant_id, auth.uid(), 'letters')
    );


-- ============================================================
-- 4. personal_requests
-- ============================================================

DROP POLICY IF EXISTS "Tenant Select personal_requests"        ON public.personal_requests;
DROP POLICY IF EXISTS "Tenant Delete personal_requests"        ON public.personal_requests;
DROP POLICY IF EXISTS "Tenant Isolation Select"                ON public.personal_requests;
DROP POLICY IF EXISTS "Tenant Isolation Delete"                ON public.personal_requests;
DROP POLICY IF EXISTS "Tenant Isolation Insert"                ON public.personal_requests;
DROP POLICY IF EXISTS "Tenant Isolation Update"                ON public.personal_requests;
DROP POLICY IF EXISTS "personal_requests_tenant_isolation_ins" ON public.personal_requests;
DROP POLICY IF EXISTS "personal_requests_tenant_isolation_upd" ON public.personal_requests;

DROP POLICY IF EXISTS "Unified Personal Requests Select"       ON public.personal_requests;
DROP POLICY IF EXISTS "Unified Personal Requests Delete"       ON public.personal_requests;
DROP POLICY IF EXISTS "Unified Personal Requests Insert"       ON public.personal_requests;
DROP POLICY IF EXISTS "Unified Personal Requests Update"       ON public.personal_requests;

CREATE POLICY "Unified Personal Requests Select" ON public.personal_requests
    FOR SELECT TO authenticated
    USING (
        tenant_id IN (SELECT public.get_authorized_tenants())
        AND public.has_member_feature_access(tenant_id, auth.uid(), 'complaints')
    );

CREATE POLICY "Unified Personal Requests Delete" ON public.personal_requests
    FOR DELETE TO authenticated
    USING (
        tenant_id IN (SELECT public.get_authorized_tenants())
        AND public.has_member_feature_access(tenant_id, auth.uid(), 'complaints')
    );

CREATE POLICY "Unified Personal Requests Insert" ON public.personal_requests
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id IN (SELECT public.get_authorized_tenants())
        AND public.has_member_feature_access(tenant_id, auth.uid(), 'complaints')
    );

CREATE POLICY "Unified Personal Requests Update" ON public.personal_requests
    FOR UPDATE TO authenticated
    USING (
        tenant_id IN (SELECT public.get_authorized_tenants())
        AND public.has_member_feature_access(tenant_id, auth.uid(), 'complaints')
    )
    WITH CHECK (
        tenant_id IN (SELECT public.get_authorized_tenants())
        AND public.has_member_feature_access(tenant_id, auth.uid(), 'complaints')
    );

COMMIT;
