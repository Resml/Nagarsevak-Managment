import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, User, Home, Filter, RefreshCw, ChevronDown } from 'lucide-react';
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
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);

    // Suggestions State
    const [addressSuggestions, setAddressSuggestions] = useState<{ address: string; count: number }[]>([]);
    const [houseNoSuggestions, setHouseNoSuggestions] = useState<{ house_no: string; count: number }[]>([]);
    const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
    const [showHouseNoSuggestions, setShowHouseNoSuggestions] = useState(false);

    const addressWrapperRef = useRef<HTMLDivElement>(null);
    const houseNoWrapperRef = useRef<HTMLDivElement>(null);

    // Helper to get display name based on language
    const getDisplayName = (voter: Voter) => {
        if (language === 'mr' || language === 'hi') {
            return voter.name_marathi || voter.name || voter.name_english;
        }
        return voter.name_english || voter.name;
    };

    const getDisplayAddress = (voter: Voter) => {
        if (language === 'mr' || language === 'hi') {
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
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch Stats for Suggestions
    useEffect(() => {
        const fetchStats = async () => {
            // Fetch Address Stats
            const { data: addrData } = await supabase.rpc('get_unique_addresses');
            if (addrData) setAddressSuggestions(addrData);

            // Fetch House No Stats
            const { data: houseData } = await supabase.rpc('get_unique_house_numbers');
            if (houseData) setHouseNoSuggestions(houseData);
        };
        fetchStats();
    }, []);

    // Filter Suggestions based on input
    const filteredAddresses = addressSuggestions.filter(item =>
        item.address.toLowerCase().includes(addressFilter.toLowerCase())
    ).slice(0, 100); // Limit to 100

    const filteredHouseNos = houseNoSuggestions.filter(item =>
        item.house_no.toLowerCase().includes(houseNoFilter.toLowerCase())
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
    }, [nameFilter, addressFilter, houseNoFilter, ageFilter, genderFilter]);

    // Initial load and filter change
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sticky top-0 z-30 bg-slate-50 pt-1 pb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('voters.title')}</h1>
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-slate-500">Search voters by detail</p>
                            {totalCount !== null && (
                                <span className="ns-badge bg-brand-50 text-brand-700 border-brand-200">
                                    Found: {totalCount}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                            placeholder="Search Address"
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
                            placeholder="House No."
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
                        <input
                            type="text"
                            placeholder="Age (e.g. 25-30)"
                            value={ageFilter}
                            onChange={(e) => setAgeFilter(e.target.value)}
                            className="ns-input w-full"
                        />
                    </div>

                    {/* Gender Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <select
                            value={genderFilter}
                            onChange={(e) => setGenderFilter(e.target.value)}
                            className="ns-input pl-9 w-full appearance-none bg-white"
                        >
                            <option value="">All Genders</option>
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                            <option value="O">Other</option>
                        </select>
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
                                onClick={() => navigate(`/voters/${voter.id}`)}
                                className="ns-card p-5 hover:shadow-md transition-shadow cursor-pointer group"
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
                                    <span className="ns-badge border-slate-200 bg-slate-50 text-slate-600">
                                        {t('voters.ward')} {voter.ward}
                                    </span>
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
        </div>
    );
};

export default VoterList;
