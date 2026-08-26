import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const SERVICE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

async function run() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  // 1. Create a test admin user
  const email = `testadmin_${Date.now()}@example.com`;
  const password = 'password123';
  const { data: user, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (createErr) throw createErr;
  console.log("Created test admin:", user.user.id);

  // 2. Map test admin to a tenant (e.g. advance plan tenant)
  const tenant_id = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4';
  await supabase.from('user_tenant_mapping').insert({
    user_id: user.user.id,
    tenant_id,
    role: 'admin'
  });

  // 3. Login as test admin to get JWT
  const authClient = createClient(SUPABASE_URL, env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1]);
  const { data: loginData, error: loginErr } = await authClient.auth.signInWithPassword({ email, password });
  if (loginErr) throw loginErr;
  
  console.log("Logged in, got JWT");

  // 4. Call Edge Function with the JWT
  const res = await fetch(`${SUPABASE_URL}/functions/v1/create-staff-user`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${loginData.session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: `staff_${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test Staff',
      tenant_id,
      mobile: '9999999999',
      role: 'staff',
      area: 'Test Area',
      category: 'Office',
      keywords: [],
      permissions: ['complaints']
    })
  });

  const responseText = await res.text();
  console.log("Edge Function Response:", res.status, responseText);
}
run();
