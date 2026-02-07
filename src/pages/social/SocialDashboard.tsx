import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, Facebook, Instagram, ThumbsUp, MessageCircle, Share2, TrendingUp, Users, Eye } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { supabase } from '../../services/supabaseClient';
import { TranslatedText } from '../../components/TranslatedText';

// Mock Data for demonstration
const MOCK_POSTS = [
    {
        id: 1,
        platform: 'Facebook',
        contentKey: 'social.post_1',
        likes: 1240,
        comments: 45,
        shares: 12,
        date: '2026-01-20',
        image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: 2,
        platform: 'Instagram',
        contentKey: 'social.post_2',
        likes: 3500,
        comments: 120,
        shares: 450,
        date: '2026-01-18',
        image: 'https://images.unsplash.com/photo-1567591414240-e1cff72516c8?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: 3,
        platform: 'Facebook',
        contentKey: 'social.post_3',
        likes: 890,
        comments: 34,
        shares: 89,
        date: '2026-01-15',
        image: 'https://images.unsplash.com/photo-1576091160550-217358c7db81?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: 4,
        platform: 'Instagram',
        contentKey: 'social.post_4',
        likes: 4200,
        comments: 210,
        shares: 120,
        date: '2026-01-10',
        image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800'
    }
];

const SocialDashboard = () => {
    const { t } = useLanguage();
    const { tenantId } = useTenant(); // Added tenantId
    const [posts, setPosts] = useState<typeof MOCK_POSTS>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [platformFilter, setPlatformFilter] = useState<'All' | 'Facebook' | 'Instagram'>('All');

    // Stats Calculation
    const totalLikes = posts.reduce((acc, curr) => acc + curr.likes, 0);
    const totalComments = posts.reduce((acc, curr) => acc + curr.comments, 0);
    const totalShares = posts.reduce((acc, curr) => acc + curr.shares, 0);

    const filteredPosts = posts.filter(post => {
        const content = t(post.contentKey as any);
        const matchesSearch = content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlatform = platformFilter === 'All' || post.platform === platformFilter;
        return matchesSearch && matchesPlatform;
    });

    const [birthdays, setBirthdays] = useState<{ id: string, name: string, mobile?: string }[]>([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));
            setPosts(MOCK_POSTS);
            fetchBirthdays();
            setLoading(false);
        };
        loadData();
    }, []);

    const fetchBirthdays = async () => {
        // Simulate finding birthdays (random 3 voters for demo)
        const { data } = await supabase
            .from('voters')
            .select('id, name_english, mobile')
            .eq('tenant_id', tenantId) // Secured
            .limit(10);
        if (data && data.length > 0) {
            // Shuffle and pick 2-3
            const shuffled = data.sort(() => 0.5 - Math.random());
            setBirthdays(shuffled.slice(0, 3).map(v => ({ id: v.id, name: v.name_english, mobile: v.mobile })));
        }
    };

    const sendBirthdayWish = (mobile?: string) => {
        if (!mobile) return toast.error('No mobile number for this voter');
        const msg = encodeURIComponent("🎂 Happy Birthday! Wishing you good health and happiness. - Your Nagar Sevak");
        window.open(`https://wa.me/${mobile}?text=${msg}`, '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('social.title')}</h1>
                    <p className="text-slate-500">{t('social.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg transition-colors font-medium shadow-sm">
                        <Facebook className="w-4 h-4" />
                        {t('social.connect_fb')}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white rounded-lg transition-opacity font-medium shadow-sm">
                        <Instagram className="w-4 h-4" />
                        {t('social.connect_ig')}
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="ns-card p-4 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Eye className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">{t('social.total_reach')}</p>
                        <p className="text-2xl font-bold text-slate-900">45.2K</p>
                    </div>
                </div>
                <div className="ns-card p-4 flex items-center gap-4">
                    <div className="p-3 bg-pink-50 text-pink-600 rounded-lg">
                        <ThumbsUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">{t('social.total_likes')}</p>
                        <p className="text-2xl font-bold text-slate-900">{totalLikes.toLocaleString()}</p>
                    </div>
                </div>
                <div className="ns-card p-4 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">{t('social.comments')}</p>
                        <p className="text-2xl font-bold text-slate-900">{totalComments.toLocaleString()}</p>
                    </div>
                </div>
                <div className="ns-card p-4 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <Share2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">{t('social.shares')}</p>
                        <p className="text-2xl font-bold text-slate-900">{totalShares.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Posts Feed */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900">{t('social.all_posts')}</h2>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder={t('social.search_placeholder')}
                                    className="ns-input pl-9 py-1.5 text-sm w-48"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select
                                className="ns-input py-1.5 text-sm w-32"
                                value={platformFilter}
                                onChange={(e) => setPlatformFilter(e.target.value as any)}
                            >
                                <option value="All">{t('social.all_platforms')}</option>
                                <option value="Facebook">Facebook</option>
                                <option value="Instagram">Instagram</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="ns-card p-4 animate-pulse">
                                    <div className="h-4 bg-slate-200 w-3/4 mb-4 rounded" />
                                    <div className="h-40 bg-slate-200 rounded mb-4" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredPosts.length > 0 ? filteredPosts.map(post => (
                                <div key={post.id} className="ns-card overflow-hidden">
                                    <div className="flex flex-col md:flex-row">
                                        <div className="w-full md:w-48 h-48 md:h-auto shrink-0 relative">
                                            <img src={post.image} alt="Post" className="w-full h-full object-cover" />
                                            <div className={`absolute top-2 left-2 p-1.5 rounded-full ${post.platform === 'Facebook' ? 'bg-blue-600' : 'bg-pink-600'} text-white`}>
                                                {post.platform === 'Facebook' ? <Facebook className="w-4 h-4" /> : <Instagram className="w-4 h-4" />}
                                            </div>
                                        </div>
                                        <div className="p-4 flex flex-col flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center space-x-2 text-xs text-slate-500">
                                                    <CalendarIcon className="w-3 h-3" />
                                                    <span>{post.date}</span>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">{post.platform}</span>
                                            </div>
                                            <p className="text-slate-800 font-medium mb-4 flex-1">
                                                <TranslatedText text={t(post.contentKey as any)} />
                                            </p>
                                            <div className="flex items-center gap-6 text-sm text-slate-500 pt-3 border-t border-slate-100">
                                                <div className="flex items-center gap-1.5">
                                                    <ThumbsUp className="w-4 h-4" />
                                                    <span>{post.likes.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <MessageCircle className="w-4 h-4" />
                                                    <span>{post.comments}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Share2 className="w-4 h-4" />
                                                    <span>{post.shares}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12 bg-slate-50 rounded-lg">
                                    <p className="text-slate-500">{t('social.no_posts')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="ns-card p-4 bg-gradient-to-br from-brand-500 to-brand-600 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-brand-100 text-sm font-medium">Growth</p>
                                <p className="text-xl font-bold">+12% vs last month</p>
                            </div>
                        </div>
                        <div className="h-px bg-white/20 my-3" />
                        <p className="text-sm text-brand-50">Consistent posting has increased engagement significantly.</p>
                    </div>

                    <div className="ns-card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5 text-brand-600" />
                            <h3 className="font-bold text-slate-800">{t('social.birthdays')}</h3>
                        </div>
                        <div className="space-y-3">
                            {birthdays.length > 0 ? birthdays.map(voter => (
                                <div key={voter.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
                                    <div>
                                        <p className="font-semibold text-slate-800 text-sm">{voter.name}</p>
                                        <p className="text-xs text-slate-500">Voter ID: {voter.id}</p>
                                    </div>
                                    <button
                                        onClick={() => sendBirthdayWish(voter.mobile)}
                                        className="text-brand-600 bg-white shadow-sm border border-brand-100 p-2 rounded-md hover:bg-brand-50 transition-colors"
                                        title={t('social.send_wish')}
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            )) : (
                                <div className="text-center py-4 text-slate-400 text-sm">
                                    No birthdays today
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper for icon
const CalendarIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

export default SocialDashboard;
