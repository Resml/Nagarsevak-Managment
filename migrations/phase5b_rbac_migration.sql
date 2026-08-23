-- Phase 5B RBAC Migration
-- Generated from Phase 4 baseline
BEGIN;


CREATE OR REPLACE FUNCTION public.has_member_feature_access(
    p_tenant_id UUID,
    p_user_id UUID,
    p_feature_key TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.validate_staff_permissions_entitlement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.prevent_staff_permission_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

REVOKE EXECUTE ON FUNCTION public.has_member_feature_access(UUID, UUID, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_staff_permissions_entitlement() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.prevent_staff_permission_escalation() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_member_feature_access(UUID, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_staff_permissions_entitlement() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.prevent_staff_permission_escalation() TO authenticated, service_role;

DROP TRIGGER IF EXISTS trg_validate_staff_permissions ON public.staff;
CREATE TRIGGER trg_validate_staff_permissions
    BEFORE INSERT OR UPDATE OF permissions ON public.staff
    FOR EACH ROW EXECUTE FUNCTION public.validate_staff_permissions_entitlement();

DROP TRIGGER IF EXISTS trg_prevent_staff_permission_escalation ON public.staff;
CREATE TRIGGER trg_prevent_staff_permission_escalation
    BEFORE INSERT OR UPDATE ON public.staff
    FOR EACH ROW EXECUTE FUNCTION public.prevent_staff_permission_escalation();


-- Drop insecure legacy duplicate staff policies intentionally
DROP POLICY IF EXISTS "Tenant Isolation Insert Staff" ON public.staff;
DROP POLICY IF EXISTS "Tenant Isolation Update Staff" ON public.staff;

-- Drop legacy Phase 2/4 policies that bypass Phase 5B feature entitlement
DROP POLICY IF EXISTS "Auth Complaint Insert" ON public.complaints;
DROP POLICY IF EXISTS "Auth Complaint Update" ON public.complaints;
DROP POLICY IF EXISTS "Auth VA Insert" ON public.voter_applications;
DROP POLICY IF EXISTS "Auth VA Update" ON public.voter_applications;
DROP POLICY IF EXISTS "Enable insert access for tenant users" ON public.voter_applications;

    -- Explicit Drops for extra Phase 1/3B permissive bypasses
DROP POLICY IF EXISTS "Allow anon insert access" ON public.ai_history;
DROP POLICY IF EXISTS "Allow anon update access" ON public.ai_history;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.event_rsvps;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.event_rsvps;
DROP POLICY IF EXISTS "Allow public insert events" ON public.events;
DROP POLICY IF EXISTS "Allow anon insert access" ON public.gallery;
DROP POLICY IF EXISTS "Allow anon update access" ON public.gallery;
DROP POLICY IF EXISTS "Allow all for everyone" ON public.gb_diary;
DROP POLICY IF EXISTS "Enable all access for authenticated users on housing_societies" ON public.housing_societies;
DROP POLICY IF EXISTS "Allow public insert improvements" ON public.improvements;
DROP POLICY IF EXISTS "Allow public update improvements" ON public.improvements;
DROP POLICY IF EXISTS "Allow authenticated users to insert incoming letters" ON public.incoming_letters;
DROP POLICY IF EXISTS "Allow users to update own incoming letters" ON public.incoming_letters;
DROP POLICY IF EXISTS "Public Access Letters" ON public.letter_requests;
DROP POLICY IF EXISTS "Public Access Letter Types" ON public.letter_types;
DROP POLICY IF EXISTS "letter_types_tenant_isolation" ON public.letter_types;
DROP POLICY IF EXISTS "service_role_all" ON public.message_logs;
DROP POLICY IF EXISTS "tenant_insert" ON public.message_logs;
DROP POLICY IF EXISTS "Allow public insert non_voters" ON public.non_voters;
DROP POLICY IF EXISTS "Allow public update non_voters" ON public.non_voters;
DROP POLICY IF EXISTS "personal_requests_tenant_isolation" ON public.personal_requests;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.sadasya;
DROP POLICY IF EXISTS "Allow public insert schemes" ON public.schemes;
DROP POLICY IF EXISTS "Enable all access for authenticated users on social_organizatio" ON public.social_organizations;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.surveys;
DROP POLICY IF EXISTS "Public Access Visitors" ON public.visitors;
DROP POLICY IF EXISTS "Enable update access for tenant users" ON public.voter_applications;
DROP POLICY IF EXISTS "Allow public insert voters" ON public.voters;
DROP POLICY IF EXISTS "Allow public update voters" ON public.voters;
DROP POLICY IF EXISTS "Allow public insert ward_provisions" ON public.ward_provisions;
DROP POLICY IF EXISTS "Allow public update ward_provisions" ON public.ward_provisions;
DROP POLICY IF EXISTS "Users can insert work trackers for their tenant" ON public.work_trackers;
DROP POLICY IF EXISTS "Users can update work trackers for their tenant" ON public.work_trackers;
DROP POLICY IF EXISTS "Allow public insert works" ON public.works;

-- Drop generic Phase 2 permissive legacy policies across all 28 tables
DROP POLICY IF EXISTS "Tenant Insert ai_history" ON public.ai_history;
DROP POLICY IF EXISTS "Tenant Update ai_history" ON public.ai_history;
DROP POLICY IF EXISTS "Tenant Insert complaints" ON public.complaints;
DROP POLICY IF EXISTS "Tenant Update complaints" ON public.complaints;
DROP POLICY IF EXISTS "Tenant Insert election_results" ON public.election_results;
DROP POLICY IF EXISTS "Tenant Update election_results" ON public.election_results;
DROP POLICY IF EXISTS "Tenant Insert event_rsvps" ON public.event_rsvps;
DROP POLICY IF EXISTS "Tenant Update event_rsvps" ON public.event_rsvps;
DROP POLICY IF EXISTS "Tenant Insert events" ON public.events;
DROP POLICY IF EXISTS "Tenant Update events" ON public.events;
DROP POLICY IF EXISTS "Tenant Insert gallery" ON public.gallery;
DROP POLICY IF EXISTS "Tenant Update gallery" ON public.gallery;
DROP POLICY IF EXISTS "Tenant Insert gb_diary" ON public.gb_diary;
DROP POLICY IF EXISTS "Tenant Update gb_diary" ON public.gb_diary;
DROP POLICY IF EXISTS "Tenant Insert housing_societies" ON public.housing_societies;
DROP POLICY IF EXISTS "Tenant Update housing_societies" ON public.housing_societies;
DROP POLICY IF EXISTS "Tenant Insert improvements" ON public.improvements;
DROP POLICY IF EXISTS "Tenant Update improvements" ON public.improvements;
DROP POLICY IF EXISTS "Tenant Insert incoming_letters" ON public.incoming_letters;
DROP POLICY IF EXISTS "Tenant Update incoming_letters" ON public.incoming_letters;
DROP POLICY IF EXISTS "Tenant Insert letter_requests" ON public.letter_requests;
DROP POLICY IF EXISTS "Tenant Update letter_requests" ON public.letter_requests;
DROP POLICY IF EXISTS "Tenant Insert letter_types" ON public.letter_types;
DROP POLICY IF EXISTS "Tenant Update letter_types" ON public.letter_types;
DROP POLICY IF EXISTS "Tenant Insert message_logs" ON public.message_logs;
DROP POLICY IF EXISTS "Tenant Update message_logs" ON public.message_logs;
DROP POLICY IF EXISTS "Tenant Insert non_voters" ON public.non_voters;
DROP POLICY IF EXISTS "Tenant Update non_voters" ON public.non_voters;
DROP POLICY IF EXISTS "Tenant Insert personal_requests" ON public.personal_requests;
DROP POLICY IF EXISTS "Tenant Update personal_requests" ON public.personal_requests;
DROP POLICY IF EXISTS "Tenant Insert sadasya" ON public.sadasya;
DROP POLICY IF EXISTS "Tenant Update sadasya" ON public.sadasya;
DROP POLICY IF EXISTS "Tenant Insert schemes" ON public.schemes;
DROP POLICY IF EXISTS "Tenant Update schemes" ON public.schemes;
DROP POLICY IF EXISTS "Tenant Insert social_organizations" ON public.social_organizations;
DROP POLICY IF EXISTS "Tenant Update social_organizations" ON public.social_organizations;
DROP POLICY IF EXISTS "Tenant Insert survey_responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Tenant Update survey_responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Tenant Insert surveys" ON public.surveys;
DROP POLICY IF EXISTS "Tenant Update surveys" ON public.surveys;
DROP POLICY IF EXISTS "Tenant Insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Tenant Update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Tenant Insert visitors" ON public.visitors;
DROP POLICY IF EXISTS "Tenant Update visitors" ON public.visitors;
DROP POLICY IF EXISTS "Tenant Insert voter_applications" ON public.voter_applications;
DROP POLICY IF EXISTS "Tenant Update voter_applications" ON public.voter_applications;
DROP POLICY IF EXISTS "Tenant Insert voters" ON public.voters;
DROP POLICY IF EXISTS "Tenant Update voters" ON public.voters;
DROP POLICY IF EXISTS "Tenant Insert ward_provisions" ON public.ward_provisions;
DROP POLICY IF EXISTS "Tenant Update ward_provisions" ON public.ward_provisions;
DROP POLICY IF EXISTS "Tenant Insert work_trackers" ON public.work_trackers;
DROP POLICY IF EXISTS "Tenant Update work_trackers" ON public.work_trackers;
DROP POLICY IF EXISTS "Tenant Insert works" ON public.works;
DROP POLICY IF EXISTS "Tenant Update works" ON public.works;
DROP POLICY IF EXISTS "Tenant Insert staff" ON public.staff;
DROP POLICY IF EXISTS "Tenant Update staff" ON public.staff;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.ai_history;
CREATE POLICY "Tenant Isolation Insert" ON public.ai_history
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = ai_history.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(ai_history.tenant_id, auth.uid(), 'ai_content')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.ai_history;
CREATE POLICY "Tenant Isolation Update" ON public.ai_history
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = ai_history.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(ai_history.tenant_id, auth.uid(), 'ai_content')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.complaints;
CREATE POLICY "Tenant Isolation Insert" ON public.complaints
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = complaints.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(complaints.tenant_id, auth.uid(), 'complaints')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.complaints;
CREATE POLICY "Tenant Isolation Update" ON public.complaints
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = complaints.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(complaints.tenant_id, auth.uid(), 'complaints')));
DROP POLICY IF EXISTS "Users can insert election results for their tenant" ON public.election_results;
CREATE POLICY "Users can insert election results for their tenant" ON public.election_results
  FOR INSERT TO public
  WITH CHECK (((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'admin'::text)))) AND public.has_member_feature_access(election_results.tenant_id, auth.uid(), 'election_results')));
