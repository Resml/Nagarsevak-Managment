


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."bulk_allocate_caste"("p_names" "text"[], "p_name_type" "text", "p_new_caste" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF p_name_type = 'surname' THEN
    UPDATE voters
    SET caste = p_new_caste
    WHERE NULLIF(split_part(TRIM(BOTH ' ' FROM COALESCE(name_marathi, name)), ' ', 1), '') = ANY(p_names);
  ELSIF p_name_type = 'firstname' THEN
    UPDATE voters
    SET caste = p_new_caste
    WHERE NULLIF(split_part(TRIM(BOTH ' ' FROM COALESCE(name_marathi, name)), ' ', 2), '') = ANY(p_names);
  END IF;
END;
$$;




CREATE OR REPLACE FUNCTION "public"."cascade_tenant_details_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'voters', 'complaints', 'letter_requests', 'gb_diary', 'gallery', 'works', 
    'events', 'schemes', 'visitors', 'staff', 'sadasya', 'surveys', 'survey_responses', 
    'housing_societies', 'social_organizations', 'non_voters', 'improvements', 
    'ward_problems', 'event_rsvps', 'scheme_beneficiaries', 'personal_requests', 
    'ward_provisions', 'ward_budget', 'message_logs', 'letter_types', 'ai_history', 
    'incoming_letters', 'work_trackers', 'work_feedback'
  ];
BEGIN
  IF (OLD.tier IS DISTINCT FROM NEW.tier) OR (OLD.plan IS DISTINCT FROM NEW.plan) THEN
    FOREACH t IN ARRAY tables
    LOOP
      -- Only attempt to update the table if it actually exists
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
        EXECUTE format('UPDATE public.%I SET category = $1, plan = $2 WHERE tenant_id = $3', t)
        USING UPPER(NEW.tier), UPPER(NEW.plan), NEW.id;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$_$;




