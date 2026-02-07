
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { ArrowLeft, Save } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';

const LetterForm = () => {
    const { t } = useLanguage();
    const { tenantId } = useTenant();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [types, setTypes] = useState<{ name: string }[]>([]);
    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        name: '',
        type: '', // Start empty, fill on load
        mobile: '',
        address: '',
        area: '',
        purpose: ''
    });

    useEffect(() => {
        const fetchTypes = async () => {
            const { data } = await supabase.from('letter_types').select('name').order('name');
            if (data && data.length > 0) {
                setTypes(data);
                setFormData(prev => ({ ...prev, type: data[0].name }));
            } else {
                // Fallback defaults if DB empty
                const defaults = [
                    { name: 'Residential Certificate' },
                    { name: 'Character Certificate' },
                    { name: 'No Objection Certificate (NOC)' }
                ];
                setTypes(defaults);
                setFormData(prev => ({ ...prev, type: defaults[0].name }));
            }
        };
        fetchTypes();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const fullName = `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim().replace(/\s+/g, ' ');

        try {
            const { error } = await supabase
                .from('letter_requests')
                .insert([{
                    user_id: formData.mobile || 'Manual Entry', // Fallback if no mobile, or use specific format
                    type: formData.type,
                    area: formData.area,
                    details: {
                        name: fullName,
                        text: formData.address,
                        purpose: formData.purpose,
                        mobile: formData.mobile
                    },
                    status: 'Pending',
                    tenant_id: tenantId
                }]);

            if (error) throw error;
            toast.success(t('staff.list.success_add').replace('Staff member', 'Request')); // diligent fallback or just use generic success
            navigate('/letters');
        } catch (err) {
            console.error('Error saving letter request:', err);
            toast.error(t('staff.list.error_add').replace('staff', 'request'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <button
                onClick={() => navigate('/letters')}
                className="ns-btn-ghost px-0 py-0 text-slate-600 hover:text-brand-700"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> {t('common.back')}
            </button>

            <div className="ns-card overflow-hidden">
                <div className="p-6 border-b border-slate-200/70 bg-slate-50">
                    <h1 className="text-xl font-bold text-slate-900">{t('letters.new_request_title')}</h1>
                    <p className="text-sm text-slate-500 mt-1">{t('letters.subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Name Split into 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.first_name')}</label>
                            <input
                                required
                                name="firstName"
                                type="text"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="ns-input"
                                placeholder={t('complaints.form.first_name')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.middle_name')}</label>
                            <input
                                name="middleName"
                                type="text"
                                value={formData.middleName}
                                onChange={handleChange}
                                className="ns-input"
                                placeholder={t('complaints.form.middle_name')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.last_name')}</label>
                            <input
                                required
                                name="lastName"
                                type="text"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="ns-input"
                                placeholder={t('complaints.form.last_name')}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('letters.mobile')}</label>
                            <input
                                required
                                name="mobile"
                                type="tel"
                                value={formData.mobile}
                                onChange={handleChange}
                                className="ns-input"
                                placeholder="+91 98765 43210"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('letters.letter_type')}</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="ns-input"
                            >
                                {types.map(tOption => {
                                    // Helper to translate known types
                                    const getTranslatedType = (name: string) => {
                                        const map: Record<string, string> = {
                                            'Residential Certificate': 'residential',
                                            'Character Certificate': 'character',
                                            'No Objection Certificate (NOC)': 'noc',
                                            'Income Certificate': 'income'
                                        };
                                        const key = map[name];
                                        return key ? t(`letters.types.${key}`) : name;
                                    };

                                    return (
                                        <option key={tOption.name} value={tOption.name}>
                                            {getTranslatedType(tOption.name)}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('letters.area')}</label>
                        <input
                            required
                            name="area"
                            type="text"
                            value={formData.area}
                            onChange={handleChange}
                            className="ns-input"
                            placeholder={t('complaints.form.area_placeholder')}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('letters.address')}</label>
                        <textarea
                            required
                            name="address"
                            rows={3}
                            value={formData.address}
                            onChange={handleChange}
                            className="ns-input"
                            placeholder={t('letters.addr_placeholder')}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('office.purpose')}</label>
                        <input
                            name="purpose"
                            type="text"
                            value={formData.purpose}
                            onChange={handleChange}
                            className="ns-input"
                            placeholder={t('office.purpose')}
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="ns-btn-primary disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{loading ? t('common.loading') : t('letters.create_request')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LetterForm;
