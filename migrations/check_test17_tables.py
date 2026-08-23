import csv
with open('migrations/live_policies.csv', 'r', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        if row['tablename'] in ['events', 'survey_responses']:
            print(row['tablename'] + ' | ' + row['policyname'] + ' | ' + row['roles'])
