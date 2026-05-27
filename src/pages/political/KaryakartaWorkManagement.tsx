import { useEffect, useState, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../services/supabaseClient';
import {
    Plus, CheckCircle, Clock, AlertCircle, X, Search, MapPin,
    Building2, Flag, Briefcase, Users, Phone, Eye, EyeOff,
    ChevronRight, FileText, Printer, CheckSquare, Calendar,
    BarChart2, ClipboardList, Filter, ArrowRight, Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { TranslatedText } from '../../components/TranslatedText';

type TeamTab = 'Office' | 'Cooperative' | 'Party';

const TABS: { id: TeamTab; labelEn: string; labelMr: string; icon: any; color: string; bg: string; border: string }[] = [
    {
        id: 'Office',
        labelEn: 'Office Team',
        labelMr: 'कार्यालय टीम',
        icon: Building2,
        color: 'text-violet-700',
        bg: 'bg-violet-50',
        border: 'border-violet-200',
    },
    {
        id: 'Cooperative',
        labelEn: 'Government Work',
        labelMr: 'शासकीय काम',
        icon: Briefcase,
        color: 'text-sky-700',
        bg: 'bg-sky-50',
        border: 'border-sky-200',
    },
    {
        id: 'Party',
        labelEn: 'Paksha Karyakarta',
        labelMr: 'पक्ष कार्यकर्ता',
        icon: Flag,
        color: 'text-brand-700',
        bg: 'bg-brand-50',
        border: 'border-brand-200',
    },
];

const STATUS_COLORS: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-700',
    Assigned: 'bg-sky-100 text-sky-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    InProgress: 'bg-blue-100 text-blue-700',
    Completed: 'bg-emerald-100 text-emerald-700',
    Resolved: 'bg-emerald-100 text-emerald-700',
    Closed: 'bg-slate-100 text-slate-600',
};

const PRIORITY_COLORS: Record<string, string> = {
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-amber-100 text-amber-700',
    Low: 'bg-green-100 text-green-700',
};

const KaryakartaWorkManagement = () => {
    const { language } = useLanguage();
    const { tenantId } = useTenant();

    const tr = (en: string, mr: string) => (language === 'mr' ? mr : en);

    const [activeTab, setActiveTab] = useState<TeamTab>('Office');
    const [allStaff, setAllStaff] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [nameSearch, setNameSearch] = useState('');
    const [areaSearch, setAreaSearch] = useState('');

    // Selected member for drilldown
    const [selectedMember, setSelectedMember] = useState<any | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<'tasks' | 'complaints'>('tasks');
    const detailsRef = useRef<HTMLDivElement>(null);

    // Quick task assign modal
    const [showQuickTaskModal, setShowQuickTaskModal] = useState(false);
    const [quickTaskStaff, setQuickTaskStaff] = useState<any | null>(null);
    const [savingTask, setSavingTask] = useState(false);
    const [quickTaskForm, setQuickTaskForm] = useState({
        title: '',
        description: '',
        priority: 'Medium' as 'Low' | 'Medium' | 'High',
        due_date: '',
        due_time: '',
        address: '',
    });

    // Workload report modal
    const [showReport, setShowReport] = useState(false);

    useEffect(() => {
        fetchAll();
    }, []);

    useEffect(() => {
        if (selectedMember && detailsRef.current) {
            setTimeout(() => {
                detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [selectedMember]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [staffRes, tasksRes, complaintsRes] = await Promise.all([
                supabase.from('staff').select('*').eq('tenant_id', tenantId).order('name'),
                supabase.from('tasks').select('*').eq('tenant_id', tenantId),
                supabase
                    .from('complaints')
                    .select('*, voter:voters(name_english, name_marathi, mobile)')
                    .eq('tenant_id', tenantId),
            ]);
            setAllStaff(staffRes.data || []);
            setTasks(tasksRes.data || []);
            setComplaints(complaintsRes.data || []);
        } catch (err) {
            console.error('Fetch error:', err);
            toast.error(tr('Failed to load data', 'डेटा लोड करण्यात अयशस्वी'));
        } finally {
            setLoading(false);
        }
    };

    // Staff filtered by current tab category
    const tabStaff = useMemo(() => {
        return allStaff
            .filter(s => (s.category || 'Office') === activeTab)
            .filter(s => {
                const matchesName =
                    !nameSearch ||
                    s.name.toLowerCase().includes(nameSearch.toLowerCase()) ||
                    (s.mobile || '').includes(nameSearch);
                const matchesArea =
                    !areaSearch ||
                    (s.area || '').toLowerCase().includes(areaSearch.toLowerCase());
                return matchesName && matchesArea;
            });
    }, [allStaff, activeTab, nameSearch, areaSearch]);

    // Stats for current tab (all staff in category, not filtered)
    const tabStaffAll = useMemo(
        () => allStaff.filter(s => (s.category || 'Office') === activeTab),
        [allStaff, activeTab]
    );

    const tabStaffIds = useMemo(() => tabStaffAll.map(s => s.id), [tabStaffAll]);

    const tabTasks = useMemo(
        () => tasks.filter(t => tabStaffIds.includes(t.assigned_staff_id)),
        [tasks, tabStaffIds]
    );
    const tabComplaints = useMemo(
        () => complaints.filter(c => tabStaffIds.includes(c.assigned_to)),
        [complaints, tabStaffIds]
    );

    const stats = useMemo(() => {
        const totalTasks = tabTasks.length;
        const completedTasks = tabTasks.filter(t => t.status === 'Completed').length;
        const inProgressTasks = tabTasks.filter(t => t.status === 'In Progress').length;
        const pendingTasks = tabTasks.filter(t => t.status === 'Pending').length;

        const totalComplaints = tabComplaints.length;
        const resolvedComplaints = tabComplaints.filter(
            c => c.status === 'Resolved' || c.status === 'Closed'
        ).length;
        const inProgressComplaints = tabComplaints.filter(c => c.status === 'InProgress').length;
        const pendingComplaints = tabComplaints.filter(
            c => c.status === 'Pending' || c.status === 'Assigned'
        ).length;

        return {
            totalLoad: totalTasks + totalComplaints,
            pendingLoad: pendingTasks + pendingComplaints,
            inProgressLoad: inProgressTasks + inProgressComplaints,
            completedLoad: completedTasks + resolvedComplaints,
            totalTasks,
            totalComplaints,
        };
    }, [tabTasks, tabComplaints]);

    const sortedStaff = useMemo(() => {
        return [...tabStaff].sort((a, b) => {
            const aLoad =
                tasks.filter(t => t.assigned_staff_id === a.id).length +
                complaints.filter(c => c.assigned_to === a.id).length;
            const bLoad =
                tasks.filter(t => t.assigned_staff_id === b.id).length +
                complaints.filter(c => c.assigned_to === b.id).length;
            return bLoad - aLoad;
        });
    }, [tabStaff, tasks, complaints]);

    const getStaffStats = (staffId: string) => {
        const mTasks = tasks.filter(t => t.assigned_staff_id === staffId);
        const mComplaints = complaints.filter(c => c.assigned_to === staffId);
        const mT_pending = mTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
        const mC_pending = mComplaints.filter(
            c => c.status === 'Pending' || c.status === 'Assigned' || c.status === 'InProgress'
        ).length;
        const totalAssigned = mTasks.length + mComplaints.length;
        const totalCompleted =
            mTasks.filter(t => t.status === 'Completed').length +
            mComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
        const progressPct =
            totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

        return {
            mTasks,
            mComplaints,
            mT_total: mTasks.length,
            mC_total: mComplaints.length,
            mT_pending,
            mC_pending,
            totalPending: mT_pending + mC_pending,
            totalAssigned,
            totalCompleted,
            progressPct,
        };
    };

    const handleAssignTask = async (taskId: string, staffId: string) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ assigned_staff_id: staffId || null })
                .eq('id', taskId);
            if (error) throw error;
            toast.success(tr('Task reassigned!', 'काम पुन्हा सोपवले!'));
            fetchAll();
        } catch (err) {
            toast.error(tr('Failed to assign task', 'काम सोपवण्यात अयशस्वी'));
        }
    };

    const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', taskId);
            if (error) throw error;
            toast.success(tr('Status updated!', 'स्थिती अद्यावत!'));
            fetchAll();
        } catch (err) {
            toast.error(tr('Failed to update status', 'स्थिती अद्यावत करण्यात अयशस्वी'));
        }
    };

    const handleUpdateComplaintStatus = async (complaintId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('complaints')
                .update({ status: newStatus })
                .eq('id', complaintId);
            if (error) throw error;
            toast.success(tr('Status updated!', 'स्थिती अद्यावत!'));
            fetchAll();
        } catch (err) {
            toast.error(tr('Failed to update status', 'स्थिती अद्यावत करण्यात अयशस्वी'));
        }
    };

    const handleCreateQuickTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickTaskStaff) return;
        setSavingTask(true);
        try {
            const payload = {
                title: quickTaskForm.title,
                description: quickTaskForm.description || '',
                priority: quickTaskForm.priority,
                due_date: quickTaskForm.due_date || null,
                due_time: quickTaskForm.due_time || null,
                address: quickTaskForm.address,
                status: 'Pending',
                assigned_staff_id: quickTaskStaff.id,
                tenant_id: tenantId,
            };
            const { error } = await supabase.from('tasks').insert([payload]);
            if (error) throw error;
            toast.success(
                tr(`Task assigned to ${quickTaskStaff.name}!`, `${quickTaskStaff.name} ला काम सोपवले!`)
            );
            setShowQuickTaskModal(false);
            setQuickTaskForm({
                title: '',
                description: '',
                priority: 'Medium',
                due_date: '',
                due_time: '',
                address: '',
            });
            fetchAll();
        } catch (err) {
            console.error(err);
            toast.error(tr('Failed to assign task', 'काम सोपवण्यात अयशस्वी'));
        } finally {
            setSavingTask(false);
        }
    };

    const currentTab = TABS.find(t => t.id === activeTab)!;

    const unassignedTasks = tasks.filter(t => !t.assigned_staff_id);
    const unassignedComplaints = complaints.filter(c => !c.assigned_to);

    // ───────────────────────── RENDER ─────────────────────────
    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <ClipboardList className="w-6 h-6 text-brand-600" />
                            {tr('Karyakarta Work Management', 'कार्यकर्ता काम व्यवस्थापन')}
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {tr(
                                'Monitor and assign work across Office, Government & Party teams',
                                'कार्यालय, शासकीय आणि पक्ष टीमला काम सोपवा व देखरेख करा'
                            )}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowReport(true)}
                            className="ns-btn-ghost border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-2 text-sm py-2 shadow-sm font-semibold text-slate-700"
                        >
                            <FileText className="w-4 h-4 text-slate-500" />
                            {tr('Workload Report', 'कार्यभार अहवाल')}
                        </button>
                    </div>
                </div>

                {/* ── Tab Navigation ── */}
                <div className="flex space-x-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        const count = allStaff.filter(s => (s.category || 'Office') === tab.id).length;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setSelectedMember(null);
                                    setNameSearch('');
                                    setAreaSearch('');
                                }}
                                className={`
                                    flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap
                                    ${isActive
                                        ? `${tab.bg} ${tab.color} shadow-sm border ${tab.border}`
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                    }
                                `}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? tab.color : 'text-slate-400'}`} />
                                <span>{language === 'mr' ? tab.labelMr : tab.labelEn}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? `${tab.bg} ${tab.color}` : 'bg-slate-100 text-slate-500'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* ── Filters ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={tr('Search name or mobile...', 'नाव किंवा मोबाईल शोधा...')}
                            value={nameSearch}
                            onChange={e => setNameSearch(e.target.value)}
                            className="ns-input pl-9 w-full bg-white shadow-sm"
                        />
                    </div>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={tr('Filter by area...', 'क्षेत्रानुसार फिल्टर...')}
                            value={areaSearch}
                            onChange={e => setAreaSearch(e.target.value)}
                            className="ns-input pl-9 w-full bg-white shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* ── Stats Dashboard ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    {
                        label: tr('Total Workload', 'एकूण कार्यभार'),
                        value: stats.totalLoad,
                        sub: `${stats.totalTasks} ${tr('Tasks', 'कामे')} · ${stats.totalComplaints} ${tr('Complaints', 'तक्रारी')}`,
                        color: 'text-slate-800',
                        accent: 'bg-slate-100',
                    },
                    {
                        label: tr('Pending', 'प्रलंबित'),
                        value: stats.pendingLoad,
                        sub: tr('Needs attention', 'लक्ष देणे आवश्यक'),
                        color: 'text-amber-600',
                        accent: 'bg-amber-50',
                    },
                    {
                        label: tr('In Progress', 'प्रगतीपथावर'),
                        value: stats.inProgressLoad,
                        sub: tr('Being worked on', 'काम सुरू आहे'),
                        color: 'text-blue-600',
                        accent: 'bg-blue-50',
                    },
                    {
                        label: tr('Completed', 'पूर्ण झाले'),
                        value: stats.completedLoad,
                        sub: tr('Done & closed', 'पूर्ण व बंद'),
                        color: 'text-emerald-600',
                        accent: 'bg-emerald-50',
                    },
                ].map(stat => (
                    <div
                        key={stat.label}
                        className={`${stat.accent} rounded-2xl p-5 border border-white/60 shadow-sm`}
                    >
                        <p className={`text-xs font-semibold ${stat.color} uppercase tracking-wide`}>
                            {stat.label}
                        </p>
                        <p className={`text-4xl font-black ${stat.color} mt-1`}>{stat.value}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-40 bg-white border border-slate-200 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : sortedStaff.length === 0 ? (
                <div className="py-20 text-center text-slate-400 ns-card border-dashed p-10">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-semibold text-slate-500">
                        {tr(
                            `No ${language === 'mr' ? currentTab.labelMr : currentTab.labelEn} members found.`,
                            `${currentTab.labelMr} मधील कोणतेही सदस्य आढळले नाहीत.`
                        )}
                    </p>
                    <p className="text-xs mt-1">
                        {tr(
                            'Add staff members from the Staff Management page.',
                            'कर्मचारी व्यवस्थापन पानावरून सदस्य जोडा.'
                        )}
                    </p>
                </div>
            ) : (
                <>
                    {/* ── Workload Matrix Table ── */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <BarChart2 className="w-4 h-4 text-brand-600" />
                                    {tr('Team Workload Monitor', 'टीम कार्यभार मॉनिटर')}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {tr(
                                        'Tasks & complaints assigned per member — click a row to view details',
                                        'प्रत्येक सदस्याला सोपवलेली कामे व तक्रारी — तपशील पाहण्यासाठी रांगेवर क्लिक करा'
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            {tr('Member', 'सदस्य')}
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                                            {tr('Role / Area', 'भूमिका / क्षेत्र')}
                                        </th>
                                        <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            {tr('Tasks', 'कामे')}
                                        </th>
                                        <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            {tr('Complaints', 'तक्रारी')}
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                                            {tr('Progress', 'प्रगती')}
                                        </th>
                                        <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            {tr('Actions', 'कृती')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {sortedStaff.map(member => {
                                        const s = getStaffStats(member.id);
                                        const isSelected = selectedMember?.id === member.id;
                                        return (
                                            <tr
                                                key={member.id}
                                                onClick={() => {
                                                    setSelectedMember(isSelected ? null : member);
                                                    setActiveDetailTab('tasks');
                                                }}
                                                className={`cursor-pointer transition-colors ${isSelected ? 'bg-brand-50/50 border-l-4 border-brand-500' : 'hover:bg-slate-50/60'}`}
                                            >
                                                {/* Member */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${currentTab.bg} ${currentTab.color}`}>
                                                            {member.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-900 text-sm"><TranslatedText text={member.name} isName={true} /></div>
                                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                                <Phone className="w-3 h-3" />
                                                                {member.mobile || '—'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Role / Area */}
                                                <td className="px-5 py-4 hidden md:table-cell">
                                                    <div className="text-xs font-medium text-slate-700"><TranslatedText text={member.role || '—'} /></div>
                                                    {member.area && (
                                                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                            <MapPin className="w-3 h-3" /> <TranslatedText text={member.area} />
                                                        </div>
                                                    )}
                                                </td>
                                                {/* Tasks */}
                                                <td className="px-5 py-4 text-center">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${s.mT_pending > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {s.mT_pending}
                                                        <span className="text-slate-400 font-normal"> / {s.mT_total}</span>
                                                    </span>
                                                </td>
                                                {/* Complaints */}
                                                <td className="px-5 py-4 text-center">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${s.mC_pending > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {s.mC_pending}
                                                        <span className="text-slate-400 font-normal"> / {s.mC_total}</span>
                                                    </span>
                                                </td>
                                                {/* Progress */}
                                                <td className="px-5 py-4 hidden lg:table-cell">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                                                style={{ width: `${s.progressPct}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-600">{s.progressPct}%</span>
                                                    </div>
                                                </td>
                                                {/* Actions */}
                                                <td className="px-5 py-4 text-center">
                                                    <div className="flex justify-center gap-2" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedMember(isSelected ? null : member);
                                                                setActiveDetailTab('tasks');
                                                            }}
                                                            className={`py-1.5 px-3 text-xs rounded-lg border font-semibold flex items-center gap-1 transition-colors ${isSelected ? 'bg-brand-100 text-brand-700 border-brand-200' : 'bg-slate-100 text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-700'}`}
                                                        >
                                                            {isSelected ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                            {isSelected ? tr('Hide', 'लपवा') : tr('View', 'पहा')}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setQuickTaskStaff(member);
                                                                setShowQuickTaskModal(true);
                                                            }}
                                                            className="py-1.5 px-3 text-xs rounded-lg bg-brand-600 text-white font-semibold flex items-center gap-1 hover:bg-brand-700 transition-colors shadow-sm"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            {tr('Assign', 'सोपवा')}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── Member Detail Drilldown ── */}
                    {selectedMember && (
                        <div ref={detailsRef} className="bg-white rounded-2xl border-2 border-brand-300 shadow-md overflow-hidden">
                            {/* Header */}
                            <div className="p-5 bg-gradient-to-r from-brand-600 to-brand-700 text-white flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-black text-lg">
                                        {selectedMember.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold"><TranslatedText text={selectedMember.name} isName={true} /></div>
                                        <div className="text-brand-100 text-sm">
                                            <TranslatedText text={selectedMember.role || tr('No role', 'भूमिका नाही')} />
                                            {selectedMember.area ? <> · <TranslatedText text={selectedMember.area} /></> : ''}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setQuickTaskStaff(selectedMember);
                                            setShowQuickTaskModal(true);
                                        }}
                                        className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {tr('Assign Task', 'काम सोपवा')}
                                    </button>
                                    <button
                                        onClick={() => setSelectedMember(null)}
                                        className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Mini Stats */}
                            {(() => {
                                const s = getStaffStats(selectedMember.id);
                                return (
                                    <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
                                        {[
                                            { label: tr('Total', 'एकूण'), value: s.totalAssigned, color: 'text-slate-700' },
                                            { label: tr('Pending', 'प्रलंबित'), value: s.totalPending, color: 'text-amber-600' },
                                            { label: tr('Completed', 'पूर्ण'), value: s.totalCompleted, color: 'text-emerald-600' },
                                            { label: tr('Progress', 'प्रगती'), value: `${s.progressPct}%`, color: 'text-brand-600' },
                                        ].map(item => (
                                            <div key={item.label} className="p-4 text-center">
                                                <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{item.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}

                            {/* Sub-tabs */}
                            <div className="flex border-b border-slate-200 px-5 pt-2">
                                {[
                                    { id: 'tasks' as const, labelEn: 'Tasks', labelMr: 'कामे' },
                                    { id: 'complaints' as const, labelEn: 'Complaints', labelMr: 'तक्रारी' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveDetailTab(tab.id)}
                                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px ${activeDetailTab === tab.id
                                            ? 'border-brand-500 text-brand-700'
                                            : 'border-transparent text-slate-500 hover:text-slate-800'
                                            }`}
                                    >
                                        {language === 'mr' ? tab.labelMr : tab.labelEn}
                                        <span className="ml-1.5 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                                            {tab.id === 'tasks'
                                                ? tasks.filter(t => t.assigned_staff_id === selectedMember.id).length
                                                : complaints.filter(c => c.assigned_to === selectedMember.id).length}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Task / Complaint List */}
                            <div className="p-5 space-y-3 max-h-[500px] overflow-y-auto">
                                {activeDetailTab === 'tasks' ? (
                                    (() => {
                                        const memberTasks = tasks.filter(t => t.assigned_staff_id === selectedMember.id);
                                        if (memberTasks.length === 0) {
                                            return (
                                                <div className="py-10 text-center text-slate-400">
                                                    <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                                    <p>{tr('No tasks assigned yet.', 'अजून कोणतेही काम सोपवले नाही.')}</p>
                                                </div>
                                            );
                                        }
                                        return memberTasks.map(task => (
                                            <div key={task.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-slate-800 text-sm"><TranslatedText text={task.title} /></div>
                                                        {task.description && (
                                                            <div className="text-xs text-slate-500 mt-1 line-clamp-2"><TranslatedText text={task.description} /></div>
                                                        )}
                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                            {task.priority && (
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${PRIORITY_COLORS[task.priority] || 'bg-slate-100 text-slate-600'}`}>
                                                                    {task.priority}
                                                                </span>
                                                            )}
                                                            {task.due_date && (
                                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 flex items-center gap-1">
                                                                    <Calendar className="w-2.5 h-2.5" />
                                                                    {task.due_date}
                                                                </span>
                                                            )}
                                                            {task.address && (
                                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 flex items-center gap-1">
                                                                    <MapPin className="w-2.5 h-2.5" />
                                                                    <TranslatedText text={task.address} />
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2 items-end shrink-0">
                                                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${STATUS_COLORS[task.status] || 'bg-slate-100 text-slate-600'}`}>
                                                            {task.status}
                                                        </span>
                                                        {task.status !== 'Completed' && (
                                                            <button
                                                                onClick={() =>
                                                                    handleUpdateTaskStatus(
                                                                        task.id,
                                                                        task.status === 'Pending' ? 'In Progress' : 'Completed'
                                                                    )
                                                                }
                                                                className="text-[10px] px-2 py-1 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors flex items-center gap-1"
                                                            >
                                                                <Zap className="w-2.5 h-2.5" />
                                                                {task.status === 'Pending' ? tr('Start', 'सुरू करा') : tr('Done', 'पूर्ण')}
                                                            </button>
                                                        )}
                                                        {/* Reassign */}
                                                        <select
                                                            value={task.assigned_staff_id || ''}
                                                            onChange={e => handleAssignTask(task.id, e.target.value)}
                                                            onClick={e => e.stopPropagation()}
                                                            className="text-[10px] border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 cursor-pointer hover:border-brand-300 focus:outline-none"
                                                        >
                                                            <option value="">{tr('Unassigned', 'न सोपवलेले')}</option>
                                                            {allStaff.map(s => (
                                                                <option key={s.id} value={s.id}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ));
                                    })()
                                ) : (
                                    (() => {
                                        const memberComplaints = complaints.filter(c => c.assigned_to === selectedMember.id);
                                        if (memberComplaints.length === 0) {
                                            return (
                                                <div className="py-10 text-center text-slate-400">
                                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                                    <p>{tr('No complaints assigned.', 'कोणत्याही तक्रारी सोपवल्या नाहीत.')}</p>
                                                </div>
                                            );
                                        }
                                        return memberComplaints.map(complaint => {
                                            const voterName = language === 'mr'
                                                ? complaint.voter?.name_marathi
                                                : complaint.voter?.name_english;
                                            return (
                                                <div key={complaint.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-semibold text-slate-800 text-sm"><TranslatedText text={complaint.title} /></div>
                                                            {voterName && (
                                                                <div className="text-xs text-slate-500 mt-0.5">
                                                                    {tr('From', 'कडून')}: <TranslatedText text={voterName} isName={true} />
                                                                </div>
                                                            )}
                                                            {complaint.description && (
                                                                <div className="text-xs text-slate-400 mt-1 line-clamp-1">
                                                                    <TranslatedText text={complaint.description} />
                                                                </div>
                                                            )}
                                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                                {complaint.type && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-sky-50 text-sky-700 border border-sky-100">
                                                                        <TranslatedText text={complaint.type} />
                                                                    </span>
                                                                )}
                                                                {complaint.area && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 flex items-center gap-1">
                                                                        <MapPin className="w-2.5 h-2.5" />
                                                                        <TranslatedText text={complaint.area} />
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-2 items-end shrink-0">
                                                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${STATUS_COLORS[complaint.status] || 'bg-slate-100 text-slate-600'}`}>
                                                                {complaint.status}
                                                            </span>
                                                            {complaint.status !== 'Resolved' && complaint.status !== 'Closed' && (
                                                                <button
                                                                    onClick={() =>
                                                                        handleUpdateComplaintStatus(
                                                                            complaint.id,
                                                                            complaint.status === 'Pending' || complaint.status === 'Assigned' ? 'InProgress' : 'Resolved'
                                                                        )
                                                                    }
                                                                    className="text-[10px] px-2 py-1 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors flex items-center gap-1"
                                                                >
                                                                    <Zap className="w-2.5 h-2.5" />
                                                                    {complaint.status === 'Pending' || complaint.status === 'Assigned'
                                                                        ? tr('Start', 'सुरू')
                                                                        : tr('Resolve', 'सोडवा')}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Unassigned Work Pool ── */}
                    {(unassignedTasks.length > 0 || unassignedComplaints.length > 0) && (
                        <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-amber-200 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                <div>
                                    <h3 className="font-bold text-amber-800 text-base">
                                        {tr('Unassigned Work Pool', 'न सोपवलेल्या कामांचा संच')}
                                    </h3>
                                    <p className="text-xs text-amber-600 mt-0.5">
                                        {tr(
                                            `${unassignedTasks.length} tasks & ${unassignedComplaints.length} complaints need assignment`,
                                            `${unassignedTasks.length} कामे व ${unassignedComplaints.length} तक्रारी सोपवणे बाकी आहे`
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Unassigned Tasks */}
                            {unassignedTasks.length > 0 && (
                                <div className="p-5 space-y-3">
                                    <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                                        {tr('Tasks without assignee', 'असोपवलेली कामे')}
                                    </h4>
                                    {unassignedTasks.slice(0, 5).map(task => (
                                        <div key={task.id} className="bg-white rounded-xl border border-amber-200 p-3 flex items-center justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="font-semibold text-slate-800 text-sm truncate"><TranslatedText text={task.title} /></div>
                                                <div className="flex gap-2 mt-1">
                                                    {task.priority && (
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${PRIORITY_COLORS[task.priority]}`}>
                                                            {task.priority}
                                                        </span>
                                                    )}
                                                    {task.due_date && (
                                                        <span className="text-[10px] text-slate-500">{task.due_date}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <select
                                                defaultValue=""
                                                onChange={e => { if (e.target.value) handleAssignTask(task.id, e.target.value); }}
                                                className="text-xs border border-amber-300 rounded-lg px-2 py-1.5 bg-white text-slate-700 cursor-pointer hover:border-brand-400 focus:outline-none min-w-[140px] font-medium"
                                            >
                                                <option value="">{tr('— Assign to —', '— सोपवा —')}</option>
                                                {allStaff.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                    {unassignedTasks.length > 5 && (
                                        <p className="text-xs text-amber-600 font-medium text-center">
                                            +{unassignedTasks.length - 5} {tr('more unassigned tasks', 'अधिक असोपवलेली कामे')}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Unassigned Complaints */}
                            {unassignedComplaints.length > 0 && (
                                <div className="px-5 pb-5 space-y-3 border-t border-amber-100 pt-4">
                                    <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                                        {tr('Complaints without assignee', 'असोपवलेल्या तक्रारी')}
                                    </h4>
                                    {unassignedComplaints.slice(0, 5).map(complaint => (
                                        <div key={complaint.id} className="bg-white rounded-xl border border-amber-200 p-3 flex items-center justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="font-semibold text-slate-800 text-sm truncate"><TranslatedText text={complaint.title} /></div>
                                                <div className="flex gap-2 mt-1">
                                                    {complaint.type && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-medium">
                                                            {complaint.type}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <select
                                                defaultValue=""
                                                onChange={e => {
                                                    if (e.target.value) {
                                                        supabase
                                                            .from('complaints')
                                                            .update({ assigned_to: e.target.value, status: 'Assigned' })
                                                            .eq('id', complaint.id)
                                                            .then(() => {
                                                                toast.success(tr('Complaint assigned!', 'तक्रार सोपवली!'));
                                                                fetchAll();
                                                            });
                                                    }
                                                }}
                                                className="text-xs border border-amber-300 rounded-lg px-2 py-1.5 bg-white text-slate-700 cursor-pointer hover:border-brand-400 focus:outline-none min-w-[140px] font-medium"
                                            >
                                                <option value="">{tr('— Assign to —', '— सोपवा —')}</option>
                                                {allStaff.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                    {unassignedComplaints.length > 5 && (
                                        <p className="text-xs text-amber-600 font-medium text-center">
                                            +{unassignedComplaints.length - 5} {tr('more unassigned complaints', 'अधिक असोपवलेल्या तक्रारी')}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ── Quick Task Assign Modal ── */}
            {showQuickTaskModal && quickTaskStaff && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-5 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    {tr('Assign New Task', 'नवीन काम सोपवा')}
                                </h2>
                                <p className="text-brand-100 text-sm mt-0.5">
                                    {tr('To', 'कडे')}: <span className="font-semibold text-white"><TranslatedText text={quickTaskStaff.name} isName={true} /></span>
                                </p>
                            </div>
                            <button
                                onClick={() => setShowQuickTaskModal(false)}
                                className="text-white/70 hover:text-white p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateQuickTask} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    {tr('Task Title', 'कामाचे शीर्षक')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={quickTaskForm.title}
                                    onChange={e => setQuickTaskForm({ ...quickTaskForm, title: e.target.value })}
                                    placeholder={tr('e.g. Fix street light in Ward 5', 'उदा. वॉर्ड ५ मधील दिवा दुरुस्त करा')}
                                    className="ns-input w-full"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {tr('Priority', 'प्राधान्य')}
                                    </label>
                                    <select
                                        value={quickTaskForm.priority}
                                        onChange={e =>
                                            setQuickTaskForm({ ...quickTaskForm, priority: e.target.value as any })
                                        }
                                        className="ns-input w-full"
                                    >
                                        <option value="Low">{tr('Low', 'कमी')}</option>
                                        <option value="Medium">{tr('Medium', 'मध्यम')}</option>
                                        <option value="High">{tr('High', 'उच्च')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {tr('Due Date', 'देय तारीख')}
                                    </label>
                                    <input
                                        type="date"
                                        value={quickTaskForm.due_date}
                                        onChange={e =>
                                            setQuickTaskForm({ ...quickTaskForm, due_date: e.target.value })
                                        }
                                        className="ns-input w-full"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    {tr('Location / Address', 'स्थान / पत्ता')}
                                </label>
                                <input
                                    type="text"
                                    value={quickTaskForm.address}
                                    onChange={e =>
                                        setQuickTaskForm({ ...quickTaskForm, address: e.target.value })
                                    }
                                    placeholder={tr('e.g. Near Ram Mandir', 'उदा. राम मंदिराजवळ')}
                                    className="ns-input w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    {tr('Description', 'तपशील')}
                                </label>
                                <textarea
                                    rows={3}
                                    value={quickTaskForm.description}
                                    onChange={e =>
                                        setQuickTaskForm({ ...quickTaskForm, description: e.target.value })
                                    }
                                    placeholder={tr('Brief details about the task...', 'कामाबद्दल थोडक्यात माहिती...')}
                                    className="ns-input w-full resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowQuickTaskModal(false)}
                                    className="flex-1 ns-btn-ghost border border-slate-200"
                                >
                                    {tr('Cancel', 'रद्द करा')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingTask}
                                    className="flex-1 ns-btn-primary bg-brand-600 hover:bg-brand-700 text-white border-none font-bold shadow-sm"
                                >
                                    {savingTask ? tr('Assigning...', 'सोपवत आहे...') : tr('Assign Task', 'काम सोपवा')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Workload Report Modal ── */}
            {showReport && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    {tr('Workload Report', 'कार्यभार अहवाल')} —{' '}
                                    {language === 'mr' ? currentTab.labelMr : currentTab.labelEn}
                                </h2>
                                <p className="text-xs text-slate-500">
                                    {tr('Generated on', 'तयार केले')}: {format(new Date(), 'dd MMM yyyy, hh:mm a')}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="ns-btn-ghost border border-slate-200 flex items-center gap-2 text-sm"
                                >
                                    <Printer className="w-4 h-4" />
                                    {tr('Print', 'प्रिंट')}
                                </button>
                                <button onClick={() => setShowReport(false)} className="text-slate-400 hover:text-slate-700 p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr>
                                        {[
                                            tr('Member', 'सदस्य'),
                                            tr('Role', 'भूमिका'),
                                            tr('Area', 'क्षेत्र'),
                                            tr('Tasks (P/T)', 'कामे (प्र/एकू)'),
                                            tr('Complaints (P/T)', 'तक्रारी (प्र/एकू)'),
                                            tr('Pending Load', 'प्रलंबित कार्यभार'),
                                            tr('Done', 'पूर्ण'),
                                            tr('Progress %', 'प्रगती %'),
                                        ].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {tabStaffAll.map(member => {
                                        const s = getStaffStats(member.id);
                                        return (
                                            <tr key={member.id} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 font-semibold text-slate-800 text-sm"><TranslatedText text={member.name} isName={true} /></td>
                                                <td className="px-4 py-3 text-sm text-slate-600"><TranslatedText text={member.role || '—'} /></td>
                                                <td className="px-4 py-3 text-sm text-slate-500"><TranslatedText text={member.area || '—'} /></td>
                                                <td className="px-4 py-3 text-sm font-medium text-center">
                                                    <span className={s.mT_pending > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                                                        {s.mT_pending}
                                                    </span>{' '}
                                                    / {s.mT_total}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-center">
                                                    <span className={s.mC_pending > 0 ? 'text-blue-600 font-bold' : 'text-slate-400'}>
                                                        {s.mC_pending}
                                                    </span>{' '}
                                                    / {s.mC_total}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${s.totalPending > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {s.totalPending}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="text-emerald-600 font-bold text-sm">{s.totalCompleted}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className="bg-emerald-500 h-full rounded-full"
                                                                style={{ width: `${s.progressPct}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-700">{s.progressPct}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {tabStaffAll.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">
                                                {tr('No members in this team.', 'या टीममध्ये कोणतेही सदस्य नाहीत.')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KaryakartaWorkManagement;
