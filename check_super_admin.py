import csv
with open('c:\\Users\\SAHIL\\Downloads\\Office\\Nagarsevak-Managment\\migrations\\live_policies.csv', 'r', encoding='utf-8') as f:
    policies = list(csv.DictReader(f))
for p in policies:
    if p['policyname'] == 'Tenant Isolation Insert' and p['tablename'] in ['gb_diary', 'housing_societies']:
        print(f"{p['tablename']} INSERT check: {p['check_condition']}")
