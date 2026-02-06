import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../services/supabaseClient';
import { AIService } from '../../services/aiService';
import { FeedbackService } from '../../services/feedbackService';
import { useLanguage } from '../../context/LanguageContext';
import { CheckCircle, Clock, Hammer, MapPin, Plus, Search, User, FileText, HeartHandshake, Wand2, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { TranslatedText } from '../../components/TranslatedText';

interface WorkItem {
    id: string;
    source: 'Manual' | 'Complaint' | 'Help';
    title: string;
    description: string;
    location: string;
    area?: string;
    status: string;
    date: string;
    citizenName?: string;
}

const WorkHistory = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [items, setItems] = useState<WorkItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [generatingAI, setGeneratingAI] = useState(false);

    // Feedback State
    const [feedbackStats, setFeedbackStats] = useState<Record<string, { count: number, average: string }>>({});

    // Advanced Filtering State
    const [areaSearch, setAreaSearch] = useState('');
    const [showAreaDropdown, setShowAreaDropdown] = useState(false);
    const [dateSearch, setDateSearch] = useState('');
    const [showDateDropdown, setShowDateDropdown] = useState(false);

    // Modal State (Create Only)
    const [showModal, setShowModal] = useState(false);
    const [newWork, setNewWork] = useState({
        title: '',
        description: '',
        location: '',
        area: '',
        status: 'Planned',
        completion_date: '',
        peopleBenefited: ''
    });

    useEffect(() => {
        fetchData();

        // 1. Subscribe to Work/Complaint Changes
        const workSubscription = supabase
            .channel('work_history_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'works' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => fetchData())
            .subscribe();

        // 2. Subscribe to REAL-TIME Feedback
        const feedbackSubscription = FeedbackService.subscribeToFeedback(async (payload) => {
            const newFeedback = payload.new;
            const workId = newFeedback.work_id;
            // Limit specific table fetches if possible, but for now refreshing all works is safer or single stats
            const stats = await FeedbackService.getFeedbackStats(workId);
            setFeedbackStats(prev => ({
                ...prev,
                [workId]: { count: stats.count, average: stats.average }
            }));
        });

        return () => {
            workSubscription.unsubscribe();
            supabase.removeChannel(feedbackSubscription);
        };
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!(event.target as Element).closest('.dropdown-container')) {
                setShowAreaDropdown(false);
                setShowDateDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Manual Works
            const { data: works, error: worksError } = await supabase
                .from('works')
                .select('*')
                .order('created_at', { ascending: false });

            if (worksError) throw worksError;

            // 2. Fetch Resolved Complaints/Help
            const { data: complaints, error: complaintsError } = await supabase
                .from('complaints')
                .select(`
                    id, problem, location, status, category, created_at,
                    voter:voters (name_english, name_marathi)
                `)
                .in('status', ['Resolved', 'Closed'])
                .order('created_at', { ascending: false });

            if (complaintsError) throw complaintsError;

            // 3. Normalize & Merge
            const manualItems: WorkItem[] = (works || []).map((w: any) => ({
                id: `work-${w.id}`,
                source: 'Manual',
                title: w.title,
                description: w.description,
                location: w.location,
                area: w.area,
                status: w.status,
                date: w.completion_date || w.created_at
            }));

            const complaintItems: WorkItem[] = (complaints || []).map((c: any) => ({
                id: `comp-${c.id}`,
                source: c.category === 'Help' ? 'Help' : 'Complaint',
                title: c.category === 'Help' ? t('work_history.help_provided') : t('work_history.issue_resolved'),
                description: c.problem,
                location: c.location || 'Not Provided',
                status: 'Completed',
                date: c.created_at,
                citizenName: c.voter?.name_english || c.voter?.name_marathi || 'Citizen'
            }));

            const allItems = [...manualItems, ...complaintItems].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            setItems(allItems);

            // Load stats for all items
            const statsMap: Record<string, { count: number, average: string }> = {};
            for (const item of manualItems) {
                // Remove prefix for DB query
                const dbId = item.id.replace('work-', '');
                const stats = await FeedbackService.getFeedbackStats(dbId);
                statsMap[dbId] = { count: stats.count, average: stats.average };
            }
            setFeedbackStats(statsMap);

        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoGenerate = async () => {
        if (!newWork.title) return;
        setGeneratingAI(true);
        try {
            const desc = await AIService.generateContent(newWork.title, 'Work Report', 'Professional', 'Marathi');
            setNewWork(prev => ({ ...prev, description: desc }));
        } catch (error) {
            console.error(error);
            toast.error(t('work_history.desc_gen_failed'));
        } finally {
            setGeneratingAI(false);
        }
    };

    const handleAddWork = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload = {
                ...newWork,
                completion_date: newWork.completion_date || null,
                metadata: JSON.stringify({
                    people_benefited: newWork.peopleBenefited
                }),
                created_at: new Date().toISOString()
            };

            const { error: insertError } = await supabase
                .from('works')
                .insert([payload]);

            if (insertError) throw insertError;

            setShowModal(false);
            setNewWork({ title: '', description: '', location: '', area: '', status: 'Planned', completion_date: '', peopleBenefited: '' });
            fetchData();
            toast.success(t('work_history.work_added'));
        } catch (err: any) {
            console.error(err);
            toast.error(t('work_history.work_failed'));
        }
    };

    const handleCardClick = (item: WorkItem) => {
        if (item.source === 'Manual') {
            const dbId = item.id.replace('work-', '');
            navigate(`/history/${dbId}`);
        } else {
            const dbId = item.id.replace('comp-', '');
            navigate(`/complaints/${dbId}`);
        }
    };

    // Helper: Get Unique Areas with Counts
    const getAreaSuggestions = () => {
        const stats: Record<string, number> = {};
        items.forEach(item => {
            if (item.area) {
                stats[item.area] = (stats[item.area] || 0) + 1;
            }
        });
        return Object.entries(stats).map(([area, count]) => ({ area, count }));
    };

    // Helper: Get Unique Dates with Counts
    const getDateSuggestions = () => {
        const stats: Record<string, number> = {};
        items.forEach(item => {
            if (item.date) {
                const dateStr = format(new Date(item.date), 'MMM d, yyyy');
                stats[dateStr] = (stats[dateStr] || 0) + 1;
            }
        });
        return Object.entries(stats).map(([date, count]) => ({ date, count }));
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = !searchTerm || (() => {
            const term = searchTerm.toLowerCase();
            return (
                item.title.toLowerCase().includes(term) ||
                item.description.toLowerCase().includes(term) ||
                item.location.toLowerCase().includes(term)
            );
        })();

        const matchesArea = !areaSearch || (item.area && item.area.toLowerCase().includes(areaSearch.toLowerCase()));
        const matchesDate = !dateSearch || (item.date && format(new Date(item.date), 'MMM d, yyyy').toLowerCase().includes(dateSearch.toLowerCase()));

        return matchesSearch && matchesArea && matchesDate;
    });

    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'Manual': return <Hammer className="w-4 h-4 text-blue-500" />;
            case 'Help': return <HeartHandshake className="w-4 h-4 text-purple-500" />;
            default: return <FileText className="w-4 h-4 text-green-500" />; // Complaint
        }
    };

    const getStatusBadge = (status: string, source: string) => {
        if (source !== 'Manual') {
            return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {t('work_history.resolved')}</span>;
        }
        switch (status) {
            case 'Completed':
                return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {t('work_history.completed')}</span>;
            case 'InProgress':
                return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><Hammer className="w-3 h-3" /> {t('work_history.in_progress')}</span>;
            default:
                return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> {t('work_history.planned')}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            {t('work_history.title')}
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                                {t('work_history.found')}: {filteredItems.length}
                            </span>
                        </h1>
                        <p className="text-sm text-slate-500">{t('work_history.subtitle')}</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="ns-btn-primary"
                    >
                        <Plus className="w-4 h-4" /> {t('work_history.add_work')}
                    </button>
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Main Search */}
                    <div className="md:col-span-6 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t('work_history.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="ns-input pl-10 w-full"
                        />
                    </div>

                    {/* Area Search */}
                    <div className="md:col-span-3 relative dropdown-container">
                        <input
                            type="text"
                            placeholder={t('work_history.search_area')}
                            className="ns-input w-full bg-white shadow-sm"
                            value={areaSearch}
                            onFocus={() => { setShowAreaDropdown(true); setShowDateDropdown(false); }}
                            onChange={(e) => setAreaSearch(e.target.value)}
                        />
                        {showAreaDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {getAreaSuggestions().filter(s => s.area.toLowerCase().includes(areaSearch.toLowerCase())).map((item) => (
                                    <div
                                        key={item.area}
                                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                                        onClick={() => {
                                            setAreaSearch(item.area);
                                            setShowAreaDropdown(false);
                                        }}
                                    >
                                        <span className="text-sm text-slate-700">{item.area}</span>
                                        <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{item.count}</span>
                                    </div>
                                ))}
                                {getAreaSuggestions().filter(s => s.area.toLowerCase().includes(areaSearch.toLowerCase())).length === 0 && (
                                    <div className="px-4 py-2 text-sm text-slate-500 italic">{t('work_history.no_areas')}</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Date Search */}
                    <div className="md:col-span-3 relative dropdown-container">
                        <input
                            type="text"
                            placeholder={t('work_history.filter_date')}
                            className="ns-input w-full bg-white shadow-sm"
                            value={dateSearch}
                            onFocus={() => { setShowDateDropdown(true); setShowAreaDropdown(false); }}
                            onChange={(e) => setDateSearch(e.target.value)}
                        />
                        {showDateDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {getDateSuggestions().filter(d => d.date.toLowerCase().includes(dateSearch.toLowerCase())).map((item) => (
                                    <div
                                        key={item.date}
                                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                                        onClick={() => {
                                            setDateSearch(item.date);
                                            setShowDateDropdown(false);
                                        }}
                                    >
                                        <span className="text-sm text-slate-700">{item.date}</span>
                                        <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl"></div>)}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            className="ns-card overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer group"
                            onClick={() => handleCardClick(item)}
                        >
                            <div className="p-5 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-3">
                                    {getStatusBadge(item.status, item.source)}
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200/70">
                                            {getSourceIcon(item.source)}
                                            <span>{item.source === 'Manual' ? t('work_history.manual') : (item.source === 'Help' ? t('work_history.help') : t('work_history.complaint'))}</span>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-brand-700 transition-colors flex justify-between items-start">
                                    <TranslatedText text={item.title} />
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-400" />
                                </h3>
                                <p className="text-sm text-slate-600 mb-4 line-clamp-3"><TranslatedText text={item.description} /></p>

                                <div className="mt-auto pt-3 border-t border-slate-200/70">
                                    {item.source === 'Manual' && feedbackStats[item.id.replace('work-', '')] && (
                                        <div className="mb-3 flex items-center justify-between text-xs font-semibold bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg border border-brand-100">
                                            <span>{feedbackStats[item.id.replace('work-', '')].count} {t('work_history.feedback')}</span>
                                            <span>{feedbackStats[item.id.replace('work-', '')].average} ★</span>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <div className="flex items-center text-xs text-slate-500 gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{format(new Date(item.date), 'MMM d, yyyy')}</span>
                                        </div>
                                        <div className="flex items-center text-xs text-slate-500 gap-1">
                                            <MapPin className="w-3 h-3" />
                                            <span className="truncate"><TranslatedText text={item.location} /> {item.area ? `(${item.area})` : ''}</span>
                                        </div>
                                        {item.citizenName && (
                                            <div className="flex items-center text-xs text-blue-600 gap-1 font-medium">
                                                <User className="w-3 h-3" />
                                                <span>{t('work_history.for_citizen')} {item.citizenName}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredItems.length === 0 && (
                        <div className="col-span-full text-center py-10 text-slate-500 ns-card border-dashed">
                            {t('work_history.no_records')}
                        </div>
                    )}
                </div>
            )}

            {/* Add Work Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="ns-card max-w-lg w-full p-6">
                        <h2 className="text-xl font-bold mb-4 text-slate-900">{t('work_history.modal_title')}</h2>
                        <form onSubmit={handleAddWork} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('work_history.project_title')}</label>
                                <input
                                    type="text" required
                                    className="ns-input mt-1"
                                    value={newWork.title}
                                    onChange={e => setNewWork({ ...newWork, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('work_history.description')}</label>
                                <div className="relative">
                                    <textarea
                                        className="ns-input mt-1 pr-10"
                                        rows={3}
                                        value={newWork.description}
                                        onChange={e => setNewWork({ ...newWork, description: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAutoGenerate}
                                        disabled={generatingAI || !newWork.title}
                                        className="absolute right-2 bottom-2 text-brand-700 hover:text-brand-800 disabled:opacity-50"
                                        title="Auto draft description"
                                    >
                                        <Wand2 className={`w-5 h-5 ${generatingAI ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{t('work_history.auto_draft_hint')}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{t('work_history.location')}</label>
                                    <input
                                        type="text"
                                        className="ns-input mt-1"
                                        value={newWork.location}
                                        onChange={e => setNewWork({ ...newWork, location: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{t('work_history.area_locality')}</label>
                                    <input
                                        type="text"
                                        className="ns-input mt-1"
                                        value={newWork.area}
                                        onChange={e => setNewWork({ ...newWork, area: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{t('work_history.completion_date')}</label>
                                    <input
                                        type="date"
                                        className="ns-input mt-1"
                                        value={newWork.completion_date}
                                        onChange={e => setNewWork({ ...newWork, completion_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{t('work_history.people_benefited')}</label>
                                    <input
                                        type="number"
                                        className="ns-input mt-1"
                                        placeholder={t('work_history.people_benefited_placeholder')}
                                        value={newWork.peopleBenefited}
                                        onChange={e => setNewWork({ ...newWork, peopleBenefited: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('work_history.status')}</label>
                                <select
                                    className="ns-input mt-1"
                                    value={newWork.status}
                                    onChange={e => setNewWork({ ...newWork, status: e.target.value })}
                                >
                                    <option value="Planned">{t('work_history.planned')}</option>
                                    <option value="InProgress">{t('work_history.in_progress')}</option>
                                    <option value="Completed">{t('work_history.completed')}</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="ns-btn-ghost border border-slate-200">{t('work_history.cancel')}</button>
                                <button type="submit" className="ns-btn-primary">{t('work_history.save_project')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkHistory;
