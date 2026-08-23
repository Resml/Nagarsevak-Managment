import csv
import re
import json

tables = {
  'ai_history': 'ai_content',
  'complaints': 'complaints',
  'election_results': 'election_results',
  'event_rsvps': 'events',
  'events': 'events',
  'gallery': 'gallery',
  'gb_diary': 'gb_register',
  'housing_societies': 'housing_societies',
  'improvements': 'improvements',
  'incoming_letters': 'letters',
  'letter_requests': 'letters',
  'letter_types': 'letters',
  'message_logs': 'messages',
  'non_voters': 'election_results',
  'personal_requests': 'letters',
  'sadasya': 'sadasya',
  'schemes': 'schemes',
  'social_organizations': 'social_organizations',
  'survey_responses': 'surveys',
  'surveys': 'surveys',
  'tasks': 'tasks',
  'visitors': 'visitors',
  'voter_applications': 'election_results',
  'voters': 'election_results',
  'ward_provisions': 'ward_provisions',
  'work_trackers': 'works',
  'works': 'works',
  'staff': 'staff'
}

def is_balanced(s):
    count = 0
    for char in s:
        if char == '(': count += 1
        elif char == ')': count -= 1
        if count < 0: return False
    return count == 0

def clean_qual(qual, table, upgrade_to_exists=True):
    if not qual or qual == 'null': return None
    
    cleaned = re.sub(r" AND \(category = \( SELECT upper\(tenants\.tier\).*?\)\)", "", qual)
    cleaned = re.sub(r" AND \(plan = \( SELECT upper\(tenants\.plan\).*?\)\)", "", cleaned)
    
    if upgrade_to_exists:
        cleaned = cleaned.replace(
            "(tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))",
            f"EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = {table}.tenant_id)"
        )
        cleaned = cleaned.replace(
            "(tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))",
            f"EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = {table}.tenant_id)"
        )
        cleaned = cleaned.replace(
            "(EXISTS ( SELECT 1 FROM user_tenant_mapping WHERE ((user_tenant_mapping.user_id = auth.uid()) AND (user_tenant_mapping.role = 'super_admin'::text))))",
            "EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')"
        )
        
        if "super_admin" in cleaned:
             return f"EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = {table}.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')"
             
    while cleaned.startswith('(') and cleaned.endswith(')'):
        inner = cleaned[1:-1]
        if is_balanced(inner): cleaned = inner
        else: break
            
    # CRITICAL: Clean up dangerous Phase 3B inline bypasses for all tables
    if "anon" in cleaned or "service_role" in cleaned or "tenant_id IS NOT NULL" in cleaned:
        return f"EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = {table}.tenant_id) OR EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.role = 'super_admin')"

    return cleaned

def inject_member_access(qual, table, feature):
    if not qual: return None
        
    qual = qual.strip()
    while qual.startswith('(') and qual.endswith(')'):
        inner = qual[1:-1]
        if is_balanced(inner): qual = inner
        else: break
            
    wrapped_original = f"({qual})"
    appendage = f"public.has_member_feature_access({table}.tenant_id, auth.uid(), '{feature}')"
    return f"({wrapped_original} AND {appendage})"


def generate_policy_sql(table, policy, roles, operation, qual, with_check):
    roles_sql = roles.replace('{', '').replace('}', '')
    sql = f'DROP POLICY IF EXISTS "{policy}" ON public.{table};\n'
    sql += f'CREATE POLICY "{policy}" ON public.{table}\n'
    sql += f'  FOR {operation} TO {roles_sql}\n'
    if qual: sql += f'  USING ({qual})'
    if with_check:
        if qual: sql += '\n'
        sql += f'  WITH CHECK ({with_check})'
    sql += ';\n'
    return sql

def main():
    target_policies = ["Tenant Isolation Insert", "Tenant Isolation Update", 
                       "Users can insert election results for their tenant", 
                       "Users can update election results for their tenant"]
    
    mig_sql = "-- Phase 5B RBAC Migration\n-- Generated from Phase 4 baseline\nBEGIN;\n\n"
    roll_sql = "-- Phase 5B RBAC Rollback\n-- Restores Phase 4 baseline\nBEGIN;\n\n"
    
    # 1. Functions
    mig_sql += """
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

"""

    roll_sql += """
DROP TRIGGER IF EXISTS trg_prevent_staff_permission_escalation ON public.staff;
DROP TRIGGER IF EXISTS trg_validate_staff_permissions ON public.staff;
DROP FUNCTION IF EXISTS public.prevent_staff_permission_escalation();
DROP FUNCTION IF EXISTS public.validate_staff_permissions_entitlement();
DROP FUNCTION IF EXISTS public.has_member_feature_access(UUID, UUID, TEXT);

"""
    
    mig_sql += """
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
"""

    for table in tables.keys():
        mig_sql += f'DROP POLICY IF EXISTS "Tenant Insert {table}" ON public.{table};\n'
        mig_sql += f'DROP POLICY IF EXISTS "Tenant Update {table}" ON public.{table};\n'
    
    mig_sql += "\n"

    mig_stats = {'SELECT': 0, 'INSERT': 0, 'UPDATE': 0, 'DELETE': 0}

    with open('migrations/live_policies.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            table = row['tablename']
            policy = row['policyname']
            
            if table in tables and policy in target_policies:
                feature = tables[table]
                roles = row['roles']
                operation = row['operation']
                
                old_qual_raw = row['condition']
                old_check_raw = row['check_condition']
                
                old_qual = old_qual_raw if old_qual_raw != 'null' else None
                old_check = old_check_raw if old_check_raw != 'null' else None
                
                roll_sql += generate_policy_sql(table, policy, roles, operation, old_qual, old_check)
                
                # Apply migration cleanup across all tables
                new_qual = clean_qual(old_qual_raw, table)
                new_qual = inject_member_access(new_qual, table, feature)
                
                new_check = clean_qual(old_check_raw, table)
                new_check = inject_member_access(new_check, table, feature)
                
                sql_block = generate_policy_sql(table, policy, roles, operation, new_qual, new_check)
                mig_sql += sql_block
                
                if not is_balanced(sql_block):
                    print(f"ERROR: Unbalanced parens generated for {table} {policy}!")
                
                mig_stats[operation] += 1

    mig_sql += "COMMIT;\n"
    roll_sql += "COMMIT;\n"

    with open('migrations/phase5b_rbac_migration.sql', 'w') as f:
        f.write(mig_sql)
        
    with open('migrations/phase5b_rbac_rollback.sql', 'w') as f:
        f.write(roll_sql)
        
    print(f"Generated migrations/phase5b_rbac_migration.sql")
    print(f"Generated migrations/phase5b_rbac_rollback.sql")
    print(f"Stats: {mig_stats}")

if __name__ == '__main__':
    main()
