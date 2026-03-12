import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Loader2, Phone, RefreshCw, CheckSquare, Square, Users, MapPin, ChevronDown, User, Home, Languages, CheckCircle2, XCircle, Clock, History } from 'lucide-react';
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

const AIVoiceCall = () => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();

    const [activeTab, setActiveTab] = useState<'call' | 'history'>('call');
    const [voters, setVoters] = useState<Voter[]>([]);
    const [totalCount, setTotalCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);

    const [nameFilter, setNameFilter] = useState('');
    const [addressFilter, setAddressFilter] = useState('');

    const [selectedVoterIds, setSelectedVoterIds] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState(false);

    const [callMessage, setCallMessage] = useState('');
    const [callLanguage, setCallLanguage] = useState('mr-IN');
    const [calling, setCalling] = useState(false);
    const [callResults, setCallResults] = useState<any[]>([]);

    const [logs, setLogs] = useState<MessageLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);

    const fetchVoters = useCallback(async (currentPage: number, reset: boolean = false) => {
        if (reset) setLoading(true);
        try {
            let query = supabase.from('voters').select('*', { count: 'exact' }).eq('tenant_id', tenantId).not('mobile', 'is', null).neq('mobile', '').range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);
            if (nameFilter) query = query.or(`name_english.ilike.%${nameFilter}%,name_marathi.ilike.%${nameFilter}%`);
            if (addressFilter) query = query.or(`address_english.ilike.%${addressFilter}%,address_marathi.ilike.%${addressFilter}%`);

            const { data, error, count } = await query;
            if (error) throw error;
            setTotalCount(count);
            const mappedVoters: Voter[] = (data || []).map((row: any) => ({
                id: row.id.toString(),
                name: row.name_english || row.name_marathi,
                name_english: row.name_english,
                name_marathi: row.name_marathi,
                mobile: row.mobile,
                age: row.age || 0,
                gender: row.gender || 'M',
                address: row.address_english || row.address_marathi || '',
                ward: row.ward_no || '-',
                booth: row.part_no || '-',
                epicNo: row.epic_no || '-',
                history: []
            }));
            if (reset) setVoters(mappedVoters);
            else setVoters(prev => [...prev, ...mappedVoters]);
        } catch (err) { 
            console.error(err);
            toast.error(t('communication_page.error_load_voters'));
        } finally { setLoading(false); }
    }, [tenantId, nameFilter, addressFilter, t]);

    useEffect(() => { fetchVoters(0, true); }, [fetchVoters]);

    const fetchLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const { data, error } = await supabase.from('message_logs').select('*').eq('tenant_id', tenantId).eq('channel', 'call').order('sent_at', { ascending: false }).limit(100);
            if (error) throw error;
            setLogs(data || []);
        } catch (err) { 
            console.error(err);
            toast.error(t('communication_page.error_load_wa_history'));
        } finally { setLogsLoading(false); }
    }, [tenantId, t]);

    useEffect(() => { if (activeTab === 'history') fetchLogs(); }, [activeTab, fetchLogs]);

    const toggleSelectVoter = (id: string) => {
        setSelectedVoterIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectAllVisible = () => {
        if (selectAll) { setSelectedVoterIds(new Set()); setSelectAll(false); }
        else { setSelectedVoterIds(new Set(voters.map(v => v.id))); setSelectAll(true); }
    };

    const handleAICall = async () => {
        if (selectedVoterIds.size === 0) { toast.error(t('communication_page.error_select_voter')); return; }
        if (!callMessage.trim()) { toast.error(t('communication_page.error_msg_required')); return; }

        const targetVoters = voters.filter(v => selectedVoterIds.has(v.id) && v.mobile && v.mobile.length >= 10);
        if (targetVoters.length === 0) { toast.error(t('communication_page.error_no_mobile')); return; }

        const numbers = targetVoters.map(v => ({ mobile: v.mobile!.replace(/\D/g, ''), name: language === 'mr' ? v.name_marathi : v.name_english }));

        setCalling(true);
        toast.loading(t('communication_page.initiating_calls', { count: numbers.length }), { id: 'ai-call' });

        try {
            const BOT_URL = import.meta.env.VITE_BOT_API_URL || 'https://nagarsevak-managment-1.onrender.com';
            const res = await fetch(`${BOT_URL}/api/sarvam-call/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, numbers, message: callMessage, language: callLanguage })
            });
            const data = await res.json();

            toast.dismiss('ai-call');
            if (!res.ok || !data.success) { toast.error(data.error || t('communication_page.error_wa_failed')); }
            else {
                toast.success(t('communication_page.success_ai_calls', { count: numbers.length }));
                setCallMessage('');
                setSelectedVoterIds(new Set());
                setSelectAll(false);
                if (activeTab === 'history') fetchLogs();
            }
        } catch (err: any) { toast.dismiss('ai-call'); toast.error('Connection error'); } finally { setCalling(false); }
    };

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex-none">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Phone className="w-7 h-7 text-brand-600" />
                    {t('nav.ai_voice_call')}
                </h1>
                <p className="text-slate-500 text-sm mt-1">{t('communication_page.ai_call_subtitle')}</p>

                <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 mt-4 w-fit">
                    <button onClick={() => setActiveTab('call')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'call' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>{t('communication_page.initiate_ai_call')}</button>
                    <button onClick={() => setActiveTab('history')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>{t('communication_page.tabs_history')}</button>
                </div>
            </div>

            {activeTab === 'call' ? (
                <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                        <div className="relative flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input type="text" placeholder={t('communication_page.search_placeholder')} value={nameFilter} onChange={e => setNameFilter(e.target.value)} className="ns-input pl-9 w-full text-sm" />
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
                                                    <h4 className="font-semibold text-sm">{language === 'mr' ? voter.name_marathi : voter.name_english}</h4>
                                                    <p className="text-xs text-slate-500">{voter.mobile}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full lg:w-2/5 flex flex-col gap-4">
                        <div className="ns-card p-5 flex flex-col h-full bg-brand-50/20 border-brand-100">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Phone className="w-4 h-4 text-brand-600" /> {t('communication_page.call_settings')}</h3>

                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-slate-600 mb-2">{t('communication_page.select_call_lang')}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[{ code: 'mr-IN', label: 'मराठी' }, { code: 'hi-IN', label: 'हिंदी' }, { code: 'en-IN', label: 'English' }].map(l => (
                                        <button key={l.code} onClick={() => setCallLanguage(l.code)} className={`p-2 rounded-lg border text-xs font-bold transition-all ${callLanguage === l.code ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                                            {l.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col">
                                <label className="block text-xs font-semibold text-slate-600 mb-2">{t('communication_page.msg_to_speak')}</label>
                                <textarea value={callMessage} onChange={e => setCallMessage(e.target.value)} className="ns-input flex-1 w-full p-3 resize-none mb-4 min-h-[150px] border-brand-200 focus:ring-brand-500" placeholder={t('communication_page.msg_placeholder')} />
                                <button onClick={handleAICall} disabled={calling || selectedVoterIds.size === 0} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-100 disabled:opacity-50">
                                    {calling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Phone className="w-5 h-5" />}
                                    {t('communication_page.start_ai_calls')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto space-y-3">
                    {logsLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="ns-card p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{format(new Date(log.sent_at), 'dd MMM yyyy, hh:mm a')}</p>
                                        <p className="text-xs text-slate-500">{log.recipients} {t('communication_page.recipients')} • {log.sent_count} {t('communication_page.calls_label')}</p>
                                    </div>
                                    <span className="px-2 py-1 bg-brand-50 text-brand-700 text-[10px] font-bold uppercase rounded">{t('nav.ai_voice_call')}</span>
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

export default AIVoiceCall;
