import csv
import json

from generate_phase5b import tables

known_phase_5b_policies = [
    'Tenant Isolation Insert', 'Tenant Isolation Update', 
    'Users can insert election results for their tenant', 
    'Users can update election results for their tenant'
]

results = []
with open('migrations/live_policies.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row['tablename'] in tables.keys() and row['operation'] in ('INSERT', 'UPDATE', 'ALL'):
            if row['policyname'] not in known_phase_5b_policies and not row['policyname'].startswith('Tenant Insert') and not row['policyname'].startswith('Tenant Update') and not row['policyname'].startswith('Tenant Isolation Insert Staff') and not row['policyname'].startswith('Tenant Isolation Update Staff') and not row['policyname'].startswith('Auth Complaint') and not row['policyname'].startswith('Auth VA') and row['policyname'] != 'Enable insert access for tenant users':
                results.append(row)

for r in results:
    print(f"{r['tablename']}|{r['policyname']}|{r['operation']}|{r['roles']}|{r['condition']}|{r['check_condition']}")