CREATE OR REPLACE FUNCTION "public"."create_task_from_visitor"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check if purpose is Greeting or Invitation
    IF NEW.purpose IN ('Greeting', 'Invitation') THEN
        INSERT INTO tasks (
            title,
            description,
            priority,
            due_date,
            due_time,
            status,
            tenant_id,
            office_name,
            meet_person_name,
            created_at,
            updated_at
        )
        VALUES (
            -- Title
            NEW.purpose || ' from ' || NEW.name,
            
            -- Description
            'Event Date: ' || COALESCE(NEW.metadata->>'event_date', 'N/A') || E'\n' ||
            'Time: ' || COALESCE(NEW.metadata->>'event_time', 'N/A') || E'\n' ||
            'Venue: ' || COALESCE(NEW.area, 'N/A') || E'\n' ||
            'Mobile: ' || NEW.mobile || E'\n' ||
            'Remarks: ' || COALESCE(NEW.remarks, ''),
            
            -- Priority
            'Medium',
            
            -- Due Date (Use event date if available, else today)
            COALESCE((NEW.metadata->>'event_date')::date, CURRENT_DATE),
            
            -- Due Time
            COALESCE(NULLIF(NEW.metadata->>'event_time', ''), '09:00')::time,
            
            -- Status
            'Pending',
            
            -- Tenant ID
            NEW.tenant_id,
            
            -- Office Name (Venue)
            NEW.area,
            
            -- Meet Person Name
            NEW.name,
            
            NOW(),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$;




CREATE OR REPLACE FUNCTION "public"."derive_survey_response_tenant"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Force the tenant_id to exactly match the survey's tenant.
    -- get_survey_tenant() also securely verifies that the survey is 'Active'.
    NEW.tenant_id := public.get_survey_tenant(NEW.survey_id);
    
    IF NEW.tenant_id IS NULL THEN
        RAISE EXCEPTION 'Survey is inactive or invalid';
    END IF;
    
    RETURN NEW;
END;
$$;




CREATE OR REPLACE FUNCTION "public"."get_authorized_tenants"() RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT tenant_id
  FROM public.user_tenant_mapping
  WHERE user_id = auth.uid();
$$;




CREATE OR REPLACE FUNCTION "public"."get_distinct_voter_addresses"("p_tenant_id" "uuid") RETURNS TABLE("address_marathi" "text", "address_english" "text")
    LANGUAGE "sql" STABLE
    AS $$
    SELECT DISTINCT ON (TRIM(address_marathi))
        TRIM(address_marathi) AS address_marathi,
        TRIM(address_english) AS address_english
    FROM voters
    WHERE tenant_id = p_tenant_id
      AND (
          (address_marathi IS NOT NULL AND TRIM(address_marathi) != '')
          OR
          (address_english IS NOT NULL AND TRIM(address_english) != '')
      )
    ORDER BY TRIM(address_marathi);
$$;




CREATE OR REPLACE FUNCTION "public"."get_event_tenant"("p_event_id" bigint) RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  -- Only return the tenant_id if the event is explicitly Planned
  SELECT tenant_id FROM public.events WHERE id = p_event_id AND status = 'Planned';
$$;




CREATE OR REPLACE FUNCTION "public"."get_survey_tenant"("p_survey_id" "uuid") RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  -- Only return the tenant_id if the survey is explicitly Active
  SELECT tenant_id FROM public.surveys WHERE id = p_survey_id AND status = 'Active';
$$;




CREATE OR REPLACE FUNCTION "public"."get_unique_addresses"() RETURNS TABLE("address" "text", "count" bigint)
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
  select 
    coalesce(address_english, address_marathi, 'Unknown') as address,
    count(*) as count
  from voters
  group by coalesce(address_english, address_marathi, 'Unknown')
  having count(*) > 0
  order by count desc;
end;
$$;




CREATE OR REPLACE FUNCTION "public"."get_unique_addresses_marathi"() RETURNS TABLE("address" "text", "count" bigint)
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
  select 
    coalesce(address_marathi, address_english, 'Unknown') as address,
    count(*) as count
  from voters
  group by coalesce(address_marathi, address_english, 'Unknown')
  having count(*) > 0
  order by count desc;
end;
$$;




CREATE OR REPLACE FUNCTION "public"."get_unique_castes"() RETURNS TABLE("caste" "text", "count" bigint)
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
  select 
    voters.caste,
    count(*) as count
  from voters
  where voters.caste is not null and voters.caste != ''
  group by voters.caste
  having count(*) > 0
  order by count desc;
end;
$$;




CREATE OR REPLACE FUNCTION "public"."get_unique_firstnames"() RETURNS TABLE("name" "text", "count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    NULLIF(split_part(TRIM(BOTH ' ' FROM COALESCE(name_marathi, name)), ' ', 2), '') as name,
    COUNT(*) as count
  FROM voters
  WHERE COALESCE(name_marathi, name) IS NOT NULL AND COALESCE(name_marathi, name) != ''
  GROUP BY 1
  HAVING NULLIF(split_part(TRIM(BOTH ' ' FROM COALESCE(name_marathi, name)), ' ', 2), '') IS NOT NULL
  ORDER BY count DESC;
END;
$$;




CREATE OR REPLACE FUNCTION "public"."get_unique_house_numbers"() RETURNS TABLE("house_no" "text", "count" bigint)
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
  select 
    voters.house_no,
    count(*) as count
  from voters
  where voters.house_no is not null and voters.house_no != ''
  group by voters.house_no
  having count(*) > 0
  order by count desc;
end;
$$;




CREATE OR REPLACE FUNCTION "public"."get_unique_surnames"() RETURNS TABLE("name" "text", "count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    NULLIF(split_part(TRIM(BOTH ' ' FROM COALESCE(name_marathi, name)), ' ', 1), '') as name,
    COUNT(*) as count
  FROM voters
  WHERE COALESCE(name_marathi, name) IS NOT NULL AND COALESCE(name_marathi, name) != ''
  GROUP BY 1
  HAVING NULLIF(split_part(TRIM(BOTH ' ' FROM COALESCE(name_marathi, name)), ' ', 1), '') IS NOT NULL
  ORDER BY count DESC;
END;
$$;




CREATE OR REPLACE FUNCTION "public"."has_feature_access"("p_tenant_id" "uuid", "p_feature_key" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_plan_key text;
    v_feature_id uuid;
    v_override_enabled boolean;
    v_base_enabled boolean;
BEGIN
    -- 1. Security constraint: Verify the executing user has authorization for the tenant
    IF NOT EXISTS (
        SELECT 1 FROM public.user_tenant_mapping 
        WHERE user_id = auth.uid() AND tenant_id = p_tenant_id
    ) AND NOT EXISTS (
        SELECT 1 FROM public.user_tenant_mapping 
        WHERE user_id = auth.uid() AND role = 'super_admin'
    ) THEN
        RETURN false;
    END IF;

    -- 2. Resolve feature
    SELECT id INTO v_feature_id FROM public.features WHERE feature_key = p_feature_key AND is_active = true;
    IF v_feature_id IS NULL THEN RETURN false; END IF;

    -- 3. Check for specific tenant override (highest priority)
    SELECT is_enabled INTO v_override_enabled 
    FROM public.tenant_feature_overrides 
    WHERE tenant_id = p_tenant_id AND feature_id = v_feature_id;
    
    IF FOUND THEN RETURN v_override_enabled; END IF;

    -- 4. Check base plan entitlement
    SELECT plan INTO v_plan_key FROM public.tenants WHERE id = p_tenant_id;
    IF v_plan_key IS NULL THEN RETURN false; END IF;

    SELECT pf.is_enabled INTO v_base_enabled
    FROM public.plan_features pf
    JOIN public.plans p ON p.id = pf.plan_id
    WHERE LOWER(p.plan_key) = LOWER(v_plan_key) AND pf.feature_id = v_feature_id;

    RETURN COALESCE(v_base_enabled, false);
END;
$$;




CREATE OR REPLACE FUNCTION "public"."has_member_feature_access"("p_tenant_id" "uuid", "p_user_id" "uuid", "p_feature_key" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_role TEXT;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT role INTO v_role
    FROM public.user_tenant_mapping
    WHERE user_id = p_user_id AND tenant_id = p_tenant_id
    LIMIT 1;

    IF v_role IN ('admin', 'super_admin') THEN
        RETURN public.has_feature_access(p_tenant_id, p_feature_key);
    END IF;

    IF v_role = 'staff' THEN
        IF NOT public.has_feature_access(p_tenant_id, p_feature_key) THEN
            RETURN FALSE;
        END IF;
        RETURN EXISTS (
            SELECT 1 FROM public.staff 
            WHERE id = p_user_id 
              AND tenant_id = p_tenant_id 
              AND p_feature_key = ANY(permissions)
        );
    END IF;

    RETURN FALSE;
END;
$$;




CREATE OR REPLACE FUNCTION "public"."initialize_app_settings"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM app_settings LIMIT 1) THEN
    INSERT INTO app_settings (nagarsevak_name_english, ward_name) 
    VALUES ('Nagar Sevak', 'Ward No. 1');
  END IF;
END;
$$;




CREATE OR REPLACE FUNCTION "public"."log_security_event"("p_event_type" "text", "p_details" "jsonb", "p_tenant_id" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user_id uuid;
    v_actual_tenant_id uuid;
BEGIN
    -- 1. Payload and Size Validation
    IF p_event_type IS NULL OR length(p_event_type) = 0 OR length(p_event_type) > 100 THEN
        RAISE EXCEPTION 'Invalid event_type';
    END IF;
    
    IF p_details IS NOT NULL AND length(p_details::text) > 5000 THEN
        RAISE EXCEPTION 'Payload too large';
    END IF;

    -- 2. Identify caller securely via auth.uid()
    v_user_id := auth.uid();
    v_actual_tenant_id := p_tenant_id;

    -- 3. Strict Authentication Requirement
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Only authenticated users can log security events.';
    END IF;

    -- 4. Tenant Validation for Authenticated Users
    IF p_tenant_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.user_tenant_mapping 
            WHERE user_id = v_user_id 
            AND tenant_id = p_tenant_id
        ) THEN
            RAISE EXCEPTION 'Unauthorized: User does not belong to the specified tenant.';
        END IF;
    ELSE
        -- Auto-resolve if exactly one tenant
        SELECT tenant_id INTO v_actual_tenant_id 
        FROM public.user_tenant_mapping 
        WHERE user_id = v_user_id 
        LIMIT 1;
    END IF;

    -- 5. Insert the log
    INSERT INTO public.security_audit_logs (
        user_id,
        tenant_id,
        event_type,
        details
    ) VALUES (
        v_user_id,
        v_actual_tenant_id,
        p_event_type,
        p_details
    );
END;
$$;




CREATE OR REPLACE FUNCTION "public"."migrate_table_to_multitenant"("table_name" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
  default_tenant_id uuid;
begin
  -- Check if table exists
  if to_regclass(table_name) is null then
    raise notice 'Table % does not exist, skipping migration.', table_name;
    return;
  end if;

  -- Get default tenant
  select id into default_tenant_id from tenants where subdomain = 'default' limit 1;

  -- Add Column
  execute format('alter table %I add column if not exists tenant_id uuid references tenants(id);', table_name);
  
  -- Assign existing data to default tenant
  execute format('update %I set tenant_id = %L where tenant_id is null;', table_name, default_tenant_id);
  
  -- Make it NOT NULL after backfilling (Optional, but good for integrity)
  -- execute format('alter table %I alter column tenant_id set not null;', table_name);

  -- Enable RLS
  execute format('alter table %I enable row level security;', table_name);

  -- RLS: SELECT (Read)
  execute format('drop policy if exists "Tenant Isolation Select" on %I;', table_name);
  execute format('create policy "Tenant Isolation Select" on %I for select using (
    tenant_id in (select tenant_id from user_tenant_mapping where user_id = auth.uid())
    or 
    (auth.role() = ''anon'' and tenant_id is not null) -- For public pages to work (logic to be refined via frontend)
  );', table_name, table_name);

  -- RLS: INSERT (Create)
  execute format('drop policy if exists "Tenant Isolation Insert" on %I;', table_name);
  execute format('create policy "Tenant Isolation Insert" on %I for insert with check (
    -- Allow authenticated users to insert into their mapped tenant
    tenant_id in (select tenant_id from user_tenant_mapping where user_id = auth.uid())
    or
    -- Allow anon users (public) to insert if they provide a valid tenant_id (e.g. Complaint Form)
    (auth.role() = ''anon'' and tenant_id is not null)
  );', table_name, table_name);
  
  -- RLS: UPDATE (Modify)
  execute format('drop policy if exists "Tenant Isolation Update" on %I;', table_name);
  execute format('create policy "Tenant Isolation Update" on %I for update using (
    tenant_id in (select tenant_id from user_tenant_mapping where user_id = auth.uid())
  );', table_name, table_name);

  -- RLS: DELETE (Remove)
  execute format('drop policy if exists "Tenant Isolation Delete" on %I;', table_name);
  execute format('create policy "Tenant Isolation Delete" on %I for delete using (
    tenant_id in (select tenant_id from user_tenant_mapping where user_id = auth.uid())
  );', table_name, table_name);
end;
$$;




CREATE OR REPLACE FUNCTION "public"."populate_record_tenant_details"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.tenant_id IS NOT NULL THEN
    SELECT UPPER(tier), UPPER(plan) INTO NEW.category, NEW.plan
    FROM public.tenants
    WHERE id = NEW.tenant_id;
  END IF;
  RETURN NEW;
END;
$$;




CREATE OR REPLACE FUNCTION "public"."prevent_staff_permission_escalation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_executor_role TEXT;
BEGIN
    SELECT role INTO v_executor_role
    FROM public.user_tenant_mapping
    WHERE user_id = auth.uid() AND tenant_id = NEW.tenant_id
    LIMIT 1;

    IF v_executor_role = 'staff' THEN
        IF TG_OP = 'INSERT' AND NEW.permissions IS NOT NULL AND array_length(NEW.permissions, 1) > 0 THEN
            RAISE EXCEPTION 'Staff members cannot assign permissions to new staff.';
        END IF;

        IF TG_OP = 'UPDATE' AND NEW.permissions IS DISTINCT FROM OLD.permissions THEN
            RAISE EXCEPTION 'Staff members cannot modify staff permissions.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;




CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;




CREATE OR REPLACE FUNCTION "public"."update_election_results_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;




CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;




CREATE OR REPLACE FUNCTION "public"."validate_staff_permissions_entitlement"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_feature TEXT;
BEGIN
    IF NEW.permissions IS NOT NULL THEN
        FOREACH v_feature IN ARRAY NEW.permissions
        LOOP
            IF NOT public.has_feature_access(NEW.tenant_id, v_feature) THEN
                RAISE EXCEPTION 'Cannot assign permission "%": Feature is not enabled for this tenant.', v_feature;
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$;



SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_billing" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer" "text" NOT NULL,
    "plan" "text" NOT NULL,
    "amount" "text" NOT NULL,
    "status" "text" DEFAULT 'Paid'::"text",
    "nextbilling" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);




CREATE TABLE IF NOT EXISTS "public"."admin_support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer" "text" NOT NULL,
    "issue" "text" NOT NULL,
    "priority" "text" DEFAULT 'Medium'::"text",
    "status" "text" DEFAULT 'Open'::"text",
    "time" "text" DEFAULT 'Just now'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);




CREATE TABLE IF NOT EXISTS "public"."admin_updates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subject" "text" NOT NULL,
    "customer" "text" NOT NULL,
    "date" "text" NOT NULL,
    "priority" "text" DEFAULT 'Low'::"text",
    "status" "text" DEFAULT 'Under Review'::"text",
    "category" "text" DEFAULT 'Feature'::"text",
    "votes" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);




CREATE TABLE IF NOT EXISTS "public"."ai_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content_type" "text" NOT NULL,
    "tone" "text",
    "language" "text",
    "generated_content" "text" NOT NULL,
    "messages" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid"
);




CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "id" bigint NOT NULL,
    "nagarsevak_name_english" "text",
    "nagarsevak_name_marathi" "text",
    "ward_name" "text",
    "ward_number" "text",
    "party_name" "text",
    "party_logo_url" "text",
    "profile_image_url" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "single_row_check" CHECK (("id" = 1))
);




