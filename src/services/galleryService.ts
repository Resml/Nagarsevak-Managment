import { supabase } from './supabaseClient';
import { type GalleryItem, type GalleryCategory } from '../types';
import { SecureStorageService } from './secureStorageService';

export const GalleryService = {
    getGalleryItems: async (category: GalleryCategory | undefined, tenantId: string): Promise<GalleryItem[]> => {
        try {
            let query = supabase
                .from('gallery')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('date', { ascending: false });

            if (category) {
                query = query.eq('category', category);
            }

            const { data, error } = await query;

            if (error) throw error;

            const items = (data || []).map((row: any) => ({
                id: row.id,
                title: row.title,
                category: row.category,
                imageUrl: row.image_url,
                description: row.description,
                date: row.date,
                sentiment: row.sentiment,
                titleKey: row.title_key,
                descriptionKey: row.description_key,
                createdAt: row.created_at
            }));

            // Resolve secure signed URLs
            for (const item of items) {
                if (item.imageUrl) {
                    try {
                        (item as any).previewUrl = await SecureStorageService.getUrl('app-assets', item.imageUrl);
                    } catch (err) {
                        console.warn(`Failed to resolve signed URL for item ${item.id}:`, err);
                        (item as any).previewUrl = null;
                    }
                }
            }

            return items;

        } catch (e) {
            console.error('Error fetching gallery data:', e);
            throw e;
        }
    },

    addGalleryItem: async (item: Omit<GalleryItem, 'id' | 'createdAt'>, tenantId: string): Promise<GalleryItem | null> => {
        try {
            const { data, error } = await supabase
                .from('gallery')
                .insert({
                    title: item.title,
                    category: item.category,
                    image_url: item.imageUrl,
                    description: item.description,
                    date: item.date,
                    sentiment: item.sentiment,
                    tenant_id: tenantId
                })
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                title: data.title,
                category: data.category,
                imageUrl: data.image_url,
                description: data.description,
                date: data.date,
                sentiment: data.sentiment,
                createdAt: data.created_at
            };
        } catch (e) {
            console.error('Error adding gallery item:', e);
            throw e;
        }
    },

    updateGalleryItem: async (id: string, item: Partial<GalleryItem>, tenantId: string): Promise<GalleryItem | null> => {
        try {
            const { data, error } = await supabase
                .from('gallery')
                .update({
                    title: item.title,
                    category: item.category,
                    image_url: item.imageUrl,
                    description: item.description,
                    date: item.date,
                    sentiment: item.sentiment
                })
                .eq('id', id)
                .eq('tenant_id', tenantId)
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                title: data.title,
                category: data.category,
                imageUrl: data.image_url,
                description: data.description,
                date: data.date,
                sentiment: data.sentiment,
                createdAt: data.created_at
            };
        } catch (e) {
            console.error('Error updating gallery item:', e);
            throw e;
        }
    },

    deleteGalleryItem: async (id: string, tenantId: string): Promise<void> => {
        try {
            const { error } = await supabase
                .from('gallery')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenantId);

            if (error) throw error;
        } catch (e) {
            console.error('Error deleting gallery item:', e);
            throw e;
        }
    },

    uploadImage: async (file: File, tenantId: string): Promise<string> => {
        try {
            // Use SecureStorageService to ensure correct tenant isolation and bucket mapping
            const relativePath = await SecureStorageService.uploadFile('app-assets', 'gallery', file);
            return relativePath;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw new Error('Image upload failed. Please try again.');
        }
    }
};
