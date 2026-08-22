const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config();

async function run() {
    // Determine the connection string. Supabase provides DATABASE_URL
    const connectionString = process.env.DATABASE_URL || process.env.VITE_SUPABASE_URL.replace('https://', 'postgresql://postgres:postgres@').replace('.supabase.co', ':5432/postgres');
    
    // We will parse the DB URL if it is in supabase .env format
    // A standard supabase local env usually has:
    // SUPABASE_DB_URL or just use postgres://postgres:postgres@127.0.0.1:54322/postgres
    // Let's check process.env.DATABASE_URL first.
    let dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.log("No DATABASE_URL found in .env. Looking for fallback...");
        // read .env
        const envStr = fs.readFileSync('.env', 'utf-8');
        const match = envStr.match(/DATABASE_URL="?([^"\n]+)"?/);
        if (match) {
            dbUrl = match[1];
        } else {
            console.error("Could not find DATABASE_URL in .env");
            process.exit(1);
        }
    }

    const client = new Client({ connectionString: dbUrl });
    
    client.on('notice', (msg) => {
        console.log(`NOTICE: ${msg.message}`);
    });

    try {
        await client.connect();
        const sql = fs.readFileSync('migrations/phase5b_rbac_verify.sql', 'utf-8');
        await client.query(sql);
        console.log('✅ SQL Script Executed Successfully.');
    } catch (e) {
        console.error(`❌ SQL Execution Failed: ${e.message}`);
    } finally {
        await client.end();
    }
}

run();
