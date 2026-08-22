import csv

with open('migrations/live_policies.csv', 'r', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        if 'anon' in row['roles'] or 'public' in row['policyname'].lower():
            print(row['tablename'] + ' | ' + row['policyname'] + ' | ' + row['roles'] + ' | ' + row['operation'])
