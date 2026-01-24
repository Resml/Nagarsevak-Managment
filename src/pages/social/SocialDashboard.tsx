import { useState, useEffect } from 'react';
import { Search, Facebook, Instagram, ThumbsUp, MessageCircle, Share2, TrendingUp, Users, Eye } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

// Mock Data for demonstration
const MOCK_POSTS = [
    {
        id: 1,
        platform: 'Facebook',
        content: 'Visited Ward 12 today to inspect the new road construction. The work is progressing well and will be completed by next month. #Development #NagarSevak',
        likes: 1240,
        comments: 45,
        shares: 12,
        date: '2026-01-20',
        image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: 2,
        platform: 'Instagram',
        content: 'Ganesh Chaturthi preparations in full swing! 🌺 Ganpati Bappa Morya! 🙏',
        likes: 3500,
        comments: 120,
        shares: 450,
        date: '2026-01-18',
        image: 'https://images.unsplash.com/photo-1567591414240-e1cff72516c8?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: 3,
        platform: 'Facebook',
        content: 'Free Health Checkup Camp this Sunday at Shivaji Hall. Please bring your family. Health is Wealth.',
        likes: 890,
        comments: 34,
        shares: 89,
        date: '2026-01-15',
        image: 'https://images.unsplash.com/photo-1576091160550-217358c7db81?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: 4,
        platform: 'Instagram',
        content: 'Meeting with Youth Leaders. The future of our city is bright! 💡',
        likes: 4200,
        comments: 210,
        shares: 120,
        date: '2026-01-10',
        image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800'
    }
];

const SocialDashboard = () => {
    const [posts, setPosts] = useState(MOCK_POSTS);
    const [searchTerm, setSearchTerm] = useState('');
    const [platformFilter, setPlatformFilter] = useState<'All' | 'Facebook' | 'Instagram'>('All');

    // Stats Calculation
    const totalLikes = posts.reduce((acc, curr) => acc + curr.likes, 0);
    const totalComments = posts.reduce((acc, curr) => acc + curr.comments, 0);
    const totalShares = posts.reduce((acc, curr) => acc + curr.shares, 0);

    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlatform = platformFilter === 'All' || post.platform === platformFilter;
        return matchesSearch && matchesPlatform;
    });

    const [birthdays, setBirthdays] = useState<{ id: string, name: string, mobile?: string }[]>([]);

    useEffect(() => {
        fetchBirthdays();
    }, []);

    const fetchBirthdays = async () => {
        // Simulate finding birthdays (random 3 voters for demo)
        const { data } = await supabase.from('voters').select('id, name_english, mobile').limit(10);
        if (data && data.length > 0) {
            // Shuffle and pick 2-3
            const shuffled = data.sort(() => 0.5 - Math.random());
            setBirthdays(shuffled.slice(0, 3).map(v => ({ id: v.id, name: v.name_english, mobile: v.mobile })));
        }
    };

    const sendBirthdayWish = (mobile?: string) => {
        if (!mobile) return alert('No mobile number for this voter');
        const msg = encodeURIComponent("🎂 Happy Birthday! Wishing you good health and happiness. - Your Nagar Sevak");
        window.open(`https://wa.me/${mobile}?text=${msg}`, '_blank');
    };

    return (
        <div className="space-y-6">


            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="text-brand-600 w-8 h-8" />
                    Social Media Analytics
                </h1>
                <div className="flex space-x-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
                        <Facebook className="w-4 h-4" /> Connect FB
                    </button>
                    <button className="px-4 py-2 bg-pink-600 text-white rounded-lg flex items-center gap-2 hover:bg-pink-700 transition">
                        <Instagram className="w-4 h-4" /> Connect IG
                    </button>
                </div>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Reach</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">45.2K</h3>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                            <Eye className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span>+12.5% this month</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Likes</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalLikes.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <ThumbsUp className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span>+8.2% this month</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Comments</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalComments.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <MessageCircle className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                        <span>Across all platforms</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Shares</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalShares.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                            <Share2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span>+24.0% viral growth</span>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-10">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search posts (e.g., 'Road', 'Festival', 'Health')..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPlatformFilter('All')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${platformFilter === 'All' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setPlatformFilter('Facebook')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${platformFilter === 'Facebook' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                        >
                            <Facebook className="w-4 h-4" /> Facebook
                        </button>
                        <button
                            onClick={() => setPlatformFilter('Instagram')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${platformFilter === 'Instagram' ? 'bg-pink-600 text-white' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'}`}
                        >
                            <Instagram className="w-4 h-4" /> Instagram
                        </button>
                    </div>
                </div>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                    <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                        <div className="relative h-48 bg-gray-100">
                            <img src={post.image} alt="Post" className="w-full h-full object-cover" />
                            <div className="absolute top-3 right-3">
                                {post.platform === 'Facebook' ? (
                                    <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg">
                                        <Facebook className="w-4 h-4" />
                                    </div>
                                ) : (
                                    <div className="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white p-1.5 rounded-full shadow-lg">
                                        <Instagram className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                                <CalendarIcon className="w-3 h-3" />
                                <span>{post.date}</span>
                            </div>
                            <p className="text-gray-800 text-sm line-clamp-3 mb-4 font-medium">
                                {post.content}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                    <ThumbsUp className="w-4 h-4 text-blue-500" />
                                    <span>{post.likes}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <MessageCircle className="w-4 h-4 text-green-500" />
                                    <span>{post.comments}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Share2 className="w-4 h-4 text-orange-500" />
                                    <span>{post.shares}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredPosts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No posts found matching your search.</p>
                </div>
            )}
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
