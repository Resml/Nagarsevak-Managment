import csv

CSV_PATH = r'c:\Users\SAHIL\Downloads\Office\Nagarsevak-Managment\migrations\live_policies.csv'

with open(CSV_PATH, 'r', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

target_tables = {
    'ai_history', 'complaints', 'election_results', 'event_rsvps', 'events', 'gallery', 
    'gb_diary', 'housing_societies', 'improvements', 'incoming_letters', 'letter_requests', 
    'letter_types', 'message_logs', 'non_voters', 'personal_requests', 'sadasya', 'schemes', 
    'social_organizations', 'survey_responses', 'surveys', 'tasks', 'visitors', 
    'voter_applications', 'voters', 'ward_provisions', 'work_trackers', 'works', 'staff'
}

rogues = []
for r in rows:
    table = r['tablename']
    policy = r['policyname']
    cmd = r.get('operation', '').upper()
    
    if table not in target_tables:
        continue
    if cmd not in ('INSERT', 'UPDATE'):
        continue

    # EXACT Test 19 logic from phase5b_rbac_verify.sql (lines 715-764)
    if policy in ('Tenant Isolation Insert', 'Tenant Isolation Update'):
        continue
    if table == 'election_results' and policy in (
        'Users can insert election results for their tenant',
        'Users can update election results for their tenant',
        'Admin Insert election_results',
        'Admin Update election_results'
    ):
        continue
    if table == 'event_rsvps' and policy in ('Anon Event RSVP', 'Auth RSVP Insert', 'Auth RSVP Update'):
        continue
    if table == 'survey_responses' and policy in ('Anon Survey Insert', 'Auth Survey Update', 'Enable insert for authenticated users'):
        continue
    if table == 'letter_requests' and policy in ('Unified Letter Insert', 'Unified Letter Update'):
        continue
    if table == 'sadasya' and policy in ('Unified Sadasya Insert', 'Unified Sadasya Update'):
        continue
    if table == 'letter_types' and policy in ('Unified Letter Types Insert', 'Unified Letter Types Update'):
        continue
    if table == 'personal_requests' and policy in ('Unified Personal Requests Insert', 'Unified Personal Requests Update'):
        continue
        
    rogues.append(r)

print(f"Total Rogues Found in migrations/live_policies.csv: {len(rogues)}")
for i, r in enumerate(rogues, 1):
    print(f"{i}. {r['tablename']} | {r['policyname']} | {r.get('operation')} | {r.get('roles')} | {r.get('condition')} | {r.get('check_condition')}")
