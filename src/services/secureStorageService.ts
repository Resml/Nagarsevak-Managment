import { supabase } from './supabaseClient';
import { getGlobalTenantId } from './supabaseClient';

export const SecureStorageService = {
    /**
     * Resolves a storage path to a usable URL.
     * If it's a legacy absolute URL, returns it directly.
     * If it's a relative path, generates a short-lived signed URL,
     * enforcing that the current tenant matches the requested path.
     */
    async getUrl(bucket: string, pathOrUrl: string): Promise<string> {
        if (!pathOrUrl) return '';

        // Backward compatibility for existing absolute URLs
        // TRANSITIONAL ONLY: This support will eventually be phased out.
        // Once the migration is complete and buckets are private, all legacy absolute URLs
        // will either be migrated to relative paths or isolated/retired.
        if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
            return pathOrUrl;
        }

        // It's a relative path. Format is expected to be: {tenant_id}/files/...
        const activeTenantId = getGlobalTenantId();
        
        // Security Check: Verify tenant boundary locally (Defense-in-Depth)
        // IMPORTANT: This frontend check is NOT the authoritative security boundary.
        // The real boundary is enforced at the database level:
        // Supabase Auth -> get_authorized_tenants() -> storage.objects RLS -> tenant_id from object path
        const pathParts = pathOrUrl.split('/');
        const pathTenantId = pathParts[0];

        if (activeTenantId && pathTenantId !== activeTenantId) {
            console.error('Security Violation: Attempted to generate a signed URL for a different tenant\'s path.', {
                activeTenantId,
                pathTenantId,
                path: pathOrUrl
            });
            throw new Error('Unauthorized access to storage path.');
        }

        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(pathOrUrl, 3600); // 1 hour expiry

        if (error || !data) {
            console.error('Error generating signed URL:', error);
            // FAIL CLOSED: We explicitly throw an error rather than falling back to a public URL.
            // Signed URL generation failure means the user lacks permission or the object is missing.
            throw new Error('Unauthorized access or storage path not found.');
        }

        return data.signedUrl;
    },

    /**
     * Uploads a file to a guaranteed tenant-isolated path and returns the relative path.
     * Does NOT return a public URL.
     */
    async uploadFile(bucket: string, module: string, file: File, customFileName?: string): Promise<string> {
        const activeTenantId = getGlobalTenantId();
        if (!activeTenantId) {
            throw new Error('No active tenant selected for upload.');
        }

        const fileExt = file.name.split('.').pop() || '';
        const uniqueId = customFileName || `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const relativePath = `${activeTenantId}/files/${module}/${uniqueId}`;

        const { error } = await supabase.storage
            .from(bucket)
            .upload(relativePath, file);

        if (error) throw error;

        return relativePath;
    }
};
