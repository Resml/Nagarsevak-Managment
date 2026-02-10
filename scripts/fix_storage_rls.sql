-- SQL script to fix Row-Level Security (RLS) for the 'complaints' bucket
-- Run this in your Supabase SQL Editor

-- 1. Ensure the bucket is public (optional, if not already set)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'complaints';

-- 2. Create policy to allow anyone to upload files to the 'complaints' bucket
-- This is necessary for the bot (using the anon key) to work correctly
CREATE POLICY "Allow public uploads to complaints bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'complaints');

-- 3. Create policy to allow public viewing of files
CREATE POLICY "Allow public select from complaints bucket" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'complaints');

-- 4. Create policy to allow deletion (optional, but helpful for testing)
CREATE POLICY "Allow public delete from complaints bucket" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'complaints');
