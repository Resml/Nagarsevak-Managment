-- Phase 2 - 001 - Tenant Helper
-- Creates the authoritative, secure helper for server-side tenant identification.
-- Depends on: public.user_tenant_mapping

CREATE OR REPLACE FUNCTION public.get_authorized_tenants()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT tenant_id
  FROM public.user_tenant_mapping
  WHERE user_id = auth.uid();
$$;

-- Secure the function permissions
REVOKE ALL ON FUNCTION public.get_authorized_tenants() FROM public;
GRANT EXECUTE ON FUNCTION public.get_authorized_tenants() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_authorized_tenants() TO service_role;
-- Phase 2 - 002 - Whatsapp Sessions Security
-- Locks down Bot session data. Only Render Server via SUPABASE_SERVICE_ROLE_KEY can access.

-- Explicitly drop the highly insecure public access policy
DROP POLICY IF EXISTS "Allow all access to whatsapp_sessions" ON public.whatsapp_sessions;

-- Ensure RLS is enabled so dropping the policy results in default-deny for web clients
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Note: We intentionally do NOT create a replacement policy.
-- The service_role key natively bypasses RLS.
-- Phase 2 - 003 - Global Admin Tables
-- Secures platform-global tables (admin_billing, admin_support_tickets, admin_updates).

-- admin_billing
ALTER TABLE public.admin_billing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for admin_billing" ON public.admin_billing;

CREATE POLICY "Super Admin Access admin_billing" ON public.admin_billing
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_tenant_mapping 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- admin_support_tickets
ALTER TABLE public.admin_support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for admin_support_tickets" ON public.admin_support_tickets;

CREATE POLICY "Super Admin Access admin_support_tickets" ON public.admin_support_tickets
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_tenant_mapping 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- admin_updates
ALTER TABLE public.admin_updates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for admin_updates" ON public.admin_updates;

CREATE POLICY "Super Admin Access admin_updates" ON public.admin_updates
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_tenant_mapping 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);
-- Phase 2 - 004 - Core RLS V3
-- Replaces insecure JWT and subquery explosion policies with strict get_authorized_tenants() check.
-- Preserves custom role-based access for special tables.

-- Table: improvements
ALTER TABLE public."improvements" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert improvements" ON public."improvements";
DROP POLICY IF EXISTS "Allow public read improvements" ON public."improvements";
DROP POLICY IF EXISTS "Allow public update improvements" ON public."improvements";
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."improvements";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."improvements";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."improvements";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."improvements";
CREATE POLICY "Tenant Select improvements" ON public."improvements" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert improvements" ON public."improvements" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update improvements" ON public."improvements" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete improvements" ON public."improvements" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: opposition_karyakartas
ALTER TABLE public."opposition_karyakartas" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow manage opposition karyakartas" ON public."opposition_karyakartas";
DROP POLICY IF EXISTS "Allow read access opposition karyakartas" ON public."opposition_karyakartas";
CREATE POLICY "Tenant Select opposition_karyakartas" ON public."opposition_karyakartas" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert opposition_karyakartas" ON public."opposition_karyakartas" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update opposition_karyakartas" ON public."opposition_karyakartas" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete opposition_karyakartas" ON public."opposition_karyakartas" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));


