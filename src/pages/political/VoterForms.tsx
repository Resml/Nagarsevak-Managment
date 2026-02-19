import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import type { VoterApplication, Voter } from '../../types';
import { toast } from 'sonner';
import {
    UserPlus,
    UserMinus,
    UserCheck,
    ExternalLink,
    FileText,
    CheckCircle2,
    ClipboardList,
    Search,
    Plus,
    X,
    Save,
    History,
    Calendar,
    User,
    Pencil,
    Trash2
} from 'lucide-react';

const VoterForms: React.FC = () => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();
    const { user } = useAuth();

    // State
    const [activeTab, setActiveTab] = useState<'forms' | 'applications'>('forms');
    const [showLogModal, setShowLogModal] = useState(false);
    const [applications, setApplications] = useState<VoterApplication[]>([]);
    const [loadingApps, setLoadingApps] = useState(true);
    const [voterSearch, setVoterSearch] = useState('');
    const [voterSuggestions, setVoterSuggestions] = useState<Voter[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<VoterApplication | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Modal Specific Search State
    const [isSearchMode, setIsSearchMode] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        voterId: '',
        applicantName: '',
        applicantMobile: '',
        formType: 'Form 6',
        status: 'Submitted',
        notes: ''
    });

    const formTypes = ['Form 6', 'Form 7', 'Form 8', 'Search'];
    const statusOptions = ['Submitted', 'Pending', 'Approved', 'Rejected'];

    // Define color mappings to ensure Tailwind picks up classes
    const colorClasses: Record<string, {
        bg: string;
        border: string;
        iconBg: string;
        iconText: string;
        buttonBg: string;
        buttonHover: string;
    }> = {
        orange: {
            bg: 'bg-orange-50',
            border: 'border-orange-100',
            iconBg: 'border-orange-200',
            iconText: 'text-orange-600',
            buttonBg: 'bg-orange-600',
            buttonHover: 'hover:bg-orange-700'
        },
        blue: {
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            iconBg: 'border-blue-200',
            iconText: 'text-blue-600',
            buttonBg: 'bg-blue-600',
            buttonHover: 'hover:bg-blue-700'
        },
        red: {
            bg: 'bg-red-50',
            border: 'border-red-100',
            iconBg: 'border-red-200',
            iconText: 'text-red-600',
            buttonBg: 'bg-red-600',
            buttonHover: 'hover:bg-red-700'
        },
        green: {
            bg: 'bg-green-50',
            border: 'border-green-100',
            iconBg: 'border-green-200',
            iconText: 'text-green-600',
            buttonBg: 'bg-green-600',
            buttonHover: 'hover:bg-green-700'
        }
    };

    const forms = [
        {
            id: 'search',
            icon: Search,
            color: 'orange',
            title: t('voter_forms.search_roll.title'),
            description: t('voter_forms.search_roll.desc'),
            docs: t('voter_forms.search_roll.docs'),
            link: 'https://electoralsearch.eci.gov.in',
            requirements: [
                t('voter_forms.search_option_details'),
                t('voter_forms.search_option_epic'),
                t('voter_forms.search_option_mobile')
            ]
        },
        {
            id: 'form6',
            icon: UserPlus,
            color: 'blue',
            title: t('voter_forms.form_6.title'),
            description: t('voter_forms.form_6.desc'),
            docs: t('voter_forms.form_6.docs'),
            link: 'https://voters.eci.gov.in/form6',
            requirements: [
                t('voter_forms.photo_req'),
                t('voter_forms.id_proof'),
                t('voter_forms.address_proof'),
                t('voter_forms.dob_proof')
            ]
        },
        {
            id: 'form7',
            icon: UserMinus,
            color: 'red',
            title: t('voter_forms.form_7.title'),
            description: t('voter_forms.form_7.desc'),
            docs: t('voter_forms.form_7.docs'),
            link: 'https://voters.eci.gov.in/form7',
            requirements: [
                t('voter_forms.epic_req'),
                t('voter_forms.deletion_reason')
            ]
        },
        {
            id: 'form8',
            icon: UserCheck,
            color: 'green',
            title: t('voter_forms.form_8.title'),
            description: t('voter_forms.form_8.desc'),
            docs: t('voter_forms.form_8.docs'),
            link: 'https://voters.eci.gov.in/form8',
            requirements: [
                t('voter_forms.epic_req'),
                t('voter_forms.id_proof'),
                t('voter_forms.address_proof'),
                t('voter_forms.fir_req')
            ]
        }
    ];

    // Fetch Applications
    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const { data, error } = await supabase
                    .from('voter_applications')
                    .select('*')
                    .eq('tenant_id', tenantId)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                setApplications(data as VoterApplication[] || []);
            } catch (err) {
                console.error('Error fetching applications:', err);
                toast.error('Failed to load applications');
            } finally {
                setLoadingApps(false);
            }
        };

        if (tenantId) {
            fetchApplications();
        }
    }, [tenantId]);

    // Search Voters
    useEffect(() => {
        const searchVoters = async () => {
            if (voterSearch.length < 2) {
                setVoterSuggestions([]);
                return;
            }

            try {
                const { data } = await supabase
                    .from('voters')
                    .select('*')
                    .or(`name_english.ilike.%${voterSearch}%,name_marathi.ilike.%${voterSearch}%,mobile.ilike.%${voterSearch}%`)
                    .eq('tenant_id', tenantId) // Secured
                    .limit(5);

                setVoterSuggestions(data || []);
                setShowSuggestions(true);
            } catch (err) {
                console.error('Error searching voters:', err);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(searchVoters, 300);
        return () => clearTimeout(timeoutId);
    }, [voterSearch, tenantId]);

    const handleVoterSelect = (voter: Voter) => {
        // Same logic as SchemeApplicationModal
        const name = language === 'mr' ? (voter.name_marathi || voter.name_english || voter.name || '') : (voter.name_english || voter.name || '');
        setFormData(prev => ({
            ...prev,
            voterId: voter.id,
            applicantName: name,
            applicantMobile: voter.mobile || ''
        }));
        setVoterSearch('');
        setShowSuggestions(false);
        setIsSearchMode(false);
        toast.success('Voter linked successfully');
    };

    const handleEdit = (app: VoterApplication) => {
        setEditingId(app.id);
        setFormData({
            voterId: app.voter_id ? app.voter_id.toString() : '',
            applicantName: app.applicant_name,
            applicantMobile: app.applicant_mobile || '',
            formType: app.form_type,
            status: app.status,
            notes: app.notes || ''
        });
        setVoterSearch(app.applicant_name);
        setShowLogModal(true);
    };

    const handleDeleteClick = (app: VoterApplication) => {
        setDeleteTarget(app);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            const { error } = await supabase
                .from('voter_applications')
                .delete()
                .eq('id', deleteTarget.id);

            if (error) throw error;

            setApplications(prev => prev.filter(app => app.id !== deleteTarget.id));
            toast.success('Application deleted successfully');
            setDeleteTarget(null);
        } catch (err) {
            console.error('Error deleting application:', err);
            toast.error('Failed to delete application');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!tenantId) {
            toast.error('System Error: Tenant ID missing');
            return;
        }

        setIsSubmitting(true);

        try {
            const applicationData = {
                tenant_id: tenantId,
                voter_id: formData.voterId ? parseInt(formData.voterId) : null,
                applicant_name: formData.applicantName,
                applicant_mobile: formData.applicantMobile,
                form_type: formData.formType,
                status: formData.status,
                notes: formData.notes,
                created_by: user?.id
            };

            if (editingId) {
                // Update
                const { data, error } = await supabase
                    .from('voter_applications')
                    .update(applicationData)
                    .eq('id', editingId)
                    .select()
                    .single();

                if (error) throw error;

                setApplications(prev => prev.map(app => app.id === editingId ? (data as VoterApplication) : app));
                toast.success('Application updated successfully');
            } else {
                // Insert
                const { data, error } = await supabase
                    .from('voter_applications')
                    .insert([applicationData])
                    .select()
                    .single();

                if (error) throw error;

                setApplications(prev => [data as VoterApplication, ...prev]);
                toast.success('Application logged successfully');
            }

            closeModal();
        } catch (err) {
            console.error('Error saving application:', err);
            toast.error('Failed to save application');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setShowLogModal(false);
        setEditingId(null);
        setFormData({
            voterId: '',
            applicantName: '',
            applicantMobile: '',
            formType: 'Form 6',
            status: 'Submitted',
            notes: ''
        });
        setVoterSearch('');
        setIsSearchMode(false);
        setIsSearching(false);
    };

    const getFormTypeLabel = (type: string) => {
        const key = `voter_forms.form_type_${type.toLowerCase().replace(' ', '')}`;
        return t(key) || type;
    };

    const getStatusLabel = (status: string) => {
        const key = `voter_forms.status_${status.toLowerCase()}`;
        return t(key) || status;
    };

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-2 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {t('voter_forms.title')}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-slate-500">
                                {t('voter_forms.subtitle')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowLogModal(true)}
                        className="ns-btn-primary"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('voter_forms.log_application')}
                    </button>
                </div>

                {/* Tab Navigation Moved Inside Sticky Header */}
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex gap-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('forms')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'forms'
                                ? 'border-brand-600 text-brand-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            {t('voter_forms.forms_tab') || 'Voter Forms'}
                        </button>
                        <button
                            onClick={() => setActiveTab('applications')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'applications'
                                ? 'border-brand-600 text-brand-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            {t('voter_forms.applications_tab') || 'Applications History'}
                        </button>
                    </nav>
                </div>
            </div>



            {activeTab === 'forms' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {forms.map((form) => {
                        const Icon = form.icon;
                        const colors = colorClasses[form.color] || colorClasses.blue;

                        return (
                            <div key={form.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                <div className={`p-6 ${colors.bg} border-b ${colors.border} flex items-center gap-4`}>
                                    <div className={`p-3 bg-white rounded-xl shadow-sm border ${colors.iconBg}`}>
                                        <Icon className={`w-8 h-8 ${colors.iconText}`} />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800">{form.title}</h2>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <p className="text-slate-600 mb-6 leading-relaxed">
                                        {form.description}
                                    </p>

                                    <div className="space-y-4 mb-8">
                                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                            <ClipboardList className="w-5 h-5 text-slate-400" />
                                            {t('voter_forms.required_documents')}
                                        </h3>
                                        <ul className="space-y-2">
                                            {form.requirements.map((req, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                    <span>{req}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="mt-auto">
                                        <a
                                            href={form.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`w-full py-3 px-4 ${colors.buttonBg} ${colors.buttonHover} text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm`}
                                        >
                                            {t('voter_forms.apply_now')}
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Application History Section - REFACTORED TO TAB */}
            {activeTab === 'applications' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 mb-12">
                    <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <History className="w-5 h-5 text-indigo-700" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">{t('voter_forms.applications_history')}</h2>
                                <p className="text-sm text-slate-500">Track all voter form applications</p>
                            </div>
                        </div>
                        <div className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                            Total: <span className="font-mono font-medium text-slate-900">{applications.length}</span>
                        </div>
                    </div>

                    {/* Filters and Search */}
                    <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder={t('voter_forms.search_placeholder') || "Search applications..."}
                                className="ns-input pl-9 w-full py-2 text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                            {['All', 'Pending', 'Submitted', 'Approved', 'Rejected'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${statusFilter === status
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {status === 'All' ? (t('common.all') || 'All') : getStatusLabel(status)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loadingApps ? (
                        <div className="p-12 text-center text-slate-500">Loading history...</div>
                    ) : applications.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 mb-1">{t('voter_forms.no_applications')}</h3>
                            <p className="text-slate-500 mb-6">Start by logging a new application.</p>
                            <button
                                onClick={() => setShowLogModal(true)}
                                className="ns-btn-primary"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {t('voter_forms.log_application')}
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('voter_forms.applicant_name')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('voter_forms.form_type')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('voter_forms.status')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('voter_forms.date')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('voter_forms.notes')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {applications
                                        .filter(app => {
                                            const matchesSearch = (app.applicant_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                                                (app.applicant_mobile || '').includes(searchQuery);
                                            const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
                                            return matchesSearch && matchesStatus;
                                        })
                                        .map((app) => (
                                            <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-900 text-sm">{app.applicant_name}</span>
                                                        {app.applicant_mobile && (
                                                            <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                                <span>📞</span> {app.applicant_mobile}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                        {getFormTypeLabel(app.form_type)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${app.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        app.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                            app.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                'bg-blue-50 text-blue-700 border-blue-200'
                                                        }`}>
                                                        {getStatusLabel(app.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 tabular-nums">
                                                    {new Date(app.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                                                    {app.notes || <span className="text-slate-400 italic">No notes</span>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(app)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title={t('common.edit') || "Edit"}
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(app)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title={t('common.delete') || "Delete"}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Log Application Modal */}
            {showLogModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {editingId ? t('voter_forms.edit_application') : t('voter_forms.log_new_application')}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
                            {/* Search Toggle */}
                            {!isSearchMode && !editingId && !formData.voterId && (
                                <div className="mb-6 bg-white p-4 rounded-xl border border-dashed border-brand-200 flex flex-col items-center justify-center text-center">
                                    <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center mb-2">
                                        <Search className="w-5 h-5 text-brand-600" />
                                    </div>
                                    <h4 className="font-semibold text-slate-900 mb-1">{t('voter_forms.link_voter_title')}</h4>
                                    <p className="text-xs text-slate-500 mb-3">{t('voter_forms.link_voter_desc')}</p>
                                    <button
                                        onClick={() => setIsSearchMode(true)}
                                        className="ns-btn-secondary text-sm py-1.5"
                                    >
                                        {t('voter_forms.search_voter_list')}
                                    </button>
                                </div>
                            )}

                            {/* Search Mode UI */}
                            {isSearchMode && (
                                <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <button onClick={() => setIsSearchMode(false)} className="text-xs text-slate-500 hover:text-slate-800">
                                            &larr; {t('voter_forms.back_to_form')}
                                        </button>
                                        <h4 className="text-sm font-semibold text-slate-900">{t('voter_forms.search_voter')}</h4>
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            autoFocus
                                            className="ns-input pl-9 w-full"
                                            placeholder={t('voter_forms.search_by_name_mobile_epic')}
                                            value={voterSearch}
                                            onChange={(e) => setVoterSearch(e.target.value)}
                                        />
                                    </div>

                                    {/* Search Results */}
                                    <div className="max-h-48 overflow-y-auto bg-white rounded-lg border border-slate-200 shadow-sm">
                                        {isSearching ? (
                                            <div className="p-4 text-center text-slate-500 text-sm">{t('voter_forms.searching')}</div>
                                        ) : voterSuggestions.length > 0 ? (
                                            <div className="divide-y divide-slate-100">
                                                {voterSuggestions.map(voter => (
                                                    <button
                                                        key={voter.id}
                                                        onClick={() => handleVoterSelect(voter)}
                                                        className="w-full text-left p-3 hover:bg-slate-50 flex justify-between items-center group"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900">
                                                                {language === 'mr' ? (voter.name_marathi || voter.name_english || voter.name) : (voter.name_english || voter.name)}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {voter.age}Y • {voter.gender} • {voter.epicNo}
                                                            </p>
                                                        </div>
                                                        <Plus className="w-4 h-4 text-brand-600 opacity-0 group-hover:opacity-100" />
                                                    </button>
                                                ))}
                                            </div>
                                        ) : voterSearch.length > 1 ? (
                                            <div className="p-4 text-center text-slate-500 text-sm">{t('voter_forms.no_voters_found')}</div>
                                        ) : (
                                            <div className="p-4 text-center text-slate-400 text-xs">{t('voter_forms.type_to_search')}</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Voter Search / Name Input - REMOVED OLD SEARCH, JUST INPUT NOW */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">{t('voter_forms.applicant_name')} <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            className="ns-input pl-9 w-full"
                                            placeholder={t('voter_forms.applicant_name')}
                                            value={formData.applicantName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, applicantName: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Mobile */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">{t('voter_forms.applicant_mobile')}</label>
                                    <input
                                        type="text"
                                        className="ns-input w-full"
                                        value={formData.applicantMobile}
                                        onChange={(e) => setFormData(prev => ({ ...prev, applicantMobile: e.target.value }))}
                                        placeholder={t('voter_forms.mobile_number_placeholder')}
                                    />
                                </div>

                                {/* Form Type */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">{t('voter_forms.form_type')}</label>
                                        <select
                                            className="ns-input w-full"
                                            value={formData.formType}
                                            onChange={(e) => setFormData(prev => ({ ...prev, formType: e.target.value }))}
                                        >
                                            {formTypes.map(type => (
                                                <option key={type} value={type}>
                                                    {getFormTypeLabel(type)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">{t('voter_forms.status')}</label>
                                        <select
                                            className="ns-input w-full"
                                            value={formData.status}
                                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                        >
                                            {statusOptions.map(status => (
                                                <option key={status} value={status}>
                                                    {getStatusLabel(status)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">{t('voter_forms.notes')}</label>
                                    <textarea
                                        className="ns-input w-full min-h-[80px]"
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder={t('voter_forms.notes_placeholder')}
                                    />
                                </div>

                                {/* Linked Voter Display */}
                                {formData.voterId && (
                                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg border border-green-100">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>{t('voter_forms.linked_to_voter_id')}: {formData.voterId}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, voterId: '' }));
                                                toast.info('Unlinked voter');
                                            }}
                                            className="ml-auto text-xs underline"
                                        >
                                            {t('voter_forms.remove')}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="ns-btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="ns-btn-primary"
                            >
                                {isSubmitting ? 'Saving...' : t('voter_forms.save_log')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-sm overflow-hidden p-6 space-y-4 bg-white rounded-xl shadow-xl">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">{t('voter_forms.delete_confirm_title')}</h3>
                            <p className="text-slate-500 mt-2 text-sm">
                                {t('voter_forms.delete_confirm_msg')}
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
                                {t('voter_forms.delete_application')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoterForms;
