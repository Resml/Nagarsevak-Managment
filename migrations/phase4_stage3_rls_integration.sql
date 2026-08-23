BEGIN;

DROP POLICY IF EXISTS "Allow anon insert access" ON public."ai_history";
CREATE POLICY "Allow anon insert access" ON public."ai_history" FOR INSERT TO public WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'ai_content')));

DROP POLICY IF EXISTS "Allow anon update access" ON public."ai_history";
CREATE POLICY "Allow anon update access" ON public."ai_history" FOR UPDATE TO public USING ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'ai_content')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."ai_history";
CREATE POLICY "Tenant Isolation Insert" ON public."ai_history" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'ai_content')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."ai_history";
CREATE POLICY "Tenant Isolation Update" ON public."ai_history" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = ai_history.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = ai_history.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'ai_content')));

-- Splitting ALL policy 'area_problems_tenant_isolation' on table 'area_problems'
DROP POLICY IF EXISTS "area_problems_tenant_isolation" ON public."area_problems";
DROP POLICY IF EXISTS "area_problems_tenant_isolation_sel" ON public."area_problems";
DROP POLICY IF EXISTS "area_problems_tenant_isolation_del" ON public."area_problems";
DROP POLICY IF EXISTS "area_problems_tenant_isolation_ins" ON public."area_problems";
DROP POLICY IF EXISTS "area_problems_tenant_isolation_upd" ON public."area_problems";
CREATE POLICY "area_problems_tenant_isolation_sel" ON public."area_problems" FOR SELECT TO public USING (true);
CREATE POLICY "area_problems_tenant_isolation_del" ON public."area_problems" FOR DELETE TO public USING (true);
CREATE POLICY "area_problems_tenant_isolation_ins" ON public."area_problems" FOR INSERT TO public WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'ward_problems')));
CREATE POLICY "area_problems_tenant_isolation_upd" ON public."area_problems" FOR UPDATE TO public USING ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'ward_problems'))) WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'ward_problems')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."complaints";
CREATE POLICY "Tenant Isolation Insert" ON public."complaints" FOR INSERT TO public WITH CHECK ((((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (auth.role() = 'anon'::text) OR (auth.role() = 'service_role'::text) OR (tenant_id IS NOT NULL))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'complaints')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."complaints";
CREATE POLICY "Tenant Isolation Update" ON public."complaints" FOR UPDATE TO public USING ((((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (auth.role() = 'service_role'::text))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'complaints')));

DROP POLICY IF EXISTS "Users can insert election results for their tenant" ON public."election_results";
CREATE POLICY "Users can insert election results for their tenant" ON public."election_results" FOR INSERT TO public WITH CHECK (((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'admin'::text))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'results')));

DROP POLICY IF EXISTS "Users can update election results for their tenant" ON public."election_results";
CREATE POLICY "Users can update election results for their tenant" ON public."election_results" FOR UPDATE TO public USING (((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'admin'::text))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'results')));

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public."event_rsvps";
CREATE POLICY "Enable insert access for authenticated users" ON public."event_rsvps" FOR INSERT TO public WITH CHECK (((auth.role() = 'authenticated'::text)) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'events')));

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public."event_rsvps";
CREATE POLICY "Enable update access for authenticated users" ON public."event_rsvps" FOR UPDATE TO public USING (((auth.role() = 'authenticated'::text)) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'events')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."event_rsvps";
CREATE POLICY "Tenant Isolation Insert" ON public."event_rsvps" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'events')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."event_rsvps";
CREATE POLICY "Tenant Isolation Update" ON public."event_rsvps" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = event_rsvps.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = event_rsvps.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'events')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."events";
CREATE POLICY "Tenant Isolation Insert" ON public."events" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'events')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."events";
CREATE POLICY "Tenant Isolation Update" ON public."events" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = events.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = events.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'events')));

DROP POLICY IF EXISTS "Allow anon insert access" ON public."gallery";
CREATE POLICY "Allow anon insert access" ON public."gallery" FOR INSERT TO public WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'gallery')));

DROP POLICY IF EXISTS "Allow anon update access" ON public."gallery";
CREATE POLICY "Allow anon update access" ON public."gallery" FOR UPDATE TO public USING ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'gallery')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."gallery";
CREATE POLICY "Tenant Isolation Insert" ON public."gallery" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'gallery')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."gallery";
CREATE POLICY "Tenant Isolation Update" ON public."gallery" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = gallery.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = gallery.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'gallery')));