-- Table: surveys
ALTER TABLE public."surveys" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public."surveys";
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."surveys";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."surveys";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."surveys";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."surveys";
CREATE POLICY "Tenant Select surveys" ON public."surveys" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert surveys" ON public."surveys" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update surveys" ON public."surveys" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete surveys" ON public."surveys" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: works
ALTER TABLE public."works" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert works" ON public."works";
DROP POLICY IF EXISTS "Allow public read works" ON public."works";
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."works";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."works";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."works";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."works";
CREATE POLICY "Tenant Select works" ON public."works" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert works" ON public."works" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update works" ON public."works" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete works" ON public."works" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: letter_types
ALTER TABLE public."letter_types" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Letter Types" ON public."letter_types";
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."letter_types";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."letter_types";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."letter_types";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."letter_types";
DROP POLICY IF EXISTS "letter_types_tenant_isolation" ON public."letter_types";
CREATE POLICY "Tenant Select letter_types" ON public."letter_types" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert letter_types" ON public."letter_types" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update letter_types" ON public."letter_types" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete letter_types" ON public."letter_types" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: incoming_letters
ALTER TABLE public."incoming_letters" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to insert incoming letters" ON public."incoming_letters";
DROP POLICY IF EXISTS "Allow authenticated users to read incoming letters" ON public."incoming_letters";
DROP POLICY IF EXISTS "Allow users to delete own incoming letters" ON public."incoming_letters";
DROP POLICY IF EXISTS "Allow users to update own incoming letters" ON public."incoming_letters";
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."incoming_letters";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."incoming_letters";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."incoming_letters";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."incoming_letters";
CREATE POLICY "Tenant Select incoming_letters" ON public."incoming_letters" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert incoming_letters" ON public."incoming_letters" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update incoming_letters" ON public."incoming_letters" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete incoming_letters" ON public."incoming_letters" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: gb_diary
ALTER TABLE public."gb_diary" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for everyone" ON public."gb_diary";
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."gb_diary";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."gb_diary";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."gb_diary";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."gb_diary";
CREATE POLICY "Tenant Select gb_diary" ON public."gb_diary" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert gb_diary" ON public."gb_diary" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update gb_diary" ON public."gb_diary" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete gb_diary" ON public."gb_diary" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: personal_requests
ALTER TABLE public."personal_requests" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."personal_requests";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."personal_requests";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."personal_requests";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."personal_requests";
DROP POLICY IF EXISTS "personal_requests_tenant_isolation" ON public."personal_requests";
CREATE POLICY "Tenant Select personal_requests" ON public."personal_requests" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert personal_requests" ON public."personal_requests" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update personal_requests" ON public."personal_requests" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete personal_requests" ON public."personal_requests" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: schemes
ALTER TABLE public."schemes" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert schemes" ON public."schemes";
DROP POLICY IF EXISTS "Allow public read schemes" ON public."schemes";
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."schemes";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."schemes";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."schemes";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."schemes";
CREATE POLICY "Tenant Select schemes" ON public."schemes" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert schemes" ON public."schemes" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update schemes" ON public."schemes" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete schemes" ON public."schemes" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: area_problems
ALTER TABLE public."area_problems" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "area_problems_tenant_isolation" ON public."area_problems";
CREATE POLICY "Tenant Select area_problems" ON public."area_problems" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert area_problems" ON public."area_problems" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update area_problems" ON public."area_problems" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete area_problems" ON public."area_problems" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: message_logs
ALTER TABLE public."message_logs" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."message_logs";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."message_logs";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."message_logs";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."message_logs";
DROP POLICY IF EXISTS "service_role_all" ON public."message_logs";
DROP POLICY IF EXISTS "tenant_insert" ON public."message_logs";
DROP POLICY IF EXISTS "tenant_select" ON public."message_logs";
CREATE POLICY "Tenant Select message_logs" ON public."message_logs" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert message_logs" ON public."message_logs" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update message_logs" ON public."message_logs" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete message_logs" ON public."message_logs" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: ai_history
ALTER TABLE public."ai_history" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon delete access" ON public."ai_history";
DROP POLICY IF EXISTS "Allow anon insert access" ON public."ai_history";
DROP POLICY IF EXISTS "Allow anon read access" ON public."ai_history";
DROP POLICY IF EXISTS "Allow anon update access" ON public."ai_history";
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."ai_history";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."ai_history";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."ai_history";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."ai_history";
CREATE POLICY "Tenant Select ai_history" ON public."ai_history" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert ai_history" ON public."ai_history" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update ai_history" ON public."ai_history" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete ai_history" ON public."ai_history" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: gallery
ALTER TABLE public."gallery" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon delete access" ON public."gallery";
DROP POLICY IF EXISTS "Allow anon insert access" ON public."gallery";
DROP POLICY IF EXISTS "Allow anon read access" ON public."gallery";
DROP POLICY IF EXISTS "Allow anon update access" ON public."gallery";
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."gallery";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."gallery";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."gallery";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."gallery";
CREATE POLICY "Tenant Select gallery" ON public."gallery" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert gallery" ON public."gallery" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update gallery" ON public."gallery" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete gallery" ON public."gallery" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: events
ALTER TABLE public."events" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert events" ON public."events";
DROP POLICY IF EXISTS "Allow public read events" ON public."events";
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."events";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."events";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."events";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."events";
CREATE POLICY "Tenant Select events" ON public."events" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert events" ON public."events" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update events" ON public."events" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete events" ON public."events" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: housing_societies
ALTER TABLE public."housing_societies" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users on housing_societies" ON public."housing_societies";
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."housing_societies";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."housing_societies";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."housing_societies";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."housing_societies";
CREATE POLICY "Tenant Select housing_societies" ON public."housing_societies" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert housing_societies" ON public."housing_societies" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update housing_societies" ON public."housing_societies" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete housing_societies" ON public."housing_societies" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: visitors
ALTER TABLE public."visitors" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Visitors" ON public."visitors";
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."visitors";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."visitors";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."visitors";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."visitors";
CREATE POLICY "Tenant Select visitors" ON public."visitors" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert visitors" ON public."visitors" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update visitors" ON public."visitors" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete visitors" ON public."visitors" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: work_trackers
ALTER TABLE public."work_trackers" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."work_trackers";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."work_trackers";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."work_trackers";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."work_trackers";
DROP POLICY IF EXISTS "Users can delete work trackers for their tenant" ON public."work_trackers";
DROP POLICY IF EXISTS "Users can insert work trackers for their tenant" ON public."work_trackers";
DROP POLICY IF EXISTS "Users can see their tenant's work trackers" ON public."work_trackers";
DROP POLICY IF EXISTS "Users can update work trackers for their tenant" ON public."work_trackers";
CREATE POLICY "Tenant Select work_trackers" ON public."work_trackers" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert work_trackers" ON public."work_trackers" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update work_trackers" ON public."work_trackers" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete work_trackers" ON public."work_trackers" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: non_voters
ALTER TABLE public."non_voters" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert non_voters" ON public."non_voters";
DROP POLICY IF EXISTS "Allow public read non_voters" ON public."non_voters";
DROP POLICY IF EXISTS "Allow public update non_voters" ON public."non_voters";
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."non_voters";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."non_voters";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."non_voters";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."non_voters";
CREATE POLICY "Tenant Select non_voters" ON public."non_voters" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert non_voters" ON public."non_voters" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update non_voters" ON public."non_voters" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete non_voters" ON public."non_voters" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: staff
ALTER TABLE public."staff" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."staff";
DROP POLICY IF EXISTS "Tenant Isolation Delete Staff" ON public."staff";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."staff";
DROP POLICY IF EXISTS "Tenant Isolation Insert Staff" ON public."staff";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."staff";
DROP POLICY IF EXISTS "Tenant Isolation Select Staff" ON public."staff";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."staff";
DROP POLICY IF EXISTS "Tenant Isolation Update Staff" ON public."staff";
CREATE POLICY "Tenant Select staff" ON public."staff" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert staff" ON public."staff" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update staff" ON public."staff" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete staff" ON public."staff" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: voters
ALTER TABLE public."voters" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert voters" ON public."voters";
DROP POLICY IF EXISTS "Allow public read voters" ON public."voters";
DROP POLICY IF EXISTS "Allow public update voters" ON public."voters";
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."voters";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."voters";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."voters";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."voters";
CREATE POLICY "Tenant Select voters" ON public."voters" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert voters" ON public."voters" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update voters" ON public."voters" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete voters" ON public."voters" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: support_tickets
ALTER TABLE public."support_tickets" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."support_tickets";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."support_tickets";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."support_tickets";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."support_tickets";
CREATE POLICY "Tenant Select support_tickets" ON public."support_tickets" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert support_tickets" ON public."support_tickets" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update support_tickets" ON public."support_tickets" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete support_tickets" ON public."support_tickets" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: tasks
ALTER TABLE public."tasks" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."tasks";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."tasks";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."tasks";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."tasks";
CREATE POLICY "Tenant Select tasks" ON public."tasks" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert tasks" ON public."tasks" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update tasks" ON public."tasks" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete tasks" ON public."tasks" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: ward_provisions
ALTER TABLE public."ward_provisions" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert ward_provisions" ON public."ward_provisions";
DROP POLICY IF EXISTS "Allow public read ward_provisions" ON public."ward_provisions";
DROP POLICY IF EXISTS "Allow public update ward_provisions" ON public."ward_provisions";
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."ward_provisions";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."ward_provisions";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."ward_provisions";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."ward_provisions";
CREATE POLICY "Tenant Select ward_provisions" ON public."ward_provisions" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert ward_provisions" ON public."ward_provisions" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update ward_provisions" ON public."ward_provisions" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete ward_provisions" ON public."ward_provisions" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: social_organizations
ALTER TABLE public."social_organizations" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users on social_organizatio" ON public."social_organizations";
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."social_organizations";
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."social_organizations";
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."social_organizations";
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."social_organizations";
CREATE POLICY "Tenant Select social_organizations" ON public."social_organizations" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Insert social_organizations" ON public."social_organizations" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Update social_organizations" ON public."social_organizations" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Tenant Delete social_organizations" ON public."social_organizations" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: security_audit_logs
ALTER TABLE public."security_audit_logs" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view tenant audit logs" ON public."security_audit_logs";
DROP POLICY IF EXISTS "Users can insert security audit logs" ON public."security_audit_logs";
CREATE POLICY "Admins Select security_audit_logs" ON public."security_audit_logs" FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND tenant_id = security_audit_logs.tenant_id AND role = ANY(ARRAY['nagarsevak', 'admin', 'amdar', 'khasdar', 'minister', 'super_admin']))
);
CREATE POLICY "Auth Insert security_audit_logs" ON public."security_audit_logs" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: login_logs
ALTER TABLE public."login_logs" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Nagarsevak can view all login logs for their tenant" ON public."login_logs";
DROP POLICY IF EXISTS "Users can insert their own login logs" ON public."login_logs";
DROP POLICY IF EXISTS "Users can view their own login logs" ON public."login_logs";
CREATE POLICY "Users Select Own login_logs" ON public."login_logs" FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Nagarsevak Select All login_logs" ON public."login_logs" FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND tenant_id = login_logs.tenant_id AND role = ANY(ARRAY['nagarsevak', 'super_admin']))
);
CREATE POLICY "Users Insert Own login_logs" ON public."login_logs" FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id IN (SELECT public.get_authorized_tenants()));

