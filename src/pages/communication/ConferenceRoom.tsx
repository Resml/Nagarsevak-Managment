import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Video, Plus, X, Copy, Check, Send, Users, Calendar, Clock,
    Loader2, Search, MapPin, LayoutGrid, FileText, Printer, Link2, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import type { Voter } from '../../types';

// ─── Types ──────────────────────────────────────────────────────────────────
interface ConferenceMeeting {
    id: string;
    title: string;
    meet_link: string;
    scheduled_at: string;
    created_at: string;
    status: 'scheduled' | 'active' | 'ended';
    invited_count: number;
    notes?: string;
}

// ─── Helper: generate unique Jitsi-style Meet link ──────────────────────────
const generateMeetLink = (title: string): string => {
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .substring(0, 30);
    const rand = Math.random().toString(36).substring(2, 8);
    return `https://meet.jit.si/nagarsevak-${slug}-${rand}`;
};

// ─── Voter Invite Modal ──────────────────────────────────────────────────────
interface InviteVoterModalProps {
    meeting: ConferenceMeeting;
    tenantId: string;
    onClose: () => void;
    onSent: (count: number) => void;
}

const InviteVoterModal = ({ meeting, tenantId, onClose, onSent }: InviteVoterModalProps) => {
    const { t } = useLanguage();
    const [voters, setVoters] = useState<Voter[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [nameSearch, setNameSearch] = useState('');
    const [addressSearch, setAddressSearch] = useState('');
    const [showAddrDropdown, setShowAddrDropdown] = useState(false);
    const [ageMin, setAgeMin] = useState('');
    const [ageMax, setAgeMax] = useState('');
    const [allAddrs, setAllAddrs] = useState<string[]>([]);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchVoters = useCallback(async () => {
        setLoading(true);
        try {
            let q = supabase.from('voters').select('*').eq('tenant_id', tenantId).not('mobile', 'is', null).neq('mobile', '');
            if (nameSearch.trim().length >= 2) q = q.or(`name_english.ilike.%${nameSearch.trim()}%,name_marathi.ilike.%${nameSearch.trim()}%`);
            if (addressSearch.trim().length >= 2) q = q.or(`address_english.ilike.%${addressSearch.trim()}%,address_marathi.ilike.%${addressSearch.trim()}%`);
            if (ageMin) q = q.gte('age', parseInt(ageMin));
            if (ageMax) q = q.lte('age', parseInt(ageMax));
            q = q.limit(80);
            const { data, error } = await q;
            if (error) throw error;
            setVoters((data || []).map((r: any) => ({
                id: r.id.toString(), name: r.name_english || r.name_marathi || 'Unknown',
                name_english: r.name_english, name_marathi: r.name_marathi,
                age: r.age || 0, gender: r.gender || 'O',
                address: r.address_english || r.address_marathi || '',
                address_marathi: r.address_marathi, address_english: r.address_english,
                ward: r.ward_no || '', booth: r.part_no?.toString() || '',
                epicNo: r.epic_no || '', mobile: r.mobile || undefined, history: []
            })));
        } catch (e) { toast.error('Failed to load voters'); }
        finally { setLoading(false); }
    }, [tenantId, nameSearch, addressSearch, ageMin, ageMax]);

    useEffect(() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(fetchVoters, 400);
        return () => { if (timer.current) clearTimeout(timer.current); };
    }, [fetchVoters]);

    // Load unique addresses for suggestions
    useEffect(() => {
        supabase.from('voters').select('address_marathi,address_english').eq('tenant_id', tenantId)
            .not('mobile', 'is', null).neq('mobile', '').limit(500)
            .then(({ data }) => {
                const addrs = [...new Set((data || []).map((r: any) => r.address_marathi || r.address_english || '').filter(Boolean))];
                setAllAddrs(addrs);
            });
    }, [tenantId]);

    const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const selectAll = () => setSelected(selected.size === voters.length && voters.length > 0 ? new Set() : new Set(voters.map(v => v.id)));
    const allSelected = voters.length > 0 && selected.size === voters.length;

    const addrSuggestions = allAddrs.filter(a => !addressSearch || a.toLowerCase().includes(addressSearch.toLowerCase())).slice(0, 12);

    const sendInvites = async () => {
        if (selected.size === 0) { toast.error(t('communication_page.error_select_voter')); return; }
        const targets = voters.filter(v => selected.has(v.id));
        const BOT_URL = import.meta.env.VITE_BOT_API_URL || import.meta.env.VITE_BOT_URL || 'https://nagarsevak-managment-1.onrender.com';
        const dateStr = format(new Date(meeting.scheduled_at), 'dd MMM yyyy');
        const timeStr = format(new Date(meeting.scheduled_at), 'hh:mm a');
        const waMsg = encodeURIComponent(
            `🎥 आपणास व्हिडिओ मीटिंगसाठी आमंत्रित केले आहे: *${meeting.title}*\n📅 तारीख: ${dateStr}\n⏰ वेळ: ${timeStr}\n🔗 इथे सामील व्हा: ${meeting.meet_link}\n\nकृपया वेळेवर सामील व्हा.`
        );
        setSending(true);
        let sentCount = 0;
        try {
            const res = await fetch(`${BOT_URL}/api/send-event-invites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId: meeting.id, tenantId, mobiles: targets.map(v => ({ mobile: v.mobile, name: v.name_marathi || v.name })) })
            });
            if (res.ok) {
                sentCount = targets.length;
                toast.success(`✅ मीटिंग लिंक ${sentCount} मतदारांना WhatsApp वर पाठवली!`);
            } else {
                throw new Error('Bot unavailable');
            }
        } catch {
            // Fallback: open wa.me links
            toast.info('Bot offline — WhatsApp links opening in browser...');
            targets.forEach((v, i) => { setTimeout(() => window.open(`https://wa.me/91${v.mobile}?text=${waMsg}`, '_blank'), i * 600); });
            sentCount = targets.length;
        } finally {
            // Update invited_count in DB
            if (sentCount > 0) {
                await supabase.from('conference_rooms').update({ invited_count: (meeting.invited_count || 0) + sentCount }).eq('id', meeting.id);
            }
            setSending(false);
            onSent(sentCount);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-start p-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Send className="w-5 h-5 text-blue-600" /> {t('communication_page.conf_send_invites')}
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {meeting.title} — <span className="font-mono text-xs text-blue-600 truncate">{meeting.meet_link}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white/70 transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {/* Filters */}
                <div className="p-4 border-b bg-slate-50 space-y-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder={t('events.invite_modal.search_name')} value={nameSearch} onChange={e => setNameSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder={t('events.invite_modal.search_address')} value={addressSearch}
                                onFocus={() => setShowAddrDropdown(true)} onBlur={() => setTimeout(() => setShowAddrDropdown(false), 180)}
                                onChange={e => { setAddressSearch(e.target.value); setShowAddrDropdown(true); }}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                            {showAddrDropdown && addrSuggestions.length > 0 && (
                                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-44 overflow-y-auto">
                                    {addrSuggestions.map(addr => (
                                        <div key={addr} onMouseDown={() => { setAddressSearch(addr); setShowAddrDropdown(false); }}
                                            className="px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 cursor-pointer truncate">{addr}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="number" placeholder={t('events.invite_modal.age_from')} value={ageMin} min={1} max={120} onChange={e => setAgeMin(e.target.value)} className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-center" />
                            <span className="text-slate-400 shrink-0">–</span>
                            <input type="number" placeholder={t('events.invite_modal.age_to')} value={ageMax} min={1} max={120} onChange={e => setAgeMax(e.target.value)} className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-center" />
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex items-center justify-center h-32 gap-2 text-slate-500"><Loader2 className="w-5 h-5 animate-spin" /> {t('events.invite_modal.loading')}</div>
                    ) : voters.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2"><Users className="w-10 h-10 text-slate-200" /><p className="text-sm">{t('events.invite_modal.no_citizens')}</p></div>
                    ) : (
                        <div className="space-y-0.5">
                            <div onClick={selectAll} className="flex items-center px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer border-b border-slate-100 mb-1">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${allSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                    {allSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm font-semibold text-slate-700">{t('events.invite_modal.select_all')} ({voters.length})</span>
                            </div>
                            {voters.map(v => (
                                <div key={v.id} onClick={() => toggle(v.id)} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer border border-transparent hover:border-slate-100">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-5 h-5 rounded border flex items-center shrink-0 justify-center transition-colors ${selected.has(v.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                            {selected.has(v.id) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{v.name_marathi || v.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{v.address_marathi || v.address}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-500 shrink-0 ml-2">+91&nbsp;{v.mobile}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-white flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                        {selected.size} {t('events.invite_modal.selected')}
                    </span>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">{t('common.cancel')}</button>
                        <button onClick={sendInvites} disabled={selected.size === 0 || sending}
                            className="bg-[#25D366] hover:bg-[#1ebd5c] disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-bold transition-colors inline-flex items-center gap-2 text-sm">
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {sending ? t('communication_page.conf_creating') : t('communication_page.conf_send_invites')}
                        </button>
                    </div>
                </div>
            </div>
            <ConferenceTutorial />
        </div>
    );
};

// ─── Create Meeting Modal ────────────────────────────────────────────────────
interface CreateMeetingModalProps {
    onClose: () => void;
    onCreated: (meeting: ConferenceMeeting) => void;
    tenantId: string;
}

const CreateMeetingModal = ({ onClose, onCreated, tenantId }: CreateMeetingModalProps) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');
    const [creating, setCreating] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [step, setStep] = useState<'form' | 'link'>('form');

    const handleGenerate = () => {
        if (!title || !date || !time) { toast.error('Please fill in title, date and time.'); return; }
        setGeneratedLink(generateMeetLink(title));
        setStep('link');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success(t('communication_page.conf_link_copied'));
    };

    const handleSave = async () => {
        setCreating(true);
        try {
            const scheduledAt = new Date(`${date}T${time}`).toISOString();
            const row = { tenant_id: tenantId, title, meet_link: generatedLink, scheduled_at: scheduledAt, notes, status: 'scheduled', invited_count: 0, created_by: user?.id };
            const { data, error } = await supabase.from('conference_rooms').insert(row).select().single();
            if (error) throw error;
            onCreated({
                id: data.id, title: data.title, meet_link: data.meet_link,
                scheduled_at: data.scheduled_at, created_at: data.created_at,
                status: data.status, invited_count: data.invited_count, notes: data.notes
            });
            toast.success('Meeting created!');
            onClose();
        } catch (e: any) {
            // Fallback: local-only meeting if table doesn't exist yet
            const localMeeting: ConferenceMeeting = {
                id: `local_${Date.now()}`, title, meet_link: generatedLink,
                scheduled_at: new Date(`${date}T${time}`).toISOString(),
                created_at: new Date().toISOString(), status: 'scheduled', invited_count: 0, notes
            };
            onCreated(localMeeting);
            toast.success('Meeting created (local)! Run the SQL from the plan to persist to database.');
            onClose();
        } finally { setCreating(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b bg-gradient-to-r from-indigo-50 to-blue-50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Video className="w-5 h-5 text-brand-600" /> {t('communication_page.conf_create_btn')}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-5 space-y-4">
                    {step === 'form' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('communication_page.conf_meeting_title')} *</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('communication_page.conf_title_placeholder')} className="ns-input w-full" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('communication_page.conf_schedule_date')} *</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="ns-input w-full" min={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('communication_page.conf_schedule_time')} *</label>
                                    <input type="time" value={time} onChange={e => setTime(e.target.value)} className="ns-input w-full" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('communication_page.conf_notes')}</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder={t('communication_page.conf_notes_placeholder')} className="ns-input w-full resize-none" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">{t('common.cancel')}</button>
                                <button onClick={handleGenerate} disabled={!title || !date || !time} className="ns-btn-primary disabled:opacity-50">
                                    <Link2 className="w-4 h-4" /> Generate Link
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Link step */}
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">✅ {t('communication_page.conf_link_generated')}</p>
                                <div className="flex items-center gap-2">
                                    <code className="text-sm text-slate-700 flex-1 break-all font-mono">{generatedLink}</code>
                                    <button onClick={handleCopy} className="shrink-0 p-2 rounded-lg bg-white border border-green-300 hover:bg-green-50 transition-colors">
                                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                                    </button>
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4 space-y-1 text-sm text-slate-600">
                                <p className="font-semibold text-slate-800">{title}</p>
                                <p className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {format(new Date(`${date}T${time}`), 'dd MMM yyyy, hh:mm a')}</p>
                                {notes && <p className="text-xs text-slate-500 italic">{notes}</p>}
                            </div>
                            <div className="flex justify-between gap-3 pt-2">
                                <button onClick={() => setStep('form')} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">← Back</button>
                                <button onClick={handleSave} disabled={creating} className="ns-btn-primary disabled:opacity-50">
                                    {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('communication_page.conf_creating')}</> : <><Check className="w-4 h-4" /> Save Meeting</>}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Main Conference Room Page ───────────────────────────────────────────────
const ConferenceRoom = () => {
    const { t } = useLanguage();
    const { tenantId } = useTenant();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [meetings, setMeetings] = useState<ConferenceMeeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'report'>('grid');
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [inviteMeeting, setInviteMeeting] = useState<ConferenceMeeting | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchMeetings = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('conference_rooms')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('scheduled_at', { ascending: false });
            if (error) throw error;
            setMeetings((data || []).map((r: any) => ({
                id: r.id, title: r.title, meet_link: r.meet_link,
                scheduled_at: r.scheduled_at, created_at: r.created_at,
                status: r.status, invited_count: r.invited_count || 0, notes: r.notes
            })));
        } catch {
            // DB table may not exist yet; use empty list
            setMeetings([]);
        } finally { setLoading(false); }
    }, [tenantId]);

    useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

    const handleCreated = (meeting: ConferenceMeeting) => {
        setMeetings(prev => [meeting, ...prev]);
        setInviteMeeting(meeting); // immediately open invite modal
    };

    const copyLink = (meeting: ConferenceMeeting) => {
        navigator.clipboard.writeText(meeting.meet_link);
        setCopiedId(meeting.id);
        toast.success(t('communication_page.conf_link_copied'));
        setTimeout(() => setCopiedId(null), 2000);
    };

    const now = new Date();
    const upcomingMeetings = meetings.filter(m => new Date(m.scheduled_at) >= now || m.status === 'active');
    const pastMeetings = meetings.filter(m => new Date(m.scheduled_at) < now && m.status !== 'active');
    const displayMeetings = activeTab === 'upcoming' ? upcomingMeetings : pastMeetings;

    const statusLabel = (status: string) => {
        const map: Record<string, string> = { scheduled: t('communication_page.conf_status_scheduled'), active: t('communication_page.conf_status_active'), ended: t('communication_page.conf_status_ended') };
        return map[status] || status;
    };
    const statusColor = (status: string) => ({
        scheduled: 'bg-blue-100 text-blue-700',
        active: 'bg-green-100 text-green-700',
        ended: 'bg-slate-100 text-slate-600'
    }[status] || 'bg-slate-100 text-slate-600');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Video className="w-7 h-7 text-brand-600" /> {t('nav.conference_room')}
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">{displayMeetings.length}</span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">{t('communication_page.conf_subtitle')}</p>
                    </div>
                    {isAdmin && (
                        <button onClick={() => setShowCreateModal(true)} className="ns-btn-primary">
                            <Plus className="w-4 h-4" /> {t('communication_page.create_new_room')}
                        </button>
                    )}
                </div>

                {/* Tabs + View Toggle */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 w-fit">
                        <button onClick={() => setActiveTab('upcoming')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'upcoming' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                            <Calendar className="w-4 h-4" /> {t('communication_page.active_rooms')} ({upcomingMeetings.length})
                        </button>
                        <button onClick={() => setActiveTab('past')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'past' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                            <Clock className="w-4 h-4" /> {t('communication_page.past_meetings')} ({pastMeetings.length})
                        </button>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-1 flex shadow-sm">
                        <button onClick={() => setViewMode('grid')} className={clsx("px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors", viewMode === 'grid' ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:text-slate-700")}>
                            <LayoutGrid className="w-4 h-4" /> {t('common.grid')}
                        </button>
                        <button onClick={() => setViewMode('report')} className={clsx("px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors", viewMode === 'report' ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:text-slate-700")}>
                            <FileText className="w-4 h-4" /> {t('common.report')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center items-center py-20 text-slate-400 gap-2"><Loader2 className="w-6 h-6 animate-spin" /> {t('common.loading')}</div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayMeetings.map(meeting => (
                        <div key={meeting.id} className="ns-card p-5 flex flex-col justify-between hover:border-brand-200 transition-all border-l-4 border-l-brand-500 group">
                            <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor(meeting.status)}`}>{statusLabel(meeting.status)}</span>
                                    <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(meeting.scheduled_at), 'dd MMM yyyy')}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-base leading-tight">{meeting.title}</h3>
                                    {meeting.notes && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{meeting.notes}</p>}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {format(new Date(meeting.scheduled_at), 'hh:mm a')}</span>
                                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {meeting.invited_count} {t('communication_page.conf_invited')}</span>
                                </div>
                                {/* Meet Link */}
                                <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                                    <Link2 className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                                    <span className="text-xs text-slate-600 font-mono flex-1 truncate">{meeting.meet_link}</span>
                                    <button onClick={() => copyLink(meeting)} className="shrink-0 p-1 hover:bg-slate-200 rounded transition-colors">
                                        {copiedId === meeting.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <a href={meeting.meet_link} target="_blank" rel="noreferrer"
                                    className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-sm">
                                    <Video className="w-4 h-4" /> {t('communication_page.conf_join')}
                                </a>
                                {isAdmin && (
                                    <button onClick={() => setInviteMeeting(meeting)}
                                        className="flex-1 py-2.5 bg-[#25D366] hover:bg-[#1ebd5c] text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-sm">
                                        <Send className="w-4 h-4" /> {t('communication_page.conf_send_invites')}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {displayMeetings.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-slate-900 font-bold">{t('communication_page.no_rooms_active')}</h3>
                            <p className="text-slate-500 text-sm mt-1">{t('communication_page.create_room_hint')}</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Report / Table View */
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b bg-slate-50">
                        <h3 className="font-semibold text-slate-800">{t('communication_page.past_meetings')} — {t('common.report_view')} ({displayMeetings.length})</h3>
                        <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm">
                            <Printer className="w-4 h-4" /> {t('common.print')}
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('communication_page.conf_schedule_date')} & {t('communication_page.conf_schedule_time')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('communication_page.conf_meeting_title')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('communication_page.conf_invited')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Link</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {displayMeetings.length > 0 ? displayMeetings.map(meeting => (
                                    <tr key={meeting.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            <div className="font-medium text-slate-900">{format(new Date(meeting.scheduled_at), 'dd MMM yyyy')}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {format(new Date(meeting.scheduled_at), 'hh:mm a')}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-800 max-w-xs">
                                            <div className="font-medium">{meeting.title}</div>
                                            {meeting.notes && <div className="text-xs text-slate-500 mt-0.5 truncate">{meeting.notes}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor(meeting.status)}`}>{statusLabel(meeting.status)}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {meeting.invited_count}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center gap-2">
                                                <a href={meeting.meet_link} target="_blank" rel="noreferrer" className="text-brand-600 hover:text-brand-800 hover:underline flex items-center gap-1 text-xs font-mono truncate max-w-[160px]">
                                                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />{meeting.meet_link.replace('https://', '')}
                                                </a>
                                                <button onClick={() => copyLink(meeting)} className="p-1 hover:bg-slate-100 rounded">
                                                    {copiedId === meeting.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">{t('communication_page.conf_no_meetings')}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showCreateModal && (
                <CreateMeetingModal
                    tenantId={tenantId || ''}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={handleCreated}
                />
            )}
            {inviteMeeting && tenantId && (
                <InviteVoterModal
                    meeting={inviteMeeting}
                    tenantId={tenantId}
                    onClose={() => setInviteMeeting(null)}
                    onSent={(count) => {
                        setMeetings(prev => prev.map(m => m.id === inviteMeeting.id ? { ...m, invited_count: m.invited_count + count } : m));
                        fetchMeetings();
                    }}
                />
            )}
        </div>
    );
};

export default ConferenceRoom;
