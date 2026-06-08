import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { Save, Upload, User, Building2, Flag, Smartphone, AlertTriangle, Shield, Clock, Loader2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import BotDashboard from '../admin/BotDashboard';
import SecurityLogs from './SecurityLogs';
import CropModal from '../../components/common/CropModal';
import clsx from 'clsx';

const ProfileSettings = () => {
    const { tenant, tenantId, refreshTenant } = useTenant();
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'bot' | 'security' | 'support'>('profile');

    const [formData, setFormData] = useState({
        nagarsevak_name_english: '',
        nagarsevak_name_marathi: '',
        ward_name: '',
        ward_number: '',
        party_name: '',
        party_logo_url: '',
        profile_image_url: '',
        office_address: '',
        office_hours: '',
        phone_number: '',
        email_address: '',
        social_media_link: ''
    });

    const [cropConfig, setCropConfig] = useState<{
        image: string;
        type: 'profile' | 'party';
        aspect: number;
    } | null>(null);

    // Support states
    const [supportTitle, setSupportTitle] = useState('');
    const [supportDescription, setSupportDescription] = useState('');
    const [supportPriority, setSupportPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [submittingSupport, setSubmittingSupport] = useState(false);
    const [supportTickets, setSupportTickets] = useState<any[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(false);

    const fetchSupportTickets = async () => {
        if (!tenantId) return;
        setLoadingTickets(true);
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSupportTickets(data || []);
        } catch (error) {
            console.error('Error fetching support tickets:', error);
        } finally {
            setLoadingTickets(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'support' && tenantId) {
            fetchSupportTickets();
        }
    }, [activeTab, tenantId]);

    const handleSubmitSupport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supportTitle.trim() || !supportDescription.trim()) {
            toast.error(language === 'mr' ? 'कृपया सर्व आवश्यक फील्ड भरा.' : 'Please fill in all required fields.');
            return;
        }

        setSubmittingSupport(true);
        try {
            const userEmail = user?.email || 'unknown';
            const userName = user?.name || 'unknown';
            const userRole = user?.role || 'unknown';
            
            const meta = {
                submitter_name: userName,
                submitter_email: userEmail,
                user_role: userRole,
                user_agent: navigator.userAgent,
                timestamp: new Date().toISOString()
            };

            const { error } = await supabase.from('support_tickets').insert([{
                title: supportTitle,
                description: supportDescription,
                status: 'Pending',
                priority: supportPriority,
                user_id: userEmail,
                user_name: userName,
                description_meta: JSON.stringify(meta)
            }]);

            if (error) throw error;

            toast.success(
                language === 'mr' 
                    ? 'तुमची अडचण यशस्वीरित्या नोंदवली गेली आहे.' 
                    : 'Your support ticket has been submitted successfully.'
            );
            
            setSupportTitle('');
            setSupportDescription('');
            setSupportPriority('Medium');
            fetchSupportTickets();
        } catch (error: any) {
            console.error('Error submitting support ticket:', error);
            toast.error(error.message || 'Error submitting ticket');
        } finally {
            setSubmittingSupport(false);
        }
    };

    // Check permissions
    const canAccessBot = user?.role === 'admin' || user?.permissions?.includes('bot');

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
                    profile_image_url: data.config.profile_image_url || '',
                    office_address: data.config.office_address || '',
                    office_hours: data.config.office_hours || '',
                    phone_number: data.config.phone_number || '',
                    email_address: data.config.email_address || '',
                    social_media_link: data.config.social_media_link || ''
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
        const fileName = `${tenantId}_${type}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            const reader = new FileReader();
            reader.onload = () => {
                setCropConfig({
                    image: reader.result as string,
                    type,
                    aspect: type === 'profile' ? 1 : 16 / 9 // 1:1 for profile, wider for party logo
                });
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error reading file:', error);
            toast.error('Error reading file.');
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        if (!cropConfig) return;
        const type = cropConfig.type;
        const fileName = `${tenantId}_${type}_${Date.now()}.jpg`;
        const activeTenantId = tenantId || 'default-tenant';
        const filePath = `${activeTenantId}/files/${fileName}`;

        try {
            setSaving(true);
            setCropConfig(null);

            // If a previous image exists, try to delete it (best effort)
            const oldUrl = type === 'profile' ? formData.profile_image_url : formData.party_logo_url;
            if (oldUrl) {
                const oldPath = oldUrl.split('/app-assets/')[1];
                if (oldPath) {
                    await supabase.storage.from('app-assets').remove([oldPath]);
                }
            }

            const { error: uploadError } = await supabase.storage
                .from('app-assets')
                .upload(filePath, croppedBlob, { 
                    upsert: true,
                    contentType: 'image/jpeg'
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('app-assets')
                .getPublicUrl(filePath);

            // Add cache-busting param so browser shows new image immediately
            const bustUrl = `${publicUrl}?t=${Date.now()}`;

            const updatedFormData = {
                ...formData,
                [type === 'profile' ? 'profile_image_url' : 'party_logo_url']: bustUrl
            };

            setFormData(updatedFormData);

            // Auto-save to DB immediately after upload so AppLayout refreshes
            const { error: saveError } = await supabase
                .from('tenants')
                .update({ config: updatedFormData })
                .eq('id', tenantId);

            if (saveError) throw saveError;

            // Refresh global TenantContext so logo updates everywhere instantly
            await refreshTenant();

            toast.success(type === 'profile' ? 'Profile photo updated!' : 'Party logo updated!');
        } catch (error: any) {
            console.error('Error uploading image:', error.message);
            toast.error('Error uploading image.');
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (!tenantId) {
            toast.error("Tenant ID is missing");
            return;
        }
        setSaving(true);
        console.log("Saving settings for tenant:", tenantId);
        console.log("Data:", formData);

        try {
            // First try with updated_at
            const { error } = await supabase
                .from('tenants')
                .update({
                    config: formData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', tenantId);

            if (error) {
                // If error is about missing column, try without updated_at
                if (error.code === '42703' || error.message?.includes("updated_at")) {
                    console.warn("updated_at column missing, retrying without it...");
                    const { error: retryError } = await supabase
                        .from('tenants')
                        .update({
                            config: formData
                        })
                        .eq('id', tenantId);

                    if (retryError) throw retryError;
                } else {
                    throw error;
                }
            }

            toast.success(t('sadasya.update_success') || 'Settings updated successfully!');
            // Refresh global TenantContext so logo/profile updates everywhere
            await refreshTenant();
            // Reload local settings
            await fetchSettings();
        } catch (error: any) {
            console.error('Error saving settings:', error);
            toast.error(error.message || t('common.error') || 'Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-slate-200 rounded mb-2"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="ns-card p-6 h-64 bg-slate-200 rounded"></div>
                    <div className="ns-card p-6 h-64 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Tabs */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{t('sadasya.profile_settings') || 'Profile Settings'}</h1>
                        <p className="text-slate-500">{t('sadasya.branding') || 'Manage your branding and personal details'}</p>
                    </div>
                </div>

                <div className="flex space-x-1 rounded-xl bg-slate-100 p-1">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={clsx(
                            'flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-brand-400 focus:outline-none focus:ring-2',
                            activeTab === 'profile'
                                ? 'bg-white text-brand-700 shadow'
                                : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800'
                        )}
                    >
                        <User className="w-4 h-4" />
                        {t('sadasya.personal_details') || 'Profile Details'}
                    </button>
                    {canAccessBot && (
                        <button
                            onClick={() => setActiveTab('bot')}
                            className={clsx(
                                'flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-brand-400 focus:outline-none focus:ring-2',
                                activeTab === 'bot'
                                    ? 'bg-white text-brand-700 shadow'
                                    : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800'
                            )}
                        >
                            <Smartphone className="w-4 h-4" />
                            {t('whatsapp_bot.title') || 'WhatsApp Bot'}
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('security')}
                        className={clsx(
                            'flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-brand-400 focus:outline-none focus:ring-2',
                            activeTab === 'security'
                                ? 'bg-white text-brand-700 shadow'
                                : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800'
                        )}
                    >
                        <Shield className="w-4 h-4" />
                        {language === 'mr' ? 'सुरक्षा लॉग' : (t('security.title') || 'Security Logs')}
                    </button>
                    <button
                        onClick={() => setActiveTab('support')}
                        className={clsx(
                            'flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-brand-400 focus:outline-none focus:ring-2',
                            activeTab === 'support'
                                ? 'bg-white text-brand-700 shadow'
                                : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800'
                        )}
                    >
                        <AlertTriangle className="w-4 h-4" />
                        {language === 'mr' ? 'अडचण नोंदवा' : 'Report Issue'}
                    </button>
                </div>
            </div>

            {/* Profile Content */}
            {activeTab === 'profile' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
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

                        {/* Office & Contact Details */}
                        <div className="ns-card p-6 space-y-4">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 border-b pb-2">
                                <Building2 className="w-5 h-5 text-brand-600" />
                                {t('sadasya.office_details')}
                            </h3>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('sadasya.office_address')}</label>
                                    <input
                                        type="text"
                                        name="office_address"
                                        value={formData.office_address}
                                        onChange={handleInputChange}
                                        className="ns-input w-full"
                                        placeholder="e.g. 123 Main St, Pune"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('sadasya.office_hours')}</label>
                                    <input
                                        type="text"
                                        name="office_hours"
                                        value={formData.office_hours}
                                        onChange={handleInputChange}
                                        className="ns-input w-full"
                                        placeholder="e.g. 10 AM - 6 PM"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('sadasya.phone_number')}</label>
                                    <input
                                        type="text"
                                        name="phone_number"
                                        value={formData.phone_number}
                                        onChange={handleInputChange}
                                        className="ns-input w-full"
                                        placeholder="e.g. +91 9876543210"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('sadasya.email_address')}</label>
                                    <input
                                        type="email"
                                        name="email_address"
                                        value={formData.email_address}
                                        onChange={handleInputChange}
                                        className="ns-input w-full"
                                        placeholder="e.g. contact@nagar.in"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('sadasya.social_media_link')}</label>
                                    <input
                                        type="text"
                                        name="social_media_link"
                                        value={formData.social_media_link}
                                        onChange={handleInputChange}
                                        className="ns-input w-full"
                                        placeholder="e.g. fb.com/rahulpatil"
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
            )}

            {/* Bot Content */}
            {activeTab === 'bot' && canAccessBot && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <BotDashboard />
                </div>
            )}

            {/* Security Content */}
            {activeTab === 'security' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <SecurityLogs />
                </div>
            )}

            {/* Support Content */}
            {activeTab === 'support' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    {/* Left Column: Form */}
                    <div className="ns-card p-6 space-y-4 bg-white shadow-sm border border-slate-100 rounded-xl">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 border-b pb-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                            {language === 'mr' ? 'नवीन अडचण नोंदवा' : 'Report New Issue'}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {language === 'mr' 
                                ? 'अप्लिकेशन वापरताना काही अडचण किंवा बग आल्यास, आपण येथे तिकीट नोंदवू शकता.' 
                                : 'If you face any issue or bug while using the application, you can raise a support ticket here.'}
                        </p>

                        <form onSubmit={handleSubmitSupport} className="space-y-4 pt-2">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {language === 'mr' ? 'अडचणीचा विषय / शीर्षक' : 'Issue Summary / Title'} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={supportTitle}
                                    onChange={(e) => setSupportTitle(e.target.value)}
                                    className="ns-input w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                    placeholder={language === 'mr' ? 'उदा. प्रोफाईल फोटो सेव्ह होत नाही' : 'e.g. Profile photo not saving'}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {language === 'mr' ? 'सविस्तर माहिती' : 'Detailed Description'} <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={5}
                                    value={supportDescription}
                                    onChange={(e) => setSupportDescription(e.target.value)}
                                    className="ns-input w-full min-h-[120px] border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                    placeholder={language === 'mr' 
                                        ? 'अडचणीबद्दल सविस्तर माहिती लिहा (उदा. आपण काय करत होतात, काय एरर आली)' 
                                        : 'Describe the issue in detail (e.g. what action you were performing, what error appeared)'}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {language === 'mr' ? 'प्राधान्य / तीव्रता' : 'Priority / Severity'}
                                </label>
                                <select
                                    value={supportPriority}
                                    onChange={(e) => setSupportPriority(e.target.value as any)}
                                    className="ns-input w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white"
                                >
                                    <option value="Low">{language === 'mr' ? 'कमी (Low)' : 'Low'}</option>
                                    <option value="Medium">{language === 'mr' ? 'मध्यम (Medium)' : 'Medium'}</option>
                                    <option value="High">{language === 'mr' ? 'जास्त (High)' : 'High'}</option>
                                </select>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={submittingSupport}
                                    className="ns-btn-primary flex items-center gap-2 animate-all duration-200"
                                >
                                    {submittingSupport ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {language === 'mr' ? 'नोंदवत आहे...' : 'Submitting...'}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            {language === 'mr' ? 'तिकीट दाखल करा' : 'Submit Ticket'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Submitted Tickets */}
                    <div className="ns-card p-6 space-y-4 flex flex-col max-h-[600px] bg-white shadow-sm border border-slate-100 rounded-xl">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 border-b pb-2">
                            <Clock className="w-5 h-5 text-brand-600" />
                            {language === 'mr' ? 'माझी तिकीटे' : 'My Support Tickets'}
                        </h3>

                        <div className="flex-1 overflow-y-auto pr-1">
                            {loadingTickets ? (
                                <div className="h-40 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
                                </div>
                            ) : supportTickets.length > 0 ? (
                                <div className="space-y-3 animate-in fade-in duration-300">
                                    {supportTickets.map((ticket) => {
                                        const cleanTitle = ticket.title;
                                        const dateStr = ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A';
                                        
                                        // Colors
                                        let statusBg = 'bg-slate-100 text-slate-700';
                                        if (ticket.status === 'Resolved') statusBg = 'bg-green-100 text-green-700';
                                        else if (ticket.status === 'InProgress') statusBg = 'bg-yellow-100 text-yellow-700';
                                        else if (ticket.status === 'Pending') statusBg = 'bg-red-50 text-red-700 border border-red-100';

                                        let priorityBg = 'bg-slate-50 text-slate-600';
                                        if (ticket.priority === 'High') priorityBg = 'bg-rose-50 text-rose-600 border border-rose-100';
                                        else if (ticket.priority === 'Medium') priorityBg = 'bg-amber-50 text-amber-600 border border-amber-100';

                                        return (
                                            <div key={ticket.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="font-semibold text-slate-800 text-sm line-clamp-1">{cleanTitle}</h4>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${statusBg}`}>
                                                        {ticket.status === 'InProgress' ? (language === 'mr' ? 'काम चालू' : 'In Progress') : 
                                                         ticket.status === 'Resolved' ? (language === 'mr' ? 'सोडवलेले' : 'Resolved') : 
                                                         (language === 'mr' ? 'प्रलंबित' : 'Pending')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-2">
                                                    {ticket.description}
                                                </p>
                                                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100/50 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        {dateStr}
                                                    </span>
                                                    <div className="flex gap-2 items-center">
                                                        {ticket.priority && (
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityBg}`}>
                                                                {ticket.priority}
                                                            </span>
                                                        )}
                                                        <span className="font-mono text-slate-400">#{ticket.id}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-40 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                    <HelpCircle className="w-8 h-8 text-slate-300 mb-2" />
                                    <p className="text-sm font-medium">{language === 'mr' ? 'कोणतीही तिकीटे आढळली नाहीत.' : 'No support tickets found.'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Crop Modal */}
            {cropConfig && (
                <CropModal
                    image={cropConfig.image}
                    aspect={cropConfig.aspect}
                    onCropComplete={handleCropComplete}
                    onClose={() => setCropConfig(null)}
                />
            )}
        </div>
    );
};

export default ProfileSettings;
