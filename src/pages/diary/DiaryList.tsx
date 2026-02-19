import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Search, Filter, Calendar, BookOpen, Edit2, Trash2, X, Save, ChevronRight, CheckCircle, Wand2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { DiaryService } from '../../services/diaryService';
import { AIService } from '../../services/aiService';
import { TranslatedText } from '../../components/TranslatedText';
import { type DiaryEntry, type MeetingType, type DiaryStatus } from '../../types';

const DiaryList = () => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();
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
    const [generatingAI, setGeneratingAI] = useState(false);
    const [formData, setFormData] = useState<Partial<DiaryEntry>>({
        meetingType: 'GB',
        status: 'Raised',
        meetingDate: new Date().toISOString().split('T')[0],
        tags: [],
        beneficiaries: ''
    });

    // Delete Modal State
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, subject: string } | null>(null);

    useEffect(() => {
        fetchEntries();
    }, [tenantId]);

    const fetchEntries = async () => {
        if (!tenantId) return;
        try {
            setLoading(true);
            const data = await DiaryService.getEntries(tenantId);
            setEntries(data);
            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
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
                beneficiaries: entry.beneficiaries || '',
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
                beneficiaries: '',
                response: '',
                tags: []
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subject || !formData.meetingDate || !tenantId) return;

        if (editingEntry) {
            // Update logic (simplified for now as service update is placeholder)
            // await DiaryService.updateEntry(editingEntry.id, formData);
            toast.info('Update feature coming in next iteration, creating new for now to demo.');
            await DiaryService.addEntry(formData as any, tenantId);
        } else {
            await DiaryService.addEntry(formData as any, tenantId);
            toast.success(t('Entry added successfully!') || 'Entry added successfully!');
        }

        setIsModalOpen(false);
        fetchEntries();
    };

    const handleDeleteClick = (entry: DiaryEntry) => {
        setDeleteTarget({ id: entry.id, subject: entry.subject });
    };

    const confirmDelete = async () => {
        if (!deleteTarget || !tenantId) return;
        await DiaryService.deleteEntry(deleteTarget.id, tenantId);
        toast.success(t('diary.delete_success'));
        setDeleteTarget(null);
        fetchEntries();
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

    const handleAutoGenerate = async () => {
        if (!formData.subject) return;
        setGeneratingAI(true);
        try {
            const desc = await AIService.generateContent(formData.subject!, 'Work Report', 'Professional', 'Marathi');
            setFormData(prev => ({ ...prev, description: desc }));
        } catch (error) {
            console.error(error);
            toast.error(t('work_history.desc_gen_failed'));
        } finally {
            setGeneratingAI(false);
        }
    };

    const getStatusText = (status: DiaryStatus) => {
        switch (status) {
            case 'Raised': return t('diary.status_raised');
            case 'In Discussion': return t('diary.status_discussion');
            case 'Resolved': return t('diary.status_resolved');
            case 'Action Taken': return t('diary.status_action');
            default: return status;
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
                                {t('diary.found')}: {filteredEntries.length}
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
                            placeholder={t('diary.search_area_placeholder')}
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
                            <option value="GB">{t('diary.type_gb')}</option>
                            <option value="Standing Committee">{t('diary.type_standing')}</option>
                            <option value="Ward Committee">{t('diary.type_ward')}</option>
                            <option value="Special GB">{t('diary.type_special_gb')}</option>
                            <option value="Other">{t('diary.type_other')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="ns-card overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2 w-full">
                                            <div className="flex items-center gap-2">
                                                <div className="h-5 w-16 bg-slate-200 rounded-full animate-pulse" />
                                                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                                            </div>
                                            <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse" />
                                            <div className="h-4 w-1/4 bg-slate-200 rounded animate-pulse" />
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="mt-4 h-4 w-full bg-slate-200 rounded animate-pulse" />
                                    <div className="mt-2 h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </>
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
                                        <h3 className="text-lg font-semibold text-slate-900"><TranslatedText text={entry.subject} /></h3>
                                        {entry.department && (
                                            <p className="text-sm text-brand-600 font-medium"><TranslatedText text={entry.department} /> {t('diary.dept_label')}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                                            {getStatusText(entry.status)}
                                        </span>
                                        <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedId === entry.id ? 'rotate-90' : ''}`} />
                                    </div>
                                </div>

                                {entry.description && (
                                    <p className={`mt-3 text-slate-600 text-sm whitespace-pre-wrap ${expandedId === entry.id ? '' : 'line-clamp-2'}`}><TranslatedText text={entry.description} /></p>
                                )}

                                {entry.beneficiaries && expandedId === entry.id && (
                                    <div className="mt-3 flex items-center gap-2 text-sm text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100 w-fit">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="font-semibold">{t('diary.beneficiaries')}: <TranslatedText text={entry.beneficiaries} /></span>
                                    </div>
                                )}

                                {entry.response && expandedId === entry.id && (
                                    <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                                        <p className="text-xs font-semibold text-slate-600 uppercase mb-1">{t('diary.official_response')}</p>
                                        <p className="text-sm text-slate-700"><TranslatedText text={entry.response} /></p>
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
                                            {t('diary.edit')}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick(entry);
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            {t('diary.delete')}
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
                                {editingEntry ? t('diary.edit_entry_title') : t('diary.new_entry_title')}
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
                                        <option value="GB">{t('diary.type_gb')}</option>
                                        <option value="Standing Committee">{t('diary.type_standing')}</option>
                                        <option value="Ward Committee">{t('diary.type_ward')}</option>
                                        <option value="Special GB">{t('diary.type_special_gb')}</option>
                                        <option value="Other">{t('diary.type_other')}</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('diary.subject')}</label>
                                <input
                                    type="text" required
                                    placeholder={t('diary.subject_placeholder')}
                                    className="ns-input mt-1"
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('diary.description')}</label>
                                <div className="relative">
                                    <textarea
                                        rows={4}
                                        placeholder={t('diary.desc_placeholder')}
                                        className="ns-input mt-1 pr-10"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAutoGenerate}
                                        disabled={generatingAI || !formData.subject}
                                        className="absolute right-2 bottom-2 text-brand-700 hover:text-brand-800 disabled:opacity-50"
                                        title="Auto draft description"
                                    >
                                        <Wand2 className={`w-5 h-5 ${generatingAI ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{t('work_history.auto_draft_hint')}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{t('diary.area')}</label>
                                    <input
                                        type="text"
                                        placeholder={t('diary.area_placeholder')}
                                        className="ns-input mt-1"
                                        value={formData.area}
                                        onChange={e => setFormData({ ...formData, area: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{t('diary.beneficiaries')}</label>
                                    <input
                                        type="text"
                                        placeholder={t('diary.beneficiaries_placeholder')}
                                        className="ns-input mt-1"
                                        value={formData.beneficiaries}
                                        onChange={e => setFormData({ ...formData, beneficiaries: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{t('diary.department')}</label>
                                    <input
                                        type="text"
                                        placeholder={t('diary.dept_placeholder')}
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
                                        <option value="Raised">{t('diary.status_raised')}</option>
                                        <option value="In Discussion">{t('diary.status_discussion')}</option>
                                        <option value="Resolved">{t('diary.status_resolved')}</option>
                                        <option value="Action Taken">{t('diary.status_action')}</option>
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
                                    {t('diary.cancel')}
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
                            <h3 className="text-lg font-bold text-slate-900">{t('diary.delete_confirm_title')}</h3>
                            <p className="text-slate-500 mt-2 text-sm">
                                {t('diary.delete_confirm_msg')}
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                            >
                                {t('diary.cancel')}
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                            >
                                {t('diary.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiaryList;