-- Splitting ALL policy 'Allow all for everyone' on table 'gb_diary'
DROP POLICY IF EXISTS "Allow all for everyone" ON public."gb_diary";
DROP POLICY IF EXISTS "Allow all for everyone_sel" ON public."gb_diary";
DROP POLICY IF EXISTS "Allow all for everyone_del" ON public."gb_diary";
DROP POLICY IF EXISTS "Allow all for everyone_ins" ON public."gb_diary";
DROP POLICY IF EXISTS "Allow all for everyone_upd" ON public."gb_diary";
CREATE POLICY "Allow all for everyone_sel" ON public."gb_diary" FOR SELECT TO public USING (true);
CREATE POLICY "Allow all for everyone_del" ON public."gb_diary" FOR DELETE TO public USING (true);
CREATE POLICY "Allow all for everyone_ins" ON public."gb_diary" FOR INSERT TO public WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'gb_register')));
CREATE POLICY "Allow all for everyone_upd" ON public."gb_diary" FOR UPDATE TO public USING ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'gb_register'))) WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'gb_register')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."gb_diary";
CREATE POLICY "Tenant Isolation Insert" ON public."gb_diary" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'gb_register')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."gb_diary";
CREATE POLICY "Tenant Isolation Update" ON public."gb_diary" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = gb_diary.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = gb_diary.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'gb_register')));

-- Splitting ALL policy 'Enable all access for authenticated users on housing_societies' on table 'housing_societies'
DROP POLICY IF EXISTS "Enable all access for authenticated users on housing_societies" ON public."housing_societies";
DROP POLICY IF EXISTS "Enable all access for authenticated users on housing_societ_sel" ON public."housing_societies";
DROP POLICY IF EXISTS "Enable all access for authenticated users on housing_societ_del" ON public."housing_societies";
DROP POLICY IF EXISTS "Enable all access for authenticated users on housing_societ_ins" ON public."housing_societies";
DROP POLICY IF EXISTS "Enable all access for authenticated users on housing_societ_upd" ON public."housing_societies";
CREATE POLICY "Enable all access for authenticated users on housing_societ_sel" ON public."housing_societies" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users on housing_societ_del" ON public."housing_societies" FOR DELETE TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users on housing_societ_ins" ON public."housing_societies" FOR INSERT TO authenticated WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'housing_societies')));
CREATE POLICY "Enable all access for authenticated users on housing_societ_upd" ON public."housing_societies" FOR UPDATE TO authenticated USING ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'housing_societies'))) WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'housing_societies')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."housing_societies";
CREATE POLICY "Tenant Isolation Insert" ON public."housing_societies" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'housing_societies')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."housing_societies";
CREATE POLICY "Tenant Isolation Update" ON public."housing_societies" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = housing_societies.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = housing_societies.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'housing_societies')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."improvements";
CREATE POLICY "Tenant Isolation Insert" ON public."improvements" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'improvements')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."improvements";
CREATE POLICY "Tenant Isolation Update" ON public."improvements" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = improvements.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = improvements.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'improvements')));

DROP POLICY IF EXISTS "Allow authenticated users to insert incoming letters" ON public."incoming_letters";
CREATE POLICY "Allow authenticated users to insert incoming letters" ON public."incoming_letters" FOR INSERT TO authenticated WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'letters')));

DROP POLICY IF EXISTS "Allow users to update own incoming letters" ON public."incoming_letters";
CREATE POLICY "Allow users to update own incoming letters" ON public."incoming_letters" FOR UPDATE TO authenticated USING (((uploaded_by = auth.uid())) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'letters')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."incoming_letters";
CREATE POLICY "Tenant Isolation Insert" ON public."incoming_letters" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'letters')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."incoming_letters";
CREATE POLICY "Tenant Isolation Update" ON public."incoming_letters" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = incoming_letters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = incoming_letters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'letters')));

