import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { ArrowLeft, Save } from 'lucide-react';

const SchemeForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        eligibility: '',
        benefits: '',
        documents: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('schemes')
                .insert([formData]);

            if (error) throw error;
            navigate('/schemes');
        } catch (err) {
            console.error('Error saving scheme:', err);
            alert('Failed to save scheme. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <button
                onClick={() => navigate('/schemes')}
                className="flex items-center text-gray-600 hover:text-brand-600 font-medium transition"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Schemes
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-brand-50 p-6 border-b border-brand-100">
                    <h1 className="text-xl font-bold text-gray-900">Add New Government Scheme</h1>
                    <p className="text-sm text-brand-700 mt-1">Enter details about the new welfare scheme.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Scheme Name</label>
                        <input
                            required
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 py-2 px-3 border"
                            placeholder="e.g. Pradhan Mantri Awas Yojana"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            required
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 py-2 px-3 border"
                            placeholder="Brief summary of the scheme..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility Criteria</label>
                        <textarea
                            name="eligibility"
                            rows={3}
                            value={formData.eligibility}
                            onChange={handleChange}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 py-2 px-3 border"
                            placeholder="Who can apply? (e.g. Women aged 21-60, Income < 2.5L)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
                        <textarea
                            name="benefits"
                            rows={3}
                            value={formData.benefits}
                            onChange={handleChange}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 py-2 px-3 border"
                            placeholder="What do beneficiaries get? (e.g. ₹1500 per month)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Documents Required</label>
                        <textarea
                            name="documents"
                            rows={2}
                            value={formData.documents}
                            onChange={handleChange}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 py-2 px-3 border"
                            placeholder="e.g. Aadhar Card, Ration Card, Bank Passbook"
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center space-x-2 bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 transition shadow-sm font-medium disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{loading ? 'Saving...' : 'Save Scheme'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SchemeForm;
