const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    let sql = fs.readFileSync('migrations/phase4_stage3_rls_integration.sql', 'utf8');
    sql = sql.replace('BEGIN;', '').replace('COMMIT;', '');
    
    console.log('Executing phase4_stage3_rls_integration.sql via execute_sql...');
    const { error } = await supabase.rpc('execute_sql', { sql_query: sql });
    
    if (error) {
        console.error('Execution Failed:', error);
        process.exit(1);
    }
    console.log('Integration Migration Executed Successfully!');
    
    let verifySql = fs.readFileSync('migrations/phase4_stage3_verify.sql', 'utf8');
    verifySql = verifySql.replace('BEGIN;', '').replace('ROLLBACK;', '');
    
    console.log('Executing phase4_stage3_verify.sql...');
    const { data, error: vErr } = await supabase.rpc('execute_sql', { sql_query: verifySql });
    
    if (vErr) {
        console.error('Verification Failed:', vErr);
        process.exit(1);
    }
    console.log('Verification Success!');
}

run();
