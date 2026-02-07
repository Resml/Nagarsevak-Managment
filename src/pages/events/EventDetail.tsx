import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { ArrowLeft, Calendar, MapPin, Clock, Users, Trash2, Edit, Send, CheckCircle, XCircle, HelpCircle, Save, X, Share2, AlertTriangle } from 'lucide-react';
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
    status: string;
    type: string;
    area?: string;
}

interface RSVP {
    status: string;
    response_source: string;
    voter: {
        name_english: string;
        name_marathi: string;
        mobile: string;
    };
}

const EventDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useLanguage();
    const { tenantId } = useTenant(); // Added tenantId

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [rsvps, setRsvps] = useState<RSVP[]>([]);
    const [stats, setStats] = useState({ going: 0, notGoing: 0, maybe: 0 });

    // Actions State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [broadcasting, setBroadcasting] = useState(false);


    // Edit Form State
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        event_date: '',
        event_time: '',
        location: '',
        type: 'Public Meeting',
        status: 'Planned',
        area: ''
    });

    useEffect(() => {
        if (id) {
            fetchEventDetails();
            fetchRSVPs();
        }
    }, [id]);

    const fetchEventDetails = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', id)
                .eq('tenant_id', tenantId) // Secured
                .single();

            if (error) throw error;
            setEvent(data);

            setEditForm({
                title: data.title,
                description: data.description,
                event_date: data.event_date,
                event_time: data.event_time,
                location: data.location,
                type: data.type || 'Public Meeting',
                status: data.status,
                area: data.area || ''
            });

        } catch (err) {
            console.error('Error fetching event details:', err);
            toast.error(t('events.not_found'));
        } finally {
            setLoading(false);
        }
    };

    const fetchRSVPs = async () => {
        if (!id) return;
        try {
            const { data, error } = await supabase
                .from('event_rsvps')
                .select(`
                    status,
                    response_source,
                    voter:voters (name_english, name_marathi, mobile)
                `)
                .eq('event_id', id)
                .eq('tenant_id', tenantId); // Secured

            if (error) {
                console.warn("Could not fetch RSVPs, likely table missing", error);
                return;
            }

            const rsvpData = data as any[];
            setRsvps(rsvpData);

            // Calculate Stats
            const newStats = { going: 0, notGoing: 0, maybe: 0 };
            rsvpData.forEach(r => {
                if (r.status === 'Going') newStats.going++;
                else if (r.status === 'Not Going') newStats.notGoing++;
                else newStats.maybe++;
            });
            setStats(newStats);

        } catch (err) {
            console.error('Error fetching RSVPs:', err);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        setDeleting(true);
        try {
            const { error } = await supabase.from('events').delete().eq('id', id).eq('tenant_id', tenantId); // Secured
            if (error) throw error;
            toast.success(t('events.delete_success'));
            navigate('/events');
        } catch (err) {
            console.error('Error deleting event:', err);
            toast.error('Failed to delete event');
        } finally {
            setDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('events')
                .update({
                    title: editForm.title,
                    description: editForm.description,
                    event_date: editForm.event_date,
                    event_time: editForm.event_time,
                    location: editForm.location,
                    type: editForm.type,
                    status: editForm.status,
                    area: editForm.area
                })
                .eq('id', id)
                .eq('tenant_id', tenantId); // Secured

            if (error) throw error;

            setEvent(prev => prev ? ({ ...prev, ...editForm }) : null);
            toast.success(t('events.update_success'));
            setIsEditModalOpen(false);
        } catch (err) {
            console.error('Error updating event:', err);
            toast.error('Failed to update event');
        } finally {
            setUpdating(false);
        }
    };

    const handleBroadcast = async () => {
        if (!event) return;
        setBroadcasting(true);
        // Simulate broadcast
        setTimeout(() => {
            toast.success(`${t('events.invite_sent_title')} "${event.title}"!`);
            setBroadcasting(false);
        }, 1500);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Completed':
                return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> {t('status.Resolved')}</span>;
            case 'Cancelled':
                return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5"><XCircle className="w-4 h-4" /> {t('status.Closed')}</span>;
            default:
                return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5"><Clock className="w-4 h-4" /> {t('complaints.status.pending')}</span>;
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto space-y-6 px-4 md:px-0 pb-20 animate-pulse">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center">
                    <div className="h-10 w-32 bg-slate-200 rounded-full"></div>
                    <div className="flex gap-2">
                        <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
                        <div className="h-10 w-24 bg-slate-200 rounded-lg"></div>
                        <div className="h-10 w-24 bg-red-100 rounded-lg"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content Skeleton */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="ns-card p-6 md:p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-3 w-3/4">
                                    <div className="flex gap-2">
                                        <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
                                        <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                                    </div>
                                    <div className="h-10 w-full bg-slate-200 rounded-lg"></div>
                                </div>
                                <div className="h-8 w-24 bg-slate-200 rounded-full"></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="h-16 bg-slate-100 rounded-xl"></div>
                                <div className="h-16 bg-slate-100 rounded-xl"></div>
                                <div className="col-span-2 h-16 bg-slate-100 rounded-xl"></div>
                            </div>

                            <div className="space-y-3">
                                <div className="h-6 w-32 bg-slate-200 rounded"></div>
                                <div className="h-4 w-full bg-slate-100 rounded"></div>
                                <div className="h-4 w-full bg-slate-100 rounded"></div>
                                <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
                            </div>
                        </div>

                        <div className="ns-card p-6 space-y-4">
                            <div className="flex justify-between">
                                <div className="h-6 w-32 bg-slate-200 rounded"></div>
                                <div className="h-4 w-16 bg-slate-200 rounded"></div>
                            </div>
                            <div className="space-y-3">
                                <div className="h-16 bg-slate-100 rounded-xl"></div>
                                <div className="h-16 bg-slate-100 rounded-xl"></div>
                                <div className="h-16 bg-slate-100 rounded-xl"></div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Skeleton */}
                    <div className="ns-card p-6 space-y-4">
                        <div className="h-6 w-40 bg-slate-200 rounded"></div>
                        <div className="h-16 bg-slate-100 rounded-xl"></div>
                        <div className="h-16 bg-slate-100 rounded-xl"></div>
                        <div className="h-16 bg-slate-100 rounded-xl"></div>
                        <div className="h-10 bg-slate-200 rounded-lg mt-4"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!event) return <div className="p-10 text-center text-red-500">{t('events.not_found')}</div>;

    const isAdmin = user?.role === 'admin';

    return (
        <div className="max-w-5xl mx-auto space-y-6 px-4 md:px-0 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button
                    onClick={() => navigate('/events')}
                    className="group flex items-center gap-2 text-slate-600 hover:text-brand-700 transition-colors font-medium"
                >
                    <div className="p-2 bg-white rounded-full border border-slate-200 shadow-sm group-hover:border-brand-200 group-hover:shadow transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span>{t('events.back_to_events')}</span>
                </button>

                {isAdmin && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleBroadcast}
                            disabled={broadcasting}
                            className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md hover:shadow-lg transition-all font-medium text-sm disabled:opacity-70"
                        >
                            <Send className={`w-4 h-4 ${broadcasting ? 'animate-pulse' : ''}`} />
                            {broadcasting ? t('events.sending') : t('events.send_invites')}
                        </button>
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm transition-colors font-medium text-sm"
                        >
                            <Edit className="w-4 h-4" /> {t('common.edit')}
                        </button>
                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition-colors font-medium text-sm"
                        >
                            <Trash2 className="w-4 h-4" /> {t('common.delete')}
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <div className="ns-card p-6 md:p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="ns-badge bg-brand-50 text-brand-700 border-brand-100">{event.type}</span>
                                    {event.area && <span className="ns-badge bg-slate-100 text-slate-600">{event.area}</span>}
                                </div>
                                <h1 className="text-3xl font-bold text-slate-900 leading-tight">{event.title}</h1>
                            </div>
                            {getStatusBadge(event.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="p-2 bg-white rounded-full text-brand-600 shadow-sm"><Calendar className="w-5 h-5" /></div>
                                <div>
                                    <div className="text-xs text-slate-500 font-semibold uppercase">{t('events.date')}</div>
                                    <div className="font-medium text-slate-900">{format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="p-2 bg-white rounded-full text-brand-600 shadow-sm"><Clock className="w-5 h-5" /></div>
                                <div>
                                    <div className="text-xs text-slate-500 font-semibold uppercase">{t('events.time')}</div>
                                    <div className="font-medium text-slate-900">{event.event_time}</div>
                                </div>
                            </div>
                            <div className="col-span-2 flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="p-2 bg-white rounded-full text-brand-600 shadow-sm"><MapPin className="w-5 h-5" /></div>
                                <div>
                                    <div className="text-xs text-slate-500 font-semibold uppercase">{t('events.location')}</div>
                                    <div className="font-medium text-slate-900">{event.location}</div>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mb-3">{t('events.about_event')}</h3>
                        <div className="prose prose-slate max-w-none">
                            <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{event.description}</p>
                        </div>
                    </div>

                    {/* RSVP List */}
                    <div className="ns-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-brand-600" />
                                {t('events.rsvp_list')}
                            </h3>
                            <span className="text-sm text-slate-500">{rsvps.length} {t('events.total')}</span>
                        </div>

                        {rsvps.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <div className="p-3 bg-white rounded-full inline-block mb-3 shadow-sm">
                                    <AlertTriangle className="w-6 h-6 text-slate-300" />
                                </div>
                                <div className="text-slate-500 font-medium">{t('events.no_rsvps')}</div>
                                <p className="text-xs text-slate-400 mt-1">{t('events.no_rsvps_hint')}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {rsvps.map((rsvp, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-500 font-bold border border-slate-200 shadow-sm">
                                                {rsvp.voter?.name_english?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900">
                                                    {rsvp.voter?.name_english || rsvp.voter?.name_marathi || t('events.unknown_voter')}
                                                </div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    <span>{rsvp.voter?.mobile}</span>
                                                    <span>•</span>
                                                    <span>{t('events.via')} {rsvp.response_source}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            {rsvp.status === 'Going' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> {t('events.going')}</span>}
                                            {rsvp.status === 'Not Going' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> {t('events.not_going')}</span>}
                                            {rsvp.status === 'Maybe' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><HelpCircle className="w-3 h-3 mr-1" /> {t('events.maybe')}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <div className="ns-card p-6">
                        <h3 className="font-bold text-slate-900 mb-4">{t('events.response_summary')}</h3>

                        <div className="space-y-3">
                            <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-full text-green-600 shadow-sm"><CheckCircle className="w-5 h-5" /></div>
                                    <span className="font-medium text-green-900">{t('events.going')}</span>
                                </div>
                                <span className="text-2xl font-bold text-green-700">{stats.going}</span>
                            </div>

                            <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-full text-red-600 shadow-sm"><XCircle className="w-5 h-5" /></div>
                                    <span className="font-medium text-red-900">{t('events.not_going')}</span>
                                </div>
                                <span className="text-2xl font-bold text-red-700">{stats.notGoing}</span>
                            </div>

                            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-full text-yellow-600 shadow-sm"><HelpCircle className="w-5 h-5" /></div>
                                    <span className="font-medium text-yellow-900">{t('events.maybe')}</span>
                                </div>
                                <span className="text-2xl font-bold text-yellow-700">{stats.maybe}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    const text = `Event: ${event.title}\nDate: ${event.event_date} at ${event.event_time}\nLocation: ${event.location}\n\n${event.description}`;
                                    if (navigator.share) {
                                        navigator.share({ title: event.title, text: text }).catch(console.error);
                                    } else {
                                        navigator.clipboard.writeText(text);
                                        toast.success(t('events.copied'));
                                    }
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
                            >
                                <Share2 className="w-4 h-4" /> {t('events.share_event')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden p-6 shadow-2xl">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">{t('events.delete_confirm_title')}</h3>
                            <p className="text-slate-500 mt-2 text-sm">
                                {t('events.delete_confirm_msg')}
                            </p>
                        </div>
                        <div className="flex gap-3 pt-6">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition shadow-lg shadow-red-200 disabled:opacity-50"
                            >
                                {deleting ? t('events.deleting') : t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-900">{t('events.edit_event_title')}</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.event_title')}</label>
                                <input
                                    type="text"
                                    className="ns-input w-full"
                                    value={editForm.title}
                                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.description')}</label>
                                <textarea
                                    className="ns-input w-full h-32"
                                    value={editForm.description}
                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.date')}</label>
                                    <input
                                        type="date"
                                        className="ns-input w-full"
                                        value={editForm.event_date}
                                        onChange={e => setEditForm({ ...editForm, event_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.time')}</label>
                                    <input
                                        type="time"
                                        className="ns-input w-full"
                                        value={editForm.event_time}
                                        onChange={e => setEditForm({ ...editForm, event_time: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.location')}</label>
                                <input
                                    type="text"
                                    className="ns-input w-full"
                                    value={editForm.location}
                                    onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.type_label')}</label>
                                    <select
                                        className="ns-input w-full"
                                        value={editForm.type}
                                        onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                                    >
                                        <option value="Public Meeting">{t('events.types.Public Meeting')}</option>
                                        <option value="Rally">{t('events.types.Rally')}</option>
                                        <option value="Door-to-Door">{t('events.types.Door-to-Door')}</option>
                                        <option value="Inauguration">{t('events.types.Inauguration')}</option>
                                        <option value="Other">{t('events.types.Other')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.status.status')}</label>
                                    <select
                                        className="ns-input w-full"
                                        value={editForm.status}
                                        onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                    >
                                        <option value="Planned">{t('complaints.status.pending')}</option>
                                        <option value="Completed">{t('status.Resolved')}</option>
                                        <option value="Cancelled">{t('status.Closed')}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Area field - optional */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('events.area')}</label>
                                <input
                                    type="text"
                                    className="ns-input w-full"
                                    value={editForm.area}
                                    onChange={e => setEditForm({ ...editForm, area: e.target.value })}
                                    placeholder={t('events.area_placeholder')}
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-medium transition shadow-lg shadow-brand-200 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {updating ? t('events.saving') : t('common.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventDetail;
