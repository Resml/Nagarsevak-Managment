import csv
with open(r'c:\Users\SAHIL\Downloads\Office\Nagarsevak-Managment\migrations\live_policies.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row['tablename'] in ('incoming_letters', 'event_rsvps', 'message_logs', 'staff', 'voter_applications', 'work_trackers'):
            if row['operation'] in ('INSERT', 'UPDATE', 'ALL'):
                print(f"{row['tablename']} | {row['policyname']} | {row['operation']} | {row['roles']} | {row['condition']} | {row['check_condition']}")
