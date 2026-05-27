import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { toast } from 'sonner';
import { 
    Building2, Users, Activity, Sparkles, Plus, Search, 
    Phone, MapPin, Calendar, Trash2, Edit2, X, ChevronDown, 
    ChevronUp, Heart, Award, Info, Copy, Check, CheckCircle2,
    Flag, Shield, Layers, HelpCircle
} from 'lucide-react';

interface EventConducted {
    id: string;
    title: string;
    title_mr?: string;
    year: number;
    description: string;
    description_mr?: string;
}

interface SocialOrganization {
    id: string;
    tenant_id: string;
    name: string;
    name_marathi?: string;
    name_english?: string;
    type: 'ngo' | 'sports_cricket' | 'ganpati_mandal' | 'navratri_mandal' | 'other';
    president_name: string;
    president_mobile: string;
    members_count: number;
    area: string;
    established_year: number;
    support_received: string;
    events_conducted: EventConducted[];
    description: string;
    status: 'Active' | 'Inactive';
    created_at?: string;
}

const DEFAULT_ORGANIZATIONS: SocialOrganization[] = [
    {
        id: 'mock-1',
        tenant_id: '00000000-0000-0000-0000-000000000000',
        name: 'मावळा सामाजिक प्रतिष्ठान',
        name_marathi: 'मावळा सामाजिक प्रतिष्ठान',
        name_english: 'Mavala Social Foundation',
        type: 'ngo',
        president_name: 'सचिन तावडे',
        president_mobile: '9876543210',
        members_count: 45,
        area: 'शास्त्री नगर (Shastri Nagar)',
        established_year: 2018,
        support_received: 'वृक्षारोपण मोहिमेसाठी निधी व कचरा कुंडी वाटप (Provided funds for tree plantation & distributed dustbins)',
        description: 'स्थानिक पर्यावरण संवर्धन आणि रक्तदान शिबिर आयोजित करणारी संस्था.',
        status: 'Active',
        events_conducted: [
            { id: 'e-1', title: 'रक्तदान शिबिर २०२५', title_mr: 'रक्तदान शिबिर २०२५', year: 2025, description: '१०० हून अधिक बाटल्यांचे संकलन', description_mr: '१०० हून अधिक बाटल्यांचे संकलन' },
            { id: 'e-2', title: 'वृक्षारोपण मोहीम २०२४', title_mr: 'वृक्षारोपण मोहीम २०२४', year: 2024, description: '५०० पेक्षा जास्त रोपांची लागवड', description_mr: '५०० पेक्षा जास्त रोपांची लागवड' }
        ]
    },
    {
        id: 'mock-2',
        tenant_id: '00000000-0000-0000-0000-000000000000',
        name: 'शिवतेज क्रीडा व क्रिकेट क्लब',
        name_marathi: 'शिवतेज क्रीडा व क्रिकेट क्लब',
        name_english: 'Shivtej Sports & Cricket Club',
        type: 'sports_cricket',
        president_name: 'राहुल गायकवाड',
        president_mobile: '9822334455',
        members_count: 32,
        area: 'गांधी मैदान प्रभाग (Gandhi Maidan Ward)',
        established_year: 2021,
        support_received: 'क्रिकेट किट्स आणि क्रीडा गणवेश प्रायोजकत्व (Sponsored cricket kits and sports uniforms)',
        description: 'स्थानिक तरुणांना क्रिकेटचे प्रशिक्षण देणे आणि प्रभाग स्तरावर स्पर्धा आयोजित करणे.',
        status: 'Active',
        events_conducted: [
            { id: 'e-3', title: 'चषक स्पर्धा २०२६', title_mr: 'चषक स्पर्धा २०२६', year: 2026, description: 'प्रभागीय भव्य क्रिकेट स्पर्धा', description_mr: 'प्रभागीय भव्य क्रिकेट स्पर्धा' }
        ]
    },
    {
        id: 'mock-3',
        tenant_id: '00000000-0000-0000-0000-000000000000',
        name: 'जय भवानी गणेश मंडळ',
        name_marathi: 'जय भवानी गणेश मंडळ',
        name_english: 'Jai Bhavani Ganesh Mandal',
        type: 'ganpati_mandal',
        president_name: 'प्रशांत सूर्यवंशी',
        president_mobile: '9988776655',
        members_count: 80,
        area: 'नेहरू चौक (Nehru Chowk)',
        established_year: 2012,
        support_received: 'मंडपासाठी आर्थिक मदत व सुरक्षा सीसीटीव्ही कॅमेरे (Financial assistance for Pandal and CCTV cameras)',
        description: 'नेहरू चौक भागातील जुने आणि नामांकित सार्वजनिक गणेशोत्सव मंडळ.',
        status: 'Active',
        events_conducted: [
            { id: 'e-4', title: 'गणेशोत्सव २०२५', title_mr: 'गणेशोत्सव २०२५', year: 2025, description: 'आरोग्य शिबिर व अन्नदान उपक्रम', description_mr: 'आरोग्य शिबिर व अन्नदान उपक्रम' }
        ]
    },
    {
        id: 'mock-4',
        tenant_id: '00000000-0000-0000-0000-000000000000',
        name: 'अष्टविनायक नवरात्रौत्सव मंडळ',
        name_marathi: 'अष्टविनायक नवरात्रौत्सव मंडळ',
        name_english: 'Ashtavinayak Navratri Mandal',
        type: 'navratri_mandal',
        president_name: 'किरण मोहिते',
        president_mobile: '9765432109',
        members_count: 55,
        area: 'शिवाजी नगर चौक (Shivaji Nagar Chowk)',
        established_year: 2015,
        support_received: 'दांडिया स्पर्धा करंडक प्रायोजकत्व (Sponsored Dandiya Competition Trophies)',
        description: 'नवरात्री काळात गरबा, दांडिया आणि विविध महिला सशक्तीकरण उपक्रम राबवणारे मंडळ.',
        status: 'Active',
        events_conducted: [
            { id: 'e-5', title: 'गरबा दांडिया रात्र २०२५', title_mr: 'गरबा दांडिया रात्र २०२५', year: 2025, description: 'महिलांसाठी विशेष सुरक्षित दांडिया रात्र', description_mr: 'महिलांसाठी विशेष सुरक्षित दांडिया रात्र' }
        ]
    },
    {
        id: 'mock-5',
        tenant_id: '00000000-0000-0000-0000-000000000000',
        name: 'जिजाऊ महिला बचत गट व संस्था',
        name_marathi: 'जिजाऊ महिला बचत गट व संस्था',
        name_english: 'Jijau Mahila Bachat Gat & Org',
        type: 'ngo',
        president_name: 'सुनिता कदम',
        president_mobile: '9123456789',
        members_count: 60,
        area: 'संजय नगर (Sanjay Nagar)',
        established_year: 2019,
        support_received: 'बचत गटासाठी शिवणयंत्रे व उद्योग प्रदर्शन जागा (Provided Sewing Machines & Exhibition Space)',
        description: 'गृहिणींना आणि बचत गटातील महिलांना रोजगार प्रशिक्षण आणि साहित्याचे वाटप करणारी अग्रगण्य संस्था.',
        status: 'Active',
        events_conducted: [
            { id: 'e-6', title: 'शिवणकाम कार्यशाळा २०२५', title_mr: 'शिवणकाम कार्यशाळा २०२५', year: 2025, description: '४० महिलांना मोफत प्रशिक्षण व शिवणयंत्र वाटप', description_mr: '४० महिलांना मोफत प्रशिक्षण व शिवणयंत्र वाटप' }
        ]
    },
    {
        id: 'mock-6',
        tenant_id: '00000000-0000-0000-0000-000000000000',
        name: 'बाजीप्रभू क्रीडा मंडळ',
        name_marathi: 'बाजीप्रभू क्रीडा मंडळ',
        name_english: 'Bajiprabhu Sports Club',
        type: 'sports_cricket',
        president_name: 'अमित सावंत',
        president_mobile: '9654321987',
        members_count: 28,
        area: 'हनुमान आळी (Hanuman Ali)',
        established_year: 2022,
        support_received: 'मैदान सपाटीकरण आणि व्यायामशाळा साहित्याची मदत (Assisted with ground levelling & gym equipment)',
        description: 'स्थानिक पातळीवर कबड्डी आणि कुस्तीच्या खेळाडूंना प्रोत्साहन व मोफत प्रशिक्षण.',
        status: 'Active',
        events_conducted: [
            { id: 'e-7', title: 'कबड्डी चषक २०२५', title_mr: 'कबड्डी चषक २०२५', year: 2025, description: 'राज्यस्तरीय खेळाडूंच्या सहभागासह स्पर्धा', description_mr: 'राज्यस्तरीय खेळाडूंच्या सहभागासह स्पर्धा' }
        ]
    }
];

