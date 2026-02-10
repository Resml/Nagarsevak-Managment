-- Check and fix user access to tenant bf1a3e36-464e-4eff-b21d-dc71f5a5a582

-- Step 1: Check current user-tenant mappings
SELECT 
    utm.user_id,
    utm.tenant_id,
    utm.role,
    t.name as tenant_name,
    au.email
FROM user_tenant_mapping utm
JOIN tenants t ON t.id = utm.tenant_id
LEFT JOIN auth.users au ON au.id = utm.user_id
WHERE utm.tenant_id = 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582';

-- Step 2: Check if election results exist for this tenant
SELECT count(*) as result_count, ward_name
FROM election_results
WHERE tenant_id = 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582'
GROUP BY ward_name;

-- Step 3: Add user to tenant (REPLACE 'YOUR_USER_EMAIL' with actual email you're logged in with)
-- Uncomment and update the email below:

/*
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get user ID by email (replace with the email you're currently logged in with)
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = 'YOUR_USER_EMAIL_HERE';  -- REPLACE THIS!
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found with that email';
    END IF;
    
    -- Insert user-tenant mapping if it doesn't exist
    INSERT INTO user_tenant_mapping (user_id, tenant_id, role)
    VALUES (v_user_id, 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582', 'admin')
    ON CONFLICT (user_id, tenant_id) DO NOTHING;
    
    RAISE NOTICE 'User % linked to tenant successfully', v_user_id;
END $$;
*/

-- Step 4: Verify the mapping was created
SELECT 
    utm.user_id,
    utm.tenant_id,
    utm.role,
    au.email
FROM user_tenant_mapping utm
JOIN auth.users au ON au.id = utm.user_id
WHERE utm.tenant_id = 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582';
