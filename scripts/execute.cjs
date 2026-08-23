const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const file = process.argv[2];
    if (!file) {
        console.error('Please specify a file to execute');
        process.exit(1);
    }
    const sql = fs.readFileSync(file, 'utf8');
    console.log(`Executing ${file}...`);
    
    // Split the SQL into individual statements if necessary, or just run it whole
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
    
    if (error) {
        console.error(`Error executing ${file}:`, error);
        process.exit(1);
    }
    console.log(`Successfully executed ${file}`);
    console.log(data);
}

run();
