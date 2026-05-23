const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log("Supabase URL:", supabaseUrl);
    try {
        const { data, error } = await supabase
            .from('opposition_karyakartas')
            .select('*')
            .limit(1);

        if (error) {
            console.error("❌ Error fetching from opposition_karyakartas:", error.message);
        } else {
            console.log("✅ Success! Sample record keys:", data.length > 0 ? Object.keys(data[0]) : "No records found in table yet.");
        }
    } catch (err) {
        console.error("❌ Unexpected error:", err);
    }
}

checkColumns();
