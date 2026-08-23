import csv
with open('C:\\Users\\SAHIL\\.gemini\\antigravity-ide\\brain\\0a07aff7-4808-4938-95d6-7a8e4b4645ad\\live_policies.csv', 'r', encoding='utf-8') as f:
    policies = list(csv.DictReader(f))

tables = ['gb_diary', 'housing_societies', 'letter_requests', 'letter_types', 'personal_requests', 'sadasya', 'social_organizations', 'surveys', 'visitors']

for t in tables:
    found = []
    for p in policies:
        if p['tablename'] == t:
            found.append(p['operation'] + ' - ' + p['policyname'])
    if found:
        print(t + ': ' + ', '.join(found))
    else:
        print(t + ': NO POLICIES FOUND IN LIVE_POLICIES.CSV')
