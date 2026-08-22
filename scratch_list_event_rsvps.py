import csv
with open(r'c:\Users\SAHIL\Downloads\Office\Nagarsevak-Managment\migrations\live_policies.csv', 'r', encoding='utf-8') as f:
    for r in csv.DictReader(f):
        if r['tablename'] == 'event_rsvps':
            print(f"{r['policyname']} | {r['operation']} | {r['roles']}")
