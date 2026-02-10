require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchemeStructure() {
    const tenantId = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4';

    console.log('=== Fetching schemes to see structure ===\n');
    const { data, error } = await supabase
        .from('schemes')
        .select('*')
        .eq('tenant_id', tenantId)
        .limit(2);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Number of schemes:', data?.length || 0);
        if (data && data.length > 0) {
            console.log('\nSample scheme structure:');
            console.log(JSON.stringify(data[0], null, 2));
        }
    }
}

checkSchemeStructure();
