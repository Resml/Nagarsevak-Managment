import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface LetterStatusWebhookPayload {
    type: string
    table: string
    record: {
        id: string
        user_id: string
        tenant_id: string
        type: string
        status: string
    }
    old_record: {
        status: string
    }
}

serve(async (req) => {
    try {
        // Parse the webhook payload
        const payload: LetterStatusWebhookPayload = await req.json()

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
                    tenant_id: payload.record.tenant_id
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

    } catch (error) {
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
