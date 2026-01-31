import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { MockService } from '../../services/mockData';
import type { Question } from '../../types';

const CreateSurvey = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [area, setArea] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);

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

    const handleSave = () => {
        if (!title.trim()) {
            toast.error('Please enter a survey title');
            return;
        }
        if (questions.length === 0) {
            toast.error('Please add at least one question');
            return;
        }

        const totalVoters = MockService.getVoters().length;

        MockService.createSurvey({
            title,
            description,
            area,
            questions,
            targetSampleSize: Math.ceil(totalVoters * 0.01),
            status: 'Active'
        });

        navigate('/surveys');
    };

    return (
        <div className="space-y-6 animate-fade-in-up pb-20">
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => navigate('/surveys')}
                    className="ns-btn-ghost border border-slate-200 px-2 py-2"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-700" />
                </button>
                <h1 className="text-2xl font-bold text-slate-900">Create new survey</h1>
            </div>

            <div className="ns-card p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Survey title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="ns-input"
                        placeholder="e.g. Sanitation Feedback 2026"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="ns-input"
                        rows={3}
                        placeholder="Purpose of this survey..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Area (Optional)</label>
                    <input
                        type="text"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="ns-input"
                        placeholder="e.g. Ward 12, Main Street"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Questions ({questions.length})</h2>

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
                                    placeholder="Enter your question here..."
                                />

                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            checked={q.type === 'MCQ'}
                                            onChange={() => updateQuestion(q.id, 'type', 'MCQ')}
                                            className="text-brand-600 focus:ring-brand-500"
                                        />
                                        <span className="text-sm text-slate-700">Multiple Choice</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            checked={q.type === 'YesNo'}
                                            onChange={() => updateQuestion(q.id, 'type', 'YesNo')}
                                            className="text-brand-600 focus:ring-brand-500"
                                        />
                                        <span className="text-sm text-slate-700">Yes / No / Can't Say</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            checked={q.type === 'Rating'}
                                            onChange={() => updateQuestion(q.id, 'type', 'Rating')}
                                            className="text-brand-600 focus:ring-brand-500"
                                        />
                                        <span className="text-sm text-slate-700">Rating (1-5 Stars)</span>
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
                                                    placeholder={`Option ${i + 1}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => removeQuestion(q.id)}
                                className="text-slate-400 hover:text-red-700 p-2 transition-colors self-start mt-1"
                                title="Delete Question"
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
                    Add Question
                </button>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-end md:pl-64 z-10">
                <button
                    onClick={handleSave}
                    className="ns-btn-primary px-8 py-3"
                >
                    <Save className="w-5 h-5 mr-2" />
                    Save & Launch Survey
                </button>
            </div>
        </div >
    );
};

export default CreateSurvey;
