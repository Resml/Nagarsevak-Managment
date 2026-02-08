import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, CheckCircle, XCircle, ThumbsUp, TrendingUp, Loader2, Edit, Trash2, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { TranslatedText } from '../../components/TranslatedText';
import { supabase } from '../../services/supabaseClient';

const ImprovementDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user } = useAuth();
    const [improvement, setImprovement] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);

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
            fetchImprovement();
        }
    }, [id]);

    const fetchImprovement = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('improvements')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setImprovement(data);

            // Initialize Edit Form
            setEditForm({
                title: data.title,
                description: data.description,
                location: data.location,
                area: data.area || '',
                status: data.status,
                completion_date: data.completion_date || ''
            });
        } catch (err) {
            console.error('Error fetching improvement:', err);
            toast.error(t('improvements.fetch_failed') || 'Failed to fetch improvement');
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async () => {
        if (!improvement) return;
        setVoting(true);
        try {
            const { error } = await supabase
                .from('improvements')
                .update({ votes: improvement.votes + 1 })
                .eq('id', improvement.id);

            if (error) throw error;

            setImprovement((prev: any) => ({ ...prev, votes: prev.votes + 1 }));
            toast.success(t('improvements.success_vote'));
        } catch (err) {
            console.error('Error voting:', err);
            toast.error('Failed to submit vote');
        } finally {
            setVoting(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        setDeleting(true);
        try {
            const { error } = await supabase.from('improvements').delete().eq('id', id);
            if (error) throw error;
            toast.success('Improvement deleted successfully');
            navigate('/ward/improvements');
        } catch (err) {
            console.error('Error deleting improvement:', err);
            toast.error('Failed to delete improvement');
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
                .from('improvements')
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

            setImprovement((prev: any) => prev ? ({ ...prev, ...editForm }) : null);
            toast.success('Improvement updated successfully');
            setIsEditModalOpen(false);
        } catch (err) {
            console.error('Error updating improvement:', err);
            toast.error('Failed to update improvement');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Approved':
                return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> {t('improvements.status_approved')}</span>;
            case 'Rejected':
                return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5"><XCircle className="w-4 h-4" /> {t('improvements.status_rejected')}</span>;
            default:
                return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5"><Clock className="w-4 h-4" /> {t('improvements.status_proposed')}</span>;
        }
    };

    if (loading) return (
        <div className="max-w-5xl mx-auto space-y-6 px-4 md:px-0 pb-20 animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="ns-card p-6 md:p-8">
                        <div className="h-8 w-3/4 bg-slate-200 rounded mb-4"></div>
                        <div className="h-4 w-full bg-slate-200 rounded mb-2"></div>
                        <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="ns-card p-6">
                        <div className="h-32 bg-slate-100 rounded-xl"></div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (!improvement) return <div className="p-10 text-center text-red-500">Improvement not found</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6 px-4 md:px-0 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button
                    onClick={() => navigate('/ward/improvements')}
                    className="group flex items-center gap-3 text-slate-500 hover:text-brand-600 transition-colors"
                >
                    <div className="p-2 bg-white rounded-full border border-slate-200 shadow-sm group-hover:border-brand-200 group-hover:shadow transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span>{t('improvements.back_to_list')}</span>
                </button>

                <div className="flex gap-2">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm transition-colors font-medium text-sm"
                    >
                        <Edit className="w-4 h-4" /> {t('work_history.edit')}
                    </button>
                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition-colors font-medium text-sm"
                    >
                        <Trash2 className="w-4 h-4" /> {t('work_history.delete')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <div className="ns-card p-6 md:p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl pointer-events-none"></div>

                        <div className="relative">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        {getStatusBadge(improvement.status)}
                                    </div>
                                    <h1 className="text-3xl font-bold text-slate-900 leading-tight"><TranslatedText text={improvement.title} /></h1>
                                </div>
                            </div>

                            <div className="prose prose-slate max-w-none mb-8">
                                <p className="whitespace-pre-wrap text-slate-700 text-lg leading-relaxed"><TranslatedText text={improvement.description} /></p>
                            </div>

                            <div className="flex flex-wrap gap-6 text-sm text-slate-500 pt-6 border-t border-slate-100">
                                {improvement.location && (
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-slate-50 rounded-full text-slate-400"><MapPin className="w-4 h-4" /></div>
                                        <div>
                                            <div className="text-xs uppercase font-semibold text-slate-400">{t('improvements.form_location')}</div>
                                            <div className="font-medium text-slate-900"><TranslatedText text={improvement.location} /></div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-slate-50 rounded-full text-slate-400"><Calendar className="w-4 h-4" /></div>
                                    <div>
                                        <div className="text-xs uppercase font-semibold text-slate-400">{t('improvements.date_prefix').replace(':', '')}</div>
                                        <div className="font-medium text-slate-900">
                                            {improvement.created_at ? new Date(improvement.created_at).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <div className="ns-card p-6">
                        <h3 className="font-bold text-slate-900 mb-4">{t('improvements.vote_summary')}</h3>

                        <div className="text-center py-8 bg-gradient-to-br from-brand-50 to-white rounded-xl border border-brand-100 mb-6">
                            <div className="text-5xl font-bold text-brand-700 mb-2">{improvement.votes}</div>
                            <div className="text-sm text-slate-600 font-medium uppercase tracking-wide">{t('improvements.total_votes')}</div>

                            <button
                                onClick={handleVote}
                                disabled={voting}
                                className="mt-6 flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-medium transition shadow-lg shadow-brand-200 mx-auto disabled:opacity-70"
                            >
                                {voting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                                {t('improvements.vote_btn')}
                            </button>
                        </div>

                        {/* AI Summary Simulation */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="font-semibold text-slate-900 text-sm flex items-center mb-2">
                                <TrendingUp className="w-3 h-3 mr-2 text-green-600" /> AI Trend Analysis
                            </h4>
                            <p className="text-sm text-slate-600 italic leading-relaxed">
                                {t('improvements.voting_trend')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {
                isDeleteModalOpen && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden p-6 shadow-2xl">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{t('work_history.delete_modal_title')}</h3>
                                <p className="text-slate-500 mt-2 text-sm">
                                    {t('work_history.delete_modal_text')}
                                </p>
                            </div>
                            <div className="flex gap-3 pt-6">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    disabled={deleting}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition"
                                >
                                    {t('work_history.cancel')}
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition shadow-lg shadow-red-200 disabled:opacity-50"
                                >
                                    {deleting ? t('work_history.deleting') || 'Deleting...' : t('work_history.delete')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Modal */}
            {
                isEditModalOpen && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-slate-900">{t('work_history.edit_modal_title')}</h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('work_history.project_title')}</label>
                                    <input
                                        type="text"
                                        className="ns-input w-full"
                                        value={editForm.title}
                                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('work_history.description')}</label>
                                    <textarea
                                        className="ns-input w-full h-32"
                                        value={editForm.description}
                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('work_history.location')}</label>
                                        <input
                                            type="text"
                                            className="ns-input w-full"
                                            value={editForm.location}
                                            onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('work_history.area_locality')}</label>
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
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('work_history.completion_date_label')}</label>
                                        <input
                                            type="date"
                                            className="ns-input w-full"
                                            value={editForm.completion_date}
                                            onChange={e => setEditForm({ ...editForm, completion_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('work_history.status')}</label>
                                        <select
                                            className="ns-input w-full"
                                            value={editForm.status}
                                            onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                        >
                                            <option value="Proposed">{t('improvements.status_proposed')}</option>
                                            <option value="Approved">{t('improvements.status_approved')}</option>
                                            <option value="Rejected">{t('improvements.status_rejected')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition"
                                    >
                                        {t('work_history.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-medium transition shadow-lg shadow-brand-200 disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                        {updating ? t('work_history.saving') : t('work_history.save_changes')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ImprovementDetail;
