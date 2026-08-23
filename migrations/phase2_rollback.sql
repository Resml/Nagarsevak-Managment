-- WARNING:
-- This rollback restores the previous insecure security state.
-- Use only if necessary to recover application functionality.

DROP POLICY IF EXISTS "Enable all operations for admin_billing" ON public."admin_billing";
CREATE POLICY "Enable all operations for admin_billing" ON public."admin_billing" FOR ALL TO public USING true WITH CHECK true;

DROP POLICY IF EXISTS "Enable all operations for admin_support_tickets" ON public."admin_support_tickets";
CREATE POLICY "Enable all operations for admin_support_tickets" ON public."admin_support_tickets" FOR ALL TO public USING true WITH CHECK true;

DROP POLICY IF EXISTS "Enable all operations for admin_updates" ON public."admin_updates";
CREATE POLICY "Enable all operations for admin_updates" ON public."admin_updates" FOR ALL TO public USING true WITH CHECK true;

DROP POLICY IF EXISTS "Allow anon delete access" ON public."ai_history";
CREATE POLICY "Allow anon delete access" ON public."ai_history" FOR DELETE TO public USING true ;

DROP POLICY IF EXISTS "Allow anon insert access" ON public."ai_history";
CREATE POLICY "Allow anon insert access" ON public."ai_history" FOR INSERT TO public  WITH CHECK true;

DROP POLICY IF EXISTS "Allow anon read access" ON public."ai_history";
CREATE POLICY "Allow anon read access" ON public."ai_history" FOR SELECT TO public USING true ;

DROP POLICY IF EXISTS "Allow anon update access" ON public."ai_history";
CREATE POLICY "Allow anon update access" ON public."ai_history" FOR UPDATE TO public USING true ;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."ai_history";
CREATE POLICY "Tenant Isolation Delete" ON public."ai_history" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = ai_history.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = ai_history.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."ai_history";
CREATE POLICY "Tenant Isolation Insert" ON public."ai_history" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."ai_history";
CREATE POLICY "Tenant Isolation Select" ON public."ai_history" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = ai_history.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = ai_history.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."ai_history";
CREATE POLICY "Tenant Isolation Update" ON public."ai_history" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = ai_history.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = ai_history.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Allow full access app_settings" ON public."app_settings";
CREATE POLICY "Allow full access app_settings" ON public."app_settings" FOR ALL TO public USING true WITH CHECK true;

DROP POLICY IF EXISTS "area_problems_tenant_isolation" ON public."area_problems";
CREATE POLICY "area_problems_tenant_isolation" ON public."area_problems" FOR ALL TO public USING true WITH CHECK true;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."complaints";
CREATE POLICY "Tenant Isolation Delete" ON public."complaints" FOR DELETE TO public USING ((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (auth.role() = 'service_role'::text)) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."complaints";
CREATE POLICY "Tenant Isolation Insert" ON public."complaints" FOR INSERT TO public  WITH CHECK ((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (auth.role() = 'anon'::text) OR (auth.role() = 'service_role'::text) OR (tenant_id IS NOT NULL));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."complaints";
CREATE POLICY "Tenant Isolation Select" ON public."complaints" FOR SELECT TO public USING ((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (auth.role() = 'anon'::text) OR (auth.role() = 'service_role'::text) OR (tenant_id IS NULL)) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."complaints";
CREATE POLICY "Tenant Isolation Update" ON public."complaints" FOR UPDATE TO public USING ((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (auth.role() = 'service_role'::text)) ;

DROP POLICY IF EXISTS "Users can delete election results for their tenant" ON public."election_results";
CREATE POLICY "Users can delete election results for their tenant" ON public."election_results" FOR DELETE TO public USING (tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'admin'::text)))) ;

DROP POLICY IF EXISTS "Users can insert election results for their tenant" ON public."election_results";
CREATE POLICY "Users can insert election results for their tenant" ON public."election_results" FOR INSERT TO public  WITH CHECK (tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'admin'::text))));

DROP POLICY IF EXISTS "Users can update election results for their tenant" ON public."election_results";
CREATE POLICY "Users can update election results for their tenant" ON public."election_results" FOR UPDATE TO public USING (tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'admin'::text)))) ;

