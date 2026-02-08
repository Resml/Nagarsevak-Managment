import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { type ComplaintType, type Voter } from '../../types';
import { ArrowLeft, Camera, X, Sparkles, AlertTriangle, Search, User, Phone, Check, Loader2, PlusCircle } from 'lucide-react';
import { AIAnalysisService } from '../../services/aiService';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';

const ComplaintForm = () => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();
    const navigate = useNavigate();
    const location = useLocation();

    // Pre-fill if coming from Voter Profile
    const prefillVoterId = location.state?.voterId || '';
    const prefillVoterName = location.state?.voterName || '';

    // State for linked voter
    const [selectedVoterId, setSelectedVoterId] = useState<string | null>(prefillVoterId || null);

    // Get query params
    const [searchParams] = useSearchParams();
    const typeParam = searchParams.get('type');

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<ComplaintType>((typeParam as ComplaintType) || 'Other');
    const [ward, setWard] = useState('12'); // Default to 12 for MVP
    const [area, setArea] = useState('');
    const [peopleAffected, setPeopleAffected] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);

    // Voter Details State
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [mobile, setMobile] = useState('+91 ');

    // Voter Search Modal State
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Advanced Search State
    const [nameFilter, setNameFilter] = useState('');
    const [houseNoFilter, setHouseNoFilter] = useState('');
    const [ageFilter, setAgeFilter] = useState('');
    const [genderFilter, setGenderFilter] = useState('');
    const [addressFilter, setAddressFilter] = useState('');

    // Suggestions State
    const [houseNoSuggestions, setHouseNoSuggestions] = useState<{ house_no: string; count: number }[]>([]);
    const [showHouseNoSuggestions, setShowHouseNoSuggestions] = useState(false);
    const [addressSuggestions, setAddressSuggestions] = useState<{ address: string; count: number }[]>([]);
    const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

    const houseNoWrapperRef = React.useRef<HTMLDivElement>(null);
    const addressWrapperRef = React.useRef<HTMLDivElement>(null);

    const [searchResults, setSearchResults] = useState<Voter[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // AI States
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [translationData, setTranslationData] = useState<any>(null);

    // Fetch Stats for Suggestions
    useEffect(() => {
        if (!isSearchOpen) return;
        if (!isSearchOpen) return;
        const fetchStats = async () => {
            try {
                // FETCHING FROM VOTERS TABLE DIRECTLY TO ENSURE TENANT ISOLATION
                // RPCs replaced to avoid cross-tenant leaks
                const { data: votersData } = await supabase
                    .from('voters')
                    .select('address_english, address_marathi, house_no')
                    .eq('tenant_id', tenantId)
                    .limit(1000);

                if (votersData) {
                    // Process Addresses
                    const addrs = new Map<string, number>();
                    const houses = new Map<string, number>();

                    votersData.forEach(v => {
                        const addr = language === 'mr' ? (v.address_marathi || v.address_english) : v.address_english;
                        if (addr) addrs.set(addr, (addrs.get(addr) || 0) + 1);

                        if (v.house_no) houses.set(v.house_no, (houses.get(v.house_no) || 0) + 1);
                    });

                    setAddressSuggestions(Array.from(addrs).map(([address, count]) => ({ address, count })).sort((a, b) => b.count - a.count).slice(0, 50));
                    setHouseNoSuggestions(Array.from(houses).map(([house_no, count]) => ({ house_no, count })).sort((a, b) => b.count - a.count).slice(0, 50));
                }
            } catch (err) {
                console.error('Error fetching suggestions:', err);
            }
        };
        fetchStats();
    }, [isSearchOpen, language]);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (addressWrapperRef.current && !addressWrapperRef.current.contains(event.target as Node)) {
                setShowAddressSuggestions(false);
            }
            if (houseNoWrapperRef.current && !houseNoWrapperRef.current.contains(event.target as Node)) {
                setShowHouseNoSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter Suggestions based on input
    const filteredHouseNos = houseNoSuggestions.filter(item =>
        item.house_no.toLowerCase().includes(houseNoFilter.toLowerCase())
    ).slice(0, 50);

    const filteredAddresses = addressSuggestions.filter(item =>
        item.address.toLowerCase().includes(addressFilter.toLowerCase())
    ).slice(0, 50);

    // Smart AI Auto-Categorization & Urgency
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (title.length > 5 || description.length > 10) {
                setIsAnalyzing(true);
                const result = await AIAnalysisService.analyzeComplaint(title, description);

                if (result.category && result.category !== 'Other') {
                    setType(result.category as ComplaintType);
                }
                setUrgency(result.urgency);

                // Store translation data
                setTranslationData({
                    en: {
                        title: result.translated_title_en,
                        description: result.translated_description_en
                    },
                    mr: {
                        title: result.translated_title_mr,
                        description: result.translated_description_mr
                    },
                    detected_lang: result.original_language
                });

                setIsAnalyzing(false);
            }
        }, 1500); // 1.5s debounce

        return () => clearTimeout(timer);
    }, [title, description]);

    // Handle Voter Search
    useEffect(() => {
        // Initial fetch or filter change
        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                let query = supabase
                    .from('voters')
                    .select('*')
                    .eq('tenant_id', tenantId) // Secured
                    .limit(20);

                if (nameFilter) {
                    // Check if numeric (Mobile search) or text (Name/EPIC)
                    if (/^\d+$/.test(nameFilter)) {
                        query = query.ilike('mobile', `%${nameFilter}%`);
                    } else {
                        query = query.or(`name_english.ilike.%${nameFilter}%,name_marathi.ilike.%${nameFilter}%,epic_no.ilike.%${nameFilter}%`);
                    }
                }

                if (addressFilter) {
                    query = query.or(`address_english.ilike.%${addressFilter}%,address_marathi.ilike.%${addressFilter}%`);
                }

                if (houseNoFilter) {
                    query = query.ilike('house_no', `%${houseNoFilter}%`);
                }

                if (ageFilter) {
                    if (ageFilter.includes('-')) {
                        const [minAge, maxAge] = ageFilter.split('-').map(a => parseInt(a.trim()));
                        if (!isNaN(minAge) && !isNaN(maxAge)) {
                            query = query.gte('age', minAge).lte('age', maxAge);
                        }
                    } else {
                        const age = parseInt(ageFilter);
                        if (!isNaN(age)) {
                            query = query.eq('age', age);
                        }
                    }
                }

                if (genderFilter) {
                    query = query.eq('gender', genderFilter);
                }

                const { data, error } = await query;

                if (error) throw error;

                const mappedVoters: Voter[] = (data || []).map((row: any) => ({
                    id: row.id.toString(),
                    name: row.name_english || row.name_marathi,
                    name_english: row.name_english,
                    name_marathi: row.name_marathi,
                    age: row.age,
                    gender: row.gender,
                    address: row.address_english || row.address_marathi,
                    address_english: row.address_english,
                    address_marathi: row.address_marathi,
                    ward: row.ward_no || '-',
                    booth: row.part_no?.toString() || '-',
                    epicNo: row.epic_no,
                    mobile: row.mobile,
                    houseNo: row.house_no,
                    history: []
                }));

                setSearchResults(mappedVoters);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [nameFilter, houseNoFilter, ageFilter, genderFilter, addressFilter]);

    const handleVoterSelect = (voter: Voter) => {
        setSelectedVoterId(voter.id); // Set linked voter ID
        // Split name into First, Middle, Last logic
        const fullName = voter.name_english || voter.name_marathi || '';
        const parts = fullName.trim().split(/\s+/);

        let f = '', m = '', l = '';
        if (parts.length > 0) f = parts[0];
        if (parts.length === 2) l = parts[1];
        if (parts.length >= 3) {
            m = parts[1];
            l = parts.slice(2).join(' ');
        }

        setFirstName(f);
        setMiddleName(m);
        setLastName(l);
        if (voter.mobile) {
            setMobile(voter.mobile.startsWith('+91') ? voter.mobile : `+91 ${voter.mobile}`);
        } else {
            setMobile('+91 ');
        }

        setIsSearchOpen(false);
        toast.success(`Linked voter: ${fullName}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');

            const { error } = await supabase.from('complaints').insert([{
                problem: title + '\n' + description,
                category: type,
                status: 'Pending',
                priority: urgency,
                location: 'Ward ' + ward,
                area: area,
                source: 'Website',
                voter_id: selectedVoterId ? parseInt(selectedVoterId) : null,
                tenant_id: tenantId,
                description_meta: JSON.stringify({
                    submitter_name: fullName,
                    submitter_mobile: mobile,
                    people_affected: peopleAffected,
                    translation: translationData
                })
            }]);

            if (error) throw error;
            toast.success('Complaint submitted successfully!');
            navigate(-1);
        } catch (err) {
            console.error('Error submitting complaint:', err);
            toast.error('Failed to submit complaint');
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const url = URL.createObjectURL(e.target.files[0]);
            setPhotos([...photos, url]);
        }
    };

    // Prevent Google Translate on this page
    useEffect(() => {
        const cookies = document.cookie.split(';');
        const transCookie = cookies.find(c => c.trim().startsWith('googtrans='));
        if (transCookie && transCookie.includes('/en/mr')) {
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
            window.location.reload();
        }
    }, []);

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <button
                onClick={() => navigate(-1)}
                className="ns-btn-ghost px-0 py-0 text-slate-600 hover:text-brand-700 mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> {t('common.back')}
            </button>

            <div className="ns-card overflow-hidden">
                <div className="p-6 border-b border-slate-200/70 bg-gradient-to-br from-brand-50 to-white">
                    <h1 className="text-xl font-bold text-slate-900">{t('complaints.form.title')}</h1>
                    {prefillVoterName && (
                        <p className="text-sm text-brand-700 mt-2">
                            Linking to Voter: <span className="font-semibold">{prefillVoterName}</span>
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">

                    {/* Voter Details Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <User className="w-5 h-5 text-slate-400" />
                                {t('complaints.form.voter_details')}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsSearchOpen(true)}
                                className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100 transition-colors"
                            >
                                <Search className="w-3.5 h-3.5" />
                                {t('complaints.form.search_voter')}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.first_name')}</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="ns-input"
                                    placeholder={t('complaints.form.first_name')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.middle_name')}</label>
                                <input
                                    type="text"
                                    value={middleName}
                                    onChange={(e) => setMiddleName(e.target.value)}
                                    className="ns-input"
                                    placeholder={t('complaints.form.middle_name')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.last_name')}</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="ns-input"
                                    placeholder={t('complaints.form.last_name')}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.mobile')}</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="tel"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value)}
                                        className="ns-input pl-10"
                                        placeholder="+91 9999999999"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Complaint Details Section */}
                    <div className="space-y-4">
                        <div className="flex border-b border-slate-100 pb-2">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-slate-400" />
                                {t('complaints.form.details_section')}
                            </h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.issue_title')}</label>
                            <input
                                required
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="ns-input"
                                placeholder={t('complaints.form.title_placeholder')}
                            />
                            {isAnalyzing && (
                                <div className="flex items-center gap-2 mt-2 text-xs text-brand-700 animate-pulse">
                                    <Sparkles className="w-3 h-3" />
                                    <span>AI is analyzing issue details...</span>
                                </div>
                            )}
                            {urgency === 'High' && (
                                <div className="flex items-center gap-2 mt-2 text-xs text-red-700 font-medium">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>High Urgency Detected by AI</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.type')}</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as ComplaintType)}
                                    className="ns-input"
                                >
                                    <option value="Cleaning">{t('complaints.form.types.cleaning')}</option>
                                    <option value="Water">{t('complaints.form.types.water')}</option>
                                    <option value="Road">{t('complaints.form.types.road')}</option>
                                    <option value="Drainage">{t('complaints.form.types.drainage')}</option>
                                    <option value="StreetLight">{t('complaints.form.types.streetlight')}</option>
                                    <option value="SelfIdentified">{t('complaints.form.types.self_identified')}</option>
                                    <option value="Other">{t('complaints.form.types.other')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.ward')}</label>
                                <select
                                    value={ward}
                                    onChange={(e) => setWard(e.target.value)}
                                    className="ns-input"
                                >
                                    <option value="12">{t('complaints.form.wards.ward_12')}</option>
                                    <option value="13">{t('complaints.form.wards.ward_13')}</option>
                                    <option value="14">{t('complaints.form.wards.ward_14')}</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.area')}</label>
                                <input
                                    type="text"
                                    value={area}
                                    onChange={(e) => setArea(e.target.value)}
                                    className="ns-input"
                                    placeholder={t('complaints.form.area_placeholder')}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.people_affected')}</label>
                                <input
                                    type="number"
                                    value={peopleAffected}
                                    onChange={(e) => setPeopleAffected(e.target.value)}
                                    className="ns-input"
                                    placeholder={t('complaints.form.people_affected_placeholder')}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.description')}</label>
                            <textarea
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="ns-input min-h-[120px]"
                                placeholder={t('complaints.form.desc_placeholder')}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">{t('complaints.form.photos')}</label>
                            <div className="flex flex-wrap gap-4">
                                {photos.map((photo, index) => (
                                    <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
                                        <img src={photo} alt="evidence" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-red-600 transition"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-brand-300 transition-colors">
                                    <Camera className="w-6 h-6 text-slate-400 mb-1" />
                                    <span className="text-xs text-slate-500">{t('complaints.form.add_photo')}</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            className="ns-btn-primary px-8 py-2.5"
                        >
                            {t('complaints.form.submit')}
                        </button>
                    </div>
                </form>
            </div>

            {/* Advanced Voter Search Modal */}
            {isSearchOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center p-5 border-b border-slate-200/70 bg-white">
                            <h3 className="text-lg font-bold text-slate-900">{t('complaints.form.search_voter')}</h3>
                            <button onClick={() => setIsSearchOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 bg-slate-50 border-b border-slate-200/70 space-y-3">
                            {/* Advanced Search Inputs */}
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder={t('sadasya.search_name_placeholder') || "Search by Name"}
                                    className="ns-input"
                                    autoFocus
                                    value={nameFilter}
                                    onChange={(e) => setNameFilter(e.target.value)}
                                />
                                <div className="relative" ref={houseNoWrapperRef}>
                                    <input
                                        type="text"
                                        placeholder={t('sadasya.search_house_no') || "Search House No"}
                                        className="ns-input"
                                        value={houseNoFilter}
                                        onFocus={() => setShowHouseNoSuggestions(true)}
                                        onChange={(e) => {
                                            setHouseNoFilter(e.target.value);
                                            setShowHouseNoSuggestions(true);
                                        }}
                                    />
                                    {showHouseNoSuggestions && filteredHouseNos.length > 0 && (
                                        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                                            {filteredHouseNos.map((item, idx) => (
                                                <button
                                                    key={idx}
                                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm flex justify-between"
                                                    onClick={() => {
                                                        setHouseNoFilter(item.house_no);
                                                        setShowHouseNoSuggestions(false);
                                                    }}
                                                    type="button"
                                                >
                                                    <span>{item.house_no}</span>
                                                    <span className="text-xs text-slate-500 bg-slate-100 px-1 rounded">{item.count}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder={t('sadasya.age_range_placeholder') || "Age / Range (e.g. 18-24)"}
                                    className="ns-input"
                                    value={ageFilter}
                                    onChange={(e) => setAgeFilter(e.target.value)}
                                />
                                <select
                                    className="ns-input"
                                    value={genderFilter}
                                    onChange={(e) => setGenderFilter(e.target.value)}
                                >
                                    <option value="">{t('sadasya.all_genders') || "All Genders"}</option>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                    <option value="O">Other</option>
                                </select>
                            </div>

                            <div>
                                <div className="relative" ref={addressWrapperRef}>
                                    <input
                                        type="text"
                                        placeholder={t('sadasya.search_address') || "Search Address"}
                                        className="ns-input w-full"
                                        value={addressFilter}
                                        onFocus={() => setShowAddressSuggestions(true)}
                                        onChange={(e) => {
                                            setAddressFilter(e.target.value);
                                            setShowAddressSuggestions(true);
                                        }}
                                    />
                                    {showAddressSuggestions && filteredAddresses.length > 0 && (
                                        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                                            {filteredAddresses.map((item, idx) => (
                                                <button
                                                    key={idx}
                                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm flex justify-between"
                                                    onClick={() => {
                                                        setAddressFilter(item.address);
                                                        setShowAddressSuggestions(false);
                                                    }}
                                                    type="button"
                                                >
                                                    <span className="truncate mr-2">{item.address}</span>
                                                    <span className="text-xs text-slate-500 bg-slate-100 px-1 rounded whitespace-nowrap">{item.count}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-white min-h-[300px]">
                            {isSearching ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-500" />
                                    <span className="text-sm font-medium">Searching voters...</span>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {searchResults.map(voter => (
                                        <div
                                            key={voter.id}
                                            onClick={() => handleVoterSelect(voter)}
                                            className="p-4 hover:bg-slate-50 cursor-pointer transition-colors group flex justify-between items-center"
                                        >
                                            <div className="flex-1 pr-4">
                                                <p className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors text-base">
                                                    {language === 'mr' ? (voter.name_marathi || voter.name_english) : voter.name_english}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                                                        {voter.age} Y • {voter.gender}
                                                    </span>
                                                    <span className="text-slate-300">|</span>
                                                    <span>EPIC: <span className="font-medium text-slate-700">{voter.epicNo}</span></span>
                                                    {voter.mobile && (
                                                        <>
                                                            <span className="text-slate-300">|</span>
                                                            <div className="flex items-center gap-1 text-slate-600">
                                                                <Phone className="w-3 h-3" />
                                                                {voter.mobile}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1.5 line-clamp-1 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0"></span>
                                                    {language === 'mr' ? (voter.address_marathi || voter.address_english) : voter.address_english}
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                <PlusCircle className="w-5 h-5" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (nameFilter || houseNoFilter || ageFilter || genderFilter || addressFilter) ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <Search className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="font-medium text-slate-900">No voters found</p>
                                    <p className="text-sm mt-1 text-slate-400">Try adjusting your search filters</p>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                                    <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4">
                                        <Search className="w-8 h-8 text-brand-300" />
                                    </div>
                                    <p className="font-medium text-slate-700">Search for a voter</p>
                                    <p className="text-sm mt-1 text-slate-400 max-w-xs text-center">Enter search criteria to find voters in the list</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplaintForm;
