-- Fix existing letter_requests to use full WhatsApp ID format
-- This updates any records that were saved with cleaned phone numbers

-- BEFORE: user_id = "7058731515" or "05029583282256"
-- AFTER: user_id = "105029583282256@lid" or "7058731515@s.whatsapp.net"

-- Unfortunately, we cannot automatically determine the correct WhatsApp ID
-- from the cleaned phone number. The admin will need to manually update
-- or users will need to submit new requests with the fixed bot code.

-- Option 1: Mark old requests as needing attention
UPDATE letter_requests
SET status = 'Pending'
WHERE 
    user_id NOT LIKE '%@%'  -- No @ symbol means it's a cleaned number
    AND tenant_id = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4'
    AND status IN ('Approved', 'Rejected');

-- Option 2: View requests that need WhatsApp ID correction
SELECT 
    id,
    user_id,
    details->>'name' as name,
    details->>'mobile' as mobile_from_form,
    type,
    status,
    created_at
FROM letter_requests
WHERE 
    user_id NOT LIKE '%@%'
    AND tenant_id = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4'
ORDER BY created_at DESC;

-- Option 3: Manual correction (if you know the correct WhatsApp ID)
-- UPDATE letter_requests
-- SET user_id = '105029583282256@lid'  -- Correct WhatsApp ID
-- WHERE id = 'YOUR_LETTER_REQUEST_ID';

-- Going forward, all NEW letter requests will automatically
-- have the correct WhatsApp ID format thanks to the bot fix.
