-- Phase 28 Batch 5 Updates: SMS Campaign & Queue modifications

-- 1. Relax the status constraint on sms_campaigns to include 'INITIALIZING'
ALTER TABLE "public"."sms_campaigns" DROP CONSTRAINT IF EXISTS "sms_campaigns_status_check";
ALTER TABLE "public"."sms_campaigns" ADD CONSTRAINT "sms_campaigns_status_check" 
CHECK ("status" IN ('INITIALIZING', 'QUEUED', 'SENDING', 'PARTIALLY_COMPLETED', 'COMPLETED', 'FAILED', 'CANCELLED'));

-- 2. Add locking and retry columns to sms_message_queue for worker safe processing
ALTER TABLE "public"."sms_message_queue" ADD COLUMN IF NOT EXISTS "locked_at" TIMESTAMPTZ;
ALTER TABLE "public"."sms_message_queue" ADD COLUMN IF NOT EXISTS "attempts" INT DEFAULT 0;

-- 3. Add an index to speed up the worker polling query
CREATE INDEX IF NOT EXISTS "idx_sms_message_queue_worker" 
ON "public"."sms_message_queue" ("status", "created_at")
WHERE "status" IN ('QUEUED', 'SENDING');

-- 4. RPC for safe worker claiming
CREATE OR REPLACE FUNCTION claim_sms_messages_for_worker(p_limit INT)
RETURNS TABLE (
    id UUID,
    tenant_id UUID,
    campaign_id UUID,
    recipient_phone TEXT,
    message_body TEXT,
    from_phone TEXT,
    api_key TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH claimed AS (
        SELECT q.id
        FROM sms_message_queue q
        JOIN sms_campaigns c ON c.id = q.campaign_id
        JOIN sms_connections conn ON conn.id = c.connection_id
        WHERE (q.status = 'QUEUED' OR (q.status = 'SENDING' AND q.locked_at < NOW() - INTERVAL '5 minutes'))
        AND q.attempts < 3
        AND conn.status = 'CONNECTED'
        ORDER BY q.created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT p_limit
    )
    UPDATE sms_message_queue u
    SET status = 'SENDING', locked_at = NOW(), attempts = COALESCE(u.attempts, 0) + 1
    FROM claimed
    JOIN sms_message_queue sq ON sq.id = claimed.id
    JOIN sms_campaigns sc ON sc.id = sq.campaign_id
    JOIN sms_connections sconn ON sconn.id = sc.connection_id
    JOIN tenant_secrets ts ON ts.tenant_id = sq.tenant_id
    WHERE u.id = claimed.id
    RETURNING 
        u.id, 
        u.tenant_id, 
        u.campaign_id, 
        u.recipient_phone, 
        sc.message_body, 
        sconn.phone_number_masked AS from_phone, 
        ts.httpsms_api_key AS api_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
