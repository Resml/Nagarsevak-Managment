import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext'; // Added
import type { Question } from '../../types';

const CreateSurvey = () => {
    const { t } = useLanguage();
    const { tenantId } = useTenant(); // Added
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID from URL
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [area, setArea] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch existing survey if in edit mode
    useEffect(() => {
        if (!id || !tenantId) return;

        const fetchSurvey = async () => {
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
                    setTitle(data.title);
                    setDescription(data.description || '');
                    setArea(data.area || '');
                    // Ensure questions is an array
                    const qs = typeof data.questions === 'string'
                        ? JSON.parse(data.questions)
                        : data.questions;
                    setQuestions(qs || []);
                }
            } catch (error) {
                console.error('Error fetching survey:', error);
                toast.error('Failed to load survey details');
                navigate('/dashboard/surveys');
            } finally {
                setLoading(false);
            }
        };

        fetchSurvey();
    }, [id, tenantId, navigate]);

    const addQuestion = () => {
        const newQuestion: Question = {
            id: `q_${Date.now()}`,
            text: '',
            type: 'MCQ',
            options: ['Option 1', 'Option 2', 'Option 3', 'Option 4']
        };
        setQuestions([...questions, newQuestion]);
    };

    const updateQuestion = (id: string, field: keyof Question, value: any) => {
        setQuestions(questions.map(q =>
            q.id === id ? { ...q, [field]: value } : q
        ));
    };

    const updateOption = (qId: string, optIndex: number, value: string) => {
        setQuestions(questions.map(q => {
            if (q.id === qId && q.options) {
                const newOptions = [...q.options];
                newOptions[optIndex] = value;
                return { ...q, options: newOptions };
            }
            return q;
        }));
    };

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleSave = async () => {
        console.log("handleSave START - Clicking Save");

        if (!title.trim()) {
            toast.error(t('surveys.form.error_title') || 'Please enter a survey title');
            return;
        }
        if (questions.length === 0) {
            toast.error(t('surveys.form.error_questions') || 'Please add at least one question');
            return;
        }

        if (!tenantId) {
            console.error("Tenant ID is missing!");
            toast.error('System Error: Tenant ID missing. Please reload.');
            return;
        }

        const toastId = toast.loading(id ? 'Updating Survey...' : 'Creating Survey...');

        try {
            const payload = {
                title,
                description,
                area,
                questions: questions,
                target_sample_size: 100, // Default to 100 for now
                status: 'Active',
                tenant_id: tenantId
            };

            console.log("Sending Payload to Supabase:", payload);

            let error;
            if (id) {
                const { error: updateError } = await supabase
                    .from('surveys')
                    .update(payload)
                    .eq('id', id)
                    .eq('tenant_id', tenantId);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('surveys')
                    .insert([payload]);
                error = insertError;
            }

            if (error) {
                console.error("Supabase Error Detail:", error);
                throw error;
            }

            toast.dismiss(toastId);
            toast.success(id ? 'Survey updated successfully!' : (t('surveys.create_success') || 'Survey created successfully!'));
            navigate('/dashboard/surveys');

        } catch (error: any) {
            console.error('CRITICAL Error saving survey:', error);
            toast.dismiss(toastId);
            toast.error(`Failed to save survey: ${error.message || 'Unknown error'}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up pb-20">
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => navigate('/dashboard/surveys')}
                    className="ns-btn-ghost border border-slate-200 px-2 py-2"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-700" />
                </button>
                <h1 className="text-2xl font-bold text-slate-900">
                    {id ? (t('surveys.edit_title') || 'Edit Survey') : t('surveys.create_new_title')}
                </h1>
            </div>

            <div className="ns-card p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('surveys.form.title_label')}</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="ns-input"
                        placeholder={t('surveys.form.title_placeholder')}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('surveys.form.description_label')}</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="ns-input"
                        rows={3}
                        placeholder={t('surveys.form.description_placeholder')}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('surveys.form.area_label')}</label>
                    <input
                        type="text"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="ns-input"
                        placeholder={t('surveys.form.area_placeholder')}
                    />
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">
                    {t('surveys.form.questions_count')} ({questions.length})
                </h2>

                {questions.map((q, index) => (
                    <div key={q.id} className="ns-card p-6 space-y-4 relative group">
                        <div className="flex items-start space-x-3">
                            <span className="bg-slate-100 text-slate-700 w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200/70 flex-shrink-0 text-sm font-bold">
                                {index + 1}
                            </span>
                            <div className="flex-1 space-y-4">
                                <input
                                    type="text"
                                    value={q.text}
                                    onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                                    className="ns-input font-medium"
                                    placeholder={t('surveys.form.question_placeholder')}
                                />

                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            checked={q.type === 'MCQ'}
                                            onChange={() => updateQuestion(q.id, 'type', 'MCQ')}
                                            className="text-brand-600 focus:ring-brand-500"
                                        />
                                        <span className="text-sm text-slate-700">{t('surveys.form.type_mcq')}</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            checked={q.type === 'YesNo'}
                                            onChange={() => updateQuestion(q.id, 'type', 'YesNo')}
                                            className="text-brand-600 focus:ring-brand-500"
                                        />
                                        <span className="text-sm text-slate-700">{t('surveys.form.type_yesno')}</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            checked={q.type === 'Rating'}
                                            onChange={() => updateQuestion(q.id, 'type', 'Rating')}
                                            className="text-brand-600 focus:ring-brand-500"
                                        />
                                        <span className="text-sm text-slate-700">{t('surveys.form.type_rating')}</span>
                                    </label>
                                </div>

                                {q.type === 'MCQ' && (
                                    <div className="space-y-2 pl-4 border-l-2 border-slate-200/70">
                                        {q.options?.map((opt, i) => (
                                            <div key={i} className="flex items-center space-x-2">
                                                <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => updateOption(q.id, i, e.target.value)}
                                                    className="ns-input py-1 text-sm"
                                                    placeholder={`${t('surveys.form.option_placeholder')} ${i + 1}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => removeQuestion(q.id)}
                                className="text-slate-400 hover:text-red-700 p-2 transition-colors self-start mt-1"
                                title={t('surveys.form.delete_question') || "Delete Question"}
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}

                <button
                    onClick={addQuestion}
                    className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-600 hover:border-brand-300 hover:text-brand-700 transition-colors flex items-center justify-center font-semibold"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    {t('surveys.form.add_question')}
                </button>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-end md:pl-64 z-10">
                <button
                    onClick={handleSave}
                    className="ns-btn-primary px-8 py-3"
                >
                    <Save className="w-5 h-5 mr-2" />
                    {id ? (t('surveys.form.update') || 'Update Survey') : (t('surveys.form.save_launch') || 'Save Request')}
                </button>
            </div>
        </div>
    );
};

export default CreateSurvey;
