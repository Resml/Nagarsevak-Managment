import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const SERVICE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

async function run() {
  const sql = `
CREATE OR REPLACE FUNCTION test_service_role() RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::json->>'role';
END;
$$;
SELECT test_service_role();
`;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/test_service_role`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  console.log(res.status, await res.text());
}
run();