-- Splitting ALL policy 'Public Access Letters' on table 'letter_requests'
DROP POLICY IF EXISTS "Public Access Letters" ON public."letter_requests";
DROP POLICY IF EXISTS "Public Access Letters_sel" ON public."letter_requests";
DROP POLICY IF EXISTS "Public Access Letters_del" ON public."letter_requests";
DROP POLICY IF EXISTS "Public Access Letters_ins" ON public."letter_requests";
DROP POLICY IF EXISTS "Public Access Letters_upd" ON public."letter_requests";
CREATE POLICY "Public Access Letters_sel" ON public."letter_requests" FOR SELECT TO public USING (true);
CREATE POLICY "Public Access Letters_del" ON public."letter_requests" FOR DELETE TO public USING (true);
CREATE POLICY "Public Access Letters_ins" ON public."letter_requests" FOR INSERT TO public WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'letters')));
CREATE POLICY "Public Access Letters_upd" ON public."letter_requests" FOR UPDATE TO public USING ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'letters'))) WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'letters')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."letter_requests";
CREATE POLICY "Tenant Isolation Insert" ON public."letter_requests" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'letters')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."letter_requests";
CREATE POLICY "Tenant Isolation Update" ON public."letter_requests" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = letter_requests.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = letter_requests.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'letters')));

-- Splitting ALL policy 'Public Access Letter Types' on table 'letter_types'
DROP POLICY IF EXISTS "Public Access Letter Types" ON public."letter_types";
DROP POLICY IF EXISTS "Public Access Letter Types_sel" ON public."letter_types";
DROP POLICY IF EXISTS "Public Access Letter Types_del" ON public."letter_types";
DROP POLICY IF EXISTS "Public Access Letter Types_ins" ON public."letter_types";
DROP POLICY IF EXISTS "Public Access Letter Types_upd" ON public."letter_types";
CREATE POLICY "Public Access Letter Types_sel" ON public."letter_types" FOR SELECT TO public USING (true);
CREATE POLICY "Public Access Letter Types_del" ON public."letter_types" FOR DELETE TO public USING (true);
CREATE POLICY "Public Access Letter Types_ins" ON public."letter_types" FOR INSERT TO public WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'letters')));
CREATE POLICY "Public Access Letter Types_upd" ON public."letter_types" FOR UPDATE TO public USING ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'letters'))) WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'letters')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."letter_types";
CREATE POLICY "Tenant Isolation Insert" ON public."letter_types" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'letters')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."letter_types";
CREATE POLICY "Tenant Isolation Update" ON public."letter_types" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = letter_types.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = letter_types.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'letters')));

-- Splitting ALL policy 'letter_types_tenant_isolation' on table 'letter_types'
DROP POLICY IF EXISTS "letter_types_tenant_isolation" ON public."letter_types";
DROP POLICY IF EXISTS "letter_types_tenant_isolation_sel" ON public."letter_types";
DROP POLICY IF EXISTS "letter_types_tenant_isolation_del" ON public."letter_types";
DROP POLICY IF EXISTS "letter_types_tenant_isolation_ins" ON public."letter_types";
DROP POLICY IF EXISTS "letter_types_tenant_isolation_upd" ON public."letter_types";
CREATE POLICY "letter_types_tenant_isolation_sel" ON public."letter_types" FOR SELECT TO public USING ((tenant_id = (current_setting('app.current_tenant_id'::text))::uuid));
CREATE POLICY "letter_types_tenant_isolation_del" ON public."letter_types" FOR DELETE TO public USING ((tenant_id = (current_setting('app.current_tenant_id'::text))::uuid));
CREATE POLICY "letter_types_tenant_isolation_ins" ON public."letter_types" FOR INSERT TO public WITH CHECK (((tenant_id = (current_setting('app.current_tenant_id'::text))::uuid)) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'letters')));
CREATE POLICY "letter_types_tenant_isolation_upd" ON public."letter_types" FOR UPDATE TO public USING (((tenant_id = (current_setting('app.current_tenant_id'::text))::uuid)) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'letters'))) WITH CHECK (((tenant_id = (current_setting('app.current_tenant_id'::text))::uuid)) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'letters')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."message_logs";
CREATE POLICY "Tenant Isolation Insert" ON public."message_logs" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'public_comm')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."message_logs";
CREATE POLICY "Tenant Isolation Update" ON public."message_logs" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = message_logs.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = message_logs.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'public_comm')));

DROP POLICY IF EXISTS "tenant_insert" ON public."message_logs";
CREATE POLICY "tenant_insert" ON public."message_logs" FOR INSERT TO authenticated WITH CHECK ((((tenant_id)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'tenant_id'::text))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'public_comm')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."non_voters";
CREATE POLICY "Tenant Isolation Insert" ON public."non_voters" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'voters')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."non_voters";
CREATE POLICY "Tenant Isolation Update" ON public."non_voters" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = non_voters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = non_voters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'voters')));

