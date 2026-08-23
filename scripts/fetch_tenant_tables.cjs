const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: cols } = await supabase.rpc('execute_sql', { sql_query: "SELECT table_name FROM information_schema.columns WHERE column_name = 'tenant_id' AND table_schema = 'public';" });
    
    console.log(JSON.stringify(cols, null, 2));
}

run();
