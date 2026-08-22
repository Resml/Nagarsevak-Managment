import csv

def generate_classification_table():
    target_policies = ["Tenant Isolation Insert", "Tenant Isolation Update", 
                       "Users can insert election results for their tenant", 
                       "Users can update election results for their tenant"]
    
    markdown = "# Phase 4 to Phase 5B Policy Audit (Read-Only)\n\n"
    
    # Identify Standalone Anon Policies
    standalone_anon = {}
    with open('migrations/live_policies.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if 'anon' in row['roles'] or 'public' in row['roles']:
                if row['policyname'] not in target_policies:
                    if row['tablename'] not in standalone_anon:
                        standalone_anon[row['tablename']] = set()
                    standalone_anon[row['tablename']].add(row['policyname'])
    
    markdown += "## 1. Complete Phase 4 -> Phase 5B Policy Classification\n\n"
    markdown += "| Table | Operation | Phase 4 Target Policy | Original Roles | Standalone Anon Exists? | Inline Anon? | Inline Service Role? | Classification |\n"
    markdown += "|---|---|---|---|---|---|---|---|\n"
    
    with open('migrations/live_policies.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            table = row['tablename']
            policy = row['policyname']
            
            if policy in target_policies:
                operation = row['operation']
                qual = row['condition']
                check = row['check_condition']
                
                has_anon = 'anon' in str(qual) or 'anon' in str(check)
                has_service = 'service_role' in str(qual) or 'service_role' in str(check)
                has_standalone = table in standalone_anon
                
                if has_standalone:
                    classification = "Mixed public/authenticated (Standalone separation)"
                elif has_anon:
                    classification = "Mixed public/authenticated (Inline bypass)"
                else:
                    classification = "Strictly Authenticated (Member-only)"
                
                markdown += f"| {table} | {operation} | {policy} | `{row['roles']}` | {'Yes' if has_standalone else 'No'} | {'Yes' if has_anon else 'No'} | {'Yes' if has_service else 'No'} | {classification} |\n"
                
    markdown += "\n---\n"
    return markdown

def main():
    with open('phase4_comprehensive_audit.md', 'w') as f:
        f.write(generate_classification_table())
        
    print("Generated phase4_comprehensive_audit.md")

if __name__ == '__main__':
    main()
