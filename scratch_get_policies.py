import csv

tables_of_interest = [
    'events', 'survey_responses', 'non_voters', 'voters', 'ward_provisions', 
    'works', 'improvements', 'schemes', 'housing_societies', 'social_organizations', 
    'incoming_letters', 'work_trackers', 'surveys'
]

known_phase_5b_policies = [
    'Tenant Isolation Insert', 'Tenant Isolation Update', 
    'Users can insert election results for their tenant', 
    'Users can update election results for their tenant'
]

results = []
with open('migrations/live_policies.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row['tablename'] in tables_of_interest and row['operation'] in ('INSERT', 'UPDATE', 'ALL'):
            if row['policyname'] not in known_phase_5b_policies and not row['policyname'].startswith('Tenant Insert') and not row['policyname'].startswith('Tenant Update'):
                results.append(row)

for r in results:
    print(f"Table: {r['tablename']} | Policy: {r['policyname']} | Cmd: {r['operation']} | Roles: {r['roles']} | Qual: {r['condition']} | With_Check: {r['check_condition']}")
