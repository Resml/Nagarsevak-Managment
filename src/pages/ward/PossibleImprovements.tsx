import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Lightbulb, ThumbsUp, MapPin, Calendar, Wand2, User, X } from 'lucide-react';
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
    status: 'Proposed' | 'Approved' | 'Rejected';
    completion_date: string;
    metadata?: any;
    created_at: string;
}

const PossibleImprovements = () => {
    const { t } = useLanguage();
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
        status: 'Proposed' as 'Proposed' | 'Approved' | 'Rejected',
        completion_date: '',
        peopleBenefited: ''
    });

    useEffect(() => {
        fetchData();

        // Subscribe to changes
        const subscription = supabase
            .channel('improvements_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'improvements' }, () => fetchData())
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('improvements')
                .select('*')
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
                status: 'Proposed',
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
                ) : improvements.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => navigate(`/ward/improvements/${item.id}`)}
                        className="ns-card p-5 hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Lightbulb className="w-24 h-24 text-brand-500 transform rotate-12" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${item.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                    item.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    }`}>
                                    {item.status === 'Proposed' ? t('improvements.status_proposed') :
                                        (item.status === 'Approved' ? t('improvements.status_approved') : t('improvements.status_rejected'))}
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
                                    <option value="Proposed">{t('improvements.status_proposed')}</option>
                                    <option value="Approved">{t('improvements.status_approved')}</option>
                                    <option value="Rejected">{t('improvements.status_rejected')}</option>
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
