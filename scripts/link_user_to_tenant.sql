-- Link user to tenant bf1a3e36-464e-4eff-b21d-dc71f5a5a582
-- REPLACE 'YOUR_EMAIL_HERE' with the email you're logged in with

DO $$
DECLARE
    v_user_id UUID;
    v_existing_count INT;
BEGIN
    -- Get user ID by email
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = 'krishnaniti123@gmail.com';  -- REPLACE THIS WITH YOUR EMAIL!
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found with email';
    END IF;
    
    -- Check if mapping already exists
    SELECT COUNT(*) INTO v_existing_count
    FROM user_tenant_mapping
    WHERE user_id = v_user_id 
    AND tenant_id = 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582';
    
    IF v_existing_count > 0 THEN
        RAISE NOTICE 'User % is already linked to this tenant', v_user_id;
    ELSE
        -- Insert new mapping
        INSERT INTO user_tenant_mapping (user_id, tenant_id, role)
        VALUES (v_user_id, 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582', 'admin');
        
        RAISE NOTICE 'User % linked to tenant successfully', v_user_id;
    END IF;
END $$;

-- Verify the mapping
SELECT 
    utm.user_id,
    utm.tenant_id,
    utm.role,
    au.email
FROM user_tenant_mapping utm
JOIN auth.users au ON au.id = utm.user_id
WHERE utm.tenant_id = 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582';
