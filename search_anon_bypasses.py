import csv
import json

found = []
with open('migrations/live_policies.csv', 'r') as f:
    for row in csv.DictReader(f):
        if row['operation'] in ('INSERT', 'UPDATE') and row['policyname'].startswith('Tenant Isolation'):
            qual = str(row['condition'])
            check = str(row['check_condition'])
            if "auth.role() = 'anon'" in qual or "auth.role() = 'anon'" in check:
                if row['tablename'] not in ('complaints', 'voter_applications'):
                    found.append({
                        'schemaname': row['schemaname'],
                        'tablename': row['tablename'],
                        'policyname': row['policyname'],
                        'cmd': row['operation'],
                        'roles': row['roles'],
                        'qual': qual,
                        'with_check': check
                    })

print(json.dumps(found, indent=2))
