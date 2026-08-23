const fs = require('fs');

const data = JSON.parse(fs.readFileSync('C:\\Users\\SAHIL\\.gemini\\antigravity-ide\\brain\\0a07aff7-4808-4938-95d6-7a8e4b4645ad\\scratch\\phase24_db_audit.json', 'utf8'));

console.log('=== PHASE 24 DB AUDIT ===\n');

console.log('1. PUBLIC TABLES INVENTORY');
console.log(`Total tables: ${data.tables.length}`);
const tenantTables = data.tables.filter(t => t.has_tenant_id);
const nonTenantTables = data.tables.filter(t => !t.has_tenant_id);
console.log(`Tenant-scoped tables: ${tenantTables.length}`);
console.log(`Non-tenant-scoped tables: ${nonTenantTables.length}`);
console.log('Non-tenant-scoped tables list:', nonTenantTables.map(t => t.name).join(', '));
console.log('');

console.log('2. RLS STATUS');
const tablesWithoutRls = data.tables.filter(t => !data.rlsStatus[t.name]);
console.log(`Tables without RLS: ${tablesWithoutRls.length}`);
if (tablesWithoutRls.length > 0) {
  console.log('Tables without RLS list:', tablesWithoutRls.map(t => t.name).join(', '));
}
console.log('');

console.log('3. RLS POLICIES WITH SUPER_ADMIN LOGIC');
const superAdminPolicies = data.policies.filter(p => (p.using && p.using.includes('super_admin')) || (p.with_check && p.with_check.includes('super_admin')));
console.log(`Policies referencing super_admin: ${superAdminPolicies.length}`);
superAdminPolicies.forEach(p => {
  console.log(`- ${p.table}: ${p.policy_name}`);
});
console.log('');

console.log('4. POTENTIAL CROSS-TENANT ACCESS POLICIES');
// Policies on tenant-scoped tables that do NOT enforce tenant_id matching
const potentiallyUnsafePolicies = data.policies.filter(p => {
  const isTenantTable = tenantTables.some(t => t.name === p.table);
  if (!isTenantTable) return false;
  
  // A safe policy typically checks tenant_id or uses a secure helper function
  const hasTenantCheck = (p.using && p.using.includes('tenant_id')) || (p.with_check && p.with_check.includes('tenant_id'));
  const hasHelperFunc = (p.using && (p.using.includes('has_feature_access') || p.using.includes('has_role'))) || 
                        (p.with_check && (p.with_check.includes('has_feature_access') || p.with_check.includes('has_role')));
  // Wait, if it has a helper func, we must inspect the helper func.
  // We flag it if it doesn't explicitly check tenant_id, just for review.
  return !hasTenantCheck && !superAdminPolicies.includes(p); // avoid double logging
});

console.log(`Policies on tenant tables missing explicit tenant_id check: ${potentiallyUnsafePolicies.length}`);
potentiallyUnsafePolicies.forEach(p => {
  console.log(`- ${p.table}: ${p.policy_name} | USING: ${p.using} | WITH CHECK: ${p.with_check}`);
});
console.log('');

console.log('5. TENANT_ID INDEXES');
const unindexedTenantTables = tenantTables.filter(t => {
  return !data.indexes.some(idx => idx.table === t.name && idx.columns.includes('tenant_id'));
});
console.log(`Tenant tables missing tenant_id index: ${unindexedTenantTables.length}`);
if (unindexedTenantTables.length > 0) {
  console.log('Unindexed tenant tables list:', unindexedTenantTables.map(t => t.name).join(', '));
}
console.log('');

console.log('6. POPULATE_RECORD_TENANT_DETAILS TRIGGERS');
const brokenTriggers = data.triggers.filter(t => t.action.includes('populate_record_tenant_details'));
console.log(`Triggers using populate_record_tenant_details: ${brokenTriggers.length}`);
if (brokenTriggers.length > 0) {
  brokenTriggers.forEach(t => {
    console.log(`- ${t.table}: ${t.name}`);
  });
}
console.log('');

console.log('7. SECURITY DEFINER FUNCTIONS');
console.log(`Total SECURITY DEFINER functions: ${data.functions.length}`);
data.functions.forEach(f => {
  const hasSuperAdmin = f.body.includes('super_admin');
  const hasAuthUid = f.body.includes('auth.uid()');
  console.log(`- ${f.name} | has_super_admin: ${hasSuperAdmin} | has_auth_uid: ${hasAuthUid}`);
});

