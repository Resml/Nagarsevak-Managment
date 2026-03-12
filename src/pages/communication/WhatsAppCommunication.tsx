import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Loader2, Send, RefreshCw, Smartphone, CheckSquare, Square, Users, MapPin, ChevronDown, User, Home, History } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { type Voter } from '../../types';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { format } from 'date-fns';

const PAGE_SIZE = 50;
const SOCKET_URL = import.meta.env.VITE_BOT_API_URL || import.meta.env.VITE_BOT_URL || 'https://nagarsevak-managment-1.onrender.com';

interface MessageLog {
    id: string;
    sent_at: string;
    channel: 'whatsapp' | 'sms' | 'call';
    message: string;
    recipients: number;
    sent_count: number;
    failed_count: number;
}

const WhatsAppCommunication = () => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();

    const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
    const [voters, setVoters] = useState<Voter[]>([]);
    const [totalCount, setTotalCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);

    const [nameFilter, setNameFilter] = useState('');
    const [addressFilter, setAddressFilter] = useState('');
    const [houseNoFilter, setHouseNoFilter] = useState('');
    const [ageFilter, setAgeFilter] = useState('');
    const [genderFilter, setGenderFilter] = useState('');
    const [casteFilter, setCasteFilter] = useState('');

    const [selectedVoterIds, setSelectedVoterIds] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState(false);

    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [socket, setSocket] = useState<any>(null);
    const [botStatus, setBotStatus] = useState('disconnected');

    const [logs, setLogs] = useState<MessageLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);

    useEffect(() => {
        const newSocket = io(SOCKET_URL, { query: { tenantIds: tenantId } });
        newSocket.on('connect', () => {
            newSocket.emit('join_tenant', { tenantId });
            setBotStatus('connected');
        });
        newSocket.on('status', status => setBotStatus(status === 'connected' ? 'connected' : 'disconnected'));
        newSocket.on('disconnect', () => setBotStatus('disconnected'));
        setSocket(newSocket);
        return () => { newSocket.disconnect(); };
    }, [tenantId]);

    const fetchVoters = useCallback(async (currentPage: number, reset: boolean = false) => {
        if (reset) setLoading(true);
        else setLoadingMore(true);

        try {
            let query = supabase.from('voters').select('*', { count: 'exact' }).eq('tenant_id', tenantId).not('mobile', 'is', null).neq('mobile', '').range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);
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
                part_no: row.part_no,
                booth: row.part_no || '-',
                epicNo: row.epic_no || '-',
                epic_no: row.epic_no,
                mobile: row.mobile,
                house_no: row.house_no,
                caste: row.caste,
                is_friend_relative: row.is_friend_relative,
                history: []
            }));
            if (reset) setVoters(mappedVoters);
            else setVoters(prev => [...prev, ...mappedVoters]);
        } catch (err) { console.error(err); toast.error(t('communication_page.error_load_voters')); } finally { setLoading(false); setLoadingMore(false); }
    }, [tenantId, nameFilter, addressFilter, houseNoFilter, ageFilter, genderFilter, casteFilter]);

    useEffect(() => {
        setPage(0);
        const timeoutId = setTimeout(() => fetchVoters(0, true), 500);
        return () => clearTimeout(timeoutId);
    }, [fetchVoters]);

    const fetchLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const { data, error } = await supabase.from('message_logs').select('*').eq('tenant_id', tenantId).eq('channel', 'whatsapp').order('sent_at', { ascending: false }).limit(100);
            if (error) throw error;
            setLogs(data || []);
        } catch (err) { console.error(err); toast.error(t('communication_page.error_load_wa_history')); } finally { setLogsLoading(false); }
    }, [tenantId]);

    useEffect(() => { if (activeTab === 'history') fetchLogs(); }, [activeTab, fetchLogs]);

    const toggleSelectVoter = (id: string) => {
        setSelectedVoterIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectAllVisible = () => setSelectAll(prev => {
        if (prev) { setSelectedVoterIds(new Set()); return false; }
        else { setSelectedVoterIds(new Set(voters.map(v => v.id))); return true; }
    });

    const getDisplayName = (voter: Voter) => language === 'mr' ? (voter.name_marathi || voter.name) : (voter.name_english || voter.name);

    const handleSendWhatsApp = async () => {
        if (selectedVoterIds.size === 0) { toast.error(t('communication_page.error_select_voter')); return; }
        if (!message.trim()) { toast.error(t('communication_page.error_enter_message')); return; }
        if (botStatus !== 'connected') { toast.warning(t('communication_page.bot_not_connected_warning')); return; }

        const targetVoters = voters.filter(v => selectedVoterIds.has(v.id) && v.mobile);
        const numbers = targetVoters.map(v => {
            let n = v.mobile!.replace(/\D/g, '');
            return n.length === 10 ? '91' + n : n;
        });

        setSending(true);
        socket.once('bulk_message_result', async (res: any) => {
            setSending(false);
            if (res.success) {
                toast.success(t('communication_page.success_wa_sent', { count: res.sent }));
                setMessage('');
                setSelectedVoterIds(new Set());
                setSelectAll(false);
                if (activeTab === 'history') fetchLogs();
            } else {
                toast.error(res.error || t('communication_page.error_wa_failed'));
            }
        });
        socket.emit('send_bulk_message', { numbers, message, tenantId });
    };

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex justify-between items-start flex-none">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Smartphone className="w-7 h-7 text-brand-600" />
                        {t('nav.whatsapp_msg')}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">{t('communication_page.subtitle')}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${botStatus === 'connected' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    <div className={`w-2 h-2 rounded-full ${botStatus === 'connected' ? 'bg-green-600' : 'bg-red-600'}`} />
                    {botStatus === 'connected' ? t('communication_page.bot_active') : t('communication_page.bot_inactive')}
                </div>
            </div>

            <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 flex-none w-fit">
                <button onClick={() => setActiveTab('send')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'send' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>{t('communication_page.send_whatsapp')}</button>
                <button onClick={() => setActiveTab('history')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>{t('communication_page.tabs_history')}</button>
            </div>

            {activeTab === 'send' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 flex-none">
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
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input type="text" placeholder={t('voters.caste_placeholder')} value={casteFilter} onChange={e => setCasteFilter(e.target.value)} className="ns-input pl-9 w-full text-sm" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between flex-none">
                        <button onClick={handleSelectAllVisible} className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-brand-700">
                            {selectAll ? <CheckSquare className="w-5 h-5 text-brand-600" /> : <Square className="w-5 h-5 text-slate-400" />}
                            {t('communication_page.select_all_visible')} ({voters.length})
                        </button>
                        <div className="text-sm font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-lg border border-brand-100">
                            {selectedVoterIds.size} {t('communication_page.selected')}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
                        <div className="flex-1 ns-card overflow-y-auto p-2">
                            {loading ? (
                                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
                            ) : (
                                <div className="space-y-2">
                                    {voters.map(voter => (
                                        <div key={voter.id} onClick={() => toggleSelectVoter(voter.id)} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedVoterIds.has(voter.id) ? 'bg-brand-50 border-brand-200' : 'bg-white border-slate-100'}`}>
                                            <div className="flex items-center gap-3">
                                                {selectedVoterIds.has(voter.id) ? <CheckSquare className="w-5 h-5 text-brand-600" /> : <Square className="w-5 h-5 text-slate-300" />}
                                                <div>
                                                    <h4 className="font-semibold text-sm">{getDisplayName(voter)}</h4>
                                                    <p className="text-xs text-slate-500">{voter.mobile}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {totalCount !== null && voters.length < totalCount && (
                                        <button onClick={() => { const next = page + 1; setPage(next); fetchVoters(next, false); }} className="w-full py-3 text-sm text-brand-600 font-medium hover:bg-brand-50 rounded-lg">{t('communication_page.load_more')}</button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="w-full lg:w-1/3 flex flex-col gap-4">
                            <div className="ns-card p-4 flex flex-col h-full bg-brand-50/30 border-brand-100">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Send className="w-4 h-4 text-brand-600" /> {t('communication_page.compose_whatsapp')}
                                </h3>
                                <textarea value={message} onChange={e => setMessage(e.target.value)} className="ns-input flex-1 w-full p-3 resize-none mb-4 min-h-[150px] border-brand-200 focus:ring-brand-500" placeholder={t('communication_page.whatsapp_placeholder')} />
                                <button onClick={handleSendWhatsApp} disabled={sending || selectedVoterIds.size === 0} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-200 disabled:opacity-50 transition-all">
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
                                    {t('communication_page.send_whatsapp')}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 overflow-y-auto space-y-3">
                    {logsLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">{t('communication_page.no_wa_logs')}</div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="ns-card p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{format(new Date(log.sent_at), 'dd MMM yyyy, hh:mm a')}</p>
                                        <p className="text-xs text-slate-500">{log.recipients} {t('communication_page.recipients')} • {log.sent_count} {t('communication_page.sent')}</p>
                                    </div>
                                    <span className="px-2 py-1 bg-brand-50 text-brand-700 text-[10px] font-bold uppercase rounded">{t('communication_page.channel_wa')}</span>
                                </div>
                                <p className="text-sm text-slate-600 line-clamp-2">{log.message}</p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default WhatsAppCommunication;
