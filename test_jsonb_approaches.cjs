require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function tryDifferentApproaches() {
    const tenantId = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4';
    const mobile = '7058731515';

    console.log('=== APPROACH 1: textSearch on JSONB ===');
    try {
        const { data, error } = await supabase
            .from('complaints')
            .select('id, problem')
            .eq('tenant_id', tenantId)
            .textSearch('description_meta', mobile)
            .limit(3);
        console.log('Error:', error?.message || 'None');
        console.log('Results:', data?.length || 0, data);
    } catch (e) {
        console.log('Exception:', e.message);
    }

    console.log('\n=== APPROACH 2: Using contains (@>) ===');
    try {
        const { data, error } = await supabase
            .from('complaints')
            .select('id, problem')
            .eq('tenant_id', tenantId)
            .contains('description_meta', { mobile: mobile })
            .limit(3);
        console.log('Error:', error?.message || 'None');
        console.log('Results:', data?.length || 0, data);
    } catch (e) {
        console.log('Exception:', e.message);
    }

    console.log('\n=== APPROACH 3: Using like with >>  ===');
    try {
        const { data, error } = await supabase
            .from('complaints')
            .select('id, problem')
            .eq('tenant_id', tenantId)
            .like('description_meta->>mobile', `%${mobile}%`)
            .limit(3);
        console.log('Error:', error?.message || 'None');
        console.log('Results:', data?.length || 0, data);
    } catch (e) {
        console.log('Exception:', e.message);
    }

    console.log('\n=== APPROACH 4: Direct SQL via RPC or raw ===');
    // This would need a custom function, skip for now
}

tryDifferentApproaches();
