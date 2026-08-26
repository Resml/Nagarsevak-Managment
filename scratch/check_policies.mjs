import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const SERVICE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

async function run() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  const { data, error } = await supabase.rpc('get_policies', { table_name: 'staff' });
  console.log("Policies:", data);
  if (error) {
     // fallback: query pg_policies using postgres
     const { data: pg_policies, error: pgError } = await supabase.from('pg_policies').select('*').eq('tablename', 'staff');
     console.log("pg_policies:", pg_policies);
     console.log("pgError:", pgError);
  }
}
run();
