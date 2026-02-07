import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabaseClient';
import { toast } from 'sonner';
import { useTenant } from '../../context/TenantContext';

const AddVoter = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { tenantId } = useTenant();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        epic_no: '',
        name_english: '',
        name_marathi: '',
        house_no: '',
        age: '',
        gender: 'M',
        address_english: '',
        address_marathi: '',
        ac_no: '',
        part_no: '',
        serial_no: '',
        mobile: '',
        ward_no: '',
        caste: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.epic_no || !formData.name_english || !formData.age) {
            toast.error(t('add_voter.messages.required_fields'));
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('voters')
                .insert([{
                    ...formData,
                    age: parseInt(formData.age),
                    ac_no: formData.ac_no ? parseInt(formData.ac_no) : null,
                    part_no: formData.part_no ? parseInt(formData.part_no) : null,
                    new_serial_no: formData.serial_no ? parseInt(formData.serial_no) : null,
                    tenant_id: tenantId // Secured
                }]);

            if (error) throw error;

            toast.success(t('add_voter.messages.success'));
            navigate('/voters');
        } catch (error: any) {
            console.error('Error adding voter:', error);
            toast.error(t('add_voter.messages.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/voters')}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-slate-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">{t('add_voter.title')}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="ns-card p-6 space-y-6">
                    <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('add_voter.form.epic_no')} *</label>
                            <input
                                name="epic_no"
                                value={formData.epic_no}
                                onChange={handleChange}
                                className="ns-input w-full"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('add_voter.form.mobile')}</label>
                            <input
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                className="ns-input w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('add_voter.form.name_english')} *</label>
                            <input
                                name="name_english"
                                value={formData.name_english}
                                onChange={handleChange}
                                className="ns-input w-full"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('add_voter.form.name_marathi')}</label>
                            <input
                                name="name_marathi"
                                value={formData.name_marathi}
                                onChange={handleChange}
                                className="ns-input w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('add_voter.form.age')} *</label>
                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                className="ns-input w-full"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('add_voter.form.gender')}</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="ns-input w-full"
                            >
                                <option value="M">{t('voters.gender_male')}</option>
                                <option value="F">{t('voters.gender_female')}</option>
                                <option value="O">{t('voters.gender_other')}</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('add_voter.form.caste')}</label>
                            <input
                                name="caste"
                                value={formData.caste}
                                onChange={handleChange}
                                className="ns-input w-full"
                            />
                        </div>
                    </div>
                </div>



                {/* Address & Booth Details */}
                <div className="ns-card p-6 space-y-6">
                    <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Address & Booth Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">{t('add_voter.form.address_english')}</label>
                            <textarea
                                name="address_english"
                                value={formData.address_english}
                                onChange={handleChange}
                                className="ns-input w-full min-h-[80px]"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">{t('add_voter.form.address_marathi')}</label>
                            <textarea
                                name="address_marathi"
                                value={formData.address_marathi}
                                onChange={handleChange}
                                className="ns-input w-full min-h-[80px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('add_voter.form.house_no')}</label>
                            <input
                                name="house_no"
                                value={formData.house_no}
                                onChange={handleChange}
                                className="ns-input w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('add_voter.form.ward_no')}</label>
                            <input
                                name="ward_no"
                                value={formData.ward_no}
                                onChange={handleChange}
                                className="ns-input w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('add_voter.form.ac_no')}</label>
                            <input
                                type="number"
                                name="ac_no"
                                value={formData.ac_no}
                                onChange={handleChange}
                                className="ns-input w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('add_voter.form.part_no')}</label>
                            <input
                                type="number"
                                name="part_no"
                                value={formData.part_no}
                                onChange={handleChange}
                                className="ns-input w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('add_voter.form.serial_no')}</label>
                            <input
                                type="number"
                                name="serial_no"
                                value={formData.serial_no}
                                onChange={handleChange}
                                className="ns-input w-full"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/voters')}
                        className="ns-btn-secondary px-8"
                        disabled={loading}
                    >
                        {t('add_voter.form.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="ns-btn-primary px-10"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {t('add_voter.form.adding')}
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                {t('add_voter.form.save')}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddVoter;
