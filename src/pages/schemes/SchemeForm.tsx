import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { ArrowLeft, Save } from 'lucide-react';

const SchemeForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        eligibility: '',
        benefits: '',
        documents: ''
    });

    useEffect(() => {
        if (id) {
            fetchScheme();
        }
    }, [id]);

    const fetchScheme = async () => {
        try {
            const { data, error } = await supabase
                .from('schemes')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    name: data.name,
                    description: data.description,
                    eligibility: data.eligibility,
                    benefits: data.benefits,
                    documents: data.documents
                });
            }
        } catch (error) {
            console.error('Error fetching scheme:', error);
            toast.error('Failed to load scheme details');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (id) {
                const { error } = await supabase
                    .from('schemes')
                    .update(formData)
                    .eq('id', id);
                if (error) throw error;
                toast.success('Scheme updated successfully!');
            } else {
                const { error } = await supabase
                    .from('schemes')
                    .insert([formData]);
                if (error) throw error;
                toast.success('Scheme added successfully!');
            }

            navigate('/schemes');
        } catch (err) {
            console.error('Error saving scheme:', err);
            toast.error('Failed to save scheme. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <button
                onClick={() => navigate('/schemes')}
                className="ns-btn-ghost px-0 py-0 text-slate-600 hover:text-brand-700"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Schemes
            </button>

            <div className="ns-card overflow-hidden">
                <div className="p-6 border-b border-slate-200/70 bg-slate-50">
                    <h1 className="text-xl font-bold text-slate-900">{id ? 'Edit Scheme' : 'Add new scheme'}</h1>
                    <p className="text-sm text-slate-500 mt-1">{id ? 'Update scheme details, eligibility, and benefits.' : 'Add eligibility, benefits and required documents.'}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Scheme name</label>
                        <input
                            required
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            className="ns-input"
                            placeholder="e.g. Pradhan Mantri Awas Yojana"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            required
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className="ns-input"
                            placeholder="Brief summary of the scheme..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Eligibility criteria</label>
                        <textarea
                            name="eligibility"
                            rows={3}
                            value={formData.eligibility}
                            onChange={handleChange}
                            className="ns-input"
                            placeholder="Who can apply? (e.g. Women aged 21-60, Income < 2.5L)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Benefits</label>
                        <textarea
                            name="benefits"
                            rows={3}
                            value={formData.benefits}
                            onChange={handleChange}
                            className="ns-input"
                            placeholder="What do beneficiaries get? (e.g. ₹1500 per month)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Documents required</label>
                        <textarea
                            name="documents"
                            rows={2}
                            value={formData.documents}
                            onChange={handleChange}
                            className="ns-input"
                            placeholder="e.g. Aadhar Card, Ration Card, Bank Passbook"
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="ns-btn-primary disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{loading ? 'Saving...' : (id ? 'Update Scheme' : 'Save Scheme')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SchemeForm;
