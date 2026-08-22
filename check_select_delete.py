import csv
with open('c:\\Users\\SAHIL\\Downloads\\Office\\Nagarsevak-Managment\\migrations\\live_policies.csv', 'r', encoding='utf-8') as f:
    policies = list(csv.DictReader(f))

tables = ['gb_diary', 'housing_societies', 'letter_requests', 'letter_types', 'personal_requests', 'sadasya', 'social_organizations', 'surveys', 'visitors']

for t in tables:
    found = []
    for p in policies:
        if p['tablename'] == t and p['operation'] in ['SELECT', 'DELETE']:
            found.append(f"{p['operation']}: {p['policyname']}")
    if found:
        print(f"{t}: {', '.join(found)}")
    else:
        print(f"{t}: NO SELECT/DELETE POLICIES FOUND")
