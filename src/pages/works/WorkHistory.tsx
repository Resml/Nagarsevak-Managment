import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { AIService } from '../../services/aiService';
import { FeedbackService } from '../../services/feedbackService';
import type { FeedbackStats, FeedbackItem } from '../../services/feedbackService';
import { CheckCircle, Clock, Hammer, MapPin, Plus, Search, User, FileText, HeartHandshake, Wand2 } from 'lucide-react';
import { format } from 'date-fns';

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
    const [items, setItems] = useState<WorkItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [generatingAI, setGeneratingAI] = useState(false);

    // Feedback State
    const [feedbackData, setFeedbackData] = useState<Record<string, FeedbackStats>>({});
    const [broadcastingId, setBroadcastingId] = useState<string | null>(null);
    const [showReport, setShowReport] = useState<string | null>(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [newWork, setNewWork] = useState({
        title: '',
        description: '',
        location: '',
        area: '',
        status: 'Planned',
        completion_date: '',
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

            // Refresh stats for this workId
            const stats = await FeedbackService.getFeedbackStats(workId);
            setFeedbackData(prev => ({
                ...prev,
                [workId]: stats
            }));
        });

        return () => {
            workSubscription.unsubscribe();
            supabase.removeChannel(feedbackSubscription);
        };
    }, []);

    // Helper to fetch feedback for a work item if not already loaded
    const loadFeedbackStats = async (workId: string) => {
        const stats = await FeedbackService.getFeedbackStats(workId);
        setFeedbackData(prev => ({ ...prev, [workId]: stats }));
    };

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
                title: c.category === 'Help' ? 'Help Provided' : 'Issue Resolved',
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
            allItems.forEach(item => {
                loadFeedbackStats(item.id);
            });

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
            alert('Failed to generate description');
        } finally {
            setGeneratingAI(false);
        }
    };

    const handleAddWork = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('works')
                .insert([{
                    ...newWork,
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;
            setShowModal(false);
            if (error) throw error;
            setShowModal(false);
            setNewWork({ title: '', description: '', location: '', area: '', status: 'Planned', completion_date: '' });
            fetchData();
            alert('Work added successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to add work.');
        }
    };


    // Trigger Broadcast for Real-Time Feedback
    const handleGetFeedback = async (id: string) => {
        setBroadcastingId(id);

        // This triggers the "Bot" simulation which starts inserting records into the DB
        await FeedbackService.broadcastFeedbackRequest(id);

        // Since we are subscribed to Real-Time changes, we don't need to manually update state here.
        // The subscription will catch the INSERT events and update the UI live.

        setTimeout(() => {
            setBroadcastingId(null);
            alert("Broadcast Sent! Watch for real-time updates...");
        }, 1000);
    };

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'Manual': return <Hammer className="w-4 h-4 text-blue-500" />;
            case 'Help': return <HeartHandshake className="w-4 h-4 text-purple-500" />;
            default: return <FileText className="w-4 h-4 text-green-500" />; // Complaint
        }
    };

    const getStatusBadge = (status: string, source: string) => {
        if (source !== 'Manual') {
            return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Resolved</span>;
        }
        switch (status) {
            case 'Completed':
                return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>;
            case 'InProgress':
                return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><Hammer className="w-3 h-3" /> In Progress</span>;
            default:
                return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Planned</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Work History & Achievements</h1>
                    <p className="text-sm text-gray-500">Unified view of development works, resolved issues, and help provided.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700"
                >
                    <Plus className="w-4 h-4" /> Add Work
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search by Title, Location, or Description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
            </div>

            {/* Add Work Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Add New Work Project</h2>
                        <form onSubmit={handleAddWork} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Project Title</label>
                                <input
                                    type="text" required
                                    className="w-full border rounded-lg p-2 mt-1"
                                    value={newWork.title}
                                    onChange={e => setNewWork({ ...newWork, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <div className="relative">
                                    <textarea
                                        className="w-full border rounded-lg p-2 mt-1 pr-10"
                                        rows={3}
                                        value={newWork.description}
                                        onChange={e => setNewWork({ ...newWork, description: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAutoGenerate}
                                        disabled={generatingAI || !newWork.title}
                                        className="absolute right-2 bottom-2 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                                        title="Auto-Generate Description with AI"
                                    >
                                        <Wand2 className={`w-5 h-5 ${generatingAI ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Enter a title and click the wand to auto-generate a description.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Location</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg p-2 mt-1"
                                        value={newWork.location}
                                        onChange={e => setNewWork({ ...newWork, location: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Area / Locality</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg p-2 mt-1"
                                        value={newWork.area}
                                        onChange={e => setNewWork({ ...newWork, area: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Completion Date (Est)</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded-lg p-2 mt-1"
                                        value={newWork.completion_date}
                                        onChange={e => setNewWork({ ...newWork, completion_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    className="w-full border rounded-lg p-2 mt-1"
                                    value={newWork.status}
                                    onChange={e => setNewWork({ ...newWork, status: e.target.value })}
                                >
                                    <option value="Planned">Planned</option>
                                    <option value="InProgress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Save Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReport && feedbackData[showReport] && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold">Feedback Report</h2>
                            <button onClick={() => setShowReport(null)} className="text-gray-500 hover:text-gray-700">
                                X
                            </button>
                        </div>

                        <div className="bg-indigo-50 p-4 rounded-lg mb-4 text-center">
                            <div className="text-3xl font-bold text-indigo-700">{feedbackData[showReport].average}/5</div>
                            <div className="text-sm text-indigo-600">Average Rating based on {feedbackData[showReport].count} responses</div>
                        </div>

                        <div className="bg-green-50 p-3 rounded-lg border border-green-100 mb-4">
                            <h4 className="font-semibold text-green-800 text-sm flex items-center mb-1">
                                <Wand2 className="w-3 h-3 mr-1" /> AI Summary
                            </h4>
                            <p className="text-sm text-green-700 italic">
                                "Citizens have largely appreciated the work. Key positive sentiments include 'Good work' and 'Great initiative'. Some concerns were raised regarding execution speed."
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-800">Recent Comments</h3>
                            {feedbackData[showReport].items.map((fb: FeedbackItem) => (
                                <div key={fb.id} className="border-b border-gray-100 pb-2 last:border-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-medium text-xs text-gray-600">{fb.citizen_name}</span>
                                        <span className="text-yellow-500 text-xs">{'★'.repeat(fb.rating)}</span>
                                    </div>
                                    <p className="text-sm text-gray-800">{fb.comment}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-xl"></div>)}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col h-full">
                            <div className="flex justify-between items-start mb-3">
                                {getStatusBadge(item.status, item.source)}
                                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                    {getSourceIcon(item.source)}
                                    <span>{item.source}</span>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-3">{item.description}</p>

                            {/* Feedback Section */}
                            <div className="mt-auto pt-3 border-t border-gray-100">
                                {feedbackData[item.id] ? (
                                    <div
                                        onClick={() => setShowReport(item.id)}
                                        className="mb-3 p-2 bg-indigo-50 rounded-lg flex items-center justify-between cursor-pointer hover:bg-indigo-100 transition-colors"
                                    >
                                        <div>
                                            <span className="text-xs font-semibold text-indigo-700 block">Feedback Report</span>
                                            <span className="text-xs text-indigo-600">{feedbackData[item.id].count} Responses</span>
                                        </div>
                                        <div className="text-indigo-700 font-bold text-sm">
                                            {feedbackData[item.id].average} ★
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleGetFeedback(item.id)}
                                        disabled={broadcastingId === item.id}
                                        className="w-full mb-3 py-1.5 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-50 flex items-center justify-center space-x-1 disabled:opacity-50"
                                    >
                                        {broadcastingId === item.id ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-600 border-t-transparent rounded-full animate-spin"></div>
                                                <span>Broadcasting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>📢 Get Feedback</span>
                                            </>
                                        )}
                                    </button>
                                )}

                                <div className="space-y-2">
                                    <div className="flex items-center text-xs text-gray-500 gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{format(new Date(item.date), 'MMM d, yyyy')}</span>
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500 gap-1">
                                        <MapPin className="w-3 h-3" />
                                        <span className="truncate">{item.location} {item.area ? `(${item.area})` : ''}</span>
                                    </div>
                                    {item.citizenName && (
                                        <div className="flex items-center text-xs text-blue-600 gap-1 font-medium">
                                            <User className="w-3 h-3" />
                                            <span>For: {item.citizenName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredItems.length === 0 && (
                        <div className="col-span-full text-center py-10 text-gray-500">
                            No work records found matching your search.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WorkHistory;
