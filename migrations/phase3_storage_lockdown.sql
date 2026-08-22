-- PHASE 3 STORAGE LOCKDOWN

-- 1. Make sensitive buckets private
UPDATE storage.buckets
SET public = false
WHERE id IN ('documents', 'complaints', 'gallery-uploads', 'app-assets');

-- Ensure deprecated buckets are still public so we don't break them until later
UPDATE storage.buckets
SET public = true
WHERE id IN ('complaint-photos', 'complaint-media');

-- 2. Drop existing insecure public/anon policies on storage.objects for the 4 target buckets
DROP POLICY IF EXISTS "Allow public uploads to app-assets bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from app-assets bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from app-assets bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update from app-assets bucket" ON storage.objects;

DROP POLICY IF EXISTS "Allow public uploads to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update from documents bucket" ON storage.objects;

DROP POLICY IF EXISTS "Allow public uploads to complaints bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from complaints bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from complaints bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update from complaints bucket" ON storage.objects;

DROP POLICY IF EXISTS "Allow public uploads to gallery-uploads bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from gallery-uploads bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from gallery-uploads bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update from gallery-uploads bucket" ON storage.objects;

-- 3. Apply Tenant-Scoped RLS to storage.objects

-- We enforce that the first path component of the object equals an authorized tenant.
-- Note: We cast get_authorized_tenants() to text to match storage.foldername(name)[1] which is text.

-- SELECT
CREATE POLICY "Tenant-scoped SELECT for private buckets" ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id IN ('documents', 'complaints', 'gallery-uploads', 'app-assets')
    AND (storage.foldername(name))[1] IN (SELECT t::text FROM public.get_authorized_tenants() t)
);

-- INSERT
CREATE POLICY "Tenant-scoped INSERT for private buckets" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id IN ('documents', 'complaints', 'gallery-uploads', 'app-assets')
    AND (storage.foldername(name))[1] IN (SELECT t::text FROM public.get_authorized_tenants() t)
);

-- UPDATE
-- For update, we must ensure BOTH the old object and the new object belong to an authorized tenant.
CREATE POLICY "Tenant-scoped UPDATE for private buckets" ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id IN ('documents', 'complaints', 'gallery-uploads', 'app-assets')
    AND (storage.foldername(name))[1] IN (SELECT t::text FROM public.get_authorized_tenants() t)
)
WITH CHECK (
    bucket_id IN ('documents', 'complaints', 'gallery-uploads', 'app-assets')
    AND (storage.foldername(name))[1] IN (SELECT t::text FROM public.get_authorized_tenants() t)
);

-- DELETE
CREATE POLICY "Tenant-scoped DELETE for private buckets" ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id IN ('documents', 'complaints', 'gallery-uploads', 'app-assets')
    AND (storage.foldername(name))[1] IN (SELECT t::text FROM public.get_authorized_tenants() t)
);
