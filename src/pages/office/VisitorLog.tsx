import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { Users, Clock, Save, Phone, Search, UserCircle, MapPin, Calendar, Edit2, Trash2, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';
import { TranslatedText } from '../../components/TranslatedText';

import { useTenant } from '../../context/TenantContext';

interface Visitor {
    id: string;
    name: string;
    mobile: string;
    purpose: string;
    remarks: string;
    reference: string;
    area: string;
    visit_date: string;
    status: string;
}

const VisitorLog = () => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        purpose: 'Complaint', // Default
        reference: '',
        area: '',
        remarks: ''
    });

    // Edit / Delete / Expand State
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [areaSearch, setAreaSearch] = useState('');
    const [dateSearch, setDateSearch] = useState('');
    const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
    const [showDateSuggestions, setShowDateSuggestions] = useState(false);
    const [loading, setLoading] = useState(true);

    const areaWrapperRef = useRef<HTMLDivElement>(null);
    const dateWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchVisitors();

        // Click outside listener for dropdowns
        const handleClickOutside = (event: MouseEvent) => {
            if (areaWrapperRef.current && !areaWrapperRef.current.contains(event.target as Node)) {
                setShowAreaSuggestions(false);
            }
            if (dateWrapperRef.current && !dateWrapperRef.current.contains(event.target as Node)) {
                setShowDateSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchVisitors = async () => {
        // Fetch last 200 visitors to have decent data for filtering
        const { data, error } = await supabase
            .from('visitors')
            .select('*')
            .eq('tenant_id', tenantId) // Secured
            .order('visit_date', { ascending: false })
            .limit(200);

        if (data) setVisitors(data);
        setLoading(false);
    };

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                const { error } = await supabase
                    .from('visitors')
                    .update({
                        name: formData.name,
                        mobile: formData.mobile,
                        purpose: formData.purpose,
                        reference: formData.reference,
                        area: formData.area,
                        remarks: formData.remarks
                    })
                    .eq('id', editingId)
                    .eq('tenant_id', tenantId); // Secured

                if (error) throw error;
                toast.success('Visitor updated successfully');
                setEditingId(null);
            } else {
                const { error } = await supabase
                    .from('visitors')
                    .insert([{
                        name: formData.name,
                        mobile: formData.mobile,
                        purpose: formData.purpose,
                        reference: formData.reference,
                        area: formData.area,
                        remarks: formData.remarks,
                        visit_date: new Date().toISOString(),
                        tenant_id: tenantId // Secured
                    }]);

                if (error) throw error;
                toast.success('Visitor Checked In');
            }

            setFormData({ name: '', mobile: '', purpose: 'Complaint', reference: '', area: '', remarks: '' });
            fetchVisitors();
        } catch (err) {
            console.error(err);
            toast.error('Error logging visitor');
        }
    };

    const handleEdit = (visitor: Visitor) => {
        setEditingId(visitor.id);
        setFormData({
            name: visitor.name,
            mobile: visitor.mobile,
            purpose: visitor.purpose,
            reference: visitor.reference,
            area: visitor.area,
            remarks: visitor.remarks
        });
        // Scroll to form nicely
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = (visitor: Visitor) => {
        setDeleteTarget({ id: visitor.id, name: visitor.name });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const { error } = await supabase
                .from('visitors')
                .delete()
                .eq('id', deleteTarget.id)
                .eq('tenant_id', tenantId); // Secured

            if (error) throw error;
            toast.success('Visitor log deleted');
            setDeleteTarget(null);
            fetchVisitors();
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete visitor log');
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // --- Helper Functions for Suggestions ---

    const getAreaSuggestions = () => {
        const counts: Record<string, number> = {};
        visitors.forEach(v => {
            const val = v.area?.trim();
            if (val) counts[val] = (counts[val] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count);
    };

    const getDateSuggestions = () => {
        const counts: Record<string, number> = {};
        visitors.forEach(v => {
            if (v.visit_date) {
                const val = format(new Date(v.visit_date), 'yyyy-MM-dd');
                counts[val] = (counts[val] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => a.value > b.value ? -1 : 1); // Sort by date desc
    };

    const areaSuggestions = getAreaSuggestions();
    const filteredAreaSuggestions = areaSuggestions.filter(item =>
        !areaSearch || item.value.toLowerCase().includes(areaSearch.toLowerCase())
    );

    const dateSuggestions = getDateSuggestions();
    const filteredDateSuggestions = dateSuggestions.filter(item =>
        !dateSearch || item.value.includes(dateSearch)
    );


    // --- Optimized Filter Logic ---

    const filteredVisitors = visitors.filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.mobile.includes(searchQuery);

        const matchesArea = !areaSearch || (v.area || '').toLowerCase().includes(areaSearch.toLowerCase());

        const visitDateStr = v.visit_date ? format(new Date(v.visit_date), 'yyyy-MM-dd') : '';
        const matchesDate = !dateSearch || visitDateStr === dateSearch;

        return matchesSearch && matchesArea && matchesDate;
    });

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-30 bg-slate-50 py-2">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-7 h-7 text-brand-700" /> {t('office.visitor_log')}
                </h1>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Check-in Form */}
                <div className="md:col-span-1">
                    <div className="ns-card p-6 sticky top-24">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-slate-500" /> {editingId ? t('office.edit_visitor') : t('office.new_visitor_title')}
                        </h2>
                        <form onSubmit={handleCheckIn} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('office.full_name')}</label>
                                <input
                                    type="text" required
                                    className="ns-input mt-1"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={t('office.full_name')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('office.mobile')}</label>
                                <div className="relative mt-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">+91</span>
                                    <input
                                        type="tel"
                                        maxLength={10}
                                        pattern="[0-9]{10}"
                                        className="ns-input pl-10"
                                        value={formData.mobile}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setFormData({ ...formData, mobile: val });
                                        }}
                                        placeholder={t('office.mobile_placeholder')}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('office.area')}</label>
                                <input
                                    type="text"
                                    className="ns-input mt-1"
                                    value={formData.area}
                                    onChange={e => setFormData({ ...formData, area: e.target.value })}
                                    placeholder={t('office.area_placeholder')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('office.purpose')}</label>
                                <select
                                    className="ns-input mt-1"
                                    value={formData.purpose}
                                    onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                                >
                                    <option value="Complaint">{t('office.purpose_complaint')}</option>
                                    <option value="Meeting">{t('office.purpose_meeting')}</option>
                                    <option value="Greeting">{t('office.purpose_greeting')}</option>
                                    <option value="Donation">{t('office.purpose_donation')}</option>
                                    <option value="Other">{t('office.purpose_other')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    {t('office.reference')} <span className="text-gray-400 font-normal ml-1">{t('staff.modal.optional')}</span>
                                </label>
                                <input
                                    type="text"
                                    className="ns-input mt-1"
                                    value={formData.reference}
                                    onChange={e => setFormData({ ...formData, reference: e.target.value })}
                                    placeholder={t('office.reference_placeholder')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('office.notes')}</label>
                                <textarea
                                    className="ns-input mt-1 h-20"
                                    value={formData.remarks}
                                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                                    placeholder={t('office.notes_placeholder')}
                                />
                            </div>
                            <button type="submit" className="ns-btn-primary w-full justify-center">
                                <Save className="w-4 h-4" /> {editingId ? t('office.update_visitor') : t('office.log_visit')}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingId(null);
                                        setFormData({ name: '', mobile: '', purpose: 'Complaint', reference: '', area: '', remarks: '' });
                                    }}
                                    className="w-full mt-2 text-sm text-slate-500 hover:text-slate-700"
                                >
                                    {t('office.cancel_edit')}
                                </button>
                            )}
                        </form>
                    </div>
                </div>

                {/* Log List */}
                <div className="md:col-span-2">
                    <div className="ns-card h-full flex flex-col">
                        <div className="sticky top-11 z-20 p-4 border-b border-slate-200/70 bg-slate-50 space-y-3 rounded-t-xl">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold">{t('office.visitor_log')}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-sky-50 text-sky-700 border border-sky-200">
                                            {t('office.found')}: {filteredVisitors.length}
                                        </span>
                                        {visitors.length !== filteredVisitors.length && (
                                            <span className="text-xs text-slate-400">
                                                {t('office.of')} {visitors.length}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* Name Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder={t('office.search_placeholder')}
                                        className="ns-input pl-9 text-sm w-full"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                {/* Area Filter */}
                                <div className="relative" ref={areaWrapperRef}>
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder={t('office.filter_area')}
                                        className="ns-input pl-9 text-sm w-full"
                                        value={areaSearch}
                                        onChange={e => {
                                            setAreaSearch(e.target.value);
                                            setShowAreaSuggestions(true);
                                        }}
                                        onFocus={() => setShowAreaSuggestions(true)}
                                    />
                                    {showAreaSuggestions && filteredAreaSuggestions.length > 0 && (
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {filteredAreaSuggestions.map((item, idx) => (
                                                <button
                                                    key={idx}
                                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm flex items-center justify-between group border-b border-slate-50 last:border-0"
                                                    onClick={() => {
                                                        setAreaSearch(item.value);
                                                        setShowAreaSuggestions(false);
                                                    }}
                                                >
                                                    <span className="truncate"><TranslatedText text={item.value} /></span>
                                                    <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded group-hover:bg-slate-200">
                                                        {item.count}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Date Filter */}
                                <div className="relative" ref={dateWrapperRef}>
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder={t('office.filter_date')}
                                        className="ns-input pl-9 text-sm w-full"
                                        value={dateSearch}
                                        onChange={e => {
                                            setDateSearch(e.target.value);
                                            setShowDateSuggestions(true);
                                        }}
                                        onFocus={() => setShowDateSuggestions(true)}
                                    />
                                    {showDateSuggestions && filteredDateSuggestions.length > 0 && (
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {filteredDateSuggestions.map((item, idx) => (
                                                <button
                                                    key={idx}
                                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm flex items-center justify-between group border-b border-slate-50 last:border-0"
                                                    onClick={() => {
                                                        setDateSearch(item.value);
                                                        setShowDateSuggestions(false);
                                                    }}
                                                >
                                                    <span className="truncate">{format(new Date(item.value), 'MMM dd')}</span>
                                                    <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded group-hover:bg-slate-200">
                                                        {item.count}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 overflow-y-auto flex-1 h-[600px] md:h-auto space-y-3">
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
                                                        <div className="h-5 w-5 bg-slate-200 rounded-full animate-pulse" />
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <div className="h-5 w-20 bg-slate-200 rounded-full animate-pulse" />
                                                        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0 ml-4">
                                                    <div className="h-5 w-16 bg-slate-200 rounded animate-pulse mb-1" />
                                                    <div className="h-4 w-12 bg-slate-200 rounded animate-pulse ml-auto" />
                                                </div>
                                            </div>
                                            <div className="h-4 w-48 bg-slate-200 rounded animate-pulse mt-3" />
                                        </div>
                                    ))}
                                </div>
                            ) : filteredVisitors.map(v => (
                                <div
                                    key={v.id}
                                    className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 transition hover:shadow-md cursor-pointer overflow-hidden"
                                    onClick={() => toggleExpand(v.id)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-slate-900 text-lg">
                                                    <TranslatedText text={v.name} />
                                                </h4>
                                                <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedId === v.id ? 'rotate-90' : ''}`} />
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                <span className="ns-badge border-brand-100 bg-brand-50 text-brand-800 uppercase font-semibold text-xs px-2 py-0.5 rounded-full">
                                                    <TranslatedText text={v.purpose} />
                                                </span>
                                                {v.mobile && <span className="flex items-center gap-1 font-medium"><Phone className="w-3.5 h-3.5" /> {v.mobile}</span>}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-4">
                                            <div className="text-sm font-bold text-slate-900">{format(new Date(v.visit_date), 'h:mm a')}</div>
                                            <div className="text-xs font-medium text-slate-500 mt-1">{format(new Date(v.visit_date), 'MMM dd')}</div>
                                        </div>
                                    </div>

                                    <div className={`space-y-2 ${expandedId === v.id ? '' : 'line-clamp-2'}`}>
                                        {v.area && (
                                            <p className="text-sm text-slate-600 flex items-center gap-1.5">
                                                <MapPin className="w-4 h-4 text-slate-400" /> <TranslatedText text={v.area} />
                                            </p>
                                        )}
                                        {(v.remarks || v.reference) && (
                                            <div className="mt-2 space-y-1.5 bg-slate-50 p-3 rounded-md border border-slate-100">
                                                {v.reference && (
                                                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                                        <UserCircle className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="font-medium text-slate-700">Ref: <TranslatedText text={v.reference} /></span>
                                                    </p>
                                                )}
                                                {v.remarks && (
                                                    <p className="text-slate-600 text-sm italic">
                                                        "<TranslatedText text={v.remarks} />"
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions (Visible when expanded) */}
                                    {expandedId === v.id && (
                                        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(v);
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                {t('common.edit')}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(v);
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                {t('common.delete')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {filteredVisitors.length === 0 && !loading && (
                                <div className="p-8 text-center text-slate-500">
                                    {t('office.no_logs')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="ns-card w-full max-w-sm overflow-hidden p-6 space-y-4 bg-white">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Delete Visitor Log?</h3>
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
        </div>
    );
};

export default VisitorLog;
