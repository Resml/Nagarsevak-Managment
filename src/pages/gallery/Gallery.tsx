import React, { useState, useEffect } from 'react';
import { Plus, Image as ImageIcon, Newspaper, Trash2, X, Upload, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { GalleryService } from '../../services/galleryService';
import { type GalleryItem, type GalleryCategory } from '../../types';

const Gallery = () => {
    const { t } = useLanguage();
    const activeTabState = useState<'events' | 'media'>('events');
    const activeTab = activeTabState[0];
    const setActiveTab = activeTabState[1];

    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [uploading, setUploading] = useState(false);

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
    }, [activeTab]);

    const loadGallery = async () => {
        setLoading(true);
        // If tab is 'media', we want newspapers. If 'events', we want everything else? 
        // Or simpler: Just fetch everything and filter on client to avoid complex service logic for now, 
        // or asking service for specific category.
        // Let's stick to client filtering for smoother tab switch if data is small. 
        // Actually service has getGalleryItems(category).
        // Let's fetch all then filter.

        const allItems = await GalleryService.getGalleryItems();
        setItems(allItems);
        setLoading(false);
    };

    const getFilteredItems = () => {
        let filtered = items;

        // Tab Filter
        if (activeTab === 'media') {
            filtered = filtered.filter(i => i.category === 'Newspaper');
        } else {
            filtered = filtered.filter(i => i.category !== 'Newspaper');
        }

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
                alert(t('gallery.upload_error'));
            } finally {
                setUploading(false);
            }
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        await GalleryService.addGalleryItem(formData);
        setIsModalOpen(false);
        setFormData({
            title: '',
            category: activeTab === 'media' ? 'Newspaper' : 'Event',
            imageUrl: '',
            description: '',
            date: new Date().toISOString().split('T')[0]
        });
        loadGallery();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this photo?')) {
            await GalleryService.deleteGalleryItem(id);
            loadGallery();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('gallery.title')}</h1>
                    <p className="text-gray-600">{t('gallery.subtitle')}</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span>{t('gallery.add_photo')}</span>
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={t('gallery.search_placeholder')}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full sm:w-48">
                    <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-gray-500"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
                {filterDate && (
                    <button
                        onClick={() => setFilterDate('')}
                        className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-lg"
                        title="Clear Date"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                            ${activeTab === 'events'
                                ? 'border-brand-500 text-brand-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <ImageIcon className="w-5 h-5" />
                        <span>{t('gallery.tab_events')}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('media')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                            ${activeTab === 'media'
                                ? 'border-brand-500 text-brand-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <Newspaper className="w-5 h-5" />
                        <span>{t('gallery.tab_media')}</span>
                    </button>
                </nav>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">{t('gallery.loading')}</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredItems().map(item => (
                        <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 group">
                            <div className="relative aspect-video bg-gray-100 overflow-hidden">
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-xs text-white font-medium">
                                    {item.category}
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-gray-900 line-clamp-1" title={item.title}>{item.title}</h3>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">{item.date}</span>
                                </div>
                                {item.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2" title={item.description}>
                                        {item.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                    {getFilteredItems().length === 0 && (
                        <div className="col-span-full text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
                            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">{t('gallery.no_photos')}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">{t('gallery.modal_title')}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAdd} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('gallery.category')}</label>
                                <select
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 bg-white"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value as GalleryCategory })}
                                >
                                    <option value="Event">Event</option>
                                    <option value="Work">Work</option>
                                    <option value="Award">Award</option>
                                    <option value="Newspaper">Newspaper Clipping</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('gallery.image_title')}</label>
                                <input
                                    type="text" required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Ganpati Festival"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('gallery.image_label')}</label>
                                <div className="mt-1 space-y-3">
                                    {/* File Input */}
                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                {uploading ? (
                                                    <p className="text-sm text-gray-500">{t('gallery.uploading')}</p>
                                                ) : formData.imageUrl ? (
                                                    <img src={formData.imageUrl} alt="preview" className="h-28 object-contain" />
                                                ) : (
                                                    <>
                                                        <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">{t('gallery.click_upload')}</span></p>
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
                                            <span className="px-2 bg-white text-sm text-gray-500">{t('gallery.use_url')}</span>
                                        </div>
                                    </div>

                                    <div className="flex rounded-md shadow-sm">
                                        <input
                                            type="url"
                                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-brand-500 focus:border-brand-500"
                                            value={formData.imageUrl}
                                            onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                            placeholder="https://..."
                                        />
                                        <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                            URL
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('gallery.date')}</label>
                                <input
                                    type="date" required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('gallery.desc')}</label>
                                <textarea
                                    rows={3}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50"
                            >
                                {uploading ? t('gallery.uploading') : t('gallery.submit')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gallery;
