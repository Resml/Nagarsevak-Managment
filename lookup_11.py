import csv

target_policies = [
    "Allow all for everyone_ins", "Allow all for everyone_upd",
    "Enable all access for authenticated users on housing_societ_ins", "Enable all access for authenticated users on housing_societ_upd",
    "Enable all access for authenticated users on social_organiz_ins", "Enable all access for authenticated users on social_organiz_upd",
    "Auth Survey Insert",
    "Enable all access for authenticated users_ins", "Enable all access for authenticated users_upd",
    "Public Access Visitors_ins", "Public Access Visitors_upd"
]

with open(r'c:\Users\SAHIL\Downloads\Office\Nagarsevak-Managment\migrations\live_policies.csv', 'r', encoding='utf-8') as f:
    for r in csv.DictReader(f):
        if r['policyname'] in target_policies:
            print(f"{r['tablename']} | {r['policyname']} | {r['operation']} | {r['roles']} | {r['condition']} | {r['check_condition']}")

