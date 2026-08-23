/**
 * Phase 26 Batch 4 — RLS Policy Inspector via REST API
 * Uses the Supabase Management API to fetch RLS policies.
 * READ-ONLY.
 */

const SUPABASE_URL = 'https://qdvciisgxvupvrjygedr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkdmNpaXNneHZ1cHZyanln' +
    'ZWRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA4OTM2MCwiZXhwIjoyMDg0NjY1MzYwfQ.uHM3Gb-rpW87Fz02d-E6lVB50o13VWXfRmWZ15KzhXQ';

const TABLES = ['voters', 'works', 'gb_diary'];

async function queryPostgres(sql) {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ query: sql })
    });
    if (!resp.ok) {
        const text = await resp.text();
        return { error: text };
    }
    return resp.json();
}

async function fetchTableColumns(tableName) {
    const sql = `
        SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${tableName}'
        ORDER BY ordinal_position;
    `;
    return queryPostgres(sql);
}

async function fetchRlsPolicies(tableName) {
    const sql = `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = '${tableName}'
        ORDER BY policyname;
    `;
    return queryPostgres(sql);
}

async function fetchRlsEnabled(tableName) {
    const sql = `
        SELECT relname, relrowsecurity, relforcerowsecurity
        FROM pg_class
        JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
        WHERE pg_namespace.nspname = 'public' AND pg_class.relname = '${tableName}';
    `;
    return queryPostgres(sql);
}

async function fetchConstraints(tableName) {
    const sql = `
        SELECT tc.constraint_name, tc.constraint_type, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public' AND tc.table_name = '${tableName}'
        ORDER BY tc.constraint_type, kcu.column_name;
    `;
    return queryPostgres(sql);
}

console.log('=============================================================');
console.log(' Phase 26 Batch 4 — RLS & Column Inspector (via REST RPC)');
console.log('=============================================================\n');

for (const table of TABLES) {
    console.log(`\n╔══════════════════════════════════════════════════╗`);
    console.log(` TABLE: ${table.toUpperCase()}`);
    console.log(`╚══════════════════════════════════════════════════╝`);

    // RLS enabled?
    const rlsEnabled = await fetchRlsEnabled(table);
    if (rlsEnabled?.error) {
        console.log(` ⚠️  RLS status error: ${rlsEnabled.error}`);
    } else if (Array.isArray(rlsEnabled) && rlsEnabled.length > 0) {
        const r = rlsEnabled[0];
        console.log(` 🔐 RLS Enabled: ${r.relrowsecurity ? 'YES ✅' : 'NO ❌'}  |  Force RLS: ${r.relforcerowsecurity ? 'YES ✅' : 'NO'}`);
    } else {
        console.log(` ⚠️  exec_sql RPC not available. Attempting direct approach.`);
    }

    // Columns
    const cols = await fetchTableColumns(table);
    if (cols?.error) {
        console.log(` ⚠️  Column fetch error (exec_sql unavailable): ${JSON.stringify(cols.error).substring(0, 150)}`);
    } else if (Array.isArray(cols) && cols.length > 0) {
        console.log(` 📋 Columns:`);
        cols.forEach(c => {
            const nullable = c.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
            const def = c.column_default ? `[DEFAULT: ${c.column_default}]` : '';
            console.log(`     ${String(c.column_name).padEnd(35)} ${String(c.data_type).padEnd(25)} ${nullable} ${def}`);
        });
    }

    // Constraints
    const constraints = await fetchConstraints(table);
    if (!constraints?.error && Array.isArray(constraints) && constraints.length > 0) {
        console.log(` 🔗 Constraints:`);
        constraints.forEach(c => {
            console.log(`     [${c.constraint_type}] ${c.constraint_name} → ${c.column_name}`);
        });
    }

    // RLS Policies
    const policies = await fetchRlsPolicies(table);
    if (policies?.error) {
        console.log(` ⚠️  RLS policies error: ${JSON.stringify(policies.error).substring(0, 200)}`);
    } else if (Array.isArray(policies) && policies.length > 0) {
        console.log(` 🛡️  RLS Policies (${policies.length}):`);
        policies.forEach(p => {
            console.log(`     [${p.cmd}] ${p.policyname} (roles: ${(p.roles||[]).join(',')||'all'})`);
            if (p.qual) console.log(`         USING:      ${p.qual}`);
            if (p.with_check) console.log(`         WITH CHECK: ${p.with_check}`);
        });
    } else {
        console.log(` ⚠️  No RLS policies found (or exec_sql RPC not available).`);
    }
}

console.log(`\n=============================================================`);
console.log(` GOVERNMENT_OFFICES — Table does NOT exist.`);
console.log(` Will need CREATE TABLE migration with:`);
console.log(`   id           UUID PRIMARY KEY DEFAULT gen_random_uuid()`);
console.log(`   tenant_id    UUID NOT NULL REFERENCES tenants(id)`);
console.log(`   name         TEXT NOT NULL`);
console.log(`   address      TEXT`);
console.log(`   officer_name TEXT`);
console.log(`   contact_number TEXT`);
console.log(`   area         TEXT`);
console.log(`   created_at   TIMESTAMPTZ DEFAULT now()`);
console.log(`   updated_at   TIMESTAMPTZ DEFAULT now()`);
console.log(` + RLS: same pattern as works/gb_diary tables`);
console.log(`=============================================================`);