const SocialOrganizations = () => {
    const { language } = useLanguage();
    const { tenantId } = useTenant();
    const isMr = language === 'mr';

    const [orgs, setOrgs] = useState<SocialOrganization[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLocalStorageMode, setIsLocalStorageMode] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);

    // Modal & Form states
    const [showModal, setShowModal] = useState(false);
    const [editingOrg, setEditingOrg] = useState<SocialOrganization | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        name_marathi: '',
        name_english: '',
        type: 'ngo',
        president_name: '',
        president_mobile: '',
        members_count: '',
        area: '',
        established_year: '',
        support_received: '',
        description: '',
        status: 'Active'
    });

    const [newEventData, setNewEventData] = useState({
        title: '',
        title_mr: '',
        year: new Date().getFullYear(),
        description: '',
        description_mr: ''
    });

    const [tempEvents, setTempEvents] = useState<EventConducted[]>([]);

    // Fetch organizations
    const fetchOrgs = async () => {
        setLoading(true);
        try {
            // First check if supabase table is ready
            const { data, error } = await supabase
                .from('social_organizations')
                .select('*')
                .eq('tenant_id', tenantId || '00000000-0000-0000-0000-000000000000')
                .order('created_at', { ascending: false });

            if (error) {
                // If the relation doesn't exist, we fall back to LocalStorage gracefully
                if (error.code === 'PGRST116' || error.message.includes('relation "public.social_organizations" does not exist')) {
                    throw new Error('Table does not exist');
                }
                throw error;
            }

            setOrgs(data || []);
            setIsLocalStorageMode(false);
        } catch (err) {
            console.log('Falling back to Local Storage mode for Social Organizations due to:', err);
            setIsLocalStorageMode(true);
            
            // Read from LocalStorage
            const stored = localStorage.getItem(`social_orgs_${tenantId || 'default'}`);
            if (stored) {
                try {
                    setOrgs(JSON.parse(stored));
                } catch {
                    setOrgs(DEFAULT_ORGANIZATIONS);
                    localStorage.setItem(`social_orgs_${tenantId || 'default'}`, JSON.stringify(DEFAULT_ORGANIZATIONS));
                }
            } else {
                setOrgs(DEFAULT_ORGANIZATIONS);
                localStorage.setItem(`social_orgs_${tenantId || 'default'}`, JSON.stringify(DEFAULT_ORGANIZATIONS));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgs();
    }, [tenantId]);

    // Handle Mobile Copy
    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success(isMr ? 'मोबाईल नंबर कॉपी केला!' : 'Mobile number copied!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Filter logic
    const filteredOrgs = orgs.filter(org => {
        const nameToSearch = `${org.name} ${org.name_english || ''} ${org.name_marathi || ''} ${org.president_name} ${org.area}`.toLowerCase();
        const matchesSearch = nameToSearch.includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || org.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });

    // Stats calculations
    const stats = {
        total: filteredOrgs.length,
        ngos: filteredOrgs.filter(o => o.type === 'ngo').length,
        sports: filteredOrgs.filter(o => o.type === 'sports_cricket').length,
        mandals: filteredOrgs.filter(o => o.type === 'ganpati_mandal' || o.type === 'navratri_mandal').length
    };

    // Open Add Modal
    const handleOpenAdd = () => {
        setEditingOrg(null);
        setFormData({
            name: '',
            name_marathi: '',
            name_english: '',
            type: 'ngo',
            president_name: '',
            president_mobile: '',
            members_count: '',
            area: '',
            established_year: String(new Date().getFullYear()),
            support_received: '',
            description: '',
            status: 'Active'
        });
        setTempEvents([]);
        setShowModal(true);
    };

    // Open Edit Modal
    const handleOpenEdit = (org: SocialOrganization) => {
        setEditingOrg(org);
        setFormData({
            name: org.name,
            name_marathi: org.name_marathi || '',
            name_english: org.name_english || '',
            type: org.type,
            president_name: org.president_name || '',
            president_mobile: org.president_mobile || '',
            members_count: String(org.members_count || ''),
            area: org.area || '',
            established_year: String(org.established_year || ''),
            support_received: org.support_received || '',
            description: org.description || '',
            status: org.status || 'Active'
        });
        setTempEvents(org.events_conducted || []);
        setShowModal(true);
    };

    // Add Event in Form
    const handleAddEvent = () => {
        if (!newEventData.title && !newEventData.title_mr) {
            toast.error(isMr ? 'कृपया कार्यक्रमाचे नाव टाका' : 'Please enter event title');
            return;
        }

        const newEvent: EventConducted = {
            id: `evt-${Date.now()}`,
            title: newEventData.title || newEventData.title_mr || '',
            title_mr: newEventData.title_mr || newEventData.title || '',
            year: Number(newEventData.year),
            description: newEventData.description || newEventData.description_mr || '',
            description_mr: newEventData.description_mr || newEventData.description || ''
        };

        setTempEvents([...tempEvents, newEvent]);
        setNewEventData({
            title: '',
            title_mr: '',
            year: new Date().getFullYear(),
            description: '',
            description_mr: ''
        });
        toast.success(isMr ? 'कार्यक्रम जोडला!' : 'Event added to list!');
    };

    // Delete Event in Form
    const handleRemoveEvent = (id: string) => {
        setTempEvents(tempEvents.filter(e => e.id !== id));
    };

    // Save Form
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const nameMain = formData.name_marathi || formData.name_english || formData.name;
        if (!nameMain) {
            toast.error(isMr ? 'कृपया संस्थेचे नाव टाका' : 'Please enter organization name');
            return;
        }

        const orgPayload: Omit<SocialOrganization, 'id'> = {
            tenant_id: tenantId || '00000000-0000-0000-0000-000000000000',
            name: nameMain,
            name_marathi: formData.name_marathi || nameMain,
            name_english: formData.name_english || nameMain,
            type: formData.type as any,
            president_name: formData.president_name,
            president_mobile: formData.president_mobile,
            members_count: Number(formData.members_count) || 0,
            area: formData.area,
            established_year: Number(formData.established_year) || new Date().getFullYear(),
            support_received: formData.support_received,
            events_conducted: tempEvents,
            description: formData.description,
            status: formData.status as any
        };

        try {
            if (isLocalStorageMode) {
                let updatedOrgs = [...orgs];
                if (editingOrg) {
                    updatedOrgs = updatedOrgs.map(o => o.id === editingOrg.id ? { ...orgPayload, id: editingOrg.id } : o);
                    toast.success(isMr ? 'माहिती यशस्वीरित्या सुधारली!' : 'Organization updated successfully!');
                } else {
                    const newOrg: SocialOrganization = {
                        ...orgPayload,
                        id: `org-${Date.now()}`
                    };
                    updatedOrgs = [newOrg, ...updatedOrgs];
                    toast.success(isMr ? 'नवीन संस्था यशस्वीरित्या जोडली!' : 'Organization added successfully!');
                }
                setOrgs(updatedOrgs);
                localStorage.setItem(`social_orgs_${tenantId || 'default'}`, JSON.stringify(updatedOrgs));
                setShowModal(false);
            } else {
                if (editingOrg) {
                    const { error } = await supabase
                        .from('social_organizations')
                        .update(orgPayload)
                        .eq('id', editingOrg.id);

                    if (error) throw error;
                    toast.success(isMr ? 'माहिती यशस्वीरित्या सुधारली!' : 'Organization updated successfully!');
                } else {
                    const { error } = await supabase
                        .from('social_organizations')
                        .insert([orgPayload]);

                    if (error) throw error;
                    toast.success(isMr ? 'नवीन संस्था यशस्वीरित्या जोडली!' : 'Organization added successfully!');
                }
                fetchOrgs();
                setShowModal(false);
            }
        } catch (err: any) {
            console.error('Error saving organization:', err);
            toast.error(isMr ? 'माहिती सेव्ह करताना त्रुटी आली' : 'Failed to save organization data');
        }
    };

    // Delete Organization
    const handleDelete = async (id: string) => {
        if (!window.confirm(isMr ? 'तुम्हाला खात्री आहे की ही संस्था हटवायची आहे?' : 'Are you sure you want to delete this organization?')) {
            return;
        }

        try {
            if (isLocalStorageMode) {
                const updated = orgs.filter(o => o.id !== id);
                setOrgs(updated);
                localStorage.setItem(`social_orgs_${tenantId || 'default'}`, JSON.stringify(updated));
                toast.success(isMr ? 'संस्था यशस्वीरित्या हटवली!' : 'Organization deleted successfully!');
            } else {
                const { error } = await supabase
                    .from('social_organizations')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                toast.success(isMr ? 'संस्था यशस्वीरित्या हटवली!' : 'Organization deleted successfully!');
                fetchOrgs();
            }
        } catch (err) {
            console.error('Error deleting organization:', err);
            toast.error(isMr ? 'हटवताना एरर आला' : 'Failed to delete organization');
        }
    };

    // Helpers to get specific localized labels
    const getOrgTypeName = (type: string) => {
        switch (type) {
            case 'ngo': return isMr ? 'एन.जी.ओ / सामाजिक संस्था' : 'NGO / Foundation';
            case 'sports_cricket': return isMr ? 'क्रीडा व क्रिकेट क्लब' : 'Cricket & Sports Club';
            case 'ganpati_mandal': return isMr ? 'गणेश मंडळ' : 'Ganpati Mandal';
            case 'navratri_mandal': return isMr ? 'नवरात्रौत्सव मंडळ' : 'Navratri Mandal';
            default: return isMr ? 'इतर संस्था व मंडळ' : 'Other Organization';
        }
    };

    const getOrgTheme = (type: string) => {
        switch (type) {
            case 'ngo':
                return {
                    bg: 'bg-blue-50/50',
                    border: 'border-blue-100',
                    text: 'text-blue-700',
                    iconBg: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                    accentColor: 'text-blue-800',
                    badge: 'bg-blue-100 text-blue-800 border-blue-200'
                };
            case 'sports_cricket':
                return {
                    bg: 'bg-emerald-50/50',
                    border: 'border-emerald-100',
                    text: 'text-emerald-700',
                    iconBg: 'bg-emerald-100',
                    iconColor: 'text-emerald-600',
                    accentColor: 'text-emerald-800',
                    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200'
                };
            case 'ganpati_mandal':
                return {
                    bg: 'bg-amber-50/50',
                    border: 'border-amber-100',
                    text: 'text-amber-700',
                    iconBg: 'bg-amber-100',
                    iconColor: 'text-amber-600',
                    accentColor: 'text-amber-800',
                    badge: 'bg-amber-100 text-amber-800 border-amber-200'
                };
            case 'navratri_mandal':
                return {
                    bg: 'bg-rose-50/50',
                    border: 'border-rose-100',
                    text: 'text-rose-700',
                    iconBg: 'bg-rose-100',
                    iconColor: 'text-rose-600',
                    accentColor: 'text-rose-800',
                    badge: 'bg-rose-100 text-rose-800 border-rose-200'
                };
            default:
                return {
                    bg: 'bg-slate-50/50',
                    border: 'border-slate-100',
                    text: 'text-slate-700',
                    iconBg: 'bg-slate-100',
                    iconColor: 'text-slate-600',
                    accentColor: 'text-slate-800',
                    badge: 'bg-slate-100 text-slate-850 border-slate-200'
                };
        }
    };

    const getOrgIcon = (type: string) => {
        switch (type) {
            case 'ngo': return Building2;
            case 'sports_cricket': return Activity;
            case 'ganpati_mandal': return Sparkles;
            case 'navratri_mandal': return Flag;
            default: return Heart;
        }
    };

    return (
        <div className="space-y-6">
            {/* Banner for standalone mode */}
            {isLocalStorageMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm animate-in slide-in-from-top-4 duration-300">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-amber-800">
                            {isMr ? 'स्थानिक मोड चालू (LocalStorage Fallback Active)' : 'Standalone Local Mode Active'}
                        </h4>
                        <p className="text-xs text-amber-700 leading-relaxed">
                            {isMr 
                                ? 'क्लाऊड डेटाबेसमध्ये सिंक करण्यासाठी, प्रोजेक्टच्या मुळ फोल्डरमधील `supabase_add_social_organizations.sql` फाईल मधील स्क्रिप्ट तुमच्या Supabase SQL Editor मध्ये चालवा. तोपर्यंत तुमची माहिती सुरक्षितपणे ब्राउझरमध्ये साठवली जाईल.'
                                : 'To enable secure cloud sync, copy and run the SQL migration script from `supabase_add_social_organizations.sql` in your Supabase SQL Editor. Currently, data will be stored securely inside your browser local storage.'
                            }
                        </p>
                    </div>
                </div>
            )}

            {/* Header & Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <Building2 className="w-7 h-7 text-brand-600" />
                        {isMr ? 'एन.जी.ओ., क्रीडा व सार्वजनिक मंडळ माहिती' : 'NGOs, Clubs & Mandals Registry'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                        {isMr 
                            ? 'प्रभागातील एनजीओ, क्रिकेट क्लब आणि गणपती/नवरात्र मंडळांचे व्यवस्थापन व संपर्क यादी'
                            : 'Manage details, contact persons, activities and support history for local organizations'
                        }
                    </p>
                </div>

                <button
                    onClick={handleOpenAdd}
                    className="ns-btn-primary flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-md shadow-brand-100 hover:shadow-brand-200 transition-all font-bold self-start md:self-auto"
                >
                    <Plus className="w-4 h-4" />
                    {isMr ? 'नवीन मंडळ जोडा' : 'Add New Mandal/Club'}
                </button>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stat 1 */}
                <div className="ns-card p-5 hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center shrink-0">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{isMr ? 'एकूण नोंदणीकृत' : 'Total Registered'}</span>
                        <span className="text-2xl font-black text-slate-800">{stats.total}</span>
                    </div>
                </div>

                {/* Stat 2 */}
                <div className="ns-card p-5 hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-blue-400 block uppercase tracking-wider">{isMr ? 'एकूण एनजीओ' : 'Total NGOs'}</span>
                        <span className="text-2xl font-black text-blue-800">{stats.ngos}</span>
                    </div>
                </div>

                {/* Stat 3 */}
                <div className="ns-card p-5 hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-emerald-400 block uppercase tracking-wider">{isMr ? 'क्रीडा व क्रिकेट क्लब' : 'Cricket / Sports'}</span>
                        <span className="text-2xl font-black text-emerald-800">{stats.sports}</span>
                    </div>
                </div>

                {/* Stat 4 */}
                <div className="ns-card p-5 hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-amber-400 block uppercase tracking-wider">{isMr ? 'उत्सव मंडळे' : 'Festival Mandals'}</span>
                        <span className="text-2xl font-black text-amber-800">{stats.mandals}</span>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="ns-card p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder={isMr ? 'नाव, अध्यक्ष, परिसर याद्वारे शोधा...' : 'Search by name, president, area...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    {/* Type Filters */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                        <option value="all">{isMr ? 'सर्व प्रकार' : 'All Types'}</option>
                        <option value="ngo">{isMr ? 'एन.जी.ओ / सामाजिक संस्था' : 'NGO / Foundations'}</option>
                        <option value="sports_cricket">{isMr ? 'क्रीडा व क्रिकेट क्लब' : 'Cricket & Sports Clubs'}</option>
                        <option value="ganpati_mandal">{isMr ? 'गणपती मंडळ' : 'Ganpati Mandals'}</option>
                        <option value="navratri_mandal">{isMr ? 'नवरात्रौत्सव मंडळ' : 'Navratri Mandals'}</option>
                        <option value="other">{isMr ? 'इतर संस्था व मंडळ' : 'Other'}</option>
                    </select>

                    {/* Status Filters */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                        <option value="all">{isMr ? 'सर्व स्थिती' : 'All Status'}</option>
                        <option value="Active">{isMr ? 'सक्रिय' : 'Active'}</option>
                        <option value="Inactive">{isMr ? 'निष्क्रिय' : 'Inactive'}</option>
                    </select>
                </div>
            </div>

            {/* List and Grid Container */}
            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                                </div>
                            </div>
                            <div className="h-12 bg-slate-50 rounded-xl" />
                        </div>
                    ))}
                </div>
            ) : filteredOrgs.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-medium">
                    {isMr ? 'कोणतेही मंडळ/क्लब आढळले नाहीत.' : 'No organizations or mandals found.'}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredOrgs.map((org) => {
                        const theme = getOrgTheme(org.type);
                        const IconComponent = getOrgIcon(org.type);
                        const isExpanded = expandedOrgId === org.id;

                        return (
                            <div
                                key={org.id}
                                className={`bg-white border ${theme.border} rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group`}
                            >
                                {/* Card Header */}
                                <div className={`p-4 bg-gradient-to-br ${theme.bg} border-b ${theme.border} flex items-start justify-between gap-3`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-10 h-10 ${theme.iconBg} ${theme.iconColor} rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-white/20 group-hover:scale-105 transition-transform duration-200`}>
                                            <IconComponent className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight truncate">
                                                {isMr ? (org.name_marathi || org.name) : (org.name_english || org.name)}
                                            </h3>
                                            <span className="text-[10px] font-bold text-slate-400 block mt-0.5 uppercase tracking-wide">
                                                {getOrgTypeName(org.type)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-1 shrink-0 opacity-80 hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleOpenEdit(org)}
                                            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-white rounded-lg transition-colors"
                                            title={isMr ? 'संपादन' : 'Edit'}
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(org.id)}
                                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                                            title={isMr ? 'हटवा' : 'Delete'}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-5 flex-1 space-y-4 text-xs md:text-sm">
                                    {/* Description */}
                                    {org.description && (
                                        <p className="text-slate-600 text-xs italic line-clamp-2 leading-relaxed">
                                            "{org.description}"
                                        </p>
                                    )}

                                    {/* Quick Details grid */}
                                    <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                        <div className="space-y-0.5">
                                            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">{isMr ? 'अध्यक्ष' : 'President'}</span>
                                            <span className="font-bold text-slate-700 text-xs truncate block">{org.president_name || '-'}</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">{isMr ? 'मोबाईल' : 'Mobile'}</span>
                                            {org.president_mobile ? (
                                                <div className="flex items-center gap-1">
                                                    <a 
                                                        href={`tel:${org.president_mobile}`} 
                                                        className="font-mono font-bold text-brand-600 hover:underline text-xs"
                                                    >
                                                        {org.president_mobile}
                                                    </a>
                                                    <button 
                                                        onClick={() => copyToClipboard(org.president_mobile, org.id)}
                                                        className="p-0.5 text-slate-400 hover:text-brand-600 transition-colors"
                                                    >
                                                        {copiedId === org.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                    </button>
                                                </div>
                                            ) : <span className="text-slate-400">-</span>}
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">{isMr ? 'एकूण सदस्य' : 'Members Count'}</span>
                                            <span className="font-bold text-slate-700 text-xs">{org.members_count || 0} {isMr ? 'सदस्य' : 'members'}</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">{isMr ? 'स्थापना वर्ष' : 'Est. Year'}</span>
                                            <span className="font-bold text-slate-700 text-xs font-mono">{org.established_year || '-'}</span>
                                        </div>
                                    </div>

                                    {/* Area and Status */}
                                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                                        <span className="text-slate-500 flex items-center gap-1 font-semibold truncate max-w-[70%]">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            {org.area || '-'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            org.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                        }`}>
                                            {org.status === 'Active' ? (isMr ? 'सक्रिय' : 'Active') : (isMr ? 'निष्क्रिय' : 'Inactive')}
                                        </span>
                                    </div>

                                    {/* Support received notes */}
                                    {org.support_received && (
                                        <div className="bg-violet-50/40 border border-violet-100/50 p-3 rounded-xl space-y-1">
                                            <span className="text-[9px] font-bold text-violet-700 block uppercase tracking-wider flex items-center gap-1">
                                                <Award className="w-3.5 h-3.5" />
                                                {isMr ? 'नगरसेवक मदत/प्रायोजकत्व इतिहास' : 'Nagar Sevak Support History'}
                                            </span>
                                            <p className="text-[11px] text-violet-850 font-medium leading-relaxed">
                                                {org.support_received}
                                            </p>
                                        </div>
                                    )}

                                    {/* Expand Events Button */}
                                    {org.events_conducted && org.events_conducted.length > 0 && (
                                        <button
                                            onClick={() => setExpandedOrgId(isExpanded ? null : org.id)}
                                            className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 flex items-center justify-between font-bold text-xs transition-all duration-200 shadow-sm"
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                {isMr ? `प्रमुख उपक्रम / उत्सव (${org.events_conducted.length})` : `Key Events / Festivals (${org.events_conducted.length})`}
                                            </span>
                                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                                        </button>
                                    )}

                                    {/* Expanded events details panel */}
                                    {isExpanded && org.events_conducted && (
                                        <div className="space-y-3 pl-2.5 border-l-2 border-slate-200 animate-in slide-in-from-top-2 duration-200 pt-1">
                                            {org.events_conducted.map((evt) => (
                                                <div key={evt.id} className="space-y-0.5">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="font-bold text-xs text-slate-800">
                                                            {isMr ? (evt.title_mr || evt.title) : (evt.title || evt.title_mr)}
                                                        </span>
                                                        <span className="font-mono font-bold text-[9px] bg-slate-100 text-slate-500 px-1.5 rounded-full shrink-0">
                                                            {evt.year}
                                                        </span>
                                                    </div>
                                                    {evt.description && (
                                                        <p className="text-[10px] text-slate-500 leading-normal">
                                                            {isMr ? (evt.description_mr || evt.description) : (evt.description || evt.description_mr)}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Log / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-brand-600" />
                                    {editingOrg 
                                        ? (isMr ? 'संस्थेची माहिती सुधारा' : 'Edit Organization Info') 
                                        : (isMr ? 'नवीन संस्था / मंडळ नोंदवा' : 'Log New Organization / Mandal')
                                    }
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 font-semibold">
                                    {isMr ? 'कृपया सर्व आवश्यक माहिती अचूक भरा' : 'Please input required fields correctly'}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Form Scrollable Area */}
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Name English */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-650 block uppercase tracking-wider">
                                        {isMr ? 'संस्थेचे नाव (इंग्रजी)' : 'Organization Name (English)'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name_english}
                                        onChange={(e) => setFormData({ ...formData, name_english: e.target.value })}
                                        placeholder="e.g. Shivtej Sports Club"
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    />
                                </div>

                                {/* Name Marathi */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-650 block uppercase tracking-wider">
                                        {isMr ? 'संस्थेचे नाव (मराठी)' : 'Organization Name (Marathi) *'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name_marathi}
                                        onChange={(e) => setFormData({ ...formData, name_marathi: e.target.value })}
                                        placeholder="उदा. शिवतेज क्रीडा मंडळ"
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                        required
                                    />
                                </div>

                                {/* Type selection */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-650 block uppercase tracking-wider">
                                        {isMr ? 'संस्थेचा प्रकार' : 'Organization Type'}
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    >
                                        <option value="ngo">{isMr ? 'एन.जी.ओ / सामाजिक संस्था' : 'NGO / Social Foundation'}</option>
                                        <option value="sports_cricket">{isMr ? 'क्रीडा व क्रिकेट क्लब' : 'Cricket & Sports Club'}</option>
                                        <option value="ganpati_mandal">{isMr ? 'सार्वजनिक गणेश उत्सव मंडळ' : 'Ganpati Mandal'}</option>
                                        <option value="navratri_mandal">{isMr ? 'सार्वजनिक नवरात्र उत्सव मंडळ' : 'Navratri Mandal'}</option>
                                        <option value="other">{isMr ? 'इतर संस्था व मंडळ' : 'Other'}</option>
                                    </select>
                                </div>

                                {/* Area */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-650 block uppercase tracking-wider">
                                        {isMr ? 'परिसर / प्रभाग क्षेत्र' : 'Area / Ward'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.area}
                                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                        placeholder={isMr ? 'उदा. नेहरू चौक' : 'e.g. Nehru Chowk'}
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    />
                                </div>

                                {/* President / Key Contact */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-650 block uppercase tracking-wider">
                                        {isMr ? 'प्रमुख व्यक्ती / अध्यक्ष नाव' : 'President / Contact Person'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.president_name}
                                        onChange={(e) => setFormData({ ...formData, president_name: e.target.value })}
                                        placeholder={isMr ? 'उदा. सचिन कदम' : 'e.g. Sachin Kadam'}
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    />
                                </div>

                                {/* President Mobile */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-650 block uppercase tracking-wider">
                                        {isMr ? 'मोबाईल नंबर' : 'Mobile Number'}
                                    </label>
                                    <input
                                        type="tel"
                                        maxLength={10}
                                        value={formData.president_mobile}
                                        onChange={(e) => setFormData({ ...formData, president_mobile: e.target.value })}
                                        placeholder="98xxxxxxxx"
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                                    />
                                </div>

                                {/* Member counts */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-650 block uppercase tracking-wider">
                                        {isMr ? 'सदस्य संख्या (अंदाजे)' : 'Members Count (Approx)'}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.members_count}
                                        onChange={(e) => setFormData({ ...formData, members_count: e.target.value })}
                                        placeholder="e.g. 50"
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                                    />
                                </div>

                                {/* Established Year */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-650 block uppercase tracking-wider">
                                        {isMr ? 'स्थापना वर्ष' : 'Established Year'}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.established_year}
                                        onChange={(e) => setFormData({ ...formData, established_year: e.target.value })}
                                        placeholder="e.g. 2020"
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                                    />
                                </div>
                            </div>

                            {/* Status and Support received */}
                            <div className="space-y-4 border-t border-slate-100 pt-4">
                                {/* Support received from Nagar Sevak */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-650 block uppercase tracking-wider flex items-center gap-1.5">
                                        <Award className="w-4 h-4 text-violet-600" />
                                        {isMr ? 'आपल्या वतीने मिळालेली मदत / प्रायोजकत्व (Nagar Sevak Support History)' : 'Support Provided by You (Nagar Sevak Support)'}
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formData.support_received}
                                        onChange={(e) => setFormData({ ...formData, support_received: e.target.value })}
                                        placeholder={isMr ? 'उदा. क्रिकेट किट वाटप केले किंवा मंडप घालण्यास आर्थिक मदत पुरवली...' : 'e.g. Funded Ganesh pandal sound system, distributed cricket kits, etc.'}
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    />
                                </div>

                                {/* Description / Details */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-650 block uppercase tracking-wider">
                                        {isMr ? 'संस्थेची थोडक्यात माहिती / टिपण' : 'General Notes / Description'}
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder={isMr ? 'संस्थेचे सामाजिक उद्देश किंवा इतर माहिती...' : 'A brief description of goals, works or comments...'}
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    />
                                </div>

                                {/* Active status selection */}
                                <div className="flex items-center gap-6">
                                    <span className="text-xs font-bold text-slate-650 block uppercase tracking-wider">{isMr ? 'संस्थेची स्थिती' : 'Status'}</span>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="status"
                                                value="Active"
                                                checked={formData.status === 'Active'}
                                                onChange={() => setFormData({ ...formData, status: 'Active' })}
                                                className="w-4 h-4 text-brand-600 border-slate-350 focus:ring-brand-500"
                                            />
                                            <span className="text-sm font-semibold text-slate-700">{isMr ? 'सक्रिय (Active)' : 'Active'}</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="status"
                                                value="Inactive"
                                                checked={formData.status === 'Inactive'}
                                                onChange={() => setFormData({ ...formData, status: 'Inactive' })}
                                                className="w-4 h-4 text-brand-600 border-slate-350 focus:ring-brand-500"
                                            />
                                            <span className="text-sm font-semibold text-slate-700">{isMr ? 'निष्क्रिय (Inactive)' : 'Inactive'}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Event log subsection */}
                            <div className="space-y-4 border-t border-slate-100 pt-4">
                                <h4 className="text-xs font-bold text-slate-650 uppercase tracking-wider flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-slate-500" />
                                    {isMr ? 'प्रमुख उपक्रम / उत्सव लॉग करा (Events Conducted)' : 'Log Major Events & Programs'}
                                </h4>

                                {/* Existing logged events list in modal */}
                                {tempEvents.length > 0 && (
                                    <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 max-h-40 overflow-y-auto">
                                        {tempEvents.map((evt) => (
                                            <div key={evt.id} className="flex items-center justify-between gap-3 text-xs bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                                <div className="min-w-0">
                                                    <span className="font-bold text-slate-800">
                                                        {isMr ? (evt.title_mr || evt.title) : (evt.title || evt.title_mr)}
                                                    </span>
                                                    <span className="font-mono text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded ml-2 font-bold">{evt.year}</span>
                                                    {evt.description && (
                                                        <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-sm">
                                                            {isMr ? (evt.description_mr || evt.description) : (evt.description || evt.description_mr)}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveEvent(evt.id)}
                                                    className="p-1 text-slate-450 hover:text-red-650 hover:bg-slate-50 rounded-md transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Inputs to add new event */}
                                <div className="bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="space-y-0.5">
                                            <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">{isMr ? 'उत्सवाचे/कार्यक्रमाचे नाव (इंग्रजी)' : 'Event Title (Eng)'}</label>
                                            <input
                                                type="text"
                                                value={newEventData.title}
                                                onChange={(e) => setNewEventData({ ...newEventData, title: e.target.value })}
                                                placeholder="e.g. Cricket League 2026"
                                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                                            />
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">{isMr ? 'कार्यक्रमाचे नाव (मराठी)' : 'Event Title (Mar)'}</label>
                                            <input
                                                type="text"
                                                value={newEventData.title_mr}
                                                onChange={(e) => setNewEventData({ ...newEventData, title_mr: e.target.value })}
                                                placeholder="उदा. भव्य क्रिकेट लीग २०२६"
                                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                                            />
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">{isMr ? 'वर्ष' : 'Year'}</label>
                                            <input
                                                type="number"
                                                value={newEventData.year}
                                                onChange={(e) => setNewEventData({ ...newEventData, year: Number(e.target.value) })}
                                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">{isMr ? 'थोडक्यात वर्णन' : 'Brief Details'}</label>
                                        <input
                                            type="text"
                                            value={newEventData.description_mr}
                                            onChange={(e) => setNewEventData({ ...newEventData, description_mr: e.target.value, description: e.target.value })}
                                            placeholder={isMr ? 'उदा. ५० संघांचा सहभाग, १ लाखांचे बक्षीस' : 'e.g. 50 teams participated, local trophy'}
                                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddEvent}
                                        className="py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1 mt-1 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        {isMr ? 'हा कार्यक्रम जोडा' : 'Add Event'}
                                    </button>
                                </div>
                            </div>

                            {/* Form Footer */}
                            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/30 -mx-6 -mb-6 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-all"
                                >
                                    {isMr ? 'रद्द करा' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    className="py-2.5 px-5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-brand-100 hover:shadow-brand-200"
                                >
                                    {isMr ? 'माहिती जतन करा' : 'Save Details'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocialOrganizations;
