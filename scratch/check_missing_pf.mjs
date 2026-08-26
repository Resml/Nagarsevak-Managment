import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const SERVICE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

async function run() {
  const [pfRes, fRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/plan_features?select=plan_id,feature_id,is_enabled`, {
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    }),
    fetch(`${SUPABASE_URL}/rest/v1/features?select=id,feature_key`, {
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    })
  ]);
  const planFeatures = await pfRes.json();
  const features = await fRes.json();

  const pfSet = new Set(planFeatures.map(pf => pf.feature_id));
  const missingFeatures = features.filter(f => !pfSet.has(f.id));
  console.log('Features NOT in plan_features table:');
  console.log(missingFeatures);
}
run();
