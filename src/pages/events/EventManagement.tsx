import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Clock, MapPin, Send, Plus, Users, Search } from 'lucide-react';
import { format } from 'date-fns';

interface Event {
    id: number;
    title: string;
    description: string;
    event_date: string;
    event_time: string;
    location: string;
    target_audience: string;
}

const EventManagement = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [broadcastingId, setBroadcastingId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        location: '',
        event_date: '',
        event_time: '',
        target_audience: 'All'
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('event_date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBroadcast = async (eventId: number) => {
        if (!confirm('Are you sure you want to send WhatsApp invites to ALL voters?')) return;

        setBroadcastingId(eventId);
        try {
            const response = await fetch('http://localhost:4000/api/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId })
            });

            if (response.ok) {
                alert('Broadcast started! Messages are being sent in the background.');
            } else {
                alert('Failed to start broadcast.');
            }
        } catch (err) {
            console.error('Broadcast error:', err);
            alert('Error connecting to Bot Server.');
        } finally {
            setBroadcastingId(null);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('events')
                .insert([{
                    ...newEvent,
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;
            setShowModal(false);
            setNewEvent({ title: '', description: '', location: '', event_date: '', event_time: '', target_audience: 'All' });
            fetchEvents();
            alert('Event created successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to create event.');
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || event.target_audience === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Events & Broadcasts</h1>
                    <p className="text-sm text-gray-500">Manage community events and send invites</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                    >
                        <option value="All">All Categories</option>
                        <option value="OPEN">OPEN</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="VJNT">VJNT</option>
                        <option value="SBC">SBC</option>
                    </select>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" /> Create Event
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search by Title, Location, or Description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Create New Event</h2>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Event Title</label>
                                <input
                                    type="text" required
                                    className="w-full border rounded-lg p-2 mt-1"
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                    placeholder="e.g. Free Eye Checkup Camp"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    className="w-full border rounded-lg p-2 mt-1"
                                    value={newEvent.description}
                                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                    placeholder="Details about the event..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date</label>
                                    <input
                                        type="date" required
                                        className="w-full border rounded-lg p-2 mt-1"
                                        value={newEvent.event_date}
                                        onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Time</label>
                                    <input
                                        type="time" required
                                        className="w-full border rounded-lg p-2 mt-1"
                                        value={newEvent.event_time}
                                        onChange={e => setNewEvent({ ...newEvent, event_time: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Location</label>
                                <input
                                    type="text" required
                                    className="w-full border rounded-lg p-2 mt-1"
                                    value={newEvent.location}
                                    onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                                    placeholder="e.g. Community Hall, Ward 10"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Target Audience (Caste/Category)</label>
                                <select
                                    className="w-full border rounded-lg p-2 mt-1"
                                    value={newEvent.target_audience}
                                    onChange={e => setNewEvent({ ...newEvent, target_audience: e.target.value })}
                                >
                                    <option value="All">All Citizens</option>
                                    <option value="OPEN">OPEN</option>
                                    <option value="OBC">OBC</option>
                                    <option value="SC">SC</option>
                                    <option value="ST">ST</option>
                                    <option value="VJNT">VJNT</option>
                                    <option value="SBC">SBC</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Select specific category if this event is targeted.</p>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Create Event</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-10">Loading...</div>
            ) : (
                <div className="grid gap-4">
                    {filteredEvents.map((event) => (
                        <div key={event.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            {/* ... (Event Card Content same as before) ... */}
                            <div className="flex items-start gap-4">
                                <div className="bg-purple-100 text-purple-700 p-4 rounded-xl text-center min-w-[80px]">
                                    <div className="text-xs font-bold uppercase">{format(new Date(event.event_date), 'MMM')}</div>
                                    <div className="text-2xl font-bold">{format(new Date(event.event_date), 'd')}</div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {event.event_time}</span>
                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {event.location}</span>
                                        {event.target_audience && event.target_audience !== 'All' && (
                                            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-semibold">
                                                For: {event.target_audience}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-600 text-sm mt-2 max-w-xl">{event.description}</p>
                                </div>
                            </div>

                            <div className="w-full md:w-auto flex md:flex-col gap-2">
                                <button
                                    onClick={() => handleBroadcast(event.id)}
                                    disabled={broadcastingId === event.id}
                                    className="flex-1 md:w-40 bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 transition shadow-sm"
                                >
                                    {broadcastingId === event.id ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    Send Invites
                                </button>
                                <button className="flex-1 md:w-40 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50">
                                    <Users className="w-4 h-4" /> View RSVPs
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredEvents.length === 0 && <div className="text-center py-10 text-gray-500">No upcoming events matching your criteria.</div>}
                </div>
            )}
        </div>
    );
};

export default EventManagement;
