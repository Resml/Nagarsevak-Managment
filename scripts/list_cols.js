require('dotenv').config();
const { Client } = require('pg');

async function run() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const res = await client.query(`
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name IN ('plan', 'category') 
        ORDER BY table_name, column_name;
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
}
run();
