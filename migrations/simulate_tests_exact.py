import csv

def run_test17():
    print("TEST 17")
    count = 0
    found = []
    missed = []
    with open('migrations/live_policies.csv', 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            policyname = row['policyname']
            roles_str = row['roles'].strip('{}')
            roles_list = [r.strip() for r in roles_str.split(',')] if roles_str else []
            
            is_public_in_name = 'public' in policyname.lower()
            has_role = 'anon' in roles_list or 'public' in roles_list
            
            if is_public_in_name and has_role:
                count += 1
                found.append(f"{row['tablename']} | {policyname} | {row['roles']}")
            else:
                # Is this a Phase 3B anon/public policy that we missed because it doesn't have 'public' in the name?
                if ('anon' in roles_list or 'public' in roles_list) and not policyname.startswith('Tenant Isolation') and not policyname.startswith('Users can '):
                    missed.append(f"{row['tablename']} | {policyname} | {row['roles']}")
                    
    print("- Current actual result:", count)
    print("- Expected baseline: 25 (Total Phase 3B standalone policies)")
    print("Found (Sees):")
    for f in found: print(f)
    print("Missed (Does NOT see):")
    for m in missed: print(m)


def run_test18():
    print("\nTEST 18")
    count = 0
    with open('migrations/live_policies.csv', 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            if row['tablename'] == 'whatsapp_sessions':
                count += 1
                print(f"Row: {row['policyname']} | {row['operation']} | {row['roles']}")
    print("- Current actual result:", count)

run_test17()
run_test18()
