import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
    ChevronLeft, Edit2, Trash2, Calendar, MapPin, 
    Building2, Hash, History, Plus, Loader2, 
    CheckCircle2, Clock, AlertCircle, ArrowRight, User, Save
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { TranslatedText } from '../../components/TranslatedText';

type WorkTracker = {
    id: string;
    title: string;
    subject: string;
    department: string;
    inward_number: string;
    outward_number: string;
    current_status: string;
    description: string;
    created_at: string;
    updated_at: string;
};

type MovementStage = {
    id: string;
    stage_name: string;
    location: string;
    status_description: string;
    created_at: string;
    updated_by: string;
};

const FileTrackerDetail = () => {
    const { t } = useLanguage();
    const { tenantId } = useTenant();
    const navigate = useNavigate();
    const { id } = useParams();

    const [file, setFile] = useState<WorkTracker | null>(null);
    const [history, setHistory] = useState<MovementStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [showStageModal, setShowStageModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newStage, setNewStage] = useState({
        stage_name: '',
        location: '',
        status_description: ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [fileRes, historyRes] = await Promise.all([
                supabase.from('work_trackers').select('*').eq('id', id).single(),
                supabase.from('work_tracker_history').select('*').eq('work_tracker_id', id).order('created_at', { ascending: false })
            ]);

            if (fileRes.error) throw fileRes.error;
            setFile(fileRes.data);
            setHistory(historyRes.data || []);
        } catch (err) {
            console.error('Error fetching file details:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleAddStage = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('work_tracker_history')
                .insert({
                    work_tracker_id: id,
                    stage_name: newStage.stage_name,
                    location: newStage.location,
                    status_description: newStage.status_description,
                    tenant_id: tenantId
                });

            if (error) throw error;

            // Update main file's updated_at
            await supabase
                .from('work_trackers')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', id);

            setShowStageModal(false);
            setNewStage({ stage_name: '', location: '', status_description: '' });
            fetchData();
        } catch (err) {
            console.error('Error adding stage:', err);
            alert('Failed to add movement record.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this tracked file?')) return;
        
        try {
            const { error } = await supabase
                .from('work_trackers')
                .delete()
                .eq('id', id);

            if (error) throw error;
            navigate('/dashboard/file-tracking');
        } catch (err) {
            console.error('Error deleting file:', err);
        }
    };

    if (loading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
    }

    if (!file) {
        return <div className="text-center py-20 text-slate-500">File not found.</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard/file-tracking')}
                        className="p-2 hover:bg-white rounded-xl transition-colors text-slate-500 border border-slate-200"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                            <TranslatedText text={file.title} />
                        </h1>
                        <div className="flex items-center gap-3 mt-1">
                             <span className={clsx(
                                "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                file.current_status === 'Approved' ? 'bg-green-50 text-green-700 border-green-100' : 
                                file.current_status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                'bg-slate-50 text-slate-700 border-slate-200'
                            )}>
                                {t(`file_tracking.status.${file.current_status.toLowerCase().replace(/ /g, '_')}`)}
                            </span>
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Updated {format(new Date(file.updated_at), 'MMM d, h:mm a')}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Link
                        to={`/dashboard/file-tracking/edit/${id}`}
                        className="flex-1 sm:flex-initial ns-btn-ghost bg-white border border-slate-200 flex items-center justify-center gap-2"
                    >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="flex-1 sm:flex-initial ns-btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-100 flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* File Details Side */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3">File Information</h3>
                        
                        <div className="space-y-4">
                            {file.subject && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">{t('file_tracking.subject')}</label>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed"><TranslatedText text={file.subject} /></p>
                                </div>
                            )}
                            
                            {file.department && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">{t('file_tracking.department')}</label>
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <Building2 className="w-4 h-4 text-brand-500" />
                                        <TranslatedText text={file.department} />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">{t('file_tracking.inward_no')}</label>
                                    <p className="text-sm font-mono font-bold text-slate-900">{file.inward_number || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">{t('file_tracking.outward_no')}</label>
                                    <p className="text-sm font-mono font-bold text-slate-900">{file.outward_number || 'N/A'}</p>
                                </div>
                            </div>

                            {file.description && (
                                <div className="space-y-1 pt-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">{t('file_tracking.form.description')}</label>
                                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic leading-relaxed">
                                        <TranslatedText text={file.description} />
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Timeline Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <History className="w-5 h-5 text-brand-600" />
                            {t('file_tracking.history')}
                        </h2>
                        <button
                            onClick={() => setShowStageModal(true)}
                            className="ns-btn-primary py-2 flex items-center gap-2 shadow-md shadow-brand-100"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{t('file_tracking.add_stage')}</span>
                        </button>
                    </div>

                    <div className="relative">
                        {/* Timeline Line */}
                        <div className="absolute left-[21px] top-4 bottom-4 w-0.5 bg-slate-200" />

                        <div className="space-y-8 relative">
                            {history.length > 0 ? history.map((stage, idx) => (
                                <div key={stage.id} className="flex gap-6 group">
                                    {/* Timeline Marker */}
                                    <div className="relative flex-shrink-0">
                                        <div className={clsx(
                                            "w-[44px] h-[44px] rounded-full border-4 border-slate-50 flex items-center justify-center z-10 transition-all group-hover:scale-110",
                                            idx === 0 ? "bg-brand-600 text-white shadow-lg shadow-brand-200" : "bg-white text-slate-400 border-slate-100"
                                        )}>
                                            {idx === 0 ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-5 h-5" />}
                                        </div>
                                    </div>

                                    {/* Timeline Card */}
                                    <div className={clsx(
                                        "flex-1 bg-white p-5 rounded-2xl border transition-all duration-300",
                                        idx === 0 ? "border-brand-200 shadow-xl shadow-brand-50/50 ring-1 ring-brand-50" : "border-slate-200 hover:border-slate-300"
                                    )}>
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                                            <h4 className="font-bold text-slate-900 text-base">
                                                <TranslatedText text={stage.stage_name} />
                                            </h4>
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded uppercase">
                                                {format(new Date(stage.created_at), 'MMM d, yyyy · h:mm a')}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-4 mb-3">
                                            {stage.location && (
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                    <TranslatedText text={stage.location} />
                                                </div>
                                            )}
                                        </div>

                                        {stage.status_description && (
                                            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                                                <TranslatedText text={stage.status_description} />
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center ml-12">
                                    <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">No movement history recorded yet.</p>
                                    <button onClick={() => setShowStageModal(true)} className="text-brand-600 font-bold text-sm mt-2 hover:underline">Add First Stage</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Stage Modal */}
            {showStageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <ArrowRight className="w-5 h-5 text-brand-600" />
                                {t('file_tracking.add_stage')}
                            </h3>
                        </div>
                        <form onSubmit={handleAddStage} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">{t('file_tracking.stage_name')} *</label>
                                <input
                                    required
                                    type="text"
                                    className="ns-input"
                                    placeholder="e.g., Municipal Commissioner Table"
                                    value={newStage.stage_name}
                                    onChange={(e) => setNewStage({ ...newStage, stage_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">{t('file_tracking.location')}</label>
                                <input
                                    type="text"
                                    className="ns-input"
                                    placeholder="e.g., Office No 402, 4th Floor"
                                    value={newStage.location}
                                    onChange={(e) => setNewStage({ ...newStage, location: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">{t('file_tracking.notes')}</label>
                                <textarea
                                    className="ns-input min-h-[80px]"
                                    placeholder="e.g., File signed and moved to Audit section"
                                    value={newStage.status_description}
                                    onChange={(e) => setNewStage({ ...newStage, status_description: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowStageModal(false)}
                                    className="flex-1 ns-btn-ghost py-3 rounded-xl border border-slate-200"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 ns-btn-primary py-3 rounded-xl shadow-lg shadow-brand-100 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    <span>{t('common.save')}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileTrackerDetail;
