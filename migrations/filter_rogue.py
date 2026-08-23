import json
import re

with open("phase5b_rbac_migration.sql", "r") as f:
    sql = f.read()

dropped_policies = re.findall(r"DROP POLICY IF EXISTS \"(.*?)\" ON public\.(.*?);", sql)
dropped_set = set((p[1], p[0]) for p in dropped_policies)

with open("rogue_policies.json", "r") as f:
    policies = json.load(f)

live_rogue = []
for p in policies:
    if (p['table'], p['policyname']) not in dropped_set:
        live_rogue.append(p)

print(f"Remaining live rogue policies: {len(live_rogue)}")
with open("live_rogue_filtered.json", "w") as f:
    json.dump(live_rogue, f, indent=2)
