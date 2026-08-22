import csv

with open('migrations/live_policies.csv', 'r', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        t = row['tablename']
        if t in ['complaints', 'voter_applications', 'surveys', 'survey_responses', 'events', 'event_rsvps']:
            if 'anon' in row['roles'] or 'public' in row['policyname'].lower() or 'anon' in row['condition'] or 'anon' in row['check_condition']:
                print(t + ' | ' + row['policyname'] + ' | ' + row['roles'] + ' | qual: ' + row['condition'] + ' | check: ' + row['check_condition'])
