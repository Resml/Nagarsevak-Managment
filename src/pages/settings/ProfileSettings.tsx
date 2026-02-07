import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { Save, Upload, User, Building2, Flag } from 'lucide-react';
import { toast } from 'sonner';

const ProfileSettings = () => {
    const { tenant, tenantId } = useTenant();
    const { t, language } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        nagarsevak_name_english: '',
        nagarsevak_name_marathi: '',
        ward_name: '',
        ward_number: '',
        party_name: '',
        party_logo_url: '',
        profile_image_url: ''
    });

    useEffect(() => {
        if (tenantId) {
            fetchSettings();
        }
    }, [tenantId]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tenants')
                .select('config')
                .eq('id', tenantId)
                .single();

            if (data && data.config) {
                setFormData({
                    nagarsevak_name_english: data.config.nagarsevak_name_english || '',
                    nagarsevak_name_marathi: data.config.nagarsevak_name_marathi || '',
                    ward_name: data.config.ward_name || '',
                    ward_number: data.config.ward_number || '',
                    party_name: data.config.party_name || '',
                    party_logo_url: data.config.party_logo_url || '',
                    profile_image_url: data.config.profile_image_url || ''
                });
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'party') => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${tenantId}_${type}_${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            setSaving(true);
            const { error: uploadError } = await supabase.storage
                .from('app-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('app-assets')
                .getPublicUrl(filePath);

            setFormData(prev => ({
                ...prev,
                [type === 'profile' ? 'profile_image_url' : 'party_logo_url']: publicUrl
            }));

            toast.success(t('sadasya.upload_success') || 'Upload successful');
        } catch (error: any) {
            console.error('Error uploading image:', error.message);
            toast.error('Error uploading image.');
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (!tenantId) return;
        setSaving(true);

        const { error } = await supabase
            .from('tenants')
            .update({
                config: formData,
                updated_at: new Date().toISOString() // Assuming there is an updated_at column, else generic
            })
            .eq('id', tenantId);

        if (error) {
            console.error('Error saving settings:', error);
            toast.error(t('common.error') || 'Error saving settings');
        } else {
            toast.success(t('sadasya.update_success') || 'Settings updated successfully!');
            // Optional: refresh tenant context? For now reload page to update UI if it depends on tenant config
            window.location.reload();
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-8 w-48 bg-slate-200 rounded mb-2"></div>
                        <div className="h-4 w-64 bg-slate-200 rounded"></div>
                    </div>
                    <div className="h-10 w-32 bg-slate-200 rounded"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Details Skeleton */}
                    <div className="ns-card p-6 space-y-4">
                        <div className="h-6 w-32 bg-slate-200 rounded mb-4"></div>
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i}>
                                    <div className="h-4 w-24 bg-slate-200 rounded mb-1"></div>
                                    <div className="h-10 w-full bg-slate-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Branding Skeleton */}
                    <div className="space-y-6">
                        <div className="ns-card p-6 space-y-4">
                            <div className="h-6 w-32 bg-slate-200 rounded mb-4"></div>
                            <div>
                                <div className="h-4 w-24 bg-slate-200 rounded mb-1"></div>
                                <div className="h-10 w-full bg-slate-200 rounded"></div>
                            </div>
                        </div>

                        <div className="ns-card p-6 space-y-4">
                            <div className="h-6 w-32 bg-slate-200 rounded mb-4"></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center space-y-2">
                                    <div className="w-24 h-24 mx-auto bg-slate-200 rounded-full"></div>
                                    <div className="h-3 w-20 bg-slate-200 rounded mx-auto"></div>
                                </div>
                                <div className="text-center space-y-2">
                                    <div className="w-24 h-24 mx-auto bg-slate-200 rounded-xl"></div>
                                    <div className="h-3 w-20 bg-slate-200 rounded mx-auto"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('sadasya.profile_settings') || 'Profile Settings'}</h1>
                    <p className="text-slate-500">{t('sadasya.branding') || 'Manage your branding and personal details'}</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="ns-btn-primary flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : t('common.save') || 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Details */}
                <div className="ns-card p-6 space-y-4">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 border-b pb-2">
                        <User className="w-5 h-5 text-brand-600" />
                        {t('sadasya.personal_details') || 'Personal Details'}
                    </h3>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Name (English)</label>
                            <input
                                type="text"
                                name="nagarsevak_name_english"
                                value={formData.nagarsevak_name_english}
                                onChange={handleInputChange}
                                className="ns-input w-full"
                                placeholder="e.g. Rahul Patil"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Name (Marathi)</label>
                            <input
                                type="text"
                                name="nagarsevak_name_marathi"
                                value={formData.nagarsevak_name_marathi}
                                onChange={handleInputChange}
                                className="ns-input w-full"
                                placeholder="उदा. राहुल पाटील"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('sadasya.ward_name') || 'Ward Name'}</label>
                            <input
                                type="text"
                                name="ward_name"
                                value={formData.ward_name}
                                onChange={handleInputChange}
                                className="ns-input w-full"
                                placeholder="e.g. Shivaji Nagar"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('sadasya.ward_num') || 'Ward Number'}</label>
                            <input
                                type="text"
                                name="ward_number"
                                value={formData.ward_number}
                                onChange={handleInputChange}
                                className="ns-input w-full"
                                placeholder="e.g. 10"
                            />
                        </div>
                    </div>
                </div>

                {/* Branding & Media */}
                <div className="space-y-6">
                    <div className="ns-card p-6 space-y-4">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 border-b pb-2">
                            <Flag className="w-5 h-5 text-brand-600" />
                            {t('sadasya.branding') || 'Party Details'}
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('sadasya.party_name') || 'Party Name'}</label>
                            <input
                                type="text"
                                name="party_name"
                                value={formData.party_name}
                                onChange={handleInputChange}
                                className="ns-input w-full"
                                placeholder="e.g. XYZ Party"
                            />
                        </div>
                    </div>

                    <div className="ns-card p-6 space-y-4">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 border-b pb-2">
                            <Building2 className="w-5 h-5 text-brand-600" />
                            {t('sadasya.logo_update') || 'Images'}
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center space-y-2">
                                <div className="w-24 h-24 mx-auto bg-slate-100 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group">
                                    {formData.profile_image_url ? (
                                        <img src={formData.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-8 h-8 text-slate-400" />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => handleFileUpload(e, 'profile')}
                                    />
                                </div>
                                <p className="text-xs font-semibold text-slate-600">{t('sadasya.upload_photo') || 'Profile Photo'}</p>
                            </div>

                            <div className="text-center space-y-2">
                                <div className="w-24 h-24 mx-auto bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group">
                                    {formData.party_logo_url ? (
                                        <img src={formData.party_logo_url} alt="Party Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <Flag className="w-8 h-8 text-slate-400" />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => handleFileUpload(e, 'party')}
                                    />
                                </div>
                                <p className="text-xs font-semibold text-slate-600">{t('sadasya.upload_logo') || 'Party Logo'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
