BEGIN;

-- Drop function
DROP FUNCTION IF EXISTS public.has_feature_access(uuid, text);

-- Drop indexes
DROP INDEX IF EXISTS public.idx_plans_key;
DROP INDEX IF EXISTS public.idx_features_key;
DROP INDEX IF EXISTS public.idx_pf_plan_feature;
DROP INDEX IF EXISTS public.idx_tfo_tenant_feature;

-- Drop tables
DROP TABLE IF EXISTS public.tenant_feature_overrides;
DROP TABLE IF EXISTS public.plan_features;
DROP TABLE IF EXISTS public.plans;
DROP TABLE IF EXISTS public.features;

COMMIT;
