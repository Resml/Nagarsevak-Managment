import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { AIAnalysisService } from '../../services/aiService';
import {
    BarChart3, Users, CheckCircle, AlertCircle, FileText,
    ArrowUpRight, ArrowDownRight, Activity, Sparkles, Megaphone, Calendar
} from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        voters: 0
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [dailyBriefing, setDailyBriefing] = useState<string>('');

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

            // AI Briefing (Only fetch if data changed signficantly or just once on load/refresh)
            if (!dailyBriefing) {
                const briefing = await AIAnalysisService.generateDailyBriefing(newStats, allComplaints.slice(0, 3));
                setDailyBriefing(briefing);
            }

        } catch (error) {
            console.error("Dashboard Fetch Error", error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-default relative overflow-hidden group">
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
                </div>
                <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('600', '50')} ${color}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            <div className="mt-4 flex items-center text-sm relative z-10">
                <span className={`flex items-center font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                    {trend === 'up' ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                    {Math.floor(Math.random() * 10) + 1}%
                </span>
                <span className="text-gray-400 ml-2">from last week</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Welcome back, Nagar Sevak</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => fetchDashboardData()} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                        <Activity className="w-5 h-5" />
                    </button>
                    <button className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-brand-700 transition flex items-center gap-2">
                        <Megaphone className="w-4 h-4" /> Broadcast Update
                    </button>
                </div>
            </div>

            {/* AI Insight Banner */}
            {dailyBriefing && (
                <div className="bg-white border-l-4 border-brand-500 rounded-r-xl p-6 shadow-sm relative overflow-hidden">
                    <div className="relative z-10 flex gap-4 items-start">
                        <div className="p-2 bg-brand-50 rounded-lg">
                            <Sparkles className="w-5 h-5 text-brand-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-gray-900 mb-1">AI Daily Insight</h3>
                            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                                "{dailyBriefing}"
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Citizens" value={stats.voters} icon={Users} color="text-blue-600" trend="up" />
                <StatCard title="Pending Issues" value={stats.pending} icon={AlertCircle} color="text-red-600" trend="up" />
                <StatCard title="In Progress" value={stats.inProgress} icon={Activity} color="text-yellow-600" trend="down" />
                <StatCard title="Resolved" value={stats.resolved} icon={CheckCircle} color="text-green-600" trend="up" />
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-8">

                {/* Visual Chart Area (Simple CSS Bars) */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Complaint Status Overview</h2>
                        <button onClick={() => navigate('/complaints')} className="text-sm text-brand-600 font-medium hover:underline">View All</button>
                    </div>

                    {/* Custom CSS Bar Chart */}
                    <div className="space-y-6">
                        {[
                            { label: 'Pending', count: stats.pending, color: 'bg-red-500', width: `${(stats.pending / stats.total) * 100}%` },
                            { label: 'In Progress', count: stats.inProgress, color: 'bg-yellow-500', width: `${(stats.inProgress / stats.total) * 100}%` },
                            { label: 'Resolved', count: stats.resolved, color: 'bg-green-500', width: `${(stats.resolved / stats.total) * 100}%` },
                        ].map((item: any) => (
                            <div key={item.label}>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="font-medium text-gray-700">{item.label}</span>
                                    <span className="text-gray-500">{item.count} Issues</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3">
                                    <div
                                        className={`h-3 rounded-full transition-all duration-1000 ${item.color}`}
                                        style={{ width: stats.total > 0 ? item.width : '0%' }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
                        <div className="text-center">
                            <p className="text-xs text-gray-500 uppercase">Clearance Rate</p>
                            <p className="text-xl font-bold text-gray-900 mt-1">
                                {stats.total > 0 ? Math.round(((stats.resolved) / stats.total) * 100) : 0}%
                            </p>
                        </div>
                        <div className="text-center border-l border-gray-100">
                            <p className="text-xs text-gray-500 uppercase">Avg Response</p>
                            <p className="text-xl font-bold text-gray-900 mt-1">4.2 Hrs</p>
                        </div>
                        <div className="text-center border-l border-gray-100">
                            <p className="text-xs text-gray-500 uppercase">Satisfaction</p>
                            <p className="text-xl font-bold text-gray-900 mt-1">4.8/5</p>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden flex flex-col">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Live Activity</h2>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px]">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex gap-3 group cursor-pointer" onClick={() => navigate(`/complaints/${activity.id}`)}>
                                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${activity.status === 'Resolved' ? 'bg-green-500' :
                                    activity.status === 'Pending' ? 'bg-red-500' : 'bg-yellow-500'
                                    }`}></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800 group-hover:text-brand-600 transition-colors line-clamp-2">
                                        {activity.problem || activity.title}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {activity.created_at ? format(new Date(activity.created_at), 'MMM d, h:mm a') : 'Just now'}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {recentActivity.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-8">No recent activity.</p>
                        )}
                    </div>
                    <button className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition">
                        View Full Log
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
