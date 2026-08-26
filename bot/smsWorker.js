const axios = require('axios');
const { supabase } = require('./supabaseClient');

const POLLING_INTERVAL_MS = parseInt(process.env.SMS_WORKER_POLL_INTERVAL) || 10000;
const BATCH_LIMIT = 50;
const RATE_LIMIT_COUNT = parseInt(process.env.SMS_RATE_LIMIT_COUNT) || 3;
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.SMS_RATE_LIMIT_WINDOW) || 60000;

// In-memory rate limiting per tenant
const tenantRateLimits = new Map(); // tenantId -> [timestamps]

const isRateLimited = (tenantId) => {
    const now = Date.now();
    let history = tenantRateLimits.get(tenantId) || [];
    // Clean up old timestamps
    history = history.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
    
    if (history.length >= RATE_LIMIT_COUNT) {
        tenantRateLimits.set(tenantId, history); // Update cleaned history
        return true;
    }
    
    history.push(now);
    tenantRateLimits.set(tenantId, history);
    return false;
};

const releaseLock = async (messageId) => {
    try {
        await supabase
            .from('sms_message_queue')
            .update({ status: 'QUEUED', locked_at: null, attempts: 0 }) // Reset attempts if released due to rate limit
            .eq('id', messageId);
    } catch (err) {
        console.error(`Failed to release lock for message ${messageId}:`, err);
    }
};

const markFailed = async (messageId, reason) => {
    try {
        await supabase
            .from('sms_message_queue')
            .update({ status: 'FAILED', failure_reason: reason })
            .eq('id', messageId);
    } catch (err) {
        console.error(`Failed to mark message ${messageId} as FAILED:`, err);
    }
};

const markSent = async (messageId, providerMessageId) => {
    try {
        await supabase
            .from('sms_message_queue')
            .update({ 
                status: 'SENT', 
                provider_message_id: providerMessageId, 
                sent_at: new Date().toISOString() 
            })
            .eq('id', messageId);
    } catch (err) {
        console.error(`Failed to mark message ${messageId} as SENT:`, err);
    }
};

const processMessage = async (msg) => {
    // 1. Rate Limiting Check
    if (isRateLimited(msg.tenant_id)) {
        console.log(`Rate limit reached for tenant ${msg.tenant_id}. Releasing message ${msg.id}`);
        await releaseLock(msg.id);
        return;
    }

    try {
        // 2. Call httpSMS Provider
        // As verified, from is not strictly required if the device is active, but we pass the payload
        // according to the documented schema. 
        // We will explicitly NOT pass 'from' so httpSMS routes it automatically to the connected phone 
        // associated with the API key, since we don't have the real unmasked number locally.
        const payload = {
            to: msg.recipient_phone,
            content: msg.message_body
        };

        const response = await axios.post('https://api.httpsms.com/v1/messages/send', payload, {
            headers: {
                'x-api-key': msg.api_key,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10s timeout
        });

        // 3. Handle Success
        // httpSMS returns 200 OK with the message object in data
        const providerMessageId = response.data?.data?.id;
        if (!providerMessageId) {
            console.error(`Missing provider ID in response for message ${msg.id}`);
            await markFailed(msg.id, 'Missing provider message ID in success response');
            return;
        }

        await markSent(msg.id, providerMessageId);
        console.log(`Successfully sent message ${msg.id} (Provider ID: ${providerMessageId})`);

    } catch (error) {
        // 4. Handle Errors
        let reason = 'Unknown error';
        let shouldRetry = true;

        if (error.response) {
            const status = error.response.status;
            reason = `HTTP ${status}: ${JSON.stringify(error.response.data)}`;
            
            // Permanent errors shouldn't be retried
            if (status >= 400 && status < 500 && status !== 429) {
                shouldRetry = false;
            }
        } else if (error.request) {
            reason = 'Network Timeout or No Response';
        } else {
            reason = error.message;
        }

        console.error(`Failed to send message ${msg.id}: ${reason}`);

        if (shouldRetry) {
            // We just leave it in SENDING state. 
            // The 5-minute timeout in the SQL query will pick it up again until attempts >= 3
            // Alternatively, we can release it back to QUEUED to retry sooner.
            await releaseLock(msg.id); 
        } else {
            await markFailed(msg.id, reason);
        }
    }
};

const pollQueue = async () => {
    try {
        // Claim messages safely using the RPC
        const { data: messages, error } = await supabase.rpc('claim_sms_messages_for_worker', {
            p_limit: BATCH_LIMIT
        });

        if (error) {
            // If the RPC doesn't exist, this will log the error but not crash the app
            console.error('Error claiming SMS messages:', error);
            return;
        }

        if (!messages || messages.length === 0) {
            return; // Nothing to process
        }

        console.log(`Claimed ${messages.length} messages for processing`);

        // Process sequentially or concurrently. We do concurrently but bounded by Node's event loop
        // Since rate limiting is synchronous locally, we can fire them all.
        const promises = messages.map(msg => processMessage(msg));
        await Promise.allSettled(promises);

    } catch (err) {
        console.error('Fatal error in smsWorker polling loop:', err);
    }
};

const startSmsWorker = () => {
    console.log(`Starting SMS Worker. Polling every ${POLLING_INTERVAL_MS}ms`);
    setInterval(pollQueue, POLLING_INTERVAL_MS);
    
    // Run first poll immediately
    pollQueue();
};

module.exports = startSmsWorker;
