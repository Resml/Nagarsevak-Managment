import csv
import json

def analyze_policies():
    results = []
    tables = set()
    
    with open('migrations/live_policies.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            table = row['tablename']
            policy = row['policyname']
            cmd = row['operation']
            roles = row['roles']
            qual = str(row['condition'])
            check = str(row['check_condition'])
            tables.add(table)
            
            # Skip non-target tables if needed, but we should check all public tables
            
            # Check 1: true/empty qual/check for non-service roles
            if ('public' in roles or 'anon' in roles or 'authenticated' in roles):
                if qual == 'true' or check == 'true':
                    # some are legitimate like Anon Survey Insert or public visitors
                    # we must identify them
                    results.append({
                        'table': table,
                        'policy': policy,
                        'cmd': cmd,
                        'roles': roles,
                        'issue': 'Wide open (true)',
                        'qual': qual,
                        'check': check
                    })
                
                # Check 2: No tenant isolation
                elif 'tenant_id' not in qual and 'user_tenant_mapping' not in qual and 'tenant_id' not in check and 'user_tenant_mapping' not in check and qual != 'null' and check != 'null':
                    # Maybe it's a completely different table like users or something
                    results.append({
                        'table': table,
                        'policy': policy,
                        'cmd': cmd,
                        'roles': roles,
                        'issue': 'Lacks tenant isolation keywords',
                        'qual': qual,
                        'check': check
                    })
                    
    # Group by table to see duplicates
    with open('audit_findings.json', 'w') as out:
        json.dump(results, out, indent=2)
        
    print(f"Found {len(results)} potentially suspicious policies.")

analyze_policies()
