import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Calendar, MapPin, Search, History, ChevronRight, Building2, FileText, ArrowRight } from 'lucide-react';
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

const FileTrackerDashboard = () => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();
    const navigate = useNavigate();
    const [files, setFiles] = useState<WorkTracker[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('All');

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('work_trackers')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setFiles(data || []);
        } catch (err) {
            console.error('Error fetching work trackers:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();

        const subscription = supabase
            .channel('work_trackers_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'work_trackers', filter: `tenant_id=eq.${tenantId}` }, () => {
                fetchFiles();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [tenantId]);

    const filteredFiles = files.filter(f => {
        const matchesSearch = 
            f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (f.subject && f.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (f.inward_number && f.inward_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (f.outward_number && f.outward_number.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = filterStatus === 'All' || f.current_status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            case 'Approved': return 'bg-green-50 text-green-700 border-green-100';
            case 'Rejected': return 'bg-red-50 text-red-700 border-red-100';
            case 'Completed': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Delayed': return 'bg-orange-50 text-orange-700 border-orange-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-64 bg-slate-200 rounded" />
                    <div className="h-4 w-96 bg-slate-200 rounded" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-white rounded-xl border border-slate-200" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {t('file_tracking.title')}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {t('file_tracking.subtitle')}
                    </p>
                </div>
                <Link
                    to="/dashboard/file-tracking/new"
                    className="ns-btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    <span>{t('file_tracking.add_file')}</span>
                </Link>
            </div>

            {/* Stats / Quick Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('common.all')}</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1">{files.length}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('complaints.filters.pending')}</div>
                    <div className="text-2xl font-bold text-yellow-600 mt-1">{files.filter(f => f.current_status === 'Pending').length}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('complaints.filters.resolved')}</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">{files.filter(f => f.current_status === 'Completed' || f.current_status === 'Approved').length}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('file_tracking.table_to_table')}</div>
                    <div className="text-2xl font-bold text-brand-600 mt-1 flex items-center gap-1">
                        <History className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={t('file_tracking.search_placeholder')}
                        className="ns-input pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                    {['All', 'Pending', 'In Progress', 'Approved', 'Completed', 'Delayed', 'Rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={clsx(
                                "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-all",
                                filterStatus === status
                                    ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-100"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            )}
                        >
                            {t(`file_tracking.status.${status.toLowerCase().replace(/ /g, '_')}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* File List */}
            {filteredFiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFiles.map((file) => (
                        <div
                            key={file.id}
                            onClick={() => navigate(`/dashboard/file-tracking/${file.id}`)}
                            className="group bg-white rounded-2xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-50/50 transition-all cursor-pointer flex flex-col relative overflow-hidden"
                        >
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-slate-50 rounded-full group-hover:bg-brand-50 transition-colors duration-300" />
                            
                            <div className="relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={clsx(
                                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                        getStatusColor(file.current_status)
                                    )}>
                                        {t(`file_tracking.status.${file.current_status.toLowerCase().replace(/ /g, '_')}`)}
                                    </div>
                                    <div className="text-[10px] font-medium text-slate-400">
                                        ID: {file.id.slice(0, 8)}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-700 transition-colors mb-2 line-clamp-1">
                                    <TranslatedText text={file.title} />
                                </h3>

                                <div className="space-y-2.5 mb-6">
                                    {file.department && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Building2 className="w-4 h-4 text-slate-400" />
                                            <span className="truncate"><TranslatedText text={file.department} /></span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        {file.inward_number && (
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">{t('file_tracking.inward_no')}</span>
                                                <span className="text-sm font-mono font-medium text-slate-700">{file.inward_number}</span>
                                            </div>
                                        )}
                                        {file.outward_number && (
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">{t('file_tracking.outward_no')}</span>
                                                <span className="text-sm font-mono font-medium text-slate-700">{file.outward_number}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{format(new Date(file.updated_at), 'MMM d, yyyy')}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-brand-600 font-bold text-xs group-hover:gap-2 transition-all">
                                        <span>View Detail</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{t('file_tracking.no_files')}</h3>
                    <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                        {t('file_tracking.empty_state_desc')}
                    </p>
                    <Link
                        to="/dashboard/file-tracking/new"
                        className="ns-btn-primary inline-flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>{t('file_tracking.add_file')}</span>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default FileTrackerDashboard;
