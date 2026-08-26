const express = require('express');
const axios = require('axios');
const { supabase } = require('./supabaseClient');

const router = express.Router();

// Middleware to resolve tenant from auth token and verify RBAC
const requireSmsAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid Authorization header' });
        }
        
        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
            return res.status(401).json({ error: 'Unauthorized or expired token' });
        }

        // Derive tenant_id entirely server-side without trusting the frontend
        const { data: mappings, error: mappingError } = await supabase
            .from('user_tenant_mapping')
            .select('tenant_id, role')
            .eq('user_id', user.id);

        if (mappingError || !mappings || mappings.length === 0) {
            return res.status(403).json({ error: 'User is not assigned to any tenant' });
        }

        // Use the first mapped tenant. If multiple tenants exist, this guarantees we only operate on an explicitly authorized one.
        // In a true multi-workspace app, we'd need a secure session-bound workspace selector.
        const mapping = mappings[0];
        
        // RBAC Check: Ensure user is admin or super_admin
        if (!['admin', 'super_admin'].includes(mapping.role)) {
            // Log unauthorized attempt
            await logAudit(mapping.tenant_id, user.id, 'SMS_UNAUTHORIZED_ATTEMPT', { action: req.path });
            return res.status(403).json({ error: 'Requires admin privileges to manage SMS connections' });
        }

        req.resolvedTenantId = mapping.tenant_id;
        req.userId = user.id;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ error: 'Internal server error during authentication' });
    }
};

// Helper for audit logging
async function logAudit(tenantId, userId, action, metadata = {}) {
    try {
        // We log to a generic audit_logs table or message_logs if an audit table doesn't exist
        // Since we didn't create a specific audit_logs table in Batch 1, we use console or a hypothetical audit_logs
        console.log(`[AUDIT] ${action} | Tenant: ${tenantId} | User: ${userId} | Meta: ${JSON.stringify(metadata)}`);
    } catch (e) {
        console.error('Audit log failed', e);
    }
}

