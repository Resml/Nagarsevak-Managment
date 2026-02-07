import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, Phone, MapPin, UserCheck, User, Plus, PlusCircle, X, Trash2, Home, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { MockService } from '../../services/mockData';
import { CUSTOM_TRANSLATIONS } from '../../services/translationService';
import { type Voter, type Sadasya } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { supabase } from '../../services/supabaseClient';
import { format } from 'date-fns';
import { mr } from '../../utils/marathiLocale';
import SadasyaProfile from './SadasyaProfile';

const getGenderDisplay = (gender: string) => {
    switch (gender) {
        case 'M': return 'Male';
        case 'F': return 'Female';
        case 'O': return 'Other';
        default: return gender;
    }
};

const SadasyaList = () => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();
    const [searchTerm, setSearchTerm] = useState('');
    const [areaSearch, setAreaSearch] = useState('');
    const [addressSearch, setAddressSearch] = useState('');
    const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
    const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
    const [filterVoter, setFilterVoter] = useState<'all' | 'voter' | 'non-voter'>('all');

    // Refs for click outside
    const areaWrapperRef = useRef<HTMLDivElement>(null);
    const addressWrapperRef = useRef<HTMLDivElement>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'search' | 'manual'>('search');

    // Advanced Search State (for Voter Search Modal)
    const [nameFilter, setNameFilter] = useState('');
    const [addressFilter, setAddressFilter] = useState('');
    const [houseNoFilter, setHouseNoFilter] = useState('');
    const [ageFilter, setAgeFilter] = useState('');
    const [genderFilter, setGenderFilter] = useState('');
    const [isLoadingVoters, setIsLoadingVoters] = useState(false);
    const [voterResults, setVoterResults] = useState<Voter[]>([]);
    const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null); // Moved up from original position

    // Profile View State
    const [selectedMember, setSelectedMember] = useState<Sadasya | null>(null);

    // Suggestions State (for Voter Search Modal)
    const [addressSuggestions, setAddressSuggestions] = useState<{ address: string; count: number }[]>([]);
    const [houseNoSuggestions, setHouseNoSuggestions] = useState<{ house_no: string; count: number }[]>([]);
    const [showHouseNoSuggestions, setShowHouseNoSuggestions] = useState(false);

    const houseNoWrapperRef = useRef<HTMLDivElement>(null);

    // Pagination State
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const LIMIT = 50;

    // Initialize with default query when modal opens
    const initVoterList = () => {
        // Reset filters
        setNameFilter('');
        setAddressFilter('');
        setHouseNoFilter('');
        setAgeFilter('');
        setGenderFilter('');
        setVoterResults([]);
        setPage(0);
        setHasMore(true);
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
            if (areaWrapperRef.current && !areaWrapperRef.current.contains(event.target as Node)) {
                setShowAreaSuggestions(false);
            }
            // Note: We're reusing addressWrapperRef name potentially clashing if defined twice in same scope? 
            // The file shows addressWrapperRef defined inside SadasyaList component at line 36.
            // Wait, I am editing SadasyaList. The previous view_file showed existing refs for the Modal search but here I need refs for the MAIN search bar.
            // Let's reuse them or create new ones if they are separate.
            // The existing refs (addressWrapperRef, houseNoWrapperRef) seem to be used for the Modal Search (ActiveTab === 'search').
            // The new search bars are in the main list view.
            // I should double check if I can reuse or need new refs. The modal is separate.
            // Let's create `mainAreaWrapperRef` and `mainAddressWrapperRef` to avoid conflict.
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch Stats for Suggestions
    useEffect(() => {
        if (!isModalOpen) return;
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
    }, [isModalOpen, language, tenantId]);

    // Filter Suggestions based on input
    const filteredAddresses = addressSuggestions.filter(item =>
        item.address.toLowerCase().includes(addressFilter.toLowerCase())
    ).slice(0, 100);

    const filteredHouseNos = houseNoSuggestions.filter(item =>
        item.house_no.toLowerCase().includes(houseNoFilter.toLowerCase())
    ).slice(0, 100);

    // Debounced Advanced Search
    useEffect(() => {
        if (!isModalOpen || activeTab !== 'search') return;

        // Reset page when filters change
        setPage(0);
        const timeoutId = setTimeout(() => {
            fetchVoters(0);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [nameFilter, addressFilter, houseNoFilter, ageFilter, genderFilter, isModalOpen, activeTab]);

    const fetchVoters = async (pageNumber: number) => {
        if (pageNumber === 0) setIsLoadingVoters(true);
        else setIsLoadingMore(true);

        try {
            const start = pageNumber * LIMIT;
            const end = start + LIMIT - 1;

            let query = supabase
                .from('voters')
                .select('*')
                .eq('tenant_id', tenantId)
                .range(start, end);

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

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching voters:', error);
                return;
            }

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

            if (mappedVoters.length < LIMIT) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            if (pageNumber === 0) {
                setVoterResults(mappedVoters);
            } else {
                setVoterResults(prev => [...prev, ...mappedVoters]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingVoters(false);
            setIsLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchVoters(nextPage);
    };

    // Manual Entry State
    const [manualForm, setManualForm] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        mobile: '+91 ',
        age: '',
        gender: '' as 'M' | 'F' | 'O' | '',
        ward: '',
        area: '',
        address: '',
    });

    // In a real app, this would be fetched via useEffect and re-fetched on update
    // Using a simple state to trigger re-renders when data changes
    const [, setRefreshTrigger] = useState(0);
    const sadasyas = MockService.getSadasyas();

    const getDisplayName = (member: any) => {
        if (language === 'mr') {
            return member.name_marathi || member.name || member.name_english;
        }
        return member.name_english || member.name;
    };

    const getDisplayAddress = (member: any) => {
        if (language === 'mr') {
            return member.address_marathi || member.address || member.address_english;
        }
        return member.address_english || member.address;
    };

    const getDisplayArea = (area: string | undefined) => {
        if (!area) return '';
        if (language === 'mr') {
            return CUSTOM_TRANSLATIONS[area] || area;
        }
        return area;
    };

    // Extract Unique Values with Counts for Autocomplete
    const getSuggestionsWithCounts = (items: (string | undefined)[]) => {
        const counts: Record<string, number> = {};
        items.forEach(item => {
            const val = item?.trim();
            if (val) counts[val] = (counts[val] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count);
    };

    const areaSuggestionsWithCounts = getSuggestionsWithCounts(sadasyas.map(s => s.area));
    const addressSuggestionsWithCounts = getSuggestionsWithCounts(sadasyas.map(s => getDisplayAddress(s)));

    // Filter suggestions based on input (show top results if input is empty)
    const filteredAreaSuggestions = areaSuggestionsWithCounts.filter(item =>
        !areaSearch || item.value.toLowerCase().includes(areaSearch.toLowerCase())
    ).slice(0, 10);

    const filteredAddressSuggestions = addressSuggestionsWithCounts.filter(item =>
        !addressSearch || item.value.toLowerCase().includes(addressSearch.toLowerCase())
    ).slice(0, 10);

    const filteredSadasyas = sadasyas.filter((sadasya) => {
        const matchesSearch = sadasya.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sadasya.mobile.includes(searchTerm);

        const matchesArea = areaSearch ? (
            (sadasya.area?.toLowerCase() || '').includes(areaSearch.toLowerCase()) ||
            (getDisplayArea(sadasya.area).toLowerCase()).includes(areaSearch.toLowerCase())
        ) : true;

        // Use localized address for matching
        const displayAddress = getDisplayAddress(sadasya);
        const matchesAddress = addressSearch ? (displayAddress?.toLowerCase() || '').includes(addressSearch.toLowerCase()) : true;

        const matchesAll = matchesSearch && matchesArea && matchesAddress;

        if (filterVoter === 'voter') return matchesAll && sadasya.isVoter;
        if (filterVoter === 'non-voter') return matchesAll && !sadasya.isVoter;
        return matchesAll;
    });

    // Confirm Add Voter State
    // const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null); // Moved up
    const [confirmMobile, setConfirmMobile] = useState('');
    const [confirmArea, setConfirmArea] = useState('');

    // Delete Confirmation State
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);

    // Edit State
    const [editingSadasyaId, setEditingSadasyaId] = useState<string | null>(null);

    const onSelectVoter = (voter: Voter) => {
        setSelectedVoter(voter);
        let mobile = voter.mobile || '';
        // Ensure +91 prefix if not present
        if (mobile && !mobile.trim().startsWith('+91')) {
            mobile = `+91 ${mobile.trim()}`;
        } else if (!mobile) {
            mobile = '+91 ';
        }
        setConfirmMobile(mobile);
        setConfirmArea('');
    };

    const confirmAddVoter = () => {
        if (!selectedVoter) return;

        const promise = new Promise((resolve) => setTimeout(resolve, 1000));

        toast.promise(promise, {
            loading: 'Adding Sadasya...',
            success: () => {
                MockService.addSadasya({
                    name: selectedVoter.name,
                    name_marathi: selectedVoter.name_marathi,
                    name_english: selectedVoter.name_english,
                    mobile: confirmMobile,
                    age: selectedVoter.age,
                    address: selectedVoter.address,
                    address_marathi: selectedVoter.address_marathi,
                    address_english: selectedVoter.address_english,
                    area: confirmArea,
                    isVoter: true,
                    voterId: selectedVoter.epicNo
                });

                // Reset and Close
                setSelectedVoter(null);
                setConfirmMobile('');
                setConfirmArea('');
                setIsModalOpen(false);
                setRefreshTrigger(prev => prev + 1);
                initVoterList();

                return `${selectedVoter.name} added as Sadasya!`;
            },
            error: 'Failed to add Sadasya',
        });
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const promise = new Promise((resolve) => setTimeout(resolve, 800));

        toast.promise(promise, {
            loading: editingSadasyaId ? 'Updating Member...' : 'Adding Member...',
            success: () => {
                if (editingSadasyaId) {
                    const fullName = [manualForm.firstName, manualForm.middleName, manualForm.lastName].filter(Boolean).join(' ');
                    MockService.updateSadasya(editingSadasyaId, {
                        name: fullName,
                        mobile: manualForm.mobile,
                        age: parseInt(manualForm.age) || 0,
                        gender: manualForm.gender || undefined,
                        ward: manualForm.ward,
                        address: manualForm.address,
                        area: manualForm.area,
                    });
                } else {
                    const fullName = [manualForm.firstName, manualForm.middleName, manualForm.lastName].filter(Boolean).join(' ');
                    MockService.addSadasya({
                        name: fullName,
                        mobile: manualForm.mobile,
                        age: parseInt(manualForm.age) || 0,
                        gender: manualForm.gender || undefined,
                        ward: manualForm.ward,
                        address: manualForm.address,
                        area: manualForm.area,
                        isVoter: false
                    });
                }
                setIsModalOpen(false);
                setRefreshTrigger(prev => prev + 1);
                setManualForm({ firstName: '', middleName: '', lastName: '', mobile: '+91 ', age: '', gender: '', ward: '', address: '', area: '' });
                setEditingSadasyaId(null);
                setSelectedMember(null); // Ensure profile view is reset if editing from there
                return editingSadasyaId ? 'Member updated successfully!' : 'Member added successfully!';
            },
            error: 'Failed to save member',
        });
    };

    const handleEditClick = (member: Sadasya) => {
        setEditingSadasyaId(member.id);
        const name = member.name_marathi || member.name || member.name_english || '';
        const address = member.address_marathi || member.address || member.address_english || '';

        const parts = name.trim().split(/\s+/);
        let f = '', m = '', l = '';
        if (parts.length > 0) f = parts[0];
        if (parts.length === 2) l = parts[1];
        if (parts.length >= 3) {
            m = parts[1];
            l = parts.slice(2).join(' ');
        }

        setManualForm({
            firstName: f,
            middleName: m,
            lastName: l,
            mobile: member.mobile,
            age: member.age?.toString() || '',
            gender: member.gender || '',
            ward: member.ward || '',
            area: member.area || '',
            address: address,
        });
        setActiveTab('manual');
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: string, name: string) => {
        setDeleteTarget({ id, name });
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;

        MockService.deleteSadasya(deleteTarget.id);
        setRefreshTrigger(prev => prev + 1);
        toast.success(`${deleteTarget.name} removed.`);
        setDeleteTarget(null);
        setSelectedMember(null); // Close profile view if the member was deleted
    };

    const renderContent = () => {
        if (selectedMember) {
            return (
                <SadasyaProfile
                    member={selectedMember}
                    onBack={() => setSelectedMember(null)}
                    onEdit={(member) => {
                        handleEditClick(member);
                    }}
                    onDelete={(id, name) => {
                        handleDeleteClick(id, name);
                    }}
                />
            );
        }

        return (
            <div className="space-y-6">
                <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{t('sadasya.title')}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-slate-500">{t('sadasya.subtitle')}</p>
                                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-sky-50 text-sky-700 border border-sky-200">
                                    {t('sadasya.found')}: {filteredSadasyas.length}
                                </span>
                                {filteredSadasyas.length !== sadasyas.length && (
                                    <span className="text-xs text-slate-400">
                                        {t('sadasya.of')} {sadasyas.length}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setIsModalOpen(true);
                                setEditingSadasyaId(null); // Reset edit mode
                                initVoterList();
                                setManualForm({ firstName: '', middleName: '', lastName: '', mobile: '+91 ', age: '', gender: '', ward: '', address: '', area: '' }); // Clear form
                            }}
                            className="ns-btn-primary"
                        >
                            <Plus className="w-5 h-5" />
                            <span>{t('sadasya.add_member')}</span>
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="ns-card p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder={t('sadasya.search_voter_label') || "Search Voter by Name, EPIC No or Mobile..."}
                                className="ns-input pl-10 w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="relative" ref={areaWrapperRef}>
                            <input
                                type="text"
                                placeholder={t('sadasya.search_area') || "Search Area"}
                                className="ns-input w-full"
                                value={areaSearch}
                                onFocus={() => setShowAreaSuggestions(true)}
                                onChange={(e) => {
                                    setAreaSearch(e.target.value);
                                    setShowAreaSuggestions(true);
                                }}
                            />
                            {showAreaSuggestions && filteredAreaSuggestions.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {filteredAreaSuggestions.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 flex justify-between"
                                            onClick={() => {
                                                setAreaSearch(getDisplayArea(item.value));
                                                setShowAreaSuggestions(false);
                                            }}
                                        >
                                            <span>{getDisplayArea(item.value)}</span>
                                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={addressWrapperRef}>
                            <input
                                type="text"
                                placeholder={t('sadasya.search_address') || "Search Address"}
                                className="ns-input w-full"
                                value={addressSearch}
                                onFocus={() => setShowAddressSuggestions(true)}
                                onChange={(e) => {
                                    setAddressSearch(e.target.value);
                                    setShowAddressSuggestions(true);
                                }}
                            />
                            {showAddressSuggestions && filteredAddressSuggestions.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {filteredAddressSuggestions.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 flex justify-between"
                                            onClick={() => {
                                                setAddressSearch(item.value);
                                                setShowAddressSuggestions(false);
                                            }}
                                        >
                                            <span>{item.value}</span>
                                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <select
                                className="ns-input w-full"
                                value={filterVoter}
                                onChange={(e) => setFilterVoter(e.target.value as any)}
                            >
                                <option value="all">{t('sadasya.filter_all')}</option>
                                <option value="voter">{t('sadasya.filter_voters')}</option>
                                <option value="non-voter">{t('sadasya.filter_non_voters')}</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block ns-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200/70">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('sadasya.member')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('sadasya.contact')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('sadasya.area_address')}</th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('sadasya.joined_date')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200/70">
                                {filteredSadasyas.length > 0 ? (
                                    filteredSadasyas.map((member) => (
                                        <tr
                                            key={member.id}
                                            className="hover:bg-slate-50 transition-colors cursor-pointer"
                                            onClick={() => setSelectedMember(member)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 shadow-sm border border-brand-100">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-slate-900 group-hover:text-brand-700 transition-colors">
                                                            {getDisplayName(member)}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${member.isVoter ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                                                                {member.isVoter ? t('sadasya.is_voter') : t('sadasya.is_member')}
                                                            </span>
                                                            {member.age > 0 && (
                                                                <span className="text-xs text-slate-500 border-l border-slate-300 pl-2">
                                                                    {t('sadasya.age_label')}: {member.age}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-slate-600">
                                                    <Phone className="w-4 h-4 mr-2 text-slate-400" />
                                                    {member.mobile}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center mb-1 gap-2">
                                                    {member.area ? (
                                                        <span className="text-sm font-medium text-slate-900 group-hover:text-brand-700 transition-colors">{getDisplayArea(member.area)}</span>
                                                    ) : (
                                                        <span className="text-sm font-medium text-slate-500 italic">{t('sadasya.no_area') || "No Area"}</span>
                                                    )}
                                                    {member.ward && <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">Ward {member.ward}</span>}
                                                </div>
                                                <div className="flex items-center text-xs text-slate-500">
                                                    <MapPin className="w-3 h-3 mr-1 text-slate-400 flex-shrink-0" />
                                                    <span className="truncate max-w-[200px]" title={getDisplayAddress(member)}>
                                                        {getDisplayAddress(member)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {format(new Date(member.registeredAt), 'MMM d, yyyy', { locale: language === 'mr' ? mr : undefined })}
                                            </td>

                                        </tr>
                                    ))
                                ) : (
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-3">
                                                <User className="w-8 h-8 text-slate-400" />
                                            </div>
                                            <p className="text-slate-500 mb-4">{t('No Members') || "No members found."}</p>
                                            <button
                                                onClick={() => {
                                                    setIsModalOpen(true);
                                                    initVoterList();
                                                }}
                                                className="ns-btn-primary"
                                            >
                                                <Plus className="w-4 h-4" /> {t('sadasya.add_member')}
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {filteredSadasyas.map((member) => (
                        <div key={member.id} className="ns-card p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-brand-50 text-brand-700 rounded-2xl border border-brand-100 flex items-center justify-center font-bold">
                                        {member.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{getDisplayName(member)}</h3>
                                        <p className="text-xs text-slate-500">{t('sadasya.age_label')}: {member.age}</p>
                                    </div>
                                </div>
                                {member.isVoter ? (
                                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded flex items-center gap-1">
                                        <UserCheck className="w-3 h-3" /> Voter
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded flex items-center gap-1">
                                        <User className="w-3 h-3" /> Member
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2 text-sm text-slate-600 pt-2 border-t border-slate-200/70">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    <span>{member.mobile}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                                    <div className="flex flex-col">
                                        {member.area && <span className="font-bold text-slate-900">{getDisplayArea(member.area)}</span>}
                                        <span className="line-clamp-2">{getDisplayAddress(member)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                    <span>{t('sadasya.joined')}: {format(new Date(member.registeredAt), 'MMM d, yyyy', { locale: language === 'mr' ? mr : undefined })}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredSadasyas.length === 0 && (
                        <div className="py-12 text-center text-slate-500 ns-card border-dashed">
                            No members found.
                        </div>
                    )}
                </div>
            </div >
        );
    };

    return (
        <>
            {renderContent()}

            {/* Add Member Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="ns-card w-full max-w-lg overflow-hidden">
                            <div className="flex justify-between items-center p-6 border-b border-slate-200/70">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editingSadasyaId ? t('sadasya.edit_modal_title') || 'Edit Member' : t('sadasya.add_modal_title')}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {!editingSadasyaId && (
                                <div className="flex border-b border-slate-200/70">
                                    <button
                                        className={`flex-1 py-3 text-sm font-semibold ${activeTab === 'search' ? 'text-brand-700 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                                        onClick={() => setActiveTab('search')}
                                    >
                                        {t('sadasya.search_tab')}
                                    </button>
                                    <button
                                        className={`flex-1 py-3 text-sm font-semibold ${activeTab === 'manual' ? 'text-brand-700 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                                        onClick={() => setActiveTab('manual')}
                                    >
                                        {t('sadasya.manual_tab')}
                                    </button>
                                </div>
                            )}

                            <div className="p-6">
                                {/* Voter Search Tab Content */}
                                {activeTab === 'search' ? (
                                    selectedVoter ? (
                                        <div className="space-y-4">
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                                                <h3 className="font-semibold text-slate-900">Confirm member details</h3>
                                                <p className="text-sm text-slate-600 mt-1">Verify the details before adding.</p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t('sadasya.name')}</label>
                                                <p className="mt-1 text-gray-900 p-2 bg-gray-50 rounded-md">{getDisplayName(selectedVoter)}</p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Mobile Number <span className="text-red-500">*</span></label>
                                                <input
                                                    type="tel"
                                                    value={confirmMobile}
                                                    onChange={(e) => setConfirmMobile(e.target.value)}
                                                    placeholder="+91 9999999999"
                                                    className="ns-input mt-1"
                                                    autoFocus
                                                />
                                                {!selectedVoter.mobile && (
                                                    <p className="mt-1 text-xs text-amber-600">Mobile number missing in voter record. Please enter it.</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t('sadasya.area') || "Area / Colony"}</label>
                                                <input
                                                    type="text"
                                                    value={confirmArea}
                                                    onChange={(e) => setConfirmArea(e.target.value)}
                                                    placeholder={t('sadasya.area_name_placeholder') || "Enter Area / Colony Name"}
                                                    className="ns-input mt-1"
                                                />
                                            </div>

                                            <button
                                                onClick={confirmAddVoter}
                                                className="ns-btn-primary w-full justify-center"
                                            >
                                                {t('sadasya.confirm_add')}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Advanced Search Fields */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    placeholder={t('sadasya.search_name_placeholder')}
                                                    className="ns-input"
                                                    value={nameFilter}
                                                    onChange={(e) => setNameFilter(e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder={t('sadasya.search_house_no')}
                                                    className="ns-input"
                                                    value={houseNoFilter}
                                                    onFocus={() => setShowHouseNoSuggestions(true)}
                                                    onChange={(e) => {
                                                        setHouseNoFilter(e.target.value);
                                                        setShowHouseNoSuggestions(true);
                                                    }}
                                                />
                                            </div>

                                            {/* House No Suggestions */}
                                            {showHouseNoSuggestions && filteredHouseNos.length > 0 && (
                                                <div className="relative" ref={houseNoWrapperRef}>
                                                    <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                                        {filteredHouseNos.map((item, idx) => (
                                                            <button
                                                                key={idx}
                                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm flex justify-between"
                                                                onClick={() => {
                                                                    setHouseNoFilter(item.house_no);
                                                                    setShowHouseNoSuggestions(false);
                                                                }}
                                                            >
                                                                <span>{item.house_no}</span>
                                                                <span className="text-xs text-slate-500 bg-slate-100 px-1 rounded">{item.count}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    placeholder={t('sadasya.age_range_placeholder')}
                                                    className="ns-input"
                                                    value={ageFilter}
                                                    onChange={(e) => setAgeFilter(e.target.value)}
                                                />
                                                <select
                                                    className="ns-input"
                                                    value={genderFilter}
                                                    onChange={(e) => setGenderFilter(e.target.value)}
                                                >
                                                    <option value="">{t('sadasya.all_genders')}</option>
                                                    <option value="M">Male</option>
                                                    <option value="F">Female</option>
                                                    <option value="O">Other</option>
                                                </select>
                                            </div>

                                            <div className="relative" ref={addressWrapperRef}>
                                                <input
                                                    type="text"
                                                    placeholder={t('sadasya.search_address')}
                                                    className="ns-input w-full"
                                                    value={addressFilter}
                                                    onFocus={() => setShowAddressSuggestions(true)}
                                                    onChange={(e) => {
                                                        setAddressFilter(e.target.value);
                                                        setShowAddressSuggestions(true);
                                                    }}
                                                />
                                                {/* Address Suggestions */}
                                                {showAddressSuggestions && filteredAddresses.length > 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                                        {filteredAddresses.map((item, idx) => (
                                                            <button
                                                                key={idx}
                                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm flex justify-between"
                                                                onClick={() => {
                                                                    setAddressFilter(item.address);
                                                                    setShowAddressSuggestions(false);
                                                                }}
                                                            >
                                                                <span className="truncate">{item.address}</span>
                                                                <span className="text-xs text-slate-500 bg-slate-100 px-1 rounded ml-2 whitespace-nowrap">{item.count}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Results List */}
                                            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto bg-slate-50">
                                                {isLoadingVoters ? (
                                                    <div className="p-4 text-center text-slate-500">Searching voters...</div>
                                                ) : voterResults.length > 0 ? (
                                                    <div className="divide-y divide-slate-200">
                                                        {voterResults.map((voter) => (
                                                            <div
                                                                key={voter.id}
                                                                className="p-3 bg-white hover:bg-blue-50 cursor-pointer transition-colors"
                                                                onClick={() => onSelectVoter(voter)}
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <div className="font-medium text-slate-900">{getDisplayName(voter)}</div>
                                                                        <div className="text-xs text-slate-500 mt-0.5">
                                                                            {t('sadasya.age_label')}: {voter.age} • {getGenderDisplay(voter.gender)} • EPIC: {voter.epicNo}
                                                                        </div>
                                                                        <div className="text-xs text-slate-400 mt-1 line-clamp-1">{getDisplayAddress(voter)}</div>
                                                                    </div>
                                                                    <PlusCircle className="w-5 h-5 text-brand-600" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {hasMore && (
                                                            <button
                                                                onClick={handleLoadMore}
                                                                disabled={isLoadingMore}
                                                                className="w-full py-2 text-sm text-brand-600 hover:bg-brand-50 font-medium"
                                                            >
                                                                {isLoadingMore ? 'Loading...' : 'Load More Results'}
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                                                        <Search className="w-8 h-8 mb-2 opacity-50" />
                                                        <p>No voters found matching criteria.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <form onSubmit={handleManualSubmit} className="space-y-4">
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t('sadasya.first_name')}</label>
                                                <input
                                                    type="text" required
                                                    className="ns-input mt-1"
                                                    value={manualForm.firstName}
                                                    onChange={(e) => setManualForm({ ...manualForm, firstName: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t('sadasya.middle_name')}</label>
                                                <input
                                                    type="text"
                                                    className="ns-input mt-1"
                                                    value={manualForm.middleName}
                                                    onChange={(e) => setManualForm({ ...manualForm, middleName: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t('sadasya.last_name')}</label>
                                                <input
                                                    type="text" required
                                                    className="ns-input mt-1"
                                                    value={manualForm.lastName}
                                                    onChange={(e) => setManualForm({ ...manualForm, lastName: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">{t('sadasya.mobile')}</label>
                                            <input
                                                type="tel"
                                                className="ns-input mt-1"
                                                value={manualForm.mobile}
                                                onChange={(e) => setManualForm({ ...manualForm, mobile: e.target.value })}
                                                placeholder="+91"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t('sadasya.age_label')}</label>
                                                <input
                                                    type="number" required min="18"
                                                    className="ns-input mt-1"
                                                    value={manualForm.age}
                                                    onChange={(e) => setManualForm({ ...manualForm, age: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t('sadasya.gender')}</label>
                                                <select
                                                    className="ns-input mt-1"
                                                    value={manualForm.gender}
                                                    onChange={(e) => setManualForm({ ...manualForm, gender: e.target.value as 'M' | 'F' | 'O' })}
                                                >
                                                    <option value="">{t('sadasya.select')}</option>
                                                    <option value="M">{t('voter_profile.gender_male')}</option>
                                                    <option value="F">{t('voter_profile.gender_female')}</option>
                                                    <option value="O">{t('voter_profile.gender_other')}</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">{t('sadasya.ward')}</label>
                                            <input
                                                type="text"
                                                className="ns-input mt-1"
                                                value={manualForm.ward}
                                                onChange={(e) => setManualForm({ ...manualForm, ward: e.target.value })}
                                                placeholder={t('sadasya.enter_ward_no')}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">{t('sadasya.area')}</label>
                                            <input
                                                type="text"
                                                className="ns-input mt-1"
                                                value={manualForm.area || ''}
                                                onChange={(e) => setManualForm({ ...manualForm, area: e.target.value })}
                                                placeholder={t('sadasya.area_name_placeholder')}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">{t('sadasya.address')}</label>
                                            <textarea
                                                rows={2} required
                                                className="ns-input mt-1"
                                                value={manualForm.address}
                                                onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="ns-btn-primary w-full justify-center"
                                        >
                                            {editingSadasyaId ? t('sadasya.update_member') : t('sadasya.add_member')}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                deleteTarget && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="ns-card w-full max-w-sm overflow-hidden p-6 space-y-4">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Delete Member?</h3>
                                <p className="text-slate-500 mt-2 text-sm">
                                    Are you sure you want to delete <span className="font-semibold text-slate-900">{deleteTarget.name}</span>? This action cannot be undone.
                                </p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default SadasyaList;
