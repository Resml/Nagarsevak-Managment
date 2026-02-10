-- Create Tenant for Election Results
-- Tenant ID: bf1a3e36-464e-4eff-b21d-dc71f5a5a582

-- Check if tenant already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tenants WHERE id = 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582') THEN
        -- Insert the tenant
        INSERT INTO tenants (id, name, subdomain, created_at, updated_at)
        VALUES (
            'bf1a3e36-464e-4eff-b21d-dc71f5a5a582',
            'Krishna Niti',  -- Change this to the actual tenant name
            'krishnaniti',   -- Change this to the actual subdomain
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Tenant bf1a3e36-464e-4eff-b21d-dc71f5a5a582 created successfully';
    ELSE
        RAISE NOTICE 'Tenant bf1a3e36-464e-4eff-b21d-dc71f5a5a582 already exists';
    END IF;
END $$;

-- Optional: Link a user to this tenant (if needed)
-- Replace 'YOUR_USER_ID' with the actual auth user ID that should have access
-- 
-- DO $$
-- BEGIN
--     IF NOT EXISTS (
--         SELECT 1 FROM user_tenant_mapping 
--         WHERE user_id = 'YOUR_USER_ID' 
--         AND tenant_id = 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582'
--     ) THEN
--         INSERT INTO user_tenant_mapping (user_id, tenant_id, role)
--         VALUES (
--             'YOUR_USER_ID',
--             'bf1a3e36-464e-4eff-b21d-dc71f5a5a582',
--             'admin'
--         );
--         
--         RAISE NOTICE 'User linked to tenant successfully';
--     END IF;
-- END $$;
