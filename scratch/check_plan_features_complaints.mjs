import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const SERVICE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

async function run() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/plan_features?select=plan_id,feature_id,is_enabled`, {
    method: 'GET',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  });
  const data = await res.json();
  const complaintsFeatureId = 'fbf680fb-1296-48cd-b9df-cf82260ff0d4';
  console.log('Is complaints in plan_features?');
  console.log(data.filter(d => d.feature_id === complaintsFeatureId));
}
run();
