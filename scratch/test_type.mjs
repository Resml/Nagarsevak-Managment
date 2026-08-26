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
  
  const sessionUser = loginData.user;
  
  const { data: staffData } = await supabase
    .from('staff')
    .select('permissions, id, role')
    .eq('id', sessionUser.id)
    .maybeSingle();
    
  console.log("Type:", typeof staffData.permissions);
  console.log("IsArray:", Array.isArray(staffData.permissions));
}
run();
