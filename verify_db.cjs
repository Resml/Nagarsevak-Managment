const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../../Downloads/Office/Nagarsevak-Managment/.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('election_results').select('ward_name, candidate_votes').limit(1);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Success. Keys in candidate_votes:");
        if (data && data.length > 0) {
            console.log(Object.keys(data[0].candidate_votes));
        }
    }
}
check();
