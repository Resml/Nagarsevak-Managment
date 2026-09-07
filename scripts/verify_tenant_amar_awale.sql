WITH
t_core AS (
    SELECT
        'V1-V5: TENANT CORE' AS check_group,
        (name = 'Amar Awale' AND plan = 'advance' AND tier = 'nagarsevak' AND subdomain = 'amarawale')::text AS result
    FROM public.tenants
    WHERE subdomain = 'amarawale'
),
t_map AS (
    SELECT
        'V6-V7: USER MAPPING' AS check_group,
        (utm.user_id = '8173f741-bef7-4c78-bf61-603f524338ff' AND utm.role = 'admin' AND count(*) = 1)::text AS result
    FROM public.user_tenant_mapping utm
    JOIN public.tenants t ON t.id = utm.tenant_id
    WHERE t.subdomain = 'amarawale'
    GROUP BY utm.user_id, utm.role
),
t_exist AS (
    SELECT
        'V8: EXISTING TENANTS UNMODIFIED' AS check_group,
        (COUNT(*) = 3)::text AS result
    FROM public.tenants
    WHERE (subdomain = 'krishnaniti' AND plan = 'advance' AND tier = 'nagarsevak')
       OR (subdomain = 'mamit' AND plan = 'advance' AND tier = 'nagarsevak')
       OR (subdomain = 'default' AND tier = 'nagarsevak')
),
t_data AS (
    SELECT
        'V9: ZERO COPIED DATA' AS check_group,
        ((SELECT COUNT(*) FROM public.voters WHERE tenant_id = t.id) +
         (SELECT COUNT(*) FROM public.complaints WHERE tenant_id = t.id) +
         (SELECT COUNT(*) FROM public.letter_requests WHERE tenant_id = t.id) = 0)::text AS result
    FROM public.tenants t
    WHERE subdomain = 'amarawale'
),
t_wa AS (
    SELECT
        'V11: WHATSAPP ISOLATION' AS check_group,
        (COUNT(*) = 0)::text AS result
    FROM public.whatsapp_sessions
    WHERE session_id = 'amarawale'
)
SELECT * FROM t_core
UNION ALL SELECT * FROM t_map
UNION ALL SELECT * FROM t_exist
UNION ALL SELECT * FROM t_data
UNION ALL SELECT * FROM t_wa;
