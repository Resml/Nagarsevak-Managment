require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function exploreTables() {
    console.log('--- Exploring Database Tables ---\n');

    const tablesToCheck = [
        'schemes',
        'scheme_beneficiaries',
        'voters',
        'events',
        'event_rsvps',
        'works',
        'improvements',
        'ward_problems',
        'complaints',
        'tasks'
    ];

    for (const table of tablesToCheck) {
        try {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`❌ Table '${table}': ${error.message}`);
            } else {
                console.log(`✅ Table '${table}': ${count} rows`);
            }
        } catch (err) {
            console.log(`❌ Table '${table}': Error - ${err.message}`);
        }
    }
}

exploreTables();
