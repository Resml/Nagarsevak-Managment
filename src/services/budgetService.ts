import { supabase } from './supabaseClient';
import { type BudgetRecord } from '../types';

export const BudgetService = {
    getBudgets: async (year: string | undefined, tenantId: string): Promise<BudgetRecord[]> => {
        try {
            let query = supabase
                .from('ward_provisions')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false });

            if (year) {
                query = query.eq('financial_year', year);
            }

            const { data, error } = await query;

            if (error) throw error;

            return (data || []).map((row: any) => ({
                id: row.id,
                financialYear: row.financial_year,
                category: row.category,
                totalAllocation: Number(row.sanctioned_amount) || 0,
                utilizedAmount: Number(row.requested_amount) || 0, // Using requested_amount for utilized
                area: row.area,
                status: row.status,
                createdAt: row.created_at,
                updatedAt: row.created_at
            }));

        } catch (e) {
            console.error('Error fetching budget data:', e);
            throw e; // Throw instead of silently returning empty
        }
    },

    addBudget: async (record: Omit<BudgetRecord, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<BudgetRecord | null> => {
        try {
            const { data, error } = await supabase
                .from('ward_provisions')
                .insert({
                    title: record.category || 'Budget Provision',
                    financial_year: record.financialYear,
                    category: record.category,
                    sanctioned_amount: record.totalAllocation,
                    requested_amount: record.utilizedAmount,
                    area: record.area,
                    status: record.status,
                    tenant_id: tenantId
                })
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                financialYear: data.financial_year,
                category: data.category,
                totalAllocation: Number(data.sanctioned_amount) || 0,
                utilizedAmount: Number(data.requested_amount) || 0,
                area: data.area,
                status: data.status,
                createdAt: data.created_at,
                updatedAt: data.created_at
            };
        } catch (e) {
            console.error('Error adding budget data:', e);
            throw e;
        }
    },

    updateUtilization: async (id: string, newAmount: number, tenantId: string): Promise<void> => {
        try {
            const { error } = await supabase
                .from('ward_provisions')
                .update({ requested_amount: newAmount })
                .eq('id', id)
                .eq('tenant_id', tenantId);

            if (error) throw error;
        } catch (e) {
            console.error('Error updating budget utilization:', e);
            throw e;
        }
    },

    deleteBudget: async (id: string, tenantId: string): Promise<void> => {
        try {
            const { error } = await supabase
                .from('ward_provisions')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenantId);

            if (error) throw error;
        } catch (e) {
            console.error('Error deleting budget:', e);
            throw e;
        }
    }
};
