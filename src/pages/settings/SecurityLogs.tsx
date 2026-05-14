import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Shield, Clock, Monitor, Globe, Search, RefreshCcw, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface LoginLog {
    id: string;
    created_at: string;
    email: string;
    ip_address: string;
    device_type: string;
    browser: string;
    os: string;
    status: string;
}

const SecurityLogs = () => {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const [logs, setLogs] = useState<LoginLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('login_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error('Error fetching logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => 
        log.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.browser?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.os?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="w-7 h-7 text-brand-600" />
                        {language === 'mr' ? 'सुरक्षा लॉग' : 'Security Logs'}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {language === 'mr' ? 'तुमच्या खात्याचा वापर आणि डिव्हाइस सत्रांचे निरीक्षण करा.' : 'Monitor recent access to your account and device sessions.'}
                    </p>
                </div>
                <button 
                    onClick={fetchLogs}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                >
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {language === 'mr' ? 'लॉग रिफ्रेश करा' : 'Refresh Logs'}
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder={language === 'mr' ? 'ईमेल, डिव्हाइस किंवा ब्राउझरद्वारे शोधा...' : 'Search by email, device or browser...'}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                <th className="px-6 py-4">{language === 'mr' ? 'स्थिती' : 'Status'}</th>
                                <th className="px-6 py-4">{language === 'mr' ? 'वापरकर्ता / ईमेल' : 'User / Email'}</th>
                                <th className="px-6 py-4">{language === 'mr' ? 'डिव्हाइस आणि OS' : 'Device & OS'}</th>
                                <th className="px-6 py-4">{language === 'mr' ? 'ब्राउझर' : 'Browser'}</th>
                                <th className="px-6 py-4">{language === 'mr' ? 'तारीख आणि वेळ' : 'Date & Time'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-4 bg-slate-50/50 h-12"></td>
                                    </tr>
                                ))
                            ) : filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {log.status === 'success' 
                                                    ? (language === 'mr' ? 'अधिकृत' : 'Authorized') 
                                                    : (language === 'mr' ? 'अयशस्वी' : 'Failed')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {log.email}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Monitor className="w-4 h-4 text-slate-400" />
                                                <span>{log.device_type} • {log.os}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-slate-400" />
                                                <span>{log.browser}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span>{format(new Date(log.created_at), 'dd MMM yyyy, HH:mm')}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertTriangle className="w-8 h-8 text-slate-300" />
                                            <p>{language === 'mr' ? 'कोणतेही सुरक्षा लॉग आढळले नाहीत.' : 'No security logs found.'}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SecurityLogs;
