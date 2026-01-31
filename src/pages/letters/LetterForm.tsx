import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { ArrowLeft, Save } from 'lucide-react';

const LetterForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [types, setTypes] = useState<{ name: string }[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        type: '', // Start empty, fill on load
        mobile: '',
        address: '',
        area: '',
        purpose: ''
    });

    useEffect(() => {
        const fetchTypes = async () => {
            const { data } = await supabase.from('letter_types').select('name').order('name');
            if (data && data.length > 0) {
                setTypes(data);
                setFormData(prev => ({ ...prev, type: data[0].name }));
            } else {
                // Fallback defaults if DB empty
                const defaults = [
                    { name: 'Residential Certificate' },
                    { name: 'Character Certificate' },
                    { name: 'No Objection Certificate (NOC)' }
                ];
                setTypes(defaults);
                setFormData(prev => ({ ...prev, type: defaults[0].name }));
            }
        };
        fetchTypes();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('letter_requests')
                .insert([{
                    user_id: formData.mobile || 'Manual Entry', // Fallback if no mobile, or use specific format
                    type: formData.type,
                    area: formData.area,
                    details: {
                        name: formData.name,
                        text: formData.address,
                        purpose: formData.purpose,
                        mobile: formData.mobile
                    },
                    status: 'Pending'
                }]);

            if (error) throw error;
            toast.success('Letter request created successfully!');
            navigate('/letters');
        } catch (err) {
            console.error('Error saving letter request:', err);
            toast.error('Failed to save request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <button
                onClick={() => navigate('/letters')}
                className="ns-btn-ghost px-0 py-0 text-slate-600 hover:text-brand-700"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </button>

            <div className="ns-card overflow-hidden">
                <div className="p-6 border-b border-slate-200/70 bg-slate-50">
                    <h1 className="text-xl font-bold text-slate-900">New letter request</h1>
                    <p className="text-sm text-slate-500 mt-1">Create a request for a resident.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Applicant name</label>
                            <input
                                required
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                className="ns-input"
                                placeholder="Full Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mobile number</label>
                            <input
                                required
                                name="mobile"
                                type="tel"
                                value={formData.mobile}
                                onChange={handleChange}
                                className="ns-input"
                                placeholder="+91 98765 43210"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Letter type</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="ns-input"
                        >
                            {types.map(t => (
                                <option key={t.name} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Area / colony</label>
                        <input
                            required
                            name="area"
                            type="text"
                            value={formData.area}
                            onChange={handleChange}
                            className="ns-input"
                            placeholder="e.g. Ganesh Nagar, Lane 3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address / details</label>
                        <textarea
                            required
                            name="address"
                            rows={3}
                            value={formData.address}
                            onChange={handleChange}
                            className="ns-input"
                            placeholder="Current residential address or specific details..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Purpose (optional)</label>
                        <input
                            name="purpose"
                            type="text"
                            value={formData.purpose}
                            onChange={handleChange}
                            className="ns-input"
                            placeholder="e.g. For School Admission, Job Application"
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="ns-btn-primary disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{loading ? 'Saving...' : 'Create Request'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LetterForm;
