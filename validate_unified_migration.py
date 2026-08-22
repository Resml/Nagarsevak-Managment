import csv, re

CSV_PATH = r'C:\Users\SAHIL\.gemini\antigravity-ide\brain\0a07aff7-4808-4938-95d6-7a8e4b4645ad\.user_uploaded\media_1787131215356.csv'
SQL_PATH = r'c:\Users\SAHIL\Downloads\Office\Nagarsevak-Managment\migrations\phase5b_unified_migration.sql'

with open(CSV_PATH, 'r', encoding='utf-8') as f:
    live = list(csv.DictReader(f))

live_lookup = {(r['tablename'], r['policyname']): r for r in live}

with open(SQL_PATH, 'r', encoding='utf-8') as f:
    sql = f.read()

drop_re = re.compile(
    r'DROP POLICY IF EXISTS\s+"([^"]+)"\s+ON\s+public\.(\w+);',
    re.IGNORECASE
)
drops = drop_re.findall(sql)

create_re = re.compile(
    r'CREATE POLICY\s+"([^"]+)"\s+ON\s+public\.(\w+)\s+FOR\s+(\w+)\s+TO\s+(\w+)(.*?)(?=\n(?:CREATE|DROP|COMMIT|--\s*={4}|\Z))',
    re.IGNORECASE | re.DOTALL
)
creates = create_re.findall(sql)

print("=" * 80)
print("VALIDATOR: Phase 5B Unified SELECT/DELETE Replacement")
print("=" * 80)

expected_unified = {
    ('letter_requests', 'Unified Letter Select', 'SELECT'),
    ('letter_requests', 'Unified Letter Delete', 'DELETE'),
    ('letter_requests', 'Unified Letter Insert', 'INSERT'),
    ('letter_requests', 'Unified Letter Update', 'UPDATE'),
    ('sadasya', 'Unified Sadasya Select', 'SELECT'),
    ('sadasya', 'Unified Sadasya Delete', 'DELETE'),
    ('sadasya', 'Unified Sadasya Insert', 'INSERT'),
    ('sadasya', 'Unified Sadasya Update', 'UPDATE'),
    ('letter_types', 'Unified Letter Types Select', 'SELECT'),
    ('letter_types', 'Unified Letter Types Delete', 'DELETE'),
    ('personal_requests', 'Unified Personal Requests Select', 'SELECT'),
    ('personal_requests', 'Unified Personal Requests Delete', 'DELETE'),
}
found_unified = set()

for name, table, cmd, role, body in creates:
    key = (table, name, cmd.upper())
    if key in expected_unified:
        found_unified.add(key)
    
    print(f"\nCREATE: {table} | {name} | {cmd.upper()}")
    
    if cmd.upper() in ('SELECT', 'DELETE'):
        has_feature = 'has_member_feature_access' in body
        print(f"  Enforces feature access: {'PASS' if has_feature else 'FAIL'}")

missing = expected_unified - found_unified
if missing:
    print(f"\nMISSING expected policies: {missing}")
else:
    print("\nALL expected Unified policies are created in the migration script.")

print("\nDONE.")
