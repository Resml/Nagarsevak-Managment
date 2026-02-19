import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Image as ImageIcon, Newspaper, Trash2, X, Upload, Search, Edit2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { GalleryService } from '../../services/galleryService';
import { type GalleryItem, type GalleryCategory } from '../../types';

const Gallery = () => {
    const { t } = useLanguage();
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState<{
        title: string;
        category: GalleryCategory;
        imageUrl: string;
        description: string;
        date: string;
    }>({
        title: '',
        category: 'Event',
        imageUrl: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadGallery();
    }, []);

    const loadGallery = async () => {
        setLoading(true);
        // Simulate network delay
        setTimeout(async () => {
            const allItems = await GalleryService.getGalleryItems();
            setItems(allItems);
            setLoading(false);
        }, 800);
    };

    const getFilteredItems = () => {
        let filtered = items;

        // Filter out Newspaper items
        filtered = filtered.filter(i => i.category !== 'Newspaper');

        // Search Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(i =>
                i.title.toLowerCase().includes(lowerTerm) ||
                (i.description && i.description.toLowerCase().includes(lowerTerm))
            );
        }

        // Date Filter
        if (filterDate) {
            filtered = filtered.filter(i => i.date === filterDate);
        }

        return filtered;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading(true);
            try {
                const url = await GalleryService.uploadImage(e.target.files[0]);
                setFormData(prev => ({ ...prev, imageUrl: url }));
            } catch (error) {
                toast.error(t('gallery.upload_error'));
            } finally {
                setUploading(false);
            }
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await GalleryService.updateGalleryItem(editingId, formData);
                toast.success('Gallery item updated successfully');
            } else {
                await GalleryService.addGalleryItem(formData);
                toast.success('Gallery item added successfully');
            }

            setIsModalOpen(false);
            setEditingId(null);
            setFormData({
                title: '',
                category: 'Event',
                imageUrl: '',
                description: '',
                date: new Date().toISOString().split('T')[0]
            });
            loadGallery();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save gallery item');
        }
    };

    const handleEdit = (item: GalleryItem) => {
        setEditingId(item.id);
        setFormData({
            title: item.title,
            category: item.category,
            imageUrl: item.imageUrl,
            description: item.description || '',
            date: item.date
        });
        setIsModalOpen(true);
    };

    const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);

    // ... (existing code)

    const handleDelete = (item: GalleryItem) => {
        setDeleteTarget(item);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await GalleryService.deleteGalleryItem(deleteTarget.id);
            toast.success('Gallery item deleted successfully');
            loadGallery();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete gallery item');
        } finally {
            setDeleteTarget(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{t('gallery.title')}</h1>
                        <p className="text-slate-500">{t('gallery.subtitle')}</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({
                                title: '',
                                category: 'Event',
                                imageUrl: '',
                                description: '',
                                date: new Date().toISOString().split('T')[0]
                            });
                            setIsModalOpen(true);
                        }}
                        className="ns-btn-primary"
                    >
                        <Plus className="w-5 h-5" />
                        <span>{t('gallery.add_photo')}</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="ns-card p-4 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t('gallery.search_placeholder')}
                            className="ns-input pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <input
                            type="date"
                            className="ns-input text-slate-700"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        />
                    </div>
                    {filterDate && (
                        <button
                            onClick={() => setFilterDate('')}
                            className="ns-btn-ghost border border-slate-200 px-2 py-2"
                            title="Clear Date"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="ns-card overflow-hidden">
                            <div className="aspect-video bg-slate-200 animate-pulse" />
                            <div className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse" />
                                    <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
                                </div>
                                <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredItems().map(item => (
                        <div key={item.id} className="ns-card overflow-hidden group">
                            <div className="relative aspect-video bg-slate-100 overflow-hidden">
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="p-2 bg-white rounded-full text-slate-600 hover:text-brand-600 hover:bg-brand-50 shadow-sm"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item)}
                                        className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 shadow-sm"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white font-medium">
                                    {t(`gallery.categories.${item.category}`)}
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-slate-900 line-clamp-1" title={item.titleKey ? t(item.titleKey) : item.title}>
                                        {item.titleKey ? t(item.titleKey) : item.title}
                                    </h3>
                                    <span className="text-xs text-slate-500 whitespace-nowrap">{item.date}</span>
                                </div>
                                {(item.description || item.descriptionKey) && (
                                    <p className="text-sm text-slate-600 line-clamp-2" title={item.descriptionKey ? t(item.descriptionKey) : item.description}>
                                        {item.descriptionKey ? t(item.descriptionKey) : item.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                    {getFilteredItems().length === 0 && (
                        <div className="col-span-full text-center py-12 ns-card border-dashed">
                            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">{t('gallery.no_photos')}</p>
                        </div>
                    )}
                </div>
            )
            }

            {/* Add Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="ns-card w-full max-w-lg overflow-hidden">
                            <div className="flex justify-between items-center p-6 border-b border-slate-200/70">
                                <h2 className="text-xl font-bold text-slate-900">{t('gallery.modal_title')}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleAdd} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{t('gallery.category')}</label>
                                    <select
                                        className="ns-input mt-1"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value as GalleryCategory })}
                                    >
                                        <option value="Event">{t('gallery.categories.Event')}</option>
                                        <option value="Work">{t('gallery.categories.Work')}</option>
                                        <option value="Award">{t('gallery.categories.Award')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{t('gallery.image_title')}</label>
                                    <input
                                        type="text" required
                                        className="ns-input mt-1"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder={t('gallery.title_placeholder')}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{t('gallery.image_label')}</label>
                                    <div className="mt-1 space-y-3">
                                        {/* File Input */}
                                        <div className="flex items-center justify-center w-full">
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    {uploading ? (
                                                        <p className="text-sm text-slate-500">{t('gallery.uploading')}</p>
                                                    ) : formData.imageUrl ? (
                                                        <img src={formData.imageUrl} alt="preview" className="h-28 object-contain" />
                                                    ) : (
                                                        <>
                                                            <Upload className="w-8 h-8 mb-3 text-slate-400" />
                                                            <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">{t('gallery.click_upload')}</span></p>
                                                        </>
                                                    )}
                                                </div>
                                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                            </label>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                                <div className="w-full border-t border-gray-300"></div>
                                            </div>
                                            <div className="relative flex justify-center">
                                                <span className="px-2 bg-white text-sm text-slate-500">{t('gallery.use_url')}</span>
                                            </div>
                                        </div>

                                        <div className="flex rounded-md shadow-sm">
                                            <input
                                                type="url"
                                                className="ns-input rounded-r-none"
                                                value={formData.imageUrl}
                                                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                                placeholder="https://..."
                                            />
                                            <span className="inline-flex items-center px-3 rounded-r-xl border border-l-0 border-slate-200 bg-slate-50 text-slate-500 text-sm">
                                                URL
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{t('gallery.date')}</label>
                                    <input
                                        type="date" required
                                        className="ns-input mt-1"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{t('gallery.desc')}</label>
                                    <textarea
                                        rows={3}
                                        className="ns-input mt-1"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder={t('gallery.desc_placeholder')}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="ns-btn-primary w-full justify-center disabled:opacity-50"
                                >
                                    {uploading ? t('gallery.uploading') : t('gallery.submit')}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                deleteTarget && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="ns-card w-full max-w-sm overflow-hidden p-6 space-y-4">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{t('gallery.delete_title')}</h3>
                                <p className="text-slate-500 mt-2 text-sm">
                                    {t('gallery.delete_confirm')} <span className="font-semibold text-slate-900">{deleteTarget.titleKey ? t(deleteTarget.titleKey) : deleteTarget.title}</span>?
                                </p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                                >
                                    {t('gallery.delete_action')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Gallery;
