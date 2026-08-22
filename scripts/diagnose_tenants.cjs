const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const q = async (label, sql) => {
        const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
        if (error) console.error(label, error.message);
        else console.log(label, JSON.stringify(data));
    };

    // This must work since execute_sql did respond previously — let's test with simple selects
    // Use supabase-js direct table queries instead since execute_sql is blocked
    
    const { data: tenants, error: te } = await supabase
        .from('tenants')
        .select('id, plan')
        .in('plan', ['basic', 'pro', 'advance']);
    
    if (te) {
        console.error('tenants error:', te.message);
    } else {
        console.log('Tenants by plan:', JSON.stringify(tenants));
    }

    if (!tenants || tenants.length === 0) {
        console.log('No basic/pro/advance tenants found!');
        return;
    }

    const tenantIds = tenants.map(t => t.id);

    const { data: mappings, error: me } = await supabase
        .from('user_tenant_mapping')
        .select('tenant_id, user_id, role')
        .in('tenant_id', tenantIds);

    if (me) {
        console.error('mapping error:', me.message);
    } else {
        console.log('User-tenant mappings:', JSON.stringify(mappings));
        
        // Cross-reference
        for (const t of tenants) {
            const users = (mappings || []).filter(m => m.tenant_id === t.id);
            console.log(`  Plan=${t.plan} tenant=${t.id} → ${users.length} users`);
        }
    }
}

run();