CREATE TABLE IF NOT EXISTS "public"."area_problems" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" character varying(20) NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "location" "text",
    "category" character varying(100),
    "status" character varying(50) DEFAULT 'Pending'::character varying,
    "photos" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    "reporter_name" "text",
    "reporter_mobile" "text",
    "voter_id" bigint
);




CREATE TABLE IF NOT EXISTS "public"."complaints" (
    "id" bigint NOT NULL,
    "user_id" "text",
    "user_name" "text",
    "problem" "text",
    "location" "text",
    "status" "text" DEFAULT 'Pending'::"text",
    "source" "text" DEFAULT 'Web'::"text",
    "category" "text" DEFAULT 'Complaint'::"text",
    "priority" "text" DEFAULT 'Medium'::"text",
    "voter_id" "text",
    "image_url" "text",
    "video_url" "text",
    "assigned_to" "text",
    "area" "text",
    "description_meta" "jsonb",
    "tenant_id" "uuid",
    "estimated_completion_date" "date",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);




ALTER TABLE "public"."complaints" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."complaints_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."conference_rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "meet_link" "text" NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text",
    "status" "text" DEFAULT 'scheduled'::"text",
    "invited_count" integer DEFAULT 0,
    "notes" "text"
);




CREATE TABLE IF NOT EXISTS "public"."election_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ward_name" "text" NOT NULL,
    "booth_number" "text" NOT NULL,
    "booth_name" "text" NOT NULL,
    "total_voters" integer DEFAULT 0 NOT NULL,
    "total_votes_casted" integer DEFAULT 0 NOT NULL,
    "candidate_votes" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "winner" "text",
    "margin" integer DEFAULT 0,
    "tenant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);




CREATE TABLE IF NOT EXISTS "public"."event_rsvps" (
    "id" bigint NOT NULL,
    "event_id" bigint,
    "voter_id" bigint,
    "status" "text" DEFAULT 'Pending'::"text",
    "response_source" "text" DEFAULT 'WhatsApp'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "event_rsvps_status_check" CHECK (("status" = ANY (ARRAY['Yes'::"text", 'No'::"text", 'Maybe'::"text", 'Pending'::"text"])))
);




ALTER TABLE "public"."event_rsvps" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."event_rsvps_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "event_date" "date",
    "event_time" time without time zone,
    "location" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "area" "text",
    "target_audience" "text" DEFAULT 'All'::"text",
    "status" "text" DEFAULT 'Planned'::"text",
    "type" "text" DEFAULT 'Public Meeting'::"text",
    "tenant_id" "uuid"
);




ALTER TABLE "public"."events" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feature_key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "module" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);




CREATE TABLE IF NOT EXISTS "public"."gallery" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "category" "text" NOT NULL,
    "image_url" "text",
    "description" "text",
    "date" "text",
    "sentiment" "text",
    "title_key" "text",
    "description_key" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid",
    CONSTRAINT "gallery_sentiment_check" CHECK (("sentiment" = ANY (ARRAY['positive'::"text", 'negative'::"text"])))
);




CREATE TABLE IF NOT EXISTS "public"."gb_diary" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meeting_date" "date",
    "meeting_type" "text",
    "subject" "text",
    "description" "text",
    "department" "text",
    "status" "text" DEFAULT 'Raised'::"text",
    "response" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "area" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "beneficiaries" "text",
    "tenant_id" "uuid"
);




CREATE TABLE IF NOT EXISTS "public"."housing_societies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "tenant_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000000'::"uuid",
    "name" "text" NOT NULL,
    "name_marathi" "text",
    "name_english" "text",
    "chairman_name" "text",
    "chairman_mobile" "text",
    "secretary_name" "text",
    "secretary_mobile" "text",
    "voter_count" integer DEFAULT 0,
    "favourable_voter_count" integer DEFAULT 0,
    "area" "text",
    "address" "text",
    "notes" "text",
    "status" "text" DEFAULT 'Active'::"text"
);




COMMENT ON TABLE "public"."housing_societies" IS 'Table to track local Co-operative Housing Societies, their executive bodies (Chairman & Secretary), and voter metrics.';



CREATE TABLE IF NOT EXISTS "public"."improvements" (
    "id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "location" "text",
    "area" "text",
    "status" "text" DEFAULT 'Proposed'::"text",
    "completion_date" "date",
    "votes" integer DEFAULT 0,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "tenant_id" "uuid"
);




ALTER TABLE "public"."improvements" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."improvements_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."incoming_letters" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "scanned_file_url" "text" NOT NULL,
    "file_type" character varying(50),
    "received_date" timestamp without time zone DEFAULT "now"(),
    "uploaded_by" "uuid",
    "area" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "tenant_id" "uuid"
);




CREATE TABLE IF NOT EXISTS "public"."letter_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "voter_id" bigint,
    "type" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'Pending'::"text",
    "pdf_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "area" "text",
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "letter_requests_status_check" CHECK (("status" = ANY (ARRAY['Pending'::"text", 'Approved'::"text", 'Rejected'::"text"])))
);

ALTER TABLE ONLY "public"."letter_requests" REPLICA IDENTITY FULL;




CREATE TABLE IF NOT EXISTS "public"."letter_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "template_content" "text",
    "name_marathi" "text",
    "tenant_id" "uuid" NOT NULL
);




CREATE TABLE IF NOT EXISTS "public"."login_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text",
    "ip_address" "text",
    "user_agent" "text",
    "device_type" "text",
    "browser" "text",
    "os" "text",
    "status" "text" DEFAULT 'success'::"text",
    "tenant_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);




CREATE TABLE IF NOT EXISTS "public"."message_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "channel" "text" NOT NULL,
    "message" "text" NOT NULL,
    "recipients" integer DEFAULT 0 NOT NULL,
    "sent_count" integer DEFAULT 0 NOT NULL,
    "failed_count" integer DEFAULT 0 NOT NULL,
    "created_by" "text",
    CONSTRAINT "message_logs_channel_check" CHECK (("channel" = ANY (ARRAY['whatsapp'::"text", 'sms'::"text"])))
);




CREATE TABLE IF NOT EXISTS "public"."non_voters" (
    "id" bigint NOT NULL,
    "name" "text",
    "mobile" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "tenant_id" "uuid"
);




ALTER TABLE "public"."non_voters" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."non_voters_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."opposition_karyakartas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "mobile" "text",
    "party" "text" NOT NULL,
    "role" "text",
    "area" "text",
    "strongholds" "text"[] DEFAULT '{}'::"text"[],
    "activities" "jsonb" DEFAULT '[]'::"jsonb",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "is_candidate" boolean DEFAULT false,
    "constituency" "text",
    "opposing_candidate" "text",
    "candidacy_status" "text",
    "candidate_id" "uuid",
    "negative_stories" "jsonb" DEFAULT '[]'::"jsonb"
);




COMMENT ON COLUMN "public"."opposition_karyakartas"."negative_stories" IS 'List of negative stories/controversies of opposition members';



CREATE TABLE IF NOT EXISTS "public"."personal_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "reporter_name" "text" NOT NULL,
    "reporter_mobile" "text" NOT NULL,
    "request_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "status" "text" DEFAULT 'Pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "voter_id" bigint,
    "category" "text"
);




CREATE TABLE IF NOT EXISTS "public"."phase5b_verify_results" (
    "test_number" integer,
    "status" "text",
    "message" "text",
    "run_time" timestamp without time zone DEFAULT "now"()
);




CREATE TABLE IF NOT EXISTS "public"."phase6_verify_results" (
    "test_number" integer NOT NULL,
    "status" "text",
    "message" "text"
);




CREATE TABLE IF NOT EXISTS "public"."plan_features" (
    "plan_id" "uuid" NOT NULL,
    "feature_id" "uuid" NOT NULL,
    "is_enabled" boolean DEFAULT true
);




CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);




CREATE TABLE IF NOT EXISTS "public"."sadasya" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "tenant_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000000'::"uuid" NOT NULL,
    "name" "text" NOT NULL,
    "name_marathi" "text",
    "name_english" "text",
    "mobile" "text",
    "age" integer,
    "gender" "text",
    "address" "text",
    "address_marathi" "text",
    "address_english" "text",
    "area" "text",
    "ward" "text",
    "is_voter" boolean DEFAULT false,
    "voter_id" "text",
    "status" "text" DEFAULT 'Active'::"text",
    "linked_voter_id" bigint
);




CREATE TABLE IF NOT EXISTS "public"."scheme_applications" (
    "id" bigint NOT NULL,
    "scheme_id" bigint,
    "voter_id" bigint,
    "applicant_name" "text" NOT NULL,
    "mobile" "text",
    "address" "text",
    "notes" "text",
    "status" "text" DEFAULT 'Pending'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "tenant_id" "uuid" NOT NULL,
    "benefit" "text" DEFAULT ''::"text",
    "rejection_reason" "text" DEFAULT ''::"text"
);




