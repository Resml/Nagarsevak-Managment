const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runQuery(sql) {
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
    if (error) throw error;
    return data;
}

async function verify() {
    console.log("--- Starting Phase 5B Verification ---");
    let allPassed = true;

    async function assertCount(query, expectedCount, testName) {
        try {
            const data = await runQuery(query);
            // execute_sql usually returns an array of objects
            const count = parseInt(data[0].count, 10);
            if (count === expectedCount || (expectedCount === '>' && count > 0)) {
                console.log(`✅ ${testName} (Count: ${count})`);
            } else {
                console.error(`❌ ${testName} (Expected: ${expectedCount}, Got: ${count})`);
                allPassed = false;
            }
        } catch (e) {
            console.error(`❌ ${testName} - Query Failed: ${e.message}`);
            allPassed = false;
        }
    }
    
    async function getCount(query) {
        const data = await runQuery(query);
        return parseInt(data[0].count, 10);
    }

    // TEST 1: Expected 112 Phase 5B policies exist
    await assertCount("SELECT count(*) FROM pg_policies WHERE policyname IN ('Allow select based on tenant_id', 'Allow insert based on tenant_id', 'Allow update based on tenant_id', 'Allow delete based on tenant_id')", 112, "TEST 1: 112 Phase 5B policies exist");

    // TEST 2: has_member_feature_access exists
    await assertCount("SELECT count(*) FROM pg_proc WHERE proname = 'has_member_feature_access'", 1, "TEST 2: has_member_feature_access exists");

    // TEST 3: staff permission escalation trigger exists
    await assertCount("SELECT count(*) FROM pg_trigger WHERE tgname = 'trg_prevent_staff_permission_escalation'", 1, "TEST 3: trg_prevent_staff_permission_escalation trigger exists");

    // TEST 4: staff entitlement trigger exists
    await assertCount("SELECT count(*) FROM pg_trigger WHERE tgname = 'trg_validate_staff_permissions'", 1, "TEST 4: trg_validate_staff_permissions trigger exists");

    // TEST 5: staff INSERT restricted to admin/super_admin
    await assertCount("SELECT count(*) FROM pg_policies WHERE tablename = 'staff' AND policyname = 'Allow insert based on tenant_id' AND with_check LIKE '%admin%'", 1, "TEST 5: Staff INSERT policy contains admin check");

    // TEST 6: staff DELETE restricted to admin/super_admin
    await assertCount("SELECT count(*) FROM pg_policies WHERE tablename = 'staff' AND policyname = 'Allow delete based on tenant_id' AND qual LIKE '%admin%'", 1, "TEST 6: Staff DELETE policy contains admin check");

    // TEST 7: SECURITY DEFINER functions have fixed search_path
    // Check if proconfig contains search_path for these functions
    const searchPathQuery = `
        SELECT count(*) FROM pg_proc 
        WHERE proname IN ('has_member_feature_access', 'validate_staff_permissions_entitlement', 'prevent_staff_permission_escalation')
        AND proconfig @> ARRAY['search_path=public']::text[]
    `;
    await assertCount(searchPathQuery, 3, "TEST 7: SECURITY DEFINER functions have fixed search_path=public");

    // TEST 8: PUBLIC EXECUTE is revoked
    // If a function is executable by public, proacl usually contains =X/ (or is null meaning default which includes public)
    // Actually, checking explicit revokes via pg_proc.proacl is tricky.
    // Instead of querying pg_proc.proacl directly, we can check has_function_privilege for 'public'
    const publicPrivQuery = `
        SELECT count(*) FROM pg_proc 
        WHERE proname IN ('has_member_feature_access', 'validate_staff_permissions_entitlement', 'prevent_staff_permission_escalation')
        AND has_function_privilege('public', oid, 'execute')
    `;
    await assertCount(publicPrivQuery, 0, "TEST 8: PUBLIC EXECUTE is revoked for all 3 functions");

    // TEST 9: Phase 3B anonymous survey policies remain intact
    await assertCount("SELECT count(*) FROM pg_policies WHERE tablename = 'surveys' AND qual LIKE '%Active%'", '>', "TEST 9: Phase 3B anonymous survey select intact");

    // TEST 10: whatsapp_sessions remains untouched
    await assertCount("SELECT count(*) FROM pg_policies WHERE tablename = 'whatsapp_sessions'", 0, "TEST 10: whatsapp_sessions RLS has 0 public policies (remains untouched)");

    // TEST 11: cross-tenant tenant isolation remains intact
    // We expect 112 policies to contain utm.tenant_id = tenant_id logic
    await assertCount("SELECT count(*) FROM pg_policies WHERE policyname LIKE 'Allow % based on tenant_id' AND (qual LIKE '%utm.tenant_id = tenant_id%' OR with_check LIKE '%utm.tenant_id = tenant_id%')", 112, "TEST 11: Cross-tenant isolation logic intact in all 112 policies");

    // TEST 12: has_feature_access remains intact
    await assertCount("SELECT count(*) FROM pg_proc WHERE proname = 'has_feature_access'", 1, "TEST 12: has_feature_access function remains intact");

    // TEST 13: Storage policies remain untouched
    await assertCount("SELECT count(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'", '>', "TEST 13: Storage policies remain untouched");

    if (allPassed) {
        console.log("✅ ALL VERIFICATIONS PASSED SUCCESSFULLY.");
    } else {
        console.log("❌ SOME VERIFICATIONS FAILED.");
    }
}

verify();
