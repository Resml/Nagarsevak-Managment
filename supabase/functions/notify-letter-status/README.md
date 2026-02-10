# Supabase Edge Function: notify-letter-status

This Edge Function triggers WhatsApp notifications when a letter request status changes from "Pending" to "Approved" or "Rejected".

## How It Works

1. **Trigger**: Supabase Database Webhook on `letter_requests` table UPDATE events
2. **Check**: Verifies if status changed from `Pending` → `Approved/Rejected`
3. **Call**: Sends HTTP POST to bot's `/webhook/letter-status` endpoint
4. **Result**: Bot sends WhatsApp notification to user

## Deployment

### 1. Deploy Edge Function
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy function
supabase functions deploy notify-letter-status
```

### 2. Set Environment Variables
```bash
# Set bot webhook URL
supabase secrets set BOT_WEBHOOK_URL=https://nagarsevak-managment-1.onrender.com

# Set webhook secret (same as in bot's .env)
supabase secrets set WEBHOOK_SECRET=your-secret-key-here
```

### 3. Configure Database Webhook

1. Go to **Supabase Dashboard** → Your Project → **Database** → **Webhooks**
2. Click **Create a new hook**
3. Configure:
   - **Name**: `notify-letter-status-webhook`
   - **Table**: `letter_requests`
   - **Events**: Check `Update`
   - **Type**: `HTTP Request`
   - **Method**: `POST`
   - **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-letter-status`
   - **HTTP Headers**: 
     - Add `Authorization: Bearer YOUR_ANON_KEY`
4. Click **Create webhook**

## Testing

### Test Locally
```bash
# Start function locally
supabase functions serve notify-letter-status --env-file ./supabase/.env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/notify-letter-status \
  -H "Content-Type: application/json" \
  -d '{
    "type": "UPDATE",
    "table": "letter_requests",
    "record": {
      "id": "test-id",
      "user_id": "1234567890",
      "tenant_id": "bf4c7152-6006-41b5-9c7d-84c76ea67da4",
      "type": "Income Certificate",
      "status": "Approved"
    },
    "old_record": {
      "status": "Pending"
    }
  }'
```

### Test in Production
1. Update a letter request status in Supabase Dashboard
2. Check Edge Function logs: Dashboard → Edge Functions → notify-letter-status → Logs
3. Check bot logs on Render
4. Verify WhatsApp message received

## Troubleshooting

**Edge Function not triggering:**
- Check webhook is correctly configured in Database → Webhooks
- Verify table name is `letter_requests` (exact match)
- Check Edge Function logs for errors

**Bot not receiving webhook:**
- Verify `BOT_WEBHOOK_URL` is set correctly
- Check bot is running and accessible
- Verify `WEBHOOK_SECRET` matches on both sides
- Check Render logs for incoming webhook requests

**User not receiving WhatsApp message:**
- Check bot is connected (status: connected)
- Verify user has interacted with bot before
- Check bot logs for "Notification sent" message
- Verify user_id format is correct (phone number without @s.whatsapp.net)

## Environment Variables Required

### Supabase Edge Function
- `BOT_WEBHOOK_URL`: https://nagarsevak-managment-1.onrender.com
- `WEBHOOK_SECRET`: Same secret as bot (for authentication)

### Bot (Render)
- `WEBHOOK_SECRET`: Secret key for webhook authentication
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

## Flow Diagram

```
Database Update → Webhook → Edge Function → Bot Webhook → WhatsApp Message
                    ↓           ↓              ↓             ↓
               letter_requests  Verify &      Get user     Send
               status changes   call bot      language     notification
```
