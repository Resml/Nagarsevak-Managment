require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumnType() {
    // Get table schema
    const { data, error } = await supabase
        .rpc('exec_sql', {
            query: `
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'complaints' 
                AND column_name = 'description_meta';
            `
        });

    if (error) {
        console.log('RPC not available, trying direct query...');

        // Alternative: just try both text and JSONB search
        const tenantId = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4';
        const mobile = '7058731515';

        console.log('\n=== Testing TEXT search (ilike on raw column) ===');
        const { data: textSearch, error: err1 } = await supabase
            .from('complaints')
            .select('id, problem')
            .eq('tenant_id', tenantId)
            .ilike('description_meta', `%${mobile}%`)
            .limit(3);

        console.log('Error:', err1?.message || 'None');
        console.log('Results:', textSearch?.length || 0);

    } else {
        console.log('Schema:', data);
    }
}

checkColumnType();