// GET /api/sms/connections
router.get('/', requireSmsAdmin, async (req, res) => {
    try {
        const tenantId = req.resolvedTenantId;
        const { data, error } = await supabase
            .from('sms_connections')
            .select('id, provider, provider_account_id, provider_device_id, phone_number_masked, status, connected_at, last_seen_at')
            .eq('tenant_id', tenantId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is no rows returned
            console.error('Error fetching connection:', error);
            return res.status(500).json({ error: 'Failed to fetch connection metadata' });
        }

        if (!data) {
            return res.json(null); // No connection exists
        }

        // Explicitly NEVER return secrets
        return res.json(data);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/sms/connections/link
router.post('/link', requireSmsAdmin, async (req, res) => {
    const tenantId = req.resolvedTenantId;
    const userId = req.userId;
    const { apiKey } = req.body;

    if (!apiKey) {
        await logAudit(tenantId, userId, 'SMS_CONNECTION_FAILED', { reason: 'Missing API Key' });
        return res.status(400).json({ error: 'API Key is required' });
    }

    try {
        await logAudit(tenantId, userId, 'SMS_CONNECTION_LINK_REQUESTED');

        // 1. Validate API key against actual httpSMS API
        // According to httpSMS docs, the auth header is x-api-key. The endpoint is /v1/phones or /v1/users/me
        let phoneData;
        try {
            const httpsmsRes = await axios.get('https://api.httpsms.com/v1/phones', {
                headers: { 'x-api-key': apiKey }
            });
            phoneData = httpsmsRes.data;
        } catch (apiErr) {
            await logAudit(tenantId, userId, 'SMS_CONNECTION_FAILED', { reason: 'Invalid API Key' });
            return res.status(401).json({ error: 'Invalid httpSMS API key' });
        }

        // Handle httpSMS response format (typically { data: { phones: [...] } })
        // We take the first phone connected to that account
        const phones = phoneData?.data?.phones || phoneData?.data || [];
        if (!Array.isArray(phones) || phones.length === 0) {
            await logAudit(tenantId, userId, 'SMS_CONNECTION_FAILED', { reason: 'No phones registered on httpSMS account' });
            return res.status(400).json({ error: 'No Android phone is registered on this httpSMS account. Please install the app and sign in first.' });
        }

        const phone = phones[0];
        const providerDeviceId = phone.id;
        const phoneNumber = phone.phone_number;
        const maskedPhone = phoneNumber ? phoneNumber.substring(0, 4) + '******' + phoneNumber.slice(-4) : 'Unknown';

        // 2. Check device uniqueness
        const { data: existingDevice } = await supabase
            .from('sms_connections')
            .select('tenant_id')
            .eq('provider_device_id', providerDeviceId)
            .single();

        if (existingDevice && existingDevice.tenant_id !== tenantId) {
            await logAudit(tenantId, userId, 'SMS_CONNECTION_FAILED', { reason: 'Device belongs to another tenant' });
            return res.status(409).json({ error: 'This phone is already connected to another tenant.' });
        }

        // 3. Check if tenant already has an active connection
        const { data: activeConnections } = await supabase
            .from('sms_connections')
            .select('id')
            .eq('tenant_id', tenantId)
            .neq('status', 'DISCONNECTED');

        if (activeConnections && activeConnections.length > 0) {
            await logAudit(tenantId, userId, 'SMS_CONNECTION_FAILED', { reason: 'Tenant already has an active connection' });
            return res.status(409).json({ error: 'Tenant already has an active SMS connection. Disconnect it first.' });
        }

        // 4. Store credential securely using service_role bypassing frontend RLS
        // We use the service_role key initialized in supabaseClient
        const { error: secretError } = await supabase
            .from('tenant_secrets')
            .upsert({ tenant_id: tenantId, httpsms_api_key: apiKey }, { onConflict: 'tenant_id' });

        if (secretError) {
            console.error('Secret Error:', secretError);
            throw new Error('Failed to securely store credential');
        }

        // 5. Store non-secret metadata
        const { data: connection, error: connError } = await supabase
            .from('sms_connections')
            .insert({
                tenant_id: tenantId,
                provider: 'httpsms',
                provider_device_id: providerDeviceId,
                phone_number_masked: maskedPhone,
                status: 'CONNECTED',
                connected_at: new Date().toISOString(),
                created_by: userId
            })
            .select()
            .single();

        if (connError) {
            // Rollback secret if metadata fails
            await supabase.from('tenant_secrets').delete().eq('tenant_id', tenantId);
            throw new Error('Failed to create connection metadata');
        }

        await logAudit(tenantId, userId, 'SMS_CONNECTION_LINKED', { connection_id: connection.id });
        
        // Never return the API key
        return res.json({ success: true, connection });

    } catch (err) {
        console.error('Link Error:', err);
        return res.status(500).json({ error: 'Internal server error during connection linking' });
    }
});

// POST /api/sms/connections/disconnect
router.post('/disconnect', requireSmsAdmin, async (req, res) => {
    const tenantId = req.resolvedTenantId;
    const userId = req.userId;

    try {
        // Verify active connection
        const { data: connection } = await supabase
            .from('sms_connections')
            .select('id')
            .eq('tenant_id', tenantId)
            .neq('status', 'DISCONNECTED')
            .single();

        if (!connection) {
            return res.status(400).json({ error: 'No active connection found' });
        }

        // 1. Delete/Revoke credential
        await supabase.from('tenant_secrets').delete().eq('tenant_id', tenantId);

        // 2. Mark connection DISCONNECTED
        await supabase
            .from('sms_connections')
            .update({ status: 'DISCONNECTED', updated_at: new Date().toISOString() })
            .eq('id', connection.id)
            .eq('tenant_id', tenantId);

        // 3. Mark queued campaigns/messages as FAILED (state machine transition handled separately or here)
        await supabase
            .from('sms_campaigns')
            .update({ status: 'FAILED' })
            .eq('connection_id', connection.id)
            .eq('tenant_id', tenantId)
            .in('status', ['QUEUED', 'SENDING']);

        await logAudit(tenantId, userId, 'SMS_CONNECTION_DISCONNECTED', { connection_id: connection.id });
        return res.json({ success: true, message: 'Disconnected successfully' });

    } catch (err) {
        console.error('Disconnect Error:', err);
        return res.status(500).json({ error: 'Failed to disconnect SMS connection' });
    }
});

// POST /api/sms/connections/test
router.post('/test', requireSmsAdmin, async (req, res) => {
    const tenantId = req.resolvedTenantId;
    const userId = req.userId;
    const { targetPhone } = req.body;

    if (!targetPhone) {
        return res.status(400).json({ error: 'targetPhone is required' });
    }

    try {
        await logAudit(tenantId, userId, 'SMS_TEST_REQUESTED', { target: targetPhone.substring(0,4) + '***' });

        // Verify connection exists and is CONNECTED
        const { data: connection } = await supabase
            .from('sms_connections')
            .select('id, status, provider_device_id')
            .eq('tenant_id', tenantId)
            .eq('status', 'CONNECTED')
            .single();

        if (!connection) {
            await logAudit(tenantId, userId, 'SMS_TEST_FAILED', { reason: 'No active connection' });
            return res.status(400).json({ error: 'No active SMS connection' });
        }

        // Retrieve securely stored API Key using Service Role
        const { data: secret } = await supabase
            .from('tenant_secrets')
            .select('httpsms_api_key')
            .eq('tenant_id', tenantId)
            .single();

        if (!secret || !secret.httpsms_api_key) {
            await logAudit(tenantId, userId, 'SMS_TEST_FAILED', { reason: 'Missing credentials' });
            return res.status(500).json({ error: 'Connection credentials are missing. Please disconnect and relink.' });
        }

        // Execute httpSMS API call for Test Message
        // Actual httpSMS send endpoint: POST /v1/messages/send
        // Payload: { content: "...", to: "+1234567890", from: "+0987654321" } (if 'from' is omitted, uses default phone)
        try {
            await axios.post('https://api.httpsms.com/v1/messages/send', {
                content: "This is a test message from your Nagarsevak Management application.",
                to: targetPhone
            }, {
                headers: {
                    'x-api-key': secret.httpsms_api_key,
                    'Content-Type': 'application/json'
                }
            });

            await logAudit(tenantId, userId, 'SMS_TEST_COMPLETED');
            return res.json({ success: true, message: 'Test SMS dispatched successfully' });

        } catch (apiErr) {
            const apiReason = apiErr.response?.data || apiErr.message;
            console.error('httpSMS send error:', apiReason);
            await logAudit(tenantId, userId, 'SMS_TEST_FAILED', { reason: 'Provider API rejected the message' });
            return res.status(502).json({ error: 'SMS Provider failed to send the message' });
        }

    } catch (err) {
        console.error('Test SMS Error:', err);
        return res.status(500).json({ error: 'Failed to send test SMS' });
    }
});

// POST /api/sms/campaigns
router.post('/campaigns', requireSmsAdmin, async (req, res) => {
    const tenantId = req.resolvedTenantId;
    const userId = req.userId;
    const { name, messageBody, voterIds, idempotencyKey } = req.body;

    if (!name || !messageBody || !Array.isArray(voterIds) || voterIds.length === 0 || !idempotencyKey) {
        return res.status(400).json({ error: 'name, messageBody, voterIds, and idempotencyKey are required' });
    }

    try {
        await logAudit(tenantId, userId, 'SMS_CAMPAIGN_CREATE_REQUESTED', { name, voter_count: voterIds.length });

        // 1. Verify Active Connection
        const { data: connection } = await supabase
            .from('sms_connections')
            .select('id, status')
            .eq('tenant_id', tenantId)
            .eq('status', 'CONNECTED')
            .single();

        if (!connection) {
            return res.status(400).json({ error: 'No active connected SMS gateway found. Please connect your Android device first.' });
        }

        // 2. Resolve Recipients Server-Side (Tenant Isolation)
        // Note: voters.id is bigint
        const { data: voters, error: votersError } = await supabase
            .from('voters')
            .select('id, mobile')
            .eq('tenant_id', tenantId)
            .in('id', voterIds);

        if (votersError) {
            console.error('Error fetching voters for campaign:', votersError);
            return res.status(500).json({ error: 'Failed to resolve recipient data' });
        }

        if (!voters || voters.length === 0) {
            return res.status(400).json({ error: 'None of the provided voters exist or belong to this tenant' });
        }

        // 3. Normalize and Deduplicate Numbers
        const validNumbers = new Set();
        for (const v of voters) {
            let num = v.mobile;
            if (!num) continue;
            num = num.replace(/\D/g, ''); // Remove non-digits
            if (num.length === 10) num = '+91' + num;
            else if (num.length === 12 && num.startsWith('91')) num = '+' + num;
            else if (num.startsWith('0') && num.length === 11) num = '+91' + num.substring(1);
            
            if (num.length >= 12 && num.startsWith('+')) {
                validNumbers.add(num);
            }
        }

        const finalRecipients = Array.from(validNumbers);
        if (finalRecipients.length === 0) {
            return res.status(400).json({ error: 'No valid mobile numbers found for the selected voters' });
        }

        // 4. Create Campaign in INITIALIZING state
        const { data: campaign, error: campaignError } = await supabase
            .from('sms_campaigns')
            .insert({
                tenant_id: tenantId,
                connection_id: connection.id,
                name: name,
                idempotency_key: idempotencyKey,
                message_body: messageBody,
                total_recipients: finalRecipients.length,
                status: 'INITIALIZING',
                created_by: userId
            })
            .select('id, status')
            .single();

        if (campaignError) {
            if (campaignError.code === '23505') { // Unique violation for idempotency key
                // Fetch the existing campaign to resume
                const { data: existing } = await supabase
                    .from('sms_campaigns')
                    .select('id, status')
                    .eq('tenant_id', tenantId)
                    .eq('idempotency_key', idempotencyKey)
                    .single();
                
                if (existing) {
                    return res.status(200).json({ 
                        success: true, 
                        campaignId: existing.id, 
                        status: existing.status,
                        resumed: true 
                    });
                }
                return res.status(409).json({ error: 'A campaign with this idempotency key already exists' });
            }
            console.error('Error creating campaign:', campaignError);
            return res.status(500).json({ error: 'Failed to create campaign record' });
        }

        // 5. Populate Queue
        const queuePayload = finalRecipients.map(phone => ({
            tenant_id: tenantId,
            campaign_id: campaign.id,
            recipient_phone: phone,
            status: 'QUEUED'
        }));

        // Batch insert queue items in chunks of 1000 to avoid request size limits
        const chunkSize = 1000;
        let queueSuccess = true;
        for (let i = 0; i < queuePayload.length; i += chunkSize) {
            const chunk = queuePayload.slice(i, i + chunkSize);
            const { error: queueError } = await supabase
                .from('sms_message_queue')
                .insert(chunk);
                
            if (queueError) {
                console.error(`Error inserting queue chunk ${i}:`, queueError);
                queueSuccess = false;
                break;
            }
        }

        if (!queueSuccess) {
            // Mark campaign as failed so it is never dispatched
            await supabase.from('sms_campaigns').update({ status: 'FAILED' }).eq('id', campaign.id).eq('tenant_id', tenantId);
            return res.status(500).json({ error: 'Failed to enqueue all messages' });
        }

        // All chunks successful, transition to QUEUED
        await supabase.from('sms_campaigns').update({ status: 'QUEUED' }).eq('id', campaign.id).eq('tenant_id', tenantId);

        await logAudit(tenantId, userId, 'SMS_CAMPAIGN_QUEUED', { campaign_id: campaign.id, recipients: finalRecipients.length });
        
        return res.json({ 
            success: true, 
            campaignId: campaign.id, 
            status: 'QUEUED',
            queuedCount: finalRecipients.length,
            ignoredCount: voterIds.length - finalRecipients.length 
        });

    } catch (err) {
        console.error('Campaign creation error:', err);
        return res.status(500).json({ error: 'Internal server error while creating campaign' });
    }
});

// GET /api/sms/campaigns/:id
router.get('/campaigns/:id', requireSmsAdmin, async (req, res) => {
    const tenantId = req.resolvedTenantId;
    const campaignId = req.params.id;

    try {
        const { data: campaign, error } = await supabase
            .from('sms_campaigns')
            .select(`
                id, name, status, total_recipients, sent_count, failed_count, created_at,
                queue:sms_message_queue(status)
            `)
            .eq('tenant_id', tenantId)
            .eq('id', campaignId)
            .single();

        if (error || !campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // Aggregate current queue state safely
        const stats = {
            QUEUED: 0,
            SENDING: 0,
            SENT: 0,
            DELIVERED: 0,
            FAILED: 0
        };

        if (campaign.queue) {
            campaign.queue.forEach(q => {
                if (stats[q.status] !== undefined) stats[q.status]++;
            });
        }

        return res.json({
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            total_recipients: campaign.total_recipients,
            stats,
            created_at: campaign.created_at
        });

    } catch (err) {
        console.error('Get campaign error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/sms/webhook
// This endpoint receives delivery updates from httpSMS. It does not use requireSmsAdmin 
// because it's called by an external service. Authentication relies on verifying the payload or secret.
// For now, we rely on the strict matching of provider_message_id to our queue.
router.post('/webhook', async (req, res) => {
    try {
        const payload = req.body;
        
        // httpSMS webhook schema typically includes the message object or event details.
        // We look for the provider_message_id and the event type/status.
        // Depending on exact schema, it might be payload.data.id or payload.message.id and payload.type
        const providerMessageId = payload?.message?.id || payload?.data?.id || payload?.id;
        const eventType = (payload?.type || payload?.event || payload?.status || '').toUpperCase();

        if (!providerMessageId || !eventType) {
            return res.status(400).json({ error: 'Missing required webhook fields' });
        }

        // 1. Resolve tenant & campaign strictly from our DB using provider_message_id
        const { data: queueItem, error: fetchError } = await supabase
            .from('sms_message_queue')
            .select('id, campaign_id, tenant_id, status')
            .eq('provider_message_id', providerMessageId)
            .single();
            
        if (fetchError || !queueItem) {
            // Not our message, or already deleted. Ignore safely.
            return res.status(200).json({ success: true, note: 'Unknown message ID ignored' });
        }

        // 2. Map provider event to our status
        let newStatus = null;
        if (eventType.includes('DELIVERED')) newStatus = 'DELIVERED';
        else if (eventType.includes('FAILED')) newStatus = 'FAILED';
        // We don't downgrade a DELIVERED message back to SENT, etc.

        if (!newStatus || queueItem.status === newStatus || queueItem.status === 'DELIVERED' || queueItem.status === 'FAILED') {
            // No state change needed, or it's already in a terminal state
            return res.status(200).json({ success: true, note: 'No valid state transition' });
        }

        // 3. Update the queue record
        const { error: updateError } = await supabase
            .from('sms_message_queue')
            .update({ status: newStatus })
            .eq('id', queueItem.id)
            .eq('tenant_id', queueItem.tenant_id); // Explicitly constrain by tenant

        if (updateError) {
            console.error('Failed to update queue on webhook:', updateError);
            return res.status(500).json({ error: 'Database update failed' });
        }

        // 4. Safely increment campaign counters based on transition
        // We use an RPC call or execute it cleanly so we don't blind increment
        // Since we know the exact transition, we can just increment the respective counter
        if (newStatus === 'DELIVERED') {
            // This is a naive increment; a real robust system uses a DB function or derived counts
            // For now, this is safer than accepting arbitrary counts from webhook
            await supabase.rpc('increment_campaign_counter', {
                p_campaign_id: queueItem.campaign_id,
                p_counter_name: 'delivered_count'
            });
        } else if (newStatus === 'FAILED') {
             await supabase.rpc('increment_campaign_counter', {
                p_campaign_id: queueItem.campaign_id,
                p_counter_name: 'failed_count'
            });
        }

        return res.status(200).json({ success: true });

    } catch (err) {
        console.error('Webhook processing error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
