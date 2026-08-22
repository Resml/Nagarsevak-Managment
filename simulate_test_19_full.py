import csv
import re
import os

CSV_PATH = r'C:\Users\SAHIL\.gemini\antigravity-ide\brain\0a07aff7-4808-4938-95d6-7a8e4b4645ad\.user_uploaded\media_1787131215356.csv'

with open(CSV_PATH, 'r', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

dropped = set()
migrations_dir = r'c:\Users\SAHIL\Downloads\Office\Nagarsevak-Managment\migrations'
for f in os.listdir(migrations_dir):
    if f.endswith('.sql'):
        with open(os.path.join(migrations_dir, f), 'r', encoding='utf-8') as sql_file:
            sql = sql_file.read()
            for match in re.finditer(r'DROP POLICY\s+IF\s+EXISTS\s+"([^"]+)"\s+ON\s+public\.(\w+);', sql, re.IGNORECASE):
                 dropped.add((match.group(2), match.group(1)))

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
    if table not in target_tables or cmd not in ('INSERT', 'UPDATE'): continue
    if (table, policy) in dropped: continue

    if policy in ('Tenant Isolation Insert', 'Tenant Isolation Update'): continue
    if table == 'election_results' and policy in ('Users can insert election results for their tenant', 'Users can update election results for their tenant', 'Admin Insert election_results', 'Admin Update election_results'): continue
    if table == 'event_rsvps' and policy in ('Anon Event RSVP', 'Auth RSVP Insert', 'Auth RSVP Update'): continue
    if table == 'survey_responses' and policy in ('Anon Survey Insert', 'Auth Survey Update', 'Enable insert for authenticated users'): continue
    if table == 'letter_requests' and policy in ('Unified Letter Insert', 'Unified Letter Update'): continue
    if table == 'sadasya' and policy in ('Unified Sadasya Insert', 'Unified Sadasya Update'): continue
    if table == 'letter_types' and policy in ('Unified Letter Types Insert', 'Unified Letter Types Update'): continue
    if table == 'personal_requests' and policy in ('Unified Personal Requests Insert', 'Unified Personal Requests Update'): continue
        
    rogues.append(r)

print(f'Total Rogues Found: {len(rogues)}')
for i, r in enumerate(rogues, 1):
    print(f'{i}. {r["tablename"]} | {r["policyname"]} | {r.get("operation")} | {r.get("roles")} | {r.get("condition")} | {r.get("check_condition")}')
