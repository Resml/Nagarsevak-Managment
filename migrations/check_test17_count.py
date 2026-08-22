import csv
count = 0
with open('migrations/live_policies.csv', 'r', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        if 'public' in row['policyname'] and ('anon' in row['roles'] or 'public' in row['roles']):
            count += 1
print("Count is:", count)
