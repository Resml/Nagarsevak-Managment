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

            {/* Detailed Responses Table */}
            <h2 className="text-lg font-bold text-slate-900 mt-10 mb-4 border-b border-slate-200 pb-2">
                <Users className="w-5 h-5 inline-block mr-2 text-slate-500" />
                Detailed Citizen Responses
            </h2>

            <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden mb-12">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Citizen</th>
                                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Date</th>
                                {survey.questions.map((q, i) => (
                                    <th key={q.id} className="px-6 py-4 font-semibold text-xs tracking-wider uppercase max-w-[200px] truncate" title={q.text}>
                                        Q{i + 1}: <TranslatedText text={q.text} />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {responses.length === 0 ? (
                                <tr>
                                    <td colSpan={survey.questions.length + 2} className="px-6 py-8 text-center text-slate-500">
                                        No responses yet. Send the survey link over WhatsApp to start collecting data.
                                    </td>
                                </tr>
                            ) : (
                                responses.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {r.voters ? (
                                                <div className="flex flex-col gap-0.5">
                                                    <div>{r.voters.name_marathi || r.voters.name}</div>
                                                    <div className="text-xs text-slate-500 font-normal hover:text-brand-600 transition-colors cursor-pointer" onClick={() => window.open(`https://wa.me/91${r.voters.mobile}`, '_blank')}>
                                                        +91 {r.voters.mobile}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-500 italic">Anonymous</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(r.created_at).toLocaleDateString()} {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        {survey.questions.map(q => (
                                            <td key={q.id} className="px-6 py-4 text-slate-700 max-w-[250px] truncate" title={r.answers?.[q.id]}>
                                                {r.answers?.[q.id] || <span className="text-slate-300">-</span>}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SurveyDetails;
