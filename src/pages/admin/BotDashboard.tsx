import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { io } from 'socket.io-client';
import { Phone, CheckCircle, RefreshCw, Smartphone } from 'lucide-react';

const SOCKET_URL = 'http://localhost:4000';

const BotDashboard = () => {
    const [status, setStatus] = useState<string>('disconnected');
    const [qrCode, setQrCode] = useState<string>('');
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const socket = io(SOCKET_URL);

        socket.on('connect', () => {
            console.log('Connected to Bot Server');
            setStatus('connected_to_server');
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from Bot Server');
            setStatus('disconnected');
        });

        socket.on('status', (newStatus) => {
            console.log('Bot Status:', newStatus);
            setStatus(newStatus);
        });

        socket.on('qr', (qr) => {
            console.log('QR Received');
            setQrCode(qr);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const getStatusColor = () => {
        switch (status) {
            case 'connected': return 'text-green-600 bg-green-50 border-green-200';
            case 'scanning': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'authenticated': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'connected': return 'Bot is Online & Ready';
            case 'scanning': return 'Scan QR Code';
            case 'authenticated': return 'Authenticated, Starting...';
            case 'disconnected': return 'Bot Disconnected / Offline';
            case 'connected_to_server': return 'Waiting for Bot...';
            default: return status;
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Smartphone className="w-8 h-8 text-green-600" />
                WhatsApp Bot Manager
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Connection Status</h2>
                    <div className={`p-4 rounded-lg border flex items-center gap-3 ${getStatusColor()}`}>
                        {status === 'connected' ? <CheckCircle className="w-6 h-6" /> : <RefreshCw className={`w-6 h-6 ${status === 'scanning' ? 'animate-spin' : ''}`} />}
                        <span className="font-medium text-lg">{getStatusText()}</span>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Instructions:</h3>
                        <ol className="list-decimal list-inside space-y-2 text-gray-600 text-sm">
                            <li>Open WhatsApp on your mobile phone.</li>
                            <li>Go to <strong>Settings</strong> {'>'} <strong>Linked Devices</strong>.</li>
                            <li>Tap on <strong>Link a Device</strong>.</li>
                            <li>Point your camera at the QR code.</li>
                        </ol>
                    </div>
                </div>

                {/* QR Code Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[300px]">
                    {status === 'connected' ? (
                        <div className="text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Successfully Connected!</h3>
                            <p className="text-gray-500 mt-2">The bot is now active and responding to messages.</p>
                        </div>
                    ) : status === 'scanning' && qrCode ? (
                        <div className="text-center">
                            <div className="bg-white p-4 border-2 border-gray-200 rounded-xl inline-block">
                                <QRCodeCanvas value={qrCode} size={220} />
                            </div>
                            <p className="mt-4 text-sm text-gray-500">Scan this QR code with WhatsApp</p>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400">
                            <RefreshCw className="w-12 h-12 mx-auto mb-3 animate-spin opacity-50" />
                            <p>Waiting for QR Code...</p>
                            <p className="text-xs mt-1">(Make sure the bot backend is running)</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BotDashboard;
