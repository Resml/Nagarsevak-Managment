BEGIN;
SELECT plan(15);

-- 1. Verify tables exist
SELECT has_table('public', 'sms_connections', 'Table sms_connections exists');
SELECT has_table('public', 'tenant_secrets', 'Table tenant_secrets exists');
SELECT has_table('public', 'sms_campaigns', 'Table sms_campaigns exists');
SELECT has_table('public', 'sms_message_queue', 'Table sms_message_queue exists');

-- 2. Verify RLS is enabled
SELECT tables_are_secure('public');

-- 3. Verify Foreign Keys and Constraints
SELECT has_fk('public', 'sms_connections', 'Table sms_connections has FKs');
SELECT has_fk('public', 'sms_campaigns', 'Table sms_campaigns has FKs');
-- Verify that connection_id and tenant_id are jointly referenced
SELECT col_is_fk('public', 'sms_campaigns', ARRAY['connection_id', 'tenant_id'], 'Campaign correctly enforces tenant-owned connection');

-- 4. Verify Unique Constraints
SELECT has_index('public', 'sms_connections', 'idx_sms_connections_active_tenant', 'Enforces only one active connection per tenant');
SELECT has_unique('public', 'sms_connections', 'sms_connections_provider_device_id_key', 'Enforces provider_device_id uniqueness');
SELECT has_unique('public', 'sms_campaigns', 'sms_campaigns_tenant_idempotency_key', 'Enforces idempotency per tenant');

-- 5. Test RLS for tenant_secrets (Ensure frontend access is blocked)
SET ROLE authenticated;
-- Expecting 0 results since USING (false)
SELECT is_empty(
    'SELECT * FROM public.tenant_secrets',
    'Authenticated users cannot read tenant_secrets'
);

-- Try to insert into tenant_secrets as authenticated (should fail)
SELECT throws_ok(
    $$ INSERT INTO public.tenant_secrets (tenant_id, httpsms_api_key) VALUES ('00000000-0000-0000-0000-000000000000', 'secret') $$,
    'new row violates row-level security policy for table "tenant_secrets"',
    'Authenticated users cannot insert into tenant_secrets'
);

-- Revert to postgres/service_role
RESET ROLE;

-- Ensure service_role CAN insert and read tenant_secrets
INSERT INTO public.tenants (id, name, subdomain) VALUES ('00000000-0000-0000-0000-000000000000', 'Test Tenant', 'test');
INSERT INTO public.tenant_secrets (tenant_id, httpsms_api_key) VALUES ('00000000-0000-0000-0000-000000000000', 'my-api-key');

SELECT results_eq(
    $$ SELECT httpsms_api_key FROM public.tenant_secrets WHERE tenant_id = '00000000-0000-0000-0000-000000000000' $$,
    $$ VALUES ('my-api-key'::text) $$,
    'Service role can read and write tenant_secrets'
);

SELECT * FROM finish();
ROLLBACK;
