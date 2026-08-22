import csv
count = 0
with open('migrations/live_policies.csv', 'r') as f:
    for row in csv.DictReader(f):
        if 'has_member_feature_access' in str(row['condition']) or 'has_member_feature_access' in str(row['check_condition']):
            print("Found:", row['tablename'], row['policyname'])
            count += 1
print("Total found:", count)
