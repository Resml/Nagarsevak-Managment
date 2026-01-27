import React, { useState } from 'react';
import { Search, Filter, Phone, MapPin, UserCheck, User, Plus, X, Trash2 } from 'lucide-react';
import { MockService } from '../../services/mockData';
import { VoterService } from '../../services/voterService';
import { type Voter } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

const SadasyaList = () => {
    const { t, language } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVoter, setFilterVoter] = useState<'all' | 'voter' | 'non-voter'>('all');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'search' | 'manual'>('search');

    // Search Voter State
    const [voterSearchTerm, setVoterSearchTerm] = useState('');
    const [voterResults, setVoterResults] = useState<Voter[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Initialize with default 5 voters when modal opens
    const initVoterList = async () => {
        setVoterSearchTerm('');
        setIsSearching(true);
        const results = await VoterService.getRecentVoters();
        setVoterResults(results);
        setIsSearching(false);
    };

    // Manual Entry State
    const [manualForm, setManualForm] = useState({
        name: '',
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

    const filteredSadasyas = sadasyas.filter((sadasya) => {
        const matchesSearch = sadasya.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sadasya.mobile.includes(searchTerm);

        if (filterVoter === 'voter') return matchesSearch && sadasya.isVoter;
        if (filterVoter === 'non-voter') return matchesSearch && !sadasya.isVoter;
        return matchesSearch;
    });

    const getDisplayName = (member: any) => {
        if (language === 'mr' || language === 'hi') {
            return member.name_marathi || member.name || member.name_english;
        }
        return member.name_english || member.name;
    };

    const getDisplayAddress = (member: any) => {
        if (language === 'mr' || language === 'hi') {
            return member.address_marathi || member.address || member.address_english;
        }
        return member.address_english || member.address;
    };

    // Confirm Add Voter State
    const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
    const [confirmMobile, setConfirmMobile] = useState('');
    const [confirmArea, setConfirmArea] = useState('');

    const handleSearchVoter = async (term: string) => {
        setVoterSearchTerm(term);

        if (term.trim() === '') {
            const results = await VoterService.getRecentVoters();
            setVoterResults(results);
            return;
        }

        if (term.length > 2) {
            setIsSearching(true);
            const results = await VoterService.searchVoters(term);
            setVoterResults(results);
            setIsSearching(false);
        } else {
            setVoterResults([]);
        }
    };

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
        setVoterSearchTerm('');
        setVoterResults([]);

        alert(`${selectedVoter.name} added as Sadasya!`);
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        MockService.addSadasya({
            name: manualForm.name,
            mobile: manualForm.mobile,
            age: parseInt(manualForm.age) || 0,
            gender: manualForm.gender || undefined,
            ward: manualForm.ward,
            address: manualForm.address,
            area: manualForm.area,
            isVoter: false
        });
        setIsModalOpen(false);
        setRefreshTrigger(prev => prev + 1);
        setManualForm({ name: '', mobile: '+91 ', age: '', gender: '', ward: '', address: '', area: '' });
        alert('Member added successfully!');
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete ${name}?`)) {
            MockService.deleteSadasya(id);
            setRefreshTrigger(prev => prev + 1);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('sadasya.title')}</h1>
                    <p className="text-gray-600">{t('sadasya.subtitle')}</p>
                </div>
                <button
                    onClick={() => {
                        setIsModalOpen(true);
                        initVoterList();
                    }}
                    className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span>{t('sadasya.add_member')}</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={t('sadasya.search_placeholder')}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="text-gray-400 w-5 h-5" />
                    <select
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        value={filterVoter}
                        onChange={(e) => setFilterVoter(e.target.value as any)}
                    >
                        <option value="all">{t('sadasya.filter_all')}</option>
                        <option value="voter">{t('sadasya.filter_voters')}</option>
                        <option value="non-voter">{t('sadasya.filter_non_voters')}</option>
                    </select>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('sadasya.member')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('sadasya.contact')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('sadasya.area_address')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('sadasya.status')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('sadasya.joined_date')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredSadasyas.length > 0 ? (
                                filteredSadasyas.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 text-brand-600 bg-brand-100 rounded-full flex items-center justify-center">
                                                    <span className="font-medium text-lg">{member.name.charAt(0)}</span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{getDisplayName(member)}</div>
                                                    <div className="text-sm text-gray-500">{t('sadasya.age')}: {member.age}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Phone className="w-4 h-4 mr-2" />
                                                {member.mobile}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start text-sm text-gray-500">
                                                <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                                <span className="truncate max-w-xs" title={getDisplayAddress(member)}>
                                                    {member.area ? <span className="font-medium text-gray-900 block">{member.area}</span> : null}
                                                    {getDisplayAddress(member)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {member.isVoter ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    <UserCheck className="w-3 h-3 mr-1" /> {t('sadasya.is_voter')}
                                                    {member.voterId && ` (${member.voterId})`}
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                    <User className="w-3 h-3 mr-1" /> {t('sadasya.is_member')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(member.registeredAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDelete(member.id, member.name)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No members found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {filteredSadasyas.map((member) => (
                    <div key={member.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-brand-50 text-brand-700 rounded-full flex items-center justify-center font-bold">
                                    {member.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{getDisplayName(member)}</h3>
                                    <p className="text-xs text-gray-500">Age: {member.age}</p>
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

                        <div className="space-y-2 text-sm text-gray-600 pt-2 border-t border-gray-50">
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{member.mobile}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div className="flex flex-col">
                                    {member.area && <span className="font-medium text-gray-900">{member.area}</span>}
                                    <span className="line-clamp-2">{getDisplayAddress(member)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                <span>Joined: {new Date(member.registeredAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredSadasyas.length === 0 && (
                    <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        No members found.
                    </div>
                )}
            </div>

            {/* Add Member Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">{t('sadasya.add_modal_title')}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex border-b border-gray-100">
                            <button
                                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'search' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('search')}
                            >
                                {t('sadasya.search_tab')}
                            </button>
                            <button
                                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'manual' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('manual')}
                            >
                                {t('sadasya.manual_tab')}
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Voter Search Tab Content */}
                            {activeTab === 'search' ? (
                                selectedVoter ? (
                                    <div className="space-y-4">
                                        <div className="bg-brand-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-gray-900">Confirm Member Details</h3>
                                            <p className="text-sm text-gray-600 mt-1">Please verify or add missing details.</p>
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
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                                                autoFocus
                                            />
                                            {!selectedVoter.mobile && (
                                                <p className="mt-1 text-xs text-amber-600">Mobile number missing in voter record. Please enter it.</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Area / Colony</label>
                                            <input
                                                type="text"
                                                value={confirmArea}
                                                onChange={(e) => setConfirmArea(e.target.value)}
                                                placeholder="e.g. Ganesh Nagar"
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                            <div>
                                                <span className="font-medium">EPIC No:</span> {selectedVoter.epicNo}
                                            </div>
                                            <div>
                                                <span className="font-medium">Age:</span> {selectedVoter.age || 'N/A'}
                                            </div>
                                            <div className="col-span-2">
                                                <span className="font-medium">{t('sadasya.address')}:</span> {getDisplayAddress(selectedVoter)}
                                            </div>
                                        </div>

                                        <div className="flex space-x-3 pt-4">
                                            <button
                                                onClick={() => setSelectedVoter(null)}
                                                className="flex-1 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                            >
                                                Back
                                            </button>
                                            <button
                                                onClick={confirmAddVoter}
                                                disabled={!confirmMobile || confirmMobile.length < 10}
                                                className="flex-1 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Confirm Add
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type="text"
                                                placeholder={t('sadasya.search_voter_label')}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                                value={voterSearchTerm}
                                                onChange={(e) => handleSearchVoter(e.target.value)}
                                                autoFocus
                                            />
                                        </div>

                                        <div className="max-h-60 overflow-y-auto space-y-2">
                                            {isSearching ? (
                                                <p className="text-center text-gray-500 py-4">Searching...</p>
                                            ) : voterResults.length > 0 ? (
                                                voterResults.map(voter => (
                                                    <div key={voter.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{getDisplayName(voter)}</p>
                                                            <p className="text-xs text-brand-600 font-medium mt-0.5">
                                                                {voter.epicNo} • Ward {voter.ward}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {voter.age} Yrs • {voter.gender} • {voter.mobile || 'No Mobile'}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[250px]" title={getDisplayAddress(voter)}>
                                                                {getDisplayAddress(voter)}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => onSelectVoter(voter)}
                                                            className="px-3 py-1 bg-brand-100 text-brand-700 text-sm font-medium rounded-md hover:bg-brand-200"
                                                        >
                                                            {t('sadasya.select')}
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-center text-gray-500 py-4">No voters found.</p>
                                            )}
                                        </div>
                                    </div>
                                )
                            ) : (
                                <form onSubmit={handleManualSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                        <input
                                            type="text" required
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                                            value={manualForm.name}
                                            onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                                        <input
                                            type="tel" required
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                                            value={manualForm.mobile}
                                            onChange={(e) => setManualForm({ ...manualForm, mobile: e.target.value })}
                                            placeholder="+91 "
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Age</label>
                                            <input
                                                type="number" required min="18"
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                                                value={manualForm.age}
                                                onChange={(e) => setManualForm({ ...manualForm, age: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Gender</label>
                                            <select
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm bg-white"
                                                value={manualForm.gender}
                                                onChange={(e) => setManualForm({ ...manualForm, gender: e.target.value as 'M' | 'F' | 'O' })}
                                            >
                                                <option value="">Select</option>
                                                <option value="M">Male</option>
                                                <option value="F">Female</option>
                                                <option value="O">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Ward No</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                                            value={manualForm.ward}
                                            onChange={(e) => setManualForm({ ...manualForm, ward: e.target.value })}
                                            placeholder="Enter Ward No"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Area / Colony</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                                            value={manualForm.area || ''}
                                            onChange={(e) => setManualForm({ ...manualForm, area: e.target.value })}
                                            placeholder="Area Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Address</label>
                                        <textarea
                                            rows={2} required
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                                            value={manualForm.address}
                                            onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                                    >
                                        Add Member
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SadasyaList;
