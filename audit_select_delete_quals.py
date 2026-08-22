import csv

CSV_PATH = r'C:\Users\SAHIL\.gemini\antigravity-ide\brain\0a07aff7-4808-4938-95d6-7a8e4b4645ad\.user_uploaded\media_1787131215356.csv'

TARGET_POLICIES = [
    ('letter_requests',   'Auth Letter Select'),
    ('letter_requests',   'Auth Letter Delete'),
    ('sadasya',           'Auth Sadasya Select'),
    ('sadasya',           'Auth Sadasya Delete'),
    ('letter_types',      'Tenant Select letter_types'),
    ('letter_types',      'Tenant Delete letter_types'),
    ('personal_requests', 'Tenant Select personal_requests'),
    ('personal_requests', 'Tenant Delete personal_requests'),
]

with open(CSV_PATH, 'r', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

live_lookup = {(r['tablename'], r['policyname']): r for r in rows}

print("=" * 90)
print("READ-ONLY AUDIT: SELECT/DELETE policies that will be validated in the safety guard")
print("=" * 90)

for (table, policy) in TARGET_POLICIES:
    key = (table, policy)
    print(f"\nTABLE:    {table}")
    print(f"POLICY:   {policy}")
    if key not in live_lookup:
        print("  STATUS:  *** NOT FOUND in live inventory ***")
        continue
    r = live_lookup[key]
    qual   = r.get('condition', '') or 'NULL'
    wcheck = r.get('check_condition', '') or 'NULL'
    op     = r['operation']
    roles  = r['roles']

    has_feature = 'has_member_feature_access' in qual or 'has_feature_access' in qual
    has_utm     = 'user_tenant_mapping' in qual

    print(f"  STATUS:  EXISTS (op={op}, roles={roles})")
    print(f"  has_member_feature_access in QUAL: {'YES' if has_feature else 'NO -- feature entitlement NOT enforced'}")
    print(f"  user_tenant_mapping in QUAL:       {'YES' if has_utm     else 'NO'}")
    print(f"  QUAL:\n    {qual}")
    print(f"  WITH_CHECK:\n    {wcheck}")
