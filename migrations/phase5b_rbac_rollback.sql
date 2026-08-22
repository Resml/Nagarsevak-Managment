-- Phase 5B RBAC Rollback
-- Restores Phase 4 baseline
BEGIN;


DROP TRIGGER IF EXISTS trg_prevent_staff_permission_escalation ON public.staff;
DROP TRIGGER IF EXISTS trg_validate_staff_permissions ON public.staff;
DROP FUNCTION IF EXISTS public.prevent_staff_permission_escalation();
DROP FUNCTION IF EXISTS public.validate_staff_permissions_entitlement();
DROP FUNCTION IF EXISTS public.has_member_feature_access(UUID, UUID, TEXT);

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.ai_history;
CREATE POLICY "Tenant Isolation Insert" ON public.ai_history
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.ai_history;
CREATE POLICY "Tenant Isolation Update" ON public.ai_history
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = ai_history.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = ai_history.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.complaints;
CREATE POLICY "Tenant Isolation Insert" ON public.complaints
  FOR INSERT TO public
  WITH CHECK (((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (auth.role() = 'anon'::text) OR (auth.role() = 'service_role'::text) OR (tenant_id IS NOT NULL)));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.complaints;
CREATE POLICY "Tenant Isolation Update" ON public.complaints
  FOR UPDATE TO public
  USING (((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (auth.role() = 'service_role'::text)));
DROP POLICY IF EXISTS "Users can insert election results for their tenant" ON public.election_results;
CREATE POLICY "Users can insert election results for their tenant" ON public.election_results
  FOR INSERT TO public
  WITH CHECK ((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'admin'::text)))));
DROP POLICY IF EXISTS "Users can update election results for their tenant" ON public.election_results;
CREATE POLICY "Users can update election results for their tenant" ON public.election_results
  FOR UPDATE TO public
  USING ((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'admin'::text)))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.event_rsvps;
