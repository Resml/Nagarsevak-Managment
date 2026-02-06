import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../services/supabaseClient';
import { type Staff } from '../../types/staff';
import { Plus, Trash2, Edit2, User, Phone, Briefcase, Tag, Building2, Flag, Wrench, Search, MapPin } from 'lucide-react';
import StaffProfile from './StaffProfile';
import clsx from 'clsx';
import { useLanguage } from '../../context/LanguageContext';

const StaffList = () => {
    const { t } = useLanguage();
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'Office' | 'Party' | 'Cooperative'>('Office');
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        role: '',
        area: '',
        category: 'Office' as 'Office' | 'Party' | 'Cooperative',
        keywords: ''
    });

    // Search State
    const [nameSearch, setNameSearch] = useState('');
    const [areaSearch, setAreaSearch] = useState('');
    const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
    const areaWrapperRef = useRef<HTMLDivElement>(null);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (areaWrapperRef.current && !areaWrapperRef.current.contains(event.target as Node)) {
                setShowAreaSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const { data, error } = await supabase
                .from('staff')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStaff(data || []);
        } catch (err) {
            console.error('Error fetching staff:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const keywordsArray = formData.keywords.split(',').map(k => k.trim()).filter(k => k);

            if (formData.mobile.length !== 10) {
                toast.error(t('staff.list.valid_mobile'));
                return;
            }
            const fullMobile = `+91${formData.mobile}`;

            if (editingStaffId) {
                // Update Logic
                const { error } = await supabase
                    .from('staff')
                    .update({
                        name: formData.name,
                        mobile: fullMobile,
                        role: formData.role,
                        category: formData.category,
                        area: formData.area,
                        keywords: keywordsArray
                    })
                    .eq('id', editingStaffId);
                if (error) throw error;
                toast.success('Staff updated successfully');
            } else {
                // Insert Logic
                const { error } = await supabase
                    .from('staff')
                    .insert([{
                        name: formData.name,
                        mobile: fullMobile,
                        role: formData.role,
                        category: formData.category,
                        area: formData.area,
                        keywords: keywordsArray
                    }]);
                if (error) throw error;
                toast.success(t('staff.list.success_add'));
            }

            setShowModal(false);
            setFormData({ name: '', mobile: '', role: '', area: '', category: 'Office', keywords: '' });
            setEditingStaffId(null);
            fetchStaff();
        } catch (err) {
            console.error(err);
            toast.error(editingStaffId ? 'Failed to update staff' : t('staff.list.error_add'));
        }
    };

    const handleEdit = (staffMember: Staff) => {
        setEditingStaffId(staffMember.id);
        const mobileNum = staffMember.mobile.replace('+91', '').replace('+91 ', '');
        setFormData({
            name: staffMember.name,
            mobile: mobileNum,
            role: staffMember.role,
            area: staffMember.area || '',
            category: (staffMember.category as any) || 'Office',
            keywords: staffMember.keywords ? staffMember.keywords.join(', ') : ''
        });
        setShowModal(true);
        // We might want to keep the profile open or close it?
        // Usually modifying updates the profile underneath.
    };

    const handleDelete = (id: string) => {
        const staffMember = staff.find(s => s.id === id);
        if (staffMember) {
            setDeleteTarget(staffMember);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const { error } = await supabase.from('staff').delete().eq('id', deleteTarget.id);
            if (error) throw error;
            toast.success('Staff deleted successfully');
            setDeleteTarget(null);
            if (selectedStaff?.id === deleteTarget.id) {
                setSelectedStaff(null);
            }
            fetchStaff();
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete staff');
        }
    };

    // Filter logic:
    const staffInCurrentTab = staff.filter(s => (s.category || 'Office') === activeTab);

    // Area Suggestions Logic
    const getAreaSuggestions = () => {
        const counts: Record<string, number> = {};
        staffInCurrentTab.forEach(item => {
            const val = item.area?.trim();
            if (val) counts[val] = (counts[val] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count);
    };

    const areaSuggestions = getAreaSuggestions();
    const filteredAreaSuggestions = areaSuggestions.filter(item =>
        !areaSearch || item.value.toLowerCase().includes(areaSearch.toLowerCase())
    ).slice(0, 10);

    const filteredStaff = staffInCurrentTab
        .filter(s => {
            const matchesName = s.name.toLowerCase().includes(nameSearch.toLowerCase()) ||
                s.mobile.includes(nameSearch);
            const matchesArea = !areaSearch || (s.area || '').toLowerCase().includes(areaSearch.toLowerCase());
            return matchesName && matchesArea;
        })
        .sort((a, b) => (a.area || '').localeCompare(b.area || ''));

    const renderContent = () => {
        return (
            <div className="space-y-6">
                <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{t('staff.title')}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm text-gray-500">{t('staff.subtitle')}</p>
                                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-sky-50 text-sky-700 border border-sky-200">
                                    {t('staff.list.found')}: {filteredStaff.length}
                                </span>
                                {filteredStaff.length !== staffInCurrentTab.length && (
                                    <span className="text-xs text-slate-400">
                                        of {staffInCurrentTab.length}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="ns-btn-primary"
                        >
                            <Plus className="w-4 h-4" /> {t('staff.add_staff')}
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 overflow-x-auto">
                        {[
                            { id: 'Office', label: t('staff.tabs.office'), icon: Building2 },
                            { id: 'Party', label: t('staff.tabs.party'), icon: Flag },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={clsx(
                                    "flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "bg-brand-50 text-brand-700 shadow-sm"
                                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                )}
                            >
                                <tab.icon className={clsx("w-4 h-4", activeTab === tab.id ? "text-brand-600" : "text-gray-400")} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={t('staff.list.search_name_mobile') || "Search Name or Mobile"}
                            value={nameSearch}
                            onChange={(e) => setNameSearch(e.target.value)}
                            className="ns-input pl-9 w-full"
                        />
                    </div>
                    <div className="relative" ref={areaWrapperRef}>
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={t('staff.list.search_area') || "Search Area"}
                            value={areaSearch}
                            onChange={(e) => {
                                setAreaSearch(e.target.value);
                                setShowAreaSuggestions(true);
                            }}
                            onFocus={() => setShowAreaSuggestions(true)}
                            className="ns-input pl-9 w-full"
                        />
                        {showAreaSuggestions && filteredAreaSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filteredAreaSuggestions.map((item, idx) => (
                                    <button
                                        key={idx}
                                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center justify-between group"
                                        onClick={() => {
                                            setAreaSearch(item.value);
                                            setShowAreaSuggestions(false);
                                        }}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                            <span className="truncate">{item.value}</span>
                                        </div>
                                        <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded group-hover:bg-slate-200 flex-shrink-0 ml-2">
                                            {item.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>)}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStaff.length > 0 ? (
                            filteredStaff.map((member) => (
                                <div
                                    key={member.id}
                                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group relative cursor-pointer"
                                    onClick={() => setSelectedStaff(member)}
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-12 w-12 flex-shrink-0 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 shadow-sm border border-brand-100">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 leading-tight">{member.name}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="inline-flex items-center text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                    {member.role}
                                                </span>
                                                {member.area && (
                                                    <span className="inline-flex items-center text-xs text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded">
                                                        {member.area}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 pt-3 border-t border-gray-50">
                                        <div className="flex items-center text-sm text-gray-600 gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span className="font-mono">{member.mobile}</span>
                                        </div>

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
                                                    <span className="text-gray-400 italic text-xs">{t('staff.list.no_keywords')}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-16 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <User className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">{t('staff.list.no_members')}</h3>
                                <p className="text-gray-500 max-w-sm mt-1">
                                    {t('staff.list.get_started')}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {selectedStaff ? (
                <StaffProfile
                    member={selectedStaff}
                    onBack={() => setSelectedStaff(null)}
                    onEdit={(m) => {
                        handleEdit(m);
                    }}
                    onDelete={(id) => {
                        handleDelete(id);
                    }}
                />
            ) : (
                renderContent()
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">{editingStaffId ? 'Edit Staff Member' : t('staff.modal.title')}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('staff.modal.category')}</label>
                                <select
                                    className="ns-input mt-1"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                >
                                    <option value="Office">{t('staff.modal.office_desc')}</option>
                                    <option value="Party">{t('staff.modal.party_desc')}</option>
                                    <option value="Cooperative">{t('staff.modal.coop_desc')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('staff.modal.name')}</label>
                                <input
                                    type="text" required
                                    className="ns-input mt-1"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                                        value={formData.mobile}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, ''); // Only numbers
                                            setFormData({ ...formData, mobile: val });
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
                                        list="roles"
                                        required
                                        className="ns-input mt-1"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        placeholder={t('staff.modal.role_placeholder')}
                                    />
                                    <datalist id="roles">
                                        <option value="Office Admin" />
                                        <option value="Personal Assistant" />
                                        <option value="Ward President" />
                                        <option value="Booth Pramukh" />
                                        <option value="Electrician" />
                                        <option value="Plumber" />
                                        <option value="Sanitation Worker" />
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('staff.modal.area')}</label>
                                    <input
                                        type="text"
                                        className="ns-input mt-1"
                                        value={formData.area || ''}
                                        onChange={e => setFormData({ ...formData, area: e.target.value })}
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
                                    value={formData.keywords}
                                    onChange={e => setFormData({ ...formData, keywords: e.target.value })}
                                    placeholder={t('staff.modal.keywords_placeholder')}
                                />
                                <p className="text-xs text-gray-500 mt-1">{t('staff.modal.keywords_help')}</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
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

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-sm overflow-hidden p-6 space-y-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Delete Staff Member?</h3>
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
            )}
        </>
    );
};

export default StaffList;
