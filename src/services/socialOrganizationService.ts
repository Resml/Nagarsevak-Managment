import { supabase } from './supabaseClient';

export interface SocialOrganizationRecord {
    id: string;
    tenant_id: string;
    name: string;
    name_marathi?: string;
    name_english?: string;
    type: string;
    president_name: string;
    president_mobile: string;
    members_count: number;
    area: string;
    established_year: string;
    support_received: string;
    events_conducted: string;
    description: string;
    status: 'Active' | 'Inactive';
    created_at?: string;
}

export const SocialOrganizationService = {
    getOrganizations: async (tenantId: string): Promise<SocialOrganizationRecord[]> => {
        const { data, error } = await supabase
            .from('social_organizations')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    addOrganization: async (org: Omit<SocialOrganizationRecord, 'id' | 'tenant_id' | 'created_at'>, tenantId: string): Promise<SocialOrganizationRecord> => {
        const { data, error } = await supabase
            .from('social_organizations')
            .insert({ ...org, tenant_id: tenantId })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    updateOrganization: async (id: string, updates: Partial<SocialOrganizationRecord>, tenantId: string): Promise<void> => {
        const { error } = await supabase
            .from('social_organizations')
            .update(updates)
            .eq('id', id)
            .eq('tenant_id', tenantId);

        if (error) throw error;
    },

    deleteOrganization: async (id: string, tenantId: string): Promise<void> => {
        const { error } = await supabase
            .from('social_organizations')
            .delete()
            .eq('id', id)
            .eq('tenant_id', tenantId);

        if (error) throw error;
    },

    migrateData: async (localData: any[], tenantId: string): Promise<boolean> => {
        if (!localData || localData.length === 0) return true;

        try {
            const { count, error: countError } = await supabase
                .from('social_organizations')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId);

            if (countError) throw countError;

            if ((count || 0) > 0) {
                return true; 
            }

            const mappedData = localData.map(item => ({
                tenant_id: tenantId,
                name: item.name,
                name_marathi: item.name_marathi,
                name_english: item.name_english,
                type: item.type || '',
                president_name: item.president_name || '',
                president_mobile: item.president_mobile || '',
                members_count: item.members_count || 0,
                area: item.area || '',
                established_year: item.established_year || '',
                support_received: item.support_received || '',
                events_conducted: item.events_conducted || '',
                description: item.description || '',
                status: item.status || 'Active'
            }));

            const { error: insertError } = await supabase
                .from('social_organizations')
                .insert(mappedData);

            if (insertError) throw insertError;
            
            const { count: finalCount } = await supabase
                .from('social_organizations')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId);
                
            return (finalCount || 0) > 0;
        } catch (e) {
            console.error('Social Organizations migration failed:', e);
            return false;
        }
    }
};
