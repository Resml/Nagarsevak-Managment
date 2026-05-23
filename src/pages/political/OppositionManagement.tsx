import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { toast } from 'sonner';
import { 
    Users, Plus, Search, MapPin, Phone, Tag, 
    Calendar, Trash2, Edit2, AlertCircle, X, 
    BookOpen, Briefcase, FileText, ChevronRight, Play
} from 'lucide-react';
import { format } from 'date-fns';

const OppositionManagement = () => {
    const { t } = useLanguage();
    const { tenantId } = useTenant();
    const isMr = t('common.welcome') !== 'Welcome';
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [partyFilter, setPartyFilter] = useState('');
    const [areaFilter, setAreaFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    // Modal & Form State
    const [showFormModal, setShowFormModal] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [teamModalTab, setTeamModalTab] = useState<'link' | 'create'>('link');
    const [selectedWorkerToLink, setSelectedWorkerToLink] = useState('');
    const [selectedMember, setSelectedMember] = useState<any | null>(null);
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

    const [formState, setFormState] = useState({
        name: '',
        mobile: '',
        party: '',
        role: '',
        area: '',
        strongholds: '',
        notes: '',
        is_candidate: false,
        constituency: '',
        opposing_candidate: '',
        candidacy_status: 'Declared',
        candidate_id: ''
    });

    const [quickWorkerForm, setQuickWorkerForm] = useState({
        name: '',
        mobile: '',
        party: '',
        role: '',
        area: '',
        notes: ''
    });

    const [activityForm, setActivityForm] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        title: '',
        description: '',
        location: ''
    });

    const [saving, setSaving] = useState(false);
    const [savingActivity, setSavingActivity] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

    useEffect(() => {
        fetchOppositionKaryakartas();
    }, []);

    const fetchOppositionKaryakartas = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('opposition_karyakartas')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMembers(data || []);
        } catch (err) {
            console.error('Error fetching opposition karyakartas:', err);
            // Fallback empty list if table not migrated yet
            setMembers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const strongholdList = formState.strongholds
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            const payload = {
                name: formState.name,
                mobile: formState.mobile || null,
                party: formState.party,
                role: formState.role || null,
                area: formState.area || null,
                strongholds: strongholdList,
                notes: formState.notes || null,
                is_candidate: formState.is_candidate,
                constituency: formState.is_candidate ? (formState.constituency || null) : null,
                opposing_candidate: formState.is_candidate ? (formState.opposing_candidate || null) : null,
                candidacy_status: formState.is_candidate ? formState.candidacy_status : null,
                candidate_id: !formState.is_candidate ? (formState.candidate_id || null) : null,
                tenant_id: tenantId
            };

            if (editingMemberId) {
                const { error } = await supabase
                    .from('opposition_karyakartas')
                    .update(payload)
                    .eq('id', editingMemberId);
                if (error) throw error;
                toast.success(isMr ? 'विरोधी सदस्याची माहिती यशस्वीरित्या अद्ययावत केली!' : 'Opposition member updated successfully!');
            } else {
                const { error } = await supabase
                    .from('opposition_karyakartas')
                    .insert([payload]);
                if (error) throw error;
                toast.success(isMr ? 'विरोधी सदस्य यशस्वीरित्या जोडला गेला!' : 'Opposition member added successfully!');
            }

            setShowFormModal(false);
            resetForm();
            fetchOppositionKaryakartas();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Failed to save member details.');
        } finally {
            setSaving(false);
        }
    };

    const handleEditClick = (member: any) => {
        setFormState({
            name: member.name,
            mobile: member.mobile || '',
            party: member.party,
            role: member.role || '',
            area: member.area || '',
            strongholds: (member.strongholds || []).join(', '),
            notes: member.notes || '',
            is_candidate: member.is_candidate || false,
            constituency: member.constituency || '',
            opposing_candidate: member.opposing_candidate || '',
            candidacy_status: member.candidacy_status || 'Declared',
            candidate_id: member.candidate_id || ''
        });
        setEditingMemberId(member.id);
        setShowFormModal(true);
    };

    const handleDeleteClick = (member: any) => {
        setDeleteTarget(member);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const { error } = await supabase
                .from('opposition_karyakartas')
                .delete()
                .eq('id', deleteTarget.id);
            if (error) throw error;
            toast.success('Opposition member deleted successfully!');
            setDeleteTarget(null);
            if (selectedMember?.id === deleteTarget.id) {
                setSelectedMember(null);
            }
            fetchOppositionKaryakartas();
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete member');
        }
    };

    const handleAddActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) return;
        setSavingActivity(true);
        try {
            const currentActivities = selectedMember.activities || [];
            const newActivity = {
                id: crypto.randomUUID(),
                date: activityForm.date,
                title: activityForm.title,
                description: activityForm.description,
                location: activityForm.location
            };

            const updatedActivities = [newActivity, ...currentActivities];

            const { error } = await supabase
                .from('opposition_karyakartas')
                .update({ activities: updatedActivities })
                .eq('id', selectedMember.id);

            if (error) throw error;

            toast.success('Activity logged successfully!');
            setShowActivityModal(false);
            setActivityForm({
                date: format(new Date(), 'yyyy-MM-dd'),
                title: '',
                description: '',
                location: ''
            });

            // Update local state
            const updatedMember = { ...selectedMember, activities: updatedActivities };
            setSelectedMember(updatedMember);
            setMembers(prev => prev.map(m => m.id === selectedMember.id ? updatedMember : m));
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Failed to add activity.');
        } finally {
            setSavingActivity(false);
        }
    };

    const handleDeleteActivity = async (activityId: string) => {
        if (!selectedMember) return;
        try {
            const currentActivities = selectedMember.activities || [];
            const updatedActivities = currentActivities.filter((a: any) => a.id !== activityId);

            const { error } = await supabase
                .from('opposition_karyakartas')
                .update({ activities: updatedActivities })
                .eq('id', selectedMember.id);

            if (error) throw error;

            toast.success('Activity removed successfully!');
            const updatedMember = { ...selectedMember, activities: updatedActivities };
            setSelectedMember(updatedMember);
            setMembers(prev => prev.map(m => m.id === selectedMember.id ? updatedMember : m));
        } catch (err) {
            console.error(err);
            toast.error('Failed to remove activity');
        }
    };

    const getCandidateName = (candId: string) => {
        const cand = members.find(m => m.id === candId);
        return cand ? cand.name : '';
    };

    const getCandidacyStatusLabel = (status: string) => {
        if (!status) return '';
        switch(status) {
            case 'Declared': return t('opposition.status_declared') || 'Declared';
            case 'Contesting': return t('opposition.status_contesting') || 'Contesting';
            case 'Withdrawn': return t('opposition.status_withdrawn') || 'Withdrawn';
            case 'Won': return t('opposition.status_won') || 'Won';
            case 'Lost': return t('opposition.status_lost') || 'Lost';
            default: return status;
        }
    };

    const handleLinkWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWorkerToLink || !selectedMember) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('opposition_karyakartas')
                .update({ candidate_id: selectedMember.id })
                .eq('id', selectedWorkerToLink);
            if (error) throw error;
            
            toast.success(isMr ? 'कार्यकर्ता यशस्वीरित्या जोडला गेला!' : 'Worker linked successfully!');
            setShowTeamModal(false);
            setSelectedWorkerToLink('');
            fetchOppositionKaryakartas();
            
            // Update right-side panel live
            const updatedMembers = await supabase
                .from('opposition_karyakartas')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false });
            if (!updatedMembers.error) {
                setMembers(updatedMembers.data || []);
                const self = updatedMembers.data?.find(m => m.id === selectedMember.id);
                if (self) setSelectedMember(self);
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Failed to link worker.');
        } finally {
            setSaving(false);
        }
    };

    const handleQuickCreateWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) return;
        setSaving(true);
        try {
            const payload = {
                name: quickWorkerForm.name,
                mobile: quickWorkerForm.mobile || null,
                party: quickWorkerForm.party || selectedMember.party,
                role: quickWorkerForm.role || null,
                area: quickWorkerForm.area || null,
                notes: quickWorkerForm.notes || null,
                is_candidate: false,
                candidate_id: selectedMember.id,
                tenant_id: tenantId
            };
            
            const { error } = await supabase
                .from('opposition_karyakartas')
                .insert([payload]);
            if (error) throw error;
            
            toast.success(isMr ? 'नवीन कार्यकर्ता यशस्वीरित्या जोडला गेला!' : 'New worker created successfully!');
            setShowTeamModal(false);
            setQuickWorkerForm({
                name: '',
                mobile: '',
                party: '',
                role: '',
                area: '',
                notes: ''
            });
            fetchOppositionKaryakartas();
            
            // Update right-side panel live
            const updatedMembers = await supabase
                .from('opposition_karyakartas')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false });
            if (!updatedMembers.error) {
                setMembers(updatedMembers.data || []);
                const self = updatedMembers.data?.find(m => m.id === selectedMember.id);
                if (self) setSelectedMember(self);
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Failed to create worker.');
        } finally {
            setSaving(false);
        }
    };

    const handleUnlinkWorker = async (workerId: string) => {
        try {
            const { error } = await supabase
                .from('opposition_karyakartas')
                .update({ candidate_id: null })
                .eq('id', workerId);
            if (error) throw error;
            
            toast.success(isMr ? 'कार्यकर्ता यशस्वीरित्या वेगळा केला गेला!' : 'Worker unlinked successfully!');
            fetchOppositionKaryakartas();
            
            // Update right-side panel live
            const updatedMembers = await supabase
                .from('opposition_karyakartas')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false });
            if (!updatedMembers.error) {
                setMembers(updatedMembers.data || []);
                const self = updatedMembers.data?.find(m => m.id === selectedMember.id);
                if (self) setSelectedMember(self);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to unlink worker');
        }
    };

    const resetForm = () => {
        setFormState({
            name: '',
            mobile: '',
            party: '',
            role: '',
            area: '',
            strongholds: '',
            notes: '',
            is_candidate: false,
            constituency: '',
            opposing_candidate: '',
            candidacy_status: 'Declared',
            candidate_id: ''
        });
        setEditingMemberId(null);
    };

    const filteredMembers = members.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (member.role && member.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (member.notes && member.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (member.constituency && member.constituency.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (member.opposing_candidate && member.opposing_candidate.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesParty = !partyFilter || member.party === partyFilter;
        const matchesArea = !areaFilter || (member.area && member.area.toLowerCase().includes(areaFilter.toLowerCase()));

        let matchesType = true;
        if (typeFilter === 'candidate') {
            matchesType = member.is_candidate === true;
        } else if (typeFilter === 'worker') {
            matchesType = member.is_candidate !== true;
        }

        return matchesSearch && matchesParty && matchesArea && matchesType;
    });

    const getUniqueParties = () => {
        const parties = new Set<string>();
        members.forEach(m => { if (m.party) parties.add(m.party); });
        return Array.from(parties);
    };

    const totalWorkers = members.filter(m => !m.is_candidate).length;
    const totalCandidates = members.filter(m => m.is_candidate).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            {t('opposition.title') || 'Opposition Information'}
                            <div className="flex gap-2">
                                <span className="ns-badge bg-brand-50 text-brand-700 border-brand-200">
                                    {(t('opposition.workers') || 'Workers') + ': ' + totalWorkers}
                                </span>
                                <span className="ns-badge bg-brand-100 text-brand-800 border-brand-300">
                                    {(t('opposition.candidates') || 'Candidates') + ': ' + totalCandidates}
                                </span>
                            </div>
                        </h1>
                        <p className="text-sm text-slate-500">{t('opposition.subtitle') || 'Track and monitor opposition workers, strongholds, and key public campaigns'}</p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowFormModal(true);
                        }}
                        className="ns-btn-primary bg-brand-600 hover:bg-brand-700 text-white border-none font-bold shadow-sm rounded-lg"
                    >
                        <Plus className="w-4 h-4 mr-1" /> {t('opposition.add_member') || 'Add Opposition Member'}
                    </button>
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Main Search */}
                    <div className="md:col-span-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={t('opposition.search_placeholder') || 'Search by name, role, keywords...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="ns-input pl-9 w-full bg-white shadow-sm"
                        />
                    </div>

                    {/* Record Type Filter */}
                    <div className="md:col-span-3">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="ns-input w-full bg-white shadow-sm"
                        >
                            <option value="">{t('opposition.filter_type') || 'All Types'}</option>
                            <option value="worker">{t('opposition.worker') || 'Opposition Worker'}</option>
                            <option value="candidate">{t('opposition.candidate') || 'Opposition Candidate'}</option>
                        </select>
                    </div>

                    {/* Party Filter */}
                    <div className="md:col-span-3">
                        <select
                            value={partyFilter}
                            onChange={(e) => setPartyFilter(e.target.value)}
                            className="ns-input w-full bg-white shadow-sm"
                        >
                            <option value="">{t('opposition.filter_party') || 'All Opposition Parties'}</option>
                            {getUniqueParties().map((party) => (
                                <option key={party} value={party}>{party}</option>
                            ))}
                            <option value="INC">Congress (INC)</option>
                            <option value="NCP">NCP</option>
                            <option value="UBT">Shivsena (UBT)</option>
                            <option value="MNS">MNS</option>
                            <option value="BJP">BJP</option>
                            <option value="Independent">Independent</option>
                        </select>
                    </div>

                    {/* Area Filter */}
                    <div className="md:col-span-2 relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={t('opposition.filter_area') || 'Filter by Area'}
                            value={areaFilter}
                            onChange={(e) => setAreaFilter(e.target.value)}
                            className="ns-input pl-9 w-full bg-white shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Split Screen Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Workers/Candidates List - Left Side */}
                <div className={`space-y-4 ${selectedMember ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
                    {loading ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-xl"></div>)}
                        </div>
                    ) : filteredMembers.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {filteredMembers.map((member) => {
                                const isCandidate = member.is_candidate === true;
                                const isSelected = selectedMember?.id === member.id;
                                
                                return (
                                    <div
                                        key={member.id}
                                        onClick={() => setSelectedMember(member)}
                                        className={`ns-card p-5 hover:shadow-md transition-all cursor-pointer group relative border ${
                                            isCandidate 
                                                ? isSelected 
                                                    ? 'border-brand-400 bg-brand-50/20 ring-2 ring-brand-500 ring-inset' 
                                                    : 'border-brand-200 bg-brand-50/10 hover:bg-brand-50/20' 
                                                : isSelected 
                                                    ? 'border-brand-300 ring-2 ring-brand-400 ring-inset bg-brand-50/10' 
                                                    : 'border-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-colors ${
                                                    isCandidate 
                                                        ? 'bg-brand-100 text-brand-700 group-hover:bg-brand-200 group-hover:text-brand-800' 
                                                        : 'bg-slate-100 text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-700'
                                                }`}>
                                                    <Users className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors flex items-center gap-1.5">
                                                        {member.name}
                                                        {isCandidate && (
                                                            <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" title="Candidate"></span>
                                                        )}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500 mt-1">
                                                        <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">{member.party}</span>
                                                        <span className={`px-2 py-0.5 rounded-full ${
                                                            isCandidate 
                                                                ? 'bg-brand-600 text-white' 
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            {isCandidate 
                                                                ? (t('opposition.candidate') || 'Candidate') 
                                                                : (t('opposition.worker') || 'Worker')}
                                                        </span>
                                                        {member.role && (
                                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{member.role}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditClick(member);
                                                    }}
                                                    className="p-1 text-slate-400 hover:text-brand-600 rounded"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(member);
                                                    }}
                                                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-2 text-sm text-slate-600 border-t border-slate-50 pt-3">
                                            {member.mobile && (
                                                <div className="flex items-center gap-2 text-xs font-mono">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{member.mobile}</span>
                                                </div>
                                            )}
                                            {member.area && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{isMr ? 'मुख्य क्षेत्र' : 'Base Area'}: {member.area}</span>
                                                </div>
                                            )}
                                            
                                            {isCandidate && (
                                                <div className="space-y-1.5 bg-brand-50/40 p-2.5 rounded-lg border border-brand-100/50 mt-2 text-xs">
                                                    {member.constituency && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-slate-500">{t('opposition.constituency') || 'Constituency'}:</span>
                                                            <span className="font-bold text-slate-800">{member.constituency}</span>
                                                        </div>
                                                    )}
                                                    {member.opposing_candidate && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-slate-500">{t('opposition.opposing') || 'Opposing'}:</span>
                                                            <span className="font-bold text-slate-800">{member.opposing_candidate}</span>
                                                        </div>
                                                    )}
                                                    {member.candidacy_status && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-slate-500">{t('opposition.candidacy_status') || 'Status'}:</span>
                                                            <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                                                member.candidacy_status === 'Won' ? 'bg-green-100 text-green-800' :
                                                                member.candidacy_status === 'Lost' ? 'bg-slate-100 text-slate-700' :
                                                                member.candidacy_status === 'Withdrawn' ? 'bg-red-100 text-red-800' :
                                                                member.candidacy_status === 'Contesting' ? 'bg-brand-100 text-brand-800' :
                                                                'bg-brand-50 text-brand-700'
                                                            }`}>
                                                                {getCandidacyStatusLabel(member.candidacy_status)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {member.strongholds && member.strongholds.length > 0 && (
                                                <div className="flex items-start gap-1.5 mt-2">
                                                    <Tag className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                                    <div className="flex flex-wrap gap-1">
                                                        {member.strongholds.map((s: string, idx: number) => (
                                                            <span key={idx} className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded text-[10px] border border-slate-100 font-medium">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {member.activities && member.activities.length > 0 && (
                                            <div className="mt-3 flex items-center justify-between text-xs font-bold border-t border-slate-50 pt-2 text-brand-600 hover:text-brand-700">
                                                <span>{isMr ? 'मोहीम उपक्रम नोंद' : 'Recent Campaign Activity'}</span>
                                                <span className="flex items-center gap-0.5">{isMr ? 'टाइमलाइन' : 'Timeline'} <ChevronRight className="w-3 h-3" /></span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-16 text-center text-slate-500 ns-card border-dashed p-10">
                            {t('opposition.no_records') || 'No opposition members found. Use the Add button to create a record.'}
                        </div>
                    )}
                </div>

                {/* Campaign Timeline Details - Right Side */}
                {selectedMember && (
                    <div className={`lg:col-span-5 bg-white border rounded-xl shadow-sm p-6 space-y-6 animate-in slide-in-from-right-5 duration-200 sticky top-48 ${
                        selectedMember.is_candidate ? 'border-brand-200 ring-1 ring-brand-100/50 bg-gradient-to-b from-white to-brand-50/[0.03]' : 'border-slate-200'
                    }`}>
                        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                            <div>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                                    selectedMember.is_candidate ? 'bg-brand-600 text-white border border-brand-700' : 'bg-brand-100 text-brand-700 border border-brand-200'
                                }`}>{selectedMember.party}</span>
                                <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedMember.name}</h3>
                                <p className="text-sm text-slate-500">
                                    {selectedMember.is_candidate 
                                        ? (t('opposition.candidate') || 'Opposition Candidate') 
                                        : (selectedMember.role || t('opposition.worker') || 'Opposition Worker')}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedMember(null)}
                                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {!selectedMember.is_candidate && selectedMember.candidate_id && (
                            <div className="bg-brand-50/30 p-3 rounded-xl border border-brand-100 text-xs text-slate-700 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-brand-500" />
                                    <span>
                                        {t('opposition.belongs_to_candidate') || 'Belongs to Candidate'}:{' '}
                                        <span
                                            onClick={() => {
                                                const cand = members.find(m => m.id === selectedMember.candidate_id);
                                                if (cand) setSelectedMember(cand);
                                            }}
                                            className="font-bold text-brand-700 hover:underline cursor-pointer"
                                        >
                                            {getCandidateName(selectedMember.candidate_id)}
                                        </span>
                                    </span>
                                </span>
                            </div>
                        )}

                        {selectedMember.is_candidate && (
                            <div className="grid grid-cols-2 gap-4 bg-brand-50/50 p-4 rounded-xl border border-brand-100 text-sm">
                                <div>
                                    <span className="text-xs text-slate-500 font-semibold block">{t('opposition.constituency') || 'Constituency'}</span>
                                    <span className="font-bold text-slate-800">{selectedMember.constituency || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 font-semibold block">{t('opposition.opposing') || 'Opposing'}</span>
                                    <span className="font-bold text-slate-800">{selectedMember.opposing_candidate || '-'}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-xs text-slate-500 font-semibold block">{t('opposition.candidacy_status') || 'Status'}</span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold font-mono mt-1 ${
                                        selectedMember.candidacy_status === 'Won' ? 'bg-green-100 text-green-800' :
                                        selectedMember.candidacy_status === 'Lost' ? 'bg-slate-100 text-slate-700' :
                                        selectedMember.candidacy_status === 'Withdrawn' ? 'bg-red-100 text-red-800' :
                                        selectedMember.candidacy_status === 'Contesting' ? 'bg-brand-100 text-brand-800' :
                                        'bg-brand-50 text-brand-700'
                                    }`}>
                                        {getCandidacyStatusLabel(selectedMember.candidacy_status)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Candidate's Team Section */}
                        {selectedMember.is_candidate && (
                            <div className="space-y-4 border-t border-slate-100 pt-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-slate-800 text-base">
                                        {t('opposition.team_section_title') || "Candidate's Team / Members"}
                                    </h4>
                                    <button
                                        onClick={() => {
                                            setSelectedWorkerToLink('');
                                            setTeamModalTab('link');
                                            setShowTeamModal(true);
                                        }}
                                        className="ns-btn-soft text-xs py-1 px-3 flex items-center gap-1"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        {t('opposition.add_team_member') || 'Add Team Member'}
                                    </button>
                                </div>

                                {members.filter(m => !m.is_candidate && m.candidate_id === selectedMember.id).length > 0 ? (
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                        {members
                                            .filter(m => !m.is_candidate && m.candidate_id === selectedMember.id)
                                            .map((worker) => (
                                                <div
                                                    key={worker.id}
                                                    className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-150 rounded-xl transition-all group/team"
                                                >
                                                    <div
                                                        onClick={() => setSelectedMember(worker)}
                                                        className="flex items-center space-x-3 cursor-pointer flex-1"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-brand-50 text-brand-700">
                                                            <Users className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <h5 className="font-bold text-xs text-slate-805 hover:text-brand-600 transition-colors">
                                                                {worker.name}
                                                            </h5>
                                                            {worker.role && (
                                                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                                                    {worker.role}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUnlinkWorker(worker.id);
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors opacity-0 group-hover/team:opacity-100"
                                                        title={isMr ? "टीममधून काढा" : "Remove from team"}
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-slate-400 italic text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                        {t('opposition.no_team_members') || 'No team members assigned to this candidate.'}
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedMember.notes && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    {t('opposition.description_strategy') || 'Description & Strategy'}
                                </h4>
                                <p className="text-sm text-slate-700">{selectedMember.notes}</p>
                            </div>
                        )}

                        {/* Activity Timeline */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-slate-800 text-base">{t('opposition.timeline_title') || 'Campaign Activity Log'}</h4>
                                <button
                                    onClick={() => setShowActivityModal(true)}
                                    className="ns-btn-soft text-xs py-1 px-3"
                                >
                                    {t('opposition.log_activity') || 'Log Activity'}
                                </button>
                            </div>

                            {/* Timeline */}
                            <div className="space-y-6 pl-3 relative border-l border-slate-200 ml-3 pt-2 pb-2">
                                {selectedMember.activities && selectedMember.activities.length > 0 ? (
                                    selectedMember.activities.map((activity: any) => (
                                        <div key={activity.id} className="relative space-y-1">
                                            {/* Bullet */}
                                            <div className="absolute -left-[19px] top-1.5 w-3.5 h-3.5 border-2 border-white rounded-full bg-brand-500"></div>
                                            
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-400 font-semibold">{activity.date}</span>
                                                <button
                                                    onClick={() => handleDeleteActivity(activity.id)}
                                                    className="p-1 text-slate-300 hover:text-red-600 rounded hover:bg-red-50/50 transition-colors"
                                                    title="Delete activity"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <h5 className="font-bold text-sm text-slate-800">{activity.title}</h5>
                                            {activity.location && (
                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {activity.location}
                                                </p>
                                            )}
                                            <p className="text-xs text-slate-600 pt-1 leading-relaxed">{activity.description}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-slate-400 italic text-xs -ml-3">
                                        {t('opposition.no_activities') || 'No recent public activity logged.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Worker Form Modal */}
            {showFormModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-slate-150 pb-3 mb-4">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingMemberId 
                                    ? (t('opposition.edit_member') || 'Edit Opposition Details') 
                                    : (t('opposition.add_member') || 'Add Opposition Member')}
                            </h3>
                            <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveMember} className="space-y-4">
                            {/* Record Type Selector */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    {t('opposition.record_type') || 'Record Type'}
                                </label>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setFormState({ ...formState, is_candidate: false })}
                                        className={`py-1.5 px-3 rounded-md text-xs font-bold transition-all ${
                                            !formState.is_candidate
                                                ? 'bg-white text-brand-700 shadow-sm border border-brand-200'
                                                : 'text-slate-600 hover:text-slate-900 bg-transparent border border-transparent'
                                        }`}
                                    >
                                        {t('opposition.worker') || 'Opposition Worker'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormState({ ...formState, is_candidate: true })}
                                        className={`py-1.5 px-3 rounded-md text-xs font-bold transition-all ${
                                            formState.is_candidate
                                                ? 'bg-brand-600 text-white shadow-sm border border-brand-700'
                                                : 'text-slate-600 hover:text-slate-900 bg-transparent border border-transparent'
                                        }`}
                                    >
                                        {t('opposition.candidate') || 'Opposition Candidate'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    {t('opposition.name') || 'Full Name'}
                                </label>
                                <input
                                    type="text" required
                                    className="ns-input"
                                    value={formState.name}
                                    onChange={e => setFormState({ ...formState, name: e.target.value })}
                                    placeholder={isMr ? "उदा. आनंद शिंदे" : "e.g. Anand Shinde"}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {t('opposition.party') || 'Party / Affiliation'}
                                    </label>
                                    <input
                                        type="text" required
                                        className="ns-input"
                                        value={formState.party}
                                        onChange={e => setFormState({ ...formState, party: e.target.value })}
                                        placeholder={isMr ? "उदा. आयएनसी, एनसीपी, यूबीटी" : "e.g. INC, NCP, UBT, MNS"}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {t('opposition.role') || 'Designation / Role'}
                                    </label>
                                    <input
                                        type="text"
                                        className="ns-input"
                                        value={formState.role}
                                        onChange={e => setFormState({ ...formState, role: e.target.value })}
                                        placeholder={formState.is_candidate ? (isMr ? "उदा. आमदार उमेदवार" : "e.g. MLA Candidate") : (isMr ? "उदा. प्रभाग अध्यक्ष" : "e.g. Ward President")}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {t('opposition.mobile') || 'Mobile Number'}
                                    </label>
                                    <input
                                        type="tel"
                                        className="ns-input"
                                        value={formState.mobile}
                                        onChange={e => setFormState({ ...formState, mobile: e.target.value.replace(/\D/g, '') })}
                                        maxLength={10}
                                        placeholder={isMr ? "१०-अंकी मोबाईल क्रमांक" : "10-digit number"}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {t('opposition.area') || 'Base Operating Area'}
                                    </label>
                                    <input
                                        type="text"
                                        className="ns-input"
                                        value={formState.area}
                                        onChange={e => setFormState({ ...formState, area: e.target.value })}
                                        placeholder={isMr ? "उदा. गणेश नगर" : "e.g. Ganesh Nagar"}
                                    />
                                </div>
                            </div>

                            {/* Candidate-specific fields */}
                            {formState.is_candidate && (
                                <div className="p-4 bg-brand-50/50 border border-brand-200 rounded-xl space-y-4 animate-in fade-in duration-200">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                                {t('opposition.constituency') || 'Candidacy Constituency/Ward'}
                                            </label>
                                            <input
                                                type="text"
                                                className="ns-input bg-white"
                                                value={formState.constituency}
                                                onChange={e => setFormState({ ...formState, constituency: e.target.value })}
                                                placeholder={isMr ? "उदा. प्रभाग १२ किंवा विधानसभा २१" : "e.g. Ward 12 or Assembly 21"}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                                {t('opposition.opposing') || 'Opposing Candidate'}
                                            </label>
                                            <input
                                                type="text"
                                                className="ns-input bg-white"
                                                value={formState.opposing_candidate}
                                                onChange={e => setFormState({ ...formState, opposing_candidate: e.target.value })}
                                                placeholder={isMr ? "उदा. राजेश पाटील" : "e.g. Rajesh Patil"}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            {t('opposition.candidacy_status') || 'Candidacy Status'}
                                        </label>
                                        <select
                                            className="ns-input bg-white"
                                            value={formState.candidacy_status}
                                            onChange={e => setFormState({ ...formState, candidacy_status: e.target.value })}
                                        >
                                            <option value="Declared">{t('opposition.status_declared') || 'Declared'}</option>
                                            <option value="Contesting">{t('opposition.status_contesting') || 'Contesting'}</option>
                                            <option value="Withdrawn">{t('opposition.status_withdrawn') || 'Withdrawn'}</option>
                                            <option value="Won">{t('opposition.status_won') || 'Won'}</option>
                                            <option value="Lost">{t('opposition.status_lost') || 'Lost'}</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Belonging Candidate dropdown (only for non-candidates) */}
                            {!formState.is_candidate && (
                                <div className="animate-in fade-in duration-200">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {t('opposition.belongs_to_candidate') || 'Belongs to Candidate'} <span className="text-xs text-slate-400">({isMr ? 'पर्यायी' : 'Optional'})</span>
                                    </label>
                                    <select
                                        className="ns-input bg-white w-full"
                                        value={formState.candidate_id}
                                        onChange={e => setFormState({ ...formState, candidate_id: e.target.value })}
                                    >
                                        <option value="">{t('opposition.unassigned') || 'Unassigned / Independent (स्वतंत्र कार्यकर्ता)'}</option>
                                        {members
                                            .filter(m => m.is_candidate)
                                            .map(cand => (
                                                <option key={cand.id} value={cand.id}>
                                                    {cand.name} - {cand.party} {cand.constituency ? `(${cand.constituency})` : ''}
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    {t('opposition.strongholds') || 'Strongholds / Highly Active Areas'} 
                                    <span className="ml-1 text-xs text-slate-400">({isMr ? 'स्वल्पविरामाने वेगळे करा' : 'Comma separated'})</span>
                                </label>
                                <input
                                    type="text"
                                    className="ns-input"
                                    value={formState.strongholds}
                                    onChange={e => setFormState({ ...formState, strongholds: e.target.value })}
                                    placeholder={isMr ? "उदा. प्रभाग १२ गल्ली ३, शिवाजी पार्क" : "e.g. Ward 12 Lane 3, Shivaji Park, Durga Nagar"}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    {t('opposition.notes') || 'Internal Notes / Tactical Strategy'}
                                </label>
                                <textarea
                                    rows={3}
                                    className="ns-input"
                                    value={formState.notes}
                                    onChange={e => setFormState({ ...formState, notes: e.target.value })}
                                    placeholder={isMr ? "येथे कोणतीही अंतर्गत प्रोफाइलिंग किंवा मुख्य मोहीम धोरण जोडा..." : "Add any internal profiling, strong voter links, or key campaign tactics here..."}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowFormModal(false)}
                                    className="ns-btn-ghost text-xs"
                                >
                                    {t('common.cancel') || 'Cancel'}
                                </button>
                                <button
                                    type="submit" disabled={saving}
                                    className="ns-btn-primary bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-6 text-xs border-none shadow-sm rounded-lg"
                                >
                                    {saving ? (isMr ? 'जतन करत आहे...' : 'Saving...') : (t('common.save') || 'Save Details')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Log Activity Modal */}
            {showActivityModal && selectedMember && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                            <h3 className="text-lg font-bold text-slate-900">
                                {isMr ? `${selectedMember.name} साठी उपक्रम नोंदवा` : `Log Activity for ${selectedMember.name}`}
                            </h3>
                            <button onClick={() => setShowActivityModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddActivity} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    {isMr ? 'उपक्रमाची तारीख' : 'Activity Date'}
                                </label>
                                <input
                                    type="date" required
                                    className="ns-input"
                                    value={activityForm.date}
                                    onChange={e => setActivityForm({ ...activityForm, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    {isMr ? 'मोहीम कार्यक्रम / कामाचे नाव' : 'Campaign Event / Work Title'}
                                </label>
                                <input
                                    type="text" required
                                    className="ns-input"
                                    value={activityForm.title}
                                    onChange={e => setActivityForm({ ...activityForm, title: e.target.value })}
                                    placeholder={isMr ? "उदा. युवकांसोबत कोपरा बैठक घेतली" : "e.g. Organised corner meeting with youth"}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    {isMr ? 'ठिकाण' : 'Location'}
                                </label>
                                <input
                                    type="text"
                                    className="ns-input"
                                    value={activityForm.location}
                                    onChange={e => setActivityForm({ ...activityForm, location: e.target.value })}
                                    placeholder={isMr ? "उदा. हनुमान मंदिर सभागृह" : "e.g. Hanuman Mandir Hall"}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    {isMr ? 'उपक्रमाचा तपशील' : 'Activity Description'}
                                </label>
                                <textarea
                                    rows={3} required
                                    className="ns-input"
                                    value={activityForm.description}
                                    onChange={e => setActivityForm({ ...activityForm, description: e.target.value })}
                                    placeholder={isMr ? "त्यांच्या सार्वजनिक मोहिमेचा किंवा विरोधातील कामाचा तपशील वर्णन करा..." : "Describe their public engagement or anti-campaigning details..."}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowActivityModal(false)}
                                    className="ns-btn-ghost text-xs"
                                >
                                    {t('common.cancel') || 'Cancel'}
                                </button>
                                <button
                                    type="submit" disabled={savingActivity}
                                    className="ns-btn-primary bg-brand-600 hover:bg-brand-700 text-white font-bold border-none py-2 px-6 text-xs shadow-sm rounded-lg"
                                >
                                    {savingActivity ? (isMr ? 'नोंदवत आहे...' : 'Logging...') : (t('opposition.log_activity') || 'Log Activity')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Team Member Modal */}
            {showTeamModal && selectedMember && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {teamModalTab === 'link' 
                                        ? (t('opposition.modal_link_title')?.replace('{name}', selectedMember.name) || `Link Existing Worker to ${selectedMember.name}`)
                                        : (t('opposition.modal_create_title')?.replace('{name}', selectedMember.name) || `Create New Worker for ${selectedMember.name}`)
                                    }
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {t('opposition.candidate') || 'Opposition Candidate'}: <span className="font-bold text-brand-700">{selectedMember.name}</span>
                                </p>
                            </div>
                            <button onClick={() => setShowTeamModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setTeamModalTab('link')}
                                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                                    teamModalTab === 'link'
                                        ? 'bg-brand-600 text-white shadow-sm border border-brand-700'
                                        : 'text-slate-600 hover:text-slate-900 bg-transparent border border-transparent'
                                }`}
                            >
                                {t('opposition.tab_link') || 'Link Existing Worker'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setTeamModalTab('create')}
                                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                                    teamModalTab === 'create'
                                        ? 'bg-brand-600 text-white shadow-sm border border-brand-700'
                                        : 'text-slate-600 hover:text-slate-900 bg-transparent border border-transparent'
                                }`}
                            >
                                {t('opposition.tab_create') || 'Create New Worker'}
                            </button>
                        </div>

                        {/* Tab Content */}
                        {teamModalTab === 'link' ? (
                            <form onSubmit={handleLinkWorker} className="space-y-4 pt-2">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {t('opposition.select_worker_label') || 'Select Opposition Worker'}
                                    </label>
                                    <select
                                        required
                                        value={selectedWorkerToLink}
                                        onChange={e => setSelectedWorkerToLink(e.target.value)}
                                        className="ns-input bg-white w-full"
                                    >
                                        <option value="">{t('opposition.select_worker_placeholder') || 'Choose an unassigned worker...'}</option>
                                        {members
                                            .filter(m => !m.is_candidate && !m.candidate_id)
                                            .map(worker => (
                                                <option key={worker.id} value={worker.id}>
                                                    {worker.name} {worker.role ? `(${worker.role})` : ''} - {worker.party}
                                                </option>
                                            ))
                                        }
                                    </select>
                                    {members.filter(m => !m.is_candidate && !m.candidate_id).length === 0 && (
                                        <p className="text-xs text-brand-700 mt-2 font-medium bg-brand-50 p-2 rounded-lg border border-brand-100">
                                            ⚠️ {t('opposition.unassigned_workers_empty') || 'No unassigned workers available. Create a new worker instead!'}
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowTeamModal(false)}
                                        className="ns-btn-ghost text-xs"
                                    >
                                        {t('common.cancel') || 'Cancel'}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving || !selectedWorkerToLink}
                                        className="ns-btn-primary bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-6 text-xs border-none shadow-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? (isMr ? 'जोडत आहे...' : 'Linking...') : (t('opposition.link_worker_btn') || 'Link Worker to Team')}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleQuickCreateWorker} className="space-y-4 pt-2">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {t('opposition.name') || 'Full Name'}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="ns-input"
                                        value={quickWorkerForm.name}
                                        onChange={e => setQuickWorkerForm({ ...quickWorkerForm, name: e.target.value })}
                                        placeholder={isMr ? "उदा. राहुल पाटील" : "e.g. Rahul Patil"}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            {t('opposition.party') || 'Party / Affiliation'}
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="ns-input bg-slate-50 text-slate-500"
                                            value={quickWorkerForm.party || selectedMember.party}
                                            onChange={e => setQuickWorkerForm({ ...quickWorkerForm, party: e.target.value })}
                                            placeholder={selectedMember.party}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            {t('opposition.role') || 'Designation / Role'}
                                        </label>
                                        <input
                                            type="text"
                                            className="ns-input"
                                            value={quickWorkerForm.role}
                                            onChange={e => setQuickWorkerForm({ ...quickWorkerForm, role: e.target.value })}
                                            placeholder={isMr ? "उदा. मोहीम सहाय्यक" : "e.g. Campaign Assistant"}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            {t('opposition.mobile') || 'Mobile Number'}
                                        </label>
                                        <input
                                            type="tel"
                                            className="ns-input"
                                            value={quickWorkerForm.mobile}
                                            onChange={e => setQuickWorkerForm({ ...quickWorkerForm, mobile: e.target.value.replace(/\D/g, '') })}
                                            maxLength={10}
                                            placeholder={isMr ? "१०-अंकी मोबाईल क्रमांक" : "10-digit number"}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            {t('opposition.area') || 'Base Operating Area'}
                                        </label>
                                        <input
                                            type="text"
                                            className="ns-input"
                                            value={quickWorkerForm.area}
                                            onChange={e => setQuickWorkerForm({ ...quickWorkerForm, area: e.target.value })}
                                            placeholder={isMr ? "उदा. शिवाजी चौक" : "e.g. Shivaji Chowk"}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {t('opposition.notes') || 'Internal Notes'}
                                    </label>
                                    <textarea
                                        rows={2}
                                        className="ns-input"
                                        value={quickWorkerForm.notes}
                                        onChange={e => setQuickWorkerForm({ ...quickWorkerForm, notes: e.target.value })}
                                        placeholder={isMr ? "जलद प्रोफाइलिंग नोंद..." : "Quick profiling note..."}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowTeamModal(false)}
                                        className="ns-btn-ghost text-xs"
                                    >
                                        {t('common.cancel') || 'Cancel'}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="ns-btn-primary bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-6 text-xs border-none shadow-sm rounded-lg"
                                    >
                                        {saving ? (isMr ? 'जतन करत आहे...' : 'Saving...') : (t('common.save') || 'Save Details')}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-sm overflow-hidden p-6 space-y-4 bg-white">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">
                                {t('opposition.delete_title') || 'Delete Opposition Record?'}
                            </h3>
                            <p className="text-slate-500 mt-2 text-sm">
                                {t('opposition.delete_confirm') 
                                    ? t('opposition.delete_confirm').replace('{name}', deleteTarget.name) 
                                    : `Are you sure you want to delete the record of ${deleteTarget.name}? This action cannot be undone.`}
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium text-sm"
                            >
                                {t('common.cancel') || 'Cancel'}
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                            >
                                {isMr ? 'हटवा' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OppositionManagement;