-- Splitting ALL policy 'Allow manage opposition karyakartas' on table 'opposition_karyakartas'
DROP POLICY IF EXISTS "Allow manage opposition karyakartas" ON public."opposition_karyakartas";
DROP POLICY IF EXISTS "Allow manage opposition karyakartas_sel" ON public."opposition_karyakartas";
DROP POLICY IF EXISTS "Allow manage opposition karyakartas_del" ON public."opposition_karyakartas";
DROP POLICY IF EXISTS "Allow manage opposition karyakartas_ins" ON public."opposition_karyakartas";
DROP POLICY IF EXISTS "Allow manage opposition karyakartas_upd" ON public."opposition_karyakartas";
CREATE POLICY "Allow manage opposition karyakartas_sel" ON public."opposition_karyakartas" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow manage opposition karyakartas_del" ON public."opposition_karyakartas" FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow manage opposition karyakartas_ins" ON public."opposition_karyakartas" FOR INSERT TO authenticated WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'opposition')));
CREATE POLICY "Allow manage opposition karyakartas_upd" ON public."opposition_karyakartas" FOR UPDATE TO authenticated USING ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'opposition'))) WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'opposition')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."personal_requests";
CREATE POLICY "Tenant Isolation Insert" ON public."personal_requests" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'complaints')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."personal_requests";
CREATE POLICY "Tenant Isolation Update" ON public."personal_requests" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = personal_requests.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = personal_requests.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'complaints')));

-- Splitting ALL policy 'personal_requests_tenant_isolation' on table 'personal_requests'
DROP POLICY IF EXISTS "personal_requests_tenant_isolation" ON public."personal_requests";
DROP POLICY IF EXISTS "personal_requests_tenant_isolation_sel" ON public."personal_requests";
DROP POLICY IF EXISTS "personal_requests_tenant_isolation_del" ON public."personal_requests";
DROP POLICY IF EXISTS "personal_requests_tenant_isolation_ins" ON public."personal_requests";
DROP POLICY IF EXISTS "personal_requests_tenant_isolation_upd" ON public."personal_requests";
CREATE POLICY "personal_requests_tenant_isolation_sel" ON public."personal_requests" FOR SELECT TO public USING (true);
CREATE POLICY "personal_requests_tenant_isolation_del" ON public."personal_requests" FOR DELETE TO public USING (true);
CREATE POLICY "personal_requests_tenant_isolation_ins" ON public."personal_requests" FOR INSERT TO public WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'complaints')));
CREATE POLICY "personal_requests_tenant_isolation_upd" ON public."personal_requests" FOR UPDATE TO public USING ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'complaints'))) WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'complaints')));

-- Splitting ALL policy 'Enable all access for authenticated users' on table 'sadasya'
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public."sadasya";
DROP POLICY IF EXISTS "Enable all access for authenticated users_sel" ON public."sadasya";
DROP POLICY IF EXISTS "Enable all access for authenticated users_del" ON public."sadasya";
DROP POLICY IF EXISTS "Enable all access for authenticated users_ins" ON public."sadasya";
DROP POLICY IF EXISTS "Enable all access for authenticated users_upd" ON public."sadasya";
CREATE POLICY "Enable all access for authenticated users_sel" ON public."sadasya" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users_del" ON public."sadasya" FOR DELETE TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users_ins" ON public."sadasya" FOR INSERT TO authenticated WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'sadasya')));
CREATE POLICY "Enable all access for authenticated users_upd" ON public."sadasya" FOR UPDATE TO authenticated USING ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'sadasya'))) WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'sadasya')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."sadasya";
CREATE POLICY "Tenant Isolation Insert" ON public."sadasya" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'sadasya')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."sadasya";
CREATE POLICY "Tenant Isolation Update" ON public."sadasya" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = sadasya.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = sadasya.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'sadasya')));

-- Splitting ALL policy 'Enable all access for tenant users' on table 'scheme_applications'
DROP POLICY IF EXISTS "Enable all access for tenant users" ON public."scheme_applications";
DROP POLICY IF EXISTS "Enable all access for tenant users_sel" ON public."scheme_applications";
DROP POLICY IF EXISTS "Enable all access for tenant users_del" ON public."scheme_applications";
DROP POLICY IF EXISTS "Enable all access for tenant users_ins" ON public."scheme_applications";
DROP POLICY IF EXISTS "Enable all access for tenant users_upd" ON public."scheme_applications";
CREATE POLICY "Enable all access for tenant users_sel" ON public."scheme_applications" FOR SELECT TO public USING ((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))));
CREATE POLICY "Enable all access for tenant users_del" ON public."scheme_applications" FOR DELETE TO public USING ((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))));
CREATE POLICY "Enable all access for tenant users_ins" ON public."scheme_applications" FOR INSERT TO public WITH CHECK (((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'schemes')));
CREATE POLICY "Enable all access for tenant users_upd" ON public."scheme_applications" FOR UPDATE TO public USING (((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'schemes'))) WITH CHECK (((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'schemes')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."schemes";
CREATE POLICY "Tenant Isolation Insert" ON public."schemes" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'schemes')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."schemes";
CREATE POLICY "Tenant Isolation Update" ON public."schemes" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = schemes.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = schemes.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'schemes')));

