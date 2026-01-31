import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Search, Filter, Calendar, BookOpen, Edit2, Trash2, X, Save, ChevronRight, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { DiaryService } from '../../services/diaryService';
import { type DiaryEntry, type MeetingType, type DiaryStatus } from '../../types';

const DiaryList = () => {
    const { t } = useLanguage();
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [areaSearch, setAreaSearch] = useState('');
    const [showAreaDropdown, setShowAreaDropdown] = useState(false);
    const [filterType, setFilterType] = useState<MeetingType | 'All'>('All');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
    const [formData, setFormData] = useState<Partial<DiaryEntry>>({
        meetingType: 'GB',
        status: 'Raised',
        meetingDate: new Date().toISOString().split('T')[0],
        tags: []
    });

    // Delete Modal State
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, subject: string } | null>(null);

    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        setLoading(true);
        const data = await DiaryService.getEntries();
        setEntries(data);
        setLoading(false);
    };

    const uniqueAreas = Array.from(new Set(entries.map(e => e.area).filter(Boolean)))
        .map(area => ({
            name: area as string,
            count: entries.filter(e => e.area === area).length
        }))
        .sort((a, b) => b.count - a.count);

    const filteredEntries = entries.filter(entry => {
        const matchesSearch = entry.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (entry.description && entry.description.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesArea = !areaSearch || (entry.area && entry.area.toLowerCase().includes(areaSearch.toLowerCase()));

        const matchesType = filterType === 'All' || entry.meetingType === filterType;

        return matchesSearch && matchesType && matchesArea;
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
                area: entry.area,
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
                area: '',
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
            toast.info('Update feature coming in next iteration, creating new for now to demo.');
            await DiaryService.addEntry(formData as any);
        } else {
            await DiaryService.addEntry(formData as any);
            toast.success(t('Entry added successfully!') || 'Entry added successfully!');
        }

        setIsModalOpen(false);
        loadEntries();
    };

    const handleDeleteClick = (entry: DiaryEntry) => {
        setDeleteTarget({ id: entry.id, subject: entry.subject });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        await DiaryService.deleteEntry(deleteTarget.id);
        toast.success('Entry deleted successfully');
        setDeleteTarget(null);
        loadEntries();
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
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
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{t('diary.title')}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-slate-500">{t('diary.subtitle')}</p>
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-sky-50 text-sky-700 border border-sky-200">
                                Found: {filteredEntries.length}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="ns-btn-primary"
                    >
                        <Plus className="w-5 h-5" />
                        <span>{t('diary.add_entry')}</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="ns-card p-4 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t('diary.search_placeholder')}
                            className="ns-input pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t('diary.area') ? `Search ${t('diary.area')}...` : 'Search Area...'}
                            className="ns-input pl-10"
                            value={areaSearch}
                            onChange={(e) => {
                                setAreaSearch(e.target.value);
                                setShowAreaDropdown(true);
                            }}
                            onFocus={() => setShowAreaDropdown(true)}
                            onBlur={() => setTimeout(() => setShowAreaDropdown(false), 200)}
                        />
                        {showAreaDropdown && uniqueAreas.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                {uniqueAreas
                                    .filter(a => a.name.toLowerCase().includes(areaSearch.toLowerCase()))
                                    .map(area => (
                                        <button
                                            key={area.name}
                                            className="w-full text-left px-4 py-2 hover:bg-slate-50 flex justify-between items-center text-sm"
                                            onClick={() => {
                                                setAreaSearch(area.name);
                                                setShowAreaDropdown(false);
                                            }}
                                        >
                                            <span className="text-slate-700">{area.name}</span>
                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
                                                {area.count}
                                            </span>
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="text-slate-400 w-5 h-5" />
                        <select
                            className="ns-input"
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
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-slate-500">Loading entries...</div>
                ) : filteredEntries.length > 0 ? (
                    filteredEntries.map(entry => (
                        <div
                            key={entry.id}
                            className="ns-card overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => toggleExpand(entry.id)}
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="ns-badge border-slate-200 bg-slate-50 text-slate-700">
                                                {entry.meetingType}
                                            </span>
                                            <span className="text-sm text-slate-500 flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {entry.meetingDate}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900">{entry.subject}</h3>
                                        {entry.department && (
                                            <p className="text-sm text-brand-600 font-medium">{entry.department} Dept</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                                            {entry.status}
                                        </span>
                                        <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedId === entry.id ? 'rotate-90' : ''}`} />
                                    </div>
                                </div>

                                {entry.description && (
                                    <p className={`mt-3 text-slate-600 text-sm whitespace-pre-wrap ${expandedId === entry.id ? '' : 'line-clamp-2'}`}>{entry.description}</p>
                                )}

                                {entry.response && expandedId === entry.id && (
                                    <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                                        <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Official response</p>
                                        <p className="text-sm text-slate-700">{entry.response}</p>
                                    </div>
                                )}

                                {/* Actions (Visible when expanded) */}
                                {expandedId === entry.id && (
                                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenModal(entry);
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick(entry);
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 ns-card border-dashed">
                        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">{t('diary.no_entries')}</h3>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-slate-200/70 sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingEntry ? 'Edit Diary Entry' : t('diary.new_entry_title')}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{t('diary.meeting_date')}</label>
                                    <input
                                        type="date" required
                                        className="ns-input mt-1"
                                        value={formData.meetingDate}
                                        onChange={e => setFormData({ ...formData, meetingDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{t('diary.meeting_type')}</label>
                                    <select
                                        className="ns-input mt-1"
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
                                <label className="block text-sm font-medium text-slate-700">{t('diary.subject')}</label>
                                <input
                                    type="text" required
                                    placeholder="e.g. Water shortage in Ward 12"
                                    className="ns-input mt-1"
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('diary.description')}</label>
                                <textarea
                                    rows={4}
                                    placeholder={t('diary.desc_placeholder')}
                                    className="ns-input mt-1"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('diary.area') || 'Area'}</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Ward 12 or Colony Name"
                                    className="ns-input mt-1"
                                    value={formData.area}
                                    onChange={e => setFormData({ ...formData, area: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{t('diary.department')}</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Water Supply"
                                        className="ns-input mt-1"
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{t('diary.status')}</label>
                                    <select
                                        className="ns-input mt-1"
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
                                <label className="block text-sm font-medium text-slate-700">{t('diary.response')}</label>
                                <textarea
                                    rows={3}
                                    placeholder={t('diary.resp_placeholder')}
                                    className="ns-input mt-1"
                                    value={formData.response}
                                    onChange={e => setFormData({ ...formData, response: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/70">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="ns-btn-ghost border border-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="ns-btn-primary"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{t('diary.save_entry')}</span>
                                </button>
                            </div>
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
                            <h3 className="text-lg font-bold text-slate-900">Delete Entry?</h3>
                            <p className="text-slate-500 mt-2 text-sm">
                                Are you sure you want to delete <span className="font-semibold text-slate-900">{deleteTarget.subject}</span>? This action cannot be undone.
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

export default DiaryList;
