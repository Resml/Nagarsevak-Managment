export interface GovernmentOffice {
    id: number | string;
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
        const key = `ns_gov_offices_${tenantId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return [];
            }
        }
        return [];
    },

    addOffice: async (office: Omit<GovernmentOffice, 'id'>, tenantId?: string | null): Promise<GovernmentOffice> => {
        const key = `ns_gov_offices_${tenantId || 'default'}`;
        const existing = await GovernmentService.getOffices(tenantId);
        const newOffice: GovernmentOffice = {
            ...office,
            id: Date.now(),
            tenantId: tenantId || undefined
        };
        const updated = [newOffice, ...existing];
        localStorage.setItem(key, JSON.stringify(updated));
        return newOffice;
    },

    deleteOffice: async (id: number | string, tenantId?: string | null): Promise<void> => {
        const key = `ns_gov_offices_${tenantId || 'default'}`;
        const existing = await GovernmentService.getOffices(tenantId);
        const updated = existing.filter(o => o.id !== id);
        localStorage.setItem(key, JSON.stringify(updated));
    }
};
