import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { toast } from 'sonner';
import { Search, Filter, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { format } from 'date-fns';
import { TranslatedText } from '../../components/TranslatedText';

interface SchemeApplication {
    id: number;
    applicant_name: string;
    scheme_id: number;
    scheme_name?: string; // Joined field
    mobile: string;
    address: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    created_at: string;
    notes?: string;
}

const SchemeBeneficiaryList = () => {
    const { t } = useLanguage();
    const [applications, setApplications] = useState<SchemeApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const { data, error } = await supabase
                .from('scheme_applications')
                .select(`
                    *,
                    schemes (name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formatted: SchemeApplication[] = (data || []).map((app: any) => ({
                ...app,
                scheme_name: app.schemes?.name
            }));
            setApplications(formatted);
        } catch (err) {
            console.error('Error fetching applications:', err);
            toast.error('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: number, newStatus: 'Approved' | 'Rejected') => {
        try {
            const { error } = await supabase
                .from('scheme_applications')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            toast.success(`Application ${newStatus}`);

            // Optimistic update
            setApplications(prev => prev.map(app =>
                app.id === id ? { ...app, status: newStatus } : app
            ));
        } catch (err) {
            console.error('Error updating status:', err);
            toast.error('Failed to update status');
        }
    };

    const deleteApplication = async (id: number) => {
        if (!confirm(t('schemes.beneficiary_list.delete_confirm'))) return;
        try {
            const { error } = await supabase
                .from('scheme_applications')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Application removed');
            setApplications(prev => prev.filter(app => app.id !== id));
        } catch (err) {
            console.error('Error deleting application:', err);
            toast.error('Failed to delete');
        }
    };

    const filteredApplications = applications.filter(app => {
        const matchesStatus = filterStatus === 'All' || app.status === filterStatus;
        const matchesSearch = !searchQuery ||
            app.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (app.scheme_name && app.scheme_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (app.mobile && app.mobile.includes(searchQuery));

        return matchesStatus && matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder={t('schemes.beneficiary_list.search_placeholder')}
                        className="ns-input pl-10 w-full"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                                ? 'bg-slate-800 text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {status === 'All' ? t('schemes.beneficiary_list.all') :
                                status === 'Pending' ? t('schemes.beneficiary_list.pending') :
                                    status === 'Approved' ? t('schemes.beneficiary_list.approved') :
                                        t('schemes.beneficiary_list.rejected')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">{t('schemes.beneficiary_list.applicant_col')}</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">{t('schemes.beneficiary_list.scheme_col')}</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">{t('schemes.beneficiary_list.info_col')}</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">{t('schemes.beneficiary_list.status_col')}</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 text-right">{t('schemes.beneficiary_list.actions_col')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500">{t('schemes.beneficiary_list.loading')}</td></tr>
                        ) : filteredApplications.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500">{t('schemes.beneficiary_list.no_data')}</td></tr>
                        ) : (
                            filteredApplications.map((app) => (
                                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-900">{app.applicant_name}</p>
                                        <p className="text-xs text-slate-500">{format(new Date(app.created_at), 'MMM d, yyyy')}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-slate-700 font-medium">
                                            <TranslatedText text={app.scheme_name || t('schemes.beneficiary_list.legacy_scheme')} />
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        <div className="space-y-0.5">
                                            {app.mobile && <p>📞 {app.mobile}</p>}
                                            {app.address && <p className="truncate max-w-[200px]" title={app.address}>📍 {app.address}</p>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                            {app.status === 'Pending' ? t('schemes.beneficiary_list.pending') :
                                                app.status === 'Approved' ? t('schemes.beneficiary_list.approved') :
                                                    t('schemes.beneficiary_list.rejected')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {app.status === 'Pending' && (
                                                <>
                                                    <button
                                                        onClick={() => updateStatus(app.id, 'Approved')}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                        title={t('schemes.beneficiary_list.approve_btn')}
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(app.id, 'Rejected')}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title={t('schemes.beneficiary_list.reject_btn')}
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => deleteApplication(app.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title={t('schemes.beneficiary_list.delete_btn')}
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
        </div>
    );
};

export default SchemeBeneficiaryList;
