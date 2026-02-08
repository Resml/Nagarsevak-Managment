import { supabase } from './supabaseClient';
import { type ProvisionRecord } from '../types';

export const ProvisionService = {
    getProvisions: async (year?: string): Promise<ProvisionRecord[]> => {
        try {
            let query = supabase
                .from('ward_provisions')
                .select('*')
                .order('created_at', { ascending: false });

            if (year) {
                query = query.eq('financial_year', year);
            }

            const { data, error } = await query;

            if (error) throw error;

            return (data || []).map((row: any) => ({
                id: row.id,
                title: row.title,
                description: row.description,
                requestedAmount: row.requested_amount,
                sanctionedAmount: row.sanctioned_amount,
                requestedDate: row.requested_date,
                sanctionedDate: row.sanctioned_date,
                status: row.status,
                financialYear: row.financial_year,
                category: row.category,
                letterReference: row.letter_reference,
                metadata: row.metadata,
                createdAt: row.created_at
            }));
        } catch (err) {
            console.error('Error fetching provisions:', err);
            return [];
        }
    },

    addProvision: async (record: Omit<ProvisionRecord, 'id' | 'createdAt'> & { tenantId?: string | null }): Promise<void> => {
        try {
            const { error } = await supabase
                .from('ward_provisions')
                .insert({
                    title: record.title,
                    description: record.description,
                    requested_amount: record.requestedAmount,
                    sanctioned_amount: record.sanctionedAmount,
                    requested_date: record.requestedDate ? record.requestedDate : null,
                    sanctioned_date: record.sanctionedDate ? record.sanctionedDate : null,
                    status: record.status,
                    financial_year: record.financialYear,
                    category: record.category,
                    letter_reference: record.letterReference,
                    metadata: record.metadata,
                    tenant_id: record.tenantId
                });

            if (error) throw error;
        } catch (err) {
            console.error('Error adding provision:', err);
            throw err;
        }
    },

    updateProvision: async (id: string, updates: Partial<ProvisionRecord>): Promise<void> => {
        try {
            const payload: any = {};
            if (updates.title) payload.title = updates.title;
            if (updates.description) payload.description = updates.description;
            if (updates.requestedAmount !== undefined) payload.requested_amount = updates.requestedAmount;
            if (updates.sanctionedAmount !== undefined) payload.sanctioned_amount = updates.sanctionedAmount;
            if (updates.requestedDate) payload.requested_date = updates.requestedDate ? updates.requestedDate : null;
            if (updates.sanctionedDate !== undefined) payload.sanctioned_date = updates.sanctionedDate ? updates.sanctionedDate : null;
            if (updates.status) payload.status = updates.status;
            if (updates.financialYear) payload.financial_year = updates.financialYear;
            if (updates.category) payload.category = updates.category;
            if (updates.letterReference) payload.letter_reference = updates.letterReference;
            if (updates.metadata) payload.metadata = updates.metadata;

            const { error } = await supabase
                .from('ward_provisions')
                .update(payload)
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            console.error('Error updating provision:', err);
            throw err;
        }
    }
};