-- Table: election_results
ALTER TABLE public."election_results" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can delete election results for their tenant" ON public."election_results";
DROP POLICY IF EXISTS "Users can insert election results for their tenant" ON public."election_results";
DROP POLICY IF EXISTS "Users can update election results for their tenant" ON public."election_results";
DROP POLICY IF EXISTS "Users can view election results for their tenant" ON public."election_results";
CREATE POLICY "Auth Select election_results" ON public."election_results" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Admin Insert election_results" ON public."election_results" FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND tenant_id = election_results.tenant_id AND role = ANY(ARRAY['admin', 'super_admin']))
);
CREATE POLICY "Admin Update election_results" ON public."election_results" FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND tenant_id = election_results.tenant_id AND role = ANY(ARRAY['admin', 'super_admin']))
);
CREATE POLICY "Admin Delete election_results" ON public."election_results" FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND tenant_id = election_results.tenant_id AND role = ANY(ARRAY['admin', 'super_admin']))
);

-- Phase 2 - 005 - Public Intake & Mixed FK Integrity
-- Secures relationships that span across tables and implements strict public intake boundaries.

-- --------------------------------------------------------
-- Helper Functions for Public Intake Lookups
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_survey_tenant(p_survey_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  -- Only return the tenant_id if the survey is explicitly Active
  SELECT tenant_id FROM public.surveys WHERE id = p_survey_id AND status = 'Active';
$$;
ALTER FUNCTION public.get_survey_tenant(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_survey_tenant(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_survey_tenant(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_event_tenant(p_event_id bigint)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  -- Only return the tenant_id if the event is explicitly Planned
  SELECT tenant_id FROM public.events WHERE id = p_event_id AND status = 'Planned';
$$;
ALTER FUNCTION public.get_event_tenant(bigint) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_event_tenant(bigint) FROM public;
GRANT EXECUTE ON FUNCTION public.get_event_tenant(bigint) TO anon, authenticated;


-- --------------------------------------------------------
-- 1. survey_responses
-- --------------------------------------------------------
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.survey_responses;
DROP POLICY IF EXISTS "Enable insert for public" ON public.survey_responses;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.survey_responses;
DROP POLICY IF EXISTS "Enable select for public" ON public.survey_responses;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.survey_responses;
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.survey_responses;
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.survey_responses;
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.survey_responses;

-- Public Anon Insert (Strict parent matching via SECURITY DEFINER to verified active survey)
CREATE POLICY "Anon Survey Insert" ON public.survey_responses
FOR INSERT TO anon
WITH CHECK (
  tenant_id = public.get_survey_tenant(survey_id)
);

-- Authenticated CRUD
CREATE POLICY "Auth Survey Select" ON public.survey_responses FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth Survey Delete" ON public.survey_responses FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth Survey Insert" ON public.survey_responses FOR INSERT TO authenticated 
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND tenant_id = (SELECT tenant_id FROM public.surveys WHERE id = survey_id)
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);
CREATE POLICY "Auth Survey Update" ON public.survey_responses FOR UPDATE TO authenticated 
USING (tenant_id IN (SELECT public.get_authorized_tenants()))
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND tenant_id = (SELECT tenant_id FROM public.surveys WHERE id = survey_id)
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);


-- --------------------------------------------------------
-- 2. event_rsvps
-- --------------------------------------------------------
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.event_rsvps;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.event_rsvps;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.event_rsvps;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.event_rsvps;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.event_rsvps;
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.event_rsvps;
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.event_rsvps;
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.event_rsvps;

-- Public Anon Insert (Strict parent matching to verified Planned event)
CREATE POLICY "Anon Event RSVP" ON public.event_rsvps
FOR INSERT TO anon
WITH CHECK (
  tenant_id = public.get_event_tenant(event_id)
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);

-- Authenticated CRUD
CREATE POLICY "Auth RSVP Select" ON public.event_rsvps FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth RSVP Delete" ON public.event_rsvps FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth RSVP Insert" ON public.event_rsvps FOR INSERT TO authenticated 
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND tenant_id = (SELECT tenant_id FROM public.events WHERE id = event_id)
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);
CREATE POLICY "Auth RSVP Update" ON public.event_rsvps FOR UPDATE TO authenticated 
USING (tenant_id IN (SELECT public.get_authorized_tenants()))
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND tenant_id = (SELECT tenant_id FROM public.events WHERE id = event_id)
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);

