import csv
import re

tables = ['complaints', 'voter_applications']

print("--- PHASE 4 BASELINE ---")
with open('migrations/live_policies.csv', 'r', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        if row['tablename'] in tables and row['policyname'] in ['Tenant Isolation Insert', 'Tenant Isolation Select']:
            print(f"Table: {row['tablename']} | Policy: {row['policyname']} | Cmd: {row['operation']} | Roles: {row['roles']}")
            print(f"Qual: {row['condition']}")
            print(f"With Check: {row['check_condition']}")
            print("")

print("--- PHASE 5B MIGRATION (LIVE DATABASE FOR INSERT) ---")
with open('migrations/phase5b_rbac_migration.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

# Simple extraction of the created policies for complaints and voter_applications
for table in tables:
    pattern = r'CREATE POLICY "Tenant Isolation Insert" ON public\.' + table + r'.*?WITH CHECK \((.*?)\);'
    match = re.search(pattern, sql, re.DOTALL)
    if match:
        print(f"Table: {table} | Policy: Tenant Isolation Insert | Cmd: INSERT | Roles: public")
        print("Qual: null")
        print(f"With Check: {match.group(1).strip()}")
        print("")
