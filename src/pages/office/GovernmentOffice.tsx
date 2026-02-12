import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { TranslatedText } from '../../components/TranslatedText';
import { GovernmentService, type GovernmentOffice } from '../../services/governmentService';
import { Search, MapPin, Phone, User, Building2, ExternalLink, X, Wrench, Briefcase, Plus, Trash2, Edit2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../services/supabaseClient';
import { type Staff } from '../../types/staff';
import clsx from 'clsx';

const GovernmentOfficePage = () => {
    const { t } = useLanguage();
    const { tenantId } = useTenant(); // Added tenantId
    const [activeTab, setActiveTab] = useState<'Offices' | 'Cooperative'>('Offices');

    // Offices State
    const [offices, setOffices] = useState<GovernmentOffice[]>([]);
    const [officesLoading, setOfficesLoading] = useState(true);
    const [officeSearchTerm, setOfficeSearchTerm] = useState('');
    const [isOfficeModalOpen, setIsOfficeModalOpen] = useState(false);
    const [officeFormData, setOfficeFormData] = useState<Partial<GovernmentOffice>>({
        name: '',
        address: '',
        officerName: '',
        contactNumber: '',
        area: ''
    });

    // Staff State
    const [staff, setStaff] = useState<Staff[]>([]);
    const [staffLoading, setStaffLoading] = useState(true);
    const [staffSearchTerm, setStaffSearchTerm] = useState('');
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
    const [staffFormData, setStaffFormData] = useState({
        name: '',
        mobile: '',
        role: '',
        area: '',
        category: 'Cooperative' as const,
        keywords: ''
    });
    const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);

    useEffect(() => {
        loadOffices();
        fetchStaff();
    }, []);

    const loadOffices = async () => {
        setOfficesLoading(true);
        try {
            const data = await GovernmentService.getOffices();
            setOffices(data);
        } catch (error) {
            console.error('Failed to load offices:', error);
            toast.error('Failed to load government offices');
        } finally {
            setOfficesLoading(false);
        }
    };

    const fetchStaff = async () => {
        setStaffLoading(true);
        try {
            const { data, error } = await supabase
                .from('staff')
                .select('*')
                .eq('category', 'Cooperative')
                .eq('tenant_id', tenantId) // Secured
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStaff(data || []);
        } catch (err) {
            console.error('Error fetching staff:', err);
        } finally {
            setStaffLoading(false);
        }
    };

    const handleAddOffice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!officeFormData.name || !officeFormData.contactNumber) {
                toast.error('Please fill required fields');
                return;
            }
            await GovernmentService.addOffice(officeFormData as any);
            setIsOfficeModalOpen(false);
            setOfficeFormData({
                name: '',
                address: '',
                officerName: '',
                contactNumber: '',
                area: ''
            });
            toast.success('Office added successfully');
            loadOffices();
        } catch (error) {
            console.error(error);
            toast.error('Failed to add office');
        }
    };

    const handleSaveStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const keywordsArray = staffFormData.keywords.split(',').map(k => k.trim()).filter(k => k);

            if (staffFormData.mobile.length !== 10) {
                toast.error(t('staff.list.valid_mobile'));
                return;
            }
            const fullMobile = `+91${staffFormData.mobile}`;

            if (editingStaffId) {
                const { error } = await supabase
                    .from('staff')
                    .update({
                        name: staffFormData.name,
                        mobile: fullMobile,
                        role: staffFormData.role,
                        category: 'Cooperative',
                        area: staffFormData.area,
                        keywords: keywordsArray
                    })
                    .eq('id', editingStaffId)
                    .eq('tenant_id', tenantId); // Secured
                if (error) throw error;
                toast.success('Worker updated successfully');
            } else {
                const { error } = await supabase
                    .from('staff')
                    .insert([{
                        name: staffFormData.name,
                        mobile: fullMobile,
                        role: staffFormData.role,
                        category: 'Cooperative',
                        area: staffFormData.area,
                        keywords: keywordsArray,
                        tenant_id: tenantId // Secured
                    }]);
                if (error) throw error;
                toast.success(t('staff.list.success_add'));
            }

            setIsStaffModalOpen(false);
            setStaffFormData({ name: '', mobile: '', role: '', area: '', category: 'Cooperative', keywords: '' });
            setEditingStaffId(null);
            fetchStaff();
        } catch (err) {
            console.error(err);
            toast.error(editingStaffId ? 'Failed to update worker' : t('staff.list.error_add'));
        }
    };

    const handleEditStaff = (staffMember: Staff) => {
        setEditingStaffId(staffMember.id);
        const mobileNum = staffMember.mobile.replace('+91', '').replace('+91 ', '');
        setStaffFormData({
            name: staffMember.name,
            mobile: mobileNum,
            role: staffMember.role,
            area: staffMember.area || '',
            category: 'Cooperative',
            keywords: staffMember.keywords ? staffMember.keywords.join(', ') : ''
        });
        setIsStaffModalOpen(true);
    };

    const confirmDeleteStaff = async () => {
        if (!deleteTarget) return;
        try {
            const { error } = await supabase.from('staff').delete().eq('id', deleteTarget.id).eq('tenant_id', tenantId); // Secured
            if (error) throw error;
            toast.success('Worker deleted successfully');
            setDeleteTarget(null);
            fetchStaff();
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete worker');
        }
    };

    const filteredOffices = offices.filter(office =>
        office.name.toLowerCase().includes(officeSearchTerm.toLowerCase()) ||
        office.officerName.toLowerCase().includes(officeSearchTerm.toLowerCase()) ||
        office.area?.toLowerCase().includes(officeSearchTerm.toLowerCase())
    );

    const filteredStaff = staff.filter(s =>
        s.name.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
        s.mobile.includes(staffSearchTerm) ||
        (s.area || '').toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
        (s.role || '').toLowerCase().includes(staffSearchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Sticky Header Section */}
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 -mx-4 px-4 sm:-mx-8 sm:px-8 border-b border-slate-200/60 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {activeTab === 'Offices' ? t('government_office.title') : t('government_office.employee_title')}
                        </h1>
                        <p className="text-slate-500">{t('government_office.subtitle')}</p>
                    </div>
                    {activeTab === 'Offices' ? (
                        <button
                            onClick={() => setIsOfficeModalOpen(true)}
                            className="ns-btn-primary w-full md:w-auto justify-center"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{t('government_office.add_office')}</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsStaffModalOpen(true)}
                            className="ns-btn-primary w-full md:w-auto justify-center"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{t('staff.add_staff')}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
                {[
                    { id: 'Offices', label: t('government_office.title'), icon: Building2 },
                    { id: 'Cooperative', label: t('staff.tabs.cooperative'), icon: Wrench }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={clsx(
                            "flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
                            activeTab === tab.id
                                ? "bg-brand-50 text-brand-700 shadow-sm"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        )}
                    >
                        <tab.icon className={clsx("w-5 h-5", activeTab === tab.id ? "text-brand-600" : "text-gray-400")} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder={activeTab === 'Offices' ? (t('government_office.search_placeholder') || "Search...") : (t('staff.list.search_name_mobile') || "Search Name or Mobile")}
                    className="ns-input pl-10 w-full"
                    value={activeTab === 'Offices' ? officeSearchTerm : staffSearchTerm}
                    onChange={(e) => activeTab === 'Offices' ? setOfficeSearchTerm(e.target.value) : setStaffSearchTerm(e.target.value)}
                />
            </div>

            {/* Content for Offices */}
            {activeTab === 'Offices' && (
                <>
                    {officesLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="ns-card p-6 space-y-4 h-64 h-32 bg-gray-100 animate-pulse rounded-xl"></div>
                            ))}
                        </div>
                    ) : filteredOffices.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredOffices.map((office) => (
                                <div key={office.id} className="ns-card hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
                                    <div className="p-6 flex-1 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
                                                <Building2 className="w-6 h-6" />
                                            </div>
                                            {office.area && (
                                                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                                                    <TranslatedText text={office.area} />
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-2">
                                                <TranslatedText text={office.name} />
                                            </h3>
                                            <div className="flex items-start gap-2 text-slate-500 text-sm">
                                                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                                <span className="line-clamp-2"><TranslatedText text={office.address} /></span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 mt-auto">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{t('government_office.officer_name')}</p>
                                                    <p className="text-sm font-semibold text-slate-900"><TranslatedText text={office.officerName} /></p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                <Phone className="w-4 h-4 text-slate-400" />
                                                <p className="text-sm font-semibold text-slate-700">{office.contactNumber}</p>
                                            </div>

                                            <a
                                                href={`tel:${office.contactNumber}`}
                                                className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg font-medium transition-colors"
                                            >
                                                <Phone className="w-4 h-4" />
                                                {t('government_office.call_now')}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-xl">
                            <Building2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">{t('government_office.no_offices')}</h3>
                            <p className="text-gray-500 mt-1">Try adjusting your search terms.</p>
                        </div>
                    )}
                </>
            )}

            {/* Content for Cooperative Workers */}
            {activeTab === 'Cooperative' && (
                <>
                    {staffLoading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-xl"></div>)}
                        </div>
                    ) : filteredStaff.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredStaff.map((member) => (
                                <div key={member.id} className="ns-card p-5 hover:shadow-md transition-shadow group relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 flex-shrink-0 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 shadow-sm border border-brand-100">
                                                <Wrench className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 leading-tight">{member.name}</h3>
                                                <p className="text-xs font-medium text-gray-500 mt-0.5">{member.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleEditStaff(member)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setDeleteTarget(member)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 pt-3 border-t border-gray-50">
                                        <div className="flex items-center text-sm text-gray-600 gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span className="font-mono">{member.mobile}</span>
                                        </div>
                                        {member.area && (
                                            <div className="flex items-center text-sm text-gray-600 gap-2">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span>{member.area}</span>
                                            </div>
                                        )}
                                        <div className="flex items-start text-sm text-gray-600 gap-2">
                                            <Tag className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <div className="flex flex-wrap gap-1.5">
                                                {member.keywords && member.keywords.length > 0 ? (
                                                    member.keywords.map((k, i) => (
                                                        <span key={i} className="bg-gray-50 px-2 py-0.5 rounded text-xs text-gray-500 border border-gray-100">
                                                            {k}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400 italic text-xs">No keywords</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4">
                                        <a
                                            href={`tel:${member.mobile}`}
                                            className="flex items-center justify-center gap-2 w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors text-sm"
                                        >
                                            <Phone className="w-4 h-4" />
                                            {t('government_office.call_now')}
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="col-span-full py-16 flex flex-col items-center text-center bg-white border border-dashed border-gray-300 rounded-xl">
                            <Wrench className="w-16 h-16 text-gray-200 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No Cooperative Workers</h3>
                            <p className="text-gray-500 max-w-sm mt-1">Start by adding workers to this category.</p>
                        </div>
                    )}
                </>
            )}

            {/* Office Modal */}
            {isOfficeModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-slate-200/70">
                            <h2 className="text-xl font-bold text-slate-900">{t('government_office.modal_title')}</h2>
                            <button onClick={() => setIsOfficeModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddOffice} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('government_office.office_name')}</label>
                                <input
                                    type="text" required
                                    className="ns-input mt-1"
                                    value={officeFormData.name}
                                    onChange={e => setOfficeFormData({ ...officeFormData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('government_office.address')}</label>
                                <input
                                    type="text" required
                                    className="ns-input mt-1"
                                    value={officeFormData.address}
                                    onChange={e => setOfficeFormData({ ...officeFormData, address: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('government_office.officer_name')}</label>
                                <input
                                    type="text" required
                                    className="ns-input mt-1"
                                    value={officeFormData.officerName}
                                    onChange={e => setOfficeFormData({ ...officeFormData, officerName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('government_office.contact')}</label>
                                <input
                                    type="text" required
                                    className="ns-input mt-1"
                                    value={officeFormData.contactNumber}
                                    onChange={e => setOfficeFormData({ ...officeFormData, contactNumber: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('government_office.location')}</label>
                                <input
                                    type="text" required
                                    className="ns-input mt-1"
                                    value={officeFormData.area || ''}
                                    onChange={e => setOfficeFormData({ ...officeFormData, area: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="ns-btn-primary w-full justify-center"
                            >
                                <Building2 className="w-4 h-4 mr-2" />
                                {t('government_office.save_office')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Staff Modal */}
            {isStaffModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">{editingStaffId ? 'Edit Worker' : t('staff.modal.title')}</h2>
                        <form onSubmit={handleSaveStaff} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('staff.modal.name')}</label>
                                <input
                                    type="text" required
                                    className="ns-input mt-1"
                                    value={staffFormData.name}
                                    onChange={e => setStaffFormData({ ...staffFormData, name: e.target.value })}
                                    placeholder={t('staff.modal.name_placeholder')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('staff.modal.mobile')}</label>
                                <div className="flex mt-1">
                                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        required
                                        maxLength={10}
                                        className="ns-input rounded-l-none border-l-0"
                                        value={staffFormData.mobile}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setStaffFormData({ ...staffFormData, mobile: val });
                                        }}
                                        placeholder="9876543210"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('staff.modal.role')}</label>
                                    <input
                                        type="text"
                                        required
                                        className="ns-input mt-1"
                                        value={staffFormData.role}
                                        onChange={e => setStaffFormData({ ...staffFormData, role: e.target.value })}
                                        placeholder={t('staff.modal.role_placeholder')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('staff.modal.area')}</label>
                                    <input
                                        type="text"
                                        className="ns-input mt-1"
                                        value={staffFormData.area || ''}
                                        onChange={e => setStaffFormData({ ...staffFormData, area: e.target.value })}
                                        placeholder={t('staff.modal.area_placeholder')}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {t('staff.modal.keywords')}
                                    <span className="ml-2 text-xs text-gray-500 font-normal">{t('staff.modal.optional')}</span>
                                </label>
                                <input
                                    type="text"
                                    className="ns-input mt-1"
                                    value={staffFormData.keywords}
                                    onChange={e => setStaffFormData({ ...staffFormData, keywords: e.target.value })}
                                    placeholder={t('staff.modal.keywords_placeholder')}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsStaffModalOpen(false);
                                        setEditingStaffId(null);
                                        setStaffFormData({ name: '', mobile: '', role: '', area: '', category: 'Cooperative', keywords: '' });
                                    }}
                                    className="ns-btn-ghost"
                                >
                                    {t('staff.modal.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="ns-btn-primary"
                                >
                                    {editingStaffId ? 'Update' : t('staff.modal.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal for Staff */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-sm overflow-hidden p-6 space-y-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Delete Worker?</h3>
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
                                onClick={confirmDeleteStaff}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GovernmentOfficePage;
