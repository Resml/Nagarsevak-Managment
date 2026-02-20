import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { Calendar, Clock, MapPin, Plus, Search, Send, Users, Wand2, X, Check, Loader2, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { TranslatedText } from '../../components/TranslatedText';
import { AIService } from '../../services/aiService';
import type { Voter } from '../../types';
import { VoterService } from '../../services/voterService';

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

// ─── Invite Modal ──────────────────────────────────────────────────────────────
interface InviteModalProps {
    event: Event;
    tenantId: string;
    onClose: () => void;
}

const InviteModal = ({ event, tenantId, onClose }: InviteModalProps) => {
    const { t } = useLanguage();
    const [voters, setVoters] = useState<Voter[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());

    // Filter state
    const [nameSearch, setNameSearch] = useState('');
    const [addressSearch, setAddressSearch] = useState('');
    const [showAddressDropdown, setShowAddressDropdown] = useState(false);
    const [ageMin, setAgeMin] = useState('');
    const [ageMax, setAgeMax] = useState('');

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchVoters = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            let query = supabase
                .from('voters')
                .select('*')
                .eq('tenant_id', tenantId)
                .not('mobile', 'is', null)
                .neq('mobile', '');

            if (nameSearch.trim().length >= 2) {
                query = query.or(`name_english.ilike.%${nameSearch.trim()}%,name_marathi.ilike.%${nameSearch.trim()}%`);
            }
            if (addressSearch.trim().length >= 2) {
                query = query.or(`address_english.ilike.%${addressSearch.trim()}%,address_marathi.ilike.%${addressSearch.trim()}%`);
            }
            if (ageMin) {
                query = query.gte('age', parseInt(ageMin));
            }
            if (ageMax) {
                query = query.lte('age', parseInt(ageMax));
            }

            query = query.limit(80);
            const { data, error } = await query;
            if (error) throw error;

            const mapped: Voter[] = (data || []).map((row: any) => ({
                id: row.id.toString(),
                name: row.name_english || row.name_marathi || 'Unknown',
                name_english: row.name_english,
                name_marathi: row.name_marathi,
                age: row.age || 0,
                gender: row.gender || 'O',
                address: row.address_english || row.address_marathi || '',
                address_marathi: row.address_marathi,
                address_english: row.address_english,
                ward: row.ward_no || '',
                booth: row.part_no?.toString() || '',
                epicNo: row.epic_no || '',
                mobile: row.mobile || undefined,
                history: []
            }));
            setVoters(mapped);
        } catch (e) {
            console.error(e);
            toast.error('Failed to load voters');
        } finally {
            setLoading(false);
        }
    }, [tenantId, nameSearch, addressSearch, ageMin, ageMax]);

    // Debounced refetch on filter change
    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => { fetchVoters(); }, 400);
        return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
    }, [fetchVoters]);

    const toggleVoter = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        if (selected.size === voters.length && voters.length > 0) {
            setSelected(new Set());
        } else {
            setSelected(new Set(voters.map(v => v.id)));
        }
    };

    const [sending, setSending] = useState(false);

    const sendInvites = async () => {
        if (selected.size === 0) return;
        const selectedVoters = voters.filter(v => selected.has(v.id));
        const BOT_URL = import.meta.env.VITE_BOT_API_URL || import.meta.env.VITE_BOT_URL || 'https://nagarsevak-managment-1.onrender.com';

        setSending(true);
        try {
            const res = await fetch(`${BOT_URL}/api/send-event-invites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: event.id,
                    tenantId,
                    mobiles: selectedVoters.map(v => ({ mobile: v.mobile, name: v.name_marathi || v.name }))
                })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                // If bot is not connected, fall back to wa.me links
                if (res.status === 503) {
                    toast.error('WhatsApp bot is offline. Opening invites in browser instead...');
                    const dateStr = format(new Date(event.event_date), 'MMM d, yyyy');
                    const msg = encodeURIComponent(`🎉 आपणास *${event.title}* कार्यक्रमासाठी आमंत्रित करण्यात आले आहे!\n\n📅 दिनांक: ${dateStr}\n⏰ वेळ: ${event.event_time}\n📍 ठिकाण: ${event.location}\n\nकृपया उपस्थित राहावे.`);
                    selectedVoters.forEach((v, i) => {
                        setTimeout(() => window.open(`https://wa.me/91${v.mobile}?text=${msg}`, '_blank'), i * 600);
                    });
                } else {
                    toast.error(err.error || 'Failed to send invites');
                }
            } else {
                toast.success(`✅ Invites being sent to ${selectedVoters.length} citizens via WhatsApp bot!`);
            }
        } catch (e) {
            // Network error - bot server may be unreachable, fallback to wa.me
            toast.error('Bot server unreachable. Opening invites in browser...');
            const dateStr = format(new Date(event.event_date), 'MMM d, yyyy');
            const msg = encodeURIComponent(`🎉 आपणास *${event.title}* कार्यक्रमासाठी आमंत्रित करण्यात आले आहे!\n\n📅 दिनांक: ${dateStr}\n⏰ वेळ: ${event.event_time}\n📍 ठिकाण: ${event.location}\n\nकृपया उपस्थित राहावे.`);
            selectedVoters.forEach((v, i) => {
                setTimeout(() => window.open(`https://wa.me/91${v.mobile}?text=${msg}`, '_blank'), i * 600);
            });
        } finally {
            setSending(false);
            onClose();
        }
    };


    const allSelected = voters.length > 0 && selected.size === voters.length;

    // Build unique address suggestion list from the ALL voters currently loaded (before address filter)
    // We keep a separate "all voters" for suggestions — use the same DB query without the address filter
    const [allVotersForSuggestions, setAllVotersForSuggestions] = useState<Voter[]>([]);
    useEffect(() => {
        if (!tenantId) return;
        supabase
            .from('voters')
            .select('address_marathi, address_english')
            .eq('tenant_id', tenantId)
            .not('mobile', 'is', null)
            .neq('mobile', '')
            .limit(500)
            .then(({ data }) => {
                setAllVotersForSuggestions((data || []).map((r: any) => ({
                    id: '', name: r.name_english || '', age: 0, gender: 'O', address: r.address_english || r.address_marathi || '',
                    address_marathi: r.address_marathi, address_english: r.address_english,
                    ward: '', booth: '', epicNo: '', history: []
                })));
            });
    }, [tenantId]);

    const getAddressSuggestions = () => {
        const stats: Record<string, number> = {};
        allVotersForSuggestions.forEach(v => {
            const addr = v.address_marathi || v.address_english || v.address;
            if (addr && addr.trim()) {
                stats[addr.trim()] = (stats[addr.trim()] || 0) + 1;
            }
        });
        return Object.entries(stats)
            .filter(([addr]) => !addressSearch || addr.toLowerCase().includes(addressSearch.toLowerCase()))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12);
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100">
                {/* Header */}
                <div className="flex justify-between items-start p-5 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Send className="w-5 h-5 text-green-600" />
                            {t('events.invite_modal.title')}
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {t('events.invite_modal.subtitle')}: <span className="font-semibold text-slate-700"><TranslatedText text={event.title} /></span>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white/70 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50">
                    {/* Name search */}
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t('events.invite_modal.search_name')}
                            value={nameSearch}
                            onChange={e => setNameSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Address search with dropdown */}
                        <div className="relative">
                            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder={t('events.invite_modal.search_address')}
                                value={addressSearch}
                                onFocus={() => setShowAddressDropdown(true)}
                                onBlur={() => setTimeout(() => setShowAddressDropdown(false), 180)}
                                onChange={e => { setAddressSearch(e.target.value); setShowAddressDropdown(true); }}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white"
                            />
                            {showAddressDropdown && getAddressSuggestions().length > 0 && (
                                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                                    {/* Clear option */}
                                    {addressSearch && (
                                        <div
                                            className="px-4 py-2 text-xs text-red-500 hover:bg-red-50 cursor-pointer border-b border-slate-100"
                                            onMouseDown={() => { setAddressSearch(''); setShowAddressDropdown(false); }}
                                        >
                                            ✕ Clear filter
                                        </div>
                                    )}
                                    {getAddressSuggestions().map(([addr, count]) => (
                                        <div
                                            key={addr}
                                            onMouseDown={() => { setAddressSearch(addr); setShowAddressDropdown(false); }}
                                            className="flex items-center justify-between px-4 py-2.5 hover:bg-green-50 cursor-pointer border-b border-slate-50 last:border-0"
                                        >
                                            <span className="text-sm text-slate-700 truncate max-w-[80%]">{addr}</span>
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold shrink-0 ml-2">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Age range */}
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder={t('events.invite_modal.age_from')}
                                value={ageMin}
                                min={1} max={120}
                                onChange={e => setAgeMin(e.target.value)}
                                className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white text-center"
                            />
                            <span className="text-slate-400 text-xs font-medium shrink-0">–</span>
                            <input
                                type="number"
                                placeholder={t('events.invite_modal.age_to')}
                                value={ageMax}
                                min={1} max={120}
                                onChange={e => setAgeMax(e.target.value)}
                                className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white text-center"
                            />
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 bg-white">
                    {loading ? (
                        <div className="flex items-center justify-center h-40 text-slate-500 gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" /> {t('events.invite_modal.loading')}
                        </div>
                    ) : voters.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                            <Users className="w-10 h-10 text-slate-200" />
                            <p className="text-sm">{t('events.invite_modal.no_citizens')}</p>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {/* Select all row */}
                            <div
                                onClick={selectAll}
                                className="flex items-center px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group border-b border-slate-100 mb-1"
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${allSelected ? 'bg-green-600 border-green-600' : 'border-slate-300 bg-white group-hover:border-green-400'}`}>
                                    {allSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm font-semibold text-slate-700">{t('events.invite_modal.select_all')} ({voters.length})</span>
                            </div>

                            {voters.map(v => (
                                <div
                                    key={v.id}
                                    onClick={() => toggleVoter(v.id)}
                                    className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group border border-transparent hover:border-slate-100"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-5 h-5 rounded border flex items-center shrink-0 justify-center transition-colors ${selected.has(v.id) ? 'bg-green-600 border-green-600' : 'border-slate-300 bg-white group-hover:border-green-400'}`}>
                                            {selected.has(v.id) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{v.name_marathi || v.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{v.address_marathi || v.address}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 ml-2 text-right">
                                        {v.age > 0 && (
                                            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">{v.age} {t('events.invite_modal.years')}</span>
                                        )}
                                        <span className="text-xs text-slate-500">+91 {v.mobile}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.04)]">
                    <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                        {selected.size} {t('events.invite_modal.selected')}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={sendInvites}
                            disabled={selected.size === 0 || sending}
                            className="bg-[#25D366] hover:bg-[#1ebd5c] disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-bold transition-colors shadow-sm inline-flex items-center gap-2 text-sm"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {sending ? 'Sending...' : t('events.invite_modal.send_btn')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const EventManagement = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user } = useAuth();
    const { tenantId } = useTenant();
    const isAdmin = user?.role === 'admin';

    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    // Invite modal state
    const [inviteEvent, setInviteEvent] = useState<Event | null>(null);

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [areaSearch, setAreaSearch] = useState('');
    const [showAreaDropdown, setShowAreaDropdown] = useState(false);
    const [dateSearch, setDateSearch] = useState('');
    const [showDateDropdown, setShowDateDropdown] = useState(false);

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);

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

        const subscription = supabase
            .channel('public:events')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `tenant_id=eq.${tenantId}` }, () => {
                fetchEvents();
            })
            .subscribe();

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
        setTimeout(async () => {
            try {
                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    .eq('tenant_id', tenantId)
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

    const getAreaSuggestions = () => {
        const stats: Record<string, number> = {};
        events.forEach(e => {
            if (e.area) stats[e.area] = (stats[e.area] || 0) + 1;
        });
        return Object.entries(stats).map(([area, count]) => ({ area, count }));
    };

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

    const handleAutoGenerate = async () => {
        if (!newEvent.title) return;
        setGeneratingAI(true);
        try {
            const desc = await AIService.generateContent(newEvent.title, 'Social Media Caption', 'Enthusiastic', 'Marathi');
            setNewEvent(prev => ({ ...prev, description: desc }));
        } catch (error) {
            console.error(error);
            toast.error(t('work_history.desc_gen_failed') || 'Failed to generate content');
        } finally {
            setGeneratingAI(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const { error: mutationError } = await supabase.from('events').insert([{
                ...newEvent,
                status: 'Planned',
                created_at: new Date().toISOString(),
                tenant_id: tenantId
            }]);
            if (mutationError) throw mutationError;
            toast.success('Event created successfully');
            setIsCreateModalOpen(false);
            setNewEvent({ title: '', description: '', event_date: '', event_time: '', location: '', type: 'Public Meeting', area: '', target_audience: 'All' });
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
                        <button onClick={() => setIsCreateModalOpen(true)} className="ns-btn-primary">
                            <Plus className="w-4 h-4" /> {t('events.create_btn')}
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input type="text" placeholder={t('events.search_placeholder')} className="ns-input pl-10 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    <div className="md:col-span-3 relative dropdown-container">
                        <input type="text" placeholder={t('events.filter_area')} className="ns-input w-full" value={areaSearch} onFocus={() => { setShowAreaDropdown(true); setShowDateDropdown(false); }} onChange={(e) => setAreaSearch(e.target.value)} />
                        {showAreaDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {getAreaSuggestions().filter(s => s.area.toLowerCase().includes(areaSearch.toLowerCase())).map((item) => (
                                    <div key={item.area} className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center" onClick={() => { setAreaSearch(item.area); setShowAreaDropdown(false); }}>
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

                    <div className="md:col-span-3 relative dropdown-container">
                        <input type="text" placeholder={t('events.filter_date')} className="ns-input w-full" value={dateSearch} onFocus={() => { setShowDateDropdown(true); setShowAreaDropdown(false); }} onChange={(e) => setDateSearch(e.target.value)} />
                        {showDateDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {getDateSuggestions().filter(d => d.date.toLowerCase().includes(dateSearch.toLowerCase())).map((item) => (
                                    <div key={item.date} className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center" onClick={() => { setDateSearch(item.date); setShowDateDropdown(false); }}>
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
                            onClick={() => navigate(`/dashboard/events/${event.id}`)}
                            className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                        >
                            <div className="flex items-start gap-4">
                                <div className="bg-purple-100 text-purple-700 p-4 rounded-xl text-center min-w-[80px]">
                                    <div className="text-xs font-bold uppercase">{format(new Date(event.event_date), 'MMM')}</div>
                                    <div className="text-2xl font-bold">{format(new Date(event.event_date), 'd')}</div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-slate-900"><TranslatedText text={event.title} /></h3>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {event.event_time}</span>
                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> <TranslatedText text={event.location} /></span>
                                        {event.area && (
                                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium"><TranslatedText text={event.area} /></span>
                                        )}
                                        {event.target_audience && event.target_audience !== 'All' && (
                                            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-semibold">For: {event.target_audience}</span>
                                        )}
                                        {event.type && (
                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-medium">{event.type}</span>
                                        )}
                                    </div>
                                    <p className="text-slate-600 text-sm mt-2 max-w-xl line-clamp-2"><TranslatedText text={event.description} /></p>
                                </div>
                            </div>

                            <div className="w-full md:w-auto flex md:flex-col gap-2">
                                {/* ✅ Open invite modal instead of navigating */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setInviteEvent(event);
                                    }}
                                    className="flex-1 md:w-40 bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition shadow-sm font-medium text-sm"
                                >
                                    <Send className="w-4 h-4" />
                                    {t('events.send_invites')}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/events/${event.id}`); }}
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

            {/* Invite Modal */}
            {inviteEvent && tenantId && (
                <InviteModal
                    event={inviteEvent}
                    tenantId={tenantId}
                    onClose={() => setInviteEvent(null)}
                />
            )}

            {/* Create Event Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="ns-card max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-900">{t('events.create_modal_title')}</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.event_title')}</label>
                                <input type="text" required className="ns-input w-full" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} placeholder={t('events.title_placeholder')} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.description')}</label>
                                <div className="relative">
                                    <textarea required className="ns-input w-full pr-10" rows={3} value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} placeholder={t('events.desc_placeholder')} />
                                    <button type="button" onClick={handleAutoGenerate} disabled={generatingAI || !newEvent.title} className="absolute right-2 bottom-2 text-brand-700 hover:text-brand-800 disabled:opacity-50" title="Auto generate content">
                                        <Wand2 className={`w-5 h-5 ${generatingAI ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{t('work_history.auto_draft_hint') || 'Click wand to AI generate description'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.date')}</label>
                                    <input type="date" required className="ns-input w-full" value={newEvent.event_date} onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.time')}</label>
                                    <input type="time" required className="ns-input w-full" value={newEvent.event_time} onChange={e => setNewEvent({ ...newEvent, event_time: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.location')}</label>
                                <input type="text" required className="ns-input w-full" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} placeholder={t('events.loc_placeholder')} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.area')}</label>
                                <input type="text" className="ns-input w-full" value={newEvent.area} onChange={e => setNewEvent({ ...newEvent, area: e.target.value })} placeholder={t('events.area_placeholder')} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.type_label')}</label>
                                    <select className="ns-input w-full" value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}>
                                        <option value="Public Meeting">{t('events.types.Public Meeting')}</option>
                                        <option value="Rally">{t('events.types.Rally')}</option>
                                        <option value="Door-to-Door">{t('events.types.Door-to-Door')}</option>
                                        <option value="Inauguration">{t('events.types.Inauguration')}</option>
                                        <option value="Other">{t('events.types.Other')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.audience_label')}</label>
                                    <select className="ns-input w-full" value={newEvent.target_audience} onChange={e => setNewEvent({ ...newEvent, target_audience: e.target.value })}>
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
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium">
                                    {t('events.cancel')}
                                </button>
                                <button type="submit" disabled={creating} className="ns-btn-primary">
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
