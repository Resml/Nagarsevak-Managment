import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Loader2, Phone, RefreshCw, CheckSquare, Square, Users, MapPin, ChevronDown, User, Home, History } from 'lucide-react';
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

const VoiceCall = () => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();

    const [activeTab, setActiveTab] = useState<'call' | 'history'>('call');
    const [voters, setVoters] = useState<Voter[]>([]);
    const [totalCount, setTotalCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);

    const [nameFilter, setNameFilter] = useState('');
    const [addressFilter, setAddressFilter] = useState('');

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
                ward: row.ward_no,
                address: row.address_english
            }));
            if (reset) setVoters(mappedVoters);
            else setVoters(prev => [...prev, ...mappedVoters]);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [tenantId, nameFilter, addressFilter]);

    useEffect(() => { fetchVoters(0, true); }, [fetchVoters]);

    const fetchLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const { data, error } = await supabase.from('message_logs').select('*').eq('tenant_id', tenantId).eq('channel', 'call').order('sent_at', { ascending: false }).limit(100);
            if (error) throw error;
            setLogs(data || []);
        } catch (err) { console.error(err); } finally { setLogsLoading(false); }
    }, [tenantId]);

    useEffect(() => { if (activeTab === 'history') fetchLogs(); }, [activeTab, fetchLogs]);

    const handleCall = (mobile: string) => {
        if (!mobile) return;
        window.location.href = `tel:${mobile}`;
        // Optionally log the call
        supabase.from('message_logs').insert({
            tenant_id: tenantId,
            channel: 'call',
            message: 'Manual Voice Call Initiated',
            recipients: 1,
            sent_count: 1,
            failed_count: 0,
            sent_at: new Date().toISOString()
        }).then(() => { if (activeTab === 'history') fetchLogs(); });
    };

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex-none">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Phone className="w-7 h-7 text-blue-600" />
                    {t('nav.voice_call')}
                </h1>
                <p className="text-slate-500 text-sm mt-1">Initiate voice calls to voters directly.</p>

                <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 mt-4 w-fit">
                    <button onClick={() => setActiveTab('call')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'call' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Make Call</button>
                    <button onClick={() => setActiveTab('history')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>History</button>
                </div>
            </div>

            {activeTab === 'call' ? (
                <>
                    <div className="flex gap-3 flex-none">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input type="text" placeholder="Search by name..." value={nameFilter} onChange={e => setNameFilter(e.target.value)} className="ns-input pl-9 w-full text-sm" />
                        </div>
                    </div>

                    <div className="flex-1 ns-card overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {voters.map(voter => (
                                    <div key={voter.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between group hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                                        <div>
                                            <h4 className="font-bold text-slate-800">{language === 'mr' ? voter.name_marathi : voter.name_english}</h4>
                                            <p className="text-xs text-slate-500 mt-1">{voter.mobile}</p>
                                        </div>
                                        <button onClick={() => handleCall(voter.mobile!)} className="mt-4 w-full bg-white border border-slate-200 text-blue-600 font-semibold py-2 rounded-lg shadow-sm group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all flex items-center justify-center gap-2">
                                            <Phone className="w-4 h-4" /> Call Now
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex-1 overflow-y-auto space-y-3">
                    {logsLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="ns-card p-4 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-semibold">{format(new Date(log.sent_at), 'dd MMM yyyy, hh:mm a')}</p>
                                    <p className="text-xs text-slate-500">{log.message}</p>
                                </div>
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded">Manual Call</span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default VoiceCall;
