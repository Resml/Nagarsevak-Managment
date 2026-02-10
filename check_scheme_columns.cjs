require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchemeColumns() {
    console.log('--- Checking Scheme Table Structure ---\n');

    const { data, error } = await supabase
        .from('schemes')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else if (data && data.length > 0) {
        console.log('Sample scheme record:');
        console.log(JSON.stringify(data[0], null, 2));
        console.log('\nColumn names:', Object.keys(data[0]));
    } else {
        console.log('No schemes found');
    }
}

checkSchemeColumns();
