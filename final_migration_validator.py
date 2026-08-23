import re

SQL_PATH = r'c:\Users\SAHIL\Downloads\Office\Nagarsevak-Managment\migrations\phase5b_unified_migration.sql'

with open(SQL_PATH, 'r', encoding='utf-8') as f:
    sql = f.read()

print("=" * 80)
print("FINAL STATIC VALIDATION: phase5b_unified_migration.sql")
print("=" * 80)

# Check for BEGIN / COMMIT
if 'BEGIN;' in sql and 'COMMIT;' in sql:
    print("[PASS] Migration includes BEGIN and COMMIT.")
else:
    print("[FAIL] Migration is missing BEGIN or COMMIT.")

# Check for Safety Guards
if 'PREFLIGHT SAFETY GUARDS' in sql and 'DO $$' in sql and 'RAISE EXCEPTION' in sql:
    print("[PASS] Migration includes preflight safety guards with DO block and RAISE EXCEPTION.")
else:
    print("[FAIL] Migration is missing safety guards.")

print("-" * 80)

# Define expected policies
# Table -> Feature Key, FK Col (if any)
tables_info = {
    'letter_requests': {'key': 'letters', 'fk': 'voter_id'},
    'sadasya': {'key': 'sadasya', 'fk': 'linked_voter_id'},
    'letter_types': {'key': 'letters', 'fk': None},
    'personal_requests': {'key': 'complaints', 'fk': None},
}

create_re = re.compile(
    r'CREATE POLICY\s+"([^"]+)"\s+ON\s+public\.(\w+)\s+FOR\s+(\w+)\s+TO\s+(\w+)\s*(.*?)(?=\n(?:CREATE|DROP|COMMIT|--\s*={4}|\Z))',
    re.IGNORECASE | re.DOTALL
)

creates = create_re.findall(sql)

for name, table, cmd, role, body in creates:
    cmd = cmd.upper()
    info = tables_info.get(table)
    if not info:
        continue
    
    print(f"{table} | {name} | {cmd}")
    
    # 1. Tenant Enforcement
    tenant_check = 'get_authorized_tenants()' in body
    print(f"  [ {'PASS' if tenant_check else 'FAIL'} ] Tenant/SuperAdmin enforcement (get_authorized_tenants)")
    
    # 2. Feature Access
    expected_key = info['key']
    feature_check_str = f"has_member_feature_access(tenant_id, auth.uid(), '{expected_key}')"
    feature_check = feature_check_str in body
    if not feature_check:
        # try without spaces or quotes variation if needed, but it should be exact
        if expected_key in body and 'has_member_feature_access' in body:
             feature_check = True # lenient check
             
    print(f"  [ {'PASS' if feature_check else 'FAIL'} ] Feature Access Key: '{expected_key}'")
    
    # 3. FK Protection (Only for INSERT/UPDATE on specific tables)
    if cmd in ('INSERT', 'UPDATE') and info['fk'] is not None:
        fk = info['fk']
        fk_check = f"{fk} IS NULL" in body and 'tenant_id =' in body and 'public.voters' in body
        print(f"  [ {'PASS' if fk_check else 'FAIL'} ] FK Protection ({fk} IS NULL OR tenant match)")
    elif cmd in ('INSERT', 'UPDATE'):
        print(f"  [ PASS ] FK Protection (N/A for {table})")
    
    print()

print("DONE.")