DROP POLICY IF EXISTS "Users can view election results for their tenant" ON public."election_results";
CREATE POLICY "Users can view election results for their tenant" ON public."election_results" FOR SELECT TO public USING (tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) ;

DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public."event_rsvps";
CREATE POLICY "Enable delete access for authenticated users" ON public."event_rsvps" FOR DELETE TO public USING (auth.role() = 'authenticated'::text) ;

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public."event_rsvps";
CREATE POLICY "Enable insert access for authenticated users" ON public."event_rsvps" FOR INSERT TO public  WITH CHECK (auth.role() = 'authenticated'::text);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public."event_rsvps";
CREATE POLICY "Enable read access for authenticated users" ON public."event_rsvps" FOR SELECT TO public USING (auth.role() = 'authenticated'::text) ;

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public."event_rsvps";
CREATE POLICY "Enable update access for authenticated users" ON public."event_rsvps" FOR UPDATE TO public USING (auth.role() = 'authenticated'::text) ;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."event_rsvps";
CREATE POLICY "Tenant Isolation Delete" ON public."event_rsvps" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = event_rsvps.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = event_rsvps.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."event_rsvps";
CREATE POLICY "Tenant Isolation Insert" ON public."event_rsvps" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."event_rsvps";
CREATE POLICY "Tenant Isolation Select" ON public."event_rsvps" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = event_rsvps.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = event_rsvps.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."event_rsvps";
CREATE POLICY "Tenant Isolation Update" ON public."event_rsvps" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = event_rsvps.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = event_rsvps.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Allow public insert events" ON public."events";
CREATE POLICY "Allow public insert events" ON public."events" FOR INSERT TO anon  WITH CHECK true;

DROP POLICY IF EXISTS "Allow public read events" ON public."events";
CREATE POLICY "Allow public read events" ON public."events" FOR SELECT TO anon USING true ;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."events";
CREATE POLICY "Tenant Isolation Delete" ON public."events" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = events.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = events.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."events";
CREATE POLICY "Tenant Isolation Insert" ON public."events" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."events";
CREATE POLICY "Tenant Isolation Select" ON public."events" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = events.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = events.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."events";
CREATE POLICY "Tenant Isolation Update" ON public."events" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = events.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = events.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Allow anon delete access" ON public."gallery";
CREATE POLICY "Allow anon delete access" ON public."gallery" FOR DELETE TO public USING true ;

DROP POLICY IF EXISTS "Allow anon insert access" ON public."gallery";
CREATE POLICY "Allow anon insert access" ON public."gallery" FOR INSERT TO public  WITH CHECK true;

DROP POLICY IF EXISTS "Allow anon read access" ON public."gallery";
CREATE POLICY "Allow anon read access" ON public."gallery" FOR SELECT TO public USING true ;

DROP POLICY IF EXISTS "Allow anon update access" ON public."gallery";
CREATE POLICY "Allow anon update access" ON public."gallery" FOR UPDATE TO public USING true ;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."gallery";
CREATE POLICY "Tenant Isolation Delete" ON public."gallery" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = gallery.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = gallery.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."gallery";
CREATE POLICY "Tenant Isolation Insert" ON public."gallery" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."gallery";
CREATE POLICY "Tenant Isolation Select" ON public."gallery" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = gallery.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = gallery.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."gallery";
CREATE POLICY "Tenant Isolation Update" ON public."gallery" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = gallery.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = gallery.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Allow all for everyone" ON public."gb_diary";
CREATE POLICY "Allow all for everyone" ON public."gb_diary" FOR ALL TO public USING true WITH CHECK true;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."gb_diary";
CREATE POLICY "Tenant Isolation Delete" ON public."gb_diary" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = gb_diary.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = gb_diary.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."gb_diary";
CREATE POLICY "Tenant Isolation Insert" ON public."gb_diary" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."gb_diary";
CREATE POLICY "Tenant Isolation Select" ON public."gb_diary" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = gb_diary.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = gb_diary.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."gb_diary";
CREATE POLICY "Tenant Isolation Update" ON public."gb_diary" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = gb_diary.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = gb_diary.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Enable all access for authenticated users on housing_societies" ON public."housing_societies";
CREATE POLICY "Enable all access for authenticated users on housing_societies" ON public."housing_societies" FOR ALL TO authenticated USING true WITH CHECK true;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."housing_societies";
CREATE POLICY "Tenant Isolation Delete" ON public."housing_societies" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = housing_societies.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = housing_societies.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."housing_societies";
CREATE POLICY "Tenant Isolation Insert" ON public."housing_societies" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."housing_societies";
CREATE POLICY "Tenant Isolation Select" ON public."housing_societies" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = housing_societies.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = housing_societies.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."housing_societies";
CREATE POLICY "Tenant Isolation Update" ON public."housing_societies" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = housing_societies.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = housing_societies.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Allow public insert improvements" ON public."improvements";
CREATE POLICY "Allow public insert improvements" ON public."improvements" FOR INSERT TO anon  WITH CHECK true;

