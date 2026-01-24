import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase keys in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const EXCEL_DIR = path.join(__dirname, '../final excels'); // Adjust path as needed

async function importVoters() {
    console.log('Starting migration...');

    // Get all excel files
    if (!fs.existsSync(EXCEL_DIR)) {
        console.error(`Directory not found: ${EXCEL_DIR}`);
        return;
    }

    const files = fs.readdirSync(EXCEL_DIR).filter(f => f.endsWith('.xlsx'));
    console.log(`Found ${files.length} Excel files.`);

    for (const file of files) {
        console.log(`Processing file: ${file}`);
        const workbook = XLSX.readFile(path.join(EXCEL_DIR, file));
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        console.log(`Read ${rows.length} rows from ${file}. Uploading...`);

        const BATCH_SIZE = 100;
        let batch = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            // Map Excel columns to Database Schema
            const voter = {
                epic_no: row['EPIC No'] || row['Epic No'],
                name_marathi: row['Candidate Name'],
                name_english: row['Candidate Name_Eng'],
                relation_name_marathi: row['Relation Name'],
                relation_name_english: row['Relation Name_Eng'],
                relation_type: row['Relation Type'],
                house_no: String(row['House No'] || ''),
                age: parseInt(row['Age']) || 0,
                gender: row['Gender'],
                address_marathi: row['Address'],
                address_english: row['Address Eng'],
                ac_no: parseInt(row['AC No']) || 0,
                part_no: parseInt(row['Part No']) || 0,
                serial_no: String(row['Serial No'] || ''),
                new_serial_no: parseInt(row['New Sr No']) || 0,
            };

            batch.push(voter);

            if (batch.length >= BATCH_SIZE) {
                const { error } = await supabase.from('voters').insert(batch);
                if (error) {
                    console.error('Error inserting batch:', error);
                } else {
                    process.stdout.write('.');
                }
                batch = [];
            }
        }

        // Insert remaining
        if (batch.length > 0) {
            const { error } = await supabase.from('voters').insert(batch);
            if (error) console.error('Error inserting final batch:', error);
        }
        console.log('\nFile done.');
    }

    console.log('Migration Complete.');
}

importVoters();
