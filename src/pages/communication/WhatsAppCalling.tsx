import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Phone, RefreshCw, Smartphone, Users, MapPin, History } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { type Voter } from '../../types';
import { toast } from 'sonner';
import { io } from 'socket.io-client';

const PAGE_SIZE = 50;
const SOCKET_URL = import.meta.env.VITE_BOT_API_URL || import.meta.env.VITE_BOT_URL || 'https://nagarsevak-managment-1.onrender.com';

const WhatsAppCalling = () => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();
    const [activeTab, setActiveTab] = useState<'call' | 'history'>('call');
    const [voters, setVoters] = useState<Voter[]>([]);
    const [loading, setLoading] = useState(false);
    const [botStatus, setBotStatus] = useState('disconnected');
    const [socket, setSocket] = useState<any>(null);

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

    const fetchVoters = useCallback(async (reset: boolean = true) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('voters').select('*').eq('tenant_id', tenantId).not('mobile', 'is', null).neq('mobile', '').limit(50);
            if (error) throw error;
            setVoters((data || []).map((row: any) => ({
                id: row.id.toString(),
                name: row.name_english || row.name_marathi,
                mobile: row.mobile,
                name_marathi: row.name_marathi,
                name_english: row.name_english,
                age: row.age || 0,
                gender: row.gender || 'M',
                address: row.address_english || row.address_marathi || '',
                ward: row.ward_no || '-',
                booth: row.part_no || '-',
                epicNo: row.epic_no || '-',
                history: []
            })));
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [tenantId]);

    useEffect(() => { fetchVoters(); }, [fetchVoters]);

    const handleWhatsAppCall = (voter: Voter) => {
        if (!voter.mobile) return;
        if (botStatus !== 'connected') {
            toast.warning('Bot is not connected. Attempting local WhatsApp redirect...');
            window.open(`https://wa.me/${voter.mobile.replace(/\D/g, '')}`, '_blank');
            return;
        }

        toast.info(`Initiating WhatsApp call to ${voter.name}...`);
        // Emit call event if bot supports it
        socket.emit('initiate_whatsapp_call', { number: voter.mobile.replace(/\D/g, ''), tenantId });
    };

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex justify-between items-start flex-none">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Smartphone className="w-7 h-7 text-green-600" />
                        {t('nav.whatsapp_call')}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Initiate voice calls via WhatsApp to voters.</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${botStatus === 'connected' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    <div className={`w-2 h-2 rounded-full ${botStatus === 'connected' ? 'bg-green-600' : 'bg-red-600'}`} />
                    {botStatus === 'connected' ? 'Bot Active' : 'Bot Inactive'}
                </div>
            </div>

            <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 flex-none w-fit">
                <button onClick={() => setActiveTab('call')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'call' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Make Call</button>
                <button onClick={() => setActiveTab('history')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>History</button>
            </div>

            {activeTab === 'call' ? (
                <div className="flex-1 ns-card overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {voters.map(voter => (
                                <div key={voter.id} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-green-200 hover:shadow-md transition-all flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-slate-800">{language === 'mr' ? voter.name_marathi : voter.name_english}</h4>
                                        <p className="text-xs text-slate-500 mt-1">{voter.mobile}</p>
                                    </div>
                                    <button onClick={() => handleWhatsAppCall(voter)} className="mt-4 w-full bg-green-50 text-green-600 font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 hover:text-white transition-all">
                                        <Smartphone className="w-4 h-4" /> WhatsApp Call
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <History className="w-12 h-12 mb-3 opacity-30" />
                    <p>WhatsApp call history will appear here.</p>
                </div>
            )}
        </div>
    );
};

export default WhatsAppCalling;
