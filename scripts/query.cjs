const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: cols } = await supabase.rpc('execute_sql', { sql_query: "SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public';" });
    
    require('fs').writeFileSync('migrations/live_policies_fresh.json', JSON.stringify(cols, null, 2));
    console.log("Written to live_policies_fresh.json");
}

run();
