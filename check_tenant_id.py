with open('c:\\Users\\SAHIL\\Downloads\\Office\\Nagarsevak-Managment\\src\\types\\supabase.ts', 'r', encoding='utf-8') as f:
    content = f.read()

tables = ['gb_diary', 'housing_societies', 'letter_requests', 'letter_types', 'personal_requests', 'sadasya', 'social_organizations', 'surveys', 'visitors']
for t in tables:
    if f"{t}:" in content:
        block = content.split(f"{t}:")[1][:2000]
        if 'tenant_id:' in block:
            print(f"{t} HAS tenant_id")
        else:
            print(f"{t} NO tenant_id")
    else:
        print(f"{t} NOT FOUND")