ALTER TABLE "public"."scheme_applications" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."scheme_applications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."schemes" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "eligibility" "text",
    "benefits" "text",
    "documents" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "tenant_id" "uuid",
    "name_mr" "text",
    "description_mr" "text",
    "eligibility_mr" "text",
    "benefits_mr" "text",
    "documents_mr" "text",
    "category" "text" DEFAULT 'All'::"text"
);




ALTER TABLE "public"."schemes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."schemes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."security_audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text",
    "event_type" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "user_agent" "text",
    "tenant_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);




CREATE TABLE IF NOT EXISTS "public"."social_organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "tenant_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000000'::"uuid",
    "name" "text" NOT NULL,
    "name_marathi" "text",
    "name_english" "text",
    "type" "text" NOT NULL,
    "president_name" "text",
    "president_mobile" "text",
    "members_count" integer DEFAULT 0,
    "area" "text",
    "established_year" integer,
    "support_received" "text",
    "events_conducted" "jsonb" DEFAULT '[]'::"jsonb",
    "description" "text",
    "status" "text" DEFAULT 'Active'::"text"
);




COMMENT ON TABLE "public"."social_organizations" IS 'Table to track local NGOs, Sports/Cricket Clubs, and Ganpati Mandals and their activities/support.';



CREATE TABLE IF NOT EXISTS "public"."staff" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "mobile" "text" NOT NULL,
    "role" "text" NOT NULL,
    "keywords" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "area" "text",
    "category" "text" DEFAULT 'Office'::"text",
    "tenant_id" "uuid",
    "permissions" "text"[] DEFAULT '{}'::"text"[],
    "party_wing" "text",
    CONSTRAINT "staff_permissions_check" CHECK (("permissions" IS NOT NULL))
);




CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" bigint NOT NULL,
    "tenant_id" "uuid",
    "category" "text",
    "plan" "text",
    "user_id" "text",
    "user_name" "text",
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "priority" "text" DEFAULT 'Medium'::"text",
    "status" "text" DEFAULT 'Pending'::"text",
    "description_meta" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);




ALTER TABLE "public"."support_tickets" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."support_tickets_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."survey_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "tenant_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000000'::"uuid" NOT NULL,
    "survey_id" "uuid" NOT NULL,
    "voter_id" bigint,
    "answers" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);




CREATE TABLE IF NOT EXISTS "public"."surveys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "tenant_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000000'::"uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "area" "text",
    "status" "text" DEFAULT 'Draft'::"text",
    "questions" "jsonb" DEFAULT '[]'::"jsonb",
    "target_sample_size" integer DEFAULT 0
);




CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "priority" "text" DEFAULT 'Medium'::"text",
    "due_date" "date",
    "due_time" time without time zone,
    "address" "text",
    "status" "text" DEFAULT 'Pending'::"text",
    "assigned_to" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "office_name" "text",
    "meet_person_name" "text",
    "assigned_staff_id" "uuid",
    CONSTRAINT "tasks_priority_check" CHECK (("priority" = ANY (ARRAY['Low'::"text", 'Medium'::"text", 'High'::"text"]))),
    CONSTRAINT "tasks_status_check" CHECK (("status" = ANY (ARRAY['Pending'::"text", 'Completed'::"text", 'In Progress'::"text"])))
);




COMMENT ON COLUMN "public"."tasks"."office_name" IS 'Name of the office related to the task';



COMMENT ON COLUMN "public"."tasks"."meet_person_name" IS 'Name of the person to meet';



COMMENT ON COLUMN "public"."tasks"."assigned_staff_id" IS 'ID of the staff member assigned to the task';



CREATE TABLE IF NOT EXISTS "public"."tenant_feature_overrides" (
    "tenant_id" "uuid" NOT NULL,
    "feature_id" "uuid" NOT NULL,
    "is_enabled" boolean NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);




CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "subdomain" "text" NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "party" "text",
    "mahanagarPalika" "text",
    "ward" "text",
    "prabhag" "text",
    "email" "text",
    "mobile" "text",
    "plan" "text",
    "endDate" "text",
    "representativeName" "text",
    "representativeContact" "text",
    "status" "text",
    "lastActive" "text",
    "citizenCount" "text",
    "workerCount" integer,
    "tier" "text" DEFAULT 'nagarsevak'::"text",
    CONSTRAINT "tenants_tier_check" CHECK (("tier" = ANY (ARRAY['nagarsevak'::"text", 'amdar'::"text", 'khasdar'::"text", 'minister'::"text"])))
);




CREATE TABLE IF NOT EXISTS "public"."user_tenant_mapping" (
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'staff'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);




CREATE TABLE IF NOT EXISTS "public"."visitors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "mobile" "text",
    "purpose" "text",
    "remarks" "text",
    "visit_date" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "status" "text" DEFAULT 'Visited'::"text",
    "reference" "text",
    "area" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "tenant_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000000'::"uuid"
);




COMMENT ON COLUMN "public"."visitors"."metadata" IS 'Stores dynamic fields based on visit purpose (e.g., event_date, event_time for Greetings)';



CREATE TABLE IF NOT EXISTS "public"."voter_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "voter_id" bigint,
    "applicant_name" "text" NOT NULL,
    "applicant_mobile" "text",
    "form_type" "text" NOT NULL,
    "status" "text" DEFAULT 'Submitted'::"text",
    "notes" "text",
    "created_by" "uuid"
);




CREATE TABLE IF NOT EXISTS "public"."voters" (
    "id" bigint NOT NULL,
    "epic_no" "text",
    "name_marathi" "text",
    "name_english" "text",
    "relation_name_marathi" "text",
    "relation_name_english" "text",
    "relation_type" "text",
    "house_no" "text",
    "age" integer,
    "gender" "text",
    "address_marathi" "text",
    "address_english" "text",
    "ac_no" integer,
    "part_no" integer,
    "serial_no" "text",
    "new_serial_no" integer,
    "mobile" "text",
    "ward_no" "text",
    "caste" "text",
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "is_friend_relative" boolean DEFAULT false,
    "tenant_id" "uuid",
    "dob" "date",
    "current_address_english" "text",
    "current_address_marathi" "text",
    "profession" "text",
    "favour" "text"
);




COMMENT ON COLUMN "public"."voters"."favour" IS 'Voter political alignment: Favourable, Against, Neutral, Doubtful';



ALTER TABLE "public"."voters" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."voters_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."ward_provisions" (
    "id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "requested_amount" numeric NOT NULL,
    "sanctioned_amount" numeric,
    "requested_date" "date" DEFAULT CURRENT_DATE,
    "sanctioned_date" "date",
    "status" "text" DEFAULT 'Pending'::"text",
    "financial_year" "text",
    "category" "text",
    "letter_reference" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "tenant_id" "uuid",
    "area" "text" DEFAULT ''::"text"
);




ALTER TABLE "public"."ward_provisions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."ward_provisions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."whatsapp_sessions" (
    "session_id" "text" NOT NULL,
    "id" "text" NOT NULL,
    "data" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);




CREATE TABLE IF NOT EXISTS "public"."work_tracker_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "work_tracker_id" "uuid",
    "stage_name" "text" NOT NULL,
    "location" "text",
    "status_description" "text",
    "updated_by" "uuid",
    "tenant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);




CREATE TABLE IF NOT EXISTS "public"."work_trackers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "subject" "text",
    "department" "text",
    "inward_number" "text",
    "outward_number" "text",
    "current_status" "text" DEFAULT 'Pending'::"text" NOT NULL,
    "description" "text",
    "tenant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);




CREATE TABLE IF NOT EXISTS "public"."works" (
    "id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "location" "text",
    "status" "text" DEFAULT 'Completed'::"text",
    "completion_date" "date",
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "area" "text",
    "metadata" "jsonb",
    "tenant_id" "uuid",
    "amount" numeric
);




ALTER TABLE "public"."works" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."works_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."admin_billing"
    ADD CONSTRAINT "admin_billing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_support_tickets"
    ADD CONSTRAINT "admin_support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_updates"
    ADD CONSTRAINT "admin_updates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_history"
    ADD CONSTRAINT "ai_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."area_problems"
    ADD CONSTRAINT "area_problems_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."complaints"
    ADD CONSTRAINT "complaints_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conference_rooms"
    ADD CONSTRAINT "conference_rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."election_results"
    ADD CONSTRAINT "election_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_event_id_voter_id_key" UNIQUE ("event_id", "voter_id");



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_feature_key_key" UNIQUE ("feature_key");



ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gallery"
    ADD CONSTRAINT "gallery_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gb_diary"
    ADD CONSTRAINT "gb_diary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."housing_societies"
    ADD CONSTRAINT "housing_societies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."improvements"
    ADD CONSTRAINT "improvements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."incoming_letters"
    ADD CONSTRAINT "incoming_letters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."letter_requests"
    ADD CONSTRAINT "letter_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."letter_types"
    ADD CONSTRAINT "letter_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."letter_types"
    ADD CONSTRAINT "letter_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."login_logs"
    ADD CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_logs"
    ADD CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."non_voters"
    ADD CONSTRAINT "non_voters_mobile_key" UNIQUE ("mobile");



