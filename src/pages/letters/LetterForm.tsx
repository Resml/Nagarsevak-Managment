
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { ArrowLeft, Save, Search, User, Loader2, PlusCircle, Phone, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext'; // Import Tenant Context
import type { Voter } from '../../types';

const LetterForm = () => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant(); // Use Tenant ID
    const navigate = useNavigate();
    const { id } = useParams();

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

    // Voter Search Modal State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<Voter[]>([]);
    const [isSearching, setIsSearching] = useState(false);

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

    const houseNoWrapperRef = useRef<HTMLDivElement>(null);
    const addressWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (id) {
            fetchRequestDetails();
        }
    }, [id]);

    const fetchRequestDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('letter_requests')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                const names = data.details.name.split(' ');
                let f = '', m = '', l = '';
                if (names.length > 0) f = names[0];
                if (names.length === 2) l = names[1];
                if (names.length >= 3) {
                    m = names[1];
                    l = names.slice(2).join(' ');
                }

                setFormData({
                    firstName: f,
                    middleName: m,
                    lastName: l,
                    name: data.details.name,
                    type: data.type,
                    mobile: data.details.mobile || '',
                    address: data.details.text || '',
                    area: data.area || '',
                    purpose: data.details.purpose || ''
                });
            }
        } catch (error) {
            console.error('Error fetching details:', error);
            toast.error('Failed to load request details');
        }
    };

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

    // Fetch Stats for Suggestions
    useEffect(() => {
        if (!isSearchOpen) return;
        const fetchStats = async () => {
            try {
                const { data: votersData } = await supabase
                    .from('voters')
                    .select('address_english, address_marathi, house_no')
                    .eq('tenant_id', tenantId) // Tenant Filter
                    .limit(1000);

                if (votersData) {
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
    }, [isSearchOpen, language, tenantId]);

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

    const filteredHouseNos = houseNoSuggestions.filter(item =>
        item.house_no.toLowerCase().includes(houseNoFilter.toLowerCase())
    ).slice(0, 50);

    const filteredAddresses = addressSuggestions.filter(item =>
        item.address.toLowerCase().includes(addressFilter.toLowerCase())
    ).slice(0, 50);

    // Search Effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!isSearchOpen) return;
            setIsSearching(true);
            try {
                let query = supabase
                    .from('voters')
                    .select('*')
                    .eq('tenant_id', tenantId) // Tenant Filter
                    .limit(20);

                if (nameFilter) {
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
    }, [nameFilter, houseNoFilter, ageFilter, genderFilter, addressFilter, isSearchOpen, tenantId]);


    const handleVoterSelect = (voter: Voter) => {
        const fullName = voter.name_english || voter.name_marathi || '';
        const parts = fullName.trim().split(/\s+/);

        let f = '', m = '', l = '';
        if (parts.length > 0) f = parts[0];
        if (parts.length === 2) l = parts[1];
        if (parts.length >= 3) {
            m = parts[1];
            l = parts.slice(2).join(' ');
        }

        const voterAddress = language === 'mr' ? (voter.address_marathi || voter.address_english) : voter.address_english;
        const voterMobile = voter.mobile ? (voter.mobile.startsWith('+91') ? voter.mobile : `+91 ${voter.mobile}`) : '+91 ';

        setFormData(prev => ({
            ...prev,
            firstName: f,
            middleName: m,
            lastName: l,
            mobile: voterMobile,
            area: voterAddress || prev.area,
            address: voterAddress || prev.address // Also fill address if available
        }));

        setIsSearchOpen(false);
        toast.success(`Linked voter: ${fullName}`);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const fullName = `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim().replace(/\s+/g, ' ');

        try {
            const payload = {
                user_id: formData.mobile || 'Manual Entry',
                type: formData.type,
                area: formData.area,
                details: {
                    name: fullName,
                    text: formData.address,
                    purpose: formData.purpose,
                    mobile: formData.mobile
                },
                status: 'Pending',
                tenant_id: tenantId // Include Tenant ID
            };

            let error;
            if (id) {
                const { error: updateError } = await supabase
                    .from('letter_requests')
                    .update(payload)
                    .eq('id', id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('letter_requests')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;
            toast.success(id ? 'Request updated successfully' : t('staff.list.success_add').replace('Staff member', 'Request'));
            navigate('/dashboard/letters');
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
                onClick={() => navigate('/dashboard/letters')}
                className="ns-btn-ghost px-0 py-0 text-slate-600 hover:text-brand-700"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> {t('common.back')}
            </button>

            <div className="ns-card overflow-hidden">
                <div className="p-6 border-b border-slate-200/70 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">{id ? t('letters.edit_request') || 'Edit Request' : t('letters.new_request_title')}</h1>
                        <p className="text-sm text-slate-500 mt-1">{t('letters.subtitle')}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Name Split into 3 */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-slate-700">{t('letters.name')}</label>
                            <button
                                type="button"
                                onClick={() => setIsSearchOpen(true)}
                                className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100 transition-colors"
                            >
                                <Search className="w-3.5 h-3.5" />
                                {t('complaints.form.search_voter') || "Find from Voter List"}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
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
                            <span>{loading ? t('common.loading') : (id ? t('common.save_changes') : t('letters.create_request'))}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Voter Search Modal */}
            {isSearchOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="ns-card w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center p-5 border-b border-slate-200/70 bg-white">
                            <h3 className="text-lg font-bold text-slate-900">{t('complaints.form.search_voter') || "Search Voter"}</h3>
                            <button onClick={() => setIsSearchOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 bg-slate-50 border-b border-slate-200/70 space-y-3">
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

export default LetterForm;
