import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type Voter, type Complaint, type ComplaintStatus } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { MapPin, Phone, Calendar, ArrowLeft, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '../../context/LanguageContext';

const VoterProfile = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [voter, setVoter] = useState<Voter | undefined>(undefined);
    const [complaintHistory, setComplaintHistory] = useState<Complaint[]>([]);

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

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-brand-600 mb-4"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> {t('voter_profile.back_to_search')}
            </button>

            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-brand-50 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl border-2 border-brand-100 shadow-sm">
                            {voter.gender === 'F' ? '👩' : '👨'}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{getDisplayName(voter)}</h1>
                            <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                                <span className="bg-white px-2 py-0.5 rounded border">{t('voter_profile.epic_no')}: {voter.epicNo}</span>
                                <span>{t('voter_profile.age')}: {voter.age}</span>
                                <span>{getGenderDisplay(voter.gender)}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/complaints/new', { state: { voterId: voter.id, voterName: getDisplayName(voter) } })}
                        className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition shadow-sm"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>{t('voter_profile.report_problem')}</span>
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('voter_profile.contact_address')}</h3>
                        <div className="flex items-start space-x-3">
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-gray-900">{getDisplayAddress(voter)}</p>
                                <p className="text-sm text-gray-500 mt-1">{t('voter_profile.ward')} {voter.ward}, {t('voter_profile.booth')} {voter.booth}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Phone className="w-5 h-5 text-gray-400" />
                            <p className="text-gray-900">{voter.mobile || t('voter_profile.no_mobile')}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('voter_profile.service_history_stats')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded text-center">
                                <p className="text-2xl font-bold text-brand-600">{complaintHistory.length}</p>
                                <p className="text-xs text-gray-500">{t('voter_profile.total_requests')}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded text-center">
                                <p className="text-2xl font-bold text-green-600">
                                    {complaintHistory.filter(c => c.status === 'Resolved' || c.status === 'Closed').length}
                                </p>
                                <p className="text-xs text-gray-500">{t('voter_profile.solved')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent History */}
            <h2 className="text-xl font-bold text-gray-900 pt-4">{t('voter_profile.service_history')}</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
                {complaintHistory.length > 0 ? (
                    complaintHistory.map((complaint) => (
                        <div key={complaint.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div>
                                <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="font-medium text-gray-900">{complaint.title}</h4>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(complaint.status)}`}>
                                        {t(`status.${complaint.status}`)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-1">{complaint.description}</p>
                            </div>
                            <div className="text-right text-xs text-gray-400">
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
        </div>
    );
};

export default VoterProfile;
