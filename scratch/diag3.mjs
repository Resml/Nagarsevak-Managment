import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const SERVICE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

async function run() {
  const fetchDB = async (table, select = '*') => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${select}`, {
      headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
    });
    return res.json();
  };

  const overrides = await fetchDB('tenant_feature_overrides');
  console.log("Overrides:", overrides);
}
run();
