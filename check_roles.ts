import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function checkRoles() {
    const { data, error } = await supabase
        .from('user_tenant_mapping')
        .select('*');
    console.log('user_tenant_mapping length:', data?.length);
    console.log('sample mapping:', data?.slice(0, 5));

    const { data: staffData } = await supabase
        .from('staff')
        .select('id, name, permissions')
        .limit(5);
    console.log('staff:', staffData);
}

checkRoles();
