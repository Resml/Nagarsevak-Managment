import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Loader2, Send, RefreshCw, MessageSquare, CheckSquare, Square, Users, MapPin, ChevronDown, User, Home, History } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { type Voter } from '../../types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { HelpCircle } from 'lucide-react';
import { useTutorial } from '../../context/TutorialContext';
import SMSTutorial from '../../components/tutorial/SMSTutorial';

const PAGE_SIZE = 50;

import { CommunicationHistoryPdfGenerator } from '../../components/reports/CommunicationHistoryPdfGenerator';
import { CustomSelect } from '../../components/common/CustomSelect';

const BOT_URL = import.meta.env.VITE_BOT_URL || 'http://localhost:3000';

interface SmsCampaign {
    id: string;
    name: string;
    status: string;
    total_recipients: number;
    created_at: string;
    stats?: {
        QUEUED: number;
        SENDING: number;
        SENT: number;
        DELIVERED: number;
        FAILED: number;
    };
}

const SMSCommunication = () => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();
    const { startTutorial } = useTutorial();

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

    const [logs, setLogs] = useState<SmsCampaign[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [showPdf, setShowPdf] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    
    // Polling interval for live status updates
    useEffect(() => {
        if (activeTab === 'history' && logs.length > 0) {
            // Find active campaigns that are not in terminal states
            const activeCampaigns = logs.filter(c => !['COMPLETED', 'FAILED', 'CANCELLED'].includes(c.status));
            if (activeCampaigns.length === 0) return;

            const interval = setInterval(() => {
                activeCampaigns.forEach(async (campaign) => {
                    try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session) return;
                        
                        const res = await fetch(`${BOT_URL}/api/sms/campaigns/${campaign.id}`, {
                            headers: { 'Authorization': `Bearer ${session.access_token}` }
                        });
                        
                        if (res.ok) {
                            const updated = await res.json();
                            setLogs(prev => prev.map(c => c.id === campaign.id ? { ...c, ...updated } : c));
                        }
                    } catch (err) {
                        console.error('Failed to poll campaign status', err);
                    }
                });
            }, 5000); // Poll every 5s

            return () => clearInterval(interval);
        }
    }, [activeTab, logs]);

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
                .from('sms_campaigns')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false })
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

    const handleSendSMSClick = () => {
        if (selectedVoterIds.size === 0) { toast.error(t('communication_page.error_select_voter')); return; }
        if (!message.trim()) { toast.error(t('communication_page.error_enter_message')); return; }
        setShowConfirmation(true);
    };

    const confirmSendSMS = async () => {
        setSending(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const voterIds = Array.from(selectedVoterIds);
            const idempotencyKey = `sms_${Date.now()}_${voterIds.length}`;
            const campaignName = `SMS Campaign ${format(new Date(), 'dd MMM HH:mm')}`;

            const response = await fetch(`${BOT_URL}/api/sms/campaigns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    voterIds,
                    messageBody: message,
                    idempotencyKey,
                    name: campaignName
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to dispatch SMS campaign');
            }

            if (data.resumed) {
                toast.success('Successfully resumed existing SMS campaign');
            } else {
                toast.success(`Successfully queued ${data.queuedCount} messages.`);
            }

            setMessage('');
            setSelectedVoterIds(new Set());
            setSelectAll(false);
            setShowConfirmation(false);
            if (activeTab === 'history') fetchLogs();
        } catch (err: any) {
            console.error('Send SMS error:', err);
            toast.error(err.message || 'Error sending SMS campaign');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex-none">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="tutorial-sms-header">
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <MessageSquare className="w-7 h-7 text-brand-600" />
                            {t('nav.send_sms')}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">{t('communication_page.subtitle')}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={startTutorial}
                            className="ns-btn ns-btn-secondary tutorial-sms-help border border-brand-200 text-brand-700 bg-white hover:bg-brand-50"
                        >
                            <HelpCircle className="w-4 h-4 mr-2" />
                            {language === 'mr' ? 'मदत' : 'Help'}
                        </button>
                    </div>
                </div>

                <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 mt-4 w-fit tutorial-sms-tabs">
                    <button onClick={() => setActiveTab('send')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'send' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>{t('communication_page.tabs_send')}</button>
                    <button onClick={() => setActiveTab('history')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>{t('communication_page.tabs_history')}</button>
                </div>
            </div>

            {activeTab === 'send' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 flex-none tutorial-sms-filters">
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
                            <CustomSelect value={genderFilter} onChange={e => setGenderFilter(e.target.value)} className="ns-input pl-9 w-full appearance-none bg-white text-sm">
                                <option value="">{t('voters.all_genders')}</option>
                                <option value="M">{t('voters.gender_male')}</option>
                                <option value="F">{t('voters.gender_female')}</option>
                            </CustomSelect>
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

                    <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden tutorial-sms-list">
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
                                        <button onClick={() => { const next = page + 1; setPage(next); fetchVoters(next, false); }} className="w-full py-3 text-sm text-brand-600 font-medium hover:bg-brand-50 rounded-lg">{t('communication_page.load_more')}</button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="w-full lg:w-1/3 flex flex-col gap-4 tutorial-sms-compose">
                            <div className="ns-card p-4 flex flex-col h-full">
                                <h3 className="font-bold text-slate-800 mb-4">{t('communication_page.compose_message')}</h3>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    className="ns-input flex-1 w-full p-3 resize-none mb-4 min-h-[150px]"
                                    placeholder={t('communication_page.message_placeholder')}
                                />
                                <button
                                    onClick={handleSendSMSClick}
                                    disabled={sending || selectedVoterIds.size === 0}
                                    className="w-full ns-btn-primary py-3 flex items-center justify-center gap-2 tutorial-sms-send"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    {t('nav.send_sms')}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">{t('communication_page.tabs_history')}</h2>
                            <p className="text-sm text-slate-500">{logs.length} SMS campaigns</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowPdf(true)}
                                className="ns-btn-ghost border border-brand-200 text-brand-700 bg-brand-50/50 hover:bg-brand-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                                {language === 'mr' ? 'पीडीएफ डाउनलोड करा' : 'Download PDF'}
                            </button>
                            <button onClick={fetchLogs} disabled={logsLoading} className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium">
                                {logsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                {t('common.refresh') || 'Refresh'}
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3">
                    {logsLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">{t('communication_page.no_logs')}</div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="ns-card p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-md font-bold text-slate-800">{log.name}</h3>
                                        <p className="text-sm text-slate-600">{format(new Date(log.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                                        <p className="text-xs text-slate-500 mt-1 font-medium text-brand-600">{log.status}</p>
                                    </div>
                                    <span className="px-2 py-1 bg-brand-50 text-brand-700 text-[10px] font-bold uppercase rounded">{log.total_recipients} {t('communication_page.recipients')}</span>
                                </div>
                                
                                {/* Live Stats display if available */}
                                {log.stats && (
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex gap-4 text-xs font-semibold">
                                        <div className="text-slate-500">Queued: <span className="text-slate-700">{log.stats.QUEUED || 0}</span></div>
                                        <div className="text-amber-500">Sending: <span className="text-amber-600">{log.stats.SENDING || 0}</span></div>
                                        <div className="text-blue-500">Sent: <span className="text-blue-600">{log.stats.SENT || 0}</span></div>
                                        <div className="text-emerald-500">Delivered: <span className="text-emerald-600">{log.stats.DELIVERED || 0}</span></div>
                                        <div className="text-red-500">Failed: <span className="text-red-600">{log.stats.FAILED || 0}</span></div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    </div>
                </div>
            )}
            
            {/* PDF Report Generator */}
            {showPdf && (
                <CommunicationHistoryPdfGenerator
                    logs={logs.map(l => ({ id: l.id, sent_at: l.created_at, channel: 'sms', message: l.name, recipients: l.total_recipients, sent_count: l.stats?.SENT || 0, failed_count: l.stats?.FAILED || 0 }))}
                    onClose={() => setShowPdf(false)}
                />
            )}
            
            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-brand-50/50">
                            <h3 className="font-bold text-lg text-slate-800">Confirm SMS Campaign</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-600 mb-6">
                                I confirm that I have reviewed the recipients and message and want to send this SMS campaign using my connected phone.
                            </p>
                            <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-100">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-slate-500 font-medium">Recipients:</span>
                                    <span className="text-sm font-bold text-slate-800">{selectedVoterIds.size}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-slate-500 font-medium block mb-1">Message Preview:</span>
                                    <p className="text-sm text-slate-700 bg-white p-2 border border-slate-200 rounded line-clamp-3">
                                        {message}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 justify-end mt-4">
                                <button
                                    onClick={() => setShowConfirmation(false)}
                                    disabled={sending}
                                    className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmSendSMS}
                                    disabled={sending}
                                    className="ns-btn-primary px-6 py-2.5 flex items-center justify-center gap-2"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    Confirm & Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <SMSTutorial />
        </div>
    );
};

export default SMSCommunication;
