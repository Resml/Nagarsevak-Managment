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

const sql = `
SELECT 
    schemaname, tablename, policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN (
    'area_problems', 'opposition_karyakartas', 'voters', 'incoming_letters', 
    'events', 'schemes', 'improvements', 'works', 'ward_provisions', 'non_voters', 
    'ai_history', 'gallery', 'admin_billing', 'admin_support_tickets', 
    'admin_updates', 'app_settings', 'security_audit_logs', 'tenants'
);
`;
run(sql);
