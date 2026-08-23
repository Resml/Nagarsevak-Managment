import { supabase } from './supabaseClient';

export interface HousingSocietyRecord {
    id: string;
    tenant_id: string;
    name: string;
    name_marathi?: string;
    name_english?: string;
    chairman_name: string;
    chairman_mobile: string;
    secretary_name: string;
    secretary_mobile: string;
    voter_count: number;
    favourable_voter_count: number;
    area: string;
    address: string;
    notes: string;
    status: 'Active' | 'Inactive';
    created_at?: string;
}

export const HousingSocietyService = {
    getSocieties: async (tenantId: string): Promise<HousingSocietyRecord[]> => {
        const { data, error } = await supabase
            .from('housing_societies')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    addSociety: async (society: Omit<HousingSocietyRecord, 'id' | 'tenant_id' | 'created_at'>, tenantId: string): Promise<HousingSocietyRecord> => {
        const { data, error } = await supabase
            .from('housing_societies')
            .insert({ ...society, tenant_id: tenantId })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    updateSociety: async (id: string, updates: Partial<HousingSocietyRecord>, tenantId: string): Promise<void> => {
        const { error } = await supabase
            .from('housing_societies')
            .update(updates)
            .eq('id', id)
            .eq('tenant_id', tenantId);

        if (error) throw error;
    },

    deleteSociety: async (id: string, tenantId: string): Promise<void> => {
        const { error } = await supabase
            .from('housing_societies')
            .delete()
            .eq('id', id)
            .eq('tenant_id', tenantId);

        if (error) throw error;
    },

    migrateData: async (localData: any[], tenantId: string): Promise<boolean> => {
        if (!localData || localData.length === 0) return true;

        try {
            // First check if we already migrated (idempotency check)
            const { count, error: countError } = await supabase
                .from('housing_societies')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId);

            if (countError) throw countError;

            // If we have data, we assume migration already happened or user has live data.
            // We won't wipe, but we can append if we really wanted to. 
            // For safety, if count > 0, we'll just return true to clear localStorage and not duplicate.
            if ((count || 0) > 0) {
                return true; 
            }

            // Map local data, omitting existing IDs to avoid UUID collisions if they aren't true UUIDs
            const mappedData = localData.map(item => ({
                tenant_id: tenantId,
                name: item.name,
                name_marathi: item.name_marathi,
                name_english: item.name_english,
                chairman_name: item.chairman_name || '',
                chairman_mobile: item.chairman_mobile || '',
                secretary_name: item.secretary_name || '',
                secretary_mobile: item.secretary_mobile || '',
                voter_count: item.voter_count || 0,
                favourable_voter_count: item.favourable_voter_count || 0,
                area: item.area || '',
                address: item.address || '',
                notes: item.notes || '',
                status: item.status || 'Active'
            }));

            const { error: insertError } = await supabase
                .from('housing_societies')
                .insert(mappedData);

            if (insertError) throw insertError;
            
            // Verify persistence
            const { count: finalCount } = await supabase
                .from('housing_societies')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId);
                
            return (finalCount || 0) > 0;
        } catch (e) {
            console.error('Housing Societies migration failed:', e);
            return false;
        }
    }
};
