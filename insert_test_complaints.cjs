require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestComplaints() {
    console.log('--- Creating Test Complaints ---');

    const tenants = [
        { id: 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582', name: 'Krishna Niti' },
        { id: 'bf4c7152-6006-41b5-9c7d-84c76ea67da4', name: 'New Nagarsevak Name' }
    ];

    for (const tenant of tenants) {
        console.log(`Inserting for tenant: ${tenant.name} (${tenant.id})`);

        const { data, error } = await supabase
            .from('complaints')
            .insert([{
                problem: `TEST COMPLAINT via API - ${tenant.name}`,
                category: 'Other',
                status: 'Pending',
                priority: 'High',
                location: 'Ward 12 - Test API',
                area: 'Test Area',
                source: 'API_TEST',
                tenant_id: tenant.id,
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error(`Error inserting for ${tenant.name}:`, error);
        } else {
            console.log(`Success! Inserted complaint ID: ${data[0].id}`);
        }
    }
}

createTestComplaints();
