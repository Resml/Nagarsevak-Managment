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
    .eq('id', 'bf4c7152-6006-41b5-9c7d-84c76ea67da4');
    
  console.log("Tenant:", tenant);
}
run();