DROP POLICY IF EXISTS "Users can update election results for their tenant" ON public.election_results;
CREATE POLICY "Users can update election results for their tenant" ON public.election_results
  FOR UPDATE TO public
  USING (((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'admin'::text)))) AND public.has_member_feature_access(election_results.tenant_id, auth.uid(), 'election_results')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.event_rsvps;
CREATE POLICY "Tenant Isolation Insert" ON public.event_rsvps
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = event_rsvps.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(event_rsvps.tenant_id, auth.uid(), 'events')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.event_rsvps;
CREATE POLICY "Tenant Isolation Update" ON public.event_rsvps
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = event_rsvps.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(event_rsvps.tenant_id, auth.uid(), 'events')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.events;
CREATE POLICY "Tenant Isolation Insert" ON public.events
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = events.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(events.tenant_id, auth.uid(), 'events')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.events;
CREATE POLICY "Tenant Isolation Update" ON public.events
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = events.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(events.tenant_id, auth.uid(), 'events')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.gallery;
CREATE POLICY "Tenant Isolation Insert" ON public.gallery
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = gallery.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(gallery.tenant_id, auth.uid(), 'gallery')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.gallery;
CREATE POLICY "Tenant Isolation Update" ON public.gallery
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = gallery.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(gallery.tenant_id, auth.uid(), 'gallery')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.gb_diary;
CREATE POLICY "Tenant Isolation Insert" ON public.gb_diary
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = gb_diary.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(gb_diary.tenant_id, auth.uid(), 'gb_register')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.gb_diary;
CREATE POLICY "Tenant Isolation Update" ON public.gb_diary
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = gb_diary.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(gb_diary.tenant_id, auth.uid(), 'gb_register')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.housing_societies;
CREATE POLICY "Tenant Isolation Insert" ON public.housing_societies
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = housing_societies.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(housing_societies.tenant_id, auth.uid(), 'housing_societies')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.housing_societies;
CREATE POLICY "Tenant Isolation Update" ON public.housing_societies
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = housing_societies.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(housing_societies.tenant_id, auth.uid(), 'housing_societies')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.improvements;
CREATE POLICY "Tenant Isolation Insert" ON public.improvements
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = improvements.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(improvements.tenant_id, auth.uid(), 'improvements')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.improvements;
CREATE POLICY "Tenant Isolation Update" ON public.improvements
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = improvements.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(improvements.tenant_id, auth.uid(), 'improvements')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.incoming_letters;
CREATE POLICY "Tenant Isolation Insert" ON public.incoming_letters
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = incoming_letters.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(incoming_letters.tenant_id, auth.uid(), 'letters')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.incoming_letters;
CREATE POLICY "Tenant Isolation Update" ON public.incoming_letters
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = incoming_letters.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(incoming_letters.tenant_id, auth.uid(), 'letters')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.letter_requests;
CREATE POLICY "Tenant Isolation Insert" ON public.letter_requests
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = letter_requests.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(letter_requests.tenant_id, auth.uid(), 'letters')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.letter_requests;
CREATE POLICY "Tenant Isolation Update" ON public.letter_requests
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = letter_requests.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(letter_requests.tenant_id, auth.uid(), 'letters')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.letter_types;
CREATE POLICY "Tenant Isolation Insert" ON public.letter_types
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = letter_types.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(letter_types.tenant_id, auth.uid(), 'letters')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.letter_types;
CREATE POLICY "Tenant Isolation Update" ON public.letter_types
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = letter_types.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(letter_types.tenant_id, auth.uid(), 'letters')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.message_logs;
CREATE POLICY "Tenant Isolation Insert" ON public.message_logs
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = message_logs.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(message_logs.tenant_id, auth.uid(), 'messages')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.message_logs;
CREATE POLICY "Tenant Isolation Update" ON public.message_logs
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = message_logs.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(message_logs.tenant_id, auth.uid(), 'messages')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.non_voters;
CREATE POLICY "Tenant Isolation Insert" ON public.non_voters
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = non_voters.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(non_voters.tenant_id, auth.uid(), 'election_results')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.non_voters;
CREATE POLICY "Tenant Isolation Update" ON public.non_voters
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = non_voters.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(non_voters.tenant_id, auth.uid(), 'election_results')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.personal_requests;
CREATE POLICY "Tenant Isolation Insert" ON public.personal_requests
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = personal_requests.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(personal_requests.tenant_id, auth.uid(), 'letters')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.personal_requests;
CREATE POLICY "Tenant Isolation Update" ON public.personal_requests
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = personal_requests.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(personal_requests.tenant_id, auth.uid(), 'letters')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.sadasya;
CREATE POLICY "Tenant Isolation Insert" ON public.sadasya
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = sadasya.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(sadasya.tenant_id, auth.uid(), 'sadasya')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.sadasya;
CREATE POLICY "Tenant Isolation Update" ON public.sadasya
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = sadasya.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(sadasya.tenant_id, auth.uid(), 'sadasya')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.schemes;
CREATE POLICY "Tenant Isolation Insert" ON public.schemes
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = schemes.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(schemes.tenant_id, auth.uid(), 'schemes')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.schemes;
CREATE POLICY "Tenant Isolation Update" ON public.schemes
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = schemes.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(schemes.tenant_id, auth.uid(), 'schemes')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.social_organizations;
CREATE POLICY "Tenant Isolation Insert" ON public.social_organizations
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = social_organizations.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(social_organizations.tenant_id, auth.uid(), 'social_organizations')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.social_organizations;
CREATE POLICY "Tenant Isolation Update" ON public.social_organizations
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = social_organizations.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(social_organizations.tenant_id, auth.uid(), 'social_organizations')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.staff;
CREATE POLICY "Tenant Isolation Insert" ON public.staff
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = staff.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(staff.tenant_id, auth.uid(), 'staff')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.staff;
CREATE POLICY "Tenant Isolation Update" ON public.staff
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = staff.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(staff.tenant_id, auth.uid(), 'staff')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.survey_responses;
CREATE POLICY "Tenant Isolation Insert" ON public.survey_responses
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = survey_responses.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(survey_responses.tenant_id, auth.uid(), 'surveys')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.survey_responses;
CREATE POLICY "Tenant Isolation Update" ON public.survey_responses
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = survey_responses.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(survey_responses.tenant_id, auth.uid(), 'surveys')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.surveys;
CREATE POLICY "Tenant Isolation Insert" ON public.surveys
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = surveys.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(surveys.tenant_id, auth.uid(), 'surveys')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.surveys;
CREATE POLICY "Tenant Isolation Update" ON public.surveys
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = surveys.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(surveys.tenant_id, auth.uid(), 'surveys')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.tasks;
CREATE POLICY "Tenant Isolation Insert" ON public.tasks
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = tasks.tenant_id)) AND public.has_member_feature_access(tasks.tenant_id, auth.uid(), 'tasks')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.tasks;
CREATE POLICY "Tenant Isolation Update" ON public.tasks
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = tasks.tenant_id)) AND public.has_member_feature_access(tasks.tenant_id, auth.uid(), 'tasks')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.visitors;
CREATE POLICY "Tenant Isolation Insert" ON public.visitors
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = visitors.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(visitors.tenant_id, auth.uid(), 'visitors')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.visitors;
CREATE POLICY "Tenant Isolation Update" ON public.visitors
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = visitors.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(visitors.tenant_id, auth.uid(), 'visitors')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.voter_applications;
CREATE POLICY "Tenant Isolation Insert" ON public.voter_applications
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = voter_applications.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(voter_applications.tenant_id, auth.uid(), 'election_results')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.voter_applications;
CREATE POLICY "Tenant Isolation Update" ON public.voter_applications
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = voter_applications.tenant_id)) AND public.has_member_feature_access(voter_applications.tenant_id, auth.uid(), 'election_results')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.voters;
CREATE POLICY "Tenant Isolation Insert" ON public.voters
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = voters.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(voters.tenant_id, auth.uid(), 'election_results')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.voters;
CREATE POLICY "Tenant Isolation Update" ON public.voters
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = voters.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(voters.tenant_id, auth.uid(), 'election_results')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.ward_provisions;
CREATE POLICY "Tenant Isolation Insert" ON public.ward_provisions
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = ward_provisions.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(ward_provisions.tenant_id, auth.uid(), 'ward_provisions')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.ward_provisions;
CREATE POLICY "Tenant Isolation Update" ON public.ward_provisions
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = ward_provisions.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(ward_provisions.tenant_id, auth.uid(), 'ward_provisions')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.work_trackers;
CREATE POLICY "Tenant Isolation Insert" ON public.work_trackers
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = work_trackers.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(work_trackers.tenant_id, auth.uid(), 'works')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.work_trackers;
CREATE POLICY "Tenant Isolation Update" ON public.work_trackers
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = work_trackers.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(work_trackers.tenant_id, auth.uid(), 'works')));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.works;
CREATE POLICY "Tenant Isolation Insert" ON public.works
  FOR INSERT TO public
  WITH CHECK (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = works.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(works.tenant_id, auth.uid(), 'works')));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.works;
CREATE POLICY "Tenant Isolation Update" ON public.works
  FOR UPDATE TO public
  USING (((EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = works.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')) AND public.has_member_feature_access(works.tenant_id, auth.uid(), 'works')));
COMMIT;
