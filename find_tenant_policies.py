import csv
with open('c:\\Users\\SAHIL\\Downloads\\Office\\Nagarsevak-Managment\\migrations\\live_policies.csv', 'r', encoding='utf-8') as f:
    policies = list(csv.DictReader(f))
for p in policies:
    if p['operation'] in ['SELECT', 'DELETE'] and p['tablename'] in ['gb_diary', 'housing_societies', 'letter_requests', 'letter_types', 'personal_requests', 'sadasya', 'social_organizations', 'surveys', 'visitors']:
        print(f"{p['tablename']} | {p['policyname']} | {p['operation']} | {p['roles']} | {p['condition']}")
