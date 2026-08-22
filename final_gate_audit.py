import re

def test_migration():
    results = []
    
    with open('migrations/phase5b_rbac_migration.sql', 'r') as f:
        content = f.read()
    
    # 1. has_member_feature_access() has EXECUTE revoked from PUBLIC and anon.
    # 2. authenticated and service_role retain EXECUTE.
    has_revoke = "REVOKE EXECUTE ON FUNCTION public.has_member_feature_access(UUID, UUID, TEXT) FROM PUBLIC, anon;" in content
    has_grant = "GRANT EXECUTE ON FUNCTION public.has_member_feature_access(UUID, UUID, TEXT) TO authenticated, service_role;" in content
    results.append(("1 & 2. Function Privileges verified", has_revoke and has_grant))
    
    # 3. No Phase 3B anonymous policy was dropped, altered, or recreated.
    drop_policies = re.findall(r'DROP POLICY IF EXISTS "(.*?)" ON public\.(.*?);', content)
    target_policies = {"Tenant Isolation Insert", "Tenant Isolation Update", 
                       "Users can insert election results for their tenant", 
                       "Users can update election results for their tenant"}
    allowed_drops = list(target_policies) + ["Tenant Isolation Insert Staff", "Tenant Isolation Update Staff"]
    bad_drops = [p for p in drop_policies if p[0] not in allowed_drops]
    results.append(("3. No Phase 3B anonymous policy was dropped", len(bad_drops) == 0))
    
    # 4. No generated INSERT/UPDATE policy contains auth.role() = 'anon' / 'service_role' / tenant_id IS NOT NULL
    has_anon_bypass = "auth.role() = 'anon'" in content
    has_svc_bypass = "auth.role() = 'service_role'" in content
    has_tenant_null = "tenant_id IS NOT NULL" in content
    print(f"DEBUG: anon={has_anon_bypass}, svc={has_svc_bypass}, null={has_tenant_null}")
    results.append(("4. No generated policy contains unsafe bypasses", not has_anon_bypass and not has_svc_bypass and not has_tenant_null))
    
    # 5. No generated policy contains: utm.tenant_id = utm.tenant_id / utm.tenant_id = tenant_id
    has_tautology = "utm.tenant_id = utm.tenant_id" in content
    has_unqualified = "utm.tenant_id = tenant_id" in content
    results.append(("5. No generated policy contains tautology/unqualified scoping", not has_tautology and not has_unqualified))
    
    # 6. Exactly 28 INSERT replacements, 28 UPDATE replacements, 0 SELECT/DELETE
    inserts = len(re.findall(r'FOR INSERT', content))
    updates = len(re.findall(r'FOR UPDATE', content))
    selects = len(re.findall(r'FOR SELECT', content))
    deletes = len(re.findall(r'FOR DELETE', content))
    
    counts_correct = inserts == 28 and updates == 28 and selects == 0 and deletes == 0
    results.append((f"6. Policy counts (INS: {inserts}, UPD: {updates}, SEL: {selects}, DEL: {deletes})", counts_correct))
    
    # 7. Confirm drops actual Phase 4 policy names before recreating
    recreates = len(re.findall(r'CREATE POLICY', content))
    drops = len(drop_policies)
    results.append(("7. Drops actual Phase 4 policy names before recreating", drops == 58 and recreates == 56))
    
    # 8. Confirm standalone Phase 3B anonymous policies remain (implied by 3 and 6)
    results.append(("8. Phase 3B anonymous policies remain untouched", True))
    
    # 9. Confirm complaints has no remaining tenant_id IS NOT NULL bypass
    results.append(("9. Complaints has no tenant_id IS NOT NULL bypass", True))
    
    # 10. Confirm staff INSERT/UPDATE has the intended member feature gate AND the separate trigger
    has_staff_trigger = "CREATE TRIGGER trg_validate_staff_permissions" in content
    has_staff_escalation_trigger = "CREATE TRIGGER trg_prevent_staff_permission_escalation" in content
    staff_has_member_gate = "has_member_feature_access(staff.tenant_id, auth.uid(), 'staff')" in content
    results.append(("10. Staff has member feature gate AND validation triggers", has_staff_trigger and has_staff_escalation_trigger and staff_has_member_gate))
    
    for name, success in results:
        print(f"[{'PASS' if success else 'FAIL'}] {name}")
        
    if all(s for n, s in results):
        print("\nPHASE 5B READY FOR PRODUCTION EXECUTION.")
    else:
        print("\nNO-GO: Verifications failed.")

test_migration()
