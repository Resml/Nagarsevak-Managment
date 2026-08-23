import csv
import json

with open('live_policies.csv', 'r') as f:
    reader = csv.DictReader(f)
    policies = list(reader)

tables = set(p['tablename'] for p in policies)

admin_tables = ['admin_billing', 'admin_support_tickets', 'admin_updates']
mixed_tables = ['scheme_applications', 'survey_responses', 'event_rsvps', 'sadasya', 'voter_applications', 'letter_requests', 'work_tracker_history', 'complaints']
global_ignore = ['whatsapp_sessions', 'user_tenant_mapping', 'conference_rooms', 'tenants']

core_tables = [t for t in tables if t not in admin_tables and t not in mixed_tables and t not in global_ignore]

# Generate Rollback
with open('phase2_rollback.sql', 'w') as f:
    f.write('-- WARNING:\n-- This rollback restores the previous insecure security state.\n-- Use only if necessary to recover application functionality.\n\n')
    for p in policies:
        if p['policyname'] == 'null': continue
        cmd = p['operation']
        roles = ', '.join(p['roles'].strip('{}').split(','))
        f.write(f'DROP POLICY IF EXISTS "{p["policyname"]}" ON public."{p["tablename"]}";\n')
        cond = f'USING {p["condition"]}' if p['condition'] and p['condition'] != 'null' else ''
        check = f'WITH CHECK {p["check_condition"]}' if p['check_condition'] and p['check_condition'] != 'null' else ''
        f.write(f'CREATE POLICY "{p["policyname"]}" ON public."{p["tablename"]}" FOR {cmd} TO {roles} {cond} {check};\n\n')

# Generate 004 Core RLS
with open('phase2_004_core_rls_v3.sql', 'w') as f:
    f.write('-- Phase 2 - 004 - Core RLS V3\n-- Replaces insecure JWT and subquery explosion policies with strict get_authorized_tenants() check.\n\n')
    for t in core_tables:
        t_pols = [p for p in policies if p['tablename'] == t and p['policyname'] != 'null']
        f.write(f'-- Table: {t}\nALTER TABLE public."{t}" ENABLE ROW LEVEL SECURITY;\n')
        for p in t_pols:
            f.write(f'DROP POLICY IF EXISTS "{p["policyname"]}" ON public."{t}";\n')
        
        f.write(f'CREATE POLICY "Tenant Select {t}" ON public."{t}" FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));\n')
        f.write(f'CREATE POLICY "Tenant Insert {t}" ON public."{t}" FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));\n')
        f.write(f'CREATE POLICY "Tenant Update {t}" ON public."{t}" FOR UPDATE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants())) WITH CHECK (tenant_id IN (SELECT public.get_authorized_tenants()));\n')
        f.write(f'CREATE POLICY "Tenant Delete {t}" ON public."{t}" FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));\n\n')

