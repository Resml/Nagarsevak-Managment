const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const sql = `
        SELECT table_name, column_name, data_type, column_default, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name IN ('plan', 'category') 
        ORDER BY table_name, column_name;
    `;
    const { data: cols, error } = await supabase.rpc('execute_sql', { sql_query: sql });
    if (error) {
        console.error(error);
        return;
    }
    console.log(JSON.stringify(cols, null, 2));
}

run();
