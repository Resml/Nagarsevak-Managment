import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const SERVICE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

async function run() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  const email = `testadmin3_${Date.now()}@example.com`;
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

  const staffUserId = `staff_${Date.now()}`;
  const { data: staff, error: staffErr } = await authClient.from('staff').insert({
    id: user.user.id, // Try inserting for self
    name: 'Self Staff',
    mobile: '9999999999',
    role: 'staff',
    permissions: ['complaints'],
    tenant_id
  });
  console.log("Self Insert Error:", staffErr?.message);

  const { data: staff2, error: staffErr2 } = await authClient.from('staff').insert({
    id: 'f87680fb-1296-48cd-b9df-cf82260ff0d4', // Random ID (like Edge Function does)
    name: 'Other Staff',
    mobile: '8888888888',
    role: 'staff',
    permissions: ['complaints'],
    tenant_id
  });
  console.log("Other Insert Error:", staffErr2?.message);
}
run();
