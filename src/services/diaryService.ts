import { supabase } from './supabaseClient';
import { type DiaryEntry } from '../types';

export const DiaryService = {
    getEntries: async (tenantId: string): Promise<DiaryEntry[]> => {
        try {
            const { data, error } = await supabase
                .from('gb_diary')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('meeting_date', { ascending: false });

            if (error) {
                console.error('Supabase error fetching gb_diary:', error);
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
            console.error('Failed to get diary entries:', e);
            throw e;
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
                tenant_id: tenantId
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
            console.error('Failed to add diary entry:', e);
            throw e;
        }
    },

    updateEntry: async (id: string, updates: Partial<DiaryEntry>, tenantId: string): Promise<void> => {
        try {
            const dbUpdates: any = {};
            if (updates.meetingDate !== undefined) dbUpdates.meeting_date = updates.meetingDate;
            if (updates.meetingType !== undefined) dbUpdates.meeting_type = updates.meetingType;
            if (updates.subject !== undefined) dbUpdates.subject = updates.subject;
            if (updates.description !== undefined) dbUpdates.description = updates.description;
            if (updates.department !== undefined) dbUpdates.department = updates.department;
            if (updates.area !== undefined) dbUpdates.area = updates.area;
            if (updates.status !== undefined) dbUpdates.status = updates.status;
            if (updates.beneficiaries !== undefined) dbUpdates.beneficiaries = updates.beneficiaries;
            if (updates.response !== undefined) dbUpdates.response = updates.response;
            if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

            const { error } = await supabase
                .from('gb_diary')
                .update(dbUpdates)
                .eq('id', id)
                .eq('tenant_id', tenantId);

            if (error) throw error;
        } catch (e) {
            console.error('Failed to update diary entry:', e);
            throw e;
        }
    },

    deleteEntry: async (id: string, tenantId: string): Promise<void> => {
        try {
            const { error } = await supabase
                .from('gb_diary')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenantId);
                
            if (error) throw error;
        } catch (e) {
            console.error('Failed to delete diary entry:', e);
            throw e;
        }
    }
};
