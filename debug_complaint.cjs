require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugComplaint() {
    console.log('--- Checking Recent Complaint ---\n');

    // Get the most recent complaint
    const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('tenant_id', 'bf4c7152-6006-41b5-9c7d-84c76ea67da4')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else if (data && data.length > 0) {
        console.log('Most recent complaint:');
        console.log(JSON.stringify(data[0], null, 2));

        console.log('\n--- Checking description_meta ---');
        if (data[0].description_meta) {
            try {
                const meta = JSON.parse(data[0].description_meta);
                console.log('Parsed meta:', meta);
            } catch (e) {
                console.log('Raw meta:', data[0].description_meta);
            }
        }
    } else {
        console.log('No complaints found');
    }
}

debugComplaint();
