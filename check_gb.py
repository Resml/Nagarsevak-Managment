import csv
with open('migrations/live_policies.csv', 'r', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        if row['tablename'] == 'gb_diary' and row['operation'] in ['SELECT', 'DELETE']:
            print(f"{row['tablename']} | {row['policyname']} | {row['operation']}")
