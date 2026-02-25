import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { io } from 'socket.io-client';
import { CheckCircle, RefreshCw, Smartphone, LogOut, Power } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

import { useTenant } from '../../context/TenantContext';

const SOCKET_URL = import.meta.env.VITE_BOT_API_URL || import.meta.env.VITE_BOT_URL || 'https://nagarsevak-managment-1.onrender.com';

const BotDashboard = () => {
    const { t } = useLanguage();
    const { tenantId } = useTenant();
    const [status, setStatus] = useState<string>('disconnected');
    const [qrCode, setQrCode] = useState<string>('');
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<any>(null);

    const handleLogout = () => {
        if (socket && tenantId) {
            socket.emit('logout_session', { tenantId });
        }
    };

    useEffect(() => {
        if (!tenantId) return;

        // Initial simulated loading
        // setTimeout(() => setLoading(false), 1000);

        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to Bot Server');
            // Join the specific tenant room
            newSocket.emit('join_tenant', { tenantId });
            // Request to start session if not exists
            newSocket.emit('start_session', { tenantId });
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from Bot Server');
            setStatus('disconnected');
        });

        newSocket.on('status', (newStatus) => {
            console.log('Bot Status:', newStatus);
            setStatus(newStatus);
            setLoading(false); // Stop loading when we get status
        });

        newSocket.on('qr', (qr) => {
            console.log('QR Received');
            setQrCode(qr);
            setLoading(false);
        });

        newSocket.on('logged_out', () => {
            console.log('Bot logged out explicitly. Fetching new QR code...');
            setStatus('disconnected');
            setQrCode('');
            // Automatically request a new session instead of staying offline infinitely
            newSocket.emit('start_session', { tenantId });
        });

        return () => {
            newSocket.disconnect();
        };
    }, [tenantId]);

    const getStatusColor = () => {
        switch (status) {
            case 'connected': return 'text-green-600 bg-green-50 border-green-200';
            case 'scanning': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'authenticated': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'failed': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'connected': return t('whatsapp_bot.status_online');
            case 'scanning': return t('whatsapp_bot.status_scan_qr');
            case 'authenticated': return t('whatsapp_bot.status_auth');
            case 'disconnected': return t('whatsapp_bot.status_disconnected');
            case 'connected_to_server': return t('whatsapp_bot.status_waiting');
            case 'failed': return 'Connection Failed - Retry Needed';
            default: return status;
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Smartphone className="w-7 h-7 text-brand-700" />
                    {t('whatsapp_bot.title')}
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    <>
                        <div className="ns-card p-6">
                            <div className="h-6 w-40 bg-slate-200 rounded animate-pulse mb-6" />
                            <div className="h-16 w-full bg-slate-200 rounded-lg animate-pulse mb-8" />
                            <div className="space-y-4">
                                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                                    <div className="h-4 w-5/6 bg-slate-200 rounded animate-pulse" />
                                    <div className="h-4 w-4/6 bg-slate-200 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                        <div className="ns-card p-6 flex flex-col items-center justify-center min-h-[300px]">
                            <div className="w-56 h-56 bg-slate-200 rounded-2xl animate-pulse" />
                            <div className="mt-4 h-4 w-48 bg-slate-200 rounded animate-pulse" />
                        </div>
                    </>
                ) : (
                    <>
                        {/* Status Card */}
                        <div className="ns-card p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('whatsapp_bot.status_title')}</h2>
                            <div className={`p-4 rounded-lg border flex items-center justify-between ${getStatusColor()}`}>
                                <div className="flex items-center gap-3">
                                    {status === 'connected' ? <CheckCircle className="w-6 h-6" /> : <RefreshCw className={`w-6 h-6 ${status === 'scanning' ? 'animate-spin' : ''}`} />}
                                    <span className="font-medium text-lg">{getStatusText()}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm ml-auto"
                                    title={status === 'connected' ? "Logout WhatsApp Bot" : "Force Reset Bot Connection"}
                                >
                                    <LogOut className="w-4 h-4" />
                                    {status === 'connected' ? 'Logout' : 'Reset Bot'}
                                </button>
                            </div>

                            <div className="mt-6">
                                <h3 className="text-sm font-semibold text-slate-600 mb-2">{t('whatsapp_bot.instructions_title')}</h3>
                                <ol className="list-decimal list-inside space-y-2 text-slate-600 text-sm">
                                    <li>{t('whatsapp_bot.step_1')}</li>
                                    <li>{t('whatsapp_bot.step_2')}</li>
                                    <li>{t('whatsapp_bot.step_3')}</li>
                                    <li>{t('whatsapp_bot.step_4')}</li>
                                </ol>
                            </div>
                        </div>

                        {/* QR Code Card */}
                        <div className="ns-card p-6 flex flex-col items-center justify-center min-h-[300px]">
                            {status === 'connected' ? (
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-10 h-10 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">{t('whatsapp_bot.connected_title')}</h3>
                                    <p className="text-slate-500 mt-2">{t('whatsapp_bot.connected_desc')}</p>
                                    <button
                                        onClick={handleLogout}
                                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors mx-auto"
                                    >
                                        <Power className="w-4 h-4" />
                                        Disconnect Bot
                                    </button>
                                </div>
                            ) : status === 'scanning' && qrCode ? (
                                <div className="text-center">
                                    <div className="bg-white p-4 border-2 border-slate-200 rounded-2xl inline-block">
                                        <QRCodeCanvas value={qrCode} size={220} />
                                    </div>
                                    <p className="mt-4 text-sm text-slate-500">{t('whatsapp_bot.scan_hint')}</p>
                                </div>
                            ) : (
                                <div className="text-center text-slate-400">
                                    <RefreshCw className="w-12 h-12 mx-auto mb-3 animate-spin opacity-50" />
                                    <p>{t('whatsapp_bot.waiting_qr')}</p>
                                    <p className="text-xs mt-1">{t('whatsapp_bot.backend_hint')}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default BotDashboard;
