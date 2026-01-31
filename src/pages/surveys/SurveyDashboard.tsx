import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Users, Clock, Send, Loader2, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { MockService } from '../../services/mockData';
import { VoterService } from '../../services/voterService';
import type { Survey } from '../../types';
import { toast } from 'sonner';

const SurveyDashboard = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [totalVoters, setTotalVoters] = useState(0);
    const [broadcastingId, setBroadcastingId] = useState<string | null>(null);

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [areaSearch, setAreaSearch] = useState('');
    const [showAreaDropdown, setShowAreaDropdown] = useState(false);

    useEffect(() => {
        setSurveys(MockService.getSurveys());
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
    }, []);

    const fetchStats = async () => {
        const count = await VoterService.getTotalCount();
        setTotalVoters(count);
    };

    const handleWhatsAppBroadcast = async (survey: Survey) => {
        setBroadcastingId(survey.id);
        const toastId = toast.loading('Fetching voter contacts...');

        try {
            // 1. Fetch all voter numbers
            const phones = await VoterService.getAllVoterPhones();

            if (phones.length === 0) {
                toast.dismiss(toastId);
                toast.error('No voter contacts found to broadcast to.');
                return;
            }

            toast.loading(`Broadcasting survey to ${phones.length} voters...`, { id: toastId });

            // 2. Simulate sending process (would be an API call to bot)
            await new Promise(resolve => setTimeout(resolve, 3000));

            toast.dismiss(toastId);
            toast.success(`Successfully sent survey to ${phones.length} voters!`);

        } catch (error) {
            console.error('Broadcast error:', error);
            toast.dismiss(toastId);
            toast.error('Failed to broadcast survey.');
        } finally {
            setBroadcastingId(null);
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
                        onClick={() => navigate('/surveys/new')}
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
                            placeholder="Search surveys..."
                            className="ns-input pl-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Area Search */}
                    <div className="md:col-span-4 relative dropdown-container">
                        <input
                            type="text"
                            placeholder="Filter by Area..."
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
                                    <div className="px-4 py-2 text-sm text-slate-500 italic">No areas found</div>
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
                        Found: {filteredSurveys.length}
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
                                            <div className="font-semibold text-slate-900">{survey.title}</div>
                                            <div className="text-sm text-slate-500 truncate max-w-xs">{survey.description}</div>
                                            {survey.area && (
                                                <span className="inline-block mt-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium border border-blue-100">
                                                    {survey.area}
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
                                            <button
                                                onClick={() => handleWhatsAppBroadcast(survey)}
                                                disabled={broadcastingId === survey.id}
                                                className="text-brand-700 hover:text-brand-800 disabled:opacity-50 disabled:cursor-not-allowed hover:underline text-sm font-semibold flex items-center transition-all"
                                            >
                                                {broadcastingId === survey.id ? (
                                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                ) : (
                                                    <Send className="w-3 h-3 mr-1" />
                                                )}
                                                {broadcastingId === survey.id ? 'Sending...' : t('surveys.send_whatsapp')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SurveyDashboard;
