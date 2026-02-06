import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, CheckCircle, XCircle, ThumbsUp, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../context/LanguageContext';
import { TranslatedText } from '../../components/TranslatedText';

// Mock Data (matches PossibleImprovements.tsx)
const MOCK_DATA = [
    {
        id: 1,
        title: 'New Garden in Sector 4',
        description: 'Proposal to build a nano-park in the empty plot near Ganesh Mandir.',
        votes: 45,
        location: 'Sector 4',
        status: 'Proposed',
        date: '2025-10-15'
    },
    {
        id: 2,
        title: 'Street Light Upgrade',
        description: 'Replace all sodium vapor lamps with LEDs in Lane 7.',
        votes: 32,
        location: 'Lane 7, Main Road',
        status: 'Approved',
        date: '2025-10-20'
    }
];

const ImprovementDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [improvement, setImprovement] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate fetch
        setLoading(true);
        setTimeout(() => {
            const found = MOCK_DATA.find(i => i.id === Number(id));
            setImprovement(found || null);
            setLoading(false);
        }, 600);
    }, [id]);

    const handleVote = () => {
        if (!improvement) return;
        setImprovement({ ...improvement, votes: improvement.votes + 1 });
        toast.success(t('improvements.success_vote'));
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
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-slate-50 rounded-full text-slate-400"><MapPin className="w-4 h-4" /></div>
                                    <div>
                                        <div className="text-xs uppercase font-semibold text-slate-400">{t('improvements.form_location')}</div>
                                        <div className="font-medium text-slate-900"><TranslatedText text={improvement.location} /></div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-slate-50 rounded-full text-slate-400"><Calendar className="w-4 h-4" /></div>
                                    <div>
                                        <div className="text-xs uppercase font-semibold text-slate-400">{t('improvements.date_prefix').replace(':', '')}</div>
                                        <div className="font-medium text-slate-900">
                                            {new Date(improvement.date).toLocaleDateString()}
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
                                className="mt-6 flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-medium transition shadow-lg shadow-brand-200 mx-auto"
                            >
                                <ThumbsUp className="w-4 h-4" />
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
        </div>
    );
};

export default ImprovementDetail;
