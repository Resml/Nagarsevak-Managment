import { supabase } from './supabaseClient';
import { type AIHistoryItem } from '../types';

const HISTORY_STORAGE_KEY = 'ns_ai_history';

export const AIHistoryService = {
    getHistory: async (): Promise<AIHistoryItem[]> => {
        try {
            const { data, error } = await supabase
                .from('ai_history')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                const stored = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
                return stored;
            }

            return data.map((row: any) => ({
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
            console.warn('Falling back to local storage for getHistory');
            const stored = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
            return stored;
        }
    },

    addToHistory: async (item: Omit<AIHistoryItem, 'id' | 'createdAt'>): Promise<AIHistoryItem> => {
        try {
            const { data, error } = await supabase
                .from('ai_history')
                .insert({
                    title: item.title,
                    content_type: item.contentType,
                    tone: item.tone,
                    language: item.language,
                    generated_content: item.generatedContent,
                    messages: item.messages
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
            console.warn('Falling back to local storage for addToHistory');
            const current = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
            const newItem: AIHistoryItem = {
                ...item,
                id: `local_${Date.now()}`,
                createdAt: new Date().toISOString()
            };
            current.unshift(newItem);
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(current));
            return newItem;
        }
    }
};
