import json

with open('audit_findings.json', 'r') as f:
    policies = json.load(f)

# Dropped in Phase 5B Test 19 logic
dropped_names = [
    "Allow authenticated users to insert incoming letters",
    "Allow users to update own incoming letters",
    "Enable insert access for authenticated users", # event_rsvps
    "Enable update access for authenticated users", # event_rsvps
    
    "Allow all for everyone", # gb_diary
    "Enable all access for authenticated users on housing_societies",
    "Enable all access for authenticated users on social_organizatio",
    "Enable all access for authenticated users", # surveys and sadasya
    "Public Access Visitors"
]

remaining = []
for p in policies:
    if p['policy'] in dropped_names:
        continue
    remaining.append(p)

for r in remaining:
    print(f"{r['table']} | {r['cmd']} | {r['policy']} | Roles: {r['roles']}")
