import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { toast } from 'sonner';
import { 
    Home, Users, Search, Plus, Phone, MapPin, 
    Trash2, Edit2, X, Copy, Check, Info, Award, 
    ChevronDown, ChevronUp, FileText, CheckCircle2,
    Activity, Building2, TrendingUp, UsersRound
} from 'lucide-react';

interface HousingSociety {
    id: string;
    tenant_id: string;
    name: string;
    name_marathi?: string;
    name_english?: string;
    chairman_name: string;
    chairman_mobile: string;
    secretary_name: string;
    secretary_mobile: string;
    voter_count: number;
    favourable_voter_count: number;
    area: string;
    address: string;
    notes: string;
    status: 'Active' | 'Inactive';
    created_at?: string;
}

const DEFAULT_SOCIETIES: HousingSociety[] = [
    {
        id: 'soc-1',
        tenant_id: '00000000-0000-0000-0000-000000000000',
        name: 'गोकुळधाम सहकारी गृहनिर्माण संस्था',
        name_marathi: 'गोकुळधाम सहकारी गृहनिर्माण संस्था',
        name_english: 'Gokuldham Co-operative Housing Society',
        chairman_name: 'अशोक भिडे',
        chairman_mobile: '9867543210',
        secretary_name: 'आत्माराम भिडे',
        secretary_mobile: '9820123456',
        voter_count: 120,
        favourable_voter_count: 85,
        area: 'शांती नगर (Shanti Nagar)',
        address: 'प्लॉट क्र. १२, शांती नगर, प्रभाग क्र. ५',
        notes: 'सोसायटीमधील अंतर्गत रस्ते डांबरीकरण करणे आवश्यक आहे. पाणीपुरवठ्याचा दाब कमी आहे. (Internal roads need asphalt layering. Water pressure is low.)',
        status: 'Active'
    },
    {
        id: 'soc-2',
        tenant_id: '00000000-0000-0000-0000-000000000000',
        name: 'पंचशील हाईट्स',
        name_marathi: 'पंचशील हाईट्स',
        name_english: 'Panchsheel Heights',
        chairman_name: 'आनंद देशपांडे',
        chairman_mobile: '9988776655',
        secretary_name: 'विक्रम साळुंखे',
        secretary_mobile: '9850123987',
        voter_count: 210,
        favourable_voter_count: 140,
        area: 'शास्त्री नगर चौक (Shastri Nagar Chowk)',
        address: 'पंचशील नगर, प्रभाग क्र. ५, शास्त्री नगर',
        notes: 'सोसायटी गेटजवळ कचरा कुंडी हटवून सुशोभीकरण हवे आहे. स्ट्रीट लाईट बंद आहेत. (Request to beautify society gate area. Streetlights are non-functional.)',
        status: 'Active'
    },
    {
        id: 'soc-3',
        tenant_id: '00000000-0000-0000-0000-000000000000',
        name: 'सिद्धांचल रेसिडेन्सी',
        name_marathi: 'सिद्धांचल रेसिडेन्सी',
        name_english: 'Siddhachal Residency',
        chairman_name: 'चंद्रकांत पाटील',
        chairman_mobile: '9765432109',
        secretary_name: 'राजेश शहा',
        secretary_mobile: '9922334455',
        voter_count: 95,
        favourable_voter_count: 50,
        area: 'नेहरू चौक (Nehru Chowk)',
        address: 'गल्ली क्र. ३, नेहरू चौक प्रभाग',
        notes: 'पावसाळी गटारांचे चेंबर साफ करणे आवश्यक आहे. (Rainwater drainage chambers need cleaning.)',
        status: 'Active'
    },
    {
        id: 'soc-4',
        tenant_id: '00000000-0000-0000-0000-000000000000',
        name: 'गंगा आशियाना सोसायटी',
        name_marathi: 'गंगा आशियाना सोसायटी',
        name_english: 'Ganga Asiana Society',
        chairman_name: 'सुरेश जाधव',
        chairman_mobile: '9123456789',
        secretary_name: 'नितीन सरनाईक',
        secretary_mobile: '9654321987',
        voter_count: 320,
        favourable_voter_count: 245,
        area: 'संजय नगर (Sanjay Nagar)',
        address: 'सर्व्हे क्र. ८८, संजय नगर रस्ता',
        notes: 'सोसायटी आवारात नवीन ज्येष्ठ नागरिक कोपरा आणि ओपन जिम बसवून दिल्याबद्दल आभार. (Thankful for installing open gym & senior citizens corner.)',
        status: 'Active'
    },
    {
        id: 'soc-5',
        tenant_id: '00000000-0000-0000-0000-000000000000',
        name: 'साई श्रद्धा रेसिडेन्सी',
        name_marathi: 'साई श्रद्धा रेसिडेन्सी',
        name_english: 'Sai Shraddha Residency',
        chairman_name: 'रमेश कुंटे',
        chairman_mobile: '9012345678',
        secretary_name: 'अमोल शिंदे',
        secretary_mobile: '9890123456',
        voter_count: 65,
        favourable_voter_count: 45,
        area: 'हनुमान आळी (Hanuman Ali)',
        address: 'हनुमान मंदिराच्या मागे, प्रभाग क्र. ५',
        notes: 'पाणी सोडण्याची वेळ नियमित हवी आहे. (Water supply timings need to be regularized.)',
        status: 'Active'
    },
    {
        id: 'soc-6',
        tenant_id: '00000000-0000-0000-0000-000000000000',
        name: 'ग्रीन फिल्ड रेसिडेन्सी',
        name_marathi: 'ग्रीन फिल्ड रेसिडेन्सी',
        name_english: 'Green Field Residency',
        chairman_name: 'दिनेश कामत',
        chairman_mobile: '9422334455',
        secretary_name: 'सुहास जोशी',
        secretary_mobile: '9860123450',
        voter_count: 150,
        favourable_voter_count: 75,
        area: 'गांधी मैदान परिसर (Gandhi Maidan Area)',
        address: 'गांधी मैदान जवळ, प्रभाग क्र. ५',
        notes: 'सीसीटीव्ही कॅमेरे लावण्यासाठी महापालिका निधी हवा आहे. (Requesting corporation funds for CCTV installations.)',
        status: 'Active'
    }
];