ALTER TABLE ONLY "public"."non_voters"
    ADD CONSTRAINT "non_voters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opposition_karyakartas"
    ADD CONSTRAINT "opposition_karyakartas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personal_requests"
    ADD CONSTRAINT "personal_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."phase6_verify_results"
    ADD CONSTRAINT "phase6_verify_results_pkey" PRIMARY KEY ("test_number");



ALTER TABLE ONLY "public"."plan_features"
    ADD CONSTRAINT "plan_features_pkey" PRIMARY KEY ("plan_id", "feature_id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_plan_key_key" UNIQUE ("plan_key");



ALTER TABLE ONLY "public"."sadasya"
    ADD CONSTRAINT "sadasya_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scheme_applications"
    ADD CONSTRAINT "scheme_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schemes"
    ADD CONSTRAINT "schemes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_audit_logs"
    ADD CONSTRAINT "security_audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."social_organizations"
    ADD CONSTRAINT "social_organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."surveys"
    ADD CONSTRAINT "surveys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenant_feature_overrides"
    ADD CONSTRAINT "tenant_feature_overrides_pkey" PRIMARY KEY ("tenant_id", "feature_id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_subdomain_key" UNIQUE ("subdomain");



ALTER TABLE ONLY "public"."user_tenant_mapping"
    ADD CONSTRAINT "user_tenant_mapping_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."visitors"
    ADD CONSTRAINT "visitors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."voter_applications"
    ADD CONSTRAINT "voter_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."voters"
    ADD CONSTRAINT "voters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ward_provisions"
    ADD CONSTRAINT "ward_provisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_sessions"
    ADD CONSTRAINT "whatsapp_sessions_pkey" PRIMARY KEY ("session_id", "id");



ALTER TABLE ONLY "public"."work_tracker_history"
    ADD CONSTRAINT "work_tracker_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_trackers"
    ADD CONSTRAINT "work_trackers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."works"
    ADD CONSTRAINT "works_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_area_problems_created_at" ON "public"."area_problems" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_area_problems_reporter_mobile" ON "public"."area_problems" USING "btree" ("reporter_mobile");



CREATE INDEX "idx_area_problems_status" ON "public"."area_problems" USING "btree" ("status");



CREATE INDEX "idx_area_problems_tenant_id" ON "public"."area_problems" USING "btree" ("tenant_id");



CREATE INDEX "idx_area_problems_voter_id" ON "public"."area_problems" USING "btree" ("voter_id");



CREATE INDEX "idx_election_results_booth_number" ON "public"."election_results" USING "btree" ("booth_number");



CREATE INDEX "idx_election_results_tenant_id" ON "public"."election_results" USING "btree" ("tenant_id");



CREATE INDEX "idx_election_results_ward_name" ON "public"."election_results" USING "btree" ("ward_name");



CREATE INDEX "idx_event_rsvps_event_id" ON "public"."event_rsvps" USING "btree" ("event_id");



CREATE INDEX "idx_events_area" ON "public"."events" USING "btree" ("area");



CREATE INDEX "idx_events_audience" ON "public"."events" USING "btree" ("target_audience");



CREATE INDEX "idx_events_date" ON "public"."events" USING "btree" ("event_date");



CREATE INDEX "idx_events_status" ON "public"."events" USING "btree" ("status");



CREATE INDEX "idx_features_key" ON "public"."features" USING "btree" ("feature_key");



CREATE INDEX "idx_gb_diary_area" ON "public"."gb_diary" USING "btree" ("area");



CREATE INDEX "idx_incoming_letters_area" ON "public"."incoming_letters" USING "btree" ("area");



CREATE INDEX "idx_incoming_letters_created_at" ON "public"."incoming_letters" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_letter_requests_voter_id" ON "public"."letter_requests" USING "btree" ("voter_id");



CREATE INDEX "idx_letter_types_tenant_id" ON "public"."letter_types" USING "btree" ("tenant_id");



CREATE INDEX "idx_message_logs_tenant_sent" ON "public"."message_logs" USING "btree" ("tenant_id", "sent_at" DESC);



CREATE INDEX "idx_opposition_karyakartas_tenant" ON "public"."opposition_karyakartas" USING "btree" ("tenant_id");



CREATE INDEX "idx_personal_requests_voter_id" ON "public"."personal_requests" USING "btree" ("voter_id");



CREATE INDEX "idx_pf_plan_feature" ON "public"."plan_features" USING "btree" ("plan_id", "feature_id");



CREATE UNIQUE INDEX "idx_plans_key" ON "public"."plans" USING "btree" ("plan_key");



CREATE INDEX "idx_tfo_tenant_feature" ON "public"."tenant_feature_overrides" USING "btree" ("tenant_id", "feature_id");



CREATE INDEX "idx_visitors_area" ON "public"."visitors" USING "btree" ("area");



CREATE INDEX "idx_visitors_tenant_id" ON "public"."visitors" USING "btree" ("tenant_id");



CREATE INDEX "idx_work_tracker_history_tracker_id" ON "public"."work_tracker_history" USING "btree" ("work_tracker_id");



CREATE INDEX "idx_work_trackers_tenant_id" ON "public"."work_trackers" USING "btree" ("tenant_id");



CREATE INDEX "improvements_tenant_id_idx" ON "public"."improvements" USING "btree" ("tenant_id");



CREATE INDEX "tasks_tenant_id_idx" ON "public"."tasks" USING "btree" ("tenant_id");



CREATE INDEX "ward_provisions_tenant_id_idx" ON "public"."ward_provisions" USING "btree" ("tenant_id");



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."voter_applications" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "notify-letter-status-webhook" AFTER UPDATE ON "public"."letter_requests" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://qdvciisgxvupvrjygedr.supabase.co/functions/v1/notify-letter-status', 'POST', '{"Content-type":"application/json","Webhook-Secret":"d7d70be540fd4bd9524f5764572215efbf953e90d70d902742b4f7862d3e8279","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkdmNpaXNneHZ1cHZyanlnZWRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA4OTM2MCwiZXhwIjoyMDg0NjY1MzYwfQ.uHM3Gb-rpW87Fz02d-E6lVB50o13VWXfRmWZ15KzhXQ"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "trg_cascade_tenant_details" AFTER UPDATE ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION "public"."cascade_tenant_details_update"();



CREATE OR REPLACE TRIGGER "trg_derive_survey_response_tenant" BEFORE INSERT ON "public"."survey_responses" FOR EACH ROW EXECUTE FUNCTION "public"."derive_survey_response_tenant"();



CREATE OR REPLACE TRIGGER "trg_populate_details_ai_history" BEFORE INSERT OR UPDATE ON "public"."ai_history" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_event_rsvps" BEFORE INSERT OR UPDATE ON "public"."event_rsvps" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_events" BEFORE INSERT OR UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_gallery" BEFORE INSERT OR UPDATE ON "public"."gallery" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_gb_diary" BEFORE INSERT OR UPDATE ON "public"."gb_diary" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_housing_societies" BEFORE INSERT OR UPDATE ON "public"."housing_societies" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_improvements" BEFORE INSERT OR UPDATE ON "public"."improvements" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_incoming_letters" BEFORE INSERT OR UPDATE ON "public"."incoming_letters" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_letter_types" BEFORE INSERT OR UPDATE ON "public"."letter_types" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_message_logs" BEFORE INSERT OR UPDATE ON "public"."message_logs" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_non_voters" BEFORE INSERT OR UPDATE ON "public"."non_voters" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_personal_requests" BEFORE INSERT OR UPDATE ON "public"."personal_requests" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_sadasya" BEFORE INSERT OR UPDATE ON "public"."sadasya" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_schemes" BEFORE INSERT OR UPDATE ON "public"."schemes" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_social_organizations" BEFORE INSERT OR UPDATE ON "public"."social_organizations" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_staff" BEFORE INSERT OR UPDATE ON "public"."staff" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_support_tickets" BEFORE INSERT OR UPDATE ON "public"."support_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_survey_responses" BEFORE INSERT OR UPDATE ON "public"."survey_responses" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_surveys" BEFORE INSERT OR UPDATE ON "public"."surveys" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_visitors" BEFORE INSERT OR UPDATE ON "public"."visitors" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_voters" BEFORE INSERT OR UPDATE ON "public"."voters" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_ward_provisions" BEFORE INSERT OR UPDATE ON "public"."ward_provisions" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_work_trackers" BEFORE INSERT OR UPDATE ON "public"."work_trackers" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_populate_details_works" BEFORE INSERT OR UPDATE ON "public"."works" FOR EACH ROW EXECUTE FUNCTION "public"."populate_record_tenant_details"();



CREATE OR REPLACE TRIGGER "trg_prevent_staff_permission_escalation" BEFORE INSERT OR UPDATE ON "public"."staff" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_staff_permission_escalation"();



CREATE OR REPLACE TRIGGER "trg_validate_staff_permissions" BEFORE INSERT OR UPDATE OF "permissions" ON "public"."staff" FOR EACH ROW EXECUTE FUNCTION "public"."validate_staff_permissions_entitlement"();



CREATE OR REPLACE TRIGGER "trigger_create_task_from_visitor" AFTER INSERT ON "public"."visitors" FOR EACH ROW EXECUTE FUNCTION "public"."create_task_from_visitor"();



CREATE OR REPLACE TRIGGER "trigger_update_election_results_updated_at" BEFORE UPDATE ON "public"."election_results" FOR EACH ROW EXECUTE FUNCTION "public"."update_election_results_updated_at"();



CREATE OR REPLACE TRIGGER "update_tenants_updated_at" BEFORE UPDATE ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."ai_history"
    ADD CONSTRAINT "ai_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."area_problems"
    ADD CONSTRAINT "area_problems_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."area_problems"
    ADD CONSTRAINT "area_problems_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "public"."voters"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."complaints"
    ADD CONSTRAINT "complaints_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."election_results"
    ADD CONSTRAINT "election_results_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "public"."voters"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."improvements"
    ADD CONSTRAINT "fk_improvements_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."letter_types"
    ADD CONSTRAINT "fk_letter_types_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ward_provisions"
    ADD CONSTRAINT "fk_ward_provisions_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."gallery"
    ADD CONSTRAINT "gallery_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gb_diary"
    ADD CONSTRAINT "gb_diary_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."incoming_letters"
    ADD CONSTRAINT "incoming_letters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incoming_letters"
    ADD CONSTRAINT "incoming_letters_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."letter_requests"
    ADD CONSTRAINT "letter_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."letter_requests"
    ADD CONSTRAINT "letter_requests_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "public"."voters"("id");



ALTER TABLE ONLY "public"."login_logs"
    ADD CONSTRAINT "login_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."login_logs"
    ADD CONSTRAINT "login_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."non_voters"
    ADD CONSTRAINT "non_voters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."opposition_karyakartas"
    ADD CONSTRAINT "opposition_karyakartas_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."opposition_karyakartas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."personal_requests"
    ADD CONSTRAINT "personal_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."personal_requests"
    ADD CONSTRAINT "personal_requests_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "public"."voters"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."plan_features"
    ADD CONSTRAINT "plan_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plan_features"
    ADD CONSTRAINT "plan_features_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sadasya"
    ADD CONSTRAINT "sadasya_linked_voter_id_fkey" FOREIGN KEY ("linked_voter_id") REFERENCES "public"."voters"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."scheme_applications"
    ADD CONSTRAINT "scheme_applications_scheme_id_fkey" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id");



ALTER TABLE ONLY "public"."scheme_applications"
    ADD CONSTRAINT "scheme_applications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."scheme_applications"
    ADD CONSTRAINT "scheme_applications_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "public"."voters"("id");



ALTER TABLE ONLY "public"."schemes"
    ADD CONSTRAINT "schemes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."security_audit_logs"
    ADD CONSTRAINT "security_audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."security_audit_logs"
    ADD CONSTRAINT "security_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."survey_responses"
    ADD CONSTRAINT "survey_responses_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "public"."voters"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_staff_id_fkey" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."tenant_feature_overrides"
    ADD CONSTRAINT "tenant_feature_overrides_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_feature_overrides"
    ADD CONSTRAINT "tenant_feature_overrides_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tenant_mapping"
    ADD CONSTRAINT "user_tenant_mapping_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tenant_mapping"
    ADD CONSTRAINT "user_tenant_mapping_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."voter_applications"
    ADD CONSTRAINT "voter_applications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."voter_applications"
    ADD CONSTRAINT "voter_applications_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "public"."voters"("id");



ALTER TABLE ONLY "public"."voters"
    ADD CONSTRAINT "voters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."work_tracker_history"
    ADD CONSTRAINT "work_tracker_history_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."work_tracker_history"
    ADD CONSTRAINT "work_tracker_history_work_tracker_id_fkey" FOREIGN KEY ("work_tracker_id") REFERENCES "public"."work_trackers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."works"
    ADD CONSTRAINT "works_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



CREATE POLICY "Admin Delete election_results" ON "public"."election_results" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping"
  WHERE (("user_tenant_mapping"."user_id" = "auth"."uid"()) AND ("user_tenant_mapping"."tenant_id" = "election_results"."tenant_id") AND ("user_tenant_mapping"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admin Insert election_results" ON "public"."election_results" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping"
  WHERE (("user_tenant_mapping"."user_id" = "auth"."uid"()) AND ("user_tenant_mapping"."tenant_id" = "election_results"."tenant_id") AND ("user_tenant_mapping"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admin Update election_results" ON "public"."election_results" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping"
  WHERE (("user_tenant_mapping"."user_id" = "auth"."uid"()) AND ("user_tenant_mapping"."tenant_id" = "election_results"."tenant_id") AND ("user_tenant_mapping"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admins Select security_audit_logs" ON "public"."security_audit_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping"
  WHERE (("user_tenant_mapping"."user_id" = "auth"."uid"()) AND ("user_tenant_mapping"."tenant_id" = "security_audit_logs"."tenant_id") AND ("user_tenant_mapping"."role" = ANY (ARRAY['nagarsevak'::"text", 'admin'::"text", 'amdar'::"text", 'khasdar'::"text", 'minister'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Anon Event RSVP" ON "public"."event_rsvps" FOR INSERT TO "anon" WITH CHECK ((("tenant_id" = "public"."get_event_tenant"("event_id")) AND (("voter_id" IS NULL) OR ("tenant_id" = ( SELECT "voters"."tenant_id"
   FROM "public"."voters"
  WHERE (("voters"."id")::"text" = ("event_rsvps"."voter_id")::"text"))))));



CREATE POLICY "Anon Survey Insert" ON "public"."survey_responses" FOR INSERT TO "anon" WITH CHECK (("tenant_id" = "public"."get_survey_tenant"("survey_id")));



CREATE POLICY "Anon Survey Select" ON "public"."surveys" FOR SELECT TO "anon" USING (("status" = 'Active'::"text"));



CREATE POLICY "Auth Complaint Delete" ON "public"."complaints" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Auth Complaint Select" ON "public"."complaints" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Auth RSVP Delete" ON "public"."event_rsvps" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Auth RSVP Insert" ON "public"."event_rsvps" FOR INSERT TO "authenticated" WITH CHECK ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND ("tenant_id" = ( SELECT "events"."tenant_id"
   FROM "public"."events"
  WHERE ("events"."id" = "event_rsvps"."event_id"))) AND (("voter_id" IS NULL) OR ("tenant_id" = ( SELECT "voters"."tenant_id"
   FROM "public"."voters"
  WHERE (("voters"."id")::"text" = ("event_rsvps"."voter_id")::"text"))))));



CREATE POLICY "Auth RSVP Select" ON "public"."event_rsvps" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Auth RSVP Update" ON "public"."event_rsvps" FOR UPDATE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants"))) WITH CHECK ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND ("tenant_id" = ( SELECT "events"."tenant_id"
   FROM "public"."events"
  WHERE ("events"."id" = "event_rsvps"."event_id"))) AND (("voter_id" IS NULL) OR ("tenant_id" = ( SELECT "voters"."tenant_id"
   FROM "public"."voters"
  WHERE (("voters"."id")::"text" = ("event_rsvps"."voter_id")::"text"))))));



