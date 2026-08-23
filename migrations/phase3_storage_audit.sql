-- phase3_storage_audit.sql
-- This script interrogates the live Supabase storage state.

-- 1. List all buckets and their public status
SELECT 
    id AS bucket_id, 
    name, 
    owner, 
    created_at, 
    updated_at, 
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets;

-- 2. Count objects and list path samples per bucket
SELECT 
    bucket_id, 
    COUNT(*) as total_objects,
    SUM(OCTET_LENGTH(name)) as approx_size_bytes,
    MIN(name) as sample_path_1,
    MAX(name) as sample_path_2
FROM storage.objects
GROUP BY bucket_id;

-- 3. List all storage policies
SELECT 
    tablename, 
    policyname, 
    roles, 
    cmd as operation, 
    qual as using_condition, 
    with_check as check_condition
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;
