require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

async function checkRpc() {
    const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Try to run a simple SELECT 1
    const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql_query: 'SELECT 1;' });
    if (error) {
        console.error("RPC execute_sql error:", error.message);
    } else {
        console.log("RPC execute_sql exists. Result:", data);
    }
}
checkRpc();
