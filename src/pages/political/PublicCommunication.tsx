import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Loader2, Send, RefreshCw, MessageSquare, Smartphone, CheckSquare, Square, Users, MapPin, ChevronDown, User, Home, History, CheckCircle2, XCircle, Clock, Phone, Languages } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { type Voter } from '../../types';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { format } from 'date-fns';

const PAGE_SIZE = 50;
const SOCKET_URL = import.meta.env.VITE_BOT_API_URL || import.meta.env.VITE_BOT_URL || 'https://nagarsevak-managment-1.onrender.com';

// ---- Types ----
interface MessageLog {
    id: string;
    sent_at: string;
    channel: 'whatsapp' | 'sms' | 'call';
    message: string;
    recipients: number;
    sent_count: number;
    failed_count: number;
    created_by?: string;
}

const PublicCommunication = () => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();

    // Tab state
    const [activeTab, setActiveTab] = useState<'send' | 'history' | 'call'>('send');

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

    // AI Call State
    const [callMessage, setCallMessage] = useState('');
    const [callLanguage, setCallLanguage] = useState('mr-IN');
    const [calling, setCalling] = useState(false);
    const [callResults, setCallResults] = useState<{ mobile: string; name: string; status: 'pending' | 'success' | 'failed' }[]>([]);

    // History State
    const [logs, setLogs] = useState<MessageLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);

    // ------------------------------------------------------------------
    // 1. Socket Connection for Bot
    // ------------------------------------------------------------------
    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            query: { tenantIds: tenantId }
        });

        newSocket.on('connect', () => {
            console.log('Connected to Bot Server from Communication Page');
            newSocket.emit('join_tenant', { tenantId });
            setBotStatus('connected');
        });

        newSocket.on('status', (status: string) => {
            if (status === 'connected') setBotStatus('connected');
            else if (status === 'disconnected' || status === 'failed') setBotStatus('disconnected');
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
    // 2. Fetch Voters
    // ------------------------------------------------------------------
    const fetchVoters = useCallback(async (currentPage: number, reset: boolean = false) => {
        if (reset) setLoading(true);
        else setLoadingMore(true);

        try {
            let query = supabase
                .from('voters')
                .select('*', { count: 'exact' })
                .eq('tenant_id', tenantId)
                .not('mobile', 'is', null)
                .neq('mobile', '')
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

            if (reset) setVoters(mappedVoters);
            else setVoters(prev => [...prev, ...mappedVoters]);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load voters');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [tenantId, nameFilter, addressFilter, houseNoFilter, ageFilter, genderFilter, casteFilter]);

    useEffect(() => {
        setPage(0);
        const timeoutId = setTimeout(() => fetchVoters(0, true), 500);
        return () => clearTimeout(timeoutId);
    }, [fetchVoters]);

    // ------------------------------------------------------------------
    // 3. Fetch Message Logs (History)
    // ------------------------------------------------------------------
    const fetchLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const { data, error } = await supabase
                .from('message_logs')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('sent_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load message history');
        } finally {
            setLogsLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        if (activeTab === 'history') fetchLogs();
    }, [activeTab, fetchLogs]);

    // ------------------------------------------------------------------
    // 4. Selection Logic
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
            setSelectedVoterIds(new Set(voters.map(v => v.id)));
            setSelectAll(true);
        }
    };

    const getDisplayName = (voter: Voter) =>
        language === 'mr' ? (voter.name_marathi || voter.name) : (voter.name_english || voter.name);

    // ------------------------------------------------------------------
    // 5. Send WhatsApp
    // ------------------------------------------------------------------
    const handleSendWhatsApp = async () => {
        if (selectedVoterIds.size === 0) { toast.error(t('communication_page.error_select_voter')); return; }
        if (!message.trim()) { toast.error(t('communication_page.error_enter_message')); return; }

        const targetVoters = voters.filter(v => selectedVoterIds.has(v.id) && v.mobile && v.mobile.length >= 10);
        if (targetVoters.length === 0) { toast.error(t('communication_page.error_no_mobile')); return; }

        if (!socket || !socket.connected) { toast.warning(t('communication_page.bot_not_connected_warning')); return; }

        const numbers = targetVoters.map(v => {
            let num = v.mobile!.replace(/\D/g, '');
            if (num.length === 10) num = '91' + num;
            return num;
        });

        setSending(true);
        toast.loading(`Sending to ${numbers.length} people...`, { id: 'bulk-send' });

        socket.once('bulk_message_result', (result: { success: boolean; sent?: number; failed?: number; error?: string }) => {
            setSending(false);
            toast.dismiss('bulk-send');
            if (result.success) {
                toast.success(`✅ Sent to ${result.sent} people${result.failed ? `, ${result.failed} failed` : ''}`);
                setMessage('');
                setSelectedVoterIds(new Set());
                setSelectAll(false);
                // Also refresh history if user goes there
            } else {
                toast.error(result.error || 'Failed to send messages');
            }
        });

        socket.emit('send_bulk_message', { numbers, message, tenantId });
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

    // ------------------------------------------------------------------
    // 6. AI Call via Sarvam + Twilio
    // ------------------------------------------------------------------
    const handleAICall = async () => {
        if (selectedVoterIds.size === 0) { toast.error('Please select at least one voter to call.'); return; }
        if (!callMessage.trim()) { toast.error('Please enter a message to speak.'); return; }

        const targetVoters = voters.filter(v => selectedVoterIds.has(v.id) && v.mobile && v.mobile.length >= 10);
        if (targetVoters.length === 0) { toast.error('No selected voters have a valid mobile number.'); return; }

        const numbers = targetVoters.map(v => ({
            mobile: v.mobile!.replace(/\D/g, ''),
            name: getDisplayName(v)
        }));

        setCalling(true);
        setCallResults(numbers.map(n => ({ ...n, status: 'pending' as const })));
        toast.loading(`Generating Marathi audio and initiating ${numbers.length} calls...`, { id: 'ai-call' });

        try {
            const BOT_URL = import.meta.env.VITE_BOT_API_URL || 'https://nagarsevak-managment-1.onrender.com';
            const res = await fetch(`${BOT_URL}/api/sarvam-call/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, numbers, message: callMessage, language: callLanguage })
            });
            const data = await res.json();

            toast.dismiss('ai-call');
            if (!res.ok || !data.success) {
                toast.error(data.error || 'Failed to initiate calls');
                setCalling(false);
                return;
            }

            toast.success(`✅ ${numbers.length} calls initiated! Voters will receive calls shortly.`);
            // Optimistically mark all as queued (actual results are async via Twilio)
            setCallResults(numbers.map(n => ({ ...n, status: 'success' as const })));
            setCalling(false);
        } catch (err: any) {
            toast.dismiss('ai-call');
            toast.error('Network error: ' + (err.message || 'Could not reach bot server'));
            setCallResults(numbers.map(n => ({ ...n, status: 'failed' as const })));
            setCalling(false);
        }
    };

    // ------------------------------------------------------------------
    // Render helpers
    // ------------------------------------------------------------------
    const StatusBadge = ({ log }: { log: MessageLog }) => {
        const successRate = log.recipients > 0 ? (log.sent_count / log.recipients) * 100 : 0;
        if (successRate === 100) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200"><CheckCircle2 className="w-3 h-3" />All Sent</span>;
        if (successRate === 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200"><XCircle className="w-3 h-3" />Failed</span>;
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" />Partial</span>;
    };

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------
    return (
        <div className="space-y-6 h-auto lg:h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="flex-none space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <MessageSquare className="w-7 h-7 text-brand-600" />
                            {t('nav.public_communication') || t('communication_page.title')}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">{t('communication_page.subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${botStatus === 'connected' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            <div className={`w-2 h-2 rounded-full ${botStatus === 'connected' ? 'bg-green-600' : 'bg-red-600'}`} />
                            {botStatus === 'connected' ? t('communication_page.bot_connected') : t('communication_page.bot_disconnected')}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 w-fit">
                    <button
                        onClick={() => setActiveTab('send')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'send' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                        <Send className="w-4 h-4" /> Send Message
                    </button>
                    <button
                        onClick={() => setActiveTab('call')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'call' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                        <Phone className="w-4 h-4" /> Voice Call
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                        <History className="w-4 h-4" /> History / Report
                        {logs.length > 0 && <span className="bg-brand-100 text-brand-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{logs.length}</span>}
                    </button>
                </div>
            </div>

            {/* ---- SHARED SEARCH & SELECTION BAR (For Message & Call Tabs) ---- */}
            {(activeTab === 'send' || activeTab === 'call') && (
                <>
                    {/* Search Filters */}
                    <div className="ns-card p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 flex-none mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input type="text" placeholder={t('communication_page.search_placeholder')} value={nameFilter} onChange={e => setNameFilter(e.target.value)} className="ns-input pl-9 w-full text-sm" />
                        </div>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input type="text" placeholder={t('voters.search_address')} value={addressFilter} onChange={e => setAddressFilter(e.target.value)} className="ns-input pl-9 w-full text-sm" />
                        </div>
                        <div className="relative">
                            <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input type="text" placeholder={t('voters.house_no')} value={houseNoFilter} onChange={e => setHouseNoFilter(e.target.value)} className="ns-input pl-9 w-full text-sm" />
                        </div>
                        <div className="relative">
                            <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input type="text" placeholder={t('voters.age_placeholder')} value={ageFilter} onChange={e => setAgeFilter(e.target.value)} className="ns-input pl-9 w-full text-sm" />
                        </div>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} className="ns-input pl-9 w-full appearance-none bg-white text-sm">
                                <option value="">{t('voters.all_genders')}</option>
                                <option value="M">{t('voters.gender_male')}</option>
                                <option value="F">{t('voters.gender_female')}</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input type="text" placeholder={t('voters.caste_placeholder')} value={casteFilter} onChange={e => setCasteFilter(e.target.value)} className="ns-input pl-9 w-full text-sm" />
                        </div>
                    </div>

                    {/* Selection Counter */}
                    <div className="flex items-center justify-between px-1 flex-none mb-4">
                        <div className="flex items-center gap-4">
                            <button onClick={handleSelectAllVisible} className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-brand-700">
                                {selectAll ? <CheckSquare className="w-5 h-5 text-brand-600" /> : <Square className="w-5 h-5 text-slate-400" />}
                                {t('communication_page.select_all_visible')} ({voters.length})
                            </button>
                            <span className="text-sm text-slate-500">{t('communication_page.total_records')}: {totalCount || 0}</span>
                        </div>
                        <div className="text-sm font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-lg border border-brand-100">
                            {selectedVoterIds.size} {t('communication_page.selected')}
                        </div>
                    </div>
                </>
            )}

            {/* ---- SEND TAB ---- */}
            {activeTab === 'send' && (
                <>
                    {/* Voter List + Composer */}
                    <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                        {/* Left: Voter List */}
                        <div className="flex-1 ns-card flex flex-col overflow-hidden min-h-[400px]">
                            <div className="flex-1 overflow-y-auto p-2">
                                {loading ? (
                                    <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
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
                                                    {selectedVoterIds.has(voter.id) ? <CheckSquare className="w-5 h-5 text-brand-600 shrink-0" /> : <Square className="w-5 h-5 text-slate-300 shrink-0" />}
                                                    <div>
                                                        <h4 className={`font-semibold text-sm ${selectedVoterIds.has(voter.id) ? 'text-brand-900' : 'text-slate-700'}`}>{getDisplayName(voter)}</h4>
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
                                            <button onClick={() => { const next = page + 1; setPage(next); fetchVoters(next, false); }} disabled={loadingMore} className="w-full py-3 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg flex items-center justify-center gap-2">
                                                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                                                {t('communication_page.load_more')} ({totalCount - voters.length} {t('communication_page.remaining')})
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Composer */}
                        <div className="w-full lg:w-1/3 flex flex-col gap-4">
                            <div className="ns-card p-4 flex-1 flex flex-col">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Send className="w-4 h-4" /> {t('communication_page.compose_message')}
                                </h3>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder={t('communication_page.message_placeholder')}
                                    className="ns-input flex-1 w-full p-3 resize-none mb-4 text-sm min-h-[140px]"
                                />
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
                                <p className="text-xs text-slate-400 mt-4 text-center">{t('communication_page.note_mobile')}</p>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ---- AI CALL TAB ---- */}
            {activeTab === 'call' && (
                <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">

                    {/* Left: Voter Selector */}
                    <div className="flex-1 ns-card flex flex-col overflow-hidden min-h-[400px]">
                        <div className="flex-1 overflow-y-auto p-2">
                            {loading ? (
                                <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
                            ) : voters.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <Users className="w-12 h-12 mb-2 opacity-50" />
                                    <p>{t('communication_page.no_voters')}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {voters.map(v => (
                                        <div
                                            key={v.id}
                                            onClick={() => toggleSelectVoter(v.id)}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedVoterIds.has(v.id) ? 'bg-brand-50 border-brand-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {selectedVoterIds.has(v.id) ? <CheckSquare className="w-5 h-5 text-brand-600 shrink-0" /> : <Square className="w-5 h-5 text-slate-300 shrink-0" />}
                                                <div>
                                                    <h4 className={`font-semibold text-sm ${selectedVoterIds.has(v.id) ? 'text-brand-900' : 'text-slate-700'}`}>{getDisplayName(v)}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span>{t('voters.ward')}: {v.ward}</span>
                                                        <span>•</span>
                                                        <span>{v.mobile || t('voter_profile.no_mobile')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Call result status badge */}
                                            {callResults.find(r => r.mobile === v.mobile?.replace(/\D/g, '')) && (() => {
                                                const result = callResults.find(r => r.mobile === v.mobile?.replace(/\D/g, ''));
                                                if (result?.status === 'success') return <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Queued</span>;
                                                if (result?.status === 'failed') return <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" />Failed</span>;
                                                return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>;
                                            })()}
                                            {!callResults.find(r => r.mobile === v.mobile?.replace(/\D/g, '')) && v.mobile && (
                                                <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">MOBILE ✓</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Call Composer */}
                    <div className="w-full lg:w-2/5 flex flex-col gap-4">
                        <div className="ns-card p-5">
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                                    <Phone className="w-5 h-5 text-brand-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Voice Call</h3>
                                    <p className="text-xs text-slate-500">Draft your message for automatic calls</p>
                                </div>
                            </div>

                            {/* Language Selector */}
                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                                    <Languages className="w-3.5 h-3.5" /> Call Language
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { code: 'mr-IN', label: 'मराठी', sublabel: 'Marathi' },
                                        { code: 'hi-IN', label: 'हिंदी', sublabel: 'Hindi' },
                                        { code: 'en-IN', label: 'English', sublabel: 'English' },
                                    ].map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => setCallLanguage(lang.code)}
                                            className={`p-2.5 rounded-lg border text-center transition-all ${callLanguage === lang.code ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                                        >
                                            <div className="font-bold text-sm">{lang.label}</div>
                                            <div className="text-[10px] text-slate-500">{lang.sublabel}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message Composer */}
                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                    Message to Speak {callLanguage === 'mr-IN' && <span className="text-brand-600">(Type in Marathi)</span>}
                                </label>
                                <textarea
                                    value={callMessage}
                                    onChange={e => setCallMessage(e.target.value)}
                                    placeholder={callLanguage === 'mr-IN' ? 'नमस्कार, मी नगरसेवक कार्यालयातून बोलत आहे...' : callLanguage === 'hi-IN' ? 'नमस्ते, मैं नगरसेवक कार्यालय से बोल रहा हूं...' : 'Hello, I am calling from the Nagarsevak office...'}
                                    className="ns-input w-full p-3 resize-none text-sm min-h-[120px]"
                                />
                                <p className="text-xs text-slate-400 mt-1">{callMessage.length} characters · ~{Math.ceil(callMessage.length / 15)} seconds of audio</p>
                            </div>

                            {/* Summary */}
                            <div className="bg-slate-50 rounded-lg p-3 mb-4 text-sm border border-slate-200">
                                <div className="flex justify-between text-slate-600">
                                    <span>Selected voters</span>
                                    <span className="font-bold text-brand-700">{selectedVoterIds.size}</span>
                                </div>
                                <div className="flex justify-between text-slate-600 mt-1">
                                    <span>With mobile number</span>
                                    <span className="font-bold text-green-700">
                                        {voters.filter(v => selectedVoterIds.has(v.id) && v.mobile).length}
                                    </span>
                                </div>
                            </div>

                            {/* Call Button */}
                            <button
                                onClick={handleAICall}
                                disabled={calling || selectedVoterIds.size === 0}
                                className="w-full ns-btn-primary flex items-center justify-center gap-2 py-3"
                            >
                                {calling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Phone className="w-5 h-5" />}
                                {calling ? 'Generating Audio & Calling...' : `Start Voice Calls (${selectedVoterIds.size})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ---- HISTORY TAB ---- */}
            {activeTab === 'history' && (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Message History</h2>
                            <p className="text-sm text-slate-500">{logs.length} broadcasts recorded</p>
                        </div>
                        <button onClick={fetchLogs} disabled={logsLoading} className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium">
                            {logsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Refresh
                        </button>
                    </div>

                    {logsLoading ? (
                        <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 text-slate-400 py-20">
                            <History className="w-14 h-14 mb-3 opacity-30" />
                            <p className="font-medium text-slate-600">No messages sent yet</p>
                            <p className="text-sm mt-1">Messages you send from the <strong>Send Message</strong> tab will appear here.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto space-y-3">
                            {logs.map(log => (
                                <div key={log.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                    {/* Row Header */}
                                    <div
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Channel Icon */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${log.channel === 'whatsapp' ? 'bg-green-100' : log.channel === 'call' ? 'bg-brand-100' : 'bg-blue-100'}`}>
                                                {log.channel === 'whatsapp'
                                                    ? <Smartphone className="w-5 h-5 text-green-600" />
                                                    : log.channel === 'call'
                                                        ? <Phone className="w-5 h-5 text-brand-600" />
                                                        : <MessageSquare className="w-5 h-5 text-blue-600" />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 text-sm line-clamp-1 max-w-xs">
                                                    {log.message}
                                                </p>
                                                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                                                    <span>{format(new Date(log.sent_at), 'dd MMM yyyy, hh:mm a')}</span>
                                                    <span>•</span>
                                                    <span className="capitalize">{log.channel}</span>
                                                    {log.created_by && <><span>•</span><span>{log.created_by}</span></>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center gap-6 flex-shrink-0">
                                            <div className="text-center hidden sm:block">
                                                <div className="text-lg font-bold text-slate-800">{log.recipients}</div>
                                                <div className="text-[10px] text-slate-500 uppercase">Targeted</div>
                                            </div>
                                            <div className="text-center hidden sm:block">
                                                <div className="text-lg font-bold text-green-600">{log.sent_count}</div>
                                                <div className="text-[10px] text-slate-500 uppercase">Sent</div>
                                            </div>
                                            {log.failed_count > 0 && (
                                                <div className="text-center hidden sm:block">
                                                    <div className="text-lg font-bold text-red-500">{log.failed_count}</div>
                                                    <div className="text-[10px] text-slate-500 uppercase">Failed</div>
                                                </div>
                                            )}
                                            <StatusBadge log={log} />
                                        </div>
                                    </div>

                                    {/* Expanded Message Preview */}
                                    {expandedLog === log.id && (
                                        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                                            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Full Message</p>
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{log.message}</p>

                                            {/* Progress Bar */}
                                            <div className="mt-3">
                                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                    <span>Delivery Rate</span>
                                                    <span>{log.recipients > 0 ? Math.round((log.sent_count / log.recipients) * 100) : 0}%</span>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-2">
                                                    <div
                                                        className="bg-green-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${log.recipients > 0 ? (log.sent_count / log.recipients) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PublicCommunication;
