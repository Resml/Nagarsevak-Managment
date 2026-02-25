import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, BarChart3, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabaseClient';
import { useTenant } from '../../context/TenantContext';
import type { Survey } from '../../types';
import { toast } from 'sonner';
import { TranslatedText } from '../../components/TranslatedText';

const SurveyDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { tenantId } = useTenant();

    const [survey, setSurvey] = useState<Survey | null>(null);
    const [responses, setResponses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenantId || !id) return;
        fetchSurveyDetails();
    }, [tenantId, id]);

    const fetchSurveyDetails = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('surveys')
                .select('*')
                .eq('id', id)
                .eq('tenant_id', tenantId)
                .single();

            if (error) throw error;
            if (data) {
                setSurvey({
                    id: data.id,
                    title: data.title,
                    description: data.description,
                    area: data.area,
                    status: data.status,
                    questions: data.questions,
                    targetSampleSize: data.target_sample_size || 0,
                    createdAt: data.created_at
                });

                // Fetch real responses
                const { data: respData, error: respError } = await supabase
                    .from('survey_responses')
                    .select('*, voters(id, name, name_marathi, mobile)')
                    .eq('survey_id', id)
                    .order('created_at', { ascending: false });

                if (!respError && respData) {
                    setResponses(respData);
                }
            }
        } catch (error) {
            console.error('Error fetching survey details:', error);
            toast.error('Failed to load survey details');
            navigate('/dashboard/surveys');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    if (!survey) return null;

    // Generate real responses based on target sample size
    const totalResponses = responses.length;
    const target = survey.targetSampleSize || 1;
    const completionRate = Math.min(100, Math.round((totalResponses / target) * 100));

    // Helper functions for stats
    const getYesNoStats = (qId: string) => {
        let yes = 0; let no = 0;
        responses.forEach(r => {
            if (r.answers?.[qId] === 'Yes') yes++;
            if (r.answers?.[qId] === 'No') no++;
        });
        const total = yes + no || 1;
        return { yes, no, yesPerc: Math.round((yes / total) * 100), noPerc: Math.round((no / total) * 100) };
    }

    const getMcqStats = (qId: string, opt: string) => {
        let count = 0;
        let answeredTotal = 0;
        responses.forEach(r => {
            if (r.answers?.[qId]) answeredTotal++;
            if (r.answers?.[qId] === opt) count++;
        });
        const perc = answeredTotal > 0 ? Math.round((count / answeredTotal) * 100) : 0;
        return { count, perc, answeredTotal };
    }

    const getRatingStats = (qId: string) => {
        let sum = 0;
        let answeredTotal = 0;
        const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        responses.forEach(r => {
            const val = Number(r.answers?.[qId]);
            if (val >= 1 && val <= 5) {
                answeredTotal++;
                sum += val;
                dist[val as keyof typeof dist]++;
            }
        });
        const avg = answeredTotal > 0 ? (sum / answeredTotal).toFixed(1) : '0.0';
        return { avg, answeredTotal, dist };
    }

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 space-y-4">
                <button
                    onClick={() => navigate('/dashboard/surveys')}
                    className="flex items-center text-slate-500 hover:text-slate-700 transition-colors mb-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    {t('surveys.report.back_to_surveys')}
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            {t('surveys.report.title')}
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${survey.status === 'Active' ? 'bg-green-100 text-green-700' :
                                survey.status === 'Draft' ? 'bg-slate-100 text-slate-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                {survey.status}
                            </span>
                        </h1>
                        <p className="text-slate-500 mt-1">
                            {t('surveys.report.results_for')}: <span className="font-semibold text-slate-700"><TranslatedText text={survey.title} /></span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="ns-card p-6 flex items-center gap-4">
                    <div className="p-3 bg-brand-50 border border-brand-100 text-brand-600 rounded-xl">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">{t('surveys.report.responses')}</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-bold text-slate-900 tabular-nums">{totalResponses}</h3>
                            <span className="text-sm text-slate-500">
                                {t('surveys.report.out_of')} {survey.targetSampleSize} {t('surveys.report.target')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="ns-card p-6 flex flex-col justify-center">
                    <div className="flex justify-between items-end mb-2">
                        <p className="text-sm text-slate-500">{t('surveys.report.response_rate')}</p>
                        <h3 className="text-xl font-bold text-slate-900">{completionRate}%</h3>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${completionRate > 75 ? 'bg-green-500' : completionRate > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Questions Breakdown */}
            <h2 className="text-lg font-bold text-slate-900 mt-8 mb-4 border-b border-slate-200 pb-2">
                <BarChart3 className="w-5 h-5 inline-block mr-2 text-slate-500" />
                {t('surveys.report.question_breakdown')}
            </h2>

            <div className="space-y-6">
                {survey.questions.map((q, idx) => {
                    return (
                        <div key={q.id} className="ns-card p-6 border border-slate-200/60 shadow-sm">
                            <h3 className="font-semibold text-slate-800 mb-4 text-lg">
                                <span className="text-brand-600 mr-2">Q{idx + 1}.</span>
                                <TranslatedText text={q.text} />
                            </h3>

                            {q.type === 'YesNo' && Array.of(getYesNoStats(q.id)).map(stats => (
                                <div key="yesno" className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-slate-700 flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> {t('surveys.report.yes')}</span>
                                            <span className="text-slate-500">{stats.yes} {t('surveys.report.votes')} ({stats.yesPerc}%)</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: `${stats.yesPerc}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-slate-700 flex items-center gap-1"><AlertCircle className="w-4 h-4 text-red-500" /> {t('surveys.report.no')}</span>
                                            <span className="text-slate-500">{stats.no} {t('surveys.report.votes')} ({stats.noPerc}%)</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="bg-red-400 h-full rounded-full transition-all duration-1000" style={{ width: `${stats.noPerc}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {q.type === 'MCQ' && q.options && (
                                <div className="space-y-4">
                                    {q.options.map((opt, optIdx) => {
                                        const stats = getMcqStats(q.id, opt);
                                        return (
                                            <div key={optIdx} className="flex flex-col gap-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium text-slate-700"><TranslatedText text={opt} /></span>
                                                    <span className="text-slate-500">{stats.count} {t('surveys.report.votes')} ({stats.perc}%)</span>
                                                </div>
                                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="bg-brand-500 h-full rounded-full transition-all duration-1000" style={{ width: `${stats.perc}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {q.type === 'Rating' && Array.of(getRatingStats(q.id)).map(stats => (
                                <div key="rating" className="flex items-center gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="text-center w-24">
                                        <div className="text-4xl font-bold text-amber-500">{stats.avg}</div>
                                        <div className="text-xs text-slate-500 mt-1">{stats.answeredTotal} {t('surveys.report.responses')}</div>
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        {[5, 4, 3, 2, 1].map(star => {
                                            const count = stats.dist[star as keyof typeof stats.dist];
                                            const perc = stats.answeredTotal > 0 ? (count / stats.answeredTotal) * 100 : 0;
                                            return (
                                                <div key={star} className="flex items-center gap-2 text-xs">
                                                    <span className="w-8 text-right text-slate-600 font-medium">{star} ★</span>
                                                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                        <div className="bg-amber-400 h-full rounded-full transition-all duration-1000" style={{ width: `${perc}%` }}></div>
                                                    </div>
                                                    <span className="w-6 text-slate-400">{count}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>

            {/* Individual Citizen Responses */}
            <h2 className="text-lg font-bold text-slate-900 mt-10 mb-1 flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-500" />
                Individual Responses
                <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium ml-1">{responses.length}</span>
            </h2>
            <p className="text-sm text-slate-500 mb-5">Each citizen's full responses to all survey questions.</p>

            {responses.length === 0 ? (
                <div className="ns-card p-10 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No responses yet.</p>
                    <p className="text-sm mt-1">Send the survey to citizens via WhatsApp bot to start collecting data.</p>
                </div>
            ) : (
                <div className="space-y-4 mb-12">
                    {responses.map((r, rIdx) => {
                        const citizen = r.voters;
                        const submitDate = new Date(r.created_at);
                        return (
                            <div key={r.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                {/* Citizen header */}
                                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-brand-50 to-slate-50 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm shrink-0">
                                            {rIdx + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800 text-sm">
                                                {citizen ? (citizen.name_marathi || citizen.name || 'Unknown') : <span className="italic text-slate-400">Anonymous</span>}
                                            </p>
                                            {citizen?.mobile && (
                                                <button
                                                    onClick={() => window.open(`https://wa.me/91${citizen.mobile}`, '_blank')}
                                                    className="text-xs text-brand-600 hover:underline font-medium"
                                                >
                                                    +91 {citizen.mobile}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">
                                            {submitDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {submitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                {/* Answers grid */}
                                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {survey.questions.map((q, qIdx) => {
                                        // answers may be keyed by q.id OR by q.text (from bot which uses text as key)
                                        const answer = r.answers?.[q.id] ?? r.answers?.[q.text] ?? null;
                                        const isYes = typeof answer === 'string' && /^(yes|होय)$/i.test(answer);
                                        const isNo = typeof answer === 'string' && /^(no|नाही)$/i.test(answer);
                                        const isRating = typeof answer === 'number' || (typeof answer === 'string' && /^\d$/.test(answer) && q.type === 'Rating');
                                        return (
                                            <div key={q.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                                                    Q{qIdx + 1}: <TranslatedText text={q.text} />
                                                </p>
                                                {answer !== null && answer !== undefined ? (
                                                    <div>
                                                        {isYes && (
                                                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                                                                <CheckCircle2 className="w-3.5 h-3.5" /> {String(answer)}
                                                            </span>
                                                        )}
                                                        {isNo && (
                                                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 bg-red-100 px-2.5 py-1 rounded-full">
                                                                <AlertCircle className="w-3.5 h-3.5" /> {String(answer)}
                                                            </span>
                                                        )}
                                                        {isRating && !isYes && !isNo && (
                                                            <span className="text-lg font-bold text-amber-500">
                                                                {'★'.repeat(Number(answer))}{'☆'.repeat(5 - Number(answer))}
                                                                <span className="text-sm text-slate-500 font-normal ml-1">{answer}/5</span>
                                                            </span>
                                                        )}
                                                        {!isYes && !isNo && !isRating && (
                                                            <p className="text-sm text-slate-800 font-medium">{String(answer)}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-slate-400 italic">No answer</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SurveyDetails;
