import re

# The new unified policies
new_policies = [
    {'tablename': 'letter_requests', 'policyname': 'Unified Letter Insert', 'cmd': 'INSERT', 'qual': '', 'with_check': "tenant_id IN (SELECT public.get_authorized_tenants()) AND public.has_member_feature_access(tenant_id, auth.uid(), 'letters')"},
    {'tablename': 'letter_requests', 'policyname': 'Unified Letter Update', 'cmd': 'UPDATE', 'qual': "tenant_id IN (SELECT public.get_authorized_tenants()) AND public.has_member_feature_access(tenant_id, auth.uid(), 'letters')", 'with_check': "tenant_id IN (SELECT public.get_authorized_tenants()) AND public.has_member_feature_access(tenant_id, auth.uid(), 'letters')"},
    
    {'tablename': 'sadasya', 'policyname': 'Unified Sadasya Insert', 'cmd': 'INSERT', 'qual': '', 'with_check': "tenant_id IN (SELECT public.get_authorized_tenants()) AND public.has_member_feature_access(tenant_id, auth.uid(), 'sadasya')"},
    {'tablename': 'sadasya', 'policyname': 'Unified Sadasya Update', 'cmd': 'UPDATE', 'qual': "tenant_id IN (SELECT public.get_authorized_tenants()) AND public.has_member_feature_access(tenant_id, auth.uid(), 'sadasya')", 'with_check': "tenant_id IN (SELECT public.get_authorized_tenants()) AND public.has_member_feature_access(tenant_id, auth.uid(), 'sadasya')"},
    
    {'tablename': 'letter_types', 'policyname': 'Unified Letter Types Insert', 'cmd': 'INSERT', 'qual': '', 'with_check': "tenant_id IN (SELECT public.get_authorized_tenants()) AND public.has_member_feature_access(tenant_id, auth.uid(), 'letters')"},
    {'tablename': 'letter_types', 'policyname': 'Unified Letter Types Update', 'cmd': 'UPDATE', 'qual': "tenant_id IN (SELECT public.get_authorized_tenants()) AND public.has_member_feature_access(tenant_id, auth.uid(), 'letters')", 'with_check': "tenant_id IN (SELECT public.get_authorized_tenants()) AND public.has_member_feature_access(tenant_id, auth.uid(), 'letters')"},
    
    {'tablename': 'personal_requests', 'policyname': 'Unified Personal Requests Insert', 'cmd': 'INSERT', 'qual': '', 'with_check': "tenant_id IN (SELECT public.get_authorized_tenants()) AND public.has_member_feature_access(tenant_id, auth.uid(), 'complaints')"},
    {'tablename': 'personal_requests', 'policyname': 'Unified Personal Requests Update', 'cmd': 'UPDATE', 'qual': "tenant_id IN (SELECT public.get_authorized_tenants()) AND public.has_member_feature_access(tenant_id, auth.uid(), 'complaints')", 'with_check': "tenant_id IN (SELECT public.get_authorized_tenants()) AND public.has_member_feature_access(tenant_id, auth.uid(), 'complaints')"},
]

pass_count = 0
for r in new_policies:
    passed = False
    
    if r['cmd'] == 'INSERT':
        # Simulated Test 9 INSERT check
        if r['policyname'].startswith('Unified ') and r['policyname'].endswith(' Insert'):
            wc = r['with_check']
            if ('user_tenant_mapping' in wc or 'get_authorized_tenants' in wc) and 'tenant_id' in wc and 'has_member_feature_access' in wc:
                passed = True
                
    elif r['cmd'] == 'UPDATE':
        # Simulated Test 9 UPDATE check
        if r['policyname'].startswith('Unified ') and r['policyname'].endswith(' Update'):
            q = r['qual']
            if ('user_tenant_mapping' in q or 'get_authorized_tenants' in q) and 'tenant_id' in q and 'has_member_feature_access' in q:
                passed = True
                
    if passed:
        pass_count += 1
        print(f"[PASS] {r['cmd']} {r['policyname']} passed the new Test 9 logic")
    else:
        print(f"[FAIL] {r['cmd']} {r['policyname']} failed")

if pass_count == 8:
    print("\nSTATIC VALIDATION OVERALL RESULT: PASS")
    print("The 8 Unified policies successfully satisfy the updated Test 9 requirements.")
else:
    print("\nSTATIC VALIDATION OVERALL RESULT: FAIL")
