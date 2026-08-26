import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const SERVICE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

async function run() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  const email = `testadmin2_${Date.now()}@example.com`;
  const password = 'password123';
  const { data: user, error: createErr } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true
  });
  if (createErr) throw createErr;

  const tenant_id = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4';
  await supabase.from('user_tenant_mapping').insert({
    user_id: user.user.id, tenant_id, role: 'admin'
  });

  const authClient = createClient(SUPABASE_URL, env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1]);
  const { data: loginData, error: loginErr } = await authClient.auth.signInWithPassword({ email, password });
  if (loginErr) throw loginErr;

  // TEST 1: Call has_feature_access directly
  const { data: hasAccess, error: rpcErr } = await authClient.rpc('has_feature_access', {
    p_tenant_id: tenant_id,
    p_feature_key: 'complaints'
  });
  console.log("has_feature_access directly returned:", hasAccess, "Error:", rpcErr);
}
run();
