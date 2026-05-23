const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
const lines = envContent.split('\n');
let url = '', key = '';
for (const line of lines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
}
const supabase = createClient(url, key);

async function checkTable(name) {
    const { data, error } = await supabase.from(name).select('*').limit(1);
    if (error) {
        console.log(`❌ ${name}: ${error.message} (code: ${error.code})`);
        return null;
    }
    if (data && data.length > 0) {
        console.log(`✅ ${name}: columns = ${Object.keys(data[0]).join(', ')}`);
    } else {
        console.log(`✅ ${name}: (empty table)`);
    }
    return data;
}

async function run() {
    const tables = [
        'personal_requests', 'requests', 'ward_budget', 'budgets',
        'ward_provisions', 'provisions', 'complaints', 'staff',
        'events', 'election_results', 'gallery', 'voters'
    ];
    for (const t of tables) {
        await checkTable(t);
    }
}
run().catch(console.error);
