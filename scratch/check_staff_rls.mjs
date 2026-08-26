import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const SERVICE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];
const ANON_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

async function run() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  // 1. Create a test admin user to create the staff
  const adminEmail = `testadmin_${Date.now()}@example.com`;
  const adminPass = 'password123';
  const { data: adminData } = await supabase.auth.admin.createUser({
    email: adminEmail, password: adminPass, email_confirm: true
  });
  
  const tenant_id = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4';
  await supabase.from('user_tenant_mapping').insert({
    user_id: adminData.user.id, tenant_id, role: 'admin'
  });

  // Login as admin
  const authClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: adminLogin } = await authClient.auth.signInWithPassword({ email: adminEmail, password: adminPass });

  // Call Edge function to create staff
  const staffEmail = `teststaff_${Date.now()}@example.com`;
  const staffPass = 'password123';
  await fetch(`${SUPABASE_URL}/functions/v1/create-staff-user`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminLogin.session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: staffEmail, password: staffPass, name: 'Test Staff', tenant_id, mobile: '8888888888', role: 'staff',
      area: 'Test Area', category: 'Office', keywords: [], permissions: ['complaints']
    })
  });

  // 2. Now login as the STAFF user
  const staffClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: staffLogin, error: staffLoginErr } = await staffClient.auth.signInWithPassword({ email: staffEmail, password: staffPass });
  if (staffLoginErr) throw staffLoginErr;

  console.log("Logged in as staff:", staffLogin.user.id);

  // 3. Try to fetch own staff record
  const { data: staffRecord, error: fetchErr } = await staffClient
    .from('staff')
    .select('permissions, id, role')
    .eq('id', staffLogin.user.id)
    .maybeSingle();

  console.log("Staff fetch own record:", staffRecord);
  console.log("Staff fetch error:", fetchErr);
}
run();
