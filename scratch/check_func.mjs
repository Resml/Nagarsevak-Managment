import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const SERVICE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

async function run(query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/run_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  if(res.status !== 200) {
      console.log('Error:', res.status, await res.text());
  } else {
      console.log(await res.text());
  }
}

// Check has_feature_access code
const sql = `
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'has_feature_access';
`;
run(sql);
