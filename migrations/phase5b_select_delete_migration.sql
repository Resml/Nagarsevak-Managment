-- phase5b_select_delete_migration.sql
-- Provision explicitly scoped SELECT and DELETE policies to replace legacy ALL policies.

BEGIN;

-- 1. gb_diary
CREATE POLICY "Tenant Isolation Select" ON public.gb_diary
    FOR SELECT TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = gb_diary.tenant_id) 
         OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin'))
        AND public.has_member_feature_access(gb_diary.tenant_id, auth.uid(), 'gb_register')
    );

CREATE POLICY "Tenant Isolation Delete" ON public.gb_diary
    FOR DELETE TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = gb_diary.tenant_id) 
         OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin'))
        AND public.has_member_feature_access(gb_diary.tenant_id, auth.uid(), 'gb_register')
    );

-- 2. housing_societies
CREATE POLICY "Tenant Isolation Select" ON public.housing_societies
    FOR SELECT TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = housing_societies.tenant_id) 
         OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin'))
        AND public.has_member_feature_access(housing_societies.tenant_id, auth.uid(), 'housing_societies')
    );

CREATE POLICY "Tenant Isolation Delete" ON public.housing_societies
    FOR DELETE TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = housing_societies.tenant_id) 
         OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin'))
        AND public.has_member_feature_access(housing_societies.tenant_id, auth.uid(), 'housing_societies')
    );

-- 3. letter_requests
CREATE POLICY "Tenant Isolation Select" ON public.letter_requests
    FOR SELECT TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = letter_requests.tenant_id) 
         OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin'))
        AND public.has_member_feature_access(letter_requests.tenant_id, auth.uid(), 'letters')
    );

CREATE POLICY "Tenant Isolation Delete" ON public.letter_requests
    FOR DELETE TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = letter_requests.tenant_id) 
         OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin'))
        AND public.has_member_feature_access(letter_requests.tenant_id, auth.uid(), 'letters')
    );

-- 4. letter_types
CREATE POLICY "Tenant Isolation Select" ON public.letter_types
    FOR SELECT TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = letter_types.tenant_id) 
         OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin'))
        AND public.has_member_feature_access(letter_types.tenant_id, auth.uid(), 'letters')
    );

CREATE POLICY "Tenant Isolation Delete" ON public.letter_types
    FOR DELETE TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = letter_types.tenant_id) 
         OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin'))
        AND public.has_member_feature_access(letter_types.tenant_id, auth.uid(), 'letters')
    );

-- 5. personal_requests
CREATE POLICY "Tenant Isolation Select" ON public.personal_requests
    FOR SELECT TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = personal_requests.tenant_id) 
         OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin'))
        AND public.has_member_feature_access(personal_requests.tenant_id, auth.uid(), 'letters')
    );

CREATE POLICY "Tenant Isolation Delete" ON public.personal_requests
    FOR DELETE TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = personal_requests.tenant_id) 
         OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin'))
        AND public.has_member_feature_access(personal_requests.tenant_id, auth.uid(), 'letters')
    );

-- 6. sadasya
CREATE POLICY "Tenant Isolation Select" ON public.sadasya
    FOR SELECT TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = sadasya.tenant_id) 
         OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin'))
        AND public.has_member_feature_access(sadasya.tenant_id, auth.uid(), 'sadasya')
    );

CREATE POLICY "Tenant Isolation Delete" ON public.sadasya
    FOR DELETE TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = sadasya.tenant_id) 
         OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin'))
        AND public.has_member_feature_access(sadasya.tenant_id, auth.uid(), 'sadasya')
    );

-- 7. social_organizations
CREATE POLICY "Tenant Isolation Select" ON public.social_organizations
    FOR SELECT TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = social_organizations.tenant_id) 
         OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin'))
        AND public.has_member_feature_access(social_organizations.tenant_id, auth.uid(), 'social_organizations')
    );

CREATE POLICY "Tenant Isolation Delete" ON public.social_organizations
    FOR DELETE TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = social_organizations.tenant_id) 
         OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin'))
        AND public.has_member_feature_access(social_organizations.tenant_id, auth.uid(), 'social_organizations')
    );

-- 8. surveys
CREATE POLICY "Tenant Isolation Select" ON public.surveys
    FOR SELECT TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = surveys.tenant_id) 
         OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin'))
        AND public.has_member_feature_access(surveys.tenant_id, auth.uid(), 'surveys')
    );

CREATE POLICY "Tenant Isolation Delete" ON public.surveys
    FOR DELETE TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = surveys.tenant_id) 
         OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin'))
        AND public.has_member_feature_access(surveys.tenant_id, auth.uid(), 'surveys')
    );

-- EXCEPTION: Anonymous Survey Read Access
-- Required for PublicSurveyForm.tsx to fetch the active survey questions
CREATE POLICY "Anon Survey Select" ON public.surveys
    FOR SELECT TO public
    USING (status = 'Active');

-- 9. visitors
CREATE POLICY "Tenant Isolation Select" ON public.visitors
    FOR SELECT TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = visitors.tenant_id) 
         OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin'))
        AND public.has_member_feature_access(visitors.tenant_id, auth.uid(), 'visitors')
    );

CREATE POLICY "Tenant Isolation Delete" ON public.visitors
    FOR DELETE TO authenticated
    USING (
        (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = visitors.tenant_id) 
         OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin'))
        AND public.has_member_feature_access(visitors.tenant_id, auth.uid(), 'visitors')
    );

-- DROP ALL LEGACY 'ALL' POLICIES
DROP POLICY IF EXISTS "Allow all for everyone" ON public.gb_diary;
DROP POLICY IF EXISTS "Enable all access for authenticated users on housing_societies" ON public.housing_societies;
DROP POLICY IF EXISTS "Public Access Letters" ON public.letter_requests;
DROP POLICY IF EXISTS "Public Access Letter Types" ON public.letter_types;
DROP POLICY IF EXISTS "letter_types_tenant_isolation" ON public.letter_types;
DROP POLICY IF EXISTS "personal_requests_tenant_isolation" ON public.personal_requests;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.sadasya;
DROP POLICY IF EXISTS "Enable all access for authenticated users on social_organizatio" ON public.social_organizations;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.surveys;
DROP POLICY IF EXISTS "Public Access Visitors" ON public.visitors;

COMMIT;