-- --------------------------------------------------------
-- 3. complaints (Removed Anon Access)
-- --------------------------------------------------------
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.complaints;
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.complaints;
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.complaints;
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.complaints;

-- NOTE: Anon insert access removed. The application lacks a secure
-- tenant resolution mechanism (e.g., token, subdomain) for public complaints.

CREATE POLICY "Auth Complaint Select" ON public.complaints FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth Complaint Delete" ON public.complaints FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth Complaint Insert" ON public.complaints FOR INSERT TO authenticated 
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);
CREATE POLICY "Auth Complaint Update" ON public.complaints FOR UPDATE TO authenticated 
USING (tenant_id IN (SELECT public.get_authorized_tenants()))
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);


-- --------------------------------------------------------
-- 4. scheme_applications (Auth only)
-- --------------------------------------------------------
ALTER TABLE public.scheme_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for tenant users" ON public.scheme_applications;

CREATE POLICY "Auth Scheme Select" ON public.scheme_applications FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth Scheme Delete" ON public.scheme_applications FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth Scheme Insert" ON public.scheme_applications FOR INSERT TO authenticated 
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND tenant_id = (SELECT tenant_id FROM public.schemes WHERE id = scheme_id)
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);
CREATE POLICY "Auth Scheme Update" ON public.scheme_applications FOR UPDATE TO authenticated 
USING (tenant_id IN (SELECT public.get_authorized_tenants()))
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND tenant_id = (SELECT tenant_id FROM public.schemes WHERE id = scheme_id)
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);


