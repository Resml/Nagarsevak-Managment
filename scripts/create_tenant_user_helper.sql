-- ==========================================
-- SCRIPT TO CREATE NEW TENANT & USER LINK
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Create the Auth User FIRST using the Supabase Dashboard "Authentication" -> "Users" -> "Invite" or "Create New User".
--    Take note of the User UID (e.g. 'a0eebc99-9c0b...').

-- 2. Run this script, replacing specific values:

DO $$ 
DECLARE
    new_tenant_id uuid;
    
    -- INPUTS: CHANGE THESE
    target_user_id uuid := 'd90b8574-41ea-42f4-8807-a5ec1796683b'; 
    new_tenant_name text := 'New Nagarsevak Name'; -- CHANGE THIS to the actual name
    new_subdomain text := 'newnagarsevak'; -- CHANGE THIS to a unique subdomain (e.g. 'patil')
    
BEGIN

    -- A. Create the Tenant
    INSERT INTO tenants (name, subdomain)
    VALUES (new_tenant_name, new_subdomain)
    RETURNING id INTO new_tenant_id;
    
    RAISE NOTICE 'Created Tenant: % (ID: %)', new_tenant_name, new_tenant_id;

    -- B. Link User to Tenant
    INSERT INTO user_tenant_mapping (user_id, tenant_id, role)
    VALUES (target_user_id, new_tenant_id, 'admin');
    
    RAISE NOTICE 'Linked User % to Tenant %', target_user_id, new_tenant_id;

END $$;
