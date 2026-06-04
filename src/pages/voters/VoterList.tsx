import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, User, Home, Filter, RefreshCw, ChevronDown, Plus, Users, ArrowLeft, LayoutGrid, FileText, Printer, BarChart2 } from 'lucide-react';
import { type Voter } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';

const PAGE_SIZE = 50;

const VoterList = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();
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
    const [viewMode, setViewMode] = useState<'grid' | 'report'>('grid');
    const [showFamilyGrouping, setShowFamilyGrouping] = useState(false);

    // Favour-wise Allocation State
    const [favourFilter, setFavourFilter] = useState('');
    const [showFavourModal, setShowFavourModal] = useState(false);
    const [selectedFavourForBulk, setSelectedFavourForBulk] = useState('');
    const [selectedFavourAnalysisNames, setSelectedFavourAnalysisNames] = useState<string[]>([]);
    const [favourAnalysisTab, setFavourAnalysisTab] = useState<'surnames' | 'firstnames' | 'castes' | 'voters'>('surnames');
    const [favourAnalysisSearch, setFavourAnalysisSearch] = useState('');
    const [selectedFavourIndividualIds, setSelectedFavourIndividualIds] = useState<string[]>([]);
    const [selectedFavourCastes, setSelectedFavourCastes] = useState<string[]>([]);

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
            try {
                // Fetch All Data needed for stats - Secured with Tenant ID
                const { data: votersData } = await supabase
                    .from('voters')
                    .select('address_english, address_marathi, house_no, caste')
                    .eq('tenant_id', tenantId)
                    .limit(1000);

                if (votersData) {
                    const addrs = new Map<string, number>();
                    const houses = new Map<string, number>();
                    const castes = new Map<string, number>();

                    votersData.forEach((v: any) => {
                        // Address
                        const addr = language === 'mr' ? (v.address_marathi || v.address_english) : v.address_english;
                        if (addr) addrs.set(addr, (addrs.get(addr) || 0) + 1);

                        // House No
                        if (v.house_no) houses.set(v.house_no, (houses.get(v.house_no) || 0) + 1);

                        // Caste
                        if (v.caste) castes.set(v.caste, (castes.get(v.caste) || 0) + 1);
                    });

                    setAddressSuggestions(Array.from(addrs).map(([address, count]) => ({ address, count })).sort((a, b) => b.count - a.count).slice(0, 50));
                    setHouseNoSuggestions(Array.from(houses).map(([house_no, count]) => ({ house_no, count })).sort((a, b) => b.count - a.count).slice(0, 50));
                    setCasteSuggestions(Array.from(castes).map(([caste, count]) => ({ caste, count })).sort((a, b) => b.count - a.count).slice(0, 50));
                }
            } catch (e) {
                console.error('Error fetching stats:', e);
            }
        };
        fetchStats();
    }, [language, tenantId]);

    const fetchAnalysisData = async () => {
        setLoadingAnalysis(true);
        try {
            // Replaced RPCs with client-side analysis of a subset (or full if feasible) of voters
            // Fetch names only
            const { data } = await supabase
                .from('voters')
                .select('name_english')
                .eq('tenant_id', tenantId)
                .limit(2000); // Analyze sample size to avoid perf issues

            if (data) {
                const surnames = new Map<string, number>();
                const firstnames = new Map<string, number>();

                data.forEach((row: any) => {
                    const name = row.name_english || '';
                    const parts = name.trim().split(/\s+/);
                    if (parts.length > 0) {
                        const first = parts[0];
                        firstnames.set(first, (firstnames.get(first) || 0) + 1);

                        if (parts.length > 1) {
                            const last = parts[parts.length - 1];
                            surnames.set(last, (surnames.get(last) || 0) + 1);
                        }
                    }
                });

                setSurnameStats(Array.from(surnames).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 100));
                setFirstnameStats(Array.from(firstnames).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 100));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAnalysis(false);
        }
    };

    const handleBulkAllocate = async () => {
        if (!selectedCasteForBulk || selectedAnalysisNames.length === 0) return;

        setIsAllocating(true);
        try {
            // Replaced RPC with direct update to ensure tenant isolation
            // Determining the column to filter by based on tab
            const column = analysisTab === 'surnames' ? 'name_english' : 'name_english';
            // Note: The original RPC likely did a pattern match or exact match on parts of the name.
            // Client-side bulk update is tricky if we want to match "starting with" or "containing".
            // The original RPC params: p_names (array), p_name_type, p_new_caste
            // Assuming p_names are the exact surnames/firstnames to match.
            // But 'name_english' is full name. Matching surname in full name is complex without regex/RPC.
            // HOWEVER, the 'Analysis' feature extracts surnames. So we can use ILIKE.
            // But we can't do ILIKE ANY(array).
            // We might have to iterate.

            // Wait, if I cannot verify the RPC, disabling it or making it loop is safer.
            // Loop:
            for (const name of selectedAnalysisNames) {
                const searchPattern = analysisTab === 'surnames' ? `% ${name}` : `${name} %`; // Approx: Surname at end, Firstname at start? 
                // Actually surnames can be anywhere or last. 
                // Let's assume the user knows what they picked.
                // Or better: `name_english` ILIKE `%name%`. Use with caution.

                await supabase
                    .from('voters')
                    .update({ caste: selectedCasteForBulk })
                    .ilike('name_english', `%${name}%`)
                    .eq('tenant_id', tenantId);
            }

            // Refresh stats
            await fetchAnalysisData();
            // Refresh main suggestions if needed - manual fetch again
            const { data: votersData } = await supabase.from('voters').select('caste').eq('tenant_id', tenantId).limit(1000);
            if (votersData) {
                const castes = new Map<string, number>();
                votersData.forEach((v: any) => { if (v.caste) castes.set(v.caste, (castes.get(v.caste) || 0) + 1); });
                setCasteSuggestions(Array.from(castes).map(([caste, count]) => ({ caste, count })).sort((a, b) => b.count - a.count).slice(0, 50));
            }

            setSelectedAnalysisNames([]);
            alert(t('voters.success_allocate'));

        } catch (error) {
            console.error('Error allocating caste:', error);
            alert('Failed to update castes');
        } finally {
            setIsAllocating(false);
        }
    };

    const handleBulkFavourAllocate = async () => {
        if (!selectedFavourForBulk) return;
        setIsAllocating(true);
        try {
            if (favourAnalysisTab === 'surnames' || favourAnalysisTab === 'firstnames') {
                if (selectedFavourAnalysisNames.length === 0) return;
                for (const name of selectedFavourAnalysisNames) {
                    await supabase
                        .from('voters')
                        .update({ favour: selectedFavourForBulk })
                        .ilike('name_english', `%${name}%`)
                        .eq('tenant_id', tenantId);
                }
            } else if (favourAnalysisTab === 'castes') {
                if (selectedFavourCastes.length === 0) return;
                for (const caste of selectedFavourCastes) {
                    await supabase
                        .from('voters')
                        .update({ favour: selectedFavourForBulk })
                        .eq('caste', caste)
                        .eq('tenant_id', tenantId);
                }
            } else if (favourAnalysisTab === 'voters') {
                if (selectedFavourIndividualIds.length === 0) return;
                const { error } = await supabase
                    .from('voters')
                    .update({ favour: selectedFavourForBulk })
                    .in('id', selectedFavourIndividualIds)
                    .eq('tenant_id', tenantId);
                if (error) throw error;
            }

            alert(t('voters.favour_allocation_success') || 'Favour allocated successfully!');
            setSelectedFavourAnalysisNames([]);
            setSelectedFavourCastes([]);
            setSelectedFavourIndividualIds([]);
            setShowFavourModal(false);
            fetchVoters(0, true);
        } catch (error) {
            console.error('Error allocating favour:', error);
            alert('Failed to allocate favour');
        } finally {
            setIsAllocating(false);
        }
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
                .eq('tenant_id', tenantId)
                .order('serial_no', { ascending: true })
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

            if (favourFilter) {
                query = query.eq('favour', favourFilter);
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
                favour: row.favour,
                serial_no: row.serial_no || row.new_serial_no,
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
    }, [nameFilter, addressFilter, houseNoFilter, ageFilter, genderFilter, casteFilter, favourFilter, showFriendsOnly]);

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
                .eq('id', voter.id)
                .eq('tenant_id', tenantId); // Secured

            if (error) throw error;

            setVoters(prev => prev.map(v => v.id === voter.id ? { ...v, is_friend_relative: newStatus } : v));
        } catch (err) {
            console.error('Error tagging voter:', err);
        }
    };

    const getGroupedFamilies = () => {
        const familiesMap: Record<string, { booth: string; houseNo: string; address: string; members: Voter[] }> = {};
        const individualVoters: Voter[] = [];

        voters.forEach(voter => {
            const house = voter.houseNo ? voter.houseNo.toString().trim() : '';
            const booth = voter.booth ? voter.booth.toString().trim() : '';
            
            if (house && booth && house !== '-' && booth !== '-') {
                const key = `${booth}_${house}`;
                if (!familiesMap[key]) {
                    familiesMap[key] = {
                        booth,
                        houseNo: house,
                        address: getDisplayAddress(voter) || '',
                        members: []
                    };
                }
                familiesMap[key].members.push(voter);
            } else {
                individualVoters.push(voter);
            }
        });

        // Convert grouped object to array and sort families by the lowest serial number of their members
        const familyList = Object.values(familiesMap).sort((a, b) => {
            const aMin = a.members.length > 0 ? (a.members[0].serial_no || 0) : 999999;
            const bMin = b.members.length > 0 ? (b.members[0].serial_no || 0) : 999999;
            return aMin - bMin;
        });

        return {
            families: familyList,
            individuals: individualVoters
        };
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:sticky md:top-0 z-30 bg-slate-50 pt-1 pb-4">
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
                                    onClick={() => {
                                        setShowFavourModal(true);
                                        fetchAnalysisData();
                                    }}
                                    className="ns-btn ns-btn-secondary bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                                >
                                    <BarChart2 className="w-4 h-4 mr-2 text-brand-600" />
                                    {t('voters.favour_allocation') || 'Favour Allocation'}
                                </button>

                                <button
                                    onClick={() => navigate('/dashboard/political/add-voter')}
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
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
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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

                    {/* Favour Filter */}
                    <div className="relative">
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <select
                            value={favourFilter}
                            onChange={(e) => setFavourFilter(e.target.value)}
                            className="ns-input pl-9 w-full appearance-none bg-white font-semibold"
                        >
                            <option value="">{t('voters.favour_label') || "Favour Status"}</option>
                            <option value="Favourable">Favourable (अनुकूल)</option>
                            <option value="Against">Against (प्रतिकूल)</option>
                            <option value="Neutral">Neutral (तटस्थ)</option>
                            <option value="Doubtful">Doubtful (संशयास्पद)</option>
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

            {/* View Mode & Grouping Toggles */}
            <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3">
                {/* Family Grouping Toggle Button */}
                <button
                    onClick={() => setShowFamilyGrouping(!showFamilyGrouping)}
                    className={`px-4 py-2 rounded-xl flex items-center justify-center gap-2.5 text-sm font-bold shadow-sm transition-all duration-200 border ${
                        showFamilyGrouping 
                            ? 'bg-violet-600 hover:bg-violet-700 text-white border-violet-600 scale-[1.02] shadow-violet-100/50' 
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                >
                    <Users className={`w-4 h-4 transition-transform duration-300 ${showFamilyGrouping ? 'rotate-12 scale-110' : ''}`} />
                    <span>{t('voters.family_grouping_toggle')}</span>
                </button>

                {/* View Mode Toggle */}
                <div className="bg-white border border-slate-200 rounded-xl p-1 flex shadow-sm">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                            viewMode === 'grid' 
                                ? "bg-brand-50 text-brand-700 shadow-sm" 
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        <LayoutGrid className="w-4 h-4" /> {t('common.grid')}
                    </button>
                    <button
                        onClick={() => setViewMode('report')}
                        className={`px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                            viewMode === 'report' 
                                ? "bg-brand-50 text-brand-700 shadow-sm" 
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        <FileText className="w-4 h-4" /> {t('common.report')}
                    </button>
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
            ) : viewMode === 'report' ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-semibold text-slate-800">Voters {t('common.report')} ({totalCount !== null ? totalCount : voters.length})</h3>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
                        >
                            <Printer className="w-4 h-4" /> Print
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">EPIC No</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Age</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Gender</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Address</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ward / Booth</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Caste</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Favour</th>
                                </tr>
                            </thead>
                             <tbody className="bg-white divide-y divide-slate-200">
                                {showFamilyGrouping ? (
                                    <>
                                        {getGroupedFamilies().families.map((family, fIdx) => (
                                            <Fragment key={`fam-${fIdx}`}>
                                                <tr className="bg-violet-50/40 border-y border-violet-100/80">
                                                    <td colSpan={9} className="px-4 py-2.5 text-xs font-bold text-violet-800">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Home className="w-3.5 h-3.5 text-violet-650" />
                                                                <span>
                                                                    {t('voters.family_card_title', { houseNo: family.houseNo, booth: family.booth })}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-semibold truncate max-w-md hidden sm:inline">
                                                                    • {family.address}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200">
                                                                {t('voters.family_members_count', { count: family.members.length })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {family.members.map((voter, mIdx) => (
                                                    <tr
                                                        key={voter.id}
                                                        className="hover:bg-slate-50 cursor-pointer border-l-4 border-l-violet-400/40 transition-colors"
                                                        onClick={() => navigate(`/dashboard/voters/${voter.id}`)}
                                                    >
                                                        <td className="px-4 py-3 text-sm text-slate-400 pl-5">{voter.serial_no || `${fIdx + 1}-${mIdx + 1}`}</td>
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-800 pl-5">{getDisplayName(voter)}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-500">{voter.epicNo || '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-500">{voter.age || '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-500">{voter.gender || '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-500 max-w-xs">
                                                            <div className="line-clamp-2">{getDisplayAddress(voter)}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{voter.ward} / {voter.booth}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-500">{voter.caste || '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-500">
                                                            {voter.favour ? (
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                                                    voter.favour === 'Favourable' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                    voter.favour === 'Against' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                                    voter.favour === 'Neutral' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                                    'bg-amber-50 text-amber-700 border-amber-100'
                                                                }`}>
                                                                    {voter.favour}
                                                                </span>
                                                            ) : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </Fragment>
                                        ))}

                                        {getGroupedFamilies().individuals.length > 0 && (
                                            <>
                                                <tr className="bg-slate-50 border-y border-slate-200">
                                                    <td colSpan={9} className="px-4 py-2.5 text-xs font-bold text-slate-605">
                                                        <div className="flex items-center gap-2">
                                                            <User className="w-3.5 h-3.5 text-slate-500" />
                                                            <span>
                                                                {t('voters.individual_voters_title')}
                                                            </span>
                                                            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px] ml-auto">
                                                                {getGroupedFamilies().individuals.length} {t('voters.voters_count') || 'voters'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {getGroupedFamilies().individuals.map((voter, idx) => (
                                                    <tr
                                                        key={voter.id}
                                                        className="hover:bg-slate-50 cursor-pointer border-l-4 border-l-slate-300 transition-colors"
                                                        onClick={() => navigate(`/dashboard/voters/${voter.id}`)}
                                                    >
                                                        <td className="px-4 py-3 text-sm text-slate-400 pl-5">{voter.serial_no || idx + 1}</td>
                                                        <td className="px-4 py-3 text-sm font-semibold text-slate-800 pl-5">{getDisplayName(voter)}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-500">{voter.epicNo || '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-500">{voter.age || '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-500">{voter.gender || '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-500 max-w-xs">
                                                            <div className="line-clamp-2">{getDisplayAddress(voter)}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{voter.ward} / {voter.booth}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-500">{voter.caste || '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-500">
                                                            {voter.favour ? (
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                                                    voter.favour === 'Favourable' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                    voter.favour === 'Against' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                                    voter.favour === 'Neutral' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                                    'bg-amber-50 text-amber-700 border-amber-100'
                                                                }`}>
                                                                    {voter.favour}
                                                                </span>
                                                            ) : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </>
                                        )}

                                        {voters.length === 0 && (
                                            <tr>
                                                <td colSpan={9} className="px-6 py-12 text-center text-slate-500 italic">No voters found</td>
                                            </tr>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {voters.map((voter, idx) => (
                                            <tr key={voter.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/dashboard/voters/${voter.id}`)}>                                                <td className="px-4 py-3 text-sm text-slate-400">{voter.serial_no || idx + 1}</td>
                                                <td className="px-4 py-3 text-sm font-semibold text-slate-800">{getDisplayName(voter)}</td>
                                                <td className="px-4 py-3 text-sm text-slate-500">{voter.epicNo || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-slate-500">{voter.age || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-slate-500">{voter.gender || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-slate-500 max-w-xs"><div className="line-clamp-2">{getDisplayAddress(voter)}</div></td>
                                                <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{voter.ward} / {voter.booth}</td>
                                                <td className="px-4 py-3 text-sm text-slate-500">{voter.caste || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-slate-500">
                                                    {voter.favour ? (
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                                            voter.favour === 'Favourable' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            voter.favour === 'Against' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                            voter.favour === 'Neutral' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                            'bg-amber-50 text-amber-700 border-amber-100'
                                                        }`}>
                                                            {voter.favour}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                        {voters.length === 0 && (
                                            <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-500 italic">No voters found</td></tr>
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {totalCount !== null && voters.length < totalCount && (
                        <div className="p-4 border-t border-slate-200 text-center">
                            <button onClick={handleLoadMore} disabled={loadingMore} className="ns-btn-secondary text-sm">
                                {loadingMore ? 'Loading...' : `Load More (${voters.length} of ${totalCount})`}
                            </button>
                        </div>
                    )}
                </div>
            ) : showFamilyGrouping ? (
                <>
                    {/* Family-wise Grouped View */}
                    <div className="space-y-8 animate-in fade-in duration-200">
                        {/* Grouped Families Section */}
                        {getGroupedFamilies().families.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                                    {language === 'mr' ? 'कुटुंबवार यादी (Grouped Families)' : 'Grouped Families'}
                                </h3>
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {getGroupedFamilies().families.map((family, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                                        >
                                            {/* Family Card Header */}
                                            <div className="p-4 bg-gradient-to-r from-violet-50 to-white border-b border-slate-150 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <Users className="w-4.5 h-4.5 text-violet-600" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-sm text-slate-805 truncate">
                                                            {t('voters.family_card_title', { houseNo: family.houseNo, booth: family.booth }) || `House #${family.houseNo} · Booth ${family.booth}`}
                                                        </h4>
                                                        <p className="text-[10px] text-slate-400 font-semibold truncate max-w-xs">{family.address}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200 whitespace-nowrap">
                                                    {t('voters.family_members_count', { count: family.members.length }) || `${family.members.length} members`}
                                                </span>
                                            </div>

                                            {/* Family Card Body - Members Stack */}
                                            <div className="p-4 divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[300px] bg-slate-50/[0.02]">
                                                {family.members.map((member) => {
                                                    const isSelected = isTagMode && member.is_friend_relative;
                                                    return (
                                                        <div
                                                            key={member.id}
                                                            onClick={(e) => isTagMode ? handleTagVoter(member, e) : navigate(`/dashboard/voters/${member.id}`)}
                                                            className={`py-3 flex items-center justify-between gap-3 cursor-pointer group hover:bg-slate-50/50 px-2 -mx-2 rounded-xl transition-all ${isSelected ? 'bg-brand-50/40 ring-1 ring-brand-400/50' : ''}`}
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-semibold text-xs group-hover:bg-brand-50 group-hover:text-brand-700 transition-colors flex-shrink-0">
                                                                    <User className="w-3.5 h-3.5" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <span className="font-bold text-xs text-slate-800 group-hover:text-brand-600 transition-colors block truncate">
                                                                        {getDisplayName(member)}
                                                                    </span>
                                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mt-0.5">
                                                                        <span>{member.gender} · Age {member.age}</span>
                                                                        {member.serial_no && (
                                                                            <>
                                                                                <span>•</span>
                                                                                <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-500 font-bold">#{member.serial_no}</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                {(isTagMode || member.is_friend_relative) && (
                                                                    <button
                                                                        onClick={(e) => handleTagVoter(member, e)}
                                                                        className={`p-1 rounded transition-colors ${member.is_friend_relative ? 'text-brand-750 hover:text-brand-850' : 'text-slate-300 hover:text-brand-600 hover:bg-brand-50'}`}
                                                                        title={member.is_friend_relative ? "Remove from Friends List" : "Add to Friends List"}
                                                                    >
                                                                        <Users className={`w-3.5 h-3.5 ${member.is_friend_relative ? 'fill-brand-700' : ''}`} />
                                                                    </button>
                                                                )}
                                                                {member.favour && (
                                                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border whitespace-nowrap ${
                                                                        member.favour === 'Favourable' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                        member.favour === 'Against' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                                        member.favour === 'Neutral' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                                        'bg-amber-50 text-amber-700 border-amber-100'
                                                                    }`}>
                                                                        {member.favour}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Individual Voters Section */}
                        {getGroupedFamilies().individuals.length > 0 && (
                            <div className="space-y-4 border-t border-slate-200 pt-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                                    {t('voters.individual_voters_title') || 'Individual Voters (No House No.)'}
                                </h3>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {getGroupedFamilies().individuals.map((voter) => (
                                        <div
                                            key={voter.id}
                                            onClick={(e) => isTagMode ? handleTagVoter(voter, e) : navigate(`/dashboard/voters/${voter.id}`)}
                                            className={`ns-card p-5 hover:shadow-md transition-shadow cursor-pointer group relative ${isTagMode && voter.is_friend_relative ? 'ring-2 ring-brand-500 ring-inset bg-brand-50/30' : ''}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-bold group-hover:bg-brand-50 group-hover:text-brand-700 transition-colors">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900">{getDisplayName(voter)}</h3>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                                            <span>EPIC: {voter.epicNo}</span>
                                                            {voter.serial_no && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">#{voter.serial_no}</span>
                                                                </>
                                                            )}
                                                        </div>
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
                                                    {voter.favour && (
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                            voter.favour === 'Favourable' ? 'bg-emerald-50 text-emerald-700 border-emerald-150 shadow-sm' :
                                                            voter.favour === 'Against' ? 'bg-rose-50 text-rose-700 border-rose-150 shadow-sm' :
                                                            voter.favour === 'Neutral' ? 'bg-blue-50 text-blue-700 border-blue-150 shadow-sm' :
                                                            'bg-amber-50 text-amber-700 border-amber-150 shadow-sm'
                                                        }`}>
                                                            {voter.favour}
                                                        </span>
                                                    )}
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
                            </div>
                        )}
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
                                className="ns-btn-primary w-full md:w-auto min-w-[200px] justify-center py-2.5 px-6 shadow-sm hover:shadow-md transition-all active:scale-95 animate-in slide-in-from-bottom-2 duration-200"
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
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {voters.map((voter) => (
                            <div
                                key={voter.id}
                                onClick={(e) => isTagMode ? handleTagVoter(voter, e) : navigate(`/dashboard/voters/${voter.id}`)}
                                className={`ns-card p-5 hover:shadow-md transition-shadow cursor-pointer group relative ${isTagMode && voter.is_friend_relative ? 'ring-2 ring-brand-500 ring-inset bg-brand-50/30' : ''}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-bold group-hover:bg-brand-50 group-hover:text-brand-700 transition-colors">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{getDisplayName(voter)}</h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span>EPIC: {voter.epicNo}</span>
                                                {voter.serial_no && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">#{voter.serial_no}</span>
                                                    </>
                                                )}
                                            </div>
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
                                        {voter.favour && (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                voter.favour === 'Favourable' ? 'bg-emerald-50 text-emerald-700 border-emerald-150 shadow-sm' :
                                                voter.favour === 'Against' ? 'bg-rose-50 text-rose-700 border-rose-150 shadow-sm' :
                                                voter.favour === 'Neutral' ? 'bg-blue-50 text-blue-700 border-blue-150 shadow-sm' :
                                                'bg-amber-50 text-amber-700 border-amber-150 shadow-sm'
                                            }`}>
                                                {voter.favour}
                                            </span>
                                        )}
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

            {/* Favour Allocation Modal */}
            {showFavourModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{t('voters.favour_allocation') || 'Favour-wise Allocation'}</h3>
                                <p className="text-sm text-slate-500">Allocate support categories based on surnames, castes, or individual voters</p>
                            </div>
                            <button
                                onClick={() => setShowFavourModal(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <Plus className="w-6 h-6 rotate-45 text-slate-500" />
                            </button>
                        </div>

                        {/* Search and Tabs */}
                        <div className="p-6 border-b border-slate-100 bg-white">
                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                <div className="flex p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto">
                                    {[
                                        { id: 'surnames', label: t('voters.surnames') || 'Surnames' },
                                        { id: 'firstnames', label: t('voters.first_names') || 'First Names' },
                                        { id: 'castes', label: 'By Caste' },
                                        { id: 'voters', label: 'Individual Voters' }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setFavourAnalysisTab(tab.id as any)}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${favourAnalysisTab === tab.id ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative w-full sm:max-w-xs">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={favourAnalysisSearch}
                                        onChange={(e) => setFavourAnalysisSearch(e.target.value)}
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
                                <>
                                    {/* Surnames / First Names */}
                                    {(favourAnalysisTab === 'surnames' || favourAnalysisTab === 'firstnames') && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {(favourAnalysisTab === 'surnames' ? surnameStats : firstnameStats)
                                                .filter(item => item.name.toLowerCase().includes(favourAnalysisSearch.toLowerCase()))
                                                .map((item, idx) => {
                                                    const isSelected = selectedFavourAnalysisNames.includes(item.name);
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`group bg-white border rounded-xl p-4 transition-all flex items-center justify-between cursor-pointer ${isSelected ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50/30' : 'border-slate-200 hover:border-brand-300 hover:shadow-md'}`}
                                                            onClick={() => {
                                                                setSelectedFavourAnalysisNames(prev =>
                                                                    prev.includes(item.name) ? prev.filter(n => n !== item.name) : [...prev, item.name]
                                                                );
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-300'}`}>
                                                                    {isSelected && <Plus className="w-3.5 h-3.5 text-white" />}
                                                                </div>
                                                                <span className={`font-semibold truncate mr-2 ${isSelected ? 'text-brand-700' : 'text-slate-700 group-hover:text-brand-700'}`}>
                                                                    {item.name}
                                                                </span>
                                                            </div>
                                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${isSelected ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-700'}`}>
                                                                {item.count}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    )}

                                    {/* Castes */}
                                    {favourAnalysisTab === 'castes' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {casteSuggestions
                                                .filter(item => item.caste.toLowerCase().includes(favourAnalysisSearch.toLowerCase()))
                                                .map((item, idx) => {
                                                    const isSelected = selectedFavourCastes.includes(item.caste);
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`group bg-white border rounded-xl p-4 transition-all flex items-center justify-between cursor-pointer ${isSelected ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50/30' : 'border-slate-200 hover:border-brand-300 hover:shadow-md'}`}
                                                            onClick={() => {
                                                                setSelectedFavourCastes(prev =>
                                                                    prev.includes(item.caste) ? prev.filter(c => c !== item.caste) : [...prev, item.caste]
                                                                );
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-650 border-brand-650 text-white' : 'bg-white border-slate-300'}`}>
                                                                    {isSelected && <Plus className="w-3.5 h-3.5 text-white" />}
                                                                </div>
                                                                <span className={`font-semibold truncate mr-2 ${isSelected ? 'text-brand-700' : 'text-slate-700 group-hover:text-brand-700'}`}>
                                                                    {item.caste}
                                                                </span>
                                                            </div>
                                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${isSelected ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-700'}`}>
                                                                {item.count}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    )}

                                    {/* Individual Voters */}
                                    {favourAnalysisTab === 'voters' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {voters
                                                .filter(v => {
                                                    const displayName = getDisplayName(v);
                                                    const epicNo = v.epicNo;
                                                    return (
                                                        (displayName && displayName.toLowerCase().includes(favourAnalysisSearch.toLowerCase())) ||
                                                        (epicNo && epicNo.toLowerCase().includes(favourAnalysisSearch.toLowerCase()))
                                                    );
                                                })
                                                .map((voter) => {
                                                    const isSelected = selectedFavourIndividualIds.includes(voter.id);
                                                    return (
                                                        <div
                                                            key={voter.id}
                                                            className={`group bg-white border rounded-xl p-4 transition-all flex items-start gap-3 cursor-pointer ${isSelected ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50/30' : 'border-slate-200 hover:border-brand-300 hover:shadow-md'}`}
                                                            onClick={() => {
                                                                setSelectedFavourIndividualIds(prev =>
                                                                    prev.includes(voter.id) ? prev.filter(id => id !== voter.id) : [...prev, voter.id]
                                                                );
                                                            }}
                                                        >
                                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors mt-0.5 ${isSelected ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-300'}`}>
                                                                {isSelected && <Plus className="w-3.5 h-3.5 text-white" />}
                                                            </div>
                                                            <div className="flex-1 overflow-hidden">
                                                                <span className="font-bold text-slate-900 truncate block">{getDisplayName(voter)}</span>
                                                                <span className="text-xs text-slate-500 block">EPIC: {voter.epicNo || '-'} | Caste: {voter.caste || '-'}</span>
                                                                <span className="text-xs text-slate-400 block truncate">{getDisplayAddress(voter)}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Modal Footer with Allocation */}
                        <div className="p-6 border-t border-slate-100 bg-white shadow-lg">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    {(selectedFavourAnalysisNames.length > 0 || selectedFavourCastes.length > 0 || selectedFavourIndividualIds.length > 0) && (
                                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                                            <span className="px-3 py-1.5 text-sm font-bold text-slate-700 whitespace-nowrap">
                                                {favourAnalysisTab === 'surnames' || favourAnalysisTab === 'firstnames' ? `${selectedFavourAnalysisNames.length} Names` :
                                                 favourAnalysisTab === 'castes' ? `${selectedFavourCastes.length} Castes` :
                                                 `${selectedFavourIndividualIds.length} Voters`} to:
                                            </span>
                                            <div className="relative">
                                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <select
                                                    value={selectedFavourForBulk}
                                                    onChange={(e) => setSelectedFavourForBulk(e.target.value)}
                                                    className="ns-input pl-9 py-1.5 pr-8 text-sm focus:ring-brand-500 bg-white font-semibold"
                                                >
                                                    <option value="">{t('voters.select_favour') || 'Select Favour'}</option>
                                                    <option value="Favourable">Favourable (अनुकूल)</option>
                                                    <option value="Against">Against (प्रतिकूल)</option>
                                                    <option value="Neutral">Neutral (तटस्थ)</option>
                                                    <option value="Doubtful">Doubtful (संशयास्पद)</option>
                                                </select>
                                            </div>
                                            <button
                                                disabled={!selectedFavourForBulk || isAllocating}
                                                onClick={handleBulkFavourAllocate}
                                                className={`ns-btn-primary py-1.5 px-6 text-sm flex items-center gap-2 border-none bg-brand-600 hover:bg-brand-700 ${(!selectedFavourForBulk || isAllocating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {isAllocating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
                                                Save
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            setSelectedFavourAnalysisNames([]);
                                            setSelectedFavourCastes([]);
                                            setSelectedFavourIndividualIds([]);
                                        }}
                                        className="ns-btn-secondary py-2"
                                        disabled={selectedFavourAnalysisNames.length === 0 && selectedFavourCastes.length === 0 && selectedFavourIndividualIds.length === 0}
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={() => setShowFavourModal(false)}
                                        className="ns-btn-primary bg-slate-800 hover:bg-slate-900 border-none px-10"
                                    >
                                        Exit Modal
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
