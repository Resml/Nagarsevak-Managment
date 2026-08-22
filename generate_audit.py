import csv
import re

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

def clean_qual(qual, table, upgrade_to_exists=True):
    if not qual or qual == 'null':
        return None
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
        count = 0
        balanced = True
        for char in inner:
            if char == '(': count += 1
            elif char == ')': count -= 1
            if count < 0: balanced = False; break
        if balanced and count == 0:
            cleaned = inner
        else:
            break
    return cleaned

def inject_member_access(qual, table, feature):
    if not qual:
        return None
    qual = qual.strip()
    while qual.startswith('(') and qual.endswith(')'):
        inner = qual[1:-1]
        count = 0
        balanced = True
        for char in inner:
            if char == '(': count += 1
            elif char == ')': count -= 1
            if count < 0: balanced = False; break
        if balanced and count == 0:
            qual = inner
        else:
            break
    
    # We DO NOT inject anon bypasses into the tenant isolation policy.
    # We strip any garbage Phase 3B bypasses from the tenant isolation policy 
    # to maintain strict boundaries.
    
    # We only care about stripping auth.role() = 'anon' and auth.role() = 'service_role' 
    # IF they were mistakenly injected into a tenant policy instead of a standalone public policy.
    # Wait, the user said: "If the original Phase 4 policy had anon/public behavior, preserve that exact behavior."
    # But then they said: "For surveys, survey_responses, events and event_rsvps: If Phase 3B already has separate anon policies, do NOT add an anon bypass to the new authenticated/member policy."
    
    # Let's cleanly inject the member access ONLY. If the original tenant policy had anon (like complaints),
    # the user pointed out it's a security flaw if it allows tenant_id IS NOT NULL.
    # Actually, the user asked me to AUDIT it first, not rewrite the generator yet.
    pass

def main():
    target_policies = ["Tenant Isolation Insert", "Tenant Isolation Update", 
                       "Users can insert election results for their tenant", 
                       "Users can update election results for their tenant"]
    
    markdown = "# Phase 4 to Phase 5B Policy Audit (Read-Only)\n\n"
    
    # Phase 3B standalone checking
    standalone_anon = {}
    with open('migrations/live_policies.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if 'anon' in row['roles'] or 'public' in row['roles']:
                if row['policyname'] not in target_policies:
                    if row['tablename'] not in standalone_anon:
                        standalone_anon[row['tablename']] = []
                    standalone_anon[row['tablename']].append(row['policyname'])
    
    markdown += "## Standalone Anon/Public Policies Identified\n"
    for table, policies in standalone_anon.items():
        markdown += f"- **{table}**: {', '.join(policies)}\n"
    markdown += "\n---\n\n"
    
    # Detailed 28 table audit
    markdown += "## Target 28 Table Audit (Tenant Isolation Policies)\n\n"
    
    with open('migrations/live_policies.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            table = row['tablename']
            policy = row['policyname']
            
            if table in tables and policy in target_policies:
                feature = tables[table]
                operation = row['operation']
                qual = row['condition']
                check = row['check_condition']
                
                has_anon = 'anon' in str(qual) or 'anon' in str(check) or 'anon' in row['roles']
                has_service = 'service_role' in str(qual) or 'service_role' in str(check) or 'service_role' in row['roles']
                
                markdown += f"### `{table}` ({operation})\n"
                markdown += f"- **Targeted Roles**: {row['roles']}\n"
                markdown += f"- **Has Standalone Anon Policy?**: {'Yes' if table in standalone_anon else 'No'}\n"
                markdown += f"- **Contains Inline anon logic?**: {has_anon}\n"
                markdown += f"- **Contains Inline service_role logic?**: {has_service}\n"
                markdown += f"**Qual:** `{qual}`\n"
                markdown += f"**With Check:** `{check}`\n\n"
                
    with open('phase4_policy_audit.md', 'w') as f:
        f.write(markdown)
        
    print("Generated phase4_policy_audit.md")

if __name__ == '__main__':
    main()
