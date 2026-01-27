import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { ArrowLeft, Trash2, Plus, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LetterType {
    id: string;
    name: string;
}

const LetterTypeManager = () => {
    const navigate = useNavigate();
    const [types, setTypes] = useState<LetterType[]>([]);
    const [newType, setNewType] = useState('');
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        const { data, error } = await supabase
            .from('letter_types')
            .select('*')
            .order('name');

        if (data) setTypes(data);
        setLoading(false);
    };

    const addType = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        if (!newType.trim()) return;

        const { error } = await supabase
            .from('letter_types')
            .insert([{ name: newType }]);

        if (error) {
            console.error('Error adding type:', error);
            setErrorMsg('Failed to add type: ' + error.message);
        } else {
            setNewType('');
            fetchTypes();
        }
    };

    const deleteType = async (id: string) => {
        if (!confirm('Are you sure you want to delete this letter type?')) return;
        setErrorMsg('');

        const { error } = await supabase
            .from('letter_types')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting type:', error);
            setErrorMsg('Failed to delete type: ' + error.message);
        } else {
            fetchTypes();
        }
    };

    const restoreDefaults = async () => {
        setLoading(true);
        const defaults = [
            { name: 'Residential Certificate' },
            { name: 'Character Certificate' },
            { name: 'No Objection Certificate (NOC)' },
            { name: 'Income Certificate Recommendation' },
            { name: 'Other' }
        ];

        const { error } = await supabase
            .from('letter_types')
            .insert(defaults);

        if (error) {
            console.error('Error seeding types:', error);
            setErrorMsg('Failed to restore defaults: ' + error.message);
        } else {
            fetchTypes();
        }
        setLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <button
                onClick={() => navigate('/letters')}
                className="flex items-center text-gray-600 hover:text-brand-600 font-medium transition"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-brand-50 p-6 border-b border-brand-100">
                    <h1 className="text-xl font-bold text-gray-900">Manage Letter Types</h1>
                    <p className="text-sm text-brand-700 mt-1">Add or remove types of letters available for request.</p>
                </div>

                {errorMsg && (
                    <div className="bg-red-50 text-red-600 px-6 py-3 text-sm border-b border-red-100">
                        {errorMsg}
                    </div>
                )}

                <div className="p-6 space-y-6">
                    {/* Add Form */}
                    <form onSubmit={addType} className="flex gap-4">
                        <input
                            type="text"
                            value={newType}
                            onChange={(e) => setNewType(e.target.value)}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 py-2 px-3 border"
                            placeholder="Enter new letter type name..."
                        />
                        <button
                            type="submit"
                            className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add
                        </button>
                    </form>

                    {/* List */}
                    <div className="space-y-2">
                        {loading ? <p>Loading...</p> : types.map(type => (
                            <div key={type.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                                <span className="font-medium text-gray-800">{type.name}</span>
                                <button
                                    onClick={() => deleteType(type.id)}
                                    className="text-gray-400 hover:text-red-600 transition p-2"
                                    title="Delete Type"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {types.length === 0 && !loading && (
                            <div className="text-center py-8 space-y-4">
                                <p className="text-gray-500">No letter types found.</p>
                                <button
                                    onClick={restoreDefaults}
                                    className="text-brand-600 hover:text-brand-700 font-medium text-sm underline"
                                >
                                    Restore Default Types
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LetterTypeManager;
