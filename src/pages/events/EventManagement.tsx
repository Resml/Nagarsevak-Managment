import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { Calendar, Clock, MapPin, Plus, Search, Filter, Send, Users, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';

interface Event {
    id: string;
    title: string;
    description: string;
    event_date: string;
    event_time: string;
    location: string;
    type: string;
    status: string;
    created_at: string;
    area?: string;
    target_audience?: string;
}

const EventManagement = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user } = useAuth();
    const { tenantId } = useTenant(); // Added tenantId
    const isAdmin = user?.role === 'admin';

    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [areaSearch, setAreaSearch] = useState('');
    const [showAreaDropdown, setShowAreaDropdown] = useState(false);
    const [dateSearch, setDateSearch] = useState('');
    const [showDateDropdown, setShowDateDropdown] = useState(false);

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        event_date: '',
        event_time: '',
        location: '',
        type: 'Public Meeting',
        area: '',
        target_audience: 'All'
    });

    useEffect(() => {
        fetchEvents();

        // Subscribe to changes
        const subscription = supabase
            .channel('public:events')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `tenant_id=eq.${tenantId}` }, () => {
                fetchEvents();
            })
            .subscribe();

        // Close dropdowns
        const handleClickOutside = (event: MouseEvent) => {
            if (!(event.target as Element).closest('.dropdown-container')) {
                setShowAreaDropdown(false);
                setShowDateDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            supabase.removeChannel(subscription);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [tenantId]);

    const fetchEvents = async () => {
        setLoading(true);
        // Simulate network delay
        setTimeout(async () => {
            try {
                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    .eq('tenant_id', tenantId) // Secured
                    .order('event_date', { ascending: false });

                if (error) throw error;
                setEvents(data || []);
            } catch (err) {
                console.error('Error fetching events:', err);
                toast.error('Failed to load events');
            } finally {
                setLoading(false);
            }
        }, 800);
    };

    // Helper to get unique areas
    const getAreaSuggestions = () => {
        const stats: Record<string, number> = {};
        events.forEach(e => {
            if (e.area) {
                stats[e.area] = (stats[e.area] || 0) + 1;
            }
        });
        return Object.entries(stats).map(([area, count]) => ({ area, count }));
    };

    // Helper to get unique dates
    const getDateSuggestions = () => {
        const stats: Record<string, number> = {};
        events.forEach(e => {
            if (e.event_date) {
                const dateStr = format(new Date(e.event_date), 'MMM d, yyyy');
                stats[dateStr] = (stats[dateStr] || 0) + 1;
            }
        });
        return Object.entries(stats).map(([date, count]) => ({ date, count }));
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            const { error: mutationError } = await supabase.from('events').insert([{
                ...newEvent,
                status: 'Planned',
                created_at: new Date().toISOString(),
                tenant_id: tenantId // Secured
            }]);

            if (mutationError) throw mutationError;

            toast.success('Event created successfully');
            setIsCreateModalOpen(false);
            setNewEvent({
                title: '',
                description: '',
                event_date: '',
                event_time: '',
                location: '',
                type: 'Public Meeting',
                area: '',
                target_audience: 'All'
            });
            fetchEvents();
        } catch (err) {
            console.error('Error creating event:', err);
            toast.error('Failed to create event');
        } finally {
            setCreating(false);
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.location.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesArea = !areaSearch || (event.area && event.area.toLowerCase().includes(areaSearch.toLowerCase()));

        const matchesDate = !dateSearch || (event.event_date && format(new Date(event.event_date), 'MMM d, yyyy').toLowerCase().includes(dateSearch.toLowerCase()));

        return matchesSearch && matchesArea && matchesDate;
    });

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            {t('events.title')}
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                                {t('events.found')}: {filteredEvents.length}
                            </span>
                        </h1>
                        <p className="text-sm text-slate-500">{t('events.subtitle')}</p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="ns-btn-primary"
                        >
                            <Plus className="w-4 h-4" /> {t('events.create_btn')}
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Main Search */}
                    <div className="md:col-span-6 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t('events.search_placeholder')}
                            className="ns-input pl-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Area Search */}
                    <div className="md:col-span-3 relative dropdown-container">
                        <input
                            type="text"
                            placeholder={t('events.filter_area')}
                            className="ns-input w-full"
                            value={areaSearch}
                            onFocus={() => { setShowAreaDropdown(true); setShowDateDropdown(false); }}
                            onChange={(e) => setAreaSearch(e.target.value)}
                        />
                        {showAreaDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {getAreaSuggestions().filter(s => s.area.toLowerCase().includes(areaSearch.toLowerCase())).map((item) => (
                                    <div
                                        key={item.area}
                                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                                        onClick={() => {
                                            setAreaSearch(item.area);
                                            setShowAreaDropdown(false);
                                        }}
                                    >
                                        <span className="text-sm text-slate-700">{item.area}</span>
                                        <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{item.count}</span>
                                    </div>
                                ))}
                                {getAreaSuggestions().filter(s => s.area.toLowerCase().includes(areaSearch.toLowerCase())).length === 0 && (
                                    <div className="px-4 py-2 text-sm text-slate-500 italic">No areas found</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Date Search */}
                    <div className="md:col-span-3 relative dropdown-container">
                        <input
                            type="text"
                            placeholder={t('events.filter_date')}
                            className="ns-input w-full"
                            value={dateSearch}
                            onFocus={() => { setShowDateDropdown(true); setShowAreaDropdown(false); }}
                            onChange={(e) => setDateSearch(e.target.value)}
                        />
                        {showDateDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {getDateSuggestions().filter(d => d.date.toLowerCase().includes(dateSearch.toLowerCase())).map((item) => (
                                    <div
                                        key={item.date}
                                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                                        onClick={() => {
                                            setDateSearch(item.date);
                                            setShowDateDropdown(false);
                                        }}
                                    >
                                        <span className="text-sm text-slate-700">{item.date}</span>
                                        <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{item.count}</span>
                                    </div>
                                ))}
                                {getDateSuggestions().filter(d => d.date.toLowerCase().includes(dateSearch.toLowerCase())).length === 0 && (
                                    <div className="px-4 py-2 text-sm text-slate-500 italic">No dates found</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="bg-slate-100 rounded-xl w-[80px] h-[80px] animate-pulse" />
                                <div className="space-y-3 flex-1">
                                    <div className="h-6 w-1/3 bg-slate-200 rounded animate-pulse" />
                                    <div className="flex gap-4">
                                        <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
                                        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                                        <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
                                    </div>
                                    <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
                                </div>
                            </div>
                            <div className="w-full md:w-auto flex md:flex-col gap-2">
                                <div className="h-9 w-full md:w-40 bg-slate-200 rounded-lg animate-pulse" />
                                <div className="h-9 w-full md:w-40 bg-slate-200 rounded-lg animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredEvents.map((event) => (
                        <div
                            key={event.id}
                            onClick={() => navigate(`/events/${event.id}`)}
                            className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                        >
                            <div className="flex items-start gap-4">
                                <div className="bg-purple-100 text-purple-700 p-4 rounded-xl text-center min-w-[80px]">
                                    <div className="text-xs font-bold uppercase">{format(new Date(event.event_date), 'MMM')}</div>
                                    <div className="text-2xl font-bold">{format(new Date(event.event_date), 'd')}</div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-slate-900">{event.title}</h3>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {event.event_time}</span>
                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {event.location}</span>
                                        {event.area && (
                                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                                                {event.area}
                                            </span>
                                        )}
                                        {event.target_audience && event.target_audience !== 'All' && (
                                            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-semibold">
                                                For: {event.target_audience}
                                            </span>
                                        )}
                                        {event.type && (
                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-medium">
                                                {event.type}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-600 text-sm mt-2 max-w-xl line-clamp-2">{event.description}</p>
                                </div>
                            </div>

                            <div className="w-full md:w-auto flex md:flex-col gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/events/${event.id}`);
                                    }}
                                    className="flex-1 md:w-40 bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition shadow-sm font-medium text-sm"
                                >
                                    <Send className="w-4 h-4" />
                                    {t('events.send_invites')}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/events/${event.id}`);
                                    }}
                                    className="flex-1 md:w-40 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 font-medium text-sm"
                                >
                                    <Users className="w-4 h-4" /> {t('events.view_rsvps')}
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredEvents.length === 0 && (
                        <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            {t('events.no_events')}
                        </div>
                    )}
                </div>
            )}


            {/* Create Event Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="ns-card max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-900">{t('events.create_modal_title')}</h2>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.event_title')}</label>
                                <input
                                    type="text" required
                                    className="ns-input w-full"
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                    placeholder={t('events.title_placeholder')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.description')}</label>
                                <textarea
                                    required
                                    className="ns-input w-full"
                                    rows={3}
                                    value={newEvent.description}
                                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                    placeholder={t('events.desc_placeholder')}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.date')}</label>
                                    <input
                                        type="date" required
                                        className="ns-input w-full"
                                        value={newEvent.event_date}
                                        onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.time')}</label>
                                    <input
                                        type="time" required
                                        className="ns-input w-full"
                                        value={newEvent.event_time}
                                        onChange={e => setNewEvent({ ...newEvent, event_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.location')}</label>
                                <input
                                    type="text" required
                                    className="ns-input w-full"
                                    value={newEvent.location}
                                    onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                                    placeholder={t('events.loc_placeholder')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.area')}</label>
                                <input
                                    type="text"
                                    className="ns-input w-full"
                                    value={newEvent.area}
                                    onChange={e => setNewEvent({ ...newEvent, area: e.target.value })}
                                    placeholder={t('events.area_placeholder')}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.type_label')}</label>
                                    <select
                                        className="ns-input w-full"
                                        value={newEvent.type}
                                        onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                                    >
                                        <option value="Public Meeting">{t('events.types.Public Meeting')}</option>
                                        <option value="Rally">{t('events.types.Rally')}</option>
                                        <option value="Door-to-Door">{t('events.types.Door-to-Door')}</option>
                                        <option value="Inauguration">{t('events.types.Inauguration')}</option>
                                        <option value="Other">{t('events.types.Other')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.audience_label')}</label>
                                    <select
                                        className="ns-input w-full"
                                        value={newEvent.target_audience}
                                        onChange={e => setNewEvent({ ...newEvent, target_audience: e.target.value })}
                                    >
                                        <option value="All">{t('events.audiences.All')}</option>
                                        <option value="OPEN">{t('events.audiences.OPEN')}</option>
                                        <option value="OBC">{t('events.audiences.OBC')}</option>
                                        <option value="SC">{t('events.audiences.SC')}</option>
                                        <option value="ST">{t('events.audiences.ST')}</option>
                                        <option value="VJNT">{t('events.audiences.VJNT')}</option>
                                        <option value="SBC">{t('events.audiences.SBC')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium"
                                >
                                    {t('events.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="ns-btn-primary"
                                >
                                    {creating ? t('events.creating') : t('events.create_btn')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventManagement;
