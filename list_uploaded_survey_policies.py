import csv
with open('C:\\Users\\SAHIL\\.gemini\\antigravity-ide\\brain\\0a07aff7-4808-4938-95d6-7a8e4b4645ad\\live_policies.csv', 'r', encoding='utf-8') as f:
    policies = list(csv.DictReader(f))
for p in policies:
    if p['tablename'] == 'survey_responses' and p['operation'] == 'INSERT':
        print(f"{p['policyname']} | Roles: {p['roles']} | qual: {p['condition']} | with_check: {p['check_condition']}")
