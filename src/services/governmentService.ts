import { supabase } from './supabaseClient';

export interface GovernmentOffice {
    id: string;
    name: string;
    address: string;
    officerName: string;
    contactNumber: string;
    latitude?: number;
    longitude?: number;
    area?: string;
    tenantId?: string;
}

export const GovernmentService = {
    getOffices: async (tenantId?: string | null): Promise<GovernmentOffice[]> => {
        if (!tenantId) return [];
        
        // 1. Check and perform LocalStorage Migration
        const key = `ns_gov_offices_${tenantId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                const localOffices = JSON.parse(stored);
                if (Array.isArray(localOffices) && localOffices.length > 0) {
                    const mappedRecords = localOffices.map((o: any) => ({
                        tenant_id: tenantId, // Enforce current tenant, ignore stored
                        name: o.name || 'Unknown',
                        address: o.address || 'Unknown',
                        officer_name: o.officerName || o.officer_name || 'Unknown',
                        contact_number: o.contactNumber || o.contact_number || 'Unknown',
                        area: o.area || null,
                        latitude: o.latitude || null,
                        longitude: o.longitude || null
                    }));
                    
                    // Insert all to supabase
                    const { error } = await supabase
                        .from('government_offices')
                        .insert(mappedRecords);
                    
                    if (!error) {
                        // Migration successful, verify persistence before clearing
                        localStorage.removeItem(key);
                    } else {
                        console.error('GovernmentOffice migration failed:', error);
                        // Retain localStorage if migration fails
                    }
                } else {
                    // Empty array or invalid, safe to clear
                    localStorage.removeItem(key);
                }
            } catch (e) {
                console.error('GovernmentOffice parsing failed:', e);
                localStorage.removeItem(key);
            }
        }
        
        // 2. Fetch from Supabase
        const { data, error } = await supabase
            .from('government_offices')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Failed to fetch government offices:', error);
            return [];
        }
        
        return (data || []).map((dbRow: any) => ({
            id: dbRow.id,
            name: dbRow.name,
            address: dbRow.address,
            officerName: dbRow.officer_name,
            contactNumber: dbRow.contact_number,
            latitude: dbRow.latitude,
            longitude: dbRow.longitude,
            area: dbRow.area,
            tenantId: dbRow.tenant_id
        }));
    },

    addOffice: async (office: Omit<GovernmentOffice, 'id'>, tenantId?: string | null): Promise<GovernmentOffice> => {
        if (!tenantId) throw new Error('Tenant ID required');
        
        const payload = {
            tenant_id: tenantId,
            name: office.name,
            address: office.address,
            officer_name: office.officerName,
            contact_number: office.contactNumber,
            area: office.area || null,
            latitude: office.latitude || null,
            longitude: office.longitude || null
        };
        
        const { data, error } = await supabase
            .from('government_offices')
            .insert([payload])
            .select()
            .single();
            
        if (error) throw error;
        
        return {
            id: data.id,
            name: data.name,
            address: data.address,
            officerName: data.officer_name,
            contactNumber: data.contact_number,
            latitude: data.latitude,
            longitude: data.longitude,
            area: data.area,
            tenantId: data.tenant_id
        };
    },

    deleteOffice: async (id: number | string, tenantId?: string | null): Promise<void> => {
        if (!tenantId) throw new Error('Tenant ID required');
        
        const { error } = await supabase
            .from('government_offices')
            .delete()
            .eq('id', id)
            .eq('tenant_id', tenantId);
            
        if (error) throw error;
    }
};
