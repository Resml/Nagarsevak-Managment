const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('query_sql', { sql: 'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'staff\'' });
  if (error) {
    console.error('Error with RPC:', error.message);
  } else {
    console.log(data);
  }
}
check();
