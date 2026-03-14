import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../services/supabaseClient';
import { AIService } from '../../services/aiService';
import { FeedbackService } from '../../services/feedbackService';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { CheckCircle, Clock, Hammer, MapPin, Plus, Search, User, FileText, HeartHandshake, Wand2, ChevronRight, Download, Check, LayoutGrid, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { TranslatedText } from '../../components/TranslatedText';
import { AhwalReportGenerator } from './AhwalReportGenerator';
import { useTutorial } from '../../context/TutorialContext';
import WorkHistoryTutorial from '../../components/tutorial/WorkHistoryTutorial';
import { HelpCircle } from 'lucide-react';

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
    amount?: number;
}

const WorkHistory = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const { tenantId } = useTenant(); // Added tenantId
    const { startTutorial } = useTutorial();
    const [items, setItems] = useState<WorkItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [generatingAI, setGeneratingAI] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'report'>('grid');

    // Feedback State
    const [feedbackStats, setFeedbackStats] = useState<Record<string, { count: number, average: string }>>({});

    // Advanced Filtering State
    const [areaSearch, setAreaSearch] = useState('');
    const [showAreaDropdown, setShowAreaDropdown] = useState(false);
    const [dateSearch, setDateSearch] = useState('');
    const [showDateDropdown, setShowDateDropdown] = useState(false);

    // Ahwal Report State
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedWorkIds, setSelectedWorkIds] = useState<Set<string>>(new Set());
    const [showAhwalPreview, setShowAhwalPreview] = useState(false);

    // Modal State (Create Only)
    const [showModal, setShowModal] = useState(false);
    const [newWork, setNewWork] = useState({
        title: '',
        description: '',
        location: '',
        area: '',
        status: 'Planned',
        completion_date: '',
        peopleBenefited: '',
        amount: ''
    });

    useEffect(() => {
        fetchData();

        // 1. Subscribe to Work/Complaint Changes
        // 1. Subscribe to Work/Complaint Changes
        const workSubscription = supabase
            .channel('work_history_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'works', filter: `tenant_id=eq.${tenantId}` }, () => fetchData())
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
                .eq('tenant_id', tenantId) // Secured
                .order('created_at', { ascending: false });

            if (worksError) throw worksError;

            // 2. Normalize
            const manualItems: WorkItem[] = (works || []).map((w: any) => ({
                id: `work-${w.id}`,
                source: 'Manual',
                title: w.title,
                description: w.description,
                location: w.location,
                area: w.area,
                status: w.status,
                date: w.completion_date || w.created_at,
                amount: w.amount
            }));

            // Sort by Date
            const allItems = manualItems.sort((a, b) =>
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
            const { peopleBenefited, ...workFields } = newWork;
            const payload = {
                ...workFields,
                amount: newWork.amount || 0,
                completion_date: newWork.completion_date || null,
                metadata: JSON.stringify({
                    people_benefited: peopleBenefited
                }),
                created_at: new Date().toISOString()
            };

            const { error: insertError } = await supabase
                .from('works')
                .insert([{ ...payload, tenant_id: tenantId }]); // Secured

            if (insertError) throw insertError;

            setShowModal(false);
            setNewWork({ title: '', description: '', location: '', area: '', status: 'Planned', completion_date: '', peopleBenefited: '', amount: '' });
            fetchData();
            toast.success(t('work_history.work_added'));
        } catch (err: any) {
            console.error(err);
            toast.error(t('work_history.work_failed'));
        }
    };

    const handleCardClick = (item: WorkItem) => {
        if (selectionMode) {
            setSelectedWorkIds(prev => {
                const newSet = new Set(prev);
                if (newSet.has(item.id)) newSet.delete(item.id);
                else newSet.add(item.id);
                return newSet;
            });
            return;
        }
        const dbId = item.id.replace('work-', '');
        navigate(`/dashboard/history/${dbId}`);
    };

    const toggleSelectionMode = () => {
        setSelectionMode(!selectionMode);
        setSelectedWorkIds(new Set());
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
        return <Hammer className="w-4 h-4 text-blue-500" />;
    };

    const getStatusBadge = (status: string, source: string) => {
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
                    <div className="tutorial-work-header">
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            {t('work_history.title')}
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                                {t('work_history.found')}: {filteredItems.length}
                            </span>
                        </h1>
                        <p className="text-sm text-slate-500">{t('work_history.subtitle')}</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="hidden md:flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm tutorial-work-view">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                            >
                                <LayoutGrid className="w-4 h-4" /> {t('common.grid')}</button>
                            <button
                                onClick={() => setViewMode('report')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'report' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                            >
                                <FileText className="w-4 h-4" /> {t('common.report')}
                            </button>
                            {viewMode === 'report' && (
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                    title="Print Report"
                                >
                                    <Printer className="w-4 h-4" /> Print
                                </button>
                            )}
                        </div>
                        {!selectionMode && (
                            <button
                                onClick={toggleSelectionMode}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors tutorial-work-ahwal"
                            >
                                <FileText className="w-4 h-4" /> {t('work_history.generate_ahwal') || 'Generate Ahwal'}
                            </button>
                        )}
                        <button
                            onClick={startTutorial}
                            className="ns-btn-ghost border border-brand-200 text-brand-700 bg-white hover:bg-brand-50 px-4 py-2 rounded-xl flex items-center gap-2 tutorial-work-help shadow-sm"
                        >
                            <HelpCircle className="w-4 h-4" />
                            <span>{language === 'mr' ? 'मदत' : 'Help'}</span>
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="ns-btn-primary tutorial-work-new"
                        >
                            <Plus className="w-4 h-4" /> {t('work_history.add_work')}
                        </button>
                    </div>
                </div>

                {/* Selection Action Bar */}
                {selectionMode && (
                    <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                                {selectedWorkIds.size}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{t('work_history.works_selected') || 'Works Selected'}</h3>
                                <p className="text-sm text-slate-600">{t('work_history.select_works') || 'Select works to include in the Ahwal report.'}</p>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <button
                                onClick={toggleSelectionMode}
                                className="ns-btn-ghost text-slate-600 bg-white flex-1 sm:flex-none"
                            >
                                {t('common.cancel') || 'Cancel'}
                            </button>
                            <button
                                onClick={() => setShowAhwalPreview(true)}
                                disabled={selectedWorkIds.size === 0}
                                className="ns-btn-primary flex-1 sm:flex-none"
                            >
                                <FileText className="w-4 h-4" /> {t('work_history.preview_report') || 'Preview Report'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Main Search */}
                    <div className="md:col-span-6 relative tutorial-work-search">
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
                    <div className="md:col-span-3 relative dropdown-container tutorial-work-area">
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
                    <div className="md:col-span-3 relative dropdown-container tutorial-work-date">
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
            <div className="tutorial-work-list">
                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl"></div>)}
                    </div>
                ) : viewMode === 'report' ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('work_history.project_title')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('work_history.location')} / Area</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('complaints.table.status')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reported By / Source</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('complaints.table.date')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {filteredItems.map((item, index) => (
                                        <tr key={item.id} className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectionMode && selectedWorkIds.has(item.id) ? 'bg-brand-50/50' : ''}`} onClick={() => handleCardClick(item)}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {selectionMode ? (
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedWorkIds.has(item.id) ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300'}`}>
                                                        {selectedWorkIds.has(item.id) && <Check className="w-3 h-3" />}
                                                    </div>
                                                ) : (
                                                    index + 1
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-900">
                                                    <TranslatedText text={item.title} />
                                                </div>
                                                <div className="text-xs text-slate-500 line-clamp-1 mt-1 max-w-xs">
                                                    <TranslatedText text={item.description} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-900">
                                                    <TranslatedText text={item.location} />
                                                    {item.area && <span className="text-slate-500 ml-1">({item.area})</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(item.status, item.source)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                                                    {getSourceIcon(item.source)}
                                                    <span>{item.source === 'Manual' ? t('work_history.manual') : (item.source === 'Help' ? t('work_history.help') : t('work_history.complaint'))}</span>
                                                </div>
                                                {item.citizenName && (
                                                    <div className="text-sm text-blue-600 font-medium">
                                                        {item.citizenName}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-900">{format(new Date(item.date), 'MMM d, yyyy')}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {item.amount ? (
                                                    <div className="text-sm font-medium text-green-600">₹ {item.amount}</div>
                                                ) : (
                                                    <span className="text-slate-400">--</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredItems.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                                {t('work_history.no_records')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map((item) => (
                            <div
                                key={item.id}
                                className={`ns-card overflow-hidden hover:shadow-md transition-all flex flex-col h-full cursor-pointer group relative ${selectionMode && selectedWorkIds.has(item.id)
                                    ? 'ring-2 ring-brand-500 bg-brand-50/30'
                                    : ''
                                    }`}
                                onClick={() => handleCardClick(item)}
                            >
                                {selectionMode && (
                                    <div className="absolute top-4 right-4 z-10 pointer-events-none">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedWorkIds.has(item.id)
                                            ? 'bg-brand-600 border-brand-600 text-white'
                                            : 'border-slate-300 bg-white/80'
                                            }`}>
                                            {selectedWorkIds.has(item.id) && <Check className="w-3.5 h-3.5" />}
                                        </div>
                                    </div>
                                )}

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
                                            {item.amount && (
                                                <div className="flex items-center text-xs text-green-600 gap-1 font-medium">
                                                    <span>₹ {item.amount}</span>
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
                                    <div className="grid grid-cols-2 gap-4">
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
                                        <label className="block text-sm font-medium text-slate-700">{t('work_history.total_amount_spent')}</label>
                                        <input
                                            type="number"
                                            className="ns-input mt-1"
                                            placeholder={t('work_history.amount_placeholder')}
                                            value={newWork.amount}
                                            onChange={e => setNewWork({ ...newWork, amount: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="ns-btn-ghost border border-slate-200">{t('work_history.cancel')}</button>
                                    <button type="submit" className="ns-btn-primary">{t('work_history.save_project')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showAhwalPreview && (
                    <AhwalReportGenerator
                        selectedWorks={filteredItems.filter(item => selectedWorkIds.has(item.id))}
                        onClose={() => setShowAhwalPreview(false)}
                    />
                )}
            </div>
            <WorkHistoryTutorial />
        </div>
    );
};

export default WorkHistory;