-- --------------------------------------------------------
-- 5. sadasya (Auth only)
-- --------------------------------------------------------
ALTER TABLE public.sadasya ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.sadasya;
DROP POLICY IF EXISTS "Enable read access for all users of same tenant" ON public.sadasya;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.sadasya;
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.sadasya;
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.sadasya;
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.sadasya;

CREATE POLICY "Auth Sadasya Select" ON public.sadasya FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth Sadasya Delete" ON public.sadasya FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth Sadasya Insert" ON public.sadasya FOR INSERT TO authenticated 
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND (linked_voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id = linked_voter_id))
);
CREATE POLICY "Auth Sadasya Update" ON public.sadasya FOR UPDATE TO authenticated 
USING (tenant_id IN (SELECT public.get_authorized_tenants()))
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND (linked_voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id = linked_voter_id))
);


-- --------------------------------------------------------
-- 6. voter_applications (Auth only)
-- --------------------------------------------------------
ALTER TABLE public.voter_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert access for tenant users" ON public.voter_applications;
DROP POLICY IF EXISTS "Enable read access for tenant users" ON public.voter_applications;
DROP POLICY IF EXISTS "Enable update access for tenant users" ON public.voter_applications;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.voter_applications;
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.voter_applications;
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.voter_applications;
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.voter_applications;

