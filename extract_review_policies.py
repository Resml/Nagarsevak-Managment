import csv
with open('c:\\Users\\SAHIL\\Downloads\\Office\\Nagarsevak-Managment\\migrations\\live_policies.csv', 'r', encoding='utf-8') as f:
    policies = list(csv.DictReader(f))

target_policies = [
    'Auth Letter Insert', 'Public Access Letters_ins', 'Auth Letter Update', 'Public Access Letters_upd',
    'Public Access Letter Types_ins', 'Auth Sadasya Insert', 'Auth Sadasya Update'
]

print("--- 7 POLICIES REQUIRING REVIEW ---")
for p in policies:
    if p['policyname'] in target_policies:
        print(f"{p['tablename']} | {p['policyname']} | {p['operation']} | {p['roles']} | qual: {p['condition']} | check: {p['check_condition']}")

print("\n--- TENANT ISOLATION LEGACY POLICIES ---")
for p in policies:
    if p['policyname'].startswith('letter_types_tenant_isolation_') or p['policyname'].startswith('personal_requests_tenant_isolation_'):
        print(f"{p['tablename']} | {p['policyname']} | {p['operation']} | {p['roles']} | qual: {p['condition']} | check: {p['check_condition']}")
