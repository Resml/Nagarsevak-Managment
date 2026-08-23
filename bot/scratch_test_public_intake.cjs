require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function runTests() {
    console.log("Starting Public Intake Architecture Tests...\n");

    let krishnanitiTenantId = 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582';

    // TEST 1: Anonymous Direct-Supabase-Write (Should Fail)
    console.log("TEST 1: Anonymous direct-Supabase-write");
    const { error: anonErr } = await anonClient.from('complaints').insert([{
        problem: 'Test Anon',
        category: 'Other',
        tenant_id: krishnanitiTenantId
    }]);

    if (anonErr && (anonErr.code === '42501' || anonErr.message.includes('violates row-level security'))) {
        console.log("✅ PASS: Anonymous direct-Supabase-write blocked by RLS.");
    } else {
        console.log("❌ FAIL: Anonymous write succeeded or failed for wrong reason:", anonErr || "Success");
    }
    console.log("--------------------------------------------------\n");

    // Start local express app to test the backend endpoints
    const express = require('express');
    const app = express();
    app.use(express.json());
    app.use('/api/public', require('./publicRoutes'));
    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    try {
        // TEST 2: Legitimate Public Submission through Backend
        console.log("TEST 2: Legitimate Public Submission through Backend");
        const res2 = await axios.post(`${baseUrl}/api/public/complaints`, {
            problem: 'Legitimate Backend Test',
            category: 'Other',
            description_meta: { test: true }
        }, {
            headers: {
                'Origin': 'https://krishnaniti.in'
            }
        });
        
        if (res2.data.success && res2.data.data.tenant_id) {
            console.log(`✅ PASS: Backend insertion succeeded. Resolved Tenant ID: ${res2.data.data.tenant_id}`);
            // Clean up
            await adminClient.from('complaints').delete().eq('id', res2.data.data.id);
        } else {
            console.log("❌ FAIL: Backend insertion failed.");
        }
        console.log("--------------------------------------------------\n");

        // TEST 3: Tenant Spoofing
        console.log("TEST 3: Tenant Spoofing (Attempting to inject fake tenant_id)");
        const fakeTenantId = '00000000-0000-0000-0000-000000000000';
        const res3 = await axios.post(`${baseUrl}/api/public/complaints`, {
            problem: 'Spoof Test',
            category: 'Other',
            tenant_id: fakeTenantId // Attempting spoof
        }, {
            headers: {
                'Origin': 'https://krishnaniti.in' // Using valid subdomain to bypass 404, testing body override
            }
        });

        if (res3.data.success) {
            const resolvedTenantId = res3.data.data.tenant_id;
            if (resolvedTenantId !== fakeTenantId && resolvedTenantId) {
                console.log(`✅ PASS: Tenant spoofing blocked. Body tenant_id ignored. Securely resolved to: ${resolvedTenantId}`);
            } else {
                console.log(`❌ FAIL: Spoofed tenant_id was accepted!`);
            }
            // Clean up
            await adminClient.from('complaints').delete().eq('id', res3.data.data.id);
        } else {
            console.log("❌ FAIL: Request failed entirely.");
        }
        console.log("--------------------------------------------------\n");

    } catch (e) {
        console.error("Test execution error:", e.response ? e.response.data : e.message);
    } finally {
        server.close();
    }
}

runTests();
