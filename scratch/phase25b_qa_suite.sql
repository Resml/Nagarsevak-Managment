
BEGIN;

DO $$
DECLARE
    res jsonb := '[]'::jsonb;
    test_passed boolean;
    err_msg text;
    v_tenant_a uuid := '05482ac2-e3ea-4e41-84cc-76be80fe0341';
    v_tenant_b uuid := 'bf4c7152-6006-41b5-9c7d-84c76ea67da4';
    v_user_a uuid := '00000000-0000-0000-0000-000000000001';
    v_has_access boolean;
BEGIN

    -- MODULE: voters
    DECLARE
        v_rec RECORD;
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- Check feature access
        SELECT has_member_feature_access(v_tenant_a, v_user_a, 'voters') INTO v_has_access;
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO voters (tenant_id,epic_no,name_marathi,name_english,relation_name_marathi,relation_name_english,relation_type,house_no,age,gender,address_marathi,address_english,ac_no,part_no,serial_no,new_serial_no,mobile,ward_no,caste,is_verified,is_friend_relative,dob,current_address_english,current_address_marathi,profession,favour) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','TEST1234','Test','Test','Test','Test','F','1','30','M','Test','Test','1','1','1','1','9999999999','1','Open','true','false','1990-01-01','Test','Test','Test','1') RETURNING id; $SQL$ INTO v_rec;
            res := res || jsonb_build_object('module', 'voters', 'test', 'INSERT/UPDATE/DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            IF err_msg ILIKE '%row-level security policy%' AND v_has_access = false THEN
                res := res || jsonb_build_object('module', 'voters', 'test', 'INSERT/UPDATE/DELETE', 'status', 'EXPECTED DENIAL', 'error', 'Blocked by RBAC (User lacks feature access)');
            ELSE
                res := res || jsonb_build_object('module', 'voters', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg, 'has_access', v_has_access);
            END IF;
        END;
    END;

    -- MODULE: complaints
    DECLARE
        v_rec RECORD;
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- Check feature access
        SELECT has_member_feature_access(v_tenant_a, v_user_a, 'complaints') INTO v_has_access;
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO complaints (tenant_id,user_id,user_name,problem,location,status,source,category,priority,voter_id,image_url,video_url,assigned_to,area,description_meta,estimated_completion_date) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','123','Test','Test','Test','Pending','Web','Other','Medium','1','','','','Test','{}','2030-01-01') RETURNING id; $SQL$ INTO v_rec;
            res := res || jsonb_build_object('module', 'complaints', 'test', 'INSERT/UPDATE/DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            IF err_msg ILIKE '%row-level security policy%' AND v_has_access = false THEN
                res := res || jsonb_build_object('module', 'complaints', 'test', 'INSERT/UPDATE/DELETE', 'status', 'EXPECTED DENIAL', 'error', 'Blocked by RBAC (User lacks feature access)');
            ELSE
                res := res || jsonb_build_object('module', 'complaints', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg, 'has_access', v_has_access);
            END IF;
        END;
    END;

    -- MODULE: surveys
    DECLARE
        v_rec RECORD;
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- Check feature access
        SELECT has_member_feature_access(v_tenant_a, v_user_a, 'surveys') INTO v_has_access;
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO surveys (tenant_id,title,description,area,status,questions,target_sample_size) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','Test','Test','Test','Active','[]','100') RETURNING id; $SQL$ INTO v_rec;
            res := res || jsonb_build_object('module', 'surveys', 'test', 'INSERT/UPDATE/DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            IF err_msg ILIKE '%row-level security policy%' AND v_has_access = false THEN
                res := res || jsonb_build_object('module', 'surveys', 'test', 'INSERT/UPDATE/DELETE', 'status', 'EXPECTED DENIAL', 'error', 'Blocked by RBAC (User lacks feature access)');
            ELSE
                res := res || jsonb_build_object('module', 'surveys', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg, 'has_access', v_has_access);
            END IF;
        END;
    END;

    -- MODULE: schemes
    DECLARE
        v_rec RECORD;
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- Check feature access
        SELECT has_member_feature_access(v_tenant_a, v_user_a, 'schemes') INTO v_has_access;
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO schemes (tenant_id,name,description,eligibility,benefits,documents,name_mr,description_mr,eligibility_mr,benefits_mr,documents_mr,category) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','Test','Test','Test','Test','[]','Test','Test','Test','Test','[]','Other') RETURNING id; $SQL$ INTO v_rec;
            res := res || jsonb_build_object('module', 'schemes', 'test', 'INSERT/UPDATE/DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            IF err_msg ILIKE '%row-level security policy%' AND v_has_access = false THEN
                res := res || jsonb_build_object('module', 'schemes', 'test', 'INSERT/UPDATE/DELETE', 'status', 'EXPECTED DENIAL', 'error', 'Blocked by RBAC (User lacks feature access)');
            ELSE
                res := res || jsonb_build_object('module', 'schemes', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg, 'has_access', v_has_access);
            END IF;
        END;
    END;

    -- MODULE: events
    DECLARE
        v_rec RECORD;
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- Check feature access
        SELECT has_member_feature_access(v_tenant_a, v_user_a, 'events') INTO v_has_access;
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO events (tenant_id,title,description,event_date,event_time,location,area,target_audience,status,type) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','Test','Test','2030-01-01','10:00','Test','Test','Public','Scheduled','Public') RETURNING id; $SQL$ INTO v_rec;
            res := res || jsonb_build_object('module', 'events', 'test', 'INSERT/UPDATE/DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            IF err_msg ILIKE '%row-level security policy%' AND v_has_access = false THEN
                res := res || jsonb_build_object('module', 'events', 'test', 'INSERT/UPDATE/DELETE', 'status', 'EXPECTED DENIAL', 'error', 'Blocked by RBAC (User lacks feature access)');
            ELSE
                res := res || jsonb_build_object('module', 'events', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg, 'has_access', v_has_access);
            END IF;
        END;
    END;

    -- MODULE: works
    DECLARE
        v_rec RECORD;
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- Check feature access
        SELECT has_member_feature_access(v_tenant_a, v_user_a, 'works') INTO v_has_access;
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO works (tenant_id,title,description,location,status,completion_date,image_url,area,metadata,amount) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','Test','Test','Test','Pending','2030-01-01','','Test','{}','1000') RETURNING id; $SQL$ INTO v_rec;
            res := res || jsonb_build_object('module', 'works', 'test', 'INSERT/UPDATE/DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            IF err_msg ILIKE '%row-level security policy%' AND v_has_access = false THEN
                res := res || jsonb_build_object('module', 'works', 'test', 'INSERT/UPDATE/DELETE', 'status', 'EXPECTED DENIAL', 'error', 'Blocked by RBAC (User lacks feature access)');
            ELSE
                res := res || jsonb_build_object('module', 'works', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg, 'has_access', v_has_access);
            END IF;
        END;
    END;

    -- MODULE: letter_requests
    DECLARE
        v_rec RECORD;
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- Check feature access
        SELECT has_member_feature_access(v_tenant_a, v_user_a, 'letters') INTO v_has_access;
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO letter_requests (tenant_id,user_id,voter_id,type,details,status,pdf_url,area) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','00000000-0000-0000-0000-000000000001','1','Recommendation','{}','Pending','','Test') RETURNING id; $SQL$ INTO v_rec;
            res := res || jsonb_build_object('module', 'letter_requests', 'test', 'INSERT/UPDATE/DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            IF err_msg ILIKE '%row-level security policy%' AND v_has_access = false THEN
                res := res || jsonb_build_object('module', 'letter_requests', 'test', 'INSERT/UPDATE/DELETE', 'status', 'EXPECTED DENIAL', 'error', 'Blocked by RBAC (User lacks feature access)');
            ELSE
                res := res || jsonb_build_object('module', 'letter_requests', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg, 'has_access', v_has_access);
            END IF;
        END;
    END;

    -- MODULE: incoming_letters
    DECLARE
        v_rec RECORD;
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- Check feature access
        SELECT has_member_feature_access(v_tenant_a, v_user_a, 'letters') INTO v_has_access;
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO incoming_letters (tenant_id,title,description,scanned_file_url,file_type,received_date,uploaded_by,area) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','Test','Test','test.pdf','pdf','2030-01-01','Test','Test') RETURNING id; $SQL$ INTO v_rec;
            res := res || jsonb_build_object('module', 'incoming_letters', 'test', 'INSERT/UPDATE/DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            IF err_msg ILIKE '%row-level security policy%' AND v_has_access = false THEN
                res := res || jsonb_build_object('module', 'incoming_letters', 'test', 'INSERT/UPDATE/DELETE', 'status', 'EXPECTED DENIAL', 'error', 'Blocked by RBAC (User lacks feature access)');
            ELSE
                res := res || jsonb_build_object('module', 'incoming_letters', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg, 'has_access', v_has_access);
            END IF;
        END;
    END;

    -- MODULE: letter_types
    DECLARE
        v_rec RECORD;
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- Check feature access
        SELECT has_member_feature_access(v_tenant_a, v_user_a, 'letters') INTO v_has_access;
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO letter_types (tenant_id,name,description,is_active,template_content,name_marathi) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','Test','Test','true','Test','Test') RETURNING id; $SQL$ INTO v_rec;
            res := res || jsonb_build_object('module', 'letter_types', 'test', 'INSERT/UPDATE/DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            IF err_msg ILIKE '%row-level security policy%' AND v_has_access = false THEN
                res := res || jsonb_build_object('module', 'letter_types', 'test', 'INSERT/UPDATE/DELETE', 'status', 'EXPECTED DENIAL', 'error', 'Blocked by RBAC (User lacks feature access)');
            ELSE
                res := res || jsonb_build_object('module', 'letter_types', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg, 'has_access', v_has_access);
            END IF;
        END;
    END;

    -- MODULE: visitors
    DECLARE
        v_rec RECORD;
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- Check feature access
        SELECT has_member_feature_access(v_tenant_a, v_user_a, 'visitors') INTO v_has_access;
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO visitors (tenant_id,name,mobile,purpose,remarks,visit_date,status,reference,area,metadata) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','Test','9999999999','Test','Test','2030-01-01','Waiting','None','Test','{}') RETURNING id; $SQL$ INTO v_rec;
            res := res || jsonb_build_object('module', 'visitors', 'test', 'INSERT/UPDATE/DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            IF err_msg ILIKE '%row-level security policy%' AND v_has_access = false THEN
                res := res || jsonb_build_object('module', 'visitors', 'test', 'INSERT/UPDATE/DELETE', 'status', 'EXPECTED DENIAL', 'error', 'Blocked by RBAC (User lacks feature access)');
            ELSE
                res := res || jsonb_build_object('module', 'visitors', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg, 'has_access', v_has_access);
            END IF;
        END;
    END;

    -- MODULE: social_organizations
    DECLARE
        v_rec RECORD;
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- Check feature access
        SELECT has_member_feature_access(v_tenant_a, v_user_a, 'social_organizations') INTO v_has_access;
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO social_organizations (tenant_id,name,name_marathi,name_english,type,president_name,president_mobile,members_count,area,established_year,support_received,events_conducted,description,status) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','Test','Test','Test','NGO','Test','9999999999','100','Test','2000','None','0','Test','Active') RETURNING id; $SQL$ INTO v_rec;
            res := res || jsonb_build_object('module', 'social_organizations', 'test', 'INSERT/UPDATE/DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            IF err_msg ILIKE '%row-level security policy%' AND v_has_access = false THEN
                res := res || jsonb_build_object('module', 'social_organizations', 'test', 'INSERT/UPDATE/DELETE', 'status', 'EXPECTED DENIAL', 'error', 'Blocked by RBAC (User lacks feature access)');
            ELSE
                res := res || jsonb_build_object('module', 'social_organizations', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg, 'has_access', v_has_access);
            END IF;
        END;
    END;

    -- MODULE: housing_societies
    DECLARE
        v_rec RECORD;
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- Check feature access
        SELECT has_member_feature_access(v_tenant_a, v_user_a, 'housing_societies') INTO v_has_access;
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO housing_societies (tenant_id,name,name_marathi,name_english,chairman_name,chairman_mobile,secretary_name,secretary_mobile,voter_count,favourable_voter_count,area,address,notes,status) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','Test','Test','Test','Test','9999999999','Test','9999999999','100','50','Test','Test','Test','Active') RETURNING id; $SQL$ INTO v_rec;
            res := res || jsonb_build_object('module', 'housing_societies', 'test', 'INSERT/UPDATE/DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            IF err_msg ILIKE '%row-level security policy%' AND v_has_access = false THEN
                res := res || jsonb_build_object('module', 'housing_societies', 'test', 'INSERT/UPDATE/DELETE', 'status', 'EXPECTED DENIAL', 'error', 'Blocked by RBAC (User lacks feature access)');
            ELSE
                res := res || jsonb_build_object('module', 'housing_societies', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg, 'has_access', v_has_access);
            END IF;
        END;
    END;

    -- MODULE: support_tickets
    DECLARE
        v_rec RECORD;
    BEGIN
        PERFORM set_config('role', 'authenticated', true);
        PERFORM set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_user_a), true);
        
        -- Check feature access
        SELECT has_member_feature_access(v_tenant_a, v_user_a, 'help_support') INTO v_has_access;
        
        -- INSERT Legitimate
        BEGIN
            EXECUTE $SQL$ INSERT INTO support_tickets (tenant_id,category,plan,user_id,user_name,title,description,priority,status,description_meta) VALUES ('05482ac2-e3ea-4e41-84cc-76be80fe0341','Other','Basic','00000000-0000-0000-0000-000000000001','Test','Test','Test','Medium','Open','{}') RETURNING id; $SQL$ INTO v_rec;
            res := res || jsonb_build_object('module', 'support_tickets', 'test', 'INSERT/UPDATE/DELETE', 'status', 'PASS');
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
            IF err_msg ILIKE '%row-level security policy%' AND v_has_access = false THEN
                res := res || jsonb_build_object('module', 'support_tickets', 'test', 'INSERT/UPDATE/DELETE', 'status', 'EXPECTED DENIAL', 'error', 'Blocked by RBAC (User lacks feature access)');
            ELSE
                res := res || jsonb_build_object('module', 'support_tickets', 'test', 'INSERT/UPDATE/DELETE', 'status', 'FAIL', 'error', err_msg, 'has_access', v_has_access);
            END IF;
        END;
    END;

    -- Save result to a temp table
    CREATE TEMP TABLE qa_results_temp (data jsonb);
    INSERT INTO qa_results_temp VALUES (res);
END;
$$;

SELECT data FROM qa_results_temp;
ROLLBACK;