DROP POLICY IF EXISTS "Allow public read improvements" ON public."improvements";
CREATE POLICY "Allow public read improvements" ON public."improvements" FOR SELECT TO anon USING true ;

DROP POLICY IF EXISTS "Allow public update improvements" ON public."improvements";
CREATE POLICY "Allow public update improvements" ON public."improvements" FOR UPDATE TO anon USING true ;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."improvements";
CREATE POLICY "Tenant Isolation Delete" ON public."improvements" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = improvements.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = improvements.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."improvements";
CREATE POLICY "Tenant Isolation Insert" ON public."improvements" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."improvements";
CREATE POLICY "Tenant Isolation Select" ON public."improvements" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = improvements.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = improvements.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."improvements";
CREATE POLICY "Tenant Isolation Update" ON public."improvements" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = improvements.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = improvements.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Allow authenticated users to insert incoming letters" ON public."incoming_letters";
CREATE POLICY "Allow authenticated users to insert incoming letters" ON public."incoming_letters" FOR INSERT TO authenticated  WITH CHECK true;

DROP POLICY IF EXISTS "Allow authenticated users to read incoming letters" ON public."incoming_letters";
CREATE POLICY "Allow authenticated users to read incoming letters" ON public."incoming_letters" FOR SELECT TO authenticated USING true ;

DROP POLICY IF EXISTS "Allow users to delete own incoming letters" ON public."incoming_letters";
CREATE POLICY "Allow users to delete own incoming letters" ON public."incoming_letters" FOR DELETE TO authenticated USING (uploaded_by = auth.uid()) ;

DROP POLICY IF EXISTS "Allow users to update own incoming letters" ON public."incoming_letters";
CREATE POLICY "Allow users to update own incoming letters" ON public."incoming_letters" FOR UPDATE TO authenticated USING (uploaded_by = auth.uid()) ;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."incoming_letters";
CREATE POLICY "Tenant Isolation Delete" ON public."incoming_letters" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = incoming_letters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = incoming_letters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."incoming_letters";
CREATE POLICY "Tenant Isolation Insert" ON public."incoming_letters" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."incoming_letters";
CREATE POLICY "Tenant Isolation Select" ON public."incoming_letters" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = incoming_letters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = incoming_letters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."incoming_letters";
CREATE POLICY "Tenant Isolation Update" ON public."incoming_letters" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = incoming_letters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = incoming_letters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Public Access Letters" ON public."letter_requests";
CREATE POLICY "Public Access Letters" ON public."letter_requests" FOR ALL TO public USING true WITH CHECK true;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."letter_requests";
CREATE POLICY "Tenant Isolation Delete" ON public."letter_requests" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = letter_requests.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = letter_requests.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."letter_requests";
CREATE POLICY "Tenant Isolation Insert" ON public."letter_requests" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."letter_requests";
CREATE POLICY "Tenant Isolation Select" ON public."letter_requests" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = letter_requests.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = letter_requests.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."letter_requests";
CREATE POLICY "Tenant Isolation Update" ON public."letter_requests" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = letter_requests.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = letter_requests.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Public Access Letter Types" ON public."letter_types";
CREATE POLICY "Public Access Letter Types" ON public."letter_types" FOR ALL TO public USING true WITH CHECK true;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."letter_types";
CREATE POLICY "Tenant Isolation Delete" ON public."letter_types" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = letter_types.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = letter_types.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."letter_types";
CREATE POLICY "Tenant Isolation Insert" ON public."letter_types" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."letter_types";
CREATE POLICY "Tenant Isolation Select" ON public."letter_types" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = letter_types.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = letter_types.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."letter_types";
CREATE POLICY "Tenant Isolation Update" ON public."letter_types" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = letter_types.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = letter_types.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "letter_types_tenant_isolation" ON public."letter_types";
CREATE POLICY "letter_types_tenant_isolation" ON public."letter_types" FOR ALL TO public USING (tenant_id = (current_setting('app.current_tenant_id'::text))::uuid) ;

