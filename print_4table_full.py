import csv

CSV_PATH = r'C:\Users\SAHIL\.gemini\antigravity-ide\brain\0a07aff7-4808-4938-95d6-7a8e4b4645ad\.user_uploaded\media_1787131215356.csv'
TABLES = ['letter_requests', 'sadasya', 'letter_types', 'personal_requests']

with open(CSV_PATH, 'r', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

for r in rows:
    if r['tablename'] in TABLES:
        print(f"\n{'='*80}")
        print(f"TABLE:      {r['tablename']}")
        print(f"POLICY:     {r['policyname']}")
        print(f"OPERATION:  {r['operation']}")
        print(f"ROLES:      {r['roles']}")
        print(f"QUAL:\n  {r.get('condition','')}")
        print(f"WITH_CHECK:\n  {r.get('check_condition','')}")
