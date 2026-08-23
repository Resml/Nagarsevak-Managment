import csv
import json
with open('migrations/live_policies.csv', 'r', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        if row['tablename'] == 'staff':
            print(json.dumps({
                'name': row['policyname'],
                'cmd': row['operation'],
                'roles': row['roles'],
                'qual': row['condition'],
                'check': row['check_condition']
            }, indent=2))