DROP POLICY IF EXISTS "Nagarsevak can view all login logs for their tenant" ON public."login_logs";
CREATE POLICY "Nagarsevak can view all login logs for their tenant" ON public."login_logs" FOR SELECT TO public USING (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.tenant_id = login_logs.tenant_id) AND (user_tenant_mapping.role = 'nagarsevak'::text)))) ;

DROP POLICY IF EXISTS "Users can insert their own login logs" ON public."login_logs";
CREATE POLICY "Users can insert their own login logs" ON public."login_logs" FOR INSERT TO public  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own login logs" ON public."login_logs";
CREATE POLICY "Users can view their own login logs" ON public."login_logs" FOR SELECT TO public USING (auth.uid() = user_id) ;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."message_logs";
CREATE POLICY "Tenant Isolation Delete" ON public."message_logs" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = message_logs.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = message_logs.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."message_logs";
CREATE POLICY "Tenant Isolation Insert" ON public."message_logs" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."message_logs";
CREATE POLICY "Tenant Isolation Select" ON public."message_logs" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = message_logs.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = message_logs.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."message_logs";
CREATE POLICY "Tenant Isolation Update" ON public."message_logs" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = message_logs.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = message_logs.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "service_role_all" ON public."message_logs";
CREATE POLICY "service_role_all" ON public."message_logs" FOR ALL TO service_role USING true WITH CHECK true;

DROP POLICY IF EXISTS "tenant_insert" ON public."message_logs";
CREATE POLICY "tenant_insert" ON public."message_logs" FOR INSERT TO authenticated  WITH CHECK ((tenant_id)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'tenant_id'::text));

DROP POLICY IF EXISTS "tenant_select" ON public."message_logs";
CREATE POLICY "tenant_select" ON public."message_logs" FOR SELECT TO authenticated USING ((tenant_id)::text = ((current_setting('request.jwt.claims'::text, true))::json ->> 'tenant_id'::text)) ;

DROP POLICY IF EXISTS "Allow public insert non_voters" ON public."non_voters";
CREATE POLICY "Allow public insert non_voters" ON public."non_voters" FOR INSERT TO anon  WITH CHECK true;

DROP POLICY IF EXISTS "Allow public read non_voters" ON public."non_voters";
CREATE POLICY "Allow public read non_voters" ON public."non_voters" FOR SELECT TO anon USING true ;

DROP POLICY IF EXISTS "Allow public update non_voters" ON public."non_voters";
CREATE POLICY "Allow public update non_voters" ON public."non_voters" FOR UPDATE TO anon USING true ;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."non_voters";
CREATE POLICY "Tenant Isolation Delete" ON public."non_voters" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = non_voters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = non_voters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."non_voters";
CREATE POLICY "Tenant Isolation Insert" ON public."non_voters" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."non_voters";
CREATE POLICY "Tenant Isolation Select" ON public."non_voters" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = non_voters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = non_voters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."non_voters";
CREATE POLICY "Tenant Isolation Update" ON public."non_voters" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = non_voters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = non_voters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Allow manage opposition karyakartas" ON public."opposition_karyakartas";
CREATE POLICY "Allow manage opposition karyakartas" ON public."opposition_karyakartas" FOR ALL TO authenticated USING true WITH CHECK true;

