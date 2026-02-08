require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkComplaints() {
    console.log('--- Checking Recent Complaints ---');
    const { data: complaints, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching complaints:', error);
    } else {
        console.log(`Found ${complaints.length} complaints:`);
        complaints.forEach(c => {
            console.log(`- ID: ${c.id}`);
            console.log(`  Problem: ${c.problem}`);
            console.log(`  Category: ${c.category}`);
            console.log(`  Tenant ID: ${c.tenant_id}`);
            console.log(`  Created At: ${c.created_at}`);
            console.log('---');
        });
    }

    console.log('\n--- Checking Tenants ---');
    const { data: tenants, error: tenantError } = await supabase
        .from('tenants')
        .select('*');

    if (tenantError) {
        console.error('Error fetching tenants:', tenantError);
    } else {
        console.log(`Found ${tenants.length} tenants:`);
        tenants.forEach(t => {
            console.log(`- ID: ${t.id}, Name: ${t.name}`);
        });
    }
}

checkComplaints();
