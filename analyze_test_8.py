import csv

CSV_PATH = r'C:\Users\SAHIL\.gemini\antigravity-ide\brain\0a07aff7-4808-4938-95d6-7a8e4b4645ad\.user_uploaded\media_1787131215356.csv'

with open(CSV_PATH, 'r', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

target_policies = {
    'Tenant Isolation Insert',
    'Tenant Isolation Update',
    'Users can insert election results for their tenant',
    'Users can update election results for their tenant'
}

tables_with_generic = set()
count = 0
for r in rows:
    if r['policyname'] in target_policies:
        count += 1
        tables_with_generic.add(r['tablename'])

print(f"Total counted from live CSV (Pre-Migration): {count}")

# Now calculate what it WOULD be after our migration drops the 8 from the 4 tables
unified_tables = {'letter_requests', 'sadasya', 'letter_types', 'personal_requests'}

post_migration_count = 0
post_migration_policies = []
for r in rows:
    if r['policyname'] in target_policies and r['tablename'] not in unified_tables:
        post_migration_count += 1
        post_migration_policies.append(f"{r['tablename']} | {r['policyname']}")

print(f"Total expected after Migration: {post_migration_count}")
print(f"The 4 tables being converted have 2 each: {len(unified_tables) * 2} policies dropped from this specific count.")

