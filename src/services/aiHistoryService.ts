import { supabase } from './supabaseClient';
import { type AIHistoryItem } from '../types';

const HISTORY_STORAGE_KEY = 'ns_ai_history';

export const AIHistoryService = {
    getHistory: async (tenantId: string): Promise<AIHistoryItem[]> => {
        try {
            const { data, error } = await supabase
                .from('ai_history')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map((row: any) => ({
                id: row.id,
                title: row.title,
                contentType: row.content_type,
                tone: row.tone,
                language: row.language,
                generatedContent: row.generated_content,
                messages: row.messages,
                createdAt: row.created_at
            }));
        } catch (error) {
            console.error('Error fetching AI History:', error);
            throw error;
        }
    },

    addToHistory: async (item: Omit<AIHistoryItem, 'id' | 'createdAt'>, tenantId: string): Promise<AIHistoryItem> => {
        try {
            const { data, error } = await supabase
                .from('ai_history')
                .insert({
                    title: item.title,
                    content_type: item.contentType,
                    tone: item.tone,
                    language: item.language,
                    generated_content: item.generatedContent,
                    messages: item.messages,
                    tenant_id: tenantId
                })
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                title: data.title,
                contentType: data.content_type,
                tone: data.tone,
                language: data.language,
                generatedContent: data.generated_content,
                messages: data.messages,
                createdAt: data.created_at
            };
        } catch (error) {
            console.error('Error adding to AI History:', error);
            throw error;
        }
    },

    migrateData: async (tenantId: string): Promise<boolean> => {
        const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (!stored) return true;

        try {
            const parsed = JSON.parse(stored) as AIHistoryItem[];
            if (parsed.length === 0) {
                localStorage.removeItem(HISTORY_STORAGE_KEY);
                return true;
            }

            const { count, error: countError } = await supabase
                .from('ai_history')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId);

            if (countError) throw countError;

            if ((count || 0) > 0) {
                localStorage.removeItem(HISTORY_STORAGE_KEY);
                return true; 
            }

            const mappedData = parsed.map(item => ({
                title: item.title || 'Untitled',
                content_type: item.contentType || 'Custom',
                tone: item.tone || 'Neutral',
                language: item.language || 'English',
                generated_content: item.generatedContent || '',
                messages: item.messages || [],
                tenant_id: tenantId
            }));

            const { error: insertError } = await supabase
                .from('ai_history')
                .insert(mappedData);

            if (insertError) throw insertError;
            
            localStorage.removeItem(HISTORY_STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('AI History migration failed:', e);
            return false;
        }
    }
};