CREATE POLICY "Auth Scheme Delete" ON "public"."scheme_applications" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Auth Scheme Insert" ON "public"."scheme_applications" FOR INSERT TO "authenticated" WITH CHECK ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND ("tenant_id" = ( SELECT "schemes"."tenant_id"
   FROM "public"."schemes"
  WHERE ("schemes"."id" = "scheme_applications"."scheme_id"))) AND (("voter_id" IS NULL) OR ("tenant_id" = ( SELECT "voters"."tenant_id"
   FROM "public"."voters"
  WHERE (("voters"."id")::"text" = ("scheme_applications"."voter_id")::"text"))))));



CREATE POLICY "Auth Scheme Select" ON "public"."scheme_applications" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Auth Scheme Update" ON "public"."scheme_applications" FOR UPDATE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants"))) WITH CHECK ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND ("tenant_id" = ( SELECT "schemes"."tenant_id"
   FROM "public"."schemes"
  WHERE ("schemes"."id" = "scheme_applications"."scheme_id"))) AND (("voter_id" IS NULL) OR ("tenant_id" = ( SELECT "voters"."tenant_id"
   FROM "public"."voters"
  WHERE (("voters"."id")::"text" = ("scheme_applications"."voter_id")::"text"))))));



CREATE POLICY "Auth Select election_results" ON "public"."election_results" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Auth Survey Delete" ON "public"."survey_responses" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Auth Survey Insert" ON "public"."survey_responses" FOR INSERT TO "authenticated" WITH CHECK ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND ("tenant_id" = ( SELECT "surveys"."tenant_id"
   FROM "public"."surveys"
  WHERE ("surveys"."id" = "survey_responses"."survey_id"))) AND (("voter_id" IS NULL) OR ("tenant_id" = ( SELECT "voters"."tenant_id"
   FROM "public"."voters"
  WHERE (("voters"."id")::"text" = ("survey_responses"."voter_id")::"text"))))));



