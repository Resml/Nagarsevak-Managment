import csv

with open(r'c:\Users\SAHIL\.gemini\antigravity-ide\brain\0a07aff7-4808-4938-95d6-7a8e4b4645ad\.user_uploaded\media_1787131215356.csv', 'r', encoding='utf-8') as f:
    for r in csv.DictReader(f):
        if r['tablename'] in ['gb_diary', 'housing_societies', 'social_organizations', 'survey_responses', 'surveys', 'visitors']:
            if "ins" in r['policyname'].lower() or "upd" in r['policyname'].lower() or "all" in r['policyname'].lower() or "auth survey" in r['policyname'].lower() or "public access" in r['policyname'].lower():
                print(f"{r['tablename']} | {r['policyname']} | {r['operation']} | {r['roles']} | Qual: {r['condition']} | Check: {r['check_condition']}")

