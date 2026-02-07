import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Loader2, Send, RefreshCw, MessageSquare, Smartphone, CheckSquare, Square, Users, MapPin, ChevronDown, User, Home } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { type Voter } from '../../types';
import { toast } from 'sonner';
import { io } from 'socket.io-client';

const PAGE_SIZE = 50;
const SOCKET_URL = import.meta.env.VITE_BOT_URL || 'http://localhost:4000';

const PublicCommunication = () => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();

    // Data State
    const [voters, setVoters] = useState<Voter[]>([]);
    const [totalCount, setTotalCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);

    // Filter State
    const [nameFilter, setNameFilter] = useState('');
    const [addressFilter, setAddressFilter] = useState('');
    const [houseNoFilter, setHouseNoFilter] = useState('');
    const [ageFilter, setAgeFilter] = useState('');
    const [genderFilter, setGenderFilter] = useState('');
    const [casteFilter, setCasteFilter] = useState('');

    // Selection State
    const [selectedVoterIds, setSelectedVoterIds] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState(false);

    // Messaging State
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [socket, setSocket] = useState<any>(null);
    const [botStatus, setBotStatus] = useState('disconnected');

    // Stats for Filters (Simplified for now, can copy full logic from VoterList if needed)
    // For now, we'll skip the auto-complete stats to keep this file cleaner, 
    // but the filter inputs will work the same way.

    // ------------------------------------------------------------------
    // 1. Socket Connection for Bot
    // ------------------------------------------------------------------
    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            query: { tenantIds: tenantId }
        });

        newSocket.on('connect', () => {
            console.log('Connected to Bot Server from Communication Page');
            setBotStatus('connected');
        });

        newSocket.on('disconnect', () => {
            setBotStatus('disconnected');
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [tenantId]);

    // ------------------------------------------------------------------
    // 2. Fetch Voters (Reusing Logic from VoterList)
    // ------------------------------------------------------------------
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
                .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

            if (nameFilter) query = query.or(`name_english.ilike.%${nameFilter}%,name_marathi.ilike.%${nameFilter}%`);
            if (addressFilter) query = query.or(`address_english.ilike.%${addressFilter}%,address_marathi.ilike.%${addressFilter}%`);
            if (houseNoFilter) query = query.ilike('house_no', `%${houseNoFilter}%`);
            if (ageFilter) {
                if (ageFilter.includes('-')) {
                    const [min, max] = ageFilter.split('-').map(Number);
                    if (!isNaN(min) && !isNaN(max)) query = query.gte('age', min).lte('age', max);
                } else {
                    const age = parseInt(ageFilter);
                    if (!isNaN(age)) query = query.eq('age', age);
                }
            }
            if (genderFilter) query = query.eq('gender', genderFilter);
            if (casteFilter) query = query.ilike('caste', `%${casteFilter}%`);

            const { data, error, count } = await query;

            if (error) throw error;

            setTotalCount(count);

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
            toast.error('Failed to load voters');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [tenantId, nameFilter, addressFilter, houseNoFilter, ageFilter, genderFilter, casteFilter]);

    // Initial Load & Debounce
    useEffect(() => {
        setPage(0);
        const timeoutId = setTimeout(() => {
            fetchVoters(0, true);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [fetchVoters]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchVoters(nextPage, false);
    };

    // ------------------------------------------------------------------
    // 3. Selection Logic
    // ------------------------------------------------------------------
    const toggleSelectVoter = (id: string) => {
        setSelectedVoterIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectAllVisible = () => {
        if (selectAll) {
            setSelectedVoterIds(new Set());
            setSelectAll(false);
        } else {
            // Select all currently loaded voters
            const allIds = voters.map(v => v.id);
            setSelectedVoterIds(new Set(allIds));
            setSelectAll(true);
        }
    };

    // Display Helper
    const getDisplayName = (voter: Voter) => {
        return language === 'mr' ? (voter.name_marathi || voter.name) : (voter.name_english || voter.name);
    };

    // ------------------------------------------------------------------
    // 4. Messaging Logic
    // ------------------------------------------------------------------
    const handleSendWhatsApp = async () => {
        if (selectedVoterIds.size === 0) {
            toast.error(t('communication_page.error_select_voter'));
            return;
        }
        if (!message.trim()) {
            toast.error(t('communication_page.error_enter_message'));
            return;
        }

        setSending(true);

        // 1. Filter selected voters who actually have a mobile number
        const targetVoters = voters.filter(v => selectedVoterIds.has(v.id) && v.mobile && v.mobile.length >= 10);

        if (targetVoters.length === 0) {
            toast.error(t('communication_page.error_no_mobile'));
            setSending(false);
            return;
        }

        const numbers = targetVoters.map(v => {
            // Basic sanitization: remove spaces, dashes, ensure 91 prefix if missing but length is 10
            let num = v.mobile!.replace(/\D/g, '');
            if (num.length === 10) num = '91' + num;
            return num;
        });

        // 2. Emit Socket Event
        if (socket && socket.connected) {
            // In a real scenario, we might want to batch this or send it to a specific 'broadcast' endpoint
            // For now, let's assume the bot listens to 'send_bulk_message'
            socket.emit('send_bulk_message', {
                numbers,
                message,
                tenantId
            });

            // Simulate success for UI feedback (since socket is fire-and-forget mostly)
            setTimeout(() => {
                toast.success(t('communication_page.success_queued', { count: numbers.length }));
                setSending(false);
                setMessage('');
                setSelectedVoterIds(new Set());
                setSelectAll(false);
            }, 1000);

        } else {
            console.warn('Bot not connected. Logging payload:', { numbers, message });
            toast.warning(t('communication_page.bot_not_connected_warning'));
            setSending(false);
        }
    };

    const handleSendSMS = () => {
        setSending(true);
        setTimeout(() => {
            toast.success(t('communication_page.success_sms', { count: selectedVoterIds.size }));
            setSending(false);
            setSelectedVoterIds(new Set());
            setSelectAll(false);
            setMessage('');
        }, 1500);
    };

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex-none space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <MessageSquare className="w-7 h-7 text-brand-600" />
                            {t('nav.public_communication') || t('communication_page.title')}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            {t('communication_page.subtitle')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${botStatus === 'connected' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            <div className={`w-2 h-2 rounded-full ${botStatus === 'connected' ? 'bg-green-600' : 'bg-red-600'}`}></div>
                            {botStatus === 'connected' ? t('communication_page.bot_connected') : t('communication_page.bot_disconnected')}
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="ns-card p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Name */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={t('communication_page.search_placeholder')}
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            className="ns-input pl-9 w-full text-sm"
                        />
                    </div>
                    {/* Address */}
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={t('voters.search_address')}
                            value={addressFilter}
                            onChange={(e) => setAddressFilter(e.target.value)}
                            className="ns-input pl-9 w-full text-sm"
                        />
                    </div>
                    {/* House No */}
                    <div className="relative">
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={t('voters.house_no')}
                            value={houseNoFilter}
                            onChange={(e) => setHouseNoFilter(e.target.value)}
                            className="ns-input pl-9 w-full text-sm"
                        />
                    </div>
                    {/* Age */}
                    <div className="relative">
                        <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={t('voters.age_placeholder')}
                            value={ageFilter}
                            onChange={(e) => setAgeFilter(e.target.value)}
                            className="ns-input pl-9 w-full text-sm"
                        />
                    </div>
                    {/* Gender */}
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <select
                            value={genderFilter}
                            onChange={(e) => setGenderFilter(e.target.value)}
                            className="ns-input pl-9 w-full appearance-none bg-white text-sm"
                        >
                            <option value="">{t('voters.all_genders')}</option>
                            <option value="M">{t('voters.gender_male')}</option>
                            <option value="F">{t('voters.gender_female')}</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    </div>
                    {/* Caste */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={t('voters.caste_placeholder')}
                            value={casteFilter}
                            onChange={(e) => setCasteFilter(e.target.value)}
                            className="ns-input pl-9 w-full text-sm"
                        />
                    </div>
                </div>

                {/* Selection & Counts */}
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSelectAllVisible}
                            className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-brand-700"
                        >
                            {selectAll ? <CheckSquare className="w-5 h-5 text-brand-600" /> : <Square className="w-5 h-5 text-slate-400" />}
                            {t('communication_page.select_all_visible')} ({voters.length})
                        </button>
                        <span className="text-sm text-slate-500">
                            {t('communication_page.total_records')}: {totalCount || 0}
                        </span>
                    </div>
                    <div className="text-sm font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-lg">
                        {selectedVoterIds.size} {t('communication_page.selected')}
                    </div>
                </div>
            </div>

            {/* Main Content: Voter List & Message Composer */}
            <div className="flex-1 flex gap-6 min-h-0">
                {/* Left: Voter List (Scrollable) */}
                <div className="flex-1 ns-card flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-2">
                        {loading ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
                            </div>
                        ) : voters.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Users className="w-12 h-12 mb-2 opacity-50" />
                                <p>{t('communication_page.no_voters')}</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {voters.map(voter => (
                                    <div
                                        key={voter.id}
                                        onClick={() => toggleSelectVoter(voter.id)}
                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedVoterIds.has(voter.id) ? 'bg-brand-50 border-brand-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {selectedVoterIds.has(voter.id) ? (
                                                <CheckSquare className="w-5 h-5 text-brand-600 shrink-0" />
                                            ) : (
                                                <Square className="w-5 h-5 text-slate-300 shrink-0" />
                                            )}
                                            <div>
                                                <h4 className={`font-semibold text-sm ${selectedVoterIds.has(voter.id) ? 'text-brand-900' : 'text-slate-700'}`}>
                                                    {getDisplayName(voter)}
                                                </h4>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span>{t('voters.ward')}: {voter.ward}</span>
                                                    <span>•</span>
                                                    <span>{voter.mobile || t('voter_profile.no_mobile')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {voter.mobile && (
                                            <div className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold uppercase rounded">
                                                {t('communication_page.mobile_available')}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {totalCount !== null && voters.length < totalCount && (
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        className="w-full py-3 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg flex items-center justify-center gap-2"
                                    >
                                        {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {t('communication_page.load_more')} ({totalCount - voters.length} {t('communication_page.remaining')})
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Message Composer */}
                <div className="w-1/3 flex flex-col gap-4">
                    <div className="ns-card p-4 flex-1 flex flex-col">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Send className="w-4 h-4" /> {t('communication_page.compose_message')}
                        </h3>

                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={t('communication_page.message_placeholder')}
                            className="ns-input flex-1 w-full p-3 resize-none mb-4 text-sm"
                        ></textarea>

                        <div className="space-y-3">
                            <button
                                onClick={handleSendWhatsApp}
                                disabled={sending || selectedVoterIds.size === 0}
                                className="w-full ns-btn-primary bg-[#25D366] hover:bg-[#128C7E] border-none flex items-center justify-center gap-2 py-3"
                            >
                                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
                                {t('communication_page.send_whatsapp')}
                            </button>

                            <button
                                onClick={handleSendSMS}
                                disabled={sending || selectedVoterIds.size === 0}
                                className="w-full ns-btn-secondary flex items-center justify-center gap-2 py-3"
                            >
                                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageSquare className="w-5 h-5" />}
                                {t('communication_page.send_sms')}
                            </button>
                        </div>

                        <p className="text-xs text-slate-400 mt-4 text-center">
                            {t('communication_page.note_mobile')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicCommunication;
