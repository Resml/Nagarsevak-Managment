import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { AIAnalysisService } from '../../services/aiService';
import { useLanguage } from '../../context/LanguageContext';
import {
    Users,
    CheckCircle,
    AlertCircle,
    Activity,
    Sparkles,
    Megaphone,
    Calendar,
    RefreshCw,
    Plus,
    Search,
    UserPlus,
} from 'lucide-react';
import { format } from 'date-fns';
import { TranslatedText } from '../../components/TranslatedText';

const Dashboard = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        voters: 0
    });
    const [recentActivity, setRecentActivity] = useState<Array<{ id: string | number; status: string; problem?: string | null; title?: string | null; created_at?: string | null }>>([]);
    const [dailyBriefing, setDailyBriefing] = useState<string>('');

    // Reload briefing when language changes
    useEffect(() => {
        setDailyBriefing('');
        fetchDashboardData();
    }, [language]);

    useEffect(() => {
        fetchDashboardData();

        // Realtime Subscription for Complaints
        const subscription = supabase
            .channel('dashboard-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => {
                fetchDashboardData(); // Refresh on any change
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Parallel Fetch
            const [complaintsRes, votersRes] = await Promise.all([
                supabase.from('complaints').select('*'),
                supabase.from('voters').select('id', { count: 'exact', head: true })
            ]);

            const allComplaints = complaintsRes.data || [];
            const voterCount = votersRes.count || 0;

            const newStats = {
                total: allComplaints.length,
                pending: allComplaints.filter(c => c.status === 'Pending').length,
                inProgress: allComplaints.filter(c => ['Assigned', 'InProgress'].includes(c.status)).length,
                resolved: allComplaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length,
                voters: voterCount
            };

            setStats(newStats);
            setRecentActivity(allComplaints.slice(0, 5)); // Just take top 5 for now (assuming sort order)

            // AI Briefing (Regenerate if empty or language changed)
            if (!dailyBriefing) {
                const briefing = await AIAnalysisService.generateDailyBriefing(newStats, allComplaints.slice(0, 3), language as 'en' | 'mr');
                setDailyBriefing(briefing);
            }

        } catch (error) {
            console.error("Dashboard Fetch Error", error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, accent }: { title: string; value: number; icon: any; accent: string }) => (
        <div className="ns-card p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2 tabular-nums">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl border ${accent}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.title')}</h1>
                        <p className="text-slate-500">{t('dashboard.welcome')}</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => fetchDashboardData()} className="ns-btn-ghost border border-slate-200">
                            <RefreshCw className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('dashboard.refresh')}</span>
                        </button>
                        <button className="ns-btn-primary" onClick={() => navigate('/complaints/new')}>
                            <Plus className="w-4 h-4" /> {t('complaints.new_request') || 'New Request'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick actions */}
            <div className="ns-card p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="text-sm text-slate-600">
                    {t('dashboard.quick_actions')}
                </div>
                <div className="sm:ml-auto flex flex-wrap gap-2">
                    <button className="ns-btn-ghost border border-slate-200" onClick={() => navigate('/voters')}>
                        <Search className="w-4 h-4" />
                        {t('dashboard.action_voter')}
                    </button>
                    <button className="ns-btn-ghost border border-slate-200" onClick={() => navigate('/staff')}>
                        <UserPlus className="w-4 h-4" />
                        {t('dashboard.action_staff')}
                    </button>
                    <button className="ns-btn-ghost border border-slate-200" onClick={() => navigate('/complaints')}>
                        <Megaphone className="w-4 h-4" />
                        {t('dashboard.action_complaints')}
                    </button>
                </div>
            </div>

            {/* AI Insight Banner */}
            {(dailyBriefing || stats.total === 0) && (
                <div className="ns-card p-6">
                    <div className="flex gap-3 items-start">
                        <div className="p-2 bg-brand-50 rounded-xl border border-brand-100">
                            <Sparkles className="w-5 h-5 text-brand-700" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900">{t('dashboard.ai_insight')}</h3>
                            <p className="text-slate-600 leading-relaxed text-sm mt-1">
                                {dailyBriefing || t('dashboard.default_briefing')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t('dashboard.total_citizens')} value={stats.voters} icon={Users} accent="border-sky-100 bg-sky-50 text-sky-700" />
                <StatCard title={t('dashboard.pending_issues')} value={stats.pending} icon={AlertCircle} accent="border-red-100 bg-red-50 text-red-700" />
                <StatCard title={t('dashboard.in_progress')} value={stats.inProgress} icon={Activity} accent="border-amber-100 bg-amber-50 text-amber-700" />
                <StatCard title={t('dashboard.resolved')} value={stats.resolved} icon={CheckCircle} accent="border-green-100 bg-green-50 text-green-700" />
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-8">

                {/* Visual Chart Area (Simple CSS Bars) */}
                <div className="lg:col-span-2 ns-card p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-900">{t('dashboard.status_overview')}</h2>
                        <button onClick={() => navigate('/complaints')} className="text-sm text-brand-700 font-semibold hover:underline">
                            {t('dashboard.view_all')}
                        </button>
                    </div>

                    {/* Custom CSS Bar Chart */}
                    <div className="space-y-6">
                        {[
                            { label: t('dashboard.pending'), count: stats.pending, color: 'bg-red-500' },
                            { label: t('dashboard.in_progress'), count: stats.inProgress, color: 'bg-amber-500' },
                            { label: t('dashboard.resolved'), count: stats.resolved, color: 'bg-green-600' },
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="font-medium text-slate-700">{item.label}</span>
                                    <span className="text-slate-500 tabular-nums">{item.count}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-3">
                                    <div
                                        className={`h-3 rounded-full transition-all duration-1000 ${item.color}`}
                                        style={{ width: stats.total > 0 ? `${(item.count / stats.total) * 100}%` : '0%' }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-200/70 pt-6">
                        <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase">{t('dashboard.clearance_rate')}</p>
                            <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                                {stats.total > 0 ? Math.round(((stats.resolved) / stats.total) * 100) : 0}%
                            </p>
                        </div>
                        <div className="text-center border-l border-slate-200/70">
                            <p className="text-xs text-slate-500 uppercase">{t('dashboard.avg_response')}</p>
                            <p className="text-xl font-bold text-slate-900 mt-1">—</p>
                        </div>
                        <div className="text-center border-l border-slate-200/70">
                            <p className="text-xs text-slate-500 uppercase">{t('dashboard.satisfaction')}</p>
                            <p className="text-xl font-bold text-slate-900 mt-1">—</p>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="ns-card p-6 overflow-hidden flex flex-col">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">{t('dashboard.live_activity')}</h2>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px]">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex gap-3 group cursor-pointer" onClick={() => navigate(`/complaints/${activity.id}`)}>
                                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${activity.status === 'Resolved' ? 'bg-green-500' :
                                    activity.status === 'Pending' ? 'bg-red-500' : 'bg-yellow-500'
                                    }`}></div>
                                <div>
                                    <p className="text-sm font-medium text-slate-800 group-hover:text-brand-700 transition-colors line-clamp-2">
                                        <TranslatedText text={activity.problem || activity.title || ''} />
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {activity.created_at ? format(new Date(activity.created_at), 'MMM d, h:mm a') : 'Just now'}
                                        <span className="ml-2 font-medium">({t(`status.${activity.status}`) || activity.status})</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                        {recentActivity.length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-8">{t('dashboard.no_activity')}</p>
                        )}
                    </div>
                    <button className="w-full mt-4 ns-btn-ghost border border-slate-200 justify-center" onClick={() => navigate('/complaints')}>
                        {t('dashboard.view_full_log')}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
