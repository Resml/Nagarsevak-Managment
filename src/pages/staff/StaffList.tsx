import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { type Staff } from '../../types/staff';
import { Plus, Trash2, Edit2, User, Phone, Briefcase, Tag, Building2, Flag, Wrench } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../../context/LanguageContext';

const StaffList = () => {
    const { t } = useLanguage();
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'Office' | 'Party' | 'Cooperative'>('Office');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        role: '',
        area: '',
        category: 'Office' as 'Office' | 'Party' | 'Cooperative',
        keywords: ''
    });

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
                alert(t('staff.list.valid_mobile'));
                return;
            }
            const fullMobile = `+91${formData.mobile}`;

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

            setShowModal(false);
            setFormData({ name: '', mobile: '', role: '', area: '', category: 'Office', keywords: '' });
            fetchStaff();
            alert(t('staff.list.success_add'));
        } catch (err) {
            console.error(err);
            alert(t('staff.list.error_add'));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('staff.list.delete_confirm'))) return;
        try {
            const { error } = await supabase.from('staff').delete().eq('id', id);
            if (error) throw error;
            fetchStaff();
        } catch (err) {
            console.error(err);
            alert(t('staff.list.error_add')); // Using generic error for delete failure too or add specific key if preferred
        }
    };

    // Filter logic:
    // If Office -> Show Office members
    // If Party -> Show Party members
    // If Cooperative -> Show Cooperative members
    const filteredStaff = staff
        .filter(s => {
            const cat = s.category || 'Office';
            return cat === activeTab;
        })
        .sort((a, b) => (a.area || '').localeCompare(b.area || '')); // Sort by area

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('staff.title')}</h1>
                    <p className="text-sm text-gray-500">{t('staff.subtitle')}</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 transition-colors"
                >
                    <Plus className="w-4 h-4" /> {t('staff.add_staff')}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 overflow-x-auto">
                {[
                    { id: 'Office', label: t('staff.tabs.office'), icon: Building2 },
                    { id: 'Party', label: t('staff.tabs.party'), icon: Flag },
                    { id: 'Cooperative', label: t('staff.tabs.cooperative'), icon: Wrench }
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">{t('staff.modal.title')}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('staff.modal.category')}</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
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
                                    className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
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
                                        className="w-full border border-gray-300 rounded-r-lg p-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
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
                                        className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
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
                                        className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
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
                                    className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
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
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                >
                                    {t('staff.modal.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium transition-colors"
                                >
                                    {t('staff.modal.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>)}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStaff.length > 0 ? (
                        filteredStaff.map((member) => (
                            <div key={member.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group relative">
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleDelete(member.id)} className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 mb-4">
                                    <div className={clsx(
                                        "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold",
                                        member.category === 'Party' ? "bg-orange-100 text-orange-600" :
                                            member.category === 'Cooperative' ? "bg-blue-100 text-blue-600" :
                                                "bg-brand-100 text-brand-600"
                                    )}>
                                        {member.name.charAt(0)}
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

export default StaffList;
