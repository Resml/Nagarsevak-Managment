import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { FeedbackService, type FeedbackStats } from '../../services/feedbackService';
import { ArrowLeft, MapPin, Calendar, Clock, CheckCircle, Hammer, Edit, Trash2, Wand2, X, Save, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

interface WorkItemDetail {
    id: string;
    title: string;
    description: string;
    location: string;
    area: string;
    status: string;
    completion_date: string;
    created_at: string;
}

const WorkDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [work, setWork] = useState<WorkItemDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [feedbackStats, setFeedbackStats] = useState<FeedbackStats>({ average: '0.0', count: 0, items: [] });

    // Actions State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Edit Form State
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        location: '',
        area: '',
        status: '',
        completion_date: ''
    });

    useEffect(() => {
        if (id) {
            fetchWorkDetails();
            const sub = FeedbackService.subscribeToFeedback((payload) => {
                if (payload.new.work_id === id) {
                    fetchFeedback();
                }
            });
            return () => { supabase.removeChannel(sub); };
        }
    }, [id]);

    const fetchWorkDetails = async () => {
        setLoading(true);
        try {
            // Fetch Work
            const { data, error } = await supabase
                .from('works')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setWork(data);

            // Initialize Edit Form
            setEditForm({
                title: data.title,
                description: data.description,
                location: data.location,
                area: data.area || '',
                status: data.status,
                completion_date: data.completion_date || ''
            });

            // Fetch Feedback
            await fetchFeedback();

        } catch (err) {
            console.error('Error fetching work details:', err);
            toast.error('Failed to load work details');
        } finally {
            setLoading(false);
        }
    };

    const fetchFeedback = async () => {
        if (!id) return;
        const stats = await FeedbackService.getFeedbackStats(id);
        setFeedbackStats(stats);
    };

    const handleDelete = async () => {
        if (!id) return;
        setDeleting(true);
        try {
            const { error } = await supabase.from('works').delete().eq('id', id);
            if (error) throw error;
            toast.success('Work deleted successfully');
            navigate('/history');
        } catch (err) {
            console.error('Error deleting work:', err);
            toast.error('Failed to delete work');
        } finally {
            setDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('works')
                .update({
                    title: editForm.title,
                    description: editForm.description,
                    location: editForm.location,
                    area: editForm.area,
                    status: editForm.status,
                    completion_date: editForm.completion_date || null
                })
                .eq('id', id);

            if (error) throw error;

            setWork(prev => prev ? ({ ...prev, ...editForm }) : null);
            toast.success('Work updated successfully');
            setIsEditModalOpen(false);
        } catch (err) {
            console.error('Error updating work:', err);
            toast.error('Failed to update work');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Completed':
                return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Completed</span>;
            case 'InProgress':
                return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5"><Hammer className="w-4 h-4" /> In Progress</span>;
            default:
                return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5"><Clock className="w-4 h-4" /> Planned</span>;
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Loading work details...</div>;
    if (!work) return <div className="p-10 text-center text-red-500">Work not found</div>;

    const isAdmin = user?.role === 'admin';

    return (
        <div className="max-w-5xl mx-auto space-y-6 px-4 md:px-0 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button
                    onClick={() => navigate('/history')}
                    className="group flex items-center gap-2 text-slate-600 hover:text-brand-700 transition-colors font-medium"
                >
                    <div className="p-2 bg-white rounded-full border border-slate-200 shadow-sm group-hover:border-brand-200 group-hover:shadow transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span>Back to History</span>
                </button>

                {isAdmin && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm transition-colors font-medium text-sm"
                        >
                            <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition-colors font-medium text-sm"
                        >
                            <Trash2 className="w-4 h-4" /> Delete
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <div className="ns-card p-6 md:p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="ns-badge bg-blue-50 text-blue-700 border-blue-100">Manual Work</span>
                                    {work.area && <span className="ns-badge bg-slate-100 text-slate-600">{work.area}</span>}
                                </div>
                                <h1 className="text-3xl font-bold text-slate-900 leading-tight">{work.title}</h1>
                            </div>
                            {getStatusBadge(work.status)}
                        </div>

                        <div className="prose prose-slate max-w-none mb-8">
                            <p className="whitespace-pre-wrap text-slate-700 text-lg leading-relaxed">{work.description}</p>
                        </div>

                        <div className="flex flex-wrap gap-6 text-sm text-slate-500 pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-slate-50 rounded-full text-slate-400"><MapPin className="w-4 h-4" /></div>
                                <div>
                                    <div className="text-xs uppercase font-semibold text-slate-400">Location</div>
                                    <div className="font-medium text-slate-900">{work.location}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-slate-50 rounded-full text-slate-400"><Calendar className="w-4 h-4" /></div>
                                <div>
                                    <div className="text-xs uppercase font-semibold text-slate-400">Completion Date</div>
                                    <div className="font-medium text-slate-900">
                                        {work.completion_date ? format(new Date(work.completion_date), 'MMM d, yyyy') : 'No date set'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feedback List */}
                    <div className="ns-card p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <User className="w-5 h-5 text-brand-600" />
                            Citizen Feedback
                        </h3>

                        {feedbackStats.items.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <div className="text-slate-400">No feedback received yet.</div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {feedbackStats.items.map((fb) => (
                                    <div key={fb.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-semibold text-slate-900">{fb.citizen_name}</div>
                                                <div className="text-xs text-slate-500">{format(new Date(fb.created_at), 'MMM d, yyyy h:mm a')}</div>
                                            </div>
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i} className={`text-sm ${i < fb.rating ? 'text-yellow-400' : 'text-slate-300'}`}>★</span>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-slate-700">{fb.comment}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <div className="ns-card p-6">
                        <h3 className="font-bold text-slate-900 mb-4">Feedback Summary</h3>

                        <div className="text-center py-6 bg-gradient-to-br from-brand-50 to-white rounded-xl border border-brand-100 mb-6">
                            <div className="text-4xl font-bold text-brand-700">{feedbackStats.average}</div>
                            <div className="flex justify-center gap-1 my-2 text-yellow-400 text-lg">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className={i < Math.round(parseFloat(feedbackStats.average)) ? 'text-yellow-400' : 'text-slate-200'}>★</span>
                                ))}
                            </div>
                            <div className="text-sm text-slate-600 font-medium">{feedbackStats.count} Total Reviews</div>
                        </div>

                        {/* AI Summary Simulation */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="font-semibold text-slate-900 text-sm flex items-center mb-2">
                                <Wand2 className="w-3 h-3 mr-2 text-purple-500" /> AI Insights
                            </h4>
                            <p className="text-sm text-slate-600 italic leading-relaxed">
                                {feedbackStats.count > 0
                                    ? "Citizens generally appreciate this work. Positive sentiment detected regarding timely execution."
                                    : "Not enough data to generate insights yet."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden p-6 shadow-2xl">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Delete Work?</h3>
                            <p className="text-slate-500 mt-2 text-sm">
                                Are you sure you want to delete this work entry? All associated feedback will also be removed.
                            </p>
                        </div>
                        <div className="flex gap-3 pt-6">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition shadow-lg shadow-red-200 disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-900">Edit Work Details</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    className="ns-input w-full"
                                    value={editForm.title}
                                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    className="ns-input w-full h-32"
                                    value={editForm.description}
                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        className="ns-input w-full"
                                        value={editForm.location}
                                        onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Area</label>
                                    <input
                                        type="text"
                                        className="ns-input w-full"
                                        value={editForm.area}
                                        onChange={e => setEditForm({ ...editForm, area: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Completion Date</label>
                                    <input
                                        type="date"
                                        className="ns-input w-full"
                                        value={editForm.completion_date}
                                        onChange={e => setEditForm({ ...editForm, completion_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <select
                                        className="ns-input w-full"
                                        value={editForm.status}
                                        onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                    >
                                        <option value="Planned">Planned</option>
                                        <option value="InProgress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-medium transition shadow-lg shadow-brand-200 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {updating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkDetail;
