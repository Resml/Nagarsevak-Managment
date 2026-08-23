/**
 * Phase 26 Batch 4 — Pre-Flight Schema & RLS Inspector
 * Uses the service-role key (bypasses RLS) to inspect raw schemas.
 * READ-ONLY. No mutations.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qdvciisgxvupvrjygedr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkdmNpaXNneHZ1cHZyanln' +
    'ZWRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA4OTM2MCwiZXhwIjoyMDg0NjY1MzYwfQ.uHM3Gb-rpW87Fz02d-E6lVB50o13VWXfRmWZ' +
    '15KzhXQ';

const supa = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const TABLES = ['voters', 'works', 'gb_diary', 'government_offices'];

async function queryRaw(sql) {
    const { data, error } = await supa.rpc('exec_sql', { query: sql }).maybeSingle();
    if (error) throw error;
    return data;
}

async function getColumns(tableName) {
    const { data, error } = await supa
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default, character_maximum_length')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');
    if (error) {
        // Supabase blocks information_schema through the JS client — use REST/RPC approach
        return { error: error.message };
    }
    return data;
}

async function checkTableExists(tableName) {
    // Try to select 0 rows — if table doesn't exist, error code = 42P01
    const { data, error } = await supa.from(tableName).select('id').limit(0);
    if (error) {
        return { exists: false, errorCode: error.code, message: error.message };
    }
    return { exists: true };
}

async function getRowCount(tableName) {
    const { count, error } = await supa.from(tableName).select('*', { count: 'exact', head: true });
    if (error) return { error: error.message };
    return { count };
}

async function sampleRow(tableName) {
    const { data, error } = await supa.from(tableName).select('*').limit(1);
    if (error) return { error: error.message };
    return data?.[0] ?? null;
}

async function getRlsPolicies(tableName) {
    // Query pg_policies via a raw SQL RPC if available, otherwise via PostgREST
    const { data, error } = await supa
        .from('pg_policies')
        .select('policyname, cmd, qual, with_check')
        .eq('tablename', tableName);
    if (error) return { error: error.message };
    return data;
}

async function getConstraints(tableName) {
    const { data, error } = await supa
        .from('information_schema.table_constraints')
        .select('constraint_name, constraint_type')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);
    if (error) return { error: error.message };
    return data;
}

// -------------------------------------------------------------------
// Main
// -------------------------------------------------------------------
console.log('=============================================================');
console.log(' Phase 26 Batch 4 — Pre-Flight Schema Inspector');
console.log(' READ-ONLY. Service-role key. No mutations.');
console.log('=============================================================\n');

const results = {};

for (const table of TABLES) {
    console.log(`\n───────────────────────────────────────────────────`);
    console.log(` TABLE: ${table.toUpperCase()}`);
    console.log(`───────────────────────────────────────────────────`);

    const exists = await checkTableExists(table);
    results[table] = { exists };

    if (!exists.exists) {
        console.log(` ❌ Table does NOT exist in production.`);
        console.log(`    Error: ${exists.message}`);
        continue;
    }
    console.log(` ✅ Table exists.`);

    // Row count
    const rc = await getRowCount(table);
    results[table].rowCount = rc;
    console.log(` 📊 Row count: ${rc.count ?? ('error: ' + rc.error)}`);

    // Sample row (to infer actual column names from production)
    const sample = await sampleRow(table);
    results[table].sampleKeys = sample ? Object.keys(sample) : [];
    if (sample) {
        console.log(` 🔑 Columns (from sample row):`);
        Object.entries(sample).forEach(([k, v]) => {
            const displayVal = v === null ? 'NULL' : (typeof v === 'object' ? JSON.stringify(v).substring(0, 80) : String(v).substring(0, 80));
            console.log(`     ${k.padEnd(30)} = ${displayVal}`);
        });
    } else {
        console.log(` ⚠️  Table is empty — no sample row available.`);
    }

    // RLS policies
    const rls = await getRlsPolicies(table);
    results[table].rls = rls;
    if (rls?.error) {
        console.log(` ⚠️  Could not fetch RLS policies: ${rls.error}`);
    } else if (!rls || rls.length === 0) {
        console.log(` ⚠️  No RLS policies found — table may be unprotected or pg_policies not accessible.`);
    } else {
        console.log(` 🔐 RLS Policies (${rls.length}):`);
        rls.forEach(p => {
            console.log(`     [${p.cmd}] ${p.policyname}`);
            if (p.qual) console.log(`         USING: ${p.qual}`);
            if (p.with_check) console.log(`         WITH CHECK: ${p.with_check}`);
        });
    }
}

// -------------------------------------------------------------------
// Government Offices: localStorage check (conceptual note)
// -------------------------------------------------------------------
console.log(`\n───────────────────────────────────────────────────`);
console.log(` GOVERNMENT OFFICES — localStorage migration risk`);
console.log(`───────────────────────────────────────────────────`);
console.log(` governmentService.ts currently uses localStorage keys:`);
console.log(`   ns_gov_offices_<tenantId>`);
console.log(` Since this script runs in Node.js (no localStorage), `);
console.log(` localStorage data cannot be inspected from here.`);
console.log(` → Action needed: If government_offices table does NOT exist,`);
console.log(`   we must create it with a migration. localStorage data would`);
console.log(`   be lost unless we provide a migration wizard in the UI.`);

// -------------------------------------------------------------------
// Summary
// -------------------------------------------------------------------
console.log(`\n=============================================================`);
console.log(` SUMMARY`);
console.log(`=============================================================`);
for (const [table, info] of Object.entries(results)) {
    const status = info.exists?.exists ? `✅ EXISTS (${info.rowCount?.count ?? '?'} rows)` : `❌ MISSING`;
    console.log(` ${table.padEnd(25)} ${status}`);
}
console.log('');
