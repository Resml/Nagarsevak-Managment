import csv
with open('migrations/live_policies.csv', 'r', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        if row['tablename'] == 'whatsapp_sessions':
            print(row['policyname'] + ' - ' + row['operation'] + ' - ' + row['roles'])