DROP POLICY IF EXISTS "Allow read access opposition karyakartas" ON public."opposition_karyakartas";
CREATE POLICY "Allow read access opposition karyakartas" ON public."opposition_karyakartas" FOR SELECT TO public USING true ;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."personal_requests";
CREATE POLICY "Tenant Isolation Delete" ON public."personal_requests" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = personal_requests.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = personal_requests.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."personal_requests";
CREATE POLICY "Tenant Isolation Insert" ON public."personal_requests" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."personal_requests";
CREATE POLICY "Tenant Isolation Select" ON public."personal_requests" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = personal_requests.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = personal_requests.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."personal_requests";
CREATE POLICY "Tenant Isolation Update" ON public."personal_requests" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = personal_requests.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = personal_requests.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "personal_requests_tenant_isolation" ON public."personal_requests";
CREATE POLICY "personal_requests_tenant_isolation" ON public."personal_requests" FOR ALL TO public USING true WITH CHECK true;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public."sadasya";
CREATE POLICY "Enable all access for authenticated users" ON public."sadasya" FOR ALL TO authenticated USING true WITH CHECK true;

DROP POLICY IF EXISTS "Enable read access for all users of same tenant" ON public."sadasya";
CREATE POLICY "Enable read access for all users of same tenant" ON public."sadasya" FOR SELECT TO public USING ((tenant_id = ( SELECT auth.uid() AS uid FROM auth.users WHERE (users.id = auth.uid()))) OR (tenant_id = '00000000-0000-0000-0000-000000000000'::uuid)) ;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."sadasya";
CREATE POLICY "Tenant Isolation Delete" ON public."sadasya" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = sadasya.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = sadasya.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."sadasya";
CREATE POLICY "Tenant Isolation Insert" ON public."sadasya" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."sadasya";
CREATE POLICY "Tenant Isolation Select" ON public."sadasya" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = sadasya.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = sadasya.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."sadasya";
CREATE POLICY "Tenant Isolation Update" ON public."sadasya" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = sadasya.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = sadasya.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Enable all access for tenant users" ON public."scheme_applications";
CREATE POLICY "Enable all access for tenant users" ON public."scheme_applications" FOR ALL TO public USING (tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) WITH CHECK (tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())));

DROP POLICY IF EXISTS "Allow public insert schemes" ON public."schemes";
CREATE POLICY "Allow public insert schemes" ON public."schemes" FOR INSERT TO anon  WITH CHECK true;

DROP POLICY IF EXISTS "Allow public read schemes" ON public."schemes";
CREATE POLICY "Allow public read schemes" ON public."schemes" FOR SELECT TO anon USING true ;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."schemes";
CREATE POLICY "Tenant Isolation Delete" ON public."schemes" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = schemes.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = schemes.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."schemes";
CREATE POLICY "Tenant Isolation Insert" ON public."schemes" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."schemes";
CREATE POLICY "Tenant Isolation Select" ON public."schemes" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = schemes.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = schemes.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."schemes";
CREATE POLICY "Tenant Isolation Update" ON public."schemes" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = schemes.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = schemes.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Admins can view tenant audit logs" ON public."security_audit_logs";
CREATE POLICY "Admins can view tenant audit logs" ON public."security_audit_logs" FOR SELECT TO public USING ((EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.tenant_id = security_audit_logs.tenant_id) AND (user_tenant_mapping.role = ANY (ARRAY['nagarsevak'::text, 'admin'::text, 'amdar'::text, 'khasdar'::text, 'minister'::text]))))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Users can insert security audit logs" ON public."security_audit_logs";
CREATE POLICY "Users can insert security audit logs" ON public."security_audit_logs" FOR INSERT TO public  WITH CHECK true;

