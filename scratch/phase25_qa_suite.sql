
BEGIN;

DO $$
DECLARE
    res jsonb := '[]'::jsonb;
    test_passed boolean;
    err_msg text;
    v_tenant_a uuid := '05482ac2-e3ea-4e41-84cc-76be80fe0341';
    v_tenant_b uuid := 'bf4c7152-6006-41b5-9c7d-84c76ea67da4';
    v_user_a uuid := '00000000-0000-0000-0000-000000000001';
    v_row_count int;
    v_new_id uuid;
BEGIN

    -- MODULE: voters
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- SELECT Legitimate
        PERFORM * FROM voters LIMIT 1;
        res := res || jsonb_build_object('module', 'voters', 'test', 'SELECT', 'status', 'PASS');
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO voters (tenant_id,full_name,voter_id_number,address,date_of_birth,gender,contact_number) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','Test Voter','TEST1234','Test','1990-01-01','Male','9999999999') RETURNING id; $SQL$ INTO v_new_id;
            res := res || jsonb_build_object('module', 'voters', 'test', 'INSERT', 'status', 'PASS');
            
            -- UPDATE Legitimate
            EXECUTE format('UPDATE voters SET updated_at = NOW() WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'voters', 'test', 'UPDATE', 'status', 'PASS');

            -- DELETE Legitimate
            EXECUTE format('DELETE FROM voters WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'voters', 'test', 'DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            res := res || jsonb_build_object('module', 'voters', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg);
        END;

        -- Cross-Tenant INSERT
        BEGIN
            EXECUTE $SQL$ INSERT INTO voters (tenant_id,full_name,voter_id_number,address,date_of_birth,gender,contact_number) VALUES ('bf4c7152-6006-41b5-9c7d-84c76ea67da4','Test Voter','TEST1234','Test','1990-01-01','Male','9999999999'); $SQL$;
            res := res || jsonb_build_object('module', 'voters', 'test', 'INSERT Cross-Tenant', 'status', 'FAIL', 'error', 'Allowed cross-tenant insert!');
        EXCEPTION WHEN OTHERS THEN
            res := res || jsonb_build_object('module', 'voters', 'test', 'INSERT Cross-Tenant', 'status', 'PASS');
        END;

    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
        res := res || jsonb_build_object('module', 'voters', 'test', 'Module Execution', 'status', 'FAIL', 'error', err_msg);
    END;

    -- MODULE: complaints
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- SELECT Legitimate
        PERFORM * FROM complaints LIMIT 1;
        res := res || jsonb_build_object('module', 'complaints', 'test', 'SELECT', 'status', 'PASS');
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO complaints (tenant_id,title,description,status,category,priority,contact_number) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','Test','Test','Pending','Other','Medium','9999999999') RETURNING id; $SQL$ INTO v_new_id;
            res := res || jsonb_build_object('module', 'complaints', 'test', 'INSERT', 'status', 'PASS');
            
            -- UPDATE Legitimate
            EXECUTE format('UPDATE complaints SET updated_at = NOW() WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'complaints', 'test', 'UPDATE', 'status', 'PASS');

            -- DELETE Legitimate
            EXECUTE format('DELETE FROM complaints WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'complaints', 'test', 'DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            res := res || jsonb_build_object('module', 'complaints', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg);
        END;

        -- Cross-Tenant INSERT
        BEGIN
            EXECUTE $SQL$ INSERT INTO complaints (tenant_id,title,description,status,category,priority,contact_number) VALUES ('bf4c7152-6006-41b5-9c7d-84c76ea67da4','Test','Test','Pending','Other','Medium','9999999999'); $SQL$;
            res := res || jsonb_build_object('module', 'complaints', 'test', 'INSERT Cross-Tenant', 'status', 'FAIL', 'error', 'Allowed cross-tenant insert!');
        EXCEPTION WHEN OTHERS THEN
            res := res || jsonb_build_object('module', 'complaints', 'test', 'INSERT Cross-Tenant', 'status', 'PASS');
        END;

    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
        res := res || jsonb_build_object('module', 'complaints', 'test', 'Module Execution', 'status', 'FAIL', 'error', err_msg);
    END;

    -- MODULE: surveys
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- SELECT Legitimate
        PERFORM * FROM surveys LIMIT 1;
        res := res || jsonb_build_object('module', 'surveys', 'test', 'SELECT', 'status', 'PASS');
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO surveys (tenant_id,title,description,questions) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','Test','Test','[]') RETURNING id; $SQL$ INTO v_new_id;
            res := res || jsonb_build_object('module', 'surveys', 'test', 'INSERT', 'status', 'PASS');
            
            -- UPDATE Legitimate
            EXECUTE format('UPDATE surveys SET updated_at = NOW() WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'surveys', 'test', 'UPDATE', 'status', 'PASS');

            -- DELETE Legitimate
            EXECUTE format('DELETE FROM surveys WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'surveys', 'test', 'DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            res := res || jsonb_build_object('module', 'surveys', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg);
        END;

        -- Cross-Tenant INSERT
        BEGIN
            EXECUTE $SQL$ INSERT INTO surveys (tenant_id,title,description,questions) VALUES ('bf4c7152-6006-41b5-9c7d-84c76ea67da4','Test','Test','[]'); $SQL$;
            res := res || jsonb_build_object('module', 'surveys', 'test', 'INSERT Cross-Tenant', 'status', 'FAIL', 'error', 'Allowed cross-tenant insert!');
        EXCEPTION WHEN OTHERS THEN
            res := res || jsonb_build_object('module', 'surveys', 'test', 'INSERT Cross-Tenant', 'status', 'PASS');
        END;

    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
        res := res || jsonb_build_object('module', 'surveys', 'test', 'Module Execution', 'status', 'FAIL', 'error', err_msg);
    END;

    -- MODULE: schemes
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- SELECT Legitimate
        PERFORM * FROM schemes LIMIT 1;
        res := res || jsonb_build_object('module', 'schemes', 'test', 'SELECT', 'status', 'PASS');
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO schemes (tenant_id,name,description,eligibility_criteria,required_documents,category) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','Test Scheme','Test','Test','[]','Other') RETURNING id; $SQL$ INTO v_new_id;
            res := res || jsonb_build_object('module', 'schemes', 'test', 'INSERT', 'status', 'PASS');
            
            -- UPDATE Legitimate
            EXECUTE format('UPDATE schemes SET updated_at = NOW() WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'schemes', 'test', 'UPDATE', 'status', 'PASS');

            -- DELETE Legitimate
            EXECUTE format('DELETE FROM schemes WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'schemes', 'test', 'DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            res := res || jsonb_build_object('module', 'schemes', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg);
        END;

        -- Cross-Tenant INSERT
        BEGIN
            EXECUTE $SQL$ INSERT INTO schemes (tenant_id,name,description,eligibility_criteria,required_documents,category) VALUES ('bf4c7152-6006-41b5-9c7d-84c76ea67da4','Test Scheme','Test','Test','[]','Other'); $SQL$;
            res := res || jsonb_build_object('module', 'schemes', 'test', 'INSERT Cross-Tenant', 'status', 'FAIL', 'error', 'Allowed cross-tenant insert!');
        EXCEPTION WHEN OTHERS THEN
            res := res || jsonb_build_object('module', 'schemes', 'test', 'INSERT Cross-Tenant', 'status', 'PASS');
        END;

    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
        res := res || jsonb_build_object('module', 'schemes', 'test', 'Module Execution', 'status', 'FAIL', 'error', err_msg);
    END;

    -- MODULE: events
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- SELECT Legitimate
        PERFORM * FROM events LIMIT 1;
        res := res || jsonb_build_object('module', 'events', 'test', 'SELECT', 'status', 'PASS');
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO events (tenant_id,title,description,date,time,location) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','Test Event','Test','2030-01-01','10:00','Test') RETURNING id; $SQL$ INTO v_new_id;
            res := res || jsonb_build_object('module', 'events', 'test', 'INSERT', 'status', 'PASS');
            
            -- UPDATE Legitimate
            EXECUTE format('UPDATE events SET updated_at = NOW() WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'events', 'test', 'UPDATE', 'status', 'PASS');

            -- DELETE Legitimate
            EXECUTE format('DELETE FROM events WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'events', 'test', 'DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            res := res || jsonb_build_object('module', 'events', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg);
        END;

        -- Cross-Tenant INSERT
        BEGIN
            EXECUTE $SQL$ INSERT INTO events (tenant_id,title,description,date,time,location) VALUES ('bf4c7152-6006-41b5-9c7d-84c76ea67da4','Test Event','Test','2030-01-01','10:00','Test'); $SQL$;
            res := res || jsonb_build_object('module', 'events', 'test', 'INSERT Cross-Tenant', 'status', 'FAIL', 'error', 'Allowed cross-tenant insert!');
        EXCEPTION WHEN OTHERS THEN
            res := res || jsonb_build_object('module', 'events', 'test', 'INSERT Cross-Tenant', 'status', 'PASS');
        END;

    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
        res := res || jsonb_build_object('module', 'events', 'test', 'Module Execution', 'status', 'FAIL', 'error', err_msg);
    END;

    -- MODULE: works
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- SELECT Legitimate
        PERFORM * FROM works LIMIT 1;
        res := res || jsonb_build_object('module', 'works', 'test', 'SELECT', 'status', 'PASS');
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO works (tenant_id,title,description,status,category,budget) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','Test Work','Test','Pending','Road',1000) RETURNING id; $SQL$ INTO v_new_id;
            res := res || jsonb_build_object('module', 'works', 'test', 'INSERT', 'status', 'PASS');
            
            -- UPDATE Legitimate
            EXECUTE format('UPDATE works SET updated_at = NOW() WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'works', 'test', 'UPDATE', 'status', 'PASS');

            -- DELETE Legitimate
            EXECUTE format('DELETE FROM works WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'works', 'test', 'DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            res := res || jsonb_build_object('module', 'works', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg);
        END;

        -- Cross-Tenant INSERT
        BEGIN
            EXECUTE $SQL$ INSERT INTO works (tenant_id,title,description,status,category,budget) VALUES ('bf4c7152-6006-41b5-9c7d-84c76ea67da4','Test Work','Test','Pending','Road',1000); $SQL$;
            res := res || jsonb_build_object('module', 'works', 'test', 'INSERT Cross-Tenant', 'status', 'FAIL', 'error', 'Allowed cross-tenant insert!');
        EXCEPTION WHEN OTHERS THEN
            res := res || jsonb_build_object('module', 'works', 'test', 'INSERT Cross-Tenant', 'status', 'PASS');
        END;

    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
        res := res || jsonb_build_object('module', 'works', 'test', 'Module Execution', 'status', 'FAIL', 'error', err_msg);
    END;

    -- MODULE: letters
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- SELECT Legitimate
        PERFORM * FROM letters LIMIT 1;
        res := res || jsonb_build_object('module', 'letters', 'test', 'SELECT', 'status', 'PASS');
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO letters (tenant_id,letter_number,subject,content,status) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','TEST-1','Test','Test','Draft') RETURNING id; $SQL$ INTO v_new_id;
            res := res || jsonb_build_object('module', 'letters', 'test', 'INSERT', 'status', 'PASS');
            
            -- UPDATE Legitimate
            EXECUTE format('UPDATE letters SET updated_at = NOW() WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'letters', 'test', 'UPDATE', 'status', 'PASS');

            -- DELETE Legitimate
            EXECUTE format('DELETE FROM letters WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'letters', 'test', 'DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            res := res || jsonb_build_object('module', 'letters', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg);
        END;

        -- Cross-Tenant INSERT
        BEGIN
            EXECUTE $SQL$ INSERT INTO letters (tenant_id,letter_number,subject,content,status) VALUES ('bf4c7152-6006-41b5-9c7d-84c76ea67da4','TEST-1','Test','Test','Draft'); $SQL$;
            res := res || jsonb_build_object('module', 'letters', 'test', 'INSERT Cross-Tenant', 'status', 'FAIL', 'error', 'Allowed cross-tenant insert!');
        EXCEPTION WHEN OTHERS THEN
            res := res || jsonb_build_object('module', 'letters', 'test', 'INSERT Cross-Tenant', 'status', 'PASS');
        END;

    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
        res := res || jsonb_build_object('module', 'letters', 'test', 'Module Execution', 'status', 'FAIL', 'error', err_msg);
    END;

    -- MODULE: visitors
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- SELECT Legitimate
        PERFORM * FROM visitors LIMIT 1;
        res := res || jsonb_build_object('module', 'visitors', 'test', 'SELECT', 'status', 'PASS');
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO visitors (tenant_id,full_name,contact_number,purpose,status) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','Test Visitor','9999999999','Test','Waiting') RETURNING id; $SQL$ INTO v_new_id;
            res := res || jsonb_build_object('module', 'visitors', 'test', 'INSERT', 'status', 'PASS');
            
            -- UPDATE Legitimate
            EXECUTE format('UPDATE visitors SET updated_at = NOW() WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'visitors', 'test', 'UPDATE', 'status', 'PASS');

            -- DELETE Legitimate
            EXECUTE format('DELETE FROM visitors WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'visitors', 'test', 'DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            res := res || jsonb_build_object('module', 'visitors', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg);
        END;

        -- Cross-Tenant INSERT
        BEGIN
            EXECUTE $SQL$ INSERT INTO visitors (tenant_id,full_name,contact_number,purpose,status) VALUES ('bf4c7152-6006-41b5-9c7d-84c76ea67da4','Test Visitor','9999999999','Test','Waiting'); $SQL$;
            res := res || jsonb_build_object('module', 'visitors', 'test', 'INSERT Cross-Tenant', 'status', 'FAIL', 'error', 'Allowed cross-tenant insert!');
        EXCEPTION WHEN OTHERS THEN
            res := res || jsonb_build_object('module', 'visitors', 'test', 'INSERT Cross-Tenant', 'status', 'PASS');
        END;

    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
        res := res || jsonb_build_object('module', 'visitors', 'test', 'Module Execution', 'status', 'FAIL', 'error', err_msg);
    END;

    -- MODULE: social_organizations
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- SELECT Legitimate
        PERFORM * FROM social_organizations LIMIT 1;
        res := res || jsonb_build_object('module', 'social_organizations', 'test', 'SELECT', 'status', 'PASS');
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO social_organizations (tenant_id,name,contact_person,contact_number,address,organization_type) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','Test Org','Test','9999999999','Test','NGO') RETURNING id; $SQL$ INTO v_new_id;
            res := res || jsonb_build_object('module', 'social_organizations', 'test', 'INSERT', 'status', 'PASS');
            
            -- UPDATE Legitimate
            EXECUTE format('UPDATE social_organizations SET updated_at = NOW() WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'social_organizations', 'test', 'UPDATE', 'status', 'PASS');

            -- DELETE Legitimate
            EXECUTE format('DELETE FROM social_organizations WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'social_organizations', 'test', 'DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            res := res || jsonb_build_object('module', 'social_organizations', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg);
        END;

        -- Cross-Tenant INSERT
        BEGIN
            EXECUTE $SQL$ INSERT INTO social_organizations (tenant_id,name,contact_person,contact_number,address,organization_type) VALUES ('bf4c7152-6006-41b5-9c7d-84c76ea67da4','Test Org','Test','9999999999','Test','NGO'); $SQL$;
            res := res || jsonb_build_object('module', 'social_organizations', 'test', 'INSERT Cross-Tenant', 'status', 'FAIL', 'error', 'Allowed cross-tenant insert!');
        EXCEPTION WHEN OTHERS THEN
            res := res || jsonb_build_object('module', 'social_organizations', 'test', 'INSERT Cross-Tenant', 'status', 'PASS');
        END;

    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
        res := res || jsonb_build_object('module', 'social_organizations', 'test', 'Module Execution', 'status', 'FAIL', 'error', err_msg);
    END;

    -- MODULE: housing_societies
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- SELECT Legitimate
        PERFORM * FROM housing_societies LIMIT 1;
        res := res || jsonb_build_object('module', 'housing_societies', 'test', 'SELECT', 'status', 'PASS');
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO housing_societies (tenant_id,name,address,contact_person,contact_number) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','Test Society','Test','Test','9999999999') RETURNING id; $SQL$ INTO v_new_id;
            res := res || jsonb_build_object('module', 'housing_societies', 'test', 'INSERT', 'status', 'PASS');
            
            -- UPDATE Legitimate
            EXECUTE format('UPDATE housing_societies SET updated_at = NOW() WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'housing_societies', 'test', 'UPDATE', 'status', 'PASS');

            -- DELETE Legitimate
            EXECUTE format('DELETE FROM housing_societies WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'housing_societies', 'test', 'DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            res := res || jsonb_build_object('module', 'housing_societies', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg);
        END;

        -- Cross-Tenant INSERT
        BEGIN
            EXECUTE $SQL$ INSERT INTO housing_societies (tenant_id,name,address,contact_person,contact_number) VALUES ('bf4c7152-6006-41b5-9c7d-84c76ea67da4','Test Society','Test','Test','9999999999'); $SQL$;
            res := res || jsonb_build_object('module', 'housing_societies', 'test', 'INSERT Cross-Tenant', 'status', 'FAIL', 'error', 'Allowed cross-tenant insert!');
        EXCEPTION WHEN OTHERS THEN
            res := res || jsonb_build_object('module', 'housing_societies', 'test', 'INSERT Cross-Tenant', 'status', 'PASS');
        END;

    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
        res := res || jsonb_build_object('module', 'housing_societies', 'test', 'Module Execution', 'status', 'FAIL', 'error', err_msg);
    END;

    -- MODULE: support_tickets
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- SELECT Legitimate
        PERFORM * FROM support_tickets LIMIT 1;
        res := res || jsonb_build_object('module', 'support_tickets', 'test', 'SELECT', 'status', 'PASS');
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO support_tickets (tenant_id,title,description,status,priority) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','Test','Test','Open','Medium') RETURNING id; $SQL$ INTO v_new_id;
            res := res || jsonb_build_object('module', 'support_tickets', 'test', 'INSERT', 'status', 'PASS');
            
            -- UPDATE Legitimate
            EXECUTE format('UPDATE support_tickets SET updated_at = NOW() WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'support_tickets', 'test', 'UPDATE', 'status', 'PASS');

            -- DELETE Legitimate
            EXECUTE format('DELETE FROM support_tickets WHERE id = %L', v_new_id);
            res := res || jsonb_build_object('module', 'support_tickets', 'test', 'DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            res := res || jsonb_build_object('module', 'support_tickets', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg);
        END;

        -- Cross-Tenant INSERT
        BEGIN
            EXECUTE $SQL$ INSERT INTO support_tickets (tenant_id,title,description,status,priority) VALUES ('bf4c7152-6006-41b5-9c7d-84c76ea67da4','Test','Test','Open','Medium'); $SQL$;
            res := res || jsonb_build_object('module', 'support_tickets', 'test', 'INSERT Cross-Tenant', 'status', 'FAIL', 'error', 'Allowed cross-tenant insert!');
        EXCEPTION WHEN OTHERS THEN
            res := res || jsonb_build_object('module', 'support_tickets', 'test', 'INSERT Cross-Tenant', 'status', 'PASS');
        END;

    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
        res := res || jsonb_build_object('module', 'support_tickets', 'test', 'Module Execution', 'status', 'FAIL', 'error', err_msg);
    END;

    -- Save result to a temp table
    CREATE TEMP TABLE qa_results_temp (data jsonb);
    INSERT INTO qa_results_temp VALUES (res);
END;
$$;

SELECT data FROM qa_results_temp;
ROLLBACK;
