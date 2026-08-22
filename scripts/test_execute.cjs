const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('Testing simple query...');
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: "SELECT 1;" });
    console.log(data, error);
}

run();
