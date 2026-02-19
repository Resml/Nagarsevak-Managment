import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Save, X, ArrowLeft, Info, FileText, Upload, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { Link } from 'react-router-dom';
import Tesseract from 'tesseract.js';

interface LetterType {
    id: string;
    name: string;
    name_marathi?: string;
    description?: string;
    template_content?: string;
    is_active: boolean;
}

const LetterTypeManager = () => {
    const { t } = useLanguage();
    const [types, setTypes] = useState<LetterType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<LetterType | null>(null);
    const [ocrScanning, setOcrScanning] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<LetterType | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<Partial<LetterType>>({
        name: '',
        name_marathi: '',
        description: '',
        template_content: 'This is to certify that Mr./Ms. {{name}}...\n\n(Default Template)'
    });

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        try {
            const { data, error } = await supabase
                .from('letter_types')
                .select('*')
                .order('name');

            if (error) throw error;
            setTypes(data || []);
        } catch (error) {
            console.error('Error fetching letter types:', error);
            toast.error(t('letters.loading'));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (type?: LetterType) => {
        if (type) {
            setEditingType(type);
            setFormData({
                name: type.name,
                name_marathi: type.name_marathi || '',
                description: type.description || '',
                template_content: type.template_content || ''
            });
        } else {
            setEditingType(null);
            setFormData({
                name: '',
                name_marathi: '',
                description: '',
                template_content: 'This is to certify that Mr./Ms. {{name}}, residing at {{address}}, is a resident of Ward 12 to the best of my knowledge.\n\nThis letter is issued upon their request for the purpose of {{purpose}}.\n\nI wish them all the best for their future endeavors.'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!formData.name) {
                toast.error('Name is required');
                return;
            }

            const payload = {
                name: formData.name,
                name_marathi: formData.name_marathi,
                description: formData.description,
                template_content: formData.template_content
            };

            if (editingType) {
                const { error } = await supabase
                    .from('letter_types')
                    .update(payload)
                    .eq('id', editingType.id);
                if (error) throw error;
                toast.success(t('letters.save_changes'));
            } else {
                const { error } = await supabase
                    .from('letter_types')
                    .insert([payload]);
                if (error) throw error;
                toast.success(t('letters.save_changes'));
            }

            setIsModalOpen(false);
            fetchTypes();
        } catch (error) {
            console.error('Error saving letter type:', error);
            toast.error('Failed to save');
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            const { error } = await supabase
                .from('letter_types')
                .delete()
                .eq('id', deleteTarget.id);

            if (error) throw error;
            toast.success('Deleted successfully');
            fetchTypes();
            setDeleteTarget(null);
        } catch (error) {
            console.error('Error deleting letter type:', error);
            toast.error('Failed to delete');
        }
    };

    const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        setOcrScanning(true);
        toast.info(t('letters.ocr_scanning'));

        try {
            const result = await Tesseract.recognize(
                file,
                'eng', // Default to English for now, adding 'mar' heavily increases download size
                { logger: m => console.log(m) }
            );

            if (result && result.data && result.data.text) {
                setFormData(prev => ({
                    ...prev,
                    template_content: result.data.text
                }));
                toast.success(t('letters.ocr_success'));
            } else {
                toast.error(t('letters.ocr_failed'));
            }
        } catch (error) {
            console.error('OCR Error:', error);
            toast.error(t('letters.ocr_failed'));
        } finally {
            setOcrScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/dashboard/letters" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{t('letters.types_title')}</h1>
                        <p className="text-slate-500">{t('letters.types_subtitle')}</p>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="ns-btn-primary"
                >
                    <Plus className="w-4 h-4" />
                    <span>{t('letters.add_new_type')}</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">{t('letters.name_english')}</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">{t('letters.name_marathi')}</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">{t('letters.has_template')}</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 text-right">{t('letters.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">{t('letters.loading')}</td></tr>
                        ) : types.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">No letter types found.</td></tr>
                        ) : (
                            types.map((type) => (
                                <tr key={type.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">{type.name}</td>
                                    <td className="px-6 py-4 text-slate-600 font-hindi">{type.name_marathi || '-'}</td>
                                    <td className="px-6 py-4">
                                        {type.template_content ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                                <FileText className="w-3 h-3" /> {t('letters.yes')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                                                {t('letters.no')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(type)}
                                                className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(type)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingType ? t('letters.edit_type') : t('letters.add_new_type')}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('letters.name_english')}</label>
                                    <input
                                        type="text"
                                        required
                                        className="ns-input w-full"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Character Certificate"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('letters.name_marathi')}</label>
                                    <input
                                        type="text"
                                        className="ns-input w-full"
                                        value={formData.name_marathi}
                                        onChange={e => setFormData({ ...formData, name_marathi: e.target.value })}
                                        placeholder="e.g. चारित्र्य दाखला"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-slate-700">
                                        {t('letters.template_content')}
                                        <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{t('letters.pdf_body_text')}</span>
                                    </label>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleOCR}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={ocrScanning}
                                            className="text-xs flex items-center gap-1 bg-brand-50 text-brand-700 font-medium px-2 py-1 rounded hover:bg-brand-100 transition-colors"
                                        >
                                            {ocrScanning ? (
                                                <RefreshCw className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Upload className="w-3 h-3" />
                                            )}
                                            {ocrScanning ? t('letters.ocr_scanning') : t('letters.ocr_upload')}
                                        </button>
                                    </div>
                                </div>

                                <div className="relative">
                                    <textarea
                                        className="ns-input w-full font-mono text-sm h-64 p-4 leading-relaxed"
                                        value={formData.template_content}
                                        onChange={e => setFormData({ ...formData, template_content: e.target.value })}
                                        placeholder="Enter the body of the letter here..."
                                    />
                                    <div className="absolute top-2 right-2">
                                        <div className="group relative inline-block">
                                            <Info className="w-5 h-5 text-slate-400 cursor-help" />
                                            <div className="hidden group-hover:block absolute right-0 w-64 p-3 bg-slate-800 text-white text-xs rounded shadow-lg z-10">
                                                <p className="font-bold mb-1">{t('letters.placeholders_title')}:</p>
                                                <ul className="list-disc pl-4 space-y-1">
                                                    <li>{'{{name}}'} - Applicant Name</li>
                                                    <li>{'{{address}}'} - Applicant Address</li>
                                                    <li>{'{{purpose}}'} - Letter Type Name</li>
                                                    <li>{'{{date}}'} - Current Date</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    {t('letters.placeholders_hint')}
                                </p>
                            </div>
                        </form>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white font-medium transition-colors"
                            >
                                {t('letters.cancel')}
                            </button>
                            <button
                                onClick={handleSave}
                                className="ns-btn-primary"
                            >
                                <Save className="w-4 h-4" />
                                <span>{t('letters.save_changes')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden p-6 space-y-4 shadow-xl">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">{t('letters.delete_confirm_title')}</h3>
                            <p className="text-slate-500 mt-2 text-sm">
                                {t('letters.delete_confirm_msg')}
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                            >
                                {t('letters.cancel')}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                            >
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LetterTypeManager;
