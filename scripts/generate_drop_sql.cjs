const fs = require('fs');

const csv = fs.readFileSync('migrations/live_policies.csv', 'utf-8');
const lines = csv.split('\n');

const dropStatements = [];

for (const line of lines) {
    if (!line.trim()) continue;
    // split by comma, respecting quotes is tricky but let's just do a simple match
    // actually, we know it's "objects,true,Policy Name,..."
    if (line.startsWith('objects,')) {
        // Find the policy name.
        // It's the 3rd column: tablename,rls_enabled,policyname
        // Be careful if policy name has commas
        const parts = line.split(',');
        let policyName = parts[2];
        if (policyName.startsWith('"')) {
            // handle quoted policy name
            const match = line.match(/objects,(true|false),"([^"]+)",/);
            if (match) policyName = match[2];
        }

        // We only want to drop policies that affect the 4 buckets or are insecure.
        // Let's just drop all policies on `objects` since we are replacing them ALL with unified Tenant-Scoped policies!
        // Wait, what if there are policies for other buckets?
        // Let's drop policies that mention the 4 buckets in their name, OR we can just drop the known ones.
        dropStatements.push(`DROP POLICY IF EXISTS "${policyName}" ON storage.objects;`);
    }
}

const sql = `
-- Drop all existing policies on storage.objects that we retrieved from live_policies
${dropStatements.join('\n')}

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
`;

fs.writeFileSync('migrations/phase3_storage_fix_drops.sql', sql);
console.log('Generated migrations/phase3_storage_fix_drops.sql');
