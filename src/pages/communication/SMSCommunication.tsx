import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Loader2, Send, RefreshCw, MessageSquare, CheckSquare, Square, Users, MapPin, ChevronDown, User, Home, History } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { type Voter } from '../../types';
import { toast } from 'sonner';
import { format } from 'date-fns';

const PAGE_SIZE = 50;

interface MessageLog {
    id: string;
    sent_at: string;
    channel: 'whatsapp' | 'sms' | 'call';
    message: string;
    recipients: number;
    sent_count: number;
    failed_count: number;
}

const SMSCommunication = () => {
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

    const [logs, setLogs] = useState<MessageLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);

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

    const fetchLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const { data, error } = await supabase
                .from('message_logs')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('channel', 'sms')
                .order('sent_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load SMS history');
        } finally {
            setLogsLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        if (activeTab === 'history') fetchLogs();
    }, [activeTab, fetchLogs]);

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

    const handleSendSMS = async () => {
        if (selectedVoterIds.size === 0) { toast.error(t('communication_page.error_select_voter')); return; }
        if (!message.trim()) { toast.error(t('communication_page.error_enter_message')); return; }

        setSending(true);
        setTimeout(async () => {
            const { error } = await supabase.from('message_logs').insert({
                tenant_id: tenantId,
                channel: 'sms',
                message: message,
                recipients: selectedVoterIds.size,
                sent_count: selectedVoterIds.size,
                failed_count: 0,
                sent_at: new Date().toISOString()
            });

            if (error) {
                toast.error('Failed to log message');
            } else {
                toast.success(t('communication_page.success_sms', { count: selectedVoterIds.size }));
                setMessage('');
                setSelectedVoterIds(new Set());
                setSelectAll(false);
                if (activeTab === 'history') fetchLogs();
            }
            setSending(false);
        }, 1500);
    };

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex-none">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-7 h-7 text-brand-600" />
                    {t('nav.send_sms')}
                </h1>
                <p className="text-slate-500 text-sm mt-1">{t('communication_page.subtitle')}</p>

                <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 mt-4 w-fit">
                    <button onClick={() => setActiveTab('send')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'send' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Send SMS</button>
                    <button onClick={() => setActiveTab('history')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>History</button>
                </div>
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
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
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
                                <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
                            ) : (
                                <div className="space-y-2">
                                    {voters.map(voter => (
                                        <div
                                            key={voter.id}
                                            onClick={() => toggleSelectVoter(voter.id)}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedVoterIds.has(voter.id) ? 'bg-brand-50 border-brand-200' : 'bg-white border-slate-100'}`}
                                        >
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
                                        <button onClick={() => { const next = page + 1; setPage(next); fetchVoters(next, false); }} className="w-full py-3 text-sm text-brand-600 font-medium hover:bg-brand-50 rounded-lg">Load More</button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="w-full lg:w-1/3 flex flex-col gap-4">
                            <div className="ns-card p-4 flex flex-col h-full">
                                <h3 className="font-bold text-slate-800 mb-4">{t('communication_page.compose_message')}</h3>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    className="ns-input flex-1 w-full p-3 resize-none mb-4 min-h-[150px]"
                                    placeholder={t('communication_page.message_placeholder')}
                                />
                                <button
                                    onClick={handleSendSMS}
                                    disabled={sending || selectedVoterIds.size === 0}
                                    className="w-full ns-btn-primary py-3 flex items-center justify-center gap-2"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    {t('nav.send_sms')}
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
                        <div className="text-center py-10 text-slate-500">No message logs found.</div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="ns-card p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{format(new Date(log.sent_at), 'dd MMM yyyy, hh:mm a')}</p>
                                        <p className="text-xs text-slate-500">{log.recipients} Recipients • {log.sent_count} Sent</p>
                                    </div>
                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded">SMS</span>
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

export default SMSCommunication;
