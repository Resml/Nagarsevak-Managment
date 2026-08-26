-- Batch 1: Phase 28 SMS Integration Schema

-- 1. sms_connections table
CREATE TABLE IF NOT EXISTS "public"."sms_connections" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "provider" TEXT NOT NULL DEFAULT 'httpsms',
    "provider_account_id" TEXT,
    "provider_device_id" TEXT,
    "phone_number_masked" TEXT,
    "status" TEXT NOT NULL CHECK ("status" IN ('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'DEVICE_OFFLINE', 'ERROR')),
    "connected_at" TIMESTAMPTZ,
    "last_seen_at" TIMESTAMPTZ,
    "created_by" UUID REFERENCES "auth"."users"("id"),
    "updated_at" TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT "sms_connections_provider_device_id_key" UNIQUE ("provider_device_id"),
    CONSTRAINT "sms_connections_id_tenant_id_key" UNIQUE ("id", "tenant_id")
);

-- Ensure a tenant has only one active httpSMS connection
CREATE UNIQUE INDEX "idx_sms_connections_active_tenant" 
ON "public"."sms_connections" ("tenant_id") 
WHERE "status" != 'DISCONNECTED';

ALTER TABLE "public"."sms_connections" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Select sms_connections" ON "public"."sms_connections" 
FOR SELECT TO "authenticated" 
USING ("tenant_id" IN (SELECT "public"."get_authorized_tenants"()));

-- 2. tenant_secrets table
CREATE TABLE IF NOT EXISTS "public"."tenant_secrets" (
    "tenant_id" UUID PRIMARY KEY REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "httpsms_api_key" TEXT,
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE "public"."tenant_secrets" ENABLE ROW LEVEL SECURITY;
-- Explicitly deny all frontend access to tenant_secrets (backend reads via service_role bypassing RLS)
CREATE POLICY "Deny all frontend access to tenant_secrets" ON "public"."tenant_secrets"
FOR ALL USING (false);

-- 3. sms_campaigns table
CREATE TABLE IF NOT EXISTS "public"."sms_campaigns" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "connection_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "message_body" TEXT NOT NULL,
    "total_recipients" INT NOT NULL,
    "sent_count" INT DEFAULT 0,
    "failed_count" INT DEFAULT 0,
    "status" TEXT NOT NULL CHECK ("status" IN ('QUEUED', 'SENDING', 'PARTIALLY_COMPLETED', 'COMPLETED', 'FAILED', 'CANCELLED')),
    "created_by" UUID NOT NULL REFERENCES "auth"."users"("id"),
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT "sms_campaigns_tenant_idempotency_key" UNIQUE ("tenant_id", "idempotency_key"),
    CONSTRAINT "sms_campaigns_tenant_connection_fkey" FOREIGN KEY ("connection_id", "tenant_id") REFERENCES "public"."sms_connections"("id", "tenant_id") ON DELETE CASCADE
);

ALTER TABLE "public"."sms_campaigns" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Select sms_campaigns" ON "public"."sms_campaigns"
FOR SELECT TO "authenticated"
USING ("tenant_id" IN (SELECT "public"."get_authorized_tenants"()));

CREATE POLICY "Tenant Insert sms_campaigns" ON "public"."sms_campaigns"
FOR INSERT TO "authenticated"
WITH CHECK ("tenant_id" IN (SELECT "public"."get_authorized_tenants"()));

CREATE POLICY "Tenant Update sms_campaigns" ON "public"."sms_campaigns"
FOR UPDATE TO "authenticated"
USING ("tenant_id" IN (SELECT "public"."get_authorized_tenants"()));


-- 4. sms_message_queue table
CREATE TABLE IF NOT EXISTS "public"."sms_message_queue" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "campaign_id" UUID NOT NULL REFERENCES "public"."sms_campaigns"("id") ON DELETE CASCADE,
    "recipient_phone" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "status" TEXT NOT NULL CHECK ("status" IN ('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED')),
    "failure_reason" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "sent_at" TIMESTAMPTZ,
    CONSTRAINT "sms_message_queue_campaign_phone_key" UNIQUE ("campaign_id", "recipient_phone")
);

ALTER TABLE "public"."sms_message_queue" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Select sms_message_queue" ON "public"."sms_message_queue"
FOR SELECT TO "authenticated"
USING ("tenant_id" IN (SELECT "public"."get_authorized_tenants"()));
-- Insert/Update handled by backend using service_role, no frontend policies needed for mutation.
