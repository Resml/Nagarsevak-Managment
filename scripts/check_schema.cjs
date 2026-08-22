const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data } = await supabase.rpc('execute_sql', { sql_query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'gb_diary';" });
    console.log('gb_diary:', JSON.stringify(data));
}

run();
