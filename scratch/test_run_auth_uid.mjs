import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const SERVICE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

async function run() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  const email = `testadmin4_${Date.now()}@example.com`;
  const password = 'password123';
  const { data: user, error: createErr } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true
  });
  if (createErr) throw createErr;

  const authClient = createClient(SUPABASE_URL, env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1]);
  const { data: loginData, error: loginErr } = await authClient.auth.signInWithPassword({ email, password });
  if (loginErr) throw loginErr;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/test-auth-uid`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${loginData.session.access_token}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log("Response:", res.status, await res.text());
}
run();
