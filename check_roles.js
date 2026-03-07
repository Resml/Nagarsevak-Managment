import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const lines = envFile.split('\n');
let url = '';
let key = '';
lines.forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1];
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1];
});

const supabase = createClient(url, key);

async function checkRoles() {
    const { data, error } = await supabase
        .from('user_tenant_mapping')
        .select('*')
        .limit(10);
    console.log('user_tenant_mapping:', data);

    const { data: staffData } = await supabase
        .from('staff')
        .select('id, name, role, permissions')
        .limit(10);
    console.log('staff:', staffData);
}

checkRoles();
