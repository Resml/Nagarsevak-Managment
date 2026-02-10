-- =============================================================================
-- COMPLETE TEST SCRIPT FOR LETTER NOTIFICATION SYSTEM
-- =============================================================================
-- Run this script in Supabase SQL Editor to test the entire notification flow
-- =============================================================================

-- STEP 1: Check if any letter requests exist
SELECT 
    id,
    user_id,
    tenant_id,
    type,
    status,
    created_at,
    details
FROM letter_requests
WHERE tenant_id = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4'
ORDER BY created_at DESC
LIMIT 10;

-- If no results, create a test letter request:
INSERT INTO letter_requests (
    user_id,
    tenant_id,
    type,
    area,
    details,
    status
) VALUES (
    '7058731515',  -- Replace with your WhatsApp number
    'bf4c7152-6006-41b5-9c7d-84c76ea67da4',
    'Test Certificate',
    '',
    '{
        "name": "Test User",
        "mobile": "7058731515",
        "text": "Test Address",
        "purpose": "Testing notification system"
    }'::jsonb,
    'Pending'
);

-- STEP 2: Get the ID of a pending request to test
-- Copy the 'id' value from the results above and use it below

-- STEP 3: Test the notification by updating status
-- REPLACE 'YOUR_LETTER_REQUEST_ID' with actual ID from Step 1
-- Uncomment the line below and replace the ID:

-- UPDATE letter_requests 
-- SET status = 'Approved' 
-- WHERE id = 'YOUR_LETTER_REQUEST_ID';

-- EXPECTED BEHAVIOR:
-- 1. Database webhook triggers immediately
-- 2. Edge Function receives the update event  
-- 3. Edge Function calls bot webhook
-- 4. Bot sends WhatsApp message to user_id (7058731515)
-- 5. User receives message in Marathi (default):
--    "✅ *पत्र विनंती मंजूर झाली!*
--     
--     तुमची Test Certificate विनंती मंजूर झाली आहे.
--     
--     📄 तुम्ही कार्यालयीन वेळेत तुमचे पत्र घेऊ शकता."

-- STEP 4: To test rejection, reset and update again
-- UPDATE letter_requests 
-- SET status = 'Pending' 
-- WHERE id = 'YOUR_LETTER_REQUEST_ID';

-- Then update to Rejected:
-- UPDATE letter_requests 
-- SET status = 'Rejected' 
-- WHERE id = 'YOUR_LETTER_REQUEST_ID';

-- STEP 5: Check webhook was triggered
-- Go to: https://app.supabase.com/project/qdvciisgxvupvrjygedr/functions/notify-letter-status/logs
-- Look for: "Letter {id} status changed to Approved"

-- STEP 6: Check bot received webhook  
-- Go to: https://dashboard.render.com (your bot service → Logs)
-- Look for: "[bf4c7152...] Letter status notification sent to 7058731515"

-- =============================================================================
-- TROUBLESHOOTING QUERIES
-- =============================================================================

-- Check all letter requests
SELECT COUNT(*) as total_requests FROM letter_requests;

-- Check pending requests
SELECT COUNT(*) as pending_count 
FROM letter_requests 
WHERE status = 'Pending';

-- Check if user_id format is correct (should be phone number only)
SELECT 
    id,
    user_id,
    CASE 
        WHEN user_id ~ '^[0-9]{10}$' THEN 'Valid'
        ELSE 'Invalid - should be 10 digits only'
    END as user_id_format
FROM letter_requests
WHERE tenant_id = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4'
LIMIT 10;

-- =============================================================================
-- CLEANUP (Optional)
-- =============================================================================
-- To delete test letter requests:
-- DELETE FROM letter_requests WHERE type = 'Test Certificate';
