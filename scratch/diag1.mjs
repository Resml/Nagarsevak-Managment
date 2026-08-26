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

  const tenants = await fetchDB('tenants');
  console.log("Tenants:", tenants);

  const plans = await fetchDB('plans');
  console.log("Plans:", plans);
  
  const mappings = await fetchDB('user_tenant_mapping');
  console.log("User Tenant Mappings:", mappings.slice(0, 5));
  
  const features = await fetchDB('features', 'id,feature_key,is_active');
  console.log("Features (complaints):", features.filter(f => f.feature_key === 'complaints'));

  const planFeatures = await fetchDB('plan_features');
  const compId = features.find(f => f.feature_key === 'complaints')?.id;
  console.log("Plan Features for complaints:", planFeatures.filter(pf => pf.feature_id === compId));
}
run();
