import json
with open('audit_findings.json', 'r') as f:
    policies = json.load(f)

test19_tables = [
    'ai_history', 'complaints', 'election_results', 'event_rsvps', 'events', 'gallery', 'gb_diary', 
    'housing_societies', 'improvements', 'incoming_letters', 'letter_requests', 'letter_types', 
    'message_logs', 'non_voters', 'personal_requests', 'sadasya', 'schemes', 'social_organizations', 
    'survey_responses', 'surveys', 'tasks', 'visitors', 'voter_applications', 'voters', 
    'ward_provisions', 'work_trackers', 'works', 'staff'
]

skipped = set()
for p in policies:
    if p['table'] not in test19_tables:
        skipped.add(p['table'])
        print(f"{p['table']} | {p['policy']} | Roles: {p['roles']}")
print('Total skipped tables:', len(skipped))
