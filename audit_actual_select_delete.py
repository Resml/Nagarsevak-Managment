import csv

CSV_PATH = r'C:\Users\SAHIL\.gemini\antigravity-ide\brain\0a07aff7-4808-4938-95d6-7a8e4b4645ad\.user_uploaded\media_1787131215356.csv'
TABLES = ['letter_requests', 'sadasya', 'letter_types', 'personal_requests']
OPS    = ('SELECT', 'DELETE')

with open(CSV_PATH, 'r', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

print("=" * 100)
print("ALL SELECT/DELETE policies in the live CSV for the 4 affected tables")
print("=" * 100)

for r in rows:
    if r['tablename'] in TABLES and r['operation'] in OPS:
        qual = (r.get('condition') or 'NULL').replace('\n', ' ')
        has_feature = 'has_member_feature_access' in qual or 'has_feature_access' in qual
        has_utm     = 'user_tenant_mapping' in qual
        print(f"\n  TABLE:  {r['tablename']}")
        print(f"  POLICY: {r['policyname']}")
        print(f"  OP:     {r['operation']}  ROLES: {r['roles']}")
        print(f"  has_member_feature_access: {'YES' if has_feature else 'NO'}")
        print(f"  user_tenant_mapping:       {'YES' if has_utm     else 'NO'}")
        print(f"  QUAL: {qual[:300]}")
