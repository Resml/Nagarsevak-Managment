import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { type ComplaintType, type Voter } from '../../types';
import { ArrowLeft, X, Search, User, Phone, Check, Loader2, PlusCircle, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';

const PersonalRequestForm = () => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();
    const navigate = useNavigate();
    const location = useLocation();

    // Pre-fill if coming from Voter Profile
    const prefillVoterId = location.state?.voterId || '';
    const prefillVoterName = location.state?.voterName || '';

    // Form State
    const [description, setDescription] = useState('');
    const [type, setType] = useState<ComplaintType>('Personal Help');

    // Reporter Details State
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

    const [searchResults, setSearchResults] = useState<Voter[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Handle Voter Search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!isSearchOpen) return;
            setIsSearching(true);
            try {
                let query = supabase
                    .from('voters')
                    .select('*')
                    .eq('tenant_id', tenantId)
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
    }, [nameFilter, houseNoFilter, ageFilter, genderFilter, addressFilter, isSearchOpen]);

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

            const { error } = await supabase.from('personal_requests').insert([{
                tenant_id: tenantId,
                user_id: 'Manual',
                reporter_name: fullName,
                reporter_mobile: mobile.trim(),
                request_type: type,
                description: description,
                status: 'Pending'
            }]);

            if (error) throw error;
            toast.success('Personal help request submitted successfully!');
            navigate(-1);
        } catch (err) {
            console.error('Error submitting request:', err);
            toast.error('Failed to submit request');
        }
    };

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
                    <h1 className="text-xl font-bold text-slate-900">{t('complaints.tabs.personal')}</h1>
                    <p className="text-sm text-slate-500 mt-1">Create a new manual personal help request</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">

                    {/* Reporter Details Section */}
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
                                    required
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
                                    required
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
                                        required
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

                    {/* Request Details Section */}
                    <div className="space-y-4">
                        <div className="flex border-b border-slate-100 pb-2">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-slate-400" />
                                {t('complaints.form.details_section')}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.type')}</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as ComplaintType)}
                                    className="ns-input"
                                >
                                    <option value="Admission">{t('complaints.form.types.admission')}</option>
                                    <option value="Medical">{t('complaints.form.types.medical')}</option>
                                    <option value="Financial">{t('complaints.form.types.financial')}</option>
                                    <option value="Help">{t('complaints.form.types.help')}</option>
                                    <option value="Personal Help">{t('complaints.form.types.personal_help')}</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.description')}</label>
                            <textarea
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={6}
                                className="ns-input min-h-[150px]"
                                placeholder={t('complaints.form.desc_placeholder')}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            className="ns-btn-primary px-8 py-2.5"
                        >
                            {t('common.save')}
                        </button>
                    </div>
                </form>
            </div>

            {/* Voter Search Modal */}
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
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder={t('sadasya.search_name_placeholder') || "Search by Name"}
                                    className="ns-input"
                                    autoFocus
                                    value={nameFilter}
                                    onChange={(e) => setNameFilter(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder={t('sadasya.search_house_no') || "Search House No"}
                                    className="ns-input"
                                    value={houseNoFilter}
                                    onChange={(e) => setHouseNoFilter(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-white min-h-[300px]">
                            {isSearching ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-500" />
                                    <span className="text-sm font-medium">{t('complaints.loading')}</span>
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
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                <PlusCircle className="w-5 h-5" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                    <Search className="w-8 h-8 text-slate-300 mb-4" />
                                    <p className="font-medium text-slate-700">{t('voters.no_results')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonalRequestForm;