CREATE POLICY "Auth VA Select" ON public.voter_applications FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth VA Delete" ON public.voter_applications FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth VA Insert" ON public.voter_applications FOR INSERT TO authenticated 
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);
CREATE POLICY "Auth VA Update" ON public.voter_applications FOR UPDATE TO authenticated 
USING (tenant_id IN (SELECT public.get_authorized_tenants()))
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);


-- --------------------------------------------------------
-- 7. letter_requests (Auth only)
-- --------------------------------------------------------
ALTER TABLE public.letter_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Letters" ON public.letter_requests;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.letter_requests;
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.letter_requests;
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.letter_requests;
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.letter_requests;

CREATE POLICY "Auth Letter Select" ON public.letter_requests FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth Letter Delete" ON public.letter_requests FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth Letter Insert" ON public.letter_requests FOR INSERT TO authenticated 
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);
CREATE POLICY "Auth Letter Update" ON public.letter_requests FOR UPDATE TO authenticated 
USING (tenant_id IN (SELECT public.get_authorized_tenants()))
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);


-- --------------------------------------------------------
-- 8. work_tracker_history (Auth only)
-- --------------------------------------------------------
ALTER TABLE public.work_tracker_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert work tracker history for their tenant" ON public.work_tracker_history;
DROP POLICY IF EXISTS "Users can see their tenant's work tracker history" ON public.work_tracker_history;

CREATE POLICY "Auth WTH Select" ON public.work_tracker_history FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth WTH Delete" ON public.work_tracker_history FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth WTH Insert" ON public.work_tracker_history FOR INSERT TO authenticated 
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND tenant_id = (SELECT tenant_id FROM public.work_trackers WHERE id = work_tracker_id)
);
CREATE POLICY "Auth WTH Update" ON public.work_tracker_history FOR UPDATE TO authenticated 
USING (tenant_id IN (SELECT public.get_authorized_tenants()))
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND tenant_id = (SELECT tenant_id FROM public.work_trackers WHERE id = work_tracker_id)
);
-- Phase 2 - 006 - Enforce NOT NULL
-- Enforces NOT NULL constraints safely on the explicitly audited tables.

ALTER TABLE public.area_problems ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.event_rsvps ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.letter_requests ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.personal_requests ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.scheme_applications ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.survey_responses ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.tasks ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.sadasya ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.voter_applications ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.work_tracker_history ALTER COLUMN tenant_id SET NOT NULL;
