import { supabase } from './supabaseClient';
import { type DiaryEntry } from '../types';

// Mock storage key for fallback/dev
const DIARY_STORAGE_KEY = 'ns_gb_diary';

export const DiaryService = {
    // Get all entries with optional filtering (client-side filtering for simplicity first)
    getEntries: async (tenantId: string): Promise<DiaryEntry[]> => {
        try {
            const { data, error } = await supabase
                .from('gb_diary')
                .select('*')
                .eq('tenant_id', tenantId) // Secured
                .order('meeting_date', { ascending: false });

            if (error) {
                console.warn('Supabase error (or table missing), falling back to mock:', error);
                throw error;
            }

            return (data || []).map((row: any) => ({
                id: row.id,
                meetingDate: row.meeting_date,
                meetingType: row.meeting_type,
                subject: row.subject,
                description: row.description,
                department: row.department,
                area: row.area,
                status: row.status,
                beneficiaries: row.beneficiaries,
                response: row.response,
                tags: row.tags || [],
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));
        } catch (e) {
            // Fallback to local storage if DB not ready
            return JSON.parse(localStorage.getItem(DIARY_STORAGE_KEY) || '[]');
        }
    },

    addEntry: async (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<DiaryEntry | null> => {
        try {
            const dbEntry = {
                meeting_date: entry.meetingDate,
                meeting_type: entry.meetingType,
                subject: entry.subject,
                description: entry.description,
                department: entry.department,
                area: entry.area,
                status: entry.status,
                beneficiaries: entry.beneficiaries,
                response: entry.response,
                tags: entry.tags,
                tenant_id: tenantId // Secured
            };

            const { data, error } = await supabase
                .from('gb_diary')
                .insert(dbEntry)
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                meetingDate: data.meeting_date,
                meetingType: data.meeting_type,
                subject: data.subject,
                description: data.description,
                department: data.department,
                area: data.area,
                status: data.status,
                beneficiaries: data.beneficiaries,
                response: data.response,
                tags: data.tags || [],
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };
        } catch (e) {
            console.warn('Falling back to local storage for addEntry');
            const current = JSON.parse(localStorage.getItem(DIARY_STORAGE_KEY) || '[]');
            const newEntry: DiaryEntry = {
                ...entry,
                id: `local_${Date.now()}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            current.unshift(newEntry);
            localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(current));
            return newEntry;
        }
    },

    updateEntry: async (id: string, updates: Partial<DiaryEntry>): Promise<void> => {
        // Implementation for update would go here (similar pattern: try DB, fallback local)
        // Skipping detail for brevity in this step, focusing on List/Add first.
    },

    deleteEntry: async (id: string, tenantId: string): Promise<void> => {
        try {
            const { error } = await supabase.from('gb_diary').delete().eq('id', id).eq('tenant_id', tenantId);
            if (error) throw error;
        } catch (e) {
            const current = JSON.parse(localStorage.getItem(DIARY_STORAGE_KEY) || '[]');
            const filtered = current.filter((x: DiaryEntry) => x.id !== id);
            localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(filtered));
        }
    }
};