-- Splitting ALL policy 'Enable all access for authenticated users on social_organizatio' on table 'social_organizations'
DROP POLICY IF EXISTS "Enable all access for authenticated users on social_organizatio" ON public."social_organizations";
DROP POLICY IF EXISTS "Enable all access for authenticated users on social_organiz_sel" ON public."social_organizations";
DROP POLICY IF EXISTS "Enable all access for authenticated users on social_organiz_del" ON public."social_organizations";
DROP POLICY IF EXISTS "Enable all access for authenticated users on social_organiz_ins" ON public."social_organizations";
DROP POLICY IF EXISTS "Enable all access for authenticated users on social_organiz_upd" ON public."social_organizations";
CREATE POLICY "Enable all access for authenticated users on social_organiz_sel" ON public."social_organizations" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users on social_organiz_del" ON public."social_organizations" FOR DELETE TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users on social_organiz_ins" ON public."social_organizations" FOR INSERT TO authenticated WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'social_organizations')));
CREATE POLICY "Enable all access for authenticated users on social_organiz_upd" ON public."social_organizations" FOR UPDATE TO authenticated USING ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'social_organizations'))) WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'social_organizations')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."social_organizations";
CREATE POLICY "Tenant Isolation Insert" ON public."social_organizations" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'social_organizations')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."social_organizations";
CREATE POLICY "Tenant Isolation Update" ON public."social_organizations" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = social_organizations.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = social_organizations.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'social_organizations')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."staff";
CREATE POLICY "Tenant Isolation Insert" ON public."staff" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'staff')));

DROP POLICY IF EXISTS "Tenant Isolation Insert Staff" ON public."staff";
CREATE POLICY "Tenant Isolation Insert Staff" ON public."staff" FOR INSERT TO public WITH CHECK (((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'staff')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."staff";
CREATE POLICY "Tenant Isolation Update" ON public."staff" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = staff.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = staff.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'staff')));

DROP POLICY IF EXISTS "Tenant Isolation Update Staff" ON public."staff";
CREATE POLICY "Tenant Isolation Update Staff" ON public."staff" FOR UPDATE TO public USING (((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'staff')));

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public."survey_responses";
CREATE POLICY "Enable insert for authenticated users" ON public."survey_responses" FOR INSERT TO authenticated WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'surveys')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."survey_responses";
CREATE POLICY "Tenant Isolation Insert" ON public."survey_responses" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'surveys')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."survey_responses";
CREATE POLICY "Tenant Isolation Update" ON public."survey_responses" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = survey_responses.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = survey_responses.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'surveys')));

