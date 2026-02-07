-- ==========================================
-- SCRIPT TO ASSIGN ALL DATA TO A SPECIFIC USER
-- Run this in Supabase SQL Editor
-- ==========================================

DO $$ 
DECLARE
    -- INPUT: The User UID you want to assign everything to
    target_user_id uuid := 'd90b8574-41ea-42f4-8807-a5ec1796683b'; 
    
    target_tenant_id uuid;
BEGIN
    -- 1. Find the Tenant ID for this User
    SELECT tenant_id INTO target_tenant_id
    FROM user_tenant_mapping
    WHERE user_id = target_user_id;

    IF target_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No tenant found for User ID %. Please run the create_tenant_user_helper script first.', target_user_id;
    END IF;

    RAISE NOTICE 'Assigning all data to Tenant ID: % (User: %)', target_tenant_id, target_user_id;

    -- 2. Update Tables
    -- We update where tenant_id is NOT the target (or is null), ensuring everything moves to the new owner.
    
    -- Voters
    BEGIN
        UPDATE voters SET tenant_id = target_tenant_id;
        RAISE NOTICE 'Updated Voters';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Skipped Voters (Table not found)';
    END;

    -- Complaints
    BEGIN
        UPDATE complaints SET tenant_id = target_tenant_id;
        RAISE NOTICE 'Updated Complaints';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Skipped Complaints (Table not found)';
    END;

    -- Letters
    BEGIN
        UPDATE letter_requests SET tenant_id = target_tenant_id;
        RAISE NOTICE 'Updated Letter Requests';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Skipped Letter Requests (Table not found)';
    END;

    -- Diary
    BEGIN
        UPDATE gb_diary SET tenant_id = target_tenant_id;
        RAISE NOTICE 'Updated Diary';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Skipped Diary (Table not found)';
    END;

    -- Gallery
    BEGIN
        UPDATE gallery SET tenant_id = target_tenant_id;
        RAISE NOTICE 'Updated Gallery';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Skipped Gallery (Table not found)';
    END;

    -- Works
    BEGIN
        UPDATE works SET tenant_id = target_tenant_id;
        RAISE NOTICE 'Updated Works';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Skipped Works (Table not found)';
    END;

    -- Events
    BEGIN
        UPDATE events SET tenant_id = target_tenant_id;
        RAISE NOTICE 'Updated Events';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Skipped Events (Table not found)';
    END;

    -- Schemes
    BEGIN
        UPDATE schemes SET tenant_id = target_tenant_id;
        RAISE NOTICE 'Updated Schemes';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Skipped Schemes (Table not found)';
    END;

    -- Visitors (if table exists and has user_id/tenant_id)
    BEGIN
        UPDATE visitors SET tenant_id = target_tenant_id;
        RAISE NOTICE 'Updated Visitors';
    EXCEPTION 
        WHEN undefined_table THEN
            RAISE NOTICE 'Skipped Visitors (Table not found)';
        WHEN undefined_column THEN
            RAISE NOTICE 'Skipped Visitors (Column tenant_id not found)';
        WHEN OTHERS THEN
            RAISE NOTICE 'Skipped Visitors (Unknown Error: %)', SQLERRM;
    END;

    RAISE NOTICE 'SUCCESS: All data has been moved to the new User/Tenant.';

END $$;