const HousingSocieties = () => {
    const { language } = useLanguage();
    const { tenantId } = useTenant();
    const isMr = language === 'mr';

    const [societies, setSocieties] = useState<HousingSociety[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLocalStorageMode, setIsLocalStorageMode] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Search and filters
    const [searchQuery, setSearchQuery] = useState('');
    const [areaFilter, setAreaFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modals & Form State
    const [showModal, setShowModal] = useState(false);
    const [editingSoc, setEditingSoc] = useState<HousingSociety | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        name_marathi: '',
        name_english: '',
        chairman_name: '',
        chairman_mobile: '',
        secretary_name: '',
        secretary_mobile: '',
        voter_count: '',
        favourable_voter_count: '',
        area: '',
        address: '',
        notes: '',
        status: 'Active'
    });

    const fetchSocieties = async () => {
        setLoading(true);
        try {
            // First check database table
            const { data, error } = await supabase
                .from('housing_societies')
                .select('*')
                .eq('tenant_id', tenantId || '00000000-0000-0000-0000-000000000000')
                .order('created_at', { ascending: false });

            if (error) {
                if (error.code === 'PGRST116' || error.message.includes('relation "public.housing_societies" does not exist')) {
                    throw new Error('Table does not exist');
                }
                throw error;
            }

            setSocieties(data || []);
            setIsLocalStorageMode(false);
        } catch (err) {
            console.log('Falling back to Local Storage mode for Housing Societies due to:', err);
            setIsLocalStorageMode(true);
            
            const stored = localStorage.getItem(`housing_socs_${tenantId || 'default'}`);
            if (stored) {
                try {
                    setSocieties(JSON.parse(stored));
                } catch {
                    setSocieties(DEFAULT_SOCIETIES);
                    localStorage.setItem(`housing_socs_${tenantId || 'default'}`, JSON.stringify(DEFAULT_SOCIETIES));
                }
            } else {
                setSocieties(DEFAULT_SOCIETIES);
                localStorage.setItem(`housing_socs_${tenantId || 'default'}`, JSON.stringify(DEFAULT_SOCIETIES));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSocieties();
    }, [tenantId]);

    // Handle Mobile Copy
    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success(isMr ? 'मोबाईल नंबर कॉपी केला!' : 'Mobile number copied!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Filter Logic
    const filteredSocieties = societies.filter(soc => {
        const searchText = `${soc.name} ${soc.name_english || ''} ${soc.name_marathi || ''} ${soc.chairman_name} ${soc.secretary_name} ${soc.area}`.toLowerCase();
        const matchesSearch = searchText.includes(searchQuery.toLowerCase());
        const matchesArea = areaFilter === 'all' || soc.area.toLowerCase().includes(areaFilter.toLowerCase());
        const matchesStatus = statusFilter === 'all' || soc.status === statusFilter;
        return matchesSearch && matchesArea && matchesStatus;
    });

    // Unique Areas for filters
    const uniqueAreas = Array.from(new Set(societies.map(s => s.area))).filter(Boolean);

    // Stats calculations
    const stats = {
        total: filteredSocieties.length,
        voters: filteredSocieties.reduce((acc, s) => acc + (s.voter_count || 0), 0),
        favourable: filteredSocieties.reduce((acc, s) => acc + (s.favourable_voter_count || 0), 0),
        supportPercent: filteredSocieties.reduce((acc, s) => acc + (s.voter_count || 0), 0) > 0 
            ? Math.round((filteredSocieties.reduce((acc, s) => acc + (s.favourable_voter_count || 0), 0) / filteredSocieties.reduce((acc, s) => acc + (s.voter_count || 0), 0)) * 100) 
            : 0
    };

    // Open Add modal
    const handleOpenAdd = () => {
        setEditingSoc(null);
        setFormData({
            name: '',
            name_marathi: '',
            name_english: '',
            chairman_name: '',
            chairman_mobile: '',
            secretary_name: '',
            secretary_mobile: '',
            voter_count: '',
            favourable_voter_count: '',
            area: '',
            address: '',
            notes: '',
            status: 'Active'
        });
        setShowModal(true);
    };

    // Open Edit modal
    const handleOpenEdit = (soc: HousingSociety) => {
        setEditingSoc(soc);
        setFormData({
            name: soc.name,
            name_marathi: soc.name_marathi || '',
            name_english: soc.name_english || '',
            chairman_name: soc.chairman_name || '',
            chairman_mobile: soc.chairman_mobile || '',
            secretary_name: soc.secretary_name || '',
            secretary_mobile: soc.secretary_mobile || '',
            voter_count: String(soc.voter_count || ''),
            favourable_voter_count: String(soc.favourable_voter_count || ''),
            area: soc.area || '',
            address: soc.address || '',
            notes: soc.notes || '',
            status: soc.status || 'Active'
        });
        setShowModal(true);
    };

    // Save Form
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const nameMain = formData.name_marathi || formData.name_english || formData.name;
        if (!nameMain) {
            toast.error(isMr ? 'कृपया सोसायटीचे नाव टाका' : 'Please enter society name');
            return;
        }

        const vCount = Number(formData.voter_count) || 0;
        const favCount = Number(formData.favourable_voter_count) || 0;

        if (favCount > vCount) {
            toast.error(isMr ? 'फेवर मतदार संख्या एकूण मतदार संख्येपेक्षा जास्त असू शकत नाही!' : 'Favourable voters cannot exceed total voters!');
            return;
        }

        const payload: Omit<HousingSociety, 'id'> = {
            tenant_id: tenantId || '00000000-0000-0000-0000-000000000000',
            name: nameMain,
            name_marathi: formData.name_marathi || nameMain,
            name_english: formData.name_english || nameMain,
            chairman_name: formData.chairman_name,
            chairman_mobile: formData.chairman_mobile,
            secretary_name: formData.secretary_name,
            secretary_mobile: formData.secretary_mobile,
            voter_count: vCount,
            favourable_voter_count: favCount,
            area: formData.area,
            address: formData.address,
            notes: formData.notes,
            status: formData.status as any
        };

        try {
            if (isLocalStorageMode) {
                let updated = [...societies];
                if (editingSoc) {
                    updated = updated.map(s => s.id === editingSoc.id ? { ...payload, id: editingSoc.id } : s);
                    toast.success(isMr ? 'माहिती यशस्वीरित्या बदलली!' : 'Society updated successfully!');
                } else {
                    const newSoc: HousingSociety = {
                        ...payload,
                        id: `soc-${Date.now()}`
                    };
                    updated = [newSoc, ...updated];
                    toast.success(isMr ? 'नवीन सोसायटी नोंदणी यशस्वी झाली!' : 'Society registered successfully!');
                }
                setSocieties(updated);
                localStorage.setItem(`housing_socs_${tenantId || 'default'}`, JSON.stringify(updated));
                setShowModal(false);
            } else {
                if (editingSoc) {
                    const { error } = await supabase
                        .from('housing_societies')
                        .update(payload)
                        .eq('id', editingSoc.id);

                    if (error) throw error;
                    toast.success(isMr ? 'माहिती यशस्वीरित्या बदलली!' : 'Society updated successfully!');
                } else {
                    const { error } = await supabase
                        .from('housing_societies')
                        .insert([payload]);

                    if (error) throw error;
                    toast.success(isMr ? 'नवीन सोसायटी नोंदणी यशस्वी झाली!' : 'Society registered successfully!');
                }
                fetchSocieties();
                setShowModal(false);
            }
        } catch (err) {
            console.error('Error saving housing society:', err);
            toast.error(isMr ? 'माहिती जतन करताना चूक झाली' : 'Failed to save society details');
        }
    };

    // Delete Society
    const handleDelete = async (id: string) => {
        if (!window.confirm(isMr ? 'तुम्हाला खात्री आहे की ही सोसायटी हटवायची आहे?' : 'Are you sure you want to delete this housing society?')) {
            return;
        }

        try {
            if (isLocalStorageMode) {
                const updated = societies.filter(s => s.id !== id);
                setSocieties(updated);
                localStorage.setItem(`housing_socs_${tenantId || 'default'}`, JSON.stringify(updated));
                toast.success(isMr ? 'सोसायटी यशस्वीरित्या हटवली!' : 'Society deleted successfully!');
            } else {
                const { error } = await supabase
                    .from('housing_societies')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                toast.success(isMr ? 'सोसायटी यशस्वीरित्या हटवली!' : 'Society deleted successfully!');
                fetchSocieties();
            }
        } catch (err) {
            console.error('Error deleting society:', err);
            toast.error(isMr ? 'हटवताना एरर आला' : 'Failed to delete society');
        }
    };

    return (
        <div className="space-y-6">
            {/* Fallback Banner */}
            {isLocalStorageMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm animate-in slide-in-from-top-4 duration-300">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-amber-800">
                            {isMr ? 'सोसायटी रजिस्टर - स्थानिक मोड सक्रिय (LocalStorage Mode)' : 'Housing Registry - Standalone Mode Active'}
                        </h4>
                        <p className="text-xs text-amber-700 leading-relaxed">
                            {isMr 
                                ? 'डेटाबेस सिंक्रोनाइझेशन चालू करण्यासाठी, तुमच्या मुख्य प्रोजेक्ट मधील `supabase_add_housing_societies.sql` फाईल मधील स्क्रिप्ट तुमच्या Supabase SQL Editor मध्ये रन करा. तोपर्यंत सर्व माहिती ब्राउझरमध्ये सुरक्षितपणे साठवली जाईल.'
                                : 'To enable secure database synchronization, run the SQL script from `supabase_add_housing_societies.sql` inside your Supabase SQL Editor. Currently, data will be stored securely inside your browser LocalStorage.'
                            }
                        </p>
                    </div>
                </div>
            )}

            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <Home className="w-7 h-7 text-brand-600" />
                        {isMr ? 'सोसायटी, अध्यक्ष-सचिव व मतदार माहिती' : 'Housing Societies Chairman & Voter Registry'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                        {isMr 
                            ? 'सहकारी गृहनिर्माण सोसायट्यांचे चेअरमन, सेक्रेटरी संपर्क आणि मतदार संख्यांचे विश्लेषण'
                            : 'Track housing society executives, contact details, total voter count, and favourable support metric'
                        }
                    </p>
                </div>

                <button
                    onClick={handleOpenAdd}
                    className="ns-btn-primary flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-md shadow-brand-100 hover:shadow-brand-200 transition-all font-bold self-start md:self-auto"
                >
                    <Plus className="w-4 h-4" />
                    {isMr ? 'नवीन सोसायटी नोंदवा' : 'Register New Society'}
                </button>
            </div>

            {/* Stats widgets */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Societies */}
                <div className="ns-card p-5 hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{isMr ? 'एकूण सोसायट्या' : 'Total Societies'}</span>
                        <span className="text-2xl font-black text-slate-800">{stats.total}</span>
                    </div>
                </div>

                {/* Total Voters */}
                <div className="ns-card p-5 hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                        <UsersRound className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-blue-400 block uppercase tracking-wider">{isMr ? 'एकूण मतदार' : 'Total Voters'}</span>
                        <span className="text-2xl font-black text-blue-800">{stats.voters}</span>
                    </div>
                </div>

                {/* Favourable Voters */}
                <div className="ns-card p-5 hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-emerald-400 block uppercase tracking-wider">{isMr ? 'फेवर मतदार' : 'Favourable Voters'}</span>
                        <span className="text-2xl font-black text-emerald-800">{stats.favourable}</span>
                    </div>
                </div>

                {/* Average Support */}
                <div className="ns-card p-5 hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center shrink-0">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-brand-400 block uppercase tracking-wider">{isMr ? 'अंदाजे पाठिंबा' : 'Support Rating'}</span>
                        <span className="text-2xl font-black text-brand-850">{stats.supportPercent}%</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="ns-card p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder={isMr ? 'सोसायटीचे नाव, अध्यक्ष, सचिव किंवा परिसर याद्वारे शोधा...' : 'Search by society, chairman, secretary, area...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="ns-input pl-9 w-full py-2"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    {/* Area filter */}
                    <select
                        value={areaFilter}
                        onChange={(e) => setAreaFilter(e.target.value)}
                        className="ns-input py-2 px-3 text-xs font-semibold text-slate-700 w-auto bg-white"
                    >
                        <option value="all">{isMr ? 'सर्व परिसर' : 'All Areas'}</option>
                        {uniqueAreas.map((area, idx) => (
                            <option key={idx} value={area}>{area}</option>
                        ))}
                    </select>

                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="ns-input py-2 px-3 text-xs font-semibold text-slate-700 w-auto bg-white"
                    >
                        <option value="all">{isMr ? 'सर्व स्थिती' : 'All Status'}</option>
                        <option value="Active">{isMr ? 'सक्रिय' : 'Active'}</option>
                        <option value="Inactive">{isMr ? 'निष्क्रिय' : 'Inactive'}</option>
                    </select>
                </div>
            </div>

            {/* Grid display */}
            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="ns-card p-5 space-y-4 animate-pulse">
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
            ) : filteredSocieties.length === 0 ? (
                <div className="ns-card p-12 text-center text-slate-500 font-medium">
                    {isMr ? 'कोणतीही सोसायटी सापडली नाही.' : 'No housing societies found.'}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredSocieties.map((soc) => {
                        const supportPercent = soc.voter_count > 0 
                            ? Math.round((soc.favourable_voter_count / soc.voter_count) * 100) 
                            : 0;

                        return (
                            <div
                                key={soc.id}
                                className="ns-card hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group"
                            >
                                {/* Header banner */}
                                <div className="p-4 bg-gradient-to-br from-indigo-50/50 to-white border-b border-slate-100 flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-white group-hover:scale-105 transition-transform duration-200">
                                            <Home className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight truncate">
                                                {isMr ? (soc.name_marathi || soc.name) : (soc.name_english || soc.name)}
                                            </h3>
                                            <span className="text-[10px] font-bold text-slate-400 block mt-0.5 uppercase tracking-wide">
                                                {isMr ? 'सहकारी गृहनिर्माण संस्था' : 'Co-operative Housing Society'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-1 shrink-0 opacity-85">
                                        <button
                                            onClick={() => handleOpenEdit(soc)}
                                            className="p-1.5 text-slate-500 hover:text-brand-650 hover:bg-slate-50 rounded-lg transition-colors"
                                            title={isMr ? 'संपादन' : 'Edit'}
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(soc.id)}
                                            className="p-1.5 text-slate-500 hover:text-red-650 hover:bg-slate-50 rounded-lg transition-colors"
                                            title={isMr ? 'हटवा' : 'Delete'}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-5 flex-1 space-y-4 text-xs md:text-sm">
                                    {/* Chairman / Secretary contacts block */}
                                    <div className="grid grid-cols-1 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        {/* Chairman */}
                                        <div className="flex items-center justify-between gap-3 text-xs">
                                            <div>
                                                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">{isMr ? 'चेअरमन' : 'Chairman'}</span>
                                                <span className="font-bold text-slate-750">{soc.chairman_name || '-'}</span>
                                            </div>
                                            {soc.chairman_mobile ? (
                                                <div className="flex items-center gap-1.5">
                                                    <a 
                                                        href={`tel:${soc.chairman_mobile}`}
                                                        className="font-mono font-bold text-indigo-600 hover:underline text-xs"
                                                    >
                                                        {soc.chairman_mobile}
                                                    </a>
                                                    <button 
                                                        onClick={() => copyToClipboard(soc.chairman_mobile, `${soc.id}-c`)}
                                                        className="p-0.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                                    >
                                                        {copiedId === `${soc.id}-c` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                    </button>
                                                </div>
                                            ) : <span className="text-slate-400">-</span>}
                                        </div>

                                        {/* Secretary */}
                                        <div className="flex items-center justify-between gap-3 text-xs border-t border-slate-200/60 pt-2">
                                            <div>
                                                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">{isMr ? 'सेक्रेटरी' : 'Secretary'}</span>
                                                <span className="font-bold text-slate-750">{soc.secretary_name || '-'}</span>
                                            </div>
                                            {soc.secretary_mobile ? (
                                                <div className="flex items-center gap-1.5">
                                                    <a 
                                                        href={`tel:${soc.secretary_mobile}`}
                                                        className="font-mono font-bold text-indigo-600 hover:underline text-xs"
                                                    >
                                                        {soc.secretary_mobile}
                                                    </a>
                                                    <button 
                                                        onClick={() => copyToClipboard(soc.secretary_mobile, `${soc.id}-s`)}
                                                        className="p-0.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                                    >
                                                        {copiedId === `${soc.id}-s` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                    </button>
                                                </div>
                                            ) : <span className="text-slate-400">-</span>}
                                        </div>
                                    </div>

                                    {/* Voter Progress Bar and counts */}
                                    <div className="space-y-2 bg-indigo-50/[0.15] p-3.5 rounded-xl border border-indigo-100/50">
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="text-slate-600">{isMr ? 'एकूण मतदार' : 'Total Voters'}</span>
                                            <span className="font-mono text-slate-800 text-sm">{soc.voter_count || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="text-emerald-700 flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                {isMr ? 'फेवर मतदार' : 'Favourable Support'}
                                            </span>
                                            <span className="font-mono text-emerald-700 text-sm">{soc.favourable_voter_count || 0}</span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-1 pt-1.5">
                                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                                                <span>{isMr ? 'पाठिंबा प्रमाण' : 'Support Rating'}</span>
                                                <span className="text-emerald-700 font-extrabold">{supportPercent}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner">
                                                <div 
                                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-sm"
                                                    style={{ width: `${supportPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ward / Area and status */}
                                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                                        <span className="text-slate-500 flex items-center gap-1 font-semibold truncate max-w-[70%]">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            {soc.area || '-'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            soc.status === 'Active' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-600 border border-slate-250'
                                        }`}>
                                            {soc.status === 'Active' ? (isMr ? 'सक्रिय' : 'Active') : (isMr ? 'निष्क्रिय' : 'Inactive')}
                                        </span>
                                    </div>

                                    {/* Notes / Issues */}
                                    {soc.notes && (
                                        <div className="bg-amber-50/40 border border-amber-100/50 p-3 rounded-xl space-y-1">
                                            <span className="text-[9px] font-bold text-amber-700 block uppercase tracking-wider flex items-center gap-1.5">
                                                <Info className="w-3.5 h-3.5" />
                                                {isMr ? 'महत्वाच्या समस्या / टिप्पण्या' : 'Key Issues / Notes'}
                                            </span>
                                            <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                                                {soc.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal logs add/edit */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Home className="w-5 h-5 text-indigo-650" />
                                    {editingSoc 
                                        ? (isMr ? 'सोसायटी माहिती सुधारणा' : 'Edit Society Details') 
                                        : (isMr ? 'नवीन सोसायटीची नोंदणी करा' : 'Register New Housing Society')
                                    }
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 font-semibold">
                                    {isMr ? 'चेअरमन, सेक्रेटरी संपर्क व मतदार संख्यांची नोंद करा' : 'Input executive contacts and voter metric data'}
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
                                        {isMr ? 'सोसायटीचे नाव (इंग्रजी)' : 'Society Name (English)'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name_english}
                                        onChange={(e) => setFormData({ ...formData, name_english: e.target.value })}
                                        placeholder="e.g. Gokuldham CHS"
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>

                                {/* Name Marathi */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-650 block uppercase tracking-wider">
                                        {isMr ? 'सोसायटीचे नाव (मराठी) *' : 'Society Name (Marathi) *'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name_marathi}
                                        onChange={(e) => setFormData({ ...formData, name_marathi: e.target.value })}
                                        placeholder="उदा. गोकुळधाम सोसायटी"
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        required
                                    />
                                </div>

                                {/* Area */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-650 block uppercase tracking-wider">
                                        {isMr ? 'परिसर / गल्ली भाग' : 'Area / Neighborhood'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.area}
                                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                        placeholder={isMr ? 'उदा. शांती नगर' : 'e.g. Shanti Nagar'}
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>

                                {/* Address */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-650 block uppercase tracking-wider">
                                        {isMr ? 'सोसायटी पत्ता' : 'Detailed Address'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder={isMr ? 'उदा. प्लॉट १२, रोड ५' : 'e.g. Plot 12, Road 5'}
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>

                                {/* Chairman Name */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-650 block uppercase tracking-wider">
                                        {isMr ? 'चेअरमन नाव' : 'Chairman Name'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.chairman_name}
                                        onChange={(e) => setFormData({ ...formData, chairman_name: e.target.value })}
                                        placeholder="e.g. Ashok Bhide"
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>

                                {/* Chairman Mobile */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-650 block uppercase tracking-wider">
                                        {isMr ? 'चेअरमन मोबाईल' : 'Chairman Mobile'}
                                    </label>
                                    <input
                                        type="tel"
                                        maxLength={10}
                                        value={formData.chairman_mobile}
                                        onChange={(e) => setFormData({ ...formData, chairman_mobile: e.target.value })}
                                        placeholder="98xxxxxxxx"
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                                    />
                                </div>

                                {/* Secretary Name */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-650 block uppercase tracking-wider">
                                        {isMr ? 'सेक्रेटरी नाव' : 'Secretary Name'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.secretary_name}
                                        onChange={(e) => setFormData({ ...formData, secretary_name: e.target.value })}
                                        placeholder="e.g. Aatmaram Bhide"
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>

                                {/* Secretary Mobile */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-650 block uppercase tracking-wider">
                                        {isMr ? 'सेक्रेटरी मोबाईल' : 'Secretary Mobile'}
                                    </label>
                                    <input
                                        type="tel"
                                        maxLength={10}
                                        value={formData.secretary_mobile}
                                        onChange={(e) => setFormData({ ...formData, secretary_mobile: e.target.value })}
                                        placeholder="98xxxxxxxx"
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                                    />
                                </div>

                                {/* Total Voters */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-650 block uppercase tracking-wider">
                                        {isMr ? 'एकूण मतदार संख्या' : 'Total Voters Count'}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.voter_count}
                                        onChange={(e) => setFormData({ ...formData, voter_count: e.target.value })}
                                        placeholder="e.g. 150"
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                                    />
                                </div>

                                {/* Favourable Voters */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-650 block uppercase tracking-wider">
                                        {isMr ? 'फेवर मतदार संख्या (आपले समर्थक)' : 'Favourable Voters Count'}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.favourable_voter_count}
                                        onChange={(e) => setFormData({ ...formData, favourable_voter_count: e.target.value })}
                                        placeholder="e.g. 100"
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                                    />
                                </div>
                            </div>

                            {/* Textarea for issues */}
                            <div className="space-y-4 border-t border-slate-100 pt-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-650 block uppercase tracking-wider">
                                        {isMr ? 'सोसायटीमधील प्रमुख समस्या / विशेष नोंदी' : 'Society Grievances / Special Notes'}
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder={isMr ? 'उदा. कचरा समस्या, पाणी वेळेवर न मिळणे, रस्ते खराब असणे...' : 'e.g. Potholes on entryway, streetlights non-functional, water line needs work...'}
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>

                                {/* Active Inactive status */}
                                <div className="flex items-center gap-6">
                                    <span className="text-xs font-bold text-slate-650 block uppercase tracking-wider">{isMr ? 'सोसायटी स्थिती' : 'Status'}</span>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="status"
                                                value="Active"
                                                checked={formData.status === 'Active'}
                                                onChange={() => setFormData({ ...formData, status: 'Active' })}
                                                className="w-4 h-4 text-indigo-650 border-slate-350 focus:ring-indigo-550"
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
                                                className="w-4 h-4 text-indigo-650 border-slate-350 focus:ring-indigo-550"
                                            />
                                            <span className="text-sm font-semibold text-slate-700">{isMr ? 'निष्क्रिय (Inactive)' : 'Inactive'}</span>
                                        </label>
                                    </div>
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

export default HousingSocieties;
