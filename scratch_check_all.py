import csv

tables_to_check = ['gb_diary', 'housing_societies', 'letter_requests', 'letter_types', 'message_logs', 'personal_requests', 'sadasya', 'social_organizations', 'surveys', 'visitors']
with open('migrations/live_policies.csv') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row['tablename'] in tables_to_check:
            print(f"{row['tablename']} | {row['policyname']} | {row['operation']}")
