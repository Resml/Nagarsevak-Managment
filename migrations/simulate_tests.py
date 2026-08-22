import csv

count = 0
print("--- TEST 17 ---")
with open('migrations/live_policies.csv', 'r', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        if 'public' in row['policyname'].lower():
            roles_str = row['roles'].strip('{}')
            roles_list = [r.strip() for r in roles_str.split(',')] if roles_str else []
            if 'anon' in roles_list or 'public' in roles_list:
                count += 1
                print(f"{row['tablename']} | {row['policyname']} | {row['roles']}")
print("Test 17 Total:", count)

print("\n--- TEST 18 ---")
count18 = 0
with open('migrations/live_policies.csv', 'r', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        if row['tablename'] == 'whatsapp_sessions':
            count18 += 1
            print(f"{row['tablename']} | {row['policyname']} | {row['roles']} | {row['operation']}")
print("Test 18 Total:", count18)
