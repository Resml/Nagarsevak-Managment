import csv
import re

with open('migrations/phase5b_rbac_migration.sql', 'r') as f:
    sql = f.read()

dropped_policies = re.findall(r'DROP POLICY IF EXISTS "(.*?)" ON public\.(.*?);', sql)
dropped_set = set((p[1], p[0]) for p in dropped_policies)

tables = [
    'ai_history', 'complaints', 'election_results', 'event_rsvps', 'events',
    'gallery', 'gb_diary', 'housing_societies', 'improvements', 'incoming_letters',
    'letter_requests', 'letter_types', 'message_logs', 'non_voters', 'personal_requests',
    'sadasya', 'schemes', 'social_organizations', 'survey_responses', 'surveys',
    'tasks', 'visitors', 'voter_applications', 'voters', 'ward_provisions',
    'work_trackers', 'works', 'staff'
]

rogue = []
with open('migrations/live_policies.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        t = row['tablename']
        pn = row['policyname']
        cmd = row['operation']
        if t in tables and cmd in ('INSERT', 'UPDATE'):
            is_excluded = (
                pn in ('Tenant Isolation Insert', 'Tenant Isolation Update',
                       'Users can insert election results for their tenant',
                       'Users can update election results for their tenant')
                or (t == 'survey_responses' and pn in ('Enable insert for authenticated users', 'Enable insert for public'))
            )
            if not is_excluded:
                if (t, pn) not in dropped_set:
                    rogue.append((t, pn, cmd, row['roles'], row['condition'] or '', row['check_condition'] or ''))

print(f'Found {len(rogue)} rogue policies:')
for r in rogue:
    print(r[0], '|', r[1], '|', r[2], '|', r[3])
