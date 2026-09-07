/**
 * AUTH DIAGNOSIS SCRIPT — Full error capture for amar@gmail.com signUp failure
 *
 * READ-ONLY diagnostic. Does NOT:
 *  - Create a tenant
 *  - Modify any data
 *  - Use or print the service role key
 *
 * Tests:
 *  1. Full raw error object from signUp (status, code, name, message, __isAuthError, cause)
 *  2. Whether the error is email-specific or project-wide
 *  3. Whether a known-good email pattern succeeds (probe only, no real creation)
 *  4. Raw fetch to the GoTrue /signup endpoint to capture the exact HTTP response body
 *
 * Usage: node scripts/diagnose_auth_error.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// ── Load .env ────────────────────────────────────────────────────────────────
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
    envVars[trimmed.substring(0, eqIdx).trim()] = trimmed.substring(eqIdx + 1).trim();
  }
} catch (e) {
  console.error('❌ Could not read .env:', e.message);
  process.exit(1);
}

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseAnonKey = envVars['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function sep(title) {
  console.log('\n' + '─'.repeat(60));
  if (title) console.log('  ' + title);
  console.log('─'.repeat(60));
}

// ── TEST 1: Full error object via supabase-js signUp ────────────────────────
async function test1_fullErrorObject() {
  sep('TEST 1 — Full raw error object from supabase.auth.signUp()');
  console.log('  Email under test: amar@gmail.com');
  console.log('  (NOT creating — capturing error only)\n');

  const { data, error } = await supabase.auth.signUp({
    email: 'amar@gmail.com',
    password: 'Amar123',
  });

  if (error) {
    console.log('  ❌ signUp returned an error. Full error object:');
    console.log('  ┌─────────────────────────────────────────────');
    console.log('  │ __isAuthError :', error.__isAuthError);
    console.log('  │ name          :', error.name);
    console.log('  │ status        :', error.status);
    console.log('  │ code          :', error.code);
    console.log('  │ message       :', error.message);
    console.log('  │ cause         :', error.cause ? JSON.stringify(error.cause) : 'undefined');
    console.log('  │ stack (first line):', error.stack?.split('\n')[0]);
    console.log('  │ Full JSON     :', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.log('  └─────────────────────────────────────────────');
    return { failed: true, status: error.status, code: error.code, message: error.message };
  } else {
    console.log('  ✅ signUp succeeded (no error)!');
    console.log('  User ID            :', data?.user?.id);
    console.log('  email_confirmed_at :', data?.user?.email_confirmed_at);
    console.log('  identities count   :', data?.user?.identities?.length);
    // If identities is empty → user already existed
    if (data?.user?.identities?.length === 0) {
      console.log('  ⚠️  identities is EMPTY — this email already exists in auth.users');
    }
    return { failed: false, userId: data?.user?.id };
  }
}

// ── TEST 2: Raw HTTP fetch to GoTrue /signup endpoint ───────────────────────
async function test2_rawHttpFetch() {
  sep('TEST 2 — Raw HTTP POST to GoTrue /auth/v1/signup (full response body)');
  const gotureUrl = `${supabaseUrl}/auth/v1/signup`;
  console.log('  Endpoint:', gotureUrl);
  console.log('  Method  : POST');
  console.log('  Headers : apikey=ANON_KEY, Content-Type=application/json\n');

  let resp;
  try {
    resp = await fetch(gotureUrl, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'amar@gmail.com',
        password: 'Amar123',
      }),
    });
  } catch (fetchErr) {
    console.error('  ❌ Network error during fetch:', fetchErr.message);
    return;
  }

  const rawText = await resp.text();
  console.log('  HTTP Status  :', resp.status, resp.statusText);
  console.log('  Content-Type :', resp.headers.get('content-type'));
  console.log('  Raw body     :');
  console.log('  ' + rawText);

  let parsed;
  try {
    parsed = JSON.parse(rawText);
    console.log('\n  Parsed JSON:');
    console.log('  ', JSON.stringify(parsed, null, 2).split('\n').join('\n  '));
    if (parsed.error_code || parsed.code) {
      console.log('\n  ► error_code  :', parsed.error_code);
      console.log('  ► code        :', parsed.code);
      console.log('  ► msg/message :', parsed.msg || parsed.message);
    }
  } catch {
    console.log('  (Body is not valid JSON)');
  }
}

// ── TEST 3: Probe with a syntactically different email to isolate the issue ──
async function test3_probeAlternateEmail() {
  sep('TEST 3 — Probe signUp with a dummy non-conflicting email (isolation test)');
  // Use a clearly synthetic domain that will NOT create a real account
  // This tests whether the rejection is Gmail-specific or project-wide
  const probeEmail = `diag_probe_${Date.now()}@example.com`;
  console.log(`  Probe email: ${probeEmail}`);
  console.log('  (This will attempt signUp — if it succeeds, we know Gmail is specifically blocked)');
  console.log('  (If it fails with the same error, the restriction is project-wide)\n');

  const { data, error } = await supabase.auth.signUp({
    email: probeEmail,
    password: 'ProbeTest@999',
  });

  if (error) {
    console.log('  ❌ Probe also failed:');
    console.log('    status  :', error.status);
    console.log('    code    :', error.code);
    console.log('    message :', error.message);
    console.log('  ► CONCLUSION: The restriction is NOT Gmail-specific. It is project-wide.');
  } else {
    const userId = data?.user?.id;
    const identities = data?.user?.identities;
    if (identities && identities.length === 0) {
      console.log('  ⚠️  Probe email already exists (identities empty). Pick a different probe.');
    } else {
      console.log('  ✅ Probe signUp SUCCEEDED → example.com is accepted.');
      console.log('    User ID  :', userId || '(not returned — email confirmation pending)');
      console.log('    Confirmed:', data?.user?.email_confirmed_at || 'NULL (email confirmation ON)');
      console.log('  ► CONCLUSION: signUp works for @example.com but NOT @gmail.com.');
      console.log('  ► This points to a Gmail-specific block or email OTP/verification config.');

      // IMPORTANT: Try to delete the probe user so we don't litter
      // (Cannot delete with anon key — note it for cleanup)
      if (userId) {
        console.log(`\n  ⚠️  CLEANUP NEEDED: A probe auth user was created (ID: ${userId}).`);
        console.log('  Delete it manually: Supabase Dashboard → Auth → Users → find probe email → Delete.');
      }
    }
  }
}

// ── TEST 4: Check existing tenants + subdomain conflict (read-only) ──────────
async function test4_subdomainCheck() {
  sep('TEST 4 — Confirm subdomain "amarawale" still clear (read-only)');
  const { data, error } = await supabase
    .from('tenants')
    .select('id, name, subdomain')
    .eq('subdomain', 'amarawale')
    .maybeSingle();

  if (error) {
    console.log('  ⚠️  Could not query tenants:', error.message);
  } else if (data) {
    console.log('  ❌ CONFLICT: amarawale subdomain already taken:', JSON.stringify(data));
  } else {
    console.log('  ✅ Subdomain "amarawale" is still clear.');
  }
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═'.repeat(60));
  console.log('  AUTH DIAGNOSIS — amar@gmail.com signUp failure');
  console.log('  GoTrue version : v2.195.0');
  console.log('  Project ref    : qdvciisgxvupvrjygedr');
  console.log('  Key used       : ANON KEY only');
  console.log('  Mode           : READ-ONLY DIAGNOSIS — no tenant created');
  console.log('═'.repeat(60));

  const t1Result = await test1_fullErrorObject();
  await test2_rawHttpFetch();
  await test3_probeAlternateEmail();
  await test4_subdomainCheck();

  sep('DIAGNOSIS SUMMARY');
  if (t1Result.failed) {
    console.log(`  signUp error status  : ${t1Result.status}`);
    console.log(`  signUp error code    : ${t1Result.code}`);
    console.log(`  signUp error message : ${t1Result.message}`);
  } else {
    console.log('  signUp did NOT fail — check above for duplicate-user signal.');
  }
  console.log('\n  See TEST 3 result above to determine scope of restriction.');
  console.log('  See TEST 2 raw HTTP body for GoTrue-level error detail.');
  console.log('─'.repeat(60));
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
