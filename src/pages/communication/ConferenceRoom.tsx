import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Users, Calendar, Video, Phone, History, Plus } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { toast } from 'sonner';

interface Room {
    id: string;
    title: string;
    created_at: string;
    status: 'active' | 'scheduled' | 'ended';
    participants: number;
}

const ConferenceRoom = () => {
    const { t } = useLanguage();
    const { tenantId } = useTenant();
    const [activeTab, setActiveTab] = useState<'rooms' | 'history'>('rooms');
    const [loading, setLoading] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]);

    useEffect(() => {
        // Mocking some rooms for now as it's a new feature
        setRooms([
            { id: '1', title: 'Ward 12 Citizens Meet', created_at: new Date().toISOString(), status: 'active', participants: 5 },
            { id: '2', title: 'Infrastructure Planning', created_at: new Date(Date.now() - 3600000).toISOString(), status: 'scheduled', participants: 0 }
        ]);
    }, []);

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex justify-between items-start flex-none">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-7 h-7 text-brand-600" />
                        {t('nav.conference_room')}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">{t('communication_page.conf_subtitle')}</p>
                </div>
                <button className="ns-btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" /> {t('communication_page.create_new_room')}
                </button>
            </div>

            <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 flex-none w-fit">
                <button onClick={() => setActiveTab('rooms')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'rooms' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>{t('communication_page.active_rooms')}</button>
                <button onClick={() => setActiveTab('history')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>{t('communication_page.past_meetings')}</button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rooms.map(room => (
                        <div key={room.id} className="ns-card p-6 flex flex-col justify-between hover:border-brand-200 transition-all border-l-4 border-l-brand-500">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${room.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {room.status}
                                    </span>
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {new Date(room.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg mb-2">{room.title}</h3>
                                <p className="text-sm text-slate-500 flex items-center gap-2 mb-4">
                                    <Users className="w-4 h-4" /> {room.participants} {t('voters.voters_count')}
                                </p>
                            </div>
                            <button className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2">
                                <Video className="w-4 h-4" /> {t('communication_page.join_room')}
                            </button>
                        </div>
                    ))}
                </div>

                {rooms.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-slate-900 font-bold">{t('communication_page.no_rooms_active')}</h3>
                        <p className="text-slate-500 text-sm">{t('communication_page.create_room_hint')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConferenceRoom;
