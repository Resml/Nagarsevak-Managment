require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');

async function run() {
    const sqlFile = process.argv[2];
    if (!sqlFile) {
        console.error('Please provide a SQL file path');
        process.exit(1);
    }
    const sql = fs.readFileSync(sqlFile, 'utf8');
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        console.log(`Executing ${sqlFile}...`);
        const res = await client.query(sql);
        console.log('Execution successful!');
    } catch (err) {
        console.error('Execution failed:', err.message);
    } finally {
        await client.end();
    }
}
run();
