import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listPolicies() {
    const { data, error } = await supabase.rpc('get_policies_for_table', { table_name: 'objects' });
    
    // We don't have that RPC. We can just run SQL.
    // Wait, since we don't have SQL from node without postgres url...
}