-- Splitting ALL policy 'Enable all access for authenticated users' on table 'surveys'
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public."surveys";
DROP POLICY IF EXISTS "Enable all access for authenticated users_sel" ON public."surveys";
DROP POLICY IF EXISTS "Enable all access for authenticated users_del" ON public."surveys";
DROP POLICY IF EXISTS "Enable all access for authenticated users_ins" ON public."surveys";
DROP POLICY IF EXISTS "Enable all access for authenticated users_upd" ON public."surveys";
CREATE POLICY "Enable all access for authenticated users_sel" ON public."surveys" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users_del" ON public."surveys" FOR DELETE TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users_ins" ON public."surveys" FOR INSERT TO authenticated WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'surveys')));
CREATE POLICY "Enable all access for authenticated users_upd" ON public."surveys" FOR UPDATE TO authenticated USING ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'surveys'))) WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'surveys')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."surveys";
CREATE POLICY "Tenant Isolation Insert" ON public."surveys" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'surveys')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."surveys";
CREATE POLICY "Tenant Isolation Update" ON public."surveys" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = surveys.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = surveys.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'surveys')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."tasks";
CREATE POLICY "Tenant Isolation Insert" ON public."tasks" FOR INSERT TO public WITH CHECK (((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'tasks')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."tasks";
CREATE POLICY "Tenant Isolation Update" ON public."tasks" FOR UPDATE TO public USING (((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'tasks')));

-- Splitting ALL policy 'Public Access Visitors' on table 'visitors'
DROP POLICY IF EXISTS "Public Access Visitors" ON public."visitors";
DROP POLICY IF EXISTS "Public Access Visitors_sel" ON public."visitors";
DROP POLICY IF EXISTS "Public Access Visitors_del" ON public."visitors";
DROP POLICY IF EXISTS "Public Access Visitors_ins" ON public."visitors";
DROP POLICY IF EXISTS "Public Access Visitors_upd" ON public."visitors";
CREATE POLICY "Public Access Visitors_sel" ON public."visitors" FOR SELECT TO public USING (true);
CREATE POLICY "Public Access Visitors_del" ON public."visitors" FOR DELETE TO public USING (true);
CREATE POLICY "Public Access Visitors_ins" ON public."visitors" FOR INSERT TO public WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'visitors')));
CREATE POLICY "Public Access Visitors_upd" ON public."visitors" FOR UPDATE TO public USING ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'visitors'))) WITH CHECK ((true) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'visitors')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."visitors";
CREATE POLICY "Tenant Isolation Insert" ON public."visitors" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'visitors')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."visitors";
CREATE POLICY "Tenant Isolation Update" ON public."visitors" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = visitors.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = visitors.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'visitors')));

DROP POLICY IF EXISTS "Enable insert access for tenant users" ON public."voter_applications";
CREATE POLICY "Enable insert access for tenant users" ON public."voter_applications" FOR INSERT TO public WITH CHECK ((((tenant_id)::text = current_setting('app.current_tenant'::text, true))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'voter_forms')));

DROP POLICY IF EXISTS "Enable update access for tenant users" ON public."voter_applications";
CREATE POLICY "Enable update access for tenant users" ON public."voter_applications" FOR UPDATE TO public USING ((((tenant_id)::text = current_setting('app.current_tenant'::text, true))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'voter_forms')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."voter_applications";
CREATE POLICY "Tenant Isolation Insert" ON public."voter_applications" FOR INSERT TO public WITH CHECK ((((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR ((auth.role() = 'anon'::text) AND (tenant_id IS NOT NULL)))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'voter_forms')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."voter_applications";
CREATE POLICY "Tenant Isolation Update" ON public."voter_applications" FOR UPDATE TO public USING (((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'voter_forms')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."voters";
CREATE POLICY "Tenant Isolation Insert" ON public."voters" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'voters')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."voters";
CREATE POLICY "Tenant Isolation Update" ON public."voters" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = voters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = voters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'voters')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."ward_provisions";
CREATE POLICY "Tenant Isolation Insert" ON public."ward_provisions" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'provision')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."ward_provisions";
CREATE POLICY "Tenant Isolation Update" ON public."ward_provisions" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = ward_provisions.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = ward_provisions.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'provision')));

DROP POLICY IF EXISTS "Users can insert work tracker history for their tenant" ON public."work_tracker_history";
CREATE POLICY "Users can insert work tracker history for their tenant" ON public."work_tracker_history" FOR INSERT TO authenticated WITH CHECK (((tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid)) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'work_history')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."work_trackers";
CREATE POLICY "Tenant Isolation Insert" ON public."work_trackers" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'work_history')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."work_trackers";
CREATE POLICY "Tenant Isolation Update" ON public."work_trackers" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = work_trackers.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = work_trackers.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'work_history')));

DROP POLICY IF EXISTS "Users can insert work trackers for their tenant" ON public."work_trackers";
CREATE POLICY "Users can insert work trackers for their tenant" ON public."work_trackers" FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.tenant_id = work_trackers.tenant_id))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'work_history')));

DROP POLICY IF EXISTS "Users can update work trackers for their tenant" ON public."work_trackers";
CREATE POLICY "Users can update work trackers for their tenant" ON public."work_trackers" FOR UPDATE TO authenticated USING (((EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.tenant_id = work_trackers.tenant_id))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'work_history')));

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."works";
CREATE POLICY "Tenant Isolation Insert" ON public."works" FOR INSERT TO public WITH CHECK ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'work_history')));

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."works";
CREATE POLICY "Tenant Isolation Update" ON public."works" FOR UPDATE TO public USING (((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = works.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = works.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))))) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, 'work_history')));

COMMIT;
