
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase
        .from('works')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching works:', error);
    } else {
        console.log('Works columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No data found');
    }
}

checkSchema();
