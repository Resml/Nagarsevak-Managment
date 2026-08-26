import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const SERVICE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

async function run() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  const { data: staffData, error } = await supabase
    .from('staff')
    .select('*')
    .eq('name', 'siddhesh');
    
  console.log("staff rows:", staffData);
}
run();
