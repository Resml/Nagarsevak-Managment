import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type Voter, type Complaint, type ComplaintStatus } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { MapPin, Phone, Calendar, ArrowLeft, PlusCircle, User, Edit2, X, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useLanguage } from '../../context/LanguageContext';

const VoterProfile = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [voter, setVoter] = useState<Voter | undefined>(undefined);
    const [complaintHistory, setComplaintHistory] = useState<Complaint[]>([]);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        name_marathi: '',
        mobile: '',
        age: 0,
        gender: '',
        address: '',
        address_marathi: '',
        ward_no: '',
        part_no: '',
        epic_no: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchVoterDetails = async () => {
            if (!id) return;

            try {
                // Fetch Voter
                const { data: voterData, error } = await supabase
                    .from('voters')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) {
                    console.error('Error fetching voter:', error);
                    return;
                }

                if (voterData) {
                    const mappedVoter: Voter = {
                        id: voterData.id.toString(),
                        name: voterData.name,
                        name_marathi: voterData.name_marathi,
                        name_english: voterData.name_english,
                        age: voterData.age,
                        gender: voterData.gender,
                        address: voterData.address,
                        address_marathi: voterData.address_marathi,
                        address_english: voterData.address_english,
                        ward: voterData.ward_no,
                        booth: voterData.part_no?.toString(),
                        epicNo: voterData.epic_no,
                        mobile: voterData.mobile,
                        history: []
                    };
                    setVoter(mappedVoter);
                    setEditForm({
                        name: voterData.name || voterData.name_english || '',
                        name_marathi: voterData.name_marathi || '',
                        mobile: voterData.mobile || '',
                        age: voterData.age || 0,
                        gender: voterData.gender || 'M',
                        address: voterData.address || voterData.address_english || '',
                        address_marathi: voterData.address_marathi || '',
                        ward_no: voterData.ward_no || '',
                        part_no: voterData.part_no || '',
                        epic_no: voterData.epic_no || ''
                    });

                    // Fetch Complaints (if mobile matches)
                    // Note: This matches complaints filed via WhatsApp using the same mobile number
                    if (voterData.mobile) {
                        const cleanMobile = voterData.mobile.replace(/\D/g, '').slice(-10); // Last 10 digits
                        // This is a loose match illustration. Real world matching is harder.
                        const { data: complaintsData } = await supabase
                            .from('complaints')
                            .select('*')
                            .ilike('user_id', `%${cleanMobile}%`);

                        if (complaintsData) {
                            const mappedComplaints: Complaint[] = complaintsData.map((c: any) => ({
                                id: c.id.toString(),
                                title: c.problem,
                                description: c.problem,
                                type: 'Other',
                                status: c.status,
                                ward: c.location,
                                createdAt: c.created_at,
                                photos: [],
                                updatedAt: c.created_at
                            }));
                            setComplaintHistory(mappedComplaints);
                        }
                    }
                }

            } catch (err) {
                console.error(err);
            }
        };

        fetchVoterDetails();
    }, [id]);

    if (!voter) {
        return <div className="p-8 text-center">Loading voter details...</div>;
    }

    const getStatusColor = (status: ComplaintStatus) => {
        switch (status) {
            case 'Resolved': return 'bg-green-100 text-green-800';
            case 'Closed': return 'bg-gray-100 text-gray-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    const getDisplayName = (voter: Voter) => {
        if (language === 'mr' || language === 'hi') {
            return voter.name_marathi || voter.name || voter.name_english;
        }
        return voter.name_english || voter.name;
    };

    const getDisplayAddress = (voter: Voter) => {
        if (language === 'mr' || language === 'hi') {
            return voter.address_marathi || voter.address || voter.address_english;
        }
        return voter.address_english || voter.address;
    };

    const getGenderDisplay = (gender: string) => {
        return gender === 'M' ? t('voter_profile.gender_male') : t('voter_profile.gender_female');
    };

    const handleUpdateVoter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!voter) return;
        setIsSaving(true);

        try {
            const updates = {
                name: editForm.name,
                name_english: editForm.name,
                name_marathi: editForm.name_marathi,
                mobile: editForm.mobile ? editForm.mobile : null,
                age: editForm.age,
                gender: editForm.gender,
                address: editForm.address,
                address_english: editForm.address,
                address_marathi: editForm.address_marathi,
                ward_no: editForm.ward_no,
                part_no: editForm.part_no,
                epic_no: editForm.epic_no
            };

            const { error } = await supabase
                .from('voters')
                .update(updates)
                .eq('id', voter.id);

            if (error) throw error;

            toast.success('Voter details updated successfully');
            setVoter({ ...voter, ...updates } as Voter);
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            toast.error('Failed to update voter details');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button
                onClick={() => navigate(-1)}
                className="ns-btn-ghost px-0 py-0 text-slate-600 hover:text-brand-700"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> {t('voter_profile.back_to_search')}
            </button>

            {/* Profile Header */}
            <div className="ns-card overflow-hidden">
                <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-br from-brand-50 to-white border-b border-slate-200/70">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 border border-brand-100 shadow-sm">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{getDisplayName(voter)}</h1>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 mt-2">
                                <span className="ns-badge border-brand-100 bg-white text-brand-800">{t('voter_profile.epic_no')}: {voter.epicNo}</span>
                                <span>{t('voter_profile.age')}: {voter.age}</span>
                                <span>{getGenderDisplay(voter.gender)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex flex-col items-center text-slate-500 hover:text-brand-700 px-3"
                        >
                            <Edit2 className="w-5 h-5 mb-0.5" />
                            <span className="text-xs font-medium">Edit</span>
                        </button>
                        <button
                            onClick={() => navigate('/complaints/new', { state: { voterId: voter.id, voterName: getDisplayName(voter) } })}
                            className="ns-btn-primary"
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span>{t('voter_profile.report_problem')}</span>
                        </button>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('voter_profile.contact_address')}</h3>
                        <div className="flex items-start space-x-3">
                            <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-slate-900">{getDisplayAddress(voter)}</p>
                                <p className="text-sm text-slate-500 mt-1">{t('voter_profile.ward')} {voter.ward}, {t('voter_profile.booth')} {voter.booth}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Phone className="w-5 h-5 text-slate-400" />
                            {voter.mobile ? (
                                <p className="text-slate-900">{voter.mobile}</p>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-brand-600 hover:text-brand-700 text-sm font-medium hover:underline"
                                >
                                    + Add Mobile Number
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('voter_profile.service_history_stats')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="ns-card-muted p-4 text-center">
                                <p className="text-2xl font-bold text-brand-700">{complaintHistory.length}</p>
                                <p className="text-xs text-slate-500">{t('voter_profile.total_requests')}</p>
                            </div>
                            <div className="ns-card-muted p-4 text-center">
                                <p className="text-2xl font-bold text-green-600">
                                    {complaintHistory.filter(c => c.status === 'Resolved' || c.status === 'Closed').length}
                                </p>
                                <p className="text-xs text-slate-500">{t('voter_profile.solved')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent History */}
            <h2 className="text-xl font-bold text-slate-900 pt-4">{t('voter_profile.service_history')}</h2>
            <div className="ns-card divide-y divide-slate-200/70">
                {complaintHistory.length > 0 ? (
                    complaintHistory.map((complaint) => (
                        <div key={complaint.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                            <div>
                                <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="font-medium text-slate-900">{complaint.title}</h4>
                                    <span className={`ns-badge border-transparent ${getStatusColor(complaint.status)}`}>
                                        {t(`status.${complaint.status}`)}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 line-clamp-1">{complaint.description}</p>
                            </div>
                            <div className="text-right text-xs text-slate-400">
                                <div className="flex items-center space-x-1 justify-end">
                                    <Calendar className="w-3 h-3" />
                                    <span>{format(new Date(complaint.createdAt), 'MMM d, yyyy')}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        {t('voter_profile.no_history')}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Edit Voter Details</h3>
                            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateVoter} className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
                            {/* Personal Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name (English)</label>
                                    <input
                                        type="text"
                                        className="ns-input mt-1"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name (Marathi)</label>
                                    <input
                                        type="text"
                                        className="ns-input mt-1"
                                        value={editForm.name_marathi}
                                        onChange={e => setEditForm({ ...editForm, name_marathi: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Age</label>
                                    <input
                                        type="number"
                                        className="ns-input mt-1"
                                        value={editForm.age}
                                        onChange={e => setEditForm({ ...editForm, age: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                                    <select
                                        className="ns-input mt-1"
                                        value={editForm.gender}
                                        onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                                    >
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                        <option value="O">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                                <input
                                    type="tel"
                                    className="ns-input mt-1"
                                    value={editForm.mobile}
                                    onChange={e => setEditForm({ ...editForm, mobile: e.target.value })}
                                    maxLength={10}
                                />
                            </div>

                            {/* Location Info */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Address (English)</label>
                                <textarea
                                    className="ns-input mt-1"
                                    rows={2}
                                    value={editForm.address}
                                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Address (Marathi)</label>
                                <textarea
                                    className="ns-input mt-1"
                                    rows={2}
                                    value={editForm.address_marathi}
                                    onChange={e => setEditForm({ ...editForm, address_marathi: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Ward No</label>
                                    <input
                                        type="text"
                                        className="ns-input mt-1"
                                        value={editForm.ward_no}
                                        onChange={e => setEditForm({ ...editForm, ward_no: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Part/Booth</label>
                                    <input
                                        type="text"
                                        className="ns-input mt-1"
                                        value={editForm.part_no}
                                        onChange={e => setEditForm({ ...editForm, part_no: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">EPIC No</label>
                                    <input
                                        type="text"
                                        className="ns-input mt-1"
                                        value={editForm.epic_no}
                                        onChange={e => setEditForm({ ...editForm, epic_no: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="ns-btn-ghost"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="ns-btn-primary"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoterProfile;
