import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Lightbulb, ThumbsUp, MapPin, Calendar, Wand2, User, X, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { TranslatedText } from '../../components/TranslatedText';
import { toast } from 'sonner';
import { supabase } from '../../services/supabaseClient';
import { AIService } from '../../services/aiService';

interface ImprovementParam {
    id: string;
    title: string;
    description: string;
    votes: number;
    location: string;
    area: string;
    status: 'Pending' | 'Planned' | 'In Progress' | 'Complete';
    completion_date: string;
    metadata?: any;
    created_at: string;
}

import { useTenant } from '../../context/TenantContext';

const PossibleImprovements = () => {
    const { t } = useLanguage();
    const { tenantId } = useTenant();
    const navigate = useNavigate();
    const [improvements, setImprovements] = useState<ImprovementParam[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);

    const [newImprovement, setNewImprovement] = useState({
        title: '',
        description: '',
        location: '',
        area: '',
        status: 'Pending' as 'Pending' | 'Planned' | 'In Progress' | 'Complete',
        completion_date: '',
        peopleBenefited: ''
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [areaSearch, setAreaSearch] = useState('');
    const [showAreaDropdown, setShowAreaDropdown] = useState(false);
    const [dateSearch, setDateSearch] = useState('');
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Planned' | 'In Progress' | 'Complete'>('All');

    // Helper: Get Unique Areas with Counts
    const getAreaSuggestions = () => {
        const stats: Record<string, number> = {};
        improvements.forEach(item => {
            if (item.area) {
                stats[item.area] = (stats[item.area] || 0) + 1;
            }
        });
        return Object.entries(stats).map(([area, count]) => ({ area, count }));
    };

    // Helper: Get Unique Dates with Counts
    const getDateSuggestions = () => {
        const stats: Record<string, number> = {};
        improvements.forEach(item => {
            if (item.created_at) {
                const dateStr = format(new Date(item.created_at), 'MMM d, yyyy');
                stats[dateStr] = (stats[dateStr] || 0) + 1;
            }
        });
        return Object.entries(stats).map(([date, count]) => ({ date, count }));
    };

    const filteredImprovements = improvements.filter(item => {
        const matchesSearch = !searchTerm || (() => {
            const term = searchTerm.toLowerCase();
            return (
                item.title.toLowerCase().includes(term) ||
                item.description.toLowerCase().includes(term) ||
                item.location.toLowerCase().includes(term)
            );
        })();

        const matchesArea = !areaSearch || (item.area && item.area.toLowerCase().includes(areaSearch.toLowerCase()));
        const matchesDate = !dateSearch || (item.created_at && format(new Date(item.created_at), 'MMM d, yyyy').toLowerCase().includes(dateSearch.toLowerCase()));
        const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

        return matchesSearch && matchesArea && matchesDate && matchesStatus;
    });

    const statusCounts = {
        All: improvements.length,
        Pending: improvements.filter(i => i.status === 'Pending').length,
        Planned: improvements.filter(i => i.status === 'Planned').length,
        'In Progress': improvements.filter(i => i.status === 'In Progress').length,
        Complete: improvements.filter(i => i.status === 'Complete').length,
    };

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

    useEffect(() => {
        if (tenantId) {
            fetchData();

            // Subscribe to changes
            const subscription = supabase
                .channel('improvements_channel')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'improvements', filter: `tenant_id=eq.${tenantId}` }, () => fetchData())
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [tenantId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('improvements')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('votes', { ascending: false });

            if (error) throw error;
            setImprovements(data || []);
        } catch (err) {
            console.error('Error fetching improvements:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoGenerate = async () => {
        if (!newImprovement.title) return;
        setGeneratingAI(true);
        try {
            const desc = await AIService.generateContent(newImprovement.title, 'Work Report', 'Professional', 'Marathi');
            setNewImprovement(prev => ({ ...prev, description: desc }));
        } catch (error) {
            console.error(error);
            toast.error(t('work_history.desc_gen_failed'));
        } finally {
            setGeneratingAI(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                title: newImprovement.title,
                description: newImprovement.description,
                location: newImprovement.location,
                area: newImprovement.area,
                status: newImprovement.status,
                completion_date: newImprovement.completion_date || null,
                tenant_id: tenantId,
                metadata: {
                    people_benefited: newImprovement.peopleBenefited
                }
            };

            const { error } = await supabase
                .from('improvements')
                .insert([payload]);

            if (error) throw error;

            setShowModal(false);
            setNewImprovement({
                title: '',
                description: '',
                location: '',
                area: '',
                status: 'Pending',
                completion_date: '',
                peopleBenefited: ''
            });
            toast.success(t('improvements.success_add'));
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error(t('work_history.work_failed'));
        }
    };

    const handleVote = async (e: React.MouseEvent, id: string, currentVotes: number) => {
        e.stopPropagation();
        try {
            const { error } = await supabase
                .from('improvements')
                .update({ votes: currentVotes + 1 })
                .eq('id', id);

            if (error) throw error;
            toast.success(t('improvements.success_vote'));
            // fetchData will be triggered by subscription
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{t('improvements.title')}</h1>
                        <p className="text-slate-500 text-sm">{t('improvements.subtitle')}</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="ns-btn-primary"
                >
                    <Plus className="w-4 h-4" />
                    <span>{t('improvements.propose_new')}</span>
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

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {(['All', 'Pending', 'Planned', 'In Progress', 'Complete'] as const).map((s) => {
                    const isActive = statusFilter === s;
                    const activeClass = 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-100';
                    const inactiveClass = 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600';
                    const label = s === 'All' ? (t('common.all') || 'All') :
                        s === 'Pending' ? t('improvements.status_pending') :
                            s === 'Planned' ? t('improvements.status_planned') :
                                s === 'In Progress' ? t('improvements.status_in_progress') :
                                    t('improvements.status_complete');
                    return (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${isActive ? activeClass : inactiveClass}`}
                        >
                            {label}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                }`}>
                                {statusCounts[s as keyof typeof statusCounts] ?? 0}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="ns-card p-5 animate-pulse">
                                <div className="h-4 w-1/4 bg-slate-200 rounded mb-4"></div>
                                <div className="h-6 w-3/4 bg-slate-200 rounded mb-2"></div>
                                <div className="h-4 w-full bg-slate-100 rounded mb-4"></div>
                                <div className="h-32 bg-slate-50 rounded mb-4"></div>
                            </div>
                        ))}
                    </>
                ) : filteredImprovements.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => navigate(`/dashboard/ward/improvements/${item.id}`)}
                        className="ns-card p-5 hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Lightbulb className="w-24 h-24 text-brand-500 transform rotate-12" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${item.status === 'Complete' ? 'bg-green-50 text-green-700 border-green-200' :
                                    item.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        item.status === 'Planned' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                            'bg-orange-50 text-orange-700 border-orange-200'
                                    }`}>
                                    {item.status === 'Complete' ? t('improvements.status_complete') :
                                        item.status === 'In Progress' ? t('improvements.status_in_progress') :
                                            item.status === 'Planned' ? t('improvements.status_planned') :
                                                t('improvements.status_pending')}
                                </span>
                                <div className="flex items-center text-xs text-slate-500">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {new Date(item.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-2"><TranslatedText text={item.title} /></h3>
                            <p className="text-slate-600 text-sm mb-4 line-clamp-3"><TranslatedText text={item.description} /></p>

                            <div className="space-y-2 mb-4">
                                {item.location && (
                                    <div className="flex items-center text-xs text-slate-500">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        <TranslatedText text={item.location} />
                                        {item.area && <span>, <TranslatedText text={item.area} /></span>}
                                    </div>
                                )}
                                {item.metadata?.people_benefited && (
                                    <div className="flex items-center text-xs text-brand-600 font-medium">
                                        <User className="w-3 h-3 mr-1" />
                                        {item.metadata.people_benefited} {t('work_history.people_benefited')}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-brand-600">{item.votes}</span>
                                    <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">{t('improvements.votes')}</span>
                                </div>
                                <button
                                    onClick={(e) => handleVote(e, item.id, item.votes)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors border border-slate-200 hover:border-brand-200 text-sm font-medium"
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                    {t('improvements.vote_btn')}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden p-6 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">{t('improvements.modal_title')}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('improvements.form_title')}</label>
                                <input
                                    required
                                    type="text"
                                    className="ns-input"
                                    placeholder={t('improvements.form_title_placeholder')}
                                    value={newImprovement.title}
                                    onChange={e => setNewImprovement({ ...newImprovement, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('improvements.form_desc')}</label>
                                <div className="relative">
                                    <textarea
                                        required
                                        className="ns-input h-32 pr-10"
                                        placeholder={t('improvements.form_desc_placeholder')}
                                        value={newImprovement.description}
                                        onChange={e => setNewImprovement({ ...newImprovement, description: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAutoGenerate}
                                        disabled={generatingAI || !newImprovement.title}
                                        className="absolute right-2 bottom-2 text-brand-700 hover:text-brand-800 disabled:opacity-50"
                                        title="Auto draft description"
                                    >
                                        <Wand2 className={`w-5 h-5 ${generatingAI ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{t('improvements.auto_draft_hint')}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('improvements.form_location')}</label>
                                    <input
                                        required
                                        type="text"
                                        className="ns-input"
                                        placeholder={t('improvements.form_location_placeholder')}
                                        value={newImprovement.location}
                                        onChange={e => setNewImprovement({ ...newImprovement, location: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('improvements.area_locality')}</label>
                                    <input
                                        type="text"
                                        className="ns-input"
                                        value={newImprovement.area}
                                        onChange={e => setNewImprovement({ ...newImprovement, area: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('improvements.completion_date_label')}</label>
                                    <input
                                        type="date"
                                        className="ns-input"
                                        value={newImprovement.completion_date}
                                        onChange={e => setNewImprovement({ ...newImprovement, completion_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('improvements.people_benefited')}</label>
                                    <input
                                        type="number"
                                        className="ns-input"
                                        placeholder={t('improvements.people_benefited_placeholder')}
                                        value={newImprovement.peopleBenefited}
                                        onChange={e => setNewImprovement({ ...newImprovement, peopleBenefited: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('improvements.status')}</label>
                                <select
                                    className="ns-input"
                                    value={newImprovement.status}
                                    onChange={e => setNewImprovement({ ...newImprovement, status: e.target.value as any })}
                                >
                                    <option value="Pending">{t('improvements.status_pending')}</option>
                                    <option value="Planned">{t('improvements.status_planned')}</option>
                                    <option value="In Progress">{t('improvements.status_in_progress')}</option>
                                    <option value="Complete">{t('improvements.status_complete')}</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition"
                                >
                                    {t('improvements.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-medium transition shadow-lg shadow-brand-200 flex items-center gap-2"
                                >
                                    {t('improvements.submit')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PossibleImprovements;
