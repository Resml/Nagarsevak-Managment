const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const query = `
        SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check 
        FROM pg_policies 
        WHERE tablename IN (
            'area_problems', 'opposition_karyakartas', 'voters', 'incoming_letters', 
            'events', 'schemes', 'improvements', 'works', 'ward_provisions', 'non_voters', 
            'ai_history', 'gallery', 'admin_billing', 'admin_support_tickets', 
            'admin_updates', 'app_settings', 'security_audit_logs', 'tenants'
        )
        AND schemaname = 'public'
        ORDER BY tablename, policyname;
    `;
    const { data: policiesData, error: policiesError } = await supabase.rpc('execute_sql_query', { query_text: query });
    if (policiesError) {
        console.error('Error fetching policies:', policiesError);
    } else {
        console.log("=== pg_policies ===");
        console.log(JSON.stringify(policiesData, null, 2));
    }

    const classQuery = `
        SELECT relname, relrowsecurity 
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname IN ('admin_billing', 'admin_support_tickets', 'admin_updates', 'app_settings')
          AND n.nspname = 'public';
    `;
    const { data: classData, error: classError } = await supabase.rpc('execute_sql_query', { query_text: classQuery });
    if (classError) {
        console.error('Error fetching pg_class:', classError);
    } else {
        console.log("=== pg_class ===");
        console.log(JSON.stringify(classData, null, 2));
    }
}
run();
