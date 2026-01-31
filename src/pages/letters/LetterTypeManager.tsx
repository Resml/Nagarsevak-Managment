import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { ArrowLeft, Trash2, Plus, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);

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

        const typeName = newType;

        const promise = new Promise(async (resolve, reject) => {
            const { error } = await supabase
                .from('letter_types')
                .insert([{ name: typeName }]);

            if (error) {
                reject(error);
            } else {
                resolve(true);
            }
        });

        toast.promise(promise, {
            loading: 'Adding letter type...',
            success: () => {
                setNewType('');
                fetchTypes();
                return `${typeName} added successfully!`;
            },
            error: (err) => {
                console.error('Error adding type:', err);
                setErrorMsg('Failed to add type: ' + err.message);
                return 'Failed to add letter type';
            },
        });
    };

    const handleDeleteClick = (id: string, name: string) => {
        setDeleteTarget({ id, name });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setErrorMsg('');

        const typeName = deleteTarget.name;
        const typeId = deleteTarget.id;

        const promise = new Promise(async (resolve, reject) => {
            const { error } = await supabase
                .from('letter_types')
                .delete()
                .eq('id', typeId);

            if (error) {
                reject(error);
            } else {
                resolve(true);
            }
        });

        toast.promise(promise, {
            loading: 'Deleting letter type...',
            success: () => {
                fetchTypes();
                return `${typeName} deleted successfully!`;
            },
            error: (err) => {
                console.error('Error deleting type:', err);
                setErrorMsg('Failed to delete type: ' + err.message);
                return 'Failed to delete letter type';
            },
        });
        setDeleteTarget(null);
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
                className="ns-btn-ghost px-0 py-0 text-slate-600 hover:text-brand-700"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </button>

            <div className="ns-card overflow-hidden">
                <div className="p-6 border-b border-slate-200/70 bg-slate-50">
                    <h1 className="text-xl font-bold text-slate-900">Manage letter types</h1>
                    <p className="text-sm text-slate-500 mt-1">Add or remove types available for request.</p>
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
                            className="ns-input flex-1"
                            placeholder="Enter new letter type name..."
                        />
                        <button
                            type="submit"
                            className="ns-btn-primary"
                        >
                            <Plus className="w-4 h-4" /> Add
                        </button>
                    </form>

                    {/* List */}
                    <div className="space-y-2">
                        {loading ? <p>Loading...</p> : types.map(type => (
                            <div key={type.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200/70 group">
                                <span className="font-semibold text-slate-800">{type.name}</span>
                                <button
                                    onClick={() => handleDeleteClick(type.id, type.name)}
                                    className="ns-btn-ghost border border-slate-200 px-2 py-2 text-red-700"
                                    title="Delete Type"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {types.length === 0 && !loading && (
                            <div className="text-center py-8 space-y-4">
                                <p className="text-slate-500">No letter types found.</p>
                                <button
                                    onClick={restoreDefaults}
                                    className="text-brand-700 hover:underline font-semibold text-sm"
                                >
                                    Restore Default Types
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {
                deleteTarget && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="ns-card w-full max-w-sm overflow-hidden p-6 space-y-4">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Delete Letter Type?</h3>
                                <p className="text-slate-500 mt-2 text-sm">
                                    Are you sure you want to delete <span className="font-semibold text-slate-900">{deleteTarget.name}</span>? This action cannot be undone.
                                </p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default LetterTypeManager;
