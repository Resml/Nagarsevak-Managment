import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import type { Survey } from '../../types';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { TranslatedText } from '../../components/TranslatedText';
import { useLanguage } from '../../context/LanguageContext';

const PublicSurveyForm = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const voterId = searchParams.get('v');
    const { t } = useLanguage();

    const [survey, setSurvey] = useState<Survey | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, string | number>>({});

    useEffect(() => {
        if (id) fetchSurvey();
    }, [id]);

    const fetchSurvey = async () => {
        try {
            const { data, error } = await supabase
                .from('surveys')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                if (data.status !== 'Active') {
                    setError(t('surveys.report.no') || "This survey is not currently active.");
                } else {
                    setSurvey({
                        id: data.id,
                        title: data.title,
                        description: data.description,
                        questions: data.questions,
                        targetSampleSize: data.target_sample_size,
                        status: data.status,
                        createdAt: data.created_at
                    });
                }
            }
        } catch (err: any) {
            console.error('Error fetching survey:', err);
            setError(err.message || 'Failed to load survey.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId: string, value: string | number) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!survey) return;

        // Validation - ensure all questions are answered
        const missingAnswers = survey.questions.filter(q => answers[q.id] === undefined);
        if (missingAnswers.length > 0) {
            setError('Please answer all questions before submitting.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            // Check if this voter already responded
            if (voterId) {
                const { data: existing } = await supabase
                    .from('survey_responses')
                    .select('id')
                    .eq('survey_id', survey.id)
                    .eq('voter_id', voterId)
                    .maybeSingle();

                if (existing) {
                    setError('You have already submitted a response for this survey.');
                    setSubmitting(false);
                    return;
                }
            }

            // Insert new response
            // To ensure compatibility across tenant boundary limitations for public links, 
            // we will query the tenant_id of the survey itself to pass onto the response row
            const { data: surveyData } = await supabase.from('surveys').select('tenant_id').eq('id', survey.id).single();

            const { error: insertError } = await supabase
                .from('survey_responses')
                .insert({
                    survey_id: survey.id,
                    voter_id: voterId || null,
                    answers,
                    tenant_id: surveyData?.tenant_id || '00000000-0000-0000-0000-000000000000'
                });

            if (insertError) throw insertError;

            setSubmitted(true);
        } catch (err: any) {
            console.error('Submit error:', err);
            setError('Failed to submit response. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    if (error && !survey) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Unavailable</h2>
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in-up">
                    <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4 animate-bounce" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h2>
                    <p className="text-slate-600">Your response has been recorded successfully.</p>
                </div>
            </div>
        );
    }

    if (!survey) return null;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-2xl mx-auto">
                {/* Header Card */}
                <div className="bg-brand-600 rounded-t-2xl p-8 text-white text-center">
                    <h1 className="text-3xl font-bold mb-3"><TranslatedText text={survey.title} /></h1>
                    {survey.description && (
                        <p className="text-brand-100 text-lg opacity-90 leading-relaxed"><TranslatedText text={survey.description} /></p>
                    )}
                </div>

                {/* Form Body */}
                <div className="bg-white shadow-xl rounded-b-2xl p-6 sm:p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {survey.questions.map((q, index) => (
                            <div key={q.id} className="p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-xl transition-all hover:border-brand-300">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex">
                                    <span className="text-brand-600 mr-2 shrink-0">{index + 1}.</span>
                                    <TranslatedText text={q.text} />
                                </h3>

                                {q.type === 'YesNo' && (
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => handleAnswerChange(q.id, 'Yes')}
                                            className={`flex-1 py-3 px-4 rounded-xl font-medium border-2 transition-all ${answers[q.id] === 'Yes'
                                                    ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:border-green-300 hover:bg-green-50/50'
                                                }`}
                                        >
                                            {t('surveys.report.yes') || 'Yes'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleAnswerChange(q.id, 'No')}
                                            className={`flex-1 py-3 px-4 rounded-xl font-medium border-2 transition-all ${answers[q.id] === 'No'
                                                    ? 'bg-red-50 border-red-500 text-red-700 shadow-sm'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:border-red-300 hover:bg-red-50/50'
                                                }`}
                                        >
                                            {t('surveys.report.no') || 'No'}
                                        </button>
                                    </div>
                                )}

                                {q.type === 'MCQ' && q.options && (
                                    <div className="space-y-3">
                                        {q.options.map((opt, i) => (
                                            <label
                                                key={i}
                                                className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${answers[q.id] === opt
                                                        ? 'bg-brand-50 border-brand-500 shadow-sm'
                                                        : 'bg-white border-slate-200 hover:border-brand-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={q.id}
                                                    value={opt}
                                                    checked={answers[q.id] === opt}
                                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                    className="w-5 h-5 text-brand-600 border-slate-300 focus:ring-brand-500 mr-3"
                                                />
                                                <span className={`font-medium ${answers[q.id] === opt ? 'text-brand-900' : 'text-slate-700'}`}>
                                                    <TranslatedText text={opt} />
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'Rating' && (
                                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => handleAnswerChange(q.id, star)}
                                                className={`text-4xl sm:text-5xl transition-all transform hover:scale-110 ${(answers[q.id] as number) >= star
                                                        ? 'text-amber-400 drop-shadow-sm'
                                                        : 'text-slate-200 hover:text-amber-200'
                                                    }`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-lg py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                            >
                                {submitting ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    'Submit Response'
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="text-center mt-6 text-slate-400 text-sm">
                    {t('login.branding_title')}
                </div>
            </div>
        </div>
    );
};

export default PublicSurveyForm;
