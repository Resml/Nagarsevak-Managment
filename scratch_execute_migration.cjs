require('dotenv').config({ path: '.env' });
const { Client } = require('pg');
const fs = require('fs');

async function run() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error("No DATABASE_URL in .env");
        process.exit(1);
    }
    
    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        
        console.log("=== EXECUTING MIGRATION ===");
        const migrationSql = fs.readFileSync('migrations/phase5b_rbac_migration.sql', 'utf8');
        await client.query(migrationSql);
        console.log("Migration Executed Successfully.\n");
        
        console.log("=== EXECUTING VERIFICATION ===");
        const verifySql = fs.readFileSync('migrations/phase5b_rbac_verify.sql', 'utf8');
        const verifyRes = await client.query(verifySql);
        
        // Print all outputs
        for (const row of verifyRes.rows) {
            console.log(`[${row.test_name}] Pass: ${row.passed} (Fails: ${row.fail_count})`);
            if (row.details && Object.keys(row.details).length > 0) {
                console.log(`Details: ${JSON.stringify(row.details, null, 2)}`);
            }
        }
        
    } catch (e) {
        console.error("Execution Error:", e);
    } finally {
        await client.end();
    }
}

run();