CREATE POLICY "Auth Survey Select" ON "public"."survey_responses" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Auth Survey Update" ON "public"."survey_responses" FOR UPDATE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants"))) WITH CHECK ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND ("tenant_id" = ( SELECT "surveys"."tenant_id"
   FROM "public"."surveys"
  WHERE ("surveys"."id" = "survey_responses"."survey_id"))) AND (("voter_id" IS NULL) OR ("tenant_id" = ( SELECT "voters"."tenant_id"
   FROM "public"."voters"
  WHERE (("voters"."id")::"text" = ("survey_responses"."voter_id")::"text"))))));



CREATE POLICY "Auth VA Delete" ON "public"."voter_applications" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Auth VA Select" ON "public"."voter_applications" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Auth WTH Delete" ON "public"."work_tracker_history" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Auth WTH Insert" ON "public"."work_tracker_history" FOR INSERT TO "authenticated" WITH CHECK ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND ("tenant_id" = ( SELECT "work_trackers"."tenant_id"
   FROM "public"."work_trackers"
  WHERE ("work_trackers"."id" = "work_tracker_history"."work_tracker_id")))));



CREATE POLICY "Auth WTH Select" ON "public"."work_tracker_history" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Auth WTH Update" ON "public"."work_tracker_history" FOR UPDATE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants"))) WITH CHECK ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND ("tenant_id" = ( SELECT "work_trackers"."tenant_id"
   FROM "public"."work_trackers"
  WHERE ("work_trackers"."id" = "work_tracker_history"."work_tracker_id")))));



CREATE POLICY "Enable all access for tenant users_del" ON "public"."scheme_applications" FOR DELETE USING (("tenant_id" IN ( SELECT "user_tenant_mapping"."tenant_id"
   FROM "public"."user_tenant_mapping"
  WHERE ("user_tenant_mapping"."user_id" = "auth"."uid"()))));



CREATE POLICY "Enable all access for tenant users_ins" ON "public"."scheme_applications" FOR INSERT WITH CHECK ((("tenant_id" IN ( SELECT "user_tenant_mapping"."tenant_id"
   FROM "public"."user_tenant_mapping"
  WHERE ("user_tenant_mapping"."user_id" = "auth"."uid"()))) AND (("auth"."role"() = 'anon'::"text") OR "public"."has_feature_access"("tenant_id", 'schemes'::"text"))));



CREATE POLICY "Enable all access for tenant users_sel" ON "public"."scheme_applications" FOR SELECT USING (("tenant_id" IN ( SELECT "user_tenant_mapping"."tenant_id"
   FROM "public"."user_tenant_mapping"
  WHERE ("user_tenant_mapping"."user_id" = "auth"."uid"()))));



CREATE POLICY "Enable all access for tenant users_upd" ON "public"."scheme_applications" FOR UPDATE USING ((("tenant_id" IN ( SELECT "user_tenant_mapping"."tenant_id"
   FROM "public"."user_tenant_mapping"
  WHERE ("user_tenant_mapping"."user_id" = "auth"."uid"()))) AND (("auth"."role"() = 'anon'::"text") OR "public"."has_feature_access"("tenant_id", 'schemes'::"text")))) WITH CHECK ((("tenant_id" IN ( SELECT "user_tenant_mapping"."tenant_id"
   FROM "public"."user_tenant_mapping"
  WHERE ("user_tenant_mapping"."user_id" = "auth"."uid"()))) AND (("auth"."role"() = 'anon'::"text") OR "public"."has_feature_access"("tenant_id", 'schemes'::"text"))));



CREATE POLICY "Nagarsevak Select All login_logs" ON "public"."login_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping"
  WHERE (("user_tenant_mapping"."user_id" = "auth"."uid"()) AND ("user_tenant_mapping"."tenant_id" = "login_logs"."tenant_id") AND ("user_tenant_mapping"."role" = ANY (ARRAY['nagarsevak'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Public read access to tenants" ON "public"."tenants" FOR SELECT USING (true);



CREATE POLICY "Super Admin Access admin_billing" ON "public"."admin_billing" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping"
  WHERE (("user_tenant_mapping"."user_id" = "auth"."uid"()) AND ("user_tenant_mapping"."role" = 'super_admin'::"text")))));



CREATE POLICY "Super Admin Access admin_support_tickets" ON "public"."admin_support_tickets" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping"
  WHERE (("user_tenant_mapping"."user_id" = "auth"."uid"()) AND ("user_tenant_mapping"."role" = 'super_admin'::"text")))));



CREATE POLICY "Super Admin Access admin_updates" ON "public"."admin_updates" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping"
  WHERE (("user_tenant_mapping"."user_id" = "auth"."uid"()) AND ("user_tenant_mapping"."role" = 'super_admin'::"text")))));



CREATE POLICY "Tenant Delete ai_history" ON "public"."ai_history" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Delete events" ON "public"."events" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Delete gallery" ON "public"."gallery" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Delete gb_diary" ON "public"."gb_diary" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Delete housing_societies" ON "public"."housing_societies" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Delete improvements" ON "public"."improvements" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Delete incoming_letters" ON "public"."incoming_letters" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Delete message_logs" ON "public"."message_logs" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Delete non_voters" ON "public"."non_voters" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Delete schemes" ON "public"."schemes" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Delete social_organizations" ON "public"."social_organizations" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Delete staff" ON "public"."staff" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Delete support_tickets" ON "public"."support_tickets" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Delete surveys" ON "public"."surveys" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Delete tasks" ON "public"."tasks" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Delete visitors" ON "public"."visitors" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Delete voters" ON "public"."voters" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Delete ward_provisions" ON "public"."ward_provisions" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Delete work_trackers" ON "public"."work_trackers" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Delete works" ON "public"."works" FOR DELETE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Insert support_tickets" ON "public"."support_tickets" FOR INSERT TO "authenticated" WITH CHECK (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."ai_history" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "ai_history"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'ai_content'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."complaints" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "complaints"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'complaints'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."event_rsvps" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "event_rsvps"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'events'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."events" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "events"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'events'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."gallery" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "gallery"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'gallery'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."gb_diary" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "gb_diary"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'gb_register'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."housing_societies" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "housing_societies"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'housing_societies'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."improvements" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "improvements"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'improvements'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."incoming_letters" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "incoming_letters"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'letters'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."message_logs" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "message_logs"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'messages'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."non_voters" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "non_voters"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'election_results'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."schemes" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "schemes"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'schemes'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."social_organizations" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "social_organizations"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'social_organizations'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."staff" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "staff"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'staff'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."survey_responses" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "survey_responses"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'surveys'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."surveys" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "surveys"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'surveys'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."tasks" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "tasks"."tenant_id")))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'tasks'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."visitors" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "visitors"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'visitors'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."voter_applications" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "voter_applications"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'election_results'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."voters" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "voters"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'election_results'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."ward_provisions" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "ward_provisions"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'ward_provisions'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."work_trackers" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "work_trackers"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'works'::"text")));



CREATE POLICY "Tenant Isolation Insert" ON "public"."works" FOR INSERT WITH CHECK ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "works"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'works'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."ai_history" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "ai_history"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'ai_content'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."complaints" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "complaints"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'complaints'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."event_rsvps" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "event_rsvps"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'events'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."events" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "events"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'events'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."gallery" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "gallery"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'gallery'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."gb_diary" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "gb_diary"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'gb_register'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."housing_societies" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "housing_societies"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'housing_societies'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."improvements" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "improvements"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'improvements'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."incoming_letters" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "incoming_letters"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'letters'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."message_logs" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "message_logs"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'messages'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."non_voters" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "non_voters"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'election_results'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."schemes" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "schemes"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'schemes'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."social_organizations" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "social_organizations"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'social_organizations'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."staff" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "staff"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'staff'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."survey_responses" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "survey_responses"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'surveys'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."surveys" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "surveys"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'surveys'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."tasks" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "tasks"."tenant_id")))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'tasks'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."visitors" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "visitors"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'visitors'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."voter_applications" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "voter_applications"."tenant_id")))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'election_results'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."voters" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "voters"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'election_results'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."ward_provisions" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "ward_provisions"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'ward_provisions'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."work_trackers" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "work_trackers"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'works'::"text")));



CREATE POLICY "Tenant Isolation Update" ON "public"."works" FOR UPDATE USING ((((EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."tenant_id" = "works"."tenant_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."user_tenant_mapping" "utm"
  WHERE (("utm"."user_id" = "auth"."uid"()) AND ("utm"."role" = 'super_admin'::"text"))))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'works'::"text")));



