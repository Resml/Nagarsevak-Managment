-- DEBUG: Check what's actually in the database
SELECT 
    id,
    user_id,
    LENGTH(user_id) as user_id_length,
    type,
    status,
    created_at,
    details->'mobile' as mobile_from_details
FROM letter_requests
WHERE tenant_id = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4'
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any recent status changes
SELECT 
    id,
    user_id,
    type,
    status,
    updated_at,
    created_at
FROM letter_requests
WHERE 
    tenant_id = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4'
    AND status IN ('Approved', 'Rejected')
ORDER BY updated_at DESC NULLS LAST
LIMIT 5;

-- Test: Update a specific request (replace ID with actual one from above)
-- UPDATE letter_requests 
-- SET status = 'Approved', updated_at = NOW()
-- WHERE id = 'YOUR_ID_HERE' 
-- AND tenant_id = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4';
