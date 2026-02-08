/*
  Script to copy data from a source tenant to new tenants.
  
  INSTRUCTIONS:
  1. Replace 'YOUR_SOURCE_TENANT_ID' with the UUID of the tenant you want to copy FROM.
  2. Replace the IDs in the 'target_tenant_ids' array with the UUIDs of the tenants you want to copy TO.
  3. Run this script in your Supabase SQL Editor.
*/

DO $$
DECLARE
    -- Replace this with your actual Source Tenant ID
    source_tenant_id UUID := 'd90b8574-41ea-42f4-8807-a5ec1796683b'; 
    
    -- Replace these with your actual Target Tenant IDs
    target_tenant_ids UUID[] := ARRAY[
        'bf1a3e36-464e-4eff-b21d-dc71f5a5a582'
    ]::UUID[]; 
    
    target_id UUID;
BEGIN
    FOREACH target_id IN ARRAY target_tenant_ids
    LOOP
        RAISE NOTICE 'Copying data to tenant: %', target_id;

        -- 1. Copy GB Diary
        INSERT INTO gb_diary (
            meeting_date, meeting_type, subject, description, 
            department, status, beneficiaries, response, tags, 
            created_at, updated_at, tenant_id
        )
        SELECT 
            meeting_date, meeting_type, subject, description, 
            department, status, beneficiaries, response, tags, 
            created_at, updated_at, target_id
        FROM gb_diary
        WHERE tenant_id = source_tenant_id;

        -- 2. Copy Ward Provisions
        INSERT INTO ward_provisions (
            title, description, requested_amount, sanctioned_amount, 
            requested_date, sanctioned_date, status, financial_year, category,
            letter_reference, metadata, created_at, tenant_id
        )
        SELECT 
            title, description, requested_amount, sanctioned_amount, 
            requested_date, sanctioned_date, status, financial_year, category,
            letter_reference, metadata, created_at, target_id
        FROM ward_provisions
        WHERE tenant_id = source_tenant_id;

        -- 3. Copy Events
        INSERT INTO events (
            title, description, event_date, event_time, location, 
            type, status, area, target_audience, image_url, 
            created_at, updated_at, tenant_id
        )
        SELECT 
            title, description, event_date, event_time, location, 
            type, status, area, target_audience, image_url, 
            created_at, updated_at, target_id
        FROM events
        WHERE tenant_id = source_tenant_id;

        -- 4. Copy Visitors
        INSERT INTO visitors (
            name, mobile, purpose, reference, area, remarks, visit_date,
            created_at, updated_at, tenant_id
        )
        SELECT 
            name, mobile, purpose, reference, area, remarks, visit_date,
            created_at, updated_at, target_id
        FROM visitors
        WHERE tenant_id = source_tenant_id;

        -- 5. Copy Letter Requests
        INSERT INTO letter_requests (
            user_id, type, details, status, pdf_url, area, 
            created_at, updated_at, tenant_id
        )
        SELECT 
            user_id, type, details, status, pdf_url, area, 
            created_at, updated_at, target_id
        FROM letter_requests
        WHERE tenant_id = source_tenant_id;

        -- 6. Copy Incoming Letters
        INSERT INTO incoming_letters (
            title, sender_name, received_date, description, area, 
            file_type, scanned_file_url, created_at, updated_at, tenant_id
        )
        SELECT 
            title, sender_name, received_date, description, area, 
            file_type, scanned_file_url, created_at, updated_at, target_id
        FROM incoming_letters
        WHERE tenant_id = source_tenant_id;

        -- 7. Copy Schemes
        INSERT INTO schemes (
            name, description, eligibility, benefits, documents, 
            created_at, updated_at, tenant_id
        )
        SELECT 
            name, description, eligibility, benefits, documents, 
            created_at, updated_at, target_id
        FROM schemes
        WHERE tenant_id = source_tenant_id;

        -- 8. Copy Voters
        INSERT INTO voters (
             name_english, name_marathi, age, gender, address_english, address_marathi,
             ward_no, part_no, epic_no, mobile, house_no, 
             created_at, updated_at, tenant_id
        )
        SELECT 
             name_english, name_marathi, age, gender, address_english, address_marathi,
             ward_no, part_no, epic_no, mobile, house_no, 
             created_at, updated_at, target_id
        FROM voters
        WHERE tenant_id = source_tenant_id;

        -- 9. Copy Possible Improvements
        INSERT INTO possible_improvements (
            title, description, location, area, status, 
            completion_date, metadata, votes, created_at, tenant_id
        )
        SELECT 
            title, description, location, area, status, 
            completion_date, metadata, 0, created_at, target_id
        FROM possible_improvements
        WHERE tenant_id = source_tenant_id;

    END LOOP;
END $$;
