import csv
with open('c:\\Users\\SAHIL\\Downloads\\Office\\Nagarsevak-Managment\\migrations\\live_policies.csv', 'r', encoding='utf-8') as f:
    policies = list(csv.DictReader(f))
for p in policies:
    if p['tablename'] == 'survey_responses' and p['operation'] == 'INSERT':
        print(f"{p['policyname']} | Roles: {p['roles']} | {p['condition']} | {p['check_condition']}")
