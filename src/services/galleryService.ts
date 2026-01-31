import { supabase } from './supabaseClient';
import { type GalleryItem, type GalleryCategory } from '../types';

const GALLERY_STORAGE_KEY = 'ns_gallery';

// Dummy Data
const DUMMY_GALLERY: GalleryItem[] = [
    {
        id: '1',
        title: 'Ganpati Visarjan 2024',
        category: 'Event',
        imageUrl: 'https://images.unsplash.com/photo-1567591414240-e19730eb66ac?auto=format&fit=crop&q=80',
        description: 'Grand celebration of Ganpati Visarjan in Ward 12 with all residents.',
        date: '2024-09-17',
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        title: 'Road Inauguration',
        category: 'Work',
        imageUrl: 'https://images.unsplash.com/photo-1590059395928-9833512630f7?auto=format&fit=crop&q=80',
        description: 'Inauguration of the new concrete road in Lane 5.',
        date: '2025-01-10',
        createdAt: new Date().toISOString()
    },
    {
        id: '3',
        title: 'Best Nagar Sevak Award',
        category: 'Award',
        imageUrl: 'https://images.unsplash.com/photo-1594122230689-45899d9e6f69?auto=format&fit=crop&q=80',
        description: 'Received the Best Nagar Sevak award from the Municipal Commissioner.',
        date: '2024-12-15',
        createdAt: new Date().toISOString()
    },
    {
        id: '4',
        title: 'Lokmat News Coverage',
        category: 'Newspaper',
        imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80',
        description: 'Coverage of our successful vaccination drive in Lokmat.',
        date: '2025-01-05',
        createdAt: new Date().toISOString()
    },
    {
        id: '5',
        title: 'Sakal Times Feature',
        category: 'Newspaper',
        imageUrl: 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?auto=format&fit=crop&q=80',
        description: 'Feature article on the drainage improvement project.',
        date: '2024-11-20',
        createdAt: new Date().toISOString()
    }
];

export const GalleryService = {
    getGalleryItems: async (category?: GalleryCategory): Promise<GalleryItem[]> => {
        try {
            let query = supabase
                .from('gallery')
                .select('*')
                .order('date', { ascending: false });

            if (category) {
                query = query.eq('category', category);
            }

            const { data, error } = await query;

            if (error) throw error;

            // If DB empty, fallback to dummy
            if (!data || data.length === 0) {
                const stored = JSON.parse(localStorage.getItem(GALLERY_STORAGE_KEY) || '[]');
                if (stored.length > 0) return stored;
                return filteredDummy(category);
            }

            return (data || []).map((row: any) => ({
                id: row.id,
                title: row.title,
                category: row.category,
                imageUrl: row.image_url,
                description: row.description,
                date: row.date,
                createdAt: row.created_at
            }));

        } catch (e) {
            // Fallback
            const stored = JSON.parse(localStorage.getItem(GALLERY_STORAGE_KEY) || '[]');
            if (stored.length > 0) return filterItems(stored, category);
            return filteredDummy(category);
        }
    },

    addGalleryItem: async (item: Omit<GalleryItem, 'id' | 'createdAt'>): Promise<GalleryItem | null> => {
        try {
            const { data, error } = await supabase
                .from('gallery')
                .insert({
                    title: item.title,
                    category: item.category,
                    image_url: item.imageUrl,
                    description: item.description,
                    date: item.date
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
                createdAt: data.created_at
            };
        } catch (e) {
            console.warn('Falling back to local storage for addGalleryItem');
            const current = JSON.parse(localStorage.getItem(GALLERY_STORAGE_KEY) || '[]');
            const newItem: GalleryItem = {
                ...item,
                id: `local_${Date.now()}`,
                createdAt: new Date().toISOString()
            };
            current.unshift(newItem);
            localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(current));
            return newItem;
        }
    },

    updateGalleryItem: async (id: string, item: Partial<GalleryItem>): Promise<GalleryItem | null> => {
        try {
            const { data, error } = await supabase
                .from('gallery')
                .update({
                    title: item.title,
                    category: item.category,
                    image_url: item.imageUrl,
                    description: item.description,
                    date: item.date
                })
                .eq('id', id)
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
                createdAt: data.created_at
            };
        } catch (e) {
            console.warn('Falling back to local storage for updateGalleryItem');
            const current = JSON.parse(localStorage.getItem(GALLERY_STORAGE_KEY) || '[]');
            const index = current.findIndex((x: GalleryItem) => x.id === id);
            if (index !== -1) {
                current[index] = { ...current[index], ...item };
                localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(current));
                return current[index];
            }
            return null;
        }
    },

    deleteGalleryItem: async (id: string): Promise<void> => {
        try {
            await supabase.from('gallery').delete().eq('id', id);
        } catch (e) {
            const current = JSON.parse(localStorage.getItem(GALLERY_STORAGE_KEY) || '[]');
            const filtered = current.filter((x: GalleryItem) => x.id !== id);
            localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(filtered));
        }
    },

    uploadImage: async (file: File): Promise<string> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('gallery-uploads')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('gallery-uploads')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            // Fallback for demo/mock if storage fails or not set up
            return URL.createObjectURL(file);
        }
    }
};

const filteredDummy = (category?: GalleryCategory) => {
    if (!category) return DUMMY_GALLERY;
    // Newspaper tab shows only newspapers
    if (category === 'Newspaper') return DUMMY_GALLERY.filter(d => d.category === 'Newspaper');
    // Events tab shows all except newspapers if filtered specifically, but UI logic might differ
    return DUMMY_GALLERY.filter(d => d.category === category);
};

const filterItems = (items: GalleryItem[], category?: GalleryCategory) => {
    if (!category) return items;
    return items.filter(d => d.category === category);
};
