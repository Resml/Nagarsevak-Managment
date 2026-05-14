import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save, Loader2, FileText, Building2, Hash, BookOpen } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';

const FileTrackerForm = () => {
    const { t } = useLanguage();
    const { tenantId } = useTenant();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEdit);

    const [formData, setFormData] = useState({
        title: '',
        subject: '',
        department: '',
        inward_number: '',
        outward_number: '',
        current_status: 'Pending',
        description: ''
    });

    useEffect(() => {
        if (isEdit) {
            const fetchFile = async () => {
                try {
                    const { data, error } = await supabase
                        .from('work_trackers')
                        .select('*')
                        .eq('id', id)
                        .single();

                    if (error) throw error;
                    if (data) {
                        setFormData({
                            title: data.title,
                            subject: data.subject || '',
                            department: data.department || '',
                            inward_number: data.inward_number || '',
                            outward_number: data.outward_number || '',
                            current_status: data.current_status,
                            description: data.description || ''
                        });
                    }
                } catch (err) {
                    console.error('Error fetching file:', err);
                } finally {
                    setInitialLoading(false);
                }
            };
            fetchFile();
        }
    }, [id, isEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEdit) {
                const { error } = await supabase
                    .from('work_trackers')
                    .update({
                        ...formData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('work_trackers')
                    .insert({
                        ...formData,
                        tenant_id: tenantId
                    });

                if (error) throw error;
            }
            navigate('/dashboard/file-tracking');
        } catch (err) {
            console.error('Error saving file:', err);
            alert('Failed to save file. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {isEdit ? t('common.edit') : t('file_tracking.add_file')}
                    </h1>
                    <p className="text-slate-500">
                        {t('file_tracking.form.title')}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 space-y-5">
                        {/* Title */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400" />
                                {t('file_tracking.form.file_name_label')} *
                            </label>
                            <input
                                required
                                type="text"
                                className="ns-input"
                                placeholder={t('file_tracking.form.file_name_placeholder')}
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        {/* Subject & Department */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-slate-400" />
                                    {t('file_tracking.subject')}
                                </label>
                                <input
                                    type="text"
                                    className="ns-input"
                                    placeholder={t('file_tracking.form.subject_placeholder')}
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-slate-400" />
                                    {t('file_tracking.department')}
                                </label>
                                <input
                                    type="text"
                                    className="ns-input"
                                    placeholder={t('file_tracking.form.department_placeholder')}
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Inward / Outward Nos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-slate-400" />
                                    {t('file_tracking.inward_no')}
                                </label>
                                <input
                                    type="text"
                                    className="ns-input font-mono"
                                    placeholder={t('file_tracking.form.inward_placeholder')}
                                    value={formData.inward_number}
                                    onChange={(e) => setFormData({ ...formData, inward_number: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-slate-400" />
                                    {t('file_tracking.outward_no')}
                                </label>
                                <input
                                    type="text"
                                    className="ns-input font-mono"
                                    placeholder={t('file_tracking.form.outward_placeholder')}
                                    value={formData.outward_number}
                                    onChange={(e) => setFormData({ ...formData, outward_number: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700">
                                {t('common.status')}
                            </label>
                            <select
                                className="ns-input"
                                value={formData.current_status}
                                onChange={(e) => setFormData({ ...formData, current_status: e.target.value })}
                            >
                                <option value="Pending">{t('file_tracking.status.pending')}</option>
                                <option value="In Progress">{t('file_tracking.status.in_progress')}</option>
                                <option value="Approved">{t('file_tracking.status.approved')}</option>
                                <option value="Completed">{t('file_tracking.status.completed')}</option>
                                <option value="Delayed">{t('file_tracking.status.delayed')}</option>
                                <option value="Rejected">{t('file_tracking.status.rejected')}</option>
                            </select>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700">
                                {t('file_tracking.form.description')}
                            </label>
                            <textarea
                                className="ns-input min-h-[120px]"
                                placeholder={t('file_tracking.form.description_placeholder') || "Additional details about the file..."}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="ns-btn-ghost px-6"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="ns-btn-primary px-8 flex items-center gap-2 shadow-lg shadow-brand-200"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            <span>{isEdit ? t('common.save_changes') : t('common.save')}</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default FileTrackerForm;
