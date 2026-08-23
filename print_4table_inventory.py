import csv

CSV_PATH = r'C:\Users\SAHIL\.gemini\antigravity-ide\brain\0a07aff7-4808-4938-95d6-7a8e4b4645ad\.user_uploaded\media_1787131215356.csv'
TABLES = ['letter_requests', 'sadasya', 'letter_types', 'personal_requests']

with open(CSV_PATH, 'r', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

print(f"{'TABLE':<25} {'POLICY NAME':<50} {'OP':<8} {'ROLES':<14} {'QUAL':<80} {'WITH_CHECK'}")
print("-" * 220)

for r in rows:
    if r['tablename'] in TABLES:
        qual     = (r.get('condition') or '').replace('\n', ' ')[:80]
        wcheck   = (r.get('check_condition') or '').replace('\n', ' ')[:80]
        print(f"{r['tablename']:<25} {r['policyname']:<50} {r['operation']:<8} {str(r['roles']):<14} {qual:<80} {wcheck}")
