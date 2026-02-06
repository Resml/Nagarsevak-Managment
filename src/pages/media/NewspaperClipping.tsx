import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Newspaper, Trash2, X, Upload, Search, Edit2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { GalleryService } from '../../services/galleryService';
import { type GalleryItem, type GalleryCategory } from '../../types';

const NewspaperClipping = () => {
    const { t } = useLanguage();
    const [activeSection, setActiveSection] = useState<'positive' | 'negative'>('positive');
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
        sentiment: 'positive' | 'negative';
        imageUrl: string;
        description: string;
        date: string;
    }>({
        title: '',
        category: 'Newspaper',
        sentiment: 'positive',
        imageUrl: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadClippings();
    }, []);

    const loadClippings = async () => {
        setLoading(true);
        // Simulate network delay
        setTimeout(async () => {
            const allItems = await GalleryService.getGalleryItems('Newspaper');
            setItems(allItems);
            setLoading(false);
        }, 800);
    };

    const getFilteredItems = () => {
        let filtered = items.filter(item => (item.sentiment || 'positive') === activeSection);

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
                toast.success(t('newspaper.update_success'));
            } else {
                await GalleryService.addGalleryItem(formData);
                toast.success(t('newspaper.upload_success'));
            }

            setIsModalOpen(false);
            setEditingId(null);
            setFormData({
                title: '',
                category: 'Newspaper',
                sentiment: activeSection,
                imageUrl: '',
                description: '',
                date: new Date().toISOString().split('T')[0]
            });
            loadClippings();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save clipping');
        }
    };

    const handleEdit = (item: GalleryItem) => {
        setEditingId(item.id);
        setFormData({
            title: item.title,
            category: item.category,
            sentiment: item.sentiment || 'positive',
            imageUrl: item.imageUrl,
            description: item.description || '',
            date: item.date
        });
        setIsModalOpen(true);
    };

    const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);

    const handleDelete = (item: GalleryItem) => {
        setDeleteTarget(item);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await GalleryService.deleteGalleryItem(deleteTarget.id);
            toast.success(t('newspaper.delete_success'));
            loadClippings();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete clipping');
        } finally {
            setDeleteTarget(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('newspaper.title')}</h1>
                    <p className="text-slate-500">{t('newspaper.subtitle')}</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({
                            title: '',
                            category: 'Newspaper',
                            sentiment: activeSection,
                            imageUrl: '',
                            description: '',
                            date: new Date().toISOString().split('T')[0]
                        });
                        setIsModalOpen(true);
                    }}
                    className="ns-btn-primary"
                >
                    <Plus className="w-5 h-5" />
                    <span>{t('newspaper.add_clipping')}</span>
                </button>
            </div>

            {/* Sections */}
            <div className="flex space-x-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveSection('positive')}
                    className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeSection === 'positive'
                        ? 'text-brand-600 border-b-2 border-brand-600'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    {t('newspaper.positive_news')}
                </button>
                <button
                    onClick={() => setActiveSection('negative')}
                    className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeSection === 'negative'
                        ? 'text-red-600 border-b-2 border-red-600'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    {t('newspaper.negative_news')}
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

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="ns-card overflow-hidden">
                            <div className="aspect-[4/3] bg-slate-200 animate-pulse" />
                            <div className="p-4 space-y-3">
                                <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                                    <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredItems().map(item => (
                        <div key={item.id} className="ns-card overflow-hidden group">
                            <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                                <img
                                    src={item.imageUrl}
                                    alt={item.titleKey ? t(item.titleKey) : item.title}
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
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white font-medium">
                                    {item.date}
                                </div>
                            </div>
                            <div className="p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded-full uppercase tracking-wider">
                                            {item.date}
                                        </span>
                                        <h3 className="font-bold text-slate-800 mt-2 line-clamp-2">
                                            {item.titleKey ? t(item.titleKey) : item.title}
                                        </h3>
                                    </div>
                                </div>
                                {item.description && (
                                    <p className="text-slate-600 text-sm line-clamp-3">
                                        {item.descriptionKey ? t(item.descriptionKey) : item.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                    {getFilteredItems().length === 0 && (
                        <div className="col-span-full text-center py-12 ns-card border-dashed">
                            <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No newspaper clippings found.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-lg overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-slate-200/70">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingId ? t('newspaper.edit_clipping') : t('newspaper.add_clipping')}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAdd} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{t('newspaper.type_label')}</label>
                                    <select
                                        className="ns-input mt-1"
                                        value={formData.sentiment}
                                        onChange={e => setFormData({ ...formData, sentiment: e.target.value as 'positive' | 'negative' })}
                                    >
                                        <option value="positive">{t('newspaper.positive_news')}</option>
                                        <option value="negative">{t('newspaper.negative_news')}</option>
                                    </select>
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
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('gallery.image_title')}</label>
                                <input
                                    type="text" required
                                    className="ns-input mt-1"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder={t('newspaper.title_placeholder')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('gallery.image_label')}</label>
                                <div className="mt-1 space-y-3">
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
                                <label className="block text-sm font-medium text-slate-700">{t('gallery.desc')}</label>
                                <textarea
                                    rows={3}
                                    className="ns-input mt-1"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder={t('newspaper.desc_placeholder')}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={uploading || !formData.imageUrl}
                                className="ns-btn-primary w-full justify-center disabled:opacity-50"
                            >
                                {uploading ? t('gallery.uploading') : editingId ? t('newspaper.edit_clipping') : t('newspaper.add_clipping')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-sm overflow-hidden p-6 space-y-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Delete Clipping?</h3>
                            <p className="text-slate-500 mt-2 text-sm">
                                Are you sure you want to delete <span className="font-semibold text-slate-900">{deleteTarget.title}</span>?
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewspaperClipping;
