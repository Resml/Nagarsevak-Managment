-- Add audio_url column to complaints table
alter table complaints add column if not exists audio_url text;

-- Instructions for Storage Bucket (Manual Step):
-- 1. Go to Storage in Supabase Dashboard.
-- 2. Create a new bucket named 'audio'.
-- 3. Make it 'Public'.
-- 4. Save.
