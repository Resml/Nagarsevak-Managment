import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Phone, Calendar, Trash2, Edit2, User } from 'lucide-react';
import { format } from 'date-fns';
import { type Sadasya, type Complaint } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { MockService } from '../../services/mockData';

interface SadasyaProfileProps {
    member: Sadasya;
    onBack: () => void;
    onEdit: (member: Sadasya) => void;
    onDelete: (id: string, name: string) => void;
}

const SadasyaProfile: React.FC<SadasyaProfileProps> = ({ member, onBack, onEdit, onDelete }) => {
    const { t, language } = useLanguage();
    const [workHistory, setWorkHistory] = useState<Complaint[]>([]);

    useEffect(() => {
        // Fetch complaints assigned to this member (assuming assignedTo might match member ID)
        const allComplaints = MockService.getComplaints();
        // Loose matching for now as Sadasya aren't strictly Users in this mock setup
        // matching by ID or even specific tag if we implemented that. 
        // For now, simple ID match.
        const history = allComplaints.filter(c => c.assignedTo === member.id);
        setWorkHistory(history);
    }, [member]);

    const getDisplayName = (m: Sadasya) => {
        if (language === 'mr') {
            return m.name_marathi || m.name || m.name_english;
        }
        return m.name_english || m.name;
    };

    const getDisplayAddress = (m: Sadasya) => {
        if (language === 'mr') {
            return m.address_marathi || m.address || m.address_english;
        }
        return m.address_english || m.address;
    };

    const getGenderDisplay = (gender?: string) => {
        if (!gender) return '';
        return gender === 'M' ? t('voter_profile.gender_male') : gender === 'F' ? t('voter_profile.gender_female') : 'Other';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Resolved': return 'bg-green-100 text-green-800';
            case 'Closed': return 'bg-gray-100 text-gray-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
            <button
                onClick={onBack}
                className="ns-btn-ghost px-0 py-0 text-slate-600 hover:text-brand-700 mb-4"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> {t('voter_profile.back_to_search') || 'Back to List'}
            </button>

            {/* Profile Header */}
            <div className="ns-card overflow-hidden">
                <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-br from-brand-50 to-white border-b border-slate-200/70">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 border border-brand-100 shadow-sm">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{getDisplayName(member)}</h1>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 mt-2">
                                <span className="ns-badge border-brand-100 bg-white text-brand-800">
                                    {member.isVoter ? t('sadasya.is_voter') : t('sadasya.is_member')}
                                </span>
                                {member.age > 0 && <span>{t('voter_profile.age')}: {member.age}</span>}
                                <span>{getGenderDisplay(member.gender)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onEdit(member)}
                            className="ns-btn-primary bg-brand-600 hover:bg-brand-700 text-white"
                        >
                            <Edit2 className="w-4 h-4 mr-1" />
                            {t('sadasya.edit_modal_title') || 'Edit'}
                        </button>
                        {/* 
                         <button
                            onClick={() => onDelete(member.id, member.name)}
                             className="ns-btn-danger"
                        >
                             <Trash2 className="w-4 h-4" />
                         </button>
                        */}
                        <button
                            onClick={() => onDelete(member.id, member.name)}
                            className="ns-btn-ghost text-red-600 hover:bg-red-50 border border-red-200"
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                        </button>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('voter_profile.contact_address')}</h3>
                        <div className="flex items-start space-x-3">
                            <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-slate-900">{getDisplayAddress(member)}</p>
                                {member.ward && <p className="text-sm text-slate-500 mt-1">{t('voter_profile.ward')} {member.ward}</p>}
                                {member.area && <p className="text-sm text-slate-500">{member.area}</p>}
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Phone className="w-5 h-5 text-slate-400" />
                            <p className="text-slate-900">{member.mobile || t('voter_profile.no_mobile')}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('voter_profile.service_history_stats')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="ns-card-muted p-4 text-center">
                                <p className="text-2xl font-bold text-brand-700">{workHistory.length}</p>
                                <p className="text-xs text-slate-500">{t('voter_profile.total_requests')}</p>
                            </div>
                            <div className="ns-card-muted p-4 text-center">
                                <p className="text-2xl font-bold text-green-600">
                                    {workHistory.filter(c => c.status === 'Resolved' || c.status === 'Closed').length}
                                </p>
                                <p className="text-xs text-slate-500">{t('voter_profile.solved')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Work History */}
            <h2 className="text-xl font-bold text-slate-900 pt-4">{t('voter_profile.service_history')}</h2>
            <div className="ns-card divide-y divide-slate-200/70">
                {workHistory.length > 0 ? (
                    workHistory.map((complaint) => (
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
        </div>
    );
};

export default SadasyaProfile;
