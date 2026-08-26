import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const SERVICE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

async function run() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  const { data: user, error } = await supabase.auth.admin.getUserById('c061f82f-3cdf-4915-815b-679c94d9c37a');
  console.log("User email:", user.user.email);
}
run();
