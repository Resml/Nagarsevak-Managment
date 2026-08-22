import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const SERVICE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

async function run() {
  const query = `
    SELECT tablename, policyname, cmd, roles, qual, with_check 
    FROM pg_policies 
    WHERE schemaname='public' 
      AND tablename IN ('gb_diary', 'housing_societies', 'social_organizations', 'survey_responses', 'surveys', 'visitors') 
      AND cmd IN ('INSERT', 'UPDATE')
    ORDER BY tablename, cmd;
  `;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/run_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  
  if (!res.ok) {
    console.error(await res.text());
    return;
  }
  
  const data = await res.json();
  data.forEach(p => {
    console.log(`TABLE: ${p.tablename} | CMD: ${p.cmd} | POLICY: ${p.policyname} | ROLES: ${p.roles}`);
    console.log(`  QUAL: ${p.qual}`);
    console.log(`  WITH_CHECK: ${p.with_check}`);
    console.log("---");
  });
}
run();
