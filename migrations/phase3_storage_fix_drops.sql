-- PHASE 3 STORAGE LOCKDOWN: DYNAMIC POLICY DROP AND RE-APPLY

-- We will dynamically drop ALL policies on storage.objects, then cleanly re-create them.
DO $$ 
DECLARE 
    r record;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
    END LOOP;
END $$;

-- Re-apply strictly the new unified policies
CREATE POLICY "Tenant-scoped SELECT for private buckets" ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id IN ('documents', 'complaints', 'gallery-uploads', 'app-assets')
    AND (storage.foldername(name))[1] IN (SELECT t::text FROM public.get_authorized_tenants() t)
);

CREATE POLICY "Tenant-scoped INSERT for private buckets" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id IN ('documents', 'complaints', 'gallery-uploads', 'app-assets')
    AND (storage.foldername(name))[1] IN (SELECT t::text FROM public.get_authorized_tenants() t)
);

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

CREATE POLICY "Tenant-scoped DELETE for private buckets" ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id IN ('documents', 'complaints', 'gallery-uploads', 'app-assets')
    AND (storage.foldername(name))[1] IN (SELECT t::text FROM public.get_authorized_tenants() t)
);
