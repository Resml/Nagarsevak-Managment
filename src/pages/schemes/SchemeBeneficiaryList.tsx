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
    benefit?: string;
    rejection_reason?: string;
}

const SchemeBeneficiaryList = () => {
    const { t } = useLanguage();
    const [applications, setApplications] = useState<SchemeApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<SchemeApplication | null>(null);
    const [editTarget, setEditTarget] = useState<SchemeApplication | null>(null);

    // Edit Modal State
    const [editStatus, setEditStatus] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
    const [editBenefit, setEditBenefit] = useState('');
    const [editRejectionReason, setEditRejectionReason] = useState('');

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

    const handleEditSave = async () => {
        if (!editTarget) return;

        try {
            const { error } = await supabase
                .from('scheme_applications')
                .update({
                    status: editStatus,
                    benefit: editBenefit,
                    rejection_reason: editRejectionReason
                })
                .eq('id', editTarget.id);

            if (error) throw error;
            toast.success(t('schemes.beneficiary_list.update_success') || 'Application updated successfully');

            // Optimistic update
            setApplications(prev => prev.map(app =>
                app.id === editTarget.id ? {
                    ...app,
                    status: editStatus,
                    benefit: editBenefit,
                    rejection_reason: editRejectionReason
                } : app
            ));

            setEditTarget(null);
        } catch (err) {
            console.error('Error updating application:', err);
            toast.error(t('schemes.beneficiary_list.update_error') || 'Failed to update application');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const { error } = await supabase
                .from('scheme_applications')
                .delete()
                .eq('id', deleteTarget.id);

            if (error) throw error;
            toast.success(t('schemes.beneficiary_list.delete_success') || 'Application removed');
            setApplications(prev => prev.filter(app => app.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (err) {
            console.error('Error deleting application:', err);
            toast.error(t('schemes.beneficiary_list.delete_error') || 'Failed to delete');
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
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">{t('schemes.beneficiary_list.info_col')}</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">{t('schemes.beneficiary_list.scheme_col')}</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">{t('schemes.beneficiary_list.benefit_col') || 'BENEFIT'}</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">{t('schemes.beneficiary_list.rejection_reason') || 'REJECTION REASON'}</th>
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
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        <div className="space-y-0.5">
                                            {app.mobile && <p>📞 {app.mobile}</p>}
                                            {app.address && <p className="truncate max-w-[200px]" title={app.address}>📍 {app.address}</p>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap">
                                            <TranslatedText text={app.scheme_name || t('schemes.beneficiary_list.legacy_scheme')} />
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                            {app.benefit || '-'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-red-600 whitespace-pre-wrap">
                                            {app.status === 'Rejected' ? (app.rejection_reason || '-') : '-'}
                                        </p>
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
                                                onClick={() => {
                                                    setEditTarget(app);
                                                    setEditStatus(app.status);
                                                    setEditBenefit(app.benefit || '');
                                                    setEditRejectionReason(app.rejection_reason || '');
                                                }}
                                                className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                                                title={t('common.edit') || 'Edit'}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></svg>
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(app)}
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

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-sm overflow-hidden p-6 space-y-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">{t('schemes.beneficiary_list.delete_title') || 'Delete Application?'}</h3>
                            <p className="text-slate-500 mt-2 text-sm">
                                {t('schemes.beneficiary_list.delete_confirm_msg') || 'Are you sure you want to delete this application? This action cannot be undone.'}
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                            >
                                {t('common.cancel') || 'Cancel'}
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                            >
                                {t('schemes.beneficiary_list.delete_btn') || 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editTarget && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="ns-card w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-white">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{t('common.edit') || 'Edit Application'}</h3>
                                <p className="text-sm text-brand-600 font-medium truncate max-w-[300px]">{editTarget.applicant_name}</p>
                            </div>
                            <button onClick={() => setEditTarget(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-slate-50 p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('schemes.beneficiary_list.status_col') || 'Status'}</label>
                                <select
                                    value={editStatus}
                                    onChange={e => setEditStatus(e.target.value as any)}
                                    className="ns-input"
                                >
                                    <option value="Pending">{t('schemes.beneficiary_list.pending') || 'Pending'}</option>
                                    <option value="Approved">{t('schemes.beneficiary_list.approved') || 'Approved'}</option>
                                    <option value="Rejected">{t('schemes.beneficiary_list.rejected') || 'Rejected'}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('schemes.beneficiary_list.benefit_col') || 'Benefit'}</label>
                                <textarea
                                    value={editBenefit}
                                    onChange={e => setEditBenefit(e.target.value)}
                                    className="ns-input min-h-[80px]"
                                    placeholder={t('schemes.beneficiary_list.benefit_placeholder') || 'Enter benefit details...'}
                                />
                            </div>

                            {editStatus === 'Rejected' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('schemes.beneficiary_list.rejection_reason') || 'Rejection Reason'}</label>
                                    <textarea
                                        value={editRejectionReason}
                                        onChange={e => setEditRejectionReason(e.target.value)}
                                        className="ns-input min-h-[80px]"
                                        placeholder={t('schemes.beneficiary_list.rejection_reason_placeholder') || 'Enter rejection reason...'}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-slate-200 bg-white flex justify-end gap-3 rounded-b-xl">
                            <button
                                type="button"
                                onClick={() => setEditTarget(null)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-50 font-medium rounded-lg"
                            >
                                {t('common.cancel') || 'Cancel'}
                            </button>
                            <button
                                type="button"
                                onClick={handleEditSave}
                                className="ns-btn-primary px-6"
                            >
                                {t('common.save_changes') || 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchemeBeneficiaryList;
