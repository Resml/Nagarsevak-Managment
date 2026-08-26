import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const SERVICE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

async function run() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .ilike('name', '%krashnaniti%')
    .or(`name.ilike.%krishnaniti%`);
    
  console.log("Tenant:", tenant);
}
run();
