import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Users, Clock, Send, Loader2, Search, Edit2, Trash2, BarChart3, X, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabaseClient';
import { VoterService } from '../../services/voterService';
import { useTenant } from '../../context/TenantContext';
import type { Survey, Voter } from '../../types';
import { toast } from 'sonner';
import { TranslatedText } from '../../components/TranslatedText';

const SurveyDashboard = () => {
    const { t } = useLanguage();
    const { tenantId } = useTenant();
    const navigate = useNavigate();
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [totalVoters, setTotalVoters] = useState(0);
    const [broadcastingId, setBroadcastingId] = useState<string | null>(null);

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [areaSearch, setAreaSearch] = useState('');
    const [showAreaDropdown, setShowAreaDropdown] = useState(false);

    // Delete State
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

    // Share Modal State
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareTarget, setShareTarget] = useState<Survey | null>(null);
    const [votersList, setVotersList] = useState<Voter[]>([]);
    const [voterSearch, setVoterSearch] = useState('');
    const [selectedVoters, setSelectedVoters] = useState<Set<string>>(new Set());
    const [loadingVoters, setLoadingVoters] = useState(false);

    useEffect(() => {
        if (!tenantId) return;
        fetchSurveys();
        fetchStats();

        // Close dropdowns
        const handleClickOutside = (event: MouseEvent) => {
            if (!(event.target as Element).closest('.dropdown-container')) {
                setShowAreaDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [tenantId]);

    const fetchSurveys = async () => {
        if (!tenantId) return;
        try {
            const { data, error } = await supabase
                .from('surveys')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedSurveys: Survey[] = (data || []).map(s => ({
                id: s.id,
                title: s.title,
                description: s.description,
                area: s.area,
                status: s.status,
                questions: s.questions,
                targetSampleSize: s.target_sample_size || 0,
                createdAt: s.created_at
            }));

            setSurveys(mappedSurveys);
        } catch (error) {
            console.error('Error fetching surveys:', error);
            toast.error('Failed to load surveys');
        }
    };

    const fetchStats = async () => {
        if (!tenantId) return;
        const count = await VoterService.getTotalCount(tenantId);
        setTotalVoters(count);
    };

    const openShareModal = async (survey: Survey) => {
        if (!tenantId) return;
        setShareTarget(survey);
        setShowShareModal(true);
        setSelectedVoters(new Set());
        setVoterSearch('');
        setLoadingVoters(true);
        try {
            const recent = await VoterService.getRecentVotersWithMobile(tenantId, 50);
            setVotersList(recent);
        } catch (e) {
            toast.error("Failed to fetch voters");
        } finally {
            setLoadingVoters(false);
        }
    };

    const handleSearchVoters = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setVoterSearch(val);
        if (!tenantId) return;

        if (val.length < 2) {
            // Revert to recent if search cleared
            if (val.length === 0) {
                const recent = await VoterService.getRecentVotersWithMobile(tenantId, 50);
                setVotersList(recent);
            }
            return;
        }

        setLoadingVoters(true);
        try {
            const results = await VoterService.searchVoters(val, tenantId);
            setVotersList(results.filter(v => v.mobile));
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingVoters(false);
        }
    };

    const toggleVoterSelection = (id: string) => {
        const next = new Set(selectedVoters);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedVoters(next);
    };

    const selectAllVoters = () => {
        if (selectedVoters.size === votersList.length && votersList.length > 0) {
            setSelectedVoters(new Set());
        } else {
            setSelectedVoters(new Set(votersList.map(v => v.id)));
        }
    };

    const [sendingSurvey, setSendingSurvey] = useState(false);

    const sendWhatsAppMessages = async () => {
        if (!shareTarget || selectedVoters.size === 0) return;
        const selected = votersList.filter(v => selectedVoters.has(v.id));
        const BOT_URL = import.meta.env.VITE_BOT_API_URL || import.meta.env.VITE_BOT_URL || 'https://nagarsevak-managment-1.onrender.com';

        setSendingSurvey(true);
        try {
            const res = await fetch(`${BOT_URL}/api/send-survey`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    surveyId: shareTarget.id,
                    tenantId,
                    mobiles: selected.map(v => ({
                        mobile: v.mobile,
                        name: v.name_marathi || v.name,
                        voterId: v.id
                    }))
                })
            });

            if (res.ok) {
                toast.success(`✅ Survey started for ${selected.length} citizens via WhatsApp bot!`);
            } else if (res.status === 503) {
                // Fallback to direct wa.me links if bot is offline
                toast.error('Bot offline. Sending via browser links instead...');
                selected.forEach((v, i) => {
                    setTimeout(() => {
                        const link = `${window.location.origin}/s/${shareTarget.id}?v=${v.id}`;
                        const msg = encodeURIComponent(`Please fill out this survey: ${link}`);
                        window.open(`https://wa.me/91${v.mobile}?text=${msg}`, '_blank');
                    }, i * 600);
                });
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || 'Failed to send surveys');
            }
        } catch (e) {
            // Network error fallback
            toast.error('Bot unreachable. Sending via browser links...');
            selected.forEach((v, i) => {
                setTimeout(() => {
                    const link = `${window.location.origin}/s/${shareTarget.id}?v=${v.id}`;
                    const msg = encodeURIComponent(`Please fill out this survey: ${link}`);
                    window.open(`https://wa.me/91${v.mobile}?text=${msg}`, '_blank');
                }, i * 600);
            });
        } finally {
            setSendingSurvey(false);
            setShowShareModal(false);
        }
    };


    const confirmDelete = async () => {
        if (!deleteTarget || !tenantId) return;

        const toastId = toast.loading('Deleting survey...');
        try {
            const { error } = await supabase
                .from('surveys')
                .delete()
                .eq('id', deleteTarget.id)
                .eq('tenant_id', tenantId);

            if (error) throw error;

            toast.success('Survey deleted successfully', { id: toastId });
            setSurveys(surveys.filter(s => s.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (error) {
            console.error('Error deleting survey:', error);
            toast.error('Failed to delete survey', { id: toastId });
        }
    };

    // Helper to get unique areas
    const getAreaSuggestions = () => {
        const stats: Record<string, number> = {};
        surveys.forEach(s => {
            if (s.area) {
                stats[s.area] = (stats[s.area] || 0) + 1;
            }
        });
        return Object.entries(stats).map(([area, count]) => ({ area, count }));
    };

    const filteredSurveys = surveys.filter(survey => {
        const matchesSearch = survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            survey.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesArea = !areaSearch || (survey.area && survey.area.toLowerCase().includes(areaSearch.toLowerCase()));

        return matchesSearch && matchesArea;
    });

    const sampleSizeTarget = Math.ceil(totalVoters * 0.01);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {t('surveys.title')}
                        </h1>
                        <p className="text-slate-500">{t('surveys.subtitle')}</p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/surveys/new')}
                        className="ns-btn-primary"
                    >
                        <Plus className="w-5 h-5" />
                        <span>{t('surveys.create_survey')}</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Main Search */}
                    <div className="md:col-span-8 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t('surveys.search_placeholder') || "Search surveys..."}
                            className="ns-input pl-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Area Search */}
                    <div className="md:col-span-4 relative dropdown-container">
                        <input
                            type="text"
                            placeholder={t('surveys.filter_area') || "Filter by Area..."}
                            className="ns-input w-full"
                            value={areaSearch}
                            onFocus={() => setShowAreaDropdown(true)}
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
                                    <div className="px-4 py-2 text-sm text-slate-500 italic">{t('surveys.no_areas_found')}</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="ns-card p-6">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-sky-50 border border-sky-100 text-sky-700 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">{t('surveys.total_voters')}</p>
                            <h3 className="text-2xl font-bold text-slate-900 tabular-nums">{totalVoters}</h3>
                        </div>
                    </div>
                </div>
                <div className="ns-card p-6">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">{t('surveys.sample_size')}</p>
                            <h3 className="text-2xl font-bold text-slate-900 tabular-nums">{sampleSizeTarget}</h3>
                        </div>
                    </div>
                </div>
                <div className="ns-card p-6">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-brand-50 border border-brand-100 text-brand-700 rounded-xl">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">{t('surveys.active_surveys')}</p>
                            <h3 className="text-2xl font-bold text-slate-900 tabular-nums">
                                {surveys.filter(s => s.status === 'Active').length}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="ns-card overflow-hidden">
                <div className="p-6 border-b border-slate-200/70 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-slate-900">{t('surveys.recent_surveys')}</h2>
                    <span className="text-sm text-slate-500">
                        {t('surveys.found')}: {filteredSurveys.length}
                    </span>
                </div>

                {filteredSurveys.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p>{t('surveys.no_surveys')}</p>
                        <p className="text-sm">{t('surveys.create_prompt')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 text-left text-sm text-slate-500">
                                    <th className="p-4 font-semibold">{t('surveys.table.title')}</th>
                                    <th className="p-4 font-semibold">{t('surveys.table.status')}</th>
                                    <th className="p-4 font-semibold">{t('surveys.table.questions')}</th>
                                    <th className="p-4 font-semibold">{t('surveys.table.created_at')}</th>
                                    <th className="p-4 font-semibold">{t('surveys.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/70">
                                {filteredSurveys.map((survey) => (
                                    <tr key={survey.id} className="hover:bg-slate-50">
                                        <td className="p-4">
                                            <div className="font-semibold text-slate-900"><TranslatedText text={survey.title} /></div>
                                            <div className="text-sm text-slate-500 truncate max-w-xs"><TranslatedText text={survey.description} /></div>
                                            {survey.area && (
                                                <span className="inline-block mt-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium border border-blue-100">
                                                    <TranslatedText text={survey.area} />
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${survey.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                survey.status === 'Draft' ? 'bg-gray-100 text-gray-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {survey.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-600">
                                            {survey.questions.length} {t('surveys.questions_suffix')}
                                        </td>
                                        <td className="p-4 text-slate-600 text-sm">
                                            <div className="flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {new Date(survey.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => navigate(`/dashboard/surveys/edit/${survey.id}`)}
                                                    className="text-slate-500 hover:text-brand-600 transition-colors"
                                                    title={t('common.edit') || "Edit"}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget({ id: survey.id, title: survey.title })}
                                                    className="text-slate-500 hover:text-red-600 transition-colors"
                                                    title={t('common.delete') || "Delete"}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/dashboard/surveys/${survey.id}`)}
                                                    className="text-brand-600 hover:text-brand-700 transition-colors bg-brand-50 hover:bg-brand-100 p-2 rounded-full shadow-sm"
                                                    title={t('surveys.view_report') || "View Report"}
                                                >
                                                    <BarChart3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openShareModal(survey)}
                                                    className="text-brand-700 hover:text-brand-800 disabled:opacity-50 disabled:cursor-not-allowed hover:underline text-sm font-semibold flex items-center transition-all ml-2"
                                                >
                                                    <Send className="w-3 h-3 mr-1" />
                                                    {t('surveys.send_whatsapp')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-sm overflow-hidden p-6 space-y-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Delete Survey?</h3>
                            <p className="text-slate-500 mt-2 text-sm">
                                Are you sure you want to delete <span className="font-semibold text-slate-900"><TranslatedText text={deleteTarget.title} /></span>? This action cannot be undone.
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

            {/* Share WhatsApp Modal */}
            {showShareModal && shareTarget && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl border border-slate-100">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Send className="w-5 h-5 text-brand-600" />
                                    {t('surveys.dashboard.share_title')}
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">{t('surveys.dashboard.share_subtitle')} <span className="font-semibold text-slate-700"><TranslatedText text={shareTarget.title} /></span></p>
                            </div>
                            <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-200 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 border-b border-slate-100">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder={t('surveys.dashboard.search_placeholder')}
                                    value={voterSearch}
                                    onChange={handleSearchVoters}
                                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 bg-slate-50">
                            {loadingVoters ? (
                                <div className="flex justify-center items-center h-32 text-slate-500">
                                    <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
                                </div>
                            ) : votersList.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-slate-500 space-y-3">
                                    <Users className="w-10 h-10 text-slate-300" />
                                    <p>{t('surveys.dashboard.no_citizens')}</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <div className="flex items-center px-4 py-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors group mb-2 border-b border-slate-200 pb-2" onClick={selectAllVoters}>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors mr-3 ${selectedVoters.size === votersList.length && votersList.length > 0 ? 'bg-brand-600 border-brand-600' : 'border-slate-300 bg-white group-hover:border-brand-400'}`}>
                                            {selectedVoters.size === votersList.length && votersList.length > 0 && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <span className="font-semibold text-slate-700">{t('surveys.dashboard.select_all')} ({votersList.length})</span>
                                    </div>

                                    {votersList.map(v => (
                                        <div
                                            key={v.id}
                                            onClick={() => toggleVoterSelection(v.id)}
                                            className="flex items-center justify-between p-3 hover:bg-slate-100 bg-white rounded-lg cursor-pointer transition-colors group border border-slate-100 shadow-sm"
                                        >
                                            <div className="flex items-center">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors mr-4 ${selectedVoters.has(v.id) ? 'bg-brand-600 border-brand-600' : 'border-slate-300 bg-slate-50 group-hover:border-brand-400'}`}>
                                                    {selectedVoters.has(v.id) && <Check className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800">{v.name_marathi || v.name}</p>
                                                    <p className="text-xs text-slate-500 flex items-center mt-0.5">
                                                        <span className="inline-block w-2 truncate mr-1.5">•</span>
                                                        +91 {v.mobile}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{selectedVoters.size} {t('surveys.dashboard.selected')}</span>
                            <div className="space-x-3">
                                <button
                                    onClick={() => setShowShareModal(false)}
                                    className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={sendWhatsAppMessages}
                                    disabled={selectedVoters.size === 0 || sendingSurvey}
                                    className="bg-[#25D366] hover:bg-[#1ebd5c] disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-sm inline-flex items-center"
                                >
                                    {sendingSurvey
                                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                                        : <><Send className="w-4 h-4 mr-2" /> {t('surveys.dashboard.send_links')}</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SurveyDashboard;
