require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testComplaintSearch() {
    const tenantId = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4';
    const mobile = '7058731515';
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);

    console.log('Testing complaint search for mobile:', cleanMobile);
    console.log('---\n');

    // Test 1: Check if complaint exists
    console.log('TEST 1: Check if complaint #20 exists');
    const { data: complaint, error: err1 } = await supabase
        .from('complaints')
        .select('id, description_meta')
        .eq('id', 20)
        .eq('tenant_id', tenantId)
        .single();

    if (err1) {
        console.error('Error:', err1);
    } else {
        console.log('Complaint found:', JSON.stringify(complaint, null, 2));
        if (complaint.description_meta) {
            console.log('Mobile in meta:', complaint.description_meta.mobile);
        }
    }

    console.log('\n---\n');

    // Test 2: Try the filter query
    console.log('TEST 2: Using filter with description_meta->>mobile');
    const { data: filtered, error: err2 } = await supabase
        .from('complaints')
        .select('id, problem, description_meta')
        .eq('tenant_id', tenantId)
        .filter('description_meta->>mobile', 'ilike', `%${cleanMobile}%`)
        .limit(5);

    if (err2) {
        console.error('Error:', err2);
    } else {
        console.log('Results:', filtered?.length || 0);
        if (filtered && filtered.length > 0) {
            console.log(JSON.stringify(filtered, null, 2));
        }
    }

    console.log('\n---\n');

    // Test 3: Try exact match
    console.log('TEST 3: Using eq instead of ilike');
    const { data: exact, error: err3 } = await supabase
        .from('complaints')
        .select('id, problem, description_meta')
        .eq('tenant_id', tenantId)
        .eq('description_meta->>mobile', cleanMobile)
        .limit(5);

    if (err3) {
        console.error('Error:', err3);
    } else {
        console.log('Results:', exact?.length || 0);
        if (exact && exact.length > 0) {
            console.log(JSON.stringify(exact, null, 2));
        }
    }
}

testComplaintSearch();
