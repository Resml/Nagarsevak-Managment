import json

with open('phase4_baseline_dump.json', 'r') as f:
    data = json.load(f)

def print_policies(table, cmd):
    print(f'=== {table.upper()} {cmd.upper()} ===')
    for p in data.get(table, []):
        if p['cmd'] == cmd:
            print(f"Policy: {p['policy']}")
            print(f"Roles: {p['roles']}")
            print(f"Qual: {p['qual']}")
            print(f"With Check: {p['with_check']}\n")

print_policies('complaints', 'INSERT')
print_policies('surveys', 'INSERT')
print_policies('survey_responses', 'INSERT')
print_policies('events', 'INSERT')
print_policies('event_rsvps', 'INSERT')
