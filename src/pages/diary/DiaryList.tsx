import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, BookOpen, Edit2, Trash2, X, Save } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { DiaryService } from '../../services/diaryService';
import { type DiaryEntry, type MeetingType, type DiaryStatus } from '../../types';

const DiaryList = () => {
    const { t } = useLanguage();
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<MeetingType | 'All'>('All');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
    const [formData, setFormData] = useState<Partial<DiaryEntry>>({
        meetingType: 'GB',
        status: 'Raised',
        meetingDate: new Date().toISOString().split('T')[0],
        tags: []
    });

    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        setLoading(true);
        const data = await DiaryService.getEntries();
        setEntries(data);
        setLoading(false);
    };

    const filteredEntries = entries.filter(entry => {
        const matchesSearch = entry.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (entry.description && entry.description.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesType = filterType === 'All' || entry.meetingType === filterType;

        return matchesSearch && matchesType;
    });

    const handleOpenModal = (entry?: DiaryEntry) => {
        if (entry) {
            setEditingEntry(entry);
            setFormData({
                meetingDate: entry.meetingDate,
                meetingType: entry.meetingType,
                subject: entry.subject,
                description: entry.description,
                department: entry.department,
                status: entry.status,
                response: entry.response,
                tags: entry.tags
            });
        } else {
            setEditingEntry(null);
            setFormData({
                meetingDate: new Date().toISOString().split('T')[0],
                meetingType: 'GB',
                status: 'Raised',
                subject: '',
                description: '',
                department: '',
                response: '',
                tags: []
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subject || !formData.meetingDate) return;

        if (editingEntry) {
            // Update logic (simplified for now as service update is placeholder)
            // await DiaryService.updateEntry(editingEntry.id, formData);
            alert('Update feature coming in next iteration, creating new for now to demo.');
            await DiaryService.addEntry(formData as any);
        } else {
            await DiaryService.addEntry(formData as any);
        }

        setIsModalOpen(false);
        loadEntries();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this entry?')) {
            await DiaryService.deleteEntry(id);
            loadEntries();
        }
    };

    const getStatusColor = (status: DiaryStatus) => {
        switch (status) {
            case 'Raised': return 'bg-yellow-100 text-yellow-800';
            case 'In Discussion': return 'bg-blue-100 text-blue-800';
            case 'Resolved': return 'bg-green-100 text-green-800';
            case 'Action Taken': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('diary.title')}</h1>
                    <p className="text-gray-600">{t('diary.subtitle')}</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span>{t('diary.add_entry')}</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={t('diary.search_placeholder')}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="text-gray-400 w-5 h-5" />
                    <select
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                    >
                        <option value="All">{t('diary.all_types')}</option>
                        <option value="GB">General Body (GB)</option>
                        <option value="Standing Committee">Standing Committee</option>
                        <option value="Ward Committee">Ward Committee</option>
                        <option value="Special GB">Special GB</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading entries...</div>
                ) : filteredEntries.length > 0 ? (
                    filteredEntries.map(entry => (
                        <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600`}>
                                            {entry.meetingType}
                                        </span>
                                        <span className="text-sm text-gray-500 flex items-center">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {entry.meetingDate}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">{entry.subject}</h3>
                                    {entry.department && (
                                        <p className="text-sm text-brand-600 font-medium">{entry.department} Dept</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                                        {entry.status}
                                    </span>
                                    <button
                                        onClick={() => handleOpenModal(entry)}
                                        className="p-1 text-gray-400 hover:text-brand-600 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(entry.id)}
                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {entry.description && (
                                <p className="mt-3 text-gray-600 text-sm whitespace-pre-wrap">{entry.description}</p>
                            )}

                            {entry.response && (
                                <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <p className="text-xs font-semibold text-gray-700 uppercase mb-1">Official Response</p>
                                    <p className="text-sm text-gray-600">{entry.response}</p>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">{t('diary.no_entries')}</h3>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingEntry ? 'Edit Diary Entry' : t('diary.new_entry_title')}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('diary.meeting_date')}</label>
                                    <input
                                        type="date" required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                                        value={formData.meetingDate}
                                        onChange={e => setFormData({ ...formData, meetingDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('diary.meeting_type')}</label>
                                    <select
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 bg-white"
                                        value={formData.meetingType}
                                        onChange={e => setFormData({ ...formData, meetingType: e.target.value as MeetingType })}
                                    >
                                        <option value="GB">General Body (GB)</option>
                                        <option value="Standing Committee">Standing Committee</option>
                                        <option value="Ward Committee">Ward Committee</option>
                                        <option value="Special GB">Special GB</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('diary.subject')}</label>
                                <input
                                    type="text" required
                                    placeholder="e.g. Water shortage in Ward 12"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('diary.description')}</label>
                                <textarea
                                    rows={4}
                                    placeholder={t('diary.desc_placeholder')}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('diary.department')}</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Water Supply"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('diary.status')}</label>
                                    <select
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 bg-white"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value as DiaryStatus })}
                                    >
                                        <option value="Raised">Raised</option>
                                        <option value="In Discussion">In Discussion</option>
                                        <option value="Resolved">Resolved</option>
                                        <option value="Action Taken">Action Taken</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('diary.response')}</label>
                                <textarea
                                    rows={3}
                                    placeholder={t('diary.resp_placeholder')}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                                    value={formData.response}
                                    onChange={e => setFormData({ ...formData, response: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center space-x-2 bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 transition-colors font-medium shadow-sm"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{t('diary.save_entry')}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiaryList;
