import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials. Have you set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env?');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const validLetterNames = [
    'Residence Certificate',
    'School Admission Recommendation',
    'Job Recommendation Letter',
    'Character & Identity Certificate',
    'Death Certificate Request',
    'Gas Connection Recommendation',
    'Income Certificate Recommendation',
    'New Electricity Meter Recommendation'
];

async function cleanupLetters() {
    console.log('Cleaning up old letter types not in the approved list...');

    // Fetch all letter types
    const { data: allTypes, error: fetchError } = await supabase
        .from('letter_types')
        .select('id, name');

    if (fetchError) {
        console.error('Failed to fetch letter types:', fetchError);
        return;
    }

    const typesToDelete = allTypes.filter(type => !validLetterNames.includes(type.name));

    if (typesToDelete.length === 0) {
        console.log('No extra letter types found. Database is clean.');
        return;
    }

    console.log(`Found ${typesToDelete.length} letter types to delete.`);

    for (const type of typesToDelete) {
        const { error: deleteError } = await supabase
            .from('letter_types')
            .delete()
            .eq('id', type.id);

        if (deleteError) {
            console.error(`Failed to delete letter type ${type.name}:`, deleteError);
        } else {
            console.log(`Successfully deleted obsolete letter type: ${type.name}`);
        }
    }

    console.log('Cleanup complete.');
}

cleanupLetters().catch(console.error);
