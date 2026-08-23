import os

tables = [
  'ai_history', 'complaints', 'election_results', 'event_rsvps', 'events',
  'gallery', 'gb_diary', 'housing_societies', 'improvements', 'incoming_letters',
  'letter_requests', 'letter_types', 'message_logs', 'non_voters', 'personal_requests',
  'sadasya', 'schemes', 'social_organizations', 'survey_responses', 'surveys',
  'tasks', 'visitors', 'voter_applications', 'voters', 'ward_provisions',
  'work_trackers', 'works', 'staff'
]

sql = """-- Phase 5B RBAC Rollback
-- Execution: Manual
-- Purpose: Revert to Phase 4 has_feature_access (tenant entitlement only).

BEGIN;

DROP TRIGGER IF EXISTS trg_validate_staff_permissions ON public.staff;
DROP FUNCTION IF EXISTS public.validate_staff_permissions_entitlement();

DROP TRIGGER IF EXISTS trg_prevent_staff_permission_escalation ON public.staff;
DROP FUNCTION IF EXISTS public.prevent_staff_permission_escalation();

-- Note: We drop the function at the end after replacing all policies

"""

for table in tables:
    featureKey = table
    if table == 'voter_applications': featureKey = 'voters'
    if table == 'event_rsvps': featureKey = 'events'
    if table == 'letter_types': featureKey = 'letter_requests'
    if table == 'survey_responses': featureKey = 'surveys'
    if table == 'work_trackers': featureKey = 'works'
    
    sql += f'-- Table: {table} (Feature: {featureKey})\n'
    sql += f'DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.{table};\n'
    sql += f'DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.{table};\n'
    sql += f'DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.{table};\n'
    sql += f'DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.{table};\n\n'

    sql += f'CREATE POLICY "Allow select based on tenant_id" ON public.{table} FOR SELECT USING (\n'
    sql += f'    EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND role = \'super_admin\')\n'
    sql += f'    OR (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = {table}.tenant_id) AND public.has_feature_access({table}.tenant_id, \'{featureKey}\'))\n'
    sql += f');\n'

    sql += f'CREATE POLICY "Allow insert based on tenant_id" ON public.{table} FOR INSERT WITH CHECK (\n'
    sql += f'    EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND role = \'super_admin\')\n'
    sql += f'    OR (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = {table}.tenant_id) AND public.has_feature_access({table}.tenant_id, \'{featureKey}\'))\n'
    sql += f');\n'

    sql += f'CREATE POLICY "Allow update based on tenant_id" ON public.{table} FOR UPDATE USING (\n'
    sql += f'    EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND role = \'super_admin\')\n'
    sql += f'    OR (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = {table}.tenant_id) AND public.has_feature_access({table}.tenant_id, \'{featureKey}\'))\n'
    sql += f') WITH CHECK (\n'
    sql += f'    EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND role = \'super_admin\')\n'
    sql += f'    OR (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = {table}.tenant_id) AND public.has_feature_access({table}.tenant_id, \'{featureKey}\'))\n'
    sql += f');\n'

    sql += f'CREATE POLICY "Allow delete based on tenant_id" ON public.{table} FOR DELETE USING (\n'
    sql += f'    EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND role = \'super_admin\')\n'
    sql += f'    OR (EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = {table}.tenant_id) AND public.has_feature_access({table}.tenant_id, \'{featureKey}\'))\n'
    sql += f');\n\n'

sql += 'DROP FUNCTION IF EXISTS public.has_member_feature_access(UUID, UUID, TEXT);\n\n'
sql += 'COMMIT;\n'

with open('migrations/phase5b_rbac_rollback.sql', 'w') as f:
    f.write(sql)

print('Generated migrations/phase5b_rbac_rollback.sql')