DROP POLICY IF EXISTS "Enable all access for authenticated users on social_organizatio" ON public."social_organizations";
CREATE POLICY "Enable all access for authenticated users on social_organizatio" ON public."social_organizations" FOR ALL TO authenticated USING true WITH CHECK true;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."social_organizations";
CREATE POLICY "Tenant Isolation Delete" ON public."social_organizations" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = social_organizations.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = social_organizations.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."social_organizations";
CREATE POLICY "Tenant Isolation Insert" ON public."social_organizations" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."social_organizations";
CREATE POLICY "Tenant Isolation Select" ON public."social_organizations" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = social_organizations.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = social_organizations.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."social_organizations";
CREATE POLICY "Tenant Isolation Update" ON public."social_organizations" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = social_organizations.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = social_organizations.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."staff";
CREATE POLICY "Tenant Isolation Delete" ON public."staff" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = staff.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = staff.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Delete Staff" ON public."staff";
CREATE POLICY "Tenant Isolation Delete Staff" ON public."staff" FOR DELETE TO public USING (tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."staff";
CREATE POLICY "Tenant Isolation Insert" ON public."staff" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Insert Staff" ON public."staff";
CREATE POLICY "Tenant Isolation Insert Staff" ON public."staff" FOR INSERT TO public  WITH CHECK (tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."staff";
CREATE POLICY "Tenant Isolation Select" ON public."staff" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = staff.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = staff.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Select Staff" ON public."staff";
CREATE POLICY "Tenant Isolation Select Staff" ON public."staff" FOR SELECT TO public USING (tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."staff";
CREATE POLICY "Tenant Isolation Update" ON public."staff" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = staff.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = staff.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update Staff" ON public."staff";
CREATE POLICY "Tenant Isolation Update Staff" ON public."staff" FOR UPDATE TO public USING (tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) ;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."support_tickets";
CREATE POLICY "Tenant Isolation Delete" ON public."support_tickets" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = support_tickets.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = support_tickets.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."support_tickets";
CREATE POLICY "Tenant Isolation Insert" ON public."support_tickets" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."support_tickets";
CREATE POLICY "Tenant Isolation Select" ON public."support_tickets" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = support_tickets.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = support_tickets.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."support_tickets";
CREATE POLICY "Tenant Isolation Update" ON public."support_tickets" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = support_tickets.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = support_tickets.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public."survey_responses";
CREATE POLICY "Enable insert for authenticated users" ON public."survey_responses" FOR INSERT TO authenticated  WITH CHECK true;

DROP POLICY IF EXISTS "Enable insert for public" ON public."survey_responses";
CREATE POLICY "Enable insert for public" ON public."survey_responses" FOR INSERT TO anon  WITH CHECK true;

DROP POLICY IF EXISTS "Enable select for authenticated users" ON public."survey_responses";
CREATE POLICY "Enable select for authenticated users" ON public."survey_responses" FOR SELECT TO authenticated USING true ;

DROP POLICY IF EXISTS "Enable select for public" ON public."survey_responses";
CREATE POLICY "Enable select for public" ON public."survey_responses" FOR SELECT TO anon USING true ;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."survey_responses";
CREATE POLICY "Tenant Isolation Delete" ON public."survey_responses" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = survey_responses.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = survey_responses.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."survey_responses";
CREATE POLICY "Tenant Isolation Insert" ON public."survey_responses" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."survey_responses";
CREATE POLICY "Tenant Isolation Select" ON public."survey_responses" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = survey_responses.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = survey_responses.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."survey_responses";
CREATE POLICY "Tenant Isolation Update" ON public."survey_responses" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = survey_responses.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = survey_responses.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public."surveys";
CREATE POLICY "Enable all access for authenticated users" ON public."surveys" FOR ALL TO authenticated USING true WITH CHECK true;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."surveys";
CREATE POLICY "Tenant Isolation Delete" ON public."surveys" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = surveys.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = surveys.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."surveys";
CREATE POLICY "Tenant Isolation Insert" ON public."surveys" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."surveys";
CREATE POLICY "Tenant Isolation Select" ON public."surveys" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = surveys.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = surveys.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."surveys";
CREATE POLICY "Tenant Isolation Update" ON public."surveys" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = surveys.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = surveys.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."tasks";
CREATE POLICY "Tenant Isolation Delete" ON public."tasks" FOR DELETE TO public USING (tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."tasks";
CREATE POLICY "Tenant Isolation Insert" ON public."tasks" FOR INSERT TO public  WITH CHECK (tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."tasks";
CREATE POLICY "Tenant Isolation Select" ON public."tasks" FOR SELECT TO public USING (tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."tasks";
CREATE POLICY "Tenant Isolation Update" ON public."tasks" FOR UPDATE TO public USING (tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) ;

DROP POLICY IF EXISTS "Allow public read of tenants" ON public."tenants";
CREATE POLICY "Allow public read of tenants" ON public."tenants" FOR SELECT TO public USING true ;

DROP POLICY IF EXISTS "Public read access to tenants" ON public."tenants";
CREATE POLICY "Public read access to tenants" ON public."tenants" FOR SELECT TO public USING true ;

DROP POLICY IF EXISTS "Users can update own tenant" ON public."tenants";
CREATE POLICY "Users can update own tenant" ON public."tenants" FOR UPDATE TO public USING (id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) WITH CHECK (id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can read own tenant mapping" ON public."user_tenant_mapping";
CREATE POLICY "Users can read own tenant mapping" ON public."user_tenant_mapping" FOR SELECT TO public USING (auth.uid() = user_id) ;

DROP POLICY IF EXISTS "Public Access Visitors" ON public."visitors";
CREATE POLICY "Public Access Visitors" ON public."visitors" FOR ALL TO public USING true WITH CHECK true;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."visitors";
CREATE POLICY "Tenant Isolation Delete" ON public."visitors" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = visitors.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = visitors.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."visitors";
CREATE POLICY "Tenant Isolation Insert" ON public."visitors" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."visitors";
CREATE POLICY "Tenant Isolation Select" ON public."visitors" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = visitors.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = visitors.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."visitors";
CREATE POLICY "Tenant Isolation Update" ON public."visitors" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = visitors.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = visitors.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Enable insert access for tenant users" ON public."voter_applications";
CREATE POLICY "Enable insert access for tenant users" ON public."voter_applications" FOR INSERT TO public  WITH CHECK ((tenant_id)::text = current_setting('app.current_tenant'::text, true));

DROP POLICY IF EXISTS "Enable read access for tenant users" ON public."voter_applications";
CREATE POLICY "Enable read access for tenant users" ON public."voter_applications" FOR SELECT TO public USING ((tenant_id)::text = current_setting('app.current_tenant'::text, true)) ;

DROP POLICY IF EXISTS "Enable update access for tenant users" ON public."voter_applications";
CREATE POLICY "Enable update access for tenant users" ON public."voter_applications" FOR UPDATE TO public USING ((tenant_id)::text = current_setting('app.current_tenant'::text, true)) ;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."voter_applications";
CREATE POLICY "Tenant Isolation Delete" ON public."voter_applications" FOR DELETE TO public USING (tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."voter_applications";
CREATE POLICY "Tenant Isolation Insert" ON public."voter_applications" FOR INSERT TO public  WITH CHECK ((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR ((auth.role() = 'anon'::text) AND (tenant_id IS NOT NULL)));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."voter_applications";
CREATE POLICY "Tenant Isolation Select" ON public."voter_applications" FOR SELECT TO public USING ((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR ((auth.role() = 'anon'::text) AND (tenant_id IS NOT NULL))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."voter_applications";
CREATE POLICY "Tenant Isolation Update" ON public."voter_applications" FOR UPDATE TO public USING (tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) ;

DROP POLICY IF EXISTS "Allow public insert voters" ON public."voters";
CREATE POLICY "Allow public insert voters" ON public."voters" FOR INSERT TO anon  WITH CHECK true;

DROP POLICY IF EXISTS "Allow public read voters" ON public."voters";
CREATE POLICY "Allow public read voters" ON public."voters" FOR SELECT TO anon USING true ;

DROP POLICY IF EXISTS "Allow public update voters" ON public."voters";
CREATE POLICY "Allow public update voters" ON public."voters" FOR UPDATE TO anon USING true ;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."voters";
CREATE POLICY "Tenant Isolation Delete" ON public."voters" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = voters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = voters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."voters";
CREATE POLICY "Tenant Isolation Insert" ON public."voters" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."voters";
CREATE POLICY "Tenant Isolation Select" ON public."voters" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = voters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = voters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."voters";
CREATE POLICY "Tenant Isolation Update" ON public."voters" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = voters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = voters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Allow public insert ward_provisions" ON public."ward_provisions";
CREATE POLICY "Allow public insert ward_provisions" ON public."ward_provisions" FOR INSERT TO anon  WITH CHECK true;

DROP POLICY IF EXISTS "Allow public read ward_provisions" ON public."ward_provisions";
CREATE POLICY "Allow public read ward_provisions" ON public."ward_provisions" FOR SELECT TO anon USING true ;

DROP POLICY IF EXISTS "Allow public update ward_provisions" ON public."ward_provisions";
CREATE POLICY "Allow public update ward_provisions" ON public."ward_provisions" FOR UPDATE TO anon USING true ;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."ward_provisions";
CREATE POLICY "Tenant Isolation Delete" ON public."ward_provisions" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = ward_provisions.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = ward_provisions.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."ward_provisions";
CREATE POLICY "Tenant Isolation Insert" ON public."ward_provisions" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."ward_provisions";
CREATE POLICY "Tenant Isolation Select" ON public."ward_provisions" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = ward_provisions.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = ward_provisions.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."ward_provisions";
CREATE POLICY "Tenant Isolation Update" ON public."ward_provisions" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = ward_provisions.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = ward_provisions.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Allow all access to whatsapp_sessions" ON public."whatsapp_sessions";
CREATE POLICY "Allow all access to whatsapp_sessions" ON public."whatsapp_sessions" FOR ALL TO public USING true WITH CHECK true;

DROP POLICY IF EXISTS "Users can insert work tracker history for their tenant" ON public."work_tracker_history";
CREATE POLICY "Users can insert work tracker history for their tenant" ON public."work_tracker_history" FOR INSERT TO authenticated  WITH CHECK (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid);

DROP POLICY IF EXISTS "Users can see their tenant's work tracker history" ON public."work_tracker_history";
CREATE POLICY "Users can see their tenant's work tracker history" ON public."work_tracker_history" FOR SELECT TO authenticated USING (tenant_id = ((auth.jwt() ->> 'tenant_id'::text))::uuid) ;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."work_trackers";
CREATE POLICY "Tenant Isolation Delete" ON public."work_trackers" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = work_trackers.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = work_trackers.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."work_trackers";
CREATE POLICY "Tenant Isolation Insert" ON public."work_trackers" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."work_trackers";
CREATE POLICY "Tenant Isolation Select" ON public."work_trackers" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = work_trackers.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = work_trackers.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."work_trackers";
CREATE POLICY "Tenant Isolation Update" ON public."work_trackers" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = work_trackers.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = work_trackers.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Users can delete work trackers for their tenant" ON public."work_trackers";
CREATE POLICY "Users can delete work trackers for their tenant" ON public."work_trackers" FOR DELETE TO authenticated USING (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.tenant_id = work_trackers.tenant_id)))) ;

DROP POLICY IF EXISTS "Users can insert work trackers for their tenant" ON public."work_trackers";
CREATE POLICY "Users can insert work trackers for their tenant" ON public."work_trackers" FOR INSERT TO authenticated  WITH CHECK (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.tenant_id = work_trackers.tenant_id))));

DROP POLICY IF EXISTS "Users can see their tenant's work trackers" ON public."work_trackers";
CREATE POLICY "Users can see their tenant's work trackers" ON public."work_trackers" FOR SELECT TO authenticated USING (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.tenant_id = work_trackers.tenant_id)))) ;

DROP POLICY IF EXISTS "Users can update work trackers for their tenant" ON public."work_trackers";
CREATE POLICY "Users can update work trackers for their tenant" ON public."work_trackers" FOR UPDATE TO authenticated USING (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.tenant_id = work_trackers.tenant_id)))) ;

DROP POLICY IF EXISTS "Allow public insert works" ON public."works";
CREATE POLICY "Allow public insert works" ON public."works" FOR INSERT TO anon  WITH CHECK true;

DROP POLICY IF EXISTS "Allow public read works" ON public."works";
CREATE POLICY "Allow public read works" ON public."works" FOR SELECT TO anon USING true ;

DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public."works";
CREATE POLICY "Tenant Isolation Delete" ON public."works" FOR DELETE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = works.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = works.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public."works";
CREATE POLICY "Tenant Isolation Insert" ON public."works" FOR INSERT TO public  WITH CHECK ((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text)))));

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public."works";
CREATE POLICY "Tenant Isolation Select" ON public."works" FOR SELECT TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = works.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = works.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public."works";
CREATE POLICY "Tenant Isolation Update" ON public."works" FOR UPDATE TO public USING (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = works.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = works.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))) ;

