import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { type Complaint } from '../../types';
import { type Staff } from '../../types/staff';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Calendar, FileText, MapPin, Mic, Video, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

const ComplaintDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [complaint, setComplaint] = useState<Complaint | undefined>(undefined);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [assignee, setAssignee] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchComplaint();
            fetchStaff();
        }
    }, [id]);

    const fetchStaff = async () => {
        const { data } = await supabase.from('staff').select('*');
        if (data) setStaffList(data);
    };

    const fetchComplaint = async () => {
        try {
            const { data, error } = await supabase
                .from('complaints')
                .select(`
                    *,
                    voter:voters (name_english, name_marathi, mobile),
                    staff:assigned_to (name, mobile)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            if (data) {
                // Map to App Type
                const mapped: Complaint = {
                    id: data.id.toString(),
                    title: data.problem || 'Request',
                    description: data.problem,
                    type: data.category || 'Complaint',
                    status: data.status,
                    ward: data.location || 'N/A',
                    location: data.location,
                    voter: data.voter,
                    createdAt: data.created_at,
                    updatedAt: data.created_at,
                    photos: [],
                    imageUrl: data.image_url,
                    videoUrl: data.video_url,
                    audioUrl: data.audio_url,
                    voterId: data.voter_id,
                    assignedTo: data.assigned_to
                };
                setComplaint(mapped);
                setAssignee(data.assigned_to || '');
            }
        } catch (err) {
            console.error('Error fetching complaint:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        if (!complaint) return;
        try {
            const { error } = await supabase
                .from('complaints')
                .update({ status: newStatus })
                .eq('id', complaint.id);

            if (error) throw error;
            setComplaint({ ...complaint, status: newStatus as any });
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status');
        }
    };

    const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

    if (loading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
    if (!complaint) return <div className="p-8 text-center text-red-500">Complaint not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 px-4 md:px-0 pb-20 md:pb-0">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-brand-600">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Complaints
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded ${complaint.type === 'Help' ? 'bg-purple-100 text-purple-700' : 'bg-brand-50 text-brand-700'}`}>
                                    {complaint.type}
                                </span>
                                <h1 className="text-2xl font-bold text-gray-900 mt-3">{complaint.title}</h1>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${complaint.status === 'Resolved' ? 'bg-green-100 text-green-800 border-green-200' :
                                complaint.status === 'Pending' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {complaint.status}
                            </span>
                        </div>

                        <div className="prose text-gray-600 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <p className="whitespace-pre-wrap font-medium">{complaint.description}</p>
                        </div>

                        {/* Media Section */}
                        <div className="space-y-4">
                            {/* Image */}
                            {complaint.imageUrl && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Attached Photo
                                    </h3>
                                    <a href={complaint.imageUrl} target="_blank" rel="noreferrer">
                                        <img src={complaint.imageUrl} alt="Evidence" className="rounded-lg border border-gray-200 max-h-96 w-full object-cover hover:opacity-95 transition" />
                                    </a>
                                </div>
                            )}

                            {/* Video */}
                            {complaint.videoUrl && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <Video className="w-4 h-4" /> Attached Video
                                    </h3>
                                    <video controls className="rounded-lg border border-gray-200 w-full max-h-96 bg-black">
                                        <source src={complaint.videoUrl} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            )}

                            {/* Audio */}
                            {complaint.audioUrl && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <Mic className="w-4 h-4" /> Voice Note
                                    </h3>
                                    <audio controls className="w-full">
                                        <source src={complaint.audioUrl} type="audio/ogg" />
                                        <source src={complaint.audioUrl} type="audio/mpeg" />
                                        Your browser does not support audio element.
                                    </audio>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 pt-6 mt-6 border-t border-gray-100">
                            <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1.5" />
                                {complaint.location}
                            </div>
                            <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1.5" />
                                {format(new Date(complaint.createdAt), 'PP p')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    {isAdminOrStaff && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Manage Ticket</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Update Status</label>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => handleStatusUpdate('InProgress')}
                                            disabled={complaint.status === 'InProgress'}
                                            className="px-3 py-2 text-sm border rounded-lg hover:bg-yellow-50 hover:text-yellow-700 disabled:opacity-50 transition text-left"
                                        >
                                            🚧 Mark In Progress
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate('Resolved')}
                                            disabled={complaint.status === 'Resolved'}
                                            className="px-3 py-2 text-sm border rounded-lg hover:bg-green-50 hover:text-green-700 disabled:opacity-50 transition text-left"
                                        >
                                            ✅ Mark Resolved
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate('Closed')}
                                            disabled={complaint.status === 'Closed'}
                                            className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 transition text-left"
                                        >
                                            ❌ Close Ticket
                                        </button>
                                    </div>
                                </div>

                                {/* Assignment */}
                                {user?.role === 'admin' && (
                                    <div className="pt-4 border-t border-gray-100">
                                        <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Assign Staff</label>
                                        <div className="flex space-x-2">
                                            <select
                                                value={assignee}
                                                onChange={async (e) => {
                                                    const newAssignee = e.target.value;
                                                    setAssignee(newAssignee);

                                                    // Auto-save on change
                                                    if (newAssignee) {
                                                        const { error } = await supabase
                                                            .from('complaints')
                                                            .update({
                                                                assigned_to: newAssignee,
                                                                status: 'Assigned'
                                                            })
                                                            .eq('id', complaint.id);

                                                        if (!error) {
                                                            setComplaint({ ...complaint, status: 'Assigned' });
                                                            alert('Staff assigned successfully');
                                                        }
                                                    }
                                                }}
                                                className="w-full text-sm border rounded-lg px-3 py-2"
                                            >
                                                <option value="">Select Staff</option>
                                                {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Meta / Ticket Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Ticket Details</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-gray-500">Ticket ID</span>
                                <span className="font-mono font-medium text-gray-700">#{complaint.id}</span>
                            </li>
                            <li className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-gray-500">Citizen</span>
                                <span className="font-medium text-blue-600">
                                    {complaint.voter?.name_english || complaint.voter?.name_marathi || 'Anonymous'}
                                </span>
                            </li>
                            {complaint.voter?.mobile && (
                                <li className="flex justify-between border-b border-gray-50 pb-2">
                                    <span className="text-gray-500">Mobile</span>
                                    <span className="font-medium text-gray-700">{complaint.voter.mobile}</span>
                                </li>
                            )}
                            <li className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-gray-500">Assigned To</span>
                                <div>
                                    {staffList.find(s => s.id === assignee) ? (
                                        <div className="text-right">
                                            <div className="font-medium text-gray-900">{staffList.find(s => s.id === assignee)?.name}</div>
                                            <div className="text-xs text-brand-600 flex items-center justify-end gap-1">
                                                <Phone className="w-3 h-3" />
                                                {staffList.find(s => s.id === assignee)?.mobile}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">Unassigned</span>
                                    )}
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplaintDetail;
