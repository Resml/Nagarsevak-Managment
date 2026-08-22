-- 1. Verify every tenant's current plan exists in plans
SELECT 
    id, 
    plan 
FROM public.tenants 
WHERE LOWER(plan) NOT IN (SELECT LOWER(plan_key) FROM public.plans);

-- 2. Verify every feature key is represented exactly once
SELECT 
    feature_key, 
    COUNT(*) 
FROM public.features 
GROUP BY feature_key 
HAVING COUNT(*) > 1;

-- 3. Verify total number of mappings per plan
SELECT 
    p.plan_key, 
    COUNT(pf.feature_id) AS total_features 
FROM public.plans p 
LEFT JOIN public.plan_features pf ON p.id = pf.plan_id 
GROUP BY p.plan_key;

-- 4. Verify tenant_feature_overrides counts
SELECT 
    is_enabled, 
    COUNT(*) AS total_overrides 
FROM public.tenant_feature_overrides 
GROUP BY is_enabled;

-- 5. Read-only verification report of effective access
WITH tenant_feature_matrix AS (
    SELECT 
        t.id AS tenant_id,
        t.plan AS current_plan,
        f.feature_key,
        -- Has base access?
        EXISTS (
            SELECT 1 FROM public.plan_features pf
            JOIN public.plans p ON p.id = pf.plan_id
            WHERE LOWER(p.plan_key) = LOWER(t.plan) AND pf.feature_id = f.id AND pf.is_enabled = true
        ) AS has_base_access,
        -- Has override?
        (SELECT is_enabled FROM public.tenant_feature_overrides tfo WHERE tfo.tenant_id = t.id AND tfo.feature_id = f.id) AS override_status
    FROM public.tenants t
    CROSS JOIN public.features f
),
calculated AS (
    SELECT 
        tenant_id,
        current_plan,
        feature_key,
        COALESCE(override_status, has_base_access) AS effective_access,
        has_base_access,
        override_status
    FROM tenant_feature_matrix
)
SELECT 
    tenant_id,
    current_plan,
    COUNT(CASE WHEN has_base_access = true THEN 1 END) AS num_enabled_base_features,
    COUNT(override_status) AS num_overrides,
    jsonb_object_agg(feature_key, effective_access) AS effective_feature_access
FROM calculated
GROUP BY tenant_id, current_plan
ORDER BY current_plan, tenant_id;
