import { supabase } from './supabaseClient';
import { type BudgetRecord } from '../types';

const BUDGET_STORAGE_KEY = 'ns_ward_budget';

const DUMMY_BUDGET: BudgetRecord[] = [
    {
        id: '1',
        financialYear: '2024-2025',
        category: 'Roads & Infrastructure',
        totalAllocation: 5000000, // 50 Lakhs
        utilizedAmount: 2500000, // 25 Lakhs
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: '2',
        financialYear: '2024-2025',
        category: 'Water Supply',
        totalAllocation: 3000000,
        utilizedAmount: 2800000,
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: '3',
        financialYear: '2024-2025',
        category: 'Garden & Parks',
        totalAllocation: 1500000,
        utilizedAmount: 200000,
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: '4',
        financialYear: '2024-2025',
        category: 'Street Lights',
        totalAllocation: 1000000,
        utilizedAmount: 950000,
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: '5',
        financialYear: '2023-2024',
        category: 'Roads & Infrastructure',
        totalAllocation: 4500000,
        utilizedAmount: 4400000,
        status: 'Closed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

export const BudgetService = {
    getBudgets: async (year: string | undefined, tenantId: string): Promise<BudgetRecord[]> => {
        try {
            let query = supabase
                .from('ward_budget')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false });

            if (year) {
                query = query.eq('financial_year', year);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Fallback if empty to show dummy data first time
            if (!data || data.length === 0) {
                const stored = JSON.parse(localStorage.getItem(BUDGET_STORAGE_KEY) || '[]');
                if (stored.length > 0) return filterByYear(stored, year);
                return filterByYear(DUMMY_BUDGET, year);
            }

            return (data || []).map((row: any) => ({
                id: row.id,
                financialYear: row.financial_year,
                category: row.category,
                totalAllocation: row.total_allocation,
                utilizedAmount: row.utilized_amount,
                area: row.area,
                status: row.status,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));

        } catch (e) {
            const stored = JSON.parse(localStorage.getItem(BUDGET_STORAGE_KEY) || '[]');
            if (stored.length > 0) return filterByYear(stored, year);
            return filterByYear(DUMMY_BUDGET, year);
        }
    },

    addBudget: async (record: Omit<BudgetRecord, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<BudgetRecord | null> => {
        try {
            const { data, error } = await supabase
                .from('ward_budget')
                .insert({
                    financial_year: record.financialYear,
                    category: record.category,
                    total_allocation: record.totalAllocation,
                    utilized_amount: record.utilizedAmount,
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
                totalAllocation: data.total_allocation,
                utilizedAmount: data.utilized_amount,
                area: data.area,
                status: data.status,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };
        } catch (e) {
            console.warn('Fallback local add');
            const current = JSON.parse(localStorage.getItem(BUDGET_STORAGE_KEY) || '[]');
            const newItem: BudgetRecord = {
                ...record,
                id: `local_${Date.now()}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            current.unshift(newItem);
            localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(current));
            return newItem;
        }
    },

    updateUtilization: async (id: string, newAmount: number, tenantId: string): Promise<void> => {
        try {
            // In real app, we might fetch first to add to existing, or just set absolute. 
            // Simplest is set absolute or we assume caller calculated it.
            // Let's assume we just update the total utilized amount.
            await supabase.from('ward_budget').update({ utilized_amount: newAmount }).eq('id', id).eq('tenant_id', tenantId);
        } catch (e) {
            const current = JSON.parse(localStorage.getItem(BUDGET_STORAGE_KEY) || '[]');
            const idx = current.findIndex((b: BudgetRecord) => b.id === id);
            if (idx !== -1) {
                current[idx].utilizedAmount = newAmount;
                localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(current));
            }
        }
    }
};

const filterByYear = (items: BudgetRecord[], year?: string) => {
    if (!year) return items;
    return items.filter(d => d.financialYear === year);
};
