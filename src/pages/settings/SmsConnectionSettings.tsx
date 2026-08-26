import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { supabase } from '../../services/supabaseClient';
import { Smartphone, CheckCircle, XCircle, Loader2, AlertTriangle, Send } from 'lucide-react';
import { toast } from 'sonner';

const BOT_URL = import.meta.env.VITE_BOT_URL || 'http://localhost:3001';

type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'DEVICE_OFFLINE' | 'ERROR';

interface SmsConnection {
    id: string;
    provider: string;
    provider_device_id: string;
    phone_number_masked: string;
    status: ConnectionStatus;
    connected_at: string;
    last_seen_at: string | null;
}

const SmsConnectionSettings: React.FC = () => {
    const { user } = useAuth();
    const { tenantId } = useTenant();
    
    const [connection, setConnection] = useState<SmsConnection | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'CONNECTING' | 'DISCONNECTING'>('LOADING');
    const [apiKey, setApiKey] = useState('');
    const [testPhone, setTestPhone] = useState('');
    const [showTestModal, setShowTestModal] = useState(false);
    const [testing, setTesting] = useState(false);

    // Only allow admin or super_admin
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    const getAuthHeaders = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No active session');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        };
    };

    const fetchConnection = async () => {
        if (!tenantId) return;
        setStatus('LOADING');
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${BOT_URL}/api/sms/connections`, { headers });
            if (!res.ok) {
                if (res.status === 403) {
                    setConnection(null);
                    return;
                }
                throw new Error('Failed to fetch connection');
            }
            const data = await res.json();
            setConnection(data);
        } catch (error) {
            console.error('Error fetching SMS connection:', error);
            toast.error('Failed to load SMS connection metadata');
        } finally {
            setStatus('IDLE');
        }
    };

    // Re-fetch when tenant changes
    useEffect(() => {
        fetchConnection();
        // Clear sensitive state on tenant change
        setApiKey('');
    }, [tenantId]);

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!apiKey.trim()) {
            toast.error('API Key is required');
            return;
        }

        setStatus('CONNECTING');
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${BOT_URL}/api/sms/connections/link`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ apiKey: apiKey.trim() })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Failed to connect SMS gateway');
            }
            
            setConnection(data.connection);
            toast.success('SMS Gateway connected successfully');
        } catch (error: any) {
            toast.error(error.message || 'Error connecting SMS gateway');
        } finally {
            setStatus('IDLE');
            setApiKey(''); // Always clear API key from state immediately
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Disconnect SMS Gateway? Queued and future SMS sending through this phone will be unavailable until another phone is connected.')) {
            return;
        }

        setStatus('DISCONNECTING');
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${BOT_URL}/api/sms/connections/disconnect`, {
                method: 'POST',
                headers
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Failed to disconnect');
            }
            
            setConnection(null);
            toast.success('SMS Gateway disconnected');
        } catch (error: any) {
            toast.error(error.message || 'Error disconnecting SMS gateway');
        } finally {
            setStatus('IDLE');
        }
    };

    const handleTestSMS = async () => {
        if (!testPhone.trim() || testPhone.length < 10) {
            toast.error('Valid phone number required');
            return;
        }

        setTesting(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${BOT_URL}/api/sms/connections/test`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ targetPhone: testPhone.trim() })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Failed to send test SMS');
            }
            
            toast.success('Test SMS dispatched successfully');
            setShowTestModal(false);
            setTestPhone('');
        } catch (error: any) {
            toast.error(error.message || 'Error sending test SMS');
        } finally {
            setTesting(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-center p-8 flex-col text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">Permission Denied</h3>
                    <p className="text-slate-500">You do not have the required permissions to manage SMS Connections.</p>
                </div>
            </div>
        );
    }

    if (status === 'LOADING') {
        return (
            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-brand-600" />
                    SMS Gateway Connection
                </h3>

                {connection && connection.status !== 'DISCONNECTED' ? (
                    <div className="space-y-6">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex items-start gap-4">
                            <div className="p-2 bg-emerald-100 rounded-full shrink-0">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-emerald-900">🟢 Connected</h4>
                                <div className="mt-2 space-y-1 text-sm text-emerald-800">
                                    <p><span className="font-medium">Phone:</span> {connection.phone_number_masked}</p>
                                    <p><span className="font-medium">Device:</span> Android</p>
                                    <p><span className="font-medium">Connected:</span> {new Date(connection.connected_at).toLocaleString()}</p>
                                    {connection.last_seen_at && (
                                        <p><span className="font-medium">Last seen:</span> {new Date(connection.last_seen_at).toLocaleString()}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowTestModal(true)}
                                className="px-4 py-2 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" /> Send Test SMS
                            </button>
                            <button
                                type="button"
                                onClick={handleDisconnect}
                                disabled={status === 'DISCONNECTING'}
                                className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {status === 'DISCONNECTING' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                Disconnect
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                            <h4 className="font-bold text-slate-800 mb-2">Connect Your Phone</h4>
                            <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2 mb-6">
                                <li>Install the <a href="https://httpsms.com/" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">httpSMS</a> application on your Android device.</li>
                                <li>Sign in or create an account in the app.</li>
                                <li>Generate an API Key from the httpSMS settings.</li>
                                <li>Paste the API Key below to securely link your device.</li>
                            </ol>

                            <form onSubmit={handleConnect} className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">httpSMS API Key</label>
                                    <input
                                        type="password"
                                        autoComplete="off"
                                        required
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="Enter your secret API key"
                                        className="ns-input w-full"
                                        disabled={status === 'CONNECTING'}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={status === 'CONNECTING' || !apiKey.trim()}
                                    className="w-full px-4 py-2 bg-brand-600 text-white hover:bg-brand-700 rounded-lg font-medium flex justify-center items-center gap-2 disabled:opacity-70 transition-colors"
                                >
                                    {status === 'CONNECTING' ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Validating your SMS connection...
                                        </>
                                    ) : (
                                        'Connect Phone'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Test SMS Modal */}
            {showTestModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-lg">Send Test SMS</h3>
                            <button onClick={() => setShowTestModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-sm text-slate-500">Enter a valid mobile number to send a test message using your connected Android device.</p>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Recipient Mobile Number</label>
                                <input
                                    type="tel"
                                    value={testPhone}
                                    onChange={(e) => setTestPhone(e.target.value)}
                                    placeholder="+91..."
                                    className="ns-input w-full"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowTestModal(false)}
                                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleTestSMS}
                                disabled={testing || !testPhone.trim()}
                                className="px-4 py-2 bg-brand-600 text-white font-medium hover:bg-brand-700 rounded-lg transition-colors text-sm flex items-center gap-2 disabled:opacity-70"
                            >
                                {testing && <Loader2 className="w-4 h-4 animate-spin" />}
                                Send Message
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmsConnectionSettings;
