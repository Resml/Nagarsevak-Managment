import csv
with open('migrations/live_policies.csv', 'r', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        if row['tablename'] in ['events', 'survey_responses'] and 'public' in row['policyname'].lower() and 'insert' in row['policyname'].lower():
            print(row['tablename'] + ' | ' + row['policyname'] + ' | check: ' + row['check_condition'])
