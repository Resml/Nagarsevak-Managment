import csv

CSV_PATH = r'C:\Users\SAHIL\.gemini\antigravity-ide\brain\0a07aff7-4808-4938-95d6-7a8e4b4645ad\.user_uploaded\media_1787131215356.csv'

with open(CSV_PATH, 'r', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

print("=" * 80)
print("AUDIT: Tenant Isolation Insert/Update on personal_requests")
print("=" * 80)

for r in rows:
    if r['tablename'] in ('personal_requests', 'letter_types') and r['policyname'] in ('Tenant Isolation Insert', 'Tenant Isolation Update'):
        qual = (r.get('condition') or 'NULL').replace('\n', ' ')
        wcheck = (r.get('check_condition') or 'NULL').replace('\n', ' ')
        print(f"\nPOLICY: {r['policyname']} (cmd: {r['operation']})")
        print(f"QUAL:\n  {qual[:300]}")
        print(f"WITH_CHECK:\n  {wcheck[:300]}")
        
        # Check which feature key is used
        if 'letters' in wcheck or 'letters' in qual:
            print("=> FOUND feature key: 'letters'")
        if 'complaints' in wcheck or 'complaints' in qual:
            print("=> FOUND feature key: 'complaints'")

print("\nDONE.")
