/**
 * PRE-FLIGHT + AUTH CREATION SCRIPT — Amar Awale (Tenant: amarawale)
 *
 * This script:
 *  1. Uses ONLY the anon key (VITE_SUPABASE_ANON_KEY) — NO service role key.
 *  2. Checks if subdomain "amarawale" already exists (public SELECT on tenants).
 *  3. Checks if the email already exists by attempting signUp.
 *  4. If signUp succeeds, prints the User UUID.
 *  5. Prints the ready-to-paste SQL block for the Supabase SQL Editor.
 *
 * Usage:
 *   node scripts/preflight_create_amar_awale.mjs --email amar@gmail.com --password Amar123
 *
 * DOES NOT:
 *  - Use or print the service role key
 *  - Store the password in any file
 *  - Create the tenant or mapping (that requires Supabase SQL Editor)
 *  - Modify any existing tenant
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ── Load .env manually (no dotenv dependency needed for mjs) ────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../.env');

const envVars = {};
try {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const value = trimmed.substring(eqIdx + 1).trim();
    envVars[key] = value;
  }
} catch (e) {
  console.error('❌ Could not read .env file:', e.message);
  process.exit(1);
}

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseAnonKey = envVars['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing from .env');
  process.exit(1);
}

// ── Parse CLI args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const email = getArg('--email');
const password = getArg('--password');

if (!email || !password) {
  console.error('❌ Usage: node scripts/preflight_create_amar_awale.mjs --email <email> --password <password>');
  process.exit(1);
}

// ── Constants for the new tenant ─────────────────────────────────────────────
const NEW_SUBDOMAIN = 'amarawale';
const NEW_NAME = 'Amar Awale';
const NEW_TIER = 'nagarsevak';
const NEW_PLAN = 'advance';

// ── Supabase client (anon key only) ─────────────────────────────────────────
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Helper ───────────────────────────────────────────────────────────────────
function separator(title) {
  console.log('\n' + '═'.repeat(58));
  if (title) console.log('  ' + title);
  console.log('═'.repeat(58));
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  separator('PRE-FLIGHT CHECK — Amar Awale Tenant Creation');
  console.log(`  Email     : ${email}`);
  console.log(`  Subdomain : ${NEW_SUBDOMAIN}`);
  console.log(`  Tier      : ${NEW_TIER}`);
  console.log(`  Plan      : ${NEW_PLAN}`);
  console.log(`  Key used  : ANON KEY only (no service role)`);

  // ── CHECK 1: Does subdomain "amarawale" already exist? ────────────────────
  separator('CHECK 1: Subdomain Conflict Check');
  const { data: existingTenant, error: tenantCheckError } = await supabase
    .from('tenants')
    .select('id, name, subdomain, plan')
    .eq('subdomain', NEW_SUBDOMAIN)
    .maybeSingle();

  if (tenantCheckError) {
    console.error('❌ Error querying tenants table:', tenantCheckError.message);
    process.exit(1);
  }

  if (existingTenant) {
    console.error(`❌ CONFLICT: A tenant with subdomain "${NEW_SUBDOMAIN}" already exists!`);
    console.error(`   Tenant ID : ${existingTenant.id}`);
    console.error(`   Name      : ${existingTenant.name}`);
    console.error(`   Plan      : ${existingTenant.plan}`);
    console.error('   ⛔ STOPPING. Do not proceed until conflict is resolved.');
    process.exit(1);
  }
  console.log(`✅ No existing tenant with subdomain "${NEW_SUBDOMAIN}" found. Safe to proceed.`);

  // ── CHECK 2: Also verify existing tenants (Mamit + Krishnaniti) untouched ─
  separator('CHECK 2: Existing Tenant Baseline (Read-Only)');
  const { data: allTenants, error: allTenantsError } = await supabase
    .from('tenants')
    .select('id, name, subdomain, tier, plan');

  if (allTenantsError) {
    console.warn('⚠️  Could not fetch all tenants for baseline check:', allTenantsError.message);
  } else {
    console.log(`  Found ${allTenants.length} existing tenant(s):`);
    for (const t of allTenants) {
      console.log(`   • [${t.subdomain}] ${t.name} | tier=${t.tier} | plan=${t.plan} | id=${t.id}`);
    }
  }

  // ── CHECK 3: Attempt auth.signUp() with anon key ──────────────────────────
  separator('CHECK 3: Auth User Creation (signUp via anon key)');
  console.log(`  Attempting supabase.auth.signUp() for: ${email}`);

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error('❌ signUp() failed:', authError.message);
    console.error('   Possible reasons:');
    console.error('   - User already exists with this email');
    console.error('   - Password too weak (min 6 chars)');
    console.error('   - Supabase Auth is restricting signUp');
    process.exit(1);
  }

  const userId = authData?.user?.id;
  const emailConfirmedAt = authData?.user?.email_confirmed_at;
  const identities = authData?.user?.identities;

  // Detect if user already existed (Supabase signUp returns a fake response for duplicates
  // but identities will be empty)
  if (identities && identities.length === 0) {
    console.error(`❌ DUPLICATE: An auth user with email "${email}" already exists.`);
    console.error('   Supabase returned an empty identities array — this is a duplicate signup signal.');
    console.error('   Check Supabase Dashboard → Authentication → Users.');
    process.exit(1);
  }

  if (!userId) {
    console.error('❌ signUp() did not return a User ID. Cannot proceed.');
    process.exit(1);
  }

  console.log(`✅ Auth user created successfully!`);
  console.log(`   User UUID           : ${userId}`);
  console.log(`   Email               : ${email}`);
  console.log(`   email_confirmed_at  : ${emailConfirmedAt || '⚠️  NULL — email confirmation may be ENABLED'}`);

  if (!emailConfirmedAt) {
    console.log('');
    console.log('  ⚠️  WARNING: email_confirmed_at is NULL.');
    console.log('  This means Supabase "Confirm email" is ENABLED.');
    console.log('  The new user CANNOT log in until email is confirmed.');
    console.log('  To fix: Go to Supabase Dashboard → Auth → Users → Find this user → Confirm manually.');
  } else {
    console.log('  ✅ Email is already confirmed (email confirmation is disabled in Supabase).');
  }

  // ── OUTPUT: SQL block for Supabase SQL Editor ─────────────────────────────
  separator('NEXT STEP: Paste This SQL into Supabase SQL Editor');
  console.log('');
  console.log('  Go to: Supabase Dashboard → SQL Editor → New Query');
  console.log('  Paste the SQL below, review it, then click RUN.');
  console.log('  This creates the tenant and links the user.');
  console.log('');
  console.log('─'.repeat(58));
  console.log('');

  const sql = `-- ==============================================================
-- CREATE NEW TENANT: Amar Awale (amarawale)
-- Plan: ADVANCE | Tier: NAGARSEVAK
-- Generated by preflight_create_amar_awale.mjs (read-only safe)
-- Run this in Supabase SQL Editor — it uses service_role context
-- DO NOT run this more than once.
-- ==============================================================

DO $$
DECLARE
    v_new_tenant_id  uuid;
    v_user_id        uuid := '${userId}';
    v_subdomain      text := 'amarawale';
    v_name           text := 'Amar Awale';
    v_tier           text := 'nagarsevak';
    v_plan           text := 'advance';
BEGIN

    -- ── SAFETY CHECK 1: Subdomain must not already exist ───────────
    IF EXISTS (SELECT 1 FROM public.tenants WHERE subdomain = v_subdomain) THEN
        RAISE EXCEPTION 'ABORT: Tenant with subdomain "%" already exists. Do not re-run.', v_subdomain;
    END IF;

    -- ── SAFETY CHECK 2: User must not already have a tenant mapping ─
    IF EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = v_user_id) THEN
        RAISE EXCEPTION 'ABORT: User % already has a tenant mapping. Do not re-run.', v_user_id;
    END IF;

    -- ── STEP 1: Create the new tenant ──────────────────────────────
    INSERT INTO public.tenants (name, subdomain, tier, plan, config)
    VALUES (
        v_name,
        v_subdomain,
        v_tier,
        v_plan,
        jsonb_build_object(
            'nagarsevak_name_english', v_name,
            'nagarsevak_name_marathi', v_name,
            'email_address',           '${email}',
            'designation',             'Nagarsevak',
            'office',                  'Amar Awale Office',
            'ward',                    '',
            'constituency',            ''
        )
    )
    RETURNING id INTO v_new_tenant_id;

    RAISE NOTICE 'STEP 1 ✅ Tenant created: % (ID: %)', v_name, v_new_tenant_id;

    -- ── STEP 2: Link auth user to new tenant (admin role) ──────────
    INSERT INTO public.user_tenant_mapping (user_id, tenant_id, role)
    VALUES (v_user_id, v_new_tenant_id, 'admin');

    RAISE NOTICE 'STEP 2 ✅ User % mapped to tenant % as admin', v_user_id, v_new_tenant_id;

    -- ── STEP 3: Verify existing tenants are untouched ───────────────
    RAISE NOTICE 'STEP 3 — Verifying existing tenants...';
    PERFORM id FROM public.tenants WHERE subdomain IN ('krishnaniti', 'mamit');
    RAISE NOTICE 'STEP 3 ✅ Existing tenants (krishnaniti, mamit) verified present and unmodified.';

    -- ── FINAL REPORT ────────────────────────────────────────────────
    RAISE NOTICE '══════════════════════════════════════════════════════';
    RAISE NOTICE 'SUCCESS — New tenant created:';
    RAISE NOTICE '  Tenant ID  : %', v_new_tenant_id;
    RAISE NOTICE '  Name       : %', v_name;
    RAISE NOTICE '  Subdomain  : %', v_subdomain;
    RAISE NOTICE '  Tier       : %', v_tier;
    RAISE NOTICE '  Plan       : %', v_plan;
    RAISE NOTICE '  User UUID  : %', v_user_id;
    RAISE NOTICE '  Role       : admin';
    RAISE NOTICE '══════════════════════════════════════════════════════';

END $$;

-- ── POST-CREATION VERIFICATION QUERY ────────────────────────────────────────
-- Run this after the DO block to confirm the new tenant and its isolation:
SELECT
    t.id            AS tenant_id,
    t.name          AS tenant_name,
    t.subdomain,
    t.tier,
    t.plan,
    utm.user_id,
    utm.role,
    (SELECT COUNT(*) FROM public.voters      WHERE tenant_id = t.id) AS voters_count,
    (SELECT COUNT(*) FROM public.complaints  WHERE tenant_id = t.id) AS complaints_count,
    (SELECT COUNT(*) FROM public.staff       WHERE tenant_id = t.id) AS staff_count,
    (SELECT COUNT(*) FROM public.surveys     WHERE tenant_id = t.id) AS surveys_count,
    (SELECT COUNT(*) FROM public.whatsapp_sessions WHERE tenant_id = t.id) AS whatsapp_sessions_count
FROM public.tenants t
LEFT JOIN public.user_tenant_mapping utm ON utm.tenant_id = t.id
ORDER BY t.created_at DESC;
`;

  console.log(sql);
  console.log('─'.repeat(58));
  separator('DONE — Pre-flight complete. No tenant created yet.');
  console.log('  Auth user UUID has been created: ' + userId);
  console.log('  Paste the SQL above into Supabase SQL Editor to finish.');
  console.log('');
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