CREATE POLICY "Tenant Isolation Insert" ON public.event_rsvps
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.event_rsvps;
CREATE POLICY "Tenant Isolation Update" ON public.event_rsvps
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = event_rsvps.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = event_rsvps.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.events;
CREATE POLICY "Tenant Isolation Insert" ON public.events
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.events;
CREATE POLICY "Tenant Isolation Update" ON public.events
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = events.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = events.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.gallery;
CREATE POLICY "Tenant Isolation Insert" ON public.gallery
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.gallery;
CREATE POLICY "Tenant Isolation Update" ON public.gallery
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = gallery.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = gallery.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.gb_diary;
CREATE POLICY "Tenant Isolation Insert" ON public.gb_diary
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.gb_diary;
CREATE POLICY "Tenant Isolation Update" ON public.gb_diary
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = gb_diary.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = gb_diary.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.housing_societies;
CREATE POLICY "Tenant Isolation Insert" ON public.housing_societies
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.housing_societies;
CREATE POLICY "Tenant Isolation Update" ON public.housing_societies
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = housing_societies.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = housing_societies.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.improvements;
CREATE POLICY "Tenant Isolation Insert" ON public.improvements
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.improvements;
CREATE POLICY "Tenant Isolation Update" ON public.improvements
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = improvements.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = improvements.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.incoming_letters;
CREATE POLICY "Tenant Isolation Insert" ON public.incoming_letters
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.incoming_letters;
CREATE POLICY "Tenant Isolation Update" ON public.incoming_letters
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = incoming_letters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = incoming_letters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.letter_requests;
CREATE POLICY "Tenant Isolation Insert" ON public.letter_requests
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.letter_requests;
CREATE POLICY "Tenant Isolation Update" ON public.letter_requests
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = letter_requests.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = letter_requests.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.letter_types;
CREATE POLICY "Tenant Isolation Insert" ON public.letter_types
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.letter_types;
CREATE POLICY "Tenant Isolation Update" ON public.letter_types
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = letter_types.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = letter_types.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.message_logs;
CREATE POLICY "Tenant Isolation Insert" ON public.message_logs
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.message_logs;
CREATE POLICY "Tenant Isolation Update" ON public.message_logs
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = message_logs.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = message_logs.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.non_voters;
CREATE POLICY "Tenant Isolation Insert" ON public.non_voters
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.non_voters;
CREATE POLICY "Tenant Isolation Update" ON public.non_voters
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = non_voters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = non_voters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.personal_requests;
CREATE POLICY "Tenant Isolation Insert" ON public.personal_requests
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.personal_requests;
CREATE POLICY "Tenant Isolation Update" ON public.personal_requests
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = personal_requests.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = personal_requests.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.sadasya;
CREATE POLICY "Tenant Isolation Insert" ON public.sadasya
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.sadasya;
CREATE POLICY "Tenant Isolation Update" ON public.sadasya
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = sadasya.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = sadasya.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.schemes;
CREATE POLICY "Tenant Isolation Insert" ON public.schemes
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.schemes;
CREATE POLICY "Tenant Isolation Update" ON public.schemes
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = schemes.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = schemes.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.social_organizations;
CREATE POLICY "Tenant Isolation Insert" ON public.social_organizations
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.social_organizations;
CREATE POLICY "Tenant Isolation Update" ON public.social_organizations
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = social_organizations.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = social_organizations.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.staff;
CREATE POLICY "Tenant Isolation Insert" ON public.staff
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.staff;
CREATE POLICY "Tenant Isolation Update" ON public.staff
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = staff.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = staff.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.survey_responses;
CREATE POLICY "Tenant Isolation Insert" ON public.survey_responses
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.survey_responses;
CREATE POLICY "Tenant Isolation Update" ON public.survey_responses
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = survey_responses.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = survey_responses.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.surveys;
CREATE POLICY "Tenant Isolation Insert" ON public.surveys
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.surveys;
CREATE POLICY "Tenant Isolation Update" ON public.surveys
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = surveys.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = surveys.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.tasks;
CREATE POLICY "Tenant Isolation Insert" ON public.tasks
  FOR INSERT TO public
  WITH CHECK ((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.tasks;
CREATE POLICY "Tenant Isolation Update" ON public.tasks
  FOR UPDATE TO public
  USING ((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.visitors;
CREATE POLICY "Tenant Isolation Insert" ON public.visitors
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.visitors;
CREATE POLICY "Tenant Isolation Update" ON public.visitors
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = visitors.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = visitors.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.voter_applications;
CREATE POLICY "Tenant Isolation Insert" ON public.voter_applications
  FOR INSERT TO public
  WITH CHECK (((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR ((auth.role() = 'anon'::text) AND (tenant_id IS NOT NULL))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.voter_applications;
CREATE POLICY "Tenant Isolation Update" ON public.voter_applications
  FOR UPDATE TO public
  USING ((tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.voters;
CREATE POLICY "Tenant Isolation Insert" ON public.voters
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.voters;
CREATE POLICY "Tenant Isolation Update" ON public.voters
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = voters.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = voters.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.ward_provisions;
CREATE POLICY "Tenant Isolation Insert" ON public.ward_provisions
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.ward_provisions;
CREATE POLICY "Tenant Isolation Update" ON public.ward_provisions
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = ward_provisions.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = ward_provisions.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.work_trackers;
CREATE POLICY "Tenant Isolation Insert" ON public.work_trackers
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.work_trackers;
CREATE POLICY "Tenant Isolation Update" ON public.work_trackers
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = work_trackers.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = work_trackers.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.works;
CREATE POLICY "Tenant Isolation Insert" ON public.works
  FOR INSERT TO public
  WITH CHECK (((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.works;
CREATE POLICY "Tenant Isolation Update" ON public.works
  FOR UPDATE TO public
  USING ((((tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid()))) AND (category = ( SELECT upper(tenants.tier) AS upper FROM tenants WHERE (tenants.id = works.tenant_id))) AND (plan = ( SELECT upper(tenants.plan) AS upper FROM tenants WHERE (tenants.id = works.tenant_id)))) OR (EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))));
COMMIT;
