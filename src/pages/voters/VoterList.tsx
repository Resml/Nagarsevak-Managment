import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, User, Home, Filter, RefreshCw, ChevronDown, Plus, Users, ArrowLeft } from 'lucide-react';
import { type Voter } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';

const PAGE_SIZE = 50;

const VoterList = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [voters, setVoters] = useState<Voter[]>([]);
    const [totalCount, setTotalCount] = useState<number | null>(null);

    const [nameFilter, setNameFilter] = useState('');
    const [addressFilter, setAddressFilter] = useState('');
    const [houseNoFilter, setHouseNoFilter] = useState('');
    const [ageFilter, setAgeFilter] = useState('');
    const [genderFilter, setGenderFilter] = useState('');
    const [casteFilter, setCasteFilter] = useState('');
    const [showFriendsOnly, setShowFriendsOnly] = useState(false);
    const [isTagMode, setIsTagMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [surnameStats, setSurnameStats] = useState<{ name: string; count: number }[]>([]);
    const [firstnameStats, setFirstnameStats] = useState<{ name: string; count: number }[]>([]);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [analysisSearch, setAnalysisSearch] = useState('');
    const [analysisTab, setAnalysisTab] = useState<'surnames' | 'firstnames'>('surnames');
    const [selectedAnalysisNames, setSelectedAnalysisNames] = useState<string[]>([]);
    const [selectedCasteForBulk, setSelectedCasteForBulk] = useState('');
    const [isAllocating, setIsAllocating] = useState(false);

    // Suggestions State
    const [addressSuggestions, setAddressSuggestions] = useState<{ address: string; count: number }[]>([]);
    const [houseNoSuggestions, setHouseNoSuggestions] = useState<{ house_no: string; count: number }[]>([]);
    const [casteSuggestions, setCasteSuggestions] = useState<{ caste: string; count: number }[]>([]);
    const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
    const [showHouseNoSuggestions, setShowHouseNoSuggestions] = useState(false);
    const [showCasteSuggestions, setShowCasteSuggestions] = useState(false);

    const addressWrapperRef = useRef<HTMLDivElement>(null);
    const houseNoWrapperRef = useRef<HTMLDivElement>(null);
    const casteWrapperRef = useRef<HTMLDivElement>(null);

    // Helper to get display name based on language
    const getDisplayName = (voter: Voter) => {
        if (language === 'mr') {
            return voter.name_marathi || voter.name || voter.name_english;
        }
        return voter.name_english || voter.name;
    };

    const getDisplayAddress = (voter: Voter) => {
        if (language === 'mr') {
            return voter.address_marathi || voter.address || voter.address_english;
        }
        return voter.address_english || voter.address;
    };

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (addressWrapperRef.current && !addressWrapperRef.current.contains(event.target as Node)) {
                setShowAddressSuggestions(false);
            }
            if (houseNoWrapperRef.current && !houseNoWrapperRef.current.contains(event.target as Node)) {
                setShowHouseNoSuggestions(false);
            }
            if (casteWrapperRef.current && !casteWrapperRef.current.contains(event.target as Node)) {
                setShowCasteSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch Stats for Suggestions
    useEffect(() => {
        const fetchStats = async () => {
            // Fetch Address Stats
            const rpcName = language === 'mr' ? 'get_unique_addresses_marathi' : 'get_unique_addresses';
            const { data: addrData } = await supabase.rpc(rpcName);
            if (addrData) setAddressSuggestions(addrData);

            // Fetch House No Stats
            const { data: houseData } = await supabase.rpc('get_unique_house_numbers');
            if (houseData) setHouseNoSuggestions(houseData);

            // Fetch Caste Stats
            const { data: casteData } = await supabase.rpc('get_unique_castes');
            if (casteData) setCasteSuggestions(casteData);
        };
        fetchStats();
    }, [language]);

    const fetchAnalysisData = async () => {
        setLoadingAnalysis(true);
        const { data: surnames } = await supabase.rpc('get_unique_surnames');
        const { data: firstnames } = await supabase.rpc('get_unique_firstnames');
        if (surnames) setSurnameStats(surnames);
        if (firstnames) setFirstnameStats(firstnames);
        setLoadingAnalysis(false);
    };

    const handleBulkAllocate = async () => {
        if (!selectedCasteForBulk || selectedAnalysisNames.length === 0) return;

        setIsAllocating(true);
        const { error } = await supabase.rpc('bulk_allocate_caste', {
            p_names: selectedAnalysisNames,
            p_name_type: analysisTab === 'surnames' ? 'surname' : 'firstname',
            p_new_caste: selectedCasteForBulk
        });

        if (!error) {
            // Refresh stats
            await fetchAnalysisData();
            // Refresh main suggestions if needed
            const { data: casteData } = await supabase.rpc('get_unique_castes');
            if (casteData) setCasteSuggestions(casteData);

            setSelectedAnalysisNames([]);
            alert(t('voters.success_allocate'));
        }
        setIsAllocating(false);
    };

    const toggleAnalysisName = (name: string) => {
        setSelectedAnalysisNames(prev =>
            prev.includes(name)
                ? prev.filter(n => n !== name)
                : [...prev, name]
        );
    };

    // Filter Suggestions based on input
    const filteredAddresses = addressSuggestions.filter(item =>
        item.address.toLowerCase().includes(addressFilter.toLowerCase())
    ).slice(0, 100); // Limit to 100

    const filteredHouseNos = houseNoSuggestions.filter(item =>
        item.house_no.toLowerCase().includes(houseNoFilter.toLowerCase())
    ).slice(0, 100);

    const filteredCastes = casteSuggestions.filter(item =>
        item.caste.toLowerCase().includes(casteFilter.toLowerCase())
    ).slice(0, 100);

    const fetchVoters = useCallback(async (currentPage: number, reset: boolean = false) => {
        if (reset) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            let query = supabase
                .from('voters')
                .select('*', { count: 'exact' })
                .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

            if (nameFilter) {
                query = query.or(`name_english.ilike.%${nameFilter}%,name_marathi.ilike.%${nameFilter}%`);
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

            if (casteFilter) {
                query = query.ilike('caste', `%${casteFilter}%`);
            }

            if (showFriendsOnly) {
                query = query.eq('is_friend_relative', true);
            }

            const { data, error, count } = await query;

            if (error) {
                console.error('Error fetching voters:', error);
                return;
            }

            setTotalCount(count);

            // Map Supabase result to Voter type
            const mappedVoters: Voter[] = (data || []).map((row: any) => ({
                id: row.id.toString(),
                name: row.name_english || row.name_marathi, // Default for type compatibility
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
                caste: row.caste,
                is_friend_relative: row.is_friend_relative,
                history: []
            }));

            if (reset) {
                setVoters(mappedVoters);
            } else {
                setVoters(prev => [...prev, ...mappedVoters]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [nameFilter, addressFilter, houseNoFilter, ageFilter, genderFilter, casteFilter, showFriendsOnly]);

    // Initial load and filter change
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('filter') === 'friends') {
            setShowFriendsOnly(true);
        }
    }, []);

    useEffect(() => {
        setPage(0);
        const timeoutId = setTimeout(() => {
            fetchVoters(0, true);
        }, 500); // 500ms debounce
        return () => clearTimeout(timeoutId);
    }, [fetchVoters]); // fetchVoters dependency covers filters via useCallback

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchVoters(nextPage, false);
    };

    const handleTagVoter = async (voter: Voter, e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = !voter.is_friend_relative;
        try {
            const { error } = await supabase
                .from('voters')
                .update({ is_friend_relative: newStatus })
                .eq('id', voter.id);

            if (error) throw error;

            setVoters(prev => prev.map(v => v.id === voter.id ? { ...v, is_friend_relative: newStatus } : v));
        } catch (err) {
            console.error('Error tagging voter:', err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sticky top-0 z-30 bg-slate-50 pt-1 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isTagMode
                                ? t('voters.tagging_mode_title')
                                : showFriendsOnly
                                    ? t('voters.friends_relatives_title')
                                    : t('voters.title')}
                        </h1>
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-slate-500">
                                {isTagMode
                                    ? "Select voters to add to your list"
                                    : showFriendsOnly
                                        ? "Your tagged list of friends and relatives"
                                        : t('voters.search_by_detail')}
                            </p>
                            {showFriendsOnly && !isTagMode && (
                                <button
                                    onClick={() => setShowFriendsOnly(false)}
                                    className="text-xs text-brand-600 hover:text-brand-700 font-medium underline underline-offset-2 ml-1"
                                >
                                    {t('voters.view_all_voters')}
                                </button>
                            )}
                            {totalCount !== null && (
                                <span className="ns-badge bg-brand-50 text-brand-700 border-brand-200">
                                    {t('voters.found')}: {totalCount}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 self-start md:self-center">
                        {isTagMode ? (
                            <button
                                onClick={() => {
                                    setIsTagMode(false);
                                    setShowFriendsOnly(true);
                                }}
                                className="ns-btn bg-brand-700 text-white border-brand-700 hover:bg-brand-800 shadow-md"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                {t('voters.exit_tagging_mode')}
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        const next = !showFriendsOnly;
                                        setShowFriendsOnly(next);
                                        if (next) setIsTagMode(false);
                                    }}
                                    className={`ns-btn ${showFriendsOnly ? 'bg-brand-600 text-white border-brand-600' : 'ns-btn-secondary'}`}
                                >
                                    <Users className={`w-4 h-4 mr-2 ${showFriendsOnly ? 'text-white' : ''}`} />
                                    {t('voters.friends_relatives')}
                                </button>

                                <button
                                    onClick={() => {
                                        setShowAnalysisModal(true);
                                        fetchAnalysisData();
                                    }}
                                    className="ns-btn ns-btn-secondary"
                                >
                                    <Filter className="w-4 h-4 mr-2" />
                                    {t('voters.caste_allocation')}
                                </button>

                                <button
                                    onClick={() => navigate('/political/add-voter')}
                                    className="ns-btn-primary"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    {t('voters.add_new')}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {isTagMode && (
                    <div className="bg-brand-50 border border-brand-100 rounded-lg p-3 text-sm text-brand-800 flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-brand-600 animate-pulse"></span>
                            <span className="font-medium">{t('voters.tagging_mode')}</span>
                            <span className="text-slate-500 hidden sm:inline">— Select voters to add to your list</span>
                        </div>
                        <button
                            onClick={() => {
                                setIsTagMode(false);
                                setShowFriendsOnly(true);
                            }}
                            className="bg-white text-brand-700 border border-brand-200 hover:border-brand-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            {t('common.back')}
                        </button>
                    </div>
                )}

                {showFriendsOnly && !isTagMode && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-700">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 text-lg leading-tight">{t('voters.friends_relatives')}</h2>
                                <p className="text-slate-500 text-sm">Members tagged in your personal list</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setShowFriendsOnly(false);
                                setIsTagMode(true);
                            }}
                            className="ns-btn-primary bg-brand-600 hover:bg-brand-700 w-full sm:w-auto text-sm py-2"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {t('voters.add_to_friends_list')}
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* Name Filter */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={t('voters.search_placeholder') || "Search Name"}
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            className="ns-input pl-9 w-full"
                        />
                    </div>

                    {/* Address Filter with Suggestions */}
                    <div className="relative" ref={addressWrapperRef}>
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={t('voters.search_address')}
                            value={addressFilter}
                            onChange={(e) => {
                                setAddressFilter(e.target.value);
                                setShowAddressSuggestions(true);
                            }}
                            onFocus={() => setShowAddressSuggestions(true)}
                            className="ns-input pl-9 w-full"
                        />
                        {showAddressSuggestions && filteredAddresses.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filteredAddresses.map((item, idx) => (
                                    <button
                                        key={idx}
                                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex justify-between items-center group"
                                        onClick={() => {
                                            setAddressFilter(item.address);
                                            setShowAddressSuggestions(false);
                                        }}
                                    >
                                        <span className="truncate flex-1">{item.address}</span>
                                        <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded ml-2 group-hover:bg-slate-200">
                                            {item.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* House No Filter with Suggestions */}
                    <div className="relative" ref={houseNoWrapperRef}>
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={t('voters.house_no')}
                            value={houseNoFilter}
                            onChange={(e) => {
                                setHouseNoFilter(e.target.value);
                                setShowHouseNoSuggestions(true);
                            }}
                            onFocus={() => setShowHouseNoSuggestions(true)}
                            className="ns-input pl-9 w-full"
                        />
                        {showHouseNoSuggestions && filteredHouseNos.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filteredHouseNos.map((item, idx) => (
                                    <button
                                        key={idx}
                                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex justify-between items-center group"
                                        onClick={() => {
                                            setHouseNoFilter(item.house_no);
                                            setShowHouseNoSuggestions(false);
                                        }}
                                    >
                                        <span className="truncate flex-1">{item.house_no}</span>
                                        <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded ml-2 group-hover:bg-slate-200">
                                            {item.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Age Filter */}
                    <div className="relative">
                        <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={t('voters.age_placeholder') || "Age Range"}
                            value={ageFilter}
                            onChange={(e) => setAgeFilter(e.target.value)}
                            className="ns-input pl-9 w-full"
                        />
                    </div>

                    {/* Gender Filter */}
                    <div className="relative">
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <select
                            value={genderFilter}
                            onChange={(e) => setGenderFilter(e.target.value)}
                            className="ns-input pl-9 w-full appearance-none bg-white"
                        >
                            <option value="">{t('voters.all_genders')}</option>
                            <option value="M">{t('voters.gender_male') || 'Male'}</option>
                            <option value="F">{t('voters.gender_female') || 'Female'}</option>
                            <option value="O">{t('voters.gender_other') || 'Other'}</option>
                        </select>
                    </div>

                    {/* Caste Filter with Suggestions */}
                    <div className="relative" ref={casteWrapperRef}>
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={t('voters.caste_placeholder') || "Search Caste"}
                            value={casteFilter}
                            onChange={(e) => {
                                setCasteFilter(e.target.value);
                                setShowCasteSuggestions(true);
                            }}
                            onFocus={() => setShowCasteSuggestions(true)}
                            className="ns-input pl-9 w-full"
                        />
                        {showCasteSuggestions && filteredCastes.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filteredCastes.map((item, idx) => (
                                    <button
                                        key={idx}
                                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex justify-between items-center group"
                                        onClick={() => {
                                            setCasteFilter(item.caste);
                                            setShowCasteSuggestions(false);
                                        }}
                                    >
                                        <span className="truncate flex-1">{item.caste}</span>
                                        <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded ml-2 group-hover:bg-slate-200">
                                            {item.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="ns-card p-5 animate-pulse">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3 w-full">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                <div className="h-3 bg-gray-200 rounded w-full"></div>
                                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {voters.map((voter) => (
                            <div
                                key={voter.id}
                                onClick={(e) => isTagMode ? handleTagVoter(voter, e) : navigate(`/voters/${voter.id}`)}
                                className={`ns-card p-5 hover:shadow-md transition-shadow cursor-pointer group relative ${isTagMode && voter.is_friend_relative ? 'ring-2 ring-brand-500 ring-inset bg-brand-50/30' : ''}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-bold group-hover:bg-brand-50 group-hover:text-brand-700 transition-colors">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{getDisplayName(voter)}</h3>
                                            <p className="text-xs text-slate-500">EPIC: {voter.epicNo}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        {(isTagMode || voter.is_friend_relative) && (
                                            <button
                                                onClick={(e) => handleTagVoter(voter, e)}
                                                className={`p-1.5 rounded-lg transition-colors ${voter.is_friend_relative ? 'bg-brand-100 text-brand-700 border border-brand-200 shadow-sm' : 'text-slate-300 hover:text-brand-600 hover:bg-brand-50 border border-transparent'}`}
                                                title={voter.is_friend_relative ? "Remove from Friends List" : "Add to Friends List"}
                                            >
                                                <Users className={`w-4 h-4 ${voter.is_friend_relative ? 'fill-brand-700' : ''}`} />
                                            </button>
                                        )}
                                        <span className="ns-badge border-slate-200 bg-slate-50 text-slate-600 whitespace-nowrap">
                                            {t('voters.ward')} {voter.ward}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2 text-sm text-slate-600">
                                    <div className="flex items-start space-x-2">
                                        <MapPin className="w-4 h-4 mt-0.5 text-slate-400" />
                                        <div className="line-clamp-2">
                                            {voter.houseNo ? <span className="font-medium mr-1">#{voter.houseNo},</span> : null}
                                            {getDisplayAddress(voter)}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 pl-6 text-xs text-slate-500">
                                        <span>{t('voters.booth')}: {voter.booth}</span>
                                        <span>•</span>
                                        <span>{t('voters.age')}: {voter.age}</span>
                                        {voter.gender && (
                                            <>
                                                <span>•</span>
                                                <span>{voter.gender}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!loading && voters.length === 0 && (
                        <div className="py-12 text-center text-slate-500 ns-card border-dashed p-10">
                            {t('voters.no_results')}
                        </div>
                    )}

                    {/* Load More Button */}
                    {totalCount !== null && voters.length < totalCount && (
                        <div className="mt-8 flex justify-center pb-8">
                            <button
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="ns-btn-primary w-full md:w-auto min-w-[200px] justify-center py-2.5 px-6 shadow-sm hover:shadow-md transition-all active:scale-95"
                            >
                                {loadingMore ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-4 h-4 mr-2" />
                                        Load More Results ({voters.length} of {totalCount})
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Analysis Modal */}
            {showAnalysisModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{t('voters.caste_allocation')}</h3>
                                <p className="text-sm text-slate-500">Analyze voter surnames and first names</p>
                            </div>
                            <button
                                onClick={() => setShowAnalysisModal(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <Plus className="w-6 h-6 rotate-45 text-slate-500" />
                            </button>
                        </div>

                        {/* Search and Tabs */}
                        <div className="p-6 border-b border-slate-100 bg-white">
                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                <div className="flex p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
                                    <button
                                        onClick={() => setAnalysisTab('surnames')}
                                        className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${analysisTab === 'surnames' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {t('voters.surnames')}
                                    </button>
                                    <button
                                        onClick={() => setAnalysisTab('firstnames')}
                                        className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${analysisTab === 'firstnames' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {t('voters.first_names')}
                                    </button>
                                </div>
                                <div className="relative w-full sm:max-w-xs">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder={t('voters.search_name')}
                                        value={analysisSearch}
                                        onChange={(e) => setAnalysisSearch(e.target.value)}
                                        className="ns-input pl-9 w-full bg-slate-50 border-slate-200 focus:bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Data Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                            {loadingAnalysis ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <RefreshCw className="w-8 h-8 animate-spin text-brand-600 mb-4" />
                                    <p className="text-slate-500 font-medium">Analyzing data...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {(analysisTab === 'surnames' ? surnameStats : firstnameStats)
                                        .filter(item => item.name.toLowerCase().includes(analysisSearch.toLowerCase()))
                                        .map((item, idx) => {
                                            const isSelected = selectedAnalysisNames.includes(item.name);
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`group bg-white border rounded-xl p-4 transition-all flex items-center justify-between cursor-pointer ${isSelected ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50/30' : 'border-slate-200 hover:border-brand-300 hover:shadow-md'
                                                        }`}
                                                    onClick={() => toggleAnalysisName(item.name)}
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-600 border-brand-600' : 'bg-white border-slate-300'
                                                            }`}>
                                                            {isSelected && <Plus className="w-3.5 h-3.5 text-white" />}
                                                        </div>
                                                        <span className={`font-semibold truncate mr-2 ${isSelected ? 'text-brand-700' : 'text-slate-700 group-hover:text-brand-700'}`}>
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${isSelected ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-700'
                                                        }`}>
                                                        {item.count}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer with Allocation */}
                        <div className="p-6 border-t border-slate-100 bg-white shadow-lg">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    {selectedAnalysisNames.length > 0 && (
                                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                                            <span className="px-3 py-1.5 text-sm font-bold text-slate-700">
                                                {selectedAnalysisNames.length} {t('voters.allocate_to')}
                                            </span>
                                            <div className="relative">
                                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <select
                                                    value={selectedCasteForBulk}
                                                    onChange={(e) => setSelectedCasteForBulk(e.target.value)}
                                                    className="ns-input pl-9 py-1.5 pr-8 text-sm focus:ring-brand-500 bg-white"
                                                >
                                                    <option value="">{t('voters.select_caste')}</option>
                                                    {casteSuggestions.map((c, i) => (
                                                        <option key={i} value={c.caste}>{c.caste}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button
                                                disabled={!selectedCasteForBulk || isAllocating}
                                                onClick={handleBulkAllocate}
                                                className={`ns-btn-primary py-1.5 px-6 text-sm flex items-center gap-2 ${(!selectedCasteForBulk || isAllocating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {isAllocating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                                {t('common.save')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedAnalysisNames([])}
                                        className="ns-btn-secondary py-2"
                                        disabled={selectedAnalysisNames.length === 0}
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={() => setShowAnalysisModal(false)}
                                        className="ns-btn-primary bg-slate-800 hover:bg-slate-900 border-none px-10"
                                    >
                                        {t('voters.exit_tagging_mode')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoterList;
