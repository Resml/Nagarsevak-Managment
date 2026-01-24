import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Hack to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase Credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const dummyStaff = [
    {
        name: 'Ramesh Patil',
        mobile: '+919876543210',
        role: 'Electrician',
        keywords: ['light', 'current', 'pole', 'dark', 'bulb']
    },
    {
        name: 'Suresh Pawar',
        mobile: '+919876543211',
        role: 'Plumber',
        keywords: ['water', 'pipeline', 'leak', 'tap', 'pressure']
    },
    {
        name: 'Vijay Chavan',
        mobile: '+919876543212',
        role: 'Sanitation',
        keywords: ['garbage', 'waste', 'smell', 'cleaning', 'dustbin']
    }
];

async function seed() {
    console.log('🌱 Seeding Dummy Staff...');

    for (const staff of dummyStaff) {
        const { error } = await supabase.from('staff').insert([staff]);
        if (error) {
            console.error(`❌ Failed to add ${staff.name}:`, error.message);
        } else {
            console.log(`✅ Added ${staff.name} (${staff.role})`);
        }
    }
    console.log('✨ Done!');
}

seed();
