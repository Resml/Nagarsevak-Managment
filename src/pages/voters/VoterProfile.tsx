import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type Voter, type Complaint, type ComplaintStatus } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { MapPin, Phone, Calendar, ArrowLeft, PlusCircle, User, Edit2, X, Trash2, Save, Users, Heart, Baby, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useLanguage } from '../../context/LanguageContext';

interface FamilyMember {
    id: string;
    name: string;
    name_marathi?: string;
    age?: number;
    gender?: string;
    relation_type?: string;
    relation_name?: string;
    serial_no?: number;
    epic_no?: string;
    inferredRelation: string;
}

const VoterProfile = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [voter, setVoter] = useState<Voter | undefined>(undefined);
    const [complaintHistory, setComplaintHistory] = useState<Complaint[]>([]);
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [loadingFamily, setLoadingFamily] = useState(false);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        name_marathi: '',
        mobile: '',
        age: 0,
        dob: '',
        profession: '',
        gender: '',
        address: '',
        address_marathi: '',
        current_address_english: '',
        current_address_marathi: '',
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
                        current_address_english: voterData.current_address_english,
                        current_address_marathi: voterData.current_address_marathi,
                        dob: voterData.dob,
                        profession: voterData.profession,
                        ward: voterData.ward_no,
                        booth: voterData.part_no?.toString(),
                        epicNo: voterData.epic_no,
                        mobile: voterData.mobile,
                        is_friend_relative: voterData.is_friend_relative,
                        house_no: voterData.house_no,
                        history: []
                    };
                    setVoter(mappedVoter);
                    setEditForm({
                        name: voterData.name || voterData.name_english || '',
                        name_marathi: voterData.name_marathi || '',
                        mobile: voterData.mobile || '',
                        age: voterData.age || 0,
                        dob: voterData.dob || '',
                        profession: voterData.profession || '',
                        gender: voterData.gender || 'M',
                        address: voterData.address || voterData.address_english || '',
                        address_marathi: voterData.address_marathi || '',
                        current_address_english: voterData.current_address_english || '',
                        current_address_marathi: voterData.current_address_marathi || '',
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

    // Fetch family members whenever voter data is available
    useEffect(() => {
        if (!voter || !voter.booth || !voter.id) return;

        const fetchFamilyMembers = async () => {
            setLoadingFamily(true);
            try {
                // Fetch voters in the same booth (part_no) and house_no
                // We use the raw voter data stored in the voter state
                const baseQuery = supabase
                    .from('voters')
                    .select('id, name_english, name_marathi, age, gender, relation_type, relation_name, serial_no, epic_no, house_no')
                    .neq('id', voter.id);

                // Try to match by house_no + part_no if available
                const boothVal = voter.booth ? parseInt(voter.booth, 10) : null;
                const { data: houseData } = voter.house_no
                    ? await baseQuery
                        .eq('part_no', boothVal !== null && !isNaN(boothVal) ? boothVal : voter.booth)
                        .eq('house_no', voter.house_no)
                        .limit(20)
                    : { data: [] };

                if (!houseData || houseData.length === 0) {
                    setFamilyMembers([]);
                    return;
                }

                // Infer relationships
                const currentName = (voter.name_english || voter.name || '').trim().toLowerCase();

                const mappedMembers: FamilyMember[] = houseData.map((fm: any) => {
                    let inferredRelation = 'Relative';
                    const fmRelType = (fm.relation_type || '').toUpperCase();
                    const fmRelName = (fm.relation_name || '').trim().toLowerCase();
                    const fmName = (fm.name_english || '').trim().toLowerCase();

                    // Try to infer based on relation type codes
                    if (fmRelType === 'H') {
                        // This member's relation is 'Husband' (their husband's name = fmRelName)
                        if (fmRelName === currentName) {
                            // Current voter is the husband of this member → this member is Wife
                            inferredRelation = voter.gender === 'M' ? 'Wife' : 'Husband';
                        } else {
                            inferredRelation = fm.gender === 'F' ? 'Wife' : 'Husband';
                        }
                    } else if (fmRelType === 'F') {
                        // This member's relation is 'Father' (their father's name = fmRelName)
                        if (fmRelName === currentName) {
                            // Current voter is the father of this family member → they are Son/Daughter
                            inferredRelation = fm.gender === 'F' ? 'Daughter' : 'Son';
                        } else {
                            // They share the same father name as current voter → Sibling
                            inferredRelation = fm.gender === 'F' ? 'Sister' : 'Brother';
                        }
                    } else if (fmRelType === 'M') {
                        if (fmRelName === currentName) {
                            inferredRelation = fm.gender === 'F' ? 'Daughter' : 'Son';
                        } else {
                            inferredRelation = fm.gender === 'F' ? 'Sister' : 'Brother';
                        }
                    } else if (fmRelType === 'W') {
                        inferredRelation = 'Wife';
                    } else {
                        // Fallback: guess from age difference
                        const ageDiff = (voter.age || 0) - (fm.age || 0);
                        if (Math.abs(ageDiff) <= 5) {
                            inferredRelation = fm.gender === 'F' ? 'Sister' : 'Brother';
                        } else if (ageDiff > 15) {
                            inferredRelation = fm.gender === 'F' ? 'Daughter' : 'Son';
                        } else if (ageDiff < -15) {
                            inferredRelation = fm.gender === 'F' ? 'Mother' : 'Father';
                        } else {
                            inferredRelation = 'Relative';
                        }
                    }

                    return {
                        id: fm.id,
                        name: fm.name_english || '',
                        name_marathi: fm.name_marathi,
                        age: fm.age,
                        gender: fm.gender,
                        relation_type: fm.relation_type,
                        relation_name: fm.relation_name,
                        serial_no: fm.serial_no,
                        epic_no: fm.epic_no,
                        inferredRelation,
                    };
                });

                setFamilyMembers(mappedMembers);
            } catch (err) {
                console.error('Error fetching family members:', err);
            } finally {
                setLoadingFamily(false);
            }
        };

        fetchFamilyMembers();
    }, [voter?.id, voter?.booth, voter?.house_no]);

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
        if (language === 'mr') {
            return voter.name_marathi || voter.name || voter.name_english;
        }
        return voter.name_english || voter.name;
    };

    const getDisplayAddress = (voter: Voter) => {
        if (language === 'mr') {
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
                name_english: editForm.name,
                name_marathi: editForm.name_marathi,
                mobile: editForm.mobile ? editForm.mobile : null,
                age: editForm.age,
                dob: editForm.dob ? editForm.dob : null,
                profession: editForm.profession,
                gender: editForm.gender,
                address_english: editForm.address,
                address_marathi: editForm.address_marathi,
                current_address_english: editForm.current_address_english,
                current_address_marathi: editForm.current_address_marathi,
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
            const updatedVoter: Voter = {
                ...voter,
                name_english: editForm.name,
                name_marathi: editForm.name_marathi,
                name: editForm.name,
                mobile: editForm.mobile ? editForm.mobile : undefined,
                age: editForm.age,
                dob: editForm.dob ? editForm.dob : undefined,
                profession: editForm.profession,
                gender: editForm.gender as 'M' | 'F' | 'O',
                address_english: editForm.address,
                address_marathi: editForm.address_marathi,
                address: editForm.address,
                current_address_english: editForm.current_address_english,
                current_address_marathi: editForm.current_address_marathi,
                ward: editForm.ward_no,
                booth: editForm.part_no,
                epicNo: editForm.epic_no
            };
            setVoter(updatedVoter);
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
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-slate-900">{getDisplayName(voter)}</h1>
                                {voter.is_friend_relative && (
                                    <span className="ns-badge bg-brand-100 text-brand-700 border-brand-200 text-xs py-0.5">
                                        {t('voter_profile.is_friend_relative')}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 mt-2">
                                <span className="ns-badge border-brand-100 bg-white text-brand-800">{t('voter_profile.epic_no')}: {voter.epicNo}</span>
                                <span>{t('voter_profile.age')}: {voter.age}</span>
                                <span>{getGenderDisplay(voter.gender)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={async () => {
                                const newStatus = !voter.is_friend_relative;
                                try {
                                    const { error } = await supabase
                                        .from('voters')
                                        .update({ is_friend_relative: newStatus })
                                        .eq('id', voter.id);
                                    if (error) throw error;
                                    setVoter({ ...voter, is_friend_relative: newStatus });
                                    toast.success(newStatus ? t('voter_profile.mark_friend') : t('voter_profile.unmark_friend'));
                                } catch (err) {
                                    toast.error('Operation failed');
                                }
                            }}
                            className={`flex flex-col items-center px-3 transition-colors ${voter.is_friend_relative ? 'text-brand-600' : 'text-slate-400 hover:text-brand-600'}`}
                        >
                            <Users className={`w-5 h-5 mb-0.5 ${voter.is_friend_relative ? 'fill-brand-600' : ''}`} />
                            <span className="text-xs font-medium">
                                {voter.is_friend_relative ? 'Tagged' : 'Tag'}
                            </span>
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex flex-col items-center text-slate-500 hover:text-brand-700 px-3"
                        >
                            <Edit2 className="w-5 h-5 mb-0.5" />
                            <span className="text-xs font-medium">{t('voter_profile.edit')}</span>
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/complaints/new', { state: { voterId: voter.id, voterName: getDisplayName(voter) } })}
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
                                    {t('voter_profile.add_mobile')}
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

            {/* Family Member Mapping Card */}
            {(loadingFamily || familyMembers.length > 0) && (
                <div className="ns-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-white flex items-center gap-3">
                        <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                            <Users className="w-4 h-4 text-violet-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Family Members</h2>
                            <p className="text-xs text-slate-500">Other voters registered at the same address</p>
                        </div>
                        <span className="ml-auto text-xs font-bold bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full border border-violet-200">
                            {familyMembers.length} found
                        </span>
                    </div>

                    {loadingFamily ? (
                        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : (
                        <div className="p-6">
                            {/* Self Card */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {/* Self */}
                                <div className="relative bg-brand-50 border border-brand-200 rounded-xl p-4 ring-1 ring-brand-100 shadow-sm">
                                    <div className="absolute -top-2 left-3">
                                        <span className="text-[10px] font-bold bg-brand-600 text-white px-2 py-0.5 rounded-full">Self</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                                            <User className="w-4 h-4 text-brand-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate">{voter.name_english || voter.name}</p>
                                            <p className="text-xs text-slate-500">
                                                Age {voter.age} · {voter.gender === 'M' ? 'Male' : voter.gender === 'F' ? 'Female' : 'Other'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Family Members */}
                                {familyMembers.map(member => {
                                    const relationColors: Record<string, string> = {
                                        'Wife': 'bg-pink-50 border-pink-200 ring-pink-100',
                                        'Husband': 'bg-blue-50 border-blue-200 ring-blue-100',
                                        'Father': 'bg-amber-50 border-amber-200 ring-amber-100',
                                        'Mother': 'bg-orange-50 border-orange-200 ring-orange-100',
                                        'Son': 'bg-emerald-50 border-emerald-200 ring-emerald-100',
                                        'Daughter': 'bg-teal-50 border-teal-200 ring-teal-100',
                                        'Brother': 'bg-cyan-50 border-cyan-200 ring-cyan-100',
                                        'Sister': 'bg-purple-50 border-purple-200 ring-purple-100',
                                        'Relative': 'bg-slate-50 border-slate-200 ring-slate-100',
                                    };
                                    const badgeColors: Record<string, string> = {
                                        'Wife': 'bg-pink-600',
                                        'Husband': 'bg-blue-600',
                                        'Father': 'bg-amber-600',
                                        'Mother': 'bg-orange-600',
                                        'Son': 'bg-emerald-600',
                                        'Daughter': 'bg-teal-600',
                                        'Brother': 'bg-cyan-600',
                                        'Sister': 'bg-purple-600',
                                        'Relative': 'bg-slate-500',
                                    };
                                    const colorClass = relationColors[member.inferredRelation] || relationColors['Relative'];
                                    const badgeColor = badgeColors[member.inferredRelation] || badgeColors['Relative'];

                                    return (
                                        <button
                                            key={member.id}
                                            onClick={() => navigate(`/dashboard/voters/${member.id}`)}
                                            className={`relative border rounded-xl p-4 ring-1 shadow-sm text-left hover:shadow-md transition-all group ${colorClass}`}
                                        >
                                            <div className="absolute -top-2 left-3">
                                                <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${badgeColor}`}>
                                                    {member.inferredRelation}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center flex-shrink-0">
                                                    {member.gender === 'F'
                                                        ? <UserCheck className="w-4 h-4 text-slate-500" />
                                                        : <User className="w-4 h-4 text-slate-500" />
                                                    }
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-brand-700 transition-colors">
                                                        {member.name || member.name_marathi}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {member.age ? `Age ${member.age} · ` : ''}
                                                        {member.gender === 'M' ? 'Male' : member.gender === 'F' ? 'Female' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            {member.epic_no && (
                                                <p className="mt-2 text-[10px] font-mono text-slate-400 truncate border-t border-white/50 pt-1.5">
                                                    {member.epic_no}
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

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
                            <h3 className="text-lg font-bold text-gray-900">{t('voter_profile.edit_title')}</h3>
                            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateVoter} className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
                            {/* Personal Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('voter_profile.name_english')}</label>
                                    <input
                                        type="text"
                                        className="ns-input mt-1"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('voter_profile.name_marathi')}</label>
                                    <input
                                        type="text"
                                        className="ns-input mt-1"
                                        value={editForm.name_marathi}
                                        onChange={e => setEditForm({ ...editForm, name_marathi: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('voter_profile.dob')}</label>
                                    <input
                                        type="date"
                                        className="ns-input mt-1"
                                        value={editForm.dob}
                                        onChange={e => setEditForm({ ...editForm, dob: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('voter_profile.profession')}</label>
                                    <input
                                        type="text"
                                        className="ns-input mt-1"
                                        value={editForm.profession}
                                        onChange={e => setEditForm({ ...editForm, profession: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('voter_profile.age')}</label>
                                    <input
                                        type="number"
                                        className="ns-input mt-1"
                                        value={editForm.age}
                                        onChange={e => setEditForm({ ...editForm, age: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('voter_profile.gender')}</label>
                                    <select
                                        className="ns-input mt-1"
                                        value={editForm.gender}
                                        onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                                    >
                                        <option value="M">{t('voter_profile.male')}</option>
                                        <option value="F">{t('voter_profile.female')}</option>
                                        <option value="O">{t('voter_profile.other')}</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('voter_profile.mobile_form')}</label>
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
                                <label className="block text-sm font-medium text-gray-700">{t('voter_profile.address_english')}</label>
                                <textarea
                                    className="ns-input mt-1"
                                    rows={2}
                                    value={editForm.address}
                                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('voter_profile.address_marathi')}</label>
                                <textarea
                                    className="ns-input mt-1"
                                    rows={2}
                                    value={editForm.address_marathi}
                                    onChange={e => setEditForm({ ...editForm, address_marathi: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('voter_profile.current_address_english')}</label>
                                <textarea
                                    className="ns-input mt-1"
                                    rows={2}
                                    value={editForm.current_address_english}
                                    onChange={e => setEditForm({ ...editForm, current_address_english: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('voter_profile.current_address_marathi')}</label>
                                <textarea
                                    className="ns-input mt-1"
                                    rows={2}
                                    value={editForm.current_address_marathi}
                                    onChange={e => setEditForm({ ...editForm, current_address_marathi: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('voter_profile.ward_no')}</label>
                                    <input
                                        type="text"
                                        className="ns-input mt-1"
                                        value={editForm.ward_no}
                                        onChange={e => setEditForm({ ...editForm, ward_no: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('voter_profile.part_no')}</label>
                                    <input
                                        type="text"
                                        className="ns-input mt-1"
                                        value={editForm.part_no}
                                        onChange={e => setEditForm({ ...editForm, part_no: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('voter_profile.epic_no')}</label>
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
                                    {t('voter_profile.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="ns-btn-primary"
                                >
                                    {isSaving ? t('voter_profile.saving') : t('voter_profile.save_changes')}
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
