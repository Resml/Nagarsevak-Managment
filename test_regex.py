import csv
import re
import os

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

def clean_qual(qual, table):
    if not qual:
        return qual
    # Strip category and plan checks
    cleaned = re.sub(
        r" AND \(category = \( SELECT upper\(tenants\.tier\).*?\)\)",
        "",
        qual
    )
    cleaned = re.sub(
        r" AND \(plan = \( SELECT upper\(tenants\.plan\).*?\)\)",
        "",
        cleaned
    )
    # Upgrade to EXISTS
    cleaned = cleaned.replace(
        "(tenant_id = ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))",
        f"(EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = {table}.tenant_id))"
    )
    cleaned = cleaned.replace(
        "(tenant_id IN ( SELECT user_tenant_mapping.tenant_id FROM user_tenant_mapping WHERE (user_tenant_mapping.user_id = auth.uid())))",
        f"(EXISTS (SELECT 1 FROM public.user_tenant_mapping utm WHERE utm.user_id = auth.uid() AND utm.tenant_id = {table}.tenant_id))"
    )
    return cleaned

def append_feature_check(qual, table, feature):
    if not qual:
        return qual
    if "public.has_feature_access" in qual:
        return qual.replace(
            f"public.has_feature_access(tenant_id",
            f"public.has_member_feature_access({table}.tenant_id, auth.uid()"
        )
    else:
        appendage = f"(auth.role() = 'anon'::text OR auth.role() = 'service_role'::text OR {table}.tenant_id IS NULL OR public.has_member_feature_access({table}.tenant_id, auth.uid(), '{feature}'))"
        return f"({qual}) AND {appendage}"

def main():
    target_policies = ["Tenant Isolation Select", "Tenant Isolation Insert", "Tenant Isolation Update", "Tenant Isolation Delete"]
    
    with open('migrations/live_policies.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            table = row['tablename']
            policy = row['policyname']
            if table in tables and policy in target_policies:
                feature = tables[table]
                qual = clean_qual(row['condition'], table)
                qual = append_feature_check(qual, table, feature)
                
                with_check = clean_qual(row['check_condition'], table)
                with_check = append_feature_check(with_check, table, feature)
                
                print(f"--- {table} {policy} ---")
                if qual:
                    print(f"USING: {qual}")
                if with_check:
                    print(f"WITH CHECK: {with_check}")
                print()

if __name__ == '__main__':
    main()
