import csv
with open('migrations/live_policies.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    policies = list(reader)

tables = [
    'ai_history', 'complaints', 'election_results', 'event_rsvps', 'events',
    'gallery', 'gb_diary', 'housing_societies', 'improvements', 'incoming_letters',
    'letter_requests', 'letter_types', 'message_logs', 'non_voters', 'personal_requests',
    'sadasya', 'schemes', 'social_organizations', 'survey_responses', 'surveys',
    'tasks', 'visitors', 'voter_applications', 'voters', 'ward_provisions',
    'work_trackers', 'works', 'staff'
]

count = 0
for r in policies:
    if r['tablename'] in tables and r['operation'] in ('INSERT', 'UPDATE'):
        pn = r['policyname']
        is_ok = pn in ('Tenant Isolation Insert', 'Tenant Isolation Update', 
                       'Users can insert election results for their tenant', 
                       'Users can update election results for their tenant',
                       'Enable insert for public', 'Enable insert for authenticated users')
        if not is_ok:
            count += 1
            print(f"{r['tablename']} | {pn}")
print('Total:', count)
