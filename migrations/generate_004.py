import csv
import json

with open('live_policies.csv', 'r') as f:
    reader = csv.DictReader(f)
    policies = list(reader)

tables = set(p['tablename'] for p in policies)

admin_tables = ['admin_billing', 'admin_support_tickets', 'admin_updates']
mixed_tables = ['scheme_applications', 'survey_responses', 'event_rsvps', 'sadasya', 'voter_applications', 'letter_requests', 'work_tracker_history', 'complaints']
global_ignore = ['whatsapp_sessions', 'user_tenant_mapping', 'conference_rooms', 'tenants']
special_tables = ['security_audit_logs', 'login_logs', 'election_results']

core_tables = [t for t in tables if t not in admin_tables and t not in mixed_tables and t not in global_ignore and t not in special_tables]

with open('phase2_004_core_rls_v3.sql', 'w') as f:
    f.write('-- Phase 2 - 004 - Core RLS V3\n-- Replaces insecure JWT and subquery explosion policies with strict get_authorized_tenants() check.\n-- Preserves custom role-based access for special tables.\n\n')
    
    # 1. Handle Generic Core Tables
    for t in core_tables:
        t_pols = [p for p in policies if p['tablename'] == t and p['policyname'] != 'null']
        f.write(f'-- Table: {t}\nALTER TABLE public."{t}" ENABLE ROW LEVEL SECURITY;\n')
        for p in t_pols:
            f.write(f'DROP POLICY IF EXISTS "{p["policyname"]}" ON public."{t}";\n')
        
        f.write(f'CREATE POLICY "Tenant Select {t}" ON public."{t}" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));\n')
        f.write(f'CREATE POLICY "Tenant Insert {t}" ON public."{t}" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));\n')
        f.write(f'CREATE POLICY "Tenant Update {t}" ON public."{t}" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));\n')
        f.write(f'CREATE POLICY "Tenant Delete {t}" ON public."{t}" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));\n\n')

    # 2. Handle Special Tables
    
    # security_audit_logs
    t = 'security_audit_logs'
    f.write(f'-- Table: {t}\nALTER TABLE public."{t}" ENABLE ROW LEVEL SECURITY;\n')
    for p in [p for p in policies if p['tablename'] == t and p['policyname'] != 'null']:
        f.write(f'DROP POLICY IF EXISTS "{p["policyname"]}" ON public."{t}";\n')
    f.write(f'CREATE POLICY "Admins Select {t}" ON public."{t}" FOR SELECT TO authenticated USING (\n  EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND tenant_id = {t}.tenant_id AND role = ANY(ARRAY[\'nagarsevak\', \'admin\', \'amdar\', \'khasdar\', \'minister\', \'super_admin\']))\n);\n')
    f.write(f'CREATE POLICY "Auth Insert {t}" ON public."{t}" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));\n\n')

    # login_logs
    t = 'login_logs'
    f.write(f'-- Table: {t}\nALTER TABLE public."{t}" ENABLE ROW LEVEL SECURITY;\n')
    for p in [p for p in policies if p['tablename'] == t and p['policyname'] != 'null']:
        f.write(f'DROP POLICY IF EXISTS "{p["policyname"]}" ON public."{t}";\n')
    f.write(f'CREATE POLICY "Users Select Own {t}" ON public."{t}" FOR SELECT TO authenticated USING (auth.uid() = user_id);\n')
    f.write(f'CREATE POLICY "Nagarsevak Select All {t}" ON public."{t}" FOR SELECT TO authenticated USING (\n  EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND tenant_id = {t}.tenant_id AND role = ANY(ARRAY[\'nagarsevak\', \'super_admin\']))\n);\n')
    f.write(f'CREATE POLICY "Users Insert Own {t}" ON public."{t}" FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id IN (SELECT public.get_authorized_tenants()));\n\n')

    # election_results
    t = 'election_results'
    f.write(f'-- Table: {t}\nALTER TABLE public."{t}" ENABLE ROW LEVEL SECURITY;\n')
    for p in [p for p in policies if p['tablename'] == t and p['policyname'] != 'null']:
        f.write(f'DROP POLICY IF EXISTS "{p["policyname"]}" ON public."{t}";\n')
    f.write(f'CREATE POLICY "Auth Select {t}" ON public."{t}" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));\n')
    f.write(f'CREATE POLICY "Admin Insert {t}" ON public."{t}" FOR INSERT TO authenticated WITH CHECK (\n  EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND tenant_id = {t}.tenant_id AND role = ANY(ARRAY[\'admin\', \'super_admin\']))\n);\n')
    f.write(f'CREATE POLICY "Admin Update {t}" ON public."{t}" FOR UPDATE TO authenticated USING (\n  EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND tenant_id = {t}.tenant_id AND role = ANY(ARRAY[\'admin\', \'super_admin\']))\n);\n')
    f.write(f'CREATE POLICY "Admin Delete {t}" ON public."{t}" FOR DELETE TO authenticated USING (\n  EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND tenant_id = {t}.tenant_id AND role = ANY(ARRAY[\'admin\', \'super_admin\']))\n);\n\n')