CREATE POLICY "Tenant Select ai_history" ON "public"."ai_history" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Select events" ON "public"."events" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Select gallery" ON "public"."gallery" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Select gb_diary" ON "public"."gb_diary" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Select housing_societies" ON "public"."housing_societies" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Select improvements" ON "public"."improvements" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Select incoming_letters" ON "public"."incoming_letters" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Select message_logs" ON "public"."message_logs" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Select non_voters" ON "public"."non_voters" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Select schemes" ON "public"."schemes" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Select social_organizations" ON "public"."social_organizations" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Select staff" ON "public"."staff" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Select support_tickets" ON "public"."support_tickets" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Select surveys" ON "public"."surveys" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Select tasks" ON "public"."tasks" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Select visitors" ON "public"."visitors" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Select voters" ON "public"."voters" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Select ward_provisions" ON "public"."ward_provisions" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Select work_trackers" ON "public"."work_trackers" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Select works" ON "public"."works" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Tenant Update support_tickets" ON "public"."support_tickets" FOR UPDATE TO "authenticated" USING (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants"))) WITH CHECK (("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")));



CREATE POLICY "Unified Area Problems Delete" ON "public"."area_problems" FOR DELETE TO "authenticated" USING ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'ward_problems'::"text")));



CREATE POLICY "Unified Area Problems Insert" ON "public"."area_problems" FOR INSERT TO "authenticated" WITH CHECK ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'ward_problems'::"text")));



CREATE POLICY "Unified Area Problems Select" ON "public"."area_problems" FOR SELECT TO "authenticated" USING ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'ward_problems'::"text")));



CREATE POLICY "Unified Area Problems Update" ON "public"."area_problems" FOR UPDATE TO "authenticated" USING ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'ward_problems'::"text"))) WITH CHECK ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'ward_problems'::"text")));



CREATE POLICY "Unified Letter Delete" ON "public"."letter_requests" FOR DELETE TO "authenticated" USING ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'letters'::"text")));



CREATE POLICY "Unified Letter Insert" ON "public"."letter_requests" FOR INSERT TO "authenticated" WITH CHECK ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'letters'::"text") AND (("voter_id" IS NULL) OR ("tenant_id" = ( SELECT "v"."tenant_id"
   FROM "public"."voters" "v"
  WHERE (("v"."id")::"text" = ("letter_requests"."voter_id")::"text"))))));



CREATE POLICY "Unified Letter Select" ON "public"."letter_requests" FOR SELECT TO "authenticated" USING ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'letters'::"text")));



CREATE POLICY "Unified Letter Types Delete" ON "public"."letter_types" FOR DELETE TO "authenticated" USING ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'letters'::"text")));



CREATE POLICY "Unified Letter Types Insert" ON "public"."letter_types" FOR INSERT TO "authenticated" WITH CHECK ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'letters'::"text")));



CREATE POLICY "Unified Letter Types Select" ON "public"."letter_types" FOR SELECT TO "authenticated" USING ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'letters'::"text")));



CREATE POLICY "Unified Letter Types Update" ON "public"."letter_types" FOR UPDATE TO "authenticated" USING ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'letters'::"text"))) WITH CHECK ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'letters'::"text")));



CREATE POLICY "Unified Letter Update" ON "public"."letter_requests" FOR UPDATE TO "authenticated" USING ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'letters'::"text"))) WITH CHECK ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'letters'::"text") AND (("voter_id" IS NULL) OR ("tenant_id" = ( SELECT "v"."tenant_id"
   FROM "public"."voters" "v"
  WHERE (("v"."id")::"text" = ("letter_requests"."voter_id")::"text"))))));



CREATE POLICY "Unified Opposition Delete" ON "public"."opposition_karyakartas" FOR DELETE TO "authenticated" USING ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'opposition'::"text")));



CREATE POLICY "Unified Opposition Insert" ON "public"."opposition_karyakartas" FOR INSERT TO "authenticated" WITH CHECK ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'opposition'::"text")));



CREATE POLICY "Unified Opposition Select" ON "public"."opposition_karyakartas" FOR SELECT TO "authenticated" USING ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'opposition'::"text")));



CREATE POLICY "Unified Opposition Update" ON "public"."opposition_karyakartas" FOR UPDATE TO "authenticated" USING ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'opposition'::"text"))) WITH CHECK ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'opposition'::"text")));



CREATE POLICY "Unified Personal Requests Delete" ON "public"."personal_requests" FOR DELETE TO "authenticated" USING ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'complaints'::"text")));



CREATE POLICY "Unified Personal Requests Insert" ON "public"."personal_requests" FOR INSERT TO "authenticated" WITH CHECK ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'complaints'::"text")));



CREATE POLICY "Unified Personal Requests Select" ON "public"."personal_requests" FOR SELECT TO "authenticated" USING ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'complaints'::"text")));



CREATE POLICY "Unified Personal Requests Update" ON "public"."personal_requests" FOR UPDATE TO "authenticated" USING ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'complaints'::"text"))) WITH CHECK ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'complaints'::"text")));



CREATE POLICY "Unified Sadasya Delete" ON "public"."sadasya" FOR DELETE TO "authenticated" USING ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'sadasya'::"text")));



CREATE POLICY "Unified Sadasya Insert" ON "public"."sadasya" FOR INSERT TO "authenticated" WITH CHECK ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'sadasya'::"text") AND (("linked_voter_id" IS NULL) OR ("tenant_id" = ( SELECT "v"."tenant_id"
   FROM "public"."voters" "v"
  WHERE ("v"."id" = "sadasya"."linked_voter_id"))))));



CREATE POLICY "Unified Sadasya Select" ON "public"."sadasya" FOR SELECT TO "authenticated" USING ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'sadasya'::"text")));



CREATE POLICY "Unified Sadasya Update" ON "public"."sadasya" FOR UPDATE TO "authenticated" USING ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'sadasya'::"text"))) WITH CHECK ((("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants")) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'sadasya'::"text") AND (("linked_voter_id" IS NULL) OR ("tenant_id" = ( SELECT "v"."tenant_id"
   FROM "public"."voters" "v"
  WHERE ("v"."id" = "sadasya"."linked_voter_id"))))));



CREATE POLICY "Users Insert Own login_logs" ON "public"."login_logs" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") AND ("tenant_id" IN ( SELECT "public"."get_authorized_tenants"() AS "get_authorized_tenants"))));



CREATE POLICY "Users Select Own login_logs" ON "public"."login_logs" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert election results for their tenant" ON "public"."election_results" FOR INSERT WITH CHECK ((("tenant_id" IN ( SELECT "user_tenant_mapping"."tenant_id"
   FROM "public"."user_tenant_mapping"
  WHERE (("user_tenant_mapping"."user_id" = "auth"."uid"()) AND ("user_tenant_mapping"."role" = 'admin'::"text")))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'election_results'::"text")));



CREATE POLICY "Users can insert work tracker history for their tenant" ON "public"."work_tracker_history" FOR INSERT TO "authenticated" WITH CHECK ((("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid") AND (("auth"."role"() = 'anon'::"text") OR "public"."has_feature_access"("tenant_id", 'work_history'::"text"))));



CREATE POLICY "Users can read own tenant mapping" ON "public"."user_tenant_mapping" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update election results for their tenant" ON "public"."election_results" FOR UPDATE USING ((("tenant_id" IN ( SELECT "user_tenant_mapping"."tenant_id"
   FROM "public"."user_tenant_mapping"
  WHERE (("user_tenant_mapping"."user_id" = "auth"."uid"()) AND ("user_tenant_mapping"."role" = 'admin'::"text")))) AND "public"."has_member_feature_access"("tenant_id", "auth"."uid"(), 'election_results'::"text")));



CREATE POLICY "Users can update own tenant" ON "public"."tenants" FOR UPDATE USING (("id" IN ( SELECT "user_tenant_mapping"."tenant_id"
   FROM "public"."user_tenant_mapping"
  WHERE ("user_tenant_mapping"."user_id" = "auth"."uid"())))) WITH CHECK (("id" IN ( SELECT "user_tenant_mapping"."tenant_id"
   FROM "public"."user_tenant_mapping"
  WHERE ("user_tenant_mapping"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."admin_billing" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_support_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_updates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."area_problems" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."complaints" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conference_rooms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."election_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_rsvps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gallery" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gb_diary" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."housing_societies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."improvements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."incoming_letters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."letter_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."letter_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."login_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."non_voters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."opposition_karyakartas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personal_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."phase5b_verify_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."phase6_verify_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plan_features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sadasya" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scheme_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schemes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."social_organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."staff" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."survey_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."surveys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenant_feature_overrides" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_tenant_mapping" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."visitors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."voter_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."voters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ward_provisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."whatsapp_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."work_tracker_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."work_trackers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."works" ENABLE ROW LEVEL SECURITY;























































































































































































































































































