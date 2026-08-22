import csv

v_count = 0
with open('migrations/live_policies.csv', 'r', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        if row['tablename'] in ['gb_diary', 'housing_societies', 'letter_requests', 'letter_types', 'personal_requests', 'sadasya', 'social_organizations', 'surveys', 'visitors'] and row['operation'] in ['SELECT', 'DELETE']:
            if row['policyname'] in [
                'Tenant Isolation Select', 'Tenant Isolation Delete',
                'Tenant Select gb_diary', 'Tenant Delete gb_diary',
                'Tenant Select housing_societies', 'Tenant Delete housing_societies',
                'Unified Letter Select', 'Unified Letter Delete',
                'Unified Letter Types Select', 'Unified Letter Types Delete',
                'Unified Personal Requests Select', 'Unified Personal Requests Delete',
                'Unified Sadasya Select', 'Unified Sadasya Delete',
                'Tenant Select social_organizations', 'Tenant Delete social_organizations',
                'Tenant Select surveys', 'Tenant Delete surveys',
                'Tenant Select visitors', 'Tenant Delete visitors'
            ]:
                qual = str(row['condition'])
                if 'has_member_feature_access' in qual or 'user_tenant_mapping' in qual or 'tenant_id' in qual:
                    v_count += 1

print(f"Test 21 simulated count: {v_count}")
if v_count < 18:
    print("TEST 21 FAIL")
else:
    print("TEST 21 PASS")
