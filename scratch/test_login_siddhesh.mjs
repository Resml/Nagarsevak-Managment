import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const ANON_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

async function run() {
  const supabase = createClient(SUPABASE_URL, ANON_KEY);
  
  // 1. Log in
  const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'siddhesh@gmail.com',
    password: 'Password@123'
  });
  
  if (loginErr) throw loginErr;
  console.log("Logged in:", loginData.user.id);
  
  // 2. Simulate AuthContext loadUser
  const sessionUser = loginData.user;
  
  const { data: staffData, error: staffErr } = await supabase
    .from('staff')
    .select('permissions, id, role')
    .eq('id', sessionUser.id)
    .maybeSingle();
    
  console.log("staffData:", staffData);
  console.log("staffErr:", staffErr);
  
  const { data: mappingData, error: mappingErr } = await supabase
    .from('user_tenant_mapping')
    .select('role')
    .eq('user_id', sessionUser.id)
    .maybeSingle();
    
  console.log("mappingData:", mappingData);
  console.log("mappingErr:", mappingErr);
}
run();
