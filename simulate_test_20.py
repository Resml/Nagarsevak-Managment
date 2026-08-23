import csv

v_count = 0
with open('migrations/live_policies.csv', 'r', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        if row['tablename'] == 'survey_responses':
            if row['policyname'] in ['Enable insert for authenticated users', 'Auth Survey Insert'] and row['operation'] == 'INSERT':
                v_count += 1
                
print(f"Test 20 count: {v_count}")
if v_count != 1:
    print("TEST 20 FAIL")
else:
    print("TEST 20 PASS")
