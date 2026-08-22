import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { timingSafeEqual } from "https://deno.land/std@0.168.0/crypto/timing_safe_equal.ts";

interface LetterStatusWebhookPayload {
    type: string
    table: string
    record: {
        id: string
        user_id: string
        tenant_id: string
        type: string
        status: string
        pdf_url?: string
    }
    old_record: {
        status: string
    }
}

function verifyAuthHeader(req: Request): boolean {
    // We check for a dedicated webhook secret header instead of the public anon key.
    const authHeader = req.headers.get('Webhook-Secret') || req.headers.get('x-webhook-secret')
    if (!authHeader) return false

    const configuredSecret = Deno.env.get('DB_WEBHOOK_SECRET')
    if (!configuredSecret) return false
    
    // Constant-time string comparison to prevent timing attacks
    const encoder = new TextEncoder()
    const a = encoder.encode(authHeader)
    const b = encoder.encode(configuredSecret)

    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
}

serve(async (req) => {
    try {
        // 1. Verify exact webhook authentication format configured for this project
        // As documented in deploy-notifications.sh step 5, the webhook is configured
        // to send a dedicated Webhook-Secret header.
        if (!verifyAuthHeader(req)) {
            console.error('Webhook authentication failed: Invalid or missing Webhook-Secret header')
            return new Response(JSON.stringify({ error: 'Unauthorized payload signature' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // Parse the webhook payload
        const payload: LetterStatusWebhookPayload = await req.json()
        
        // Validate payload schema
        if (!payload || !payload.record || !payload.old_record || !payload.record.id) {
             console.error('Invalid webhook payload schema')
             return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 })
        }

        // Only process if status changed from Pending to Approved/Rejected
        if (payload.old_record.status === 'Pending' &&
            ['Approved', 'Rejected'].includes(payload.record.status)) {

            console.log(`Letter ${payload.record.id} status changed to ${payload.record.status}`)

            // Get bot webhook URL from environment
            const botWebhookUrl = Deno.env.get('BOT_WEBHOOK_URL')
            const webhookSecret = Deno.env.get('WEBHOOK_SECRET')

            if (!botWebhookUrl) {
                console.error('BOT_WEBHOOK_URL not configured')
                return new Response(JSON.stringify({ error: 'Bot webhook URL not configured' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                })
            }

            // Call bot webhook
            const response = await fetch(`${botWebhookUrl}/webhook/letter-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Secret': webhookSecret || ''
                },
                body: JSON.stringify({
                    type: 'letter_status_change',
                    letter_id: payload.record.id,
                    user_id: payload.record.user_id,
                    status: payload.record.status,
                    letter_type: payload.record.type,
                    tenant_id: payload.record.tenant_id,
                    pdf_url: payload.record.pdf_url
                })
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error(`Bot webhook failed: ${response.status} - ${errorText}`)
                return new Response(JSON.stringify({
                    error: 'Bot webhook failed',
                    details: errorText
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                })
            }

            const result = await response.json()
            console.log(`Notification sent successfully:`, result)

            return new Response(JSON.stringify({
                success: true,
                message: 'Notification sent',
                details: result
            }), {
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // Status didn't change from Pending, ignore
        return new Response(JSON.stringify({
            success: true,
            message: 'No notification needed'
        }), {
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('Edge Function error:', error)
        return new Response(JSON.stringify({
            error: 'Internal server error',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
})
