import { useEffect, useState, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../services/supabaseClient';
import { type Staff } from '../../types/staff';
import { Plus, Trash2, Edit2, User, Phone, Briefcase, Tag, Building2, Flag, Wrench, Search, MapPin, Eye, EyeOff, LayoutGrid, FileText, Printer, CheckSquare, CheckCircle, Clock, AlertCircle, Calendar, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import StaffProfile from './StaffProfile';
import clsx from 'clsx';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { TranslatedText } from '../../components/TranslatedText';


const StaffList = () => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();

    const tr = (en: string, mr: string) => language === 'mr' ? mr : en;

    const translateRole = (role: string) => {
        if (language !== 'mr') return role;
        const mapping: Record<string, string> = {
            'Office Admin': 'कार्यालय प्रशासक',
            'Sanitation Worker': 'स्वच्छता कर्मचारी',
            'Staff': 'कर्मचारी',
            'Driver': 'चालक',
            'Peon': 'शिपाई',
            'Helper': 'मदतनीस',
            'Supervisor': 'पर्यवेक्षक',
            'Karyakarta': 'कार्यकर्ता'
        };
        return mapping[role] || role;
    };
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'Office' | 'Party' | 'Cooperative' | 'WorkManagement'>('Office');
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'report'>('grid');

    // Karyakarta Work Management State
    const [tasks, setTasks] = useState<any[]>([]);
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [selectedKaryakartaForTasks, setSelectedKaryakartaForTasks] = useState<Staff | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<'tasks' | 'complaints'>('tasks');
    const [showWorkloadReport, setShowWorkloadReport] = useState(false);
    const [showQuickTaskModal, setShowQuickTaskModal] = useState(false);
    const [quickTaskStaff, setQuickTaskStaff] = useState<Staff | null>(null);
    const [quickTaskForm, setQuickTaskForm] = useState({
        title: '',
        description: '',
        priority: 'Medium' as 'Low' | 'Medium' | 'High',
        due_date: '',
        due_time: '',
        address: ''
    });
    const [savingQuickTask, setSavingQuickTask] = useState(false);
    const detailsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedKaryakartaForTasks && detailsRef.current) {
            detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [selectedKaryakartaForTasks]);

    useEffect(() => {
        if (activeTab === 'WorkManagement') {
            fetchTasks();
        }
    }, [activeTab]);

    const fetchTasks = async () => {
        setLoadingTasks(true);
        try {
            // Fetch Tasks
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('*')
                .eq('tenant_id', tenantId);
            if (tasksError) throw tasksError;
            setTasks(tasksData || []);

            // Fetch Complaints and join voter info
            const { data: complaintsData, error: complaintsError } = await supabase
                .from('complaints')
                .select(`
                    *,
                    voter:voters (
                        name_english,
                        name_marathi,
                        mobile
                    )
                `)
                .eq('tenant_id', tenantId);
            if (complaintsError) throw complaintsError;
            setComplaints(complaintsData || []);
        } catch (err) {
            console.error('Error fetching tasks/complaints:', err);
        } finally {
            setLoadingTasks(false);
        }
    };

    const handleUpdateComplaintStatus = async (complaintId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('complaints')
                .update({ status: newStatus })
                .eq('id', complaintId);
            if (error) throw error;
            toast.success("Complaint status updated!");
            fetchTasks();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update complaint status");
        }
    };

    const handleAssignTask = async (taskId: string, staffId: string) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ assigned_staff_id: staffId || null })
                .eq('id', taskId);
            if (error) throw error;
            toast.success("Task assigned successfully!");
            fetchTasks();
        } catch (err) {
            console.error(err);
            toast.error("Failed to assign task");
        }
    };

    const handleAssignComplaint = async (complaintId: string, staffId: string) => {
        try {
            const { error } = await supabase
                .from('complaints')
                .update({ assigned_to: staffId || null, status: staffId ? 'Assigned' : 'Pending' })
                .eq('id', complaintId);
            if (error) throw error;
            toast.success("Complaint assigned successfully!");
            fetchTasks();
        } catch (err) {
            console.error(err);
            toast.error("Failed to assign complaint");
        }
    };

    const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', taskId);
            if (error) throw error;
            toast.success("Task status updated!");
            fetchTasks();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update status");
        }
    };

    const handleCreateQuickTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickTaskStaff) return;
        setSavingQuickTask(true);
        try {
            const payload = {
                title: quickTaskForm.title,
                description: quickTaskForm.description,
                priority: quickTaskForm.priority,
                due_date: quickTaskForm.due_date || null,
                due_time: quickTaskForm.due_time || null,
                address: quickTaskForm.address,
                status: 'Pending',
                assigned_staff_id: quickTaskStaff.id,
                tenant_id: tenantId
            };
            const { error } = await supabase.from('tasks').insert([payload]);
            if (error) throw error;
            toast.success("Task assigned successfully!");
            setShowQuickTaskModal(false);
            setQuickTaskForm({ title: '', description: '', priority: 'Medium', due_date: '', due_time: '', address: '' });
            fetchTasks();
        } catch (err) {
            console.error(err);
            toast.error("Failed to assign task");
        } finally {
            setSavingQuickTask(false);
        }
    };

    const AVAILABLE_PERMISSIONS = useMemo(() => [
        // Daily Work
        { id: 'complaints', label: t('permissions.complaints') },
        { id: 'letters', label: t('permissions.letters') },
        { id: 'tasks', label: t('permissions.tasks') },
        { id: 'visitors', label: t('permissions.visitors') },
        { id: 'schemes', label: t('permissions.schemes') },

        // Ward Info
        { id: 'ward_problems', label: t('permissions.ward_problems') },
        { id: 'work_history', label: t('permissions.work_history') },
        { id: 'improvements', label: t('permissions.improvements') },
        { id: 'provision', label: t('permissions.provision') },

        // Municipal
        { id: 'gb_register', label: t('permissions.gb_register') },
        { id: 'budget', label: t('permissions.budget') },

        // Gov Office
        { id: 'gov_office', label: t('permissions.gov_office') },

        // Media
        { id: 'social', label: t('permissions.social') },
        { id: 'newspaper', label: t('permissions.newspaper') },
        { id: 'bot', label: t('permissions.bot') },
        { id: 'ai_content', label: t('permissions.ai_content') },

        // Programs
        { id: 'events', label: t('permissions.events') },
        { id: 'gallery', label: t('permissions.gallery') },

        // Political
        { id: 'results', label: t('permissions.results') },
        { id: 'sadasya', label: t('permissions.sadasya') },
        { id: 'surveys', label: t('permissions.surveys') },
        { id: 'voters', label: t('permissions.voters') },
        { id: 'staff', label: t('permissions.staff') },
        { id: 'public_comm', label: t('permissions.public_comm') },
        { id: 'analysis', label: t('permissions.analysis') },
        { id: 'profile_settings', label: t('permissions.profile_settings') || 'Profile Settings' },
    ], [t]);

    const COMPLAINT_CATEGORIES = [
        { id: 'Road', label: 'Roads (रस्ते)' },
        { id: 'Water', label: 'Water Supply (पाणीपुरवठा)' },
        { id: 'StreetLight', label: 'Electricity/Street Lights (वीज/लाईट)' },
        { id: 'Cleaning', label: 'Cleaning/Waste (कचरा/स्वच्छता)' },
        { id: 'Drainage', label: 'Drainage (गटार/ड्रेनेज)' },
        { id: 'Other', label: 'Other (इतर)' }
    ];

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        user_email: '',
        password: '',
        role: '',
        area: '',
        category: 'Office' as 'Office' | 'Party' | 'Cooperative',
        keywords: '',
        categories: [] as string[],
        permissions: [] as string[]
    });
    const [showPassword, setShowPassword] = useState(false);

    // Search State
    const [nameSearch, setNameSearch] = useState('');
    const [areaSearch, setAreaSearch] = useState('');
    const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
    const areaWrapperRef = useRef<HTMLDivElement>(null);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (areaWrapperRef.current && !areaWrapperRef.current.contains(event.target as Node)) {
                setShowAreaSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const { data, error } = await supabase
                .from('staff')
                .select('*')
                .eq('tenant_id', tenantId) // Secured
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStaff(data || []);
        } catch (err) {
            console.error('Error fetching staff:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Merge manual input keywords with selected categories
            const manualKeywords = formData.keywords.split(',').map(k => k.trim()).filter(k => k);
            const finalKeywords = Array.from(new Set([...manualKeywords, ...formData.categories]));

            if (formData.mobile.length !== 10) {
                toast.error(t('staff.list.valid_mobile'));
                return;
            }
            const fullMobile = `+91${formData.mobile}`;

            if (editingStaffId) {
                // Update Logic (Existing staff)
                // Note: We are strictly updating profile details here, not auth credentials
                const { error } = await supabase
                    .from('staff')
                    .update({
                        name: formData.name,
                        mobile: fullMobile,
                        role: formData.role,
                        category: formData.category,
                        area: formData.area,
                        keywords: finalKeywords,
                        permissions: formData.permissions
                    })
                    .eq('id', editingStaffId)
                    .eq('tenant_id', tenantId); // Secured
                if (error) throw error;
                toast.success('Staff updated successfully');
            } else {
                // Insert Logic (New Staff with Login)
                if (!formData.user_email || !formData.password) {
                    toast.error('Email and Password are required for new staff');
                    return;
                }

                // Call Edge Function to create Auth User + Staff Record
                const { data, error } = await supabase.functions.invoke('create-staff-user', {
                    body: {
                        email: formData.user_email,
                        password: formData.password,
                        name: formData.name,
                        mobile: fullMobile,
                        role: formData.role,
                        tenant_id: tenantId,
                        area: formData.area,
                        category: formData.category,
                        keywords: finalKeywords,
                        permissions: formData.permissions
                    }
                });

                if (error) {
                    console.error('Edge Function Error:', error);
                    // Check for specific error messages from the function if possible
                    throw new Error(error.message || 'Failed to create staff user');
                }

                // If the function returns an error in the body (custom error handling)
                if (data && data.error) {
                    throw new Error(data.error);
                }

                toast.success(t('staff.list.success_add'));
            }

            setShowModal(false);
            setFormData({ name: '', mobile: '', user_email: '', password: '', role: '', area: '', category: 'Office', keywords: '', categories: [], permissions: [] });
            setEditingStaffId(null);
            fetchStaff();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || (editingStaffId ? 'Failed to update staff' : t('staff.list.error_add')));
        }
    };

    const handleEdit = (staffMember: Staff) => {
        setEditingStaffId(staffMember.id);
        const mobileNum = staffMember.mobile.replace('+91', '').replace('+91 ', '');

        // Split keywords into Categories and Manual
        const currentKeywords = staffMember.keywords || [];
        const foundCategories = currentKeywords.filter(k => COMPLAINT_CATEGORIES.some(c => c.id === k));
        const manualKeywords = currentKeywords.filter(k => !COMPLAINT_CATEGORIES.some(c => c.id === k));

        setFormData({
            name: staffMember.name,
            mobile: mobileNum,
            user_email: '', // Don't fetch email for now as it's in auth.users
            password: '',
            role: staffMember.role,
            area: staffMember.area || '',
            category: (staffMember.category as any) || 'Office',
            keywords: manualKeywords.join(', '),
            categories: foundCategories,
            permissions: staffMember.permissions || []
        });
        setShowModal(true);
        // We might want to keep the profile open or close it?
        // Usually modifying updates the profile underneath.
    };

    const handleDelete = (id: string) => {
        const staffMember = staff.find(s => s.id === id);
        if (staffMember) {
            setDeleteTarget(staffMember);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const { error } = await supabase.from('staff').delete().eq('id', deleteTarget.id).eq('tenant_id', tenantId); // Secured
            if (error) throw error;
            toast.success('Staff deleted successfully');
            setDeleteTarget(null);
            if (selectedStaff?.id === deleteTarget.id) {
                setSelectedStaff(null);
            }
            fetchStaff();
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete staff');
        }
    };

    // Filter logic:
    const staffInCurrentTab = activeTab === 'WorkManagement'
        ? staff
        : staff.filter(s => (s.category || 'Office') === activeTab);

    // Area Suggestions Logic
    const getAreaSuggestions = () => {
        const counts: Record<string, number> = {};
        staffInCurrentTab.forEach(item => {
            const val = item.area?.trim();
            if (val) counts[val] = (counts[val] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count);
    };

    const areaSuggestions = getAreaSuggestions();
    const filteredAreaSuggestions = areaSuggestions.filter(item =>
        !areaSearch || item.value.toLowerCase().includes(areaSearch.toLowerCase())
    ).slice(0, 10);

    const filteredStaff = staffInCurrentTab
        .filter(s => {
            const matchesName = s.name.toLowerCase().includes(nameSearch.toLowerCase()) ||
                s.mobile.includes(nameSearch);
            const matchesArea = !areaSearch || (s.area || '').toLowerCase().includes(areaSearch.toLowerCase());
            return matchesName && matchesArea;
        })
        .sort((a, b) => (a.area || '').localeCompare(b.area || ''));

    const renderContent = () => {
        if (activeTab === 'WorkManagement') {
            // Task calculations
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => t.status === 'Completed').length;
            const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
            const pendingTasks = tasks.filter(t => t.status === 'Pending').length;

            // Complaint calculations
            const totalComplaints = complaints.length;
            const resolvedComplaints = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
            const inProgressComplaints = complaints.filter(c => c.status === 'InProgress').length;
            const pendingComplaints = complaints.filter(c => c.status === 'Pending' || c.status === 'Assigned').length;

            // Grand totals
            const totalLoad = totalTasks + totalComplaints;
            const pendingLoad = pendingTasks + pendingComplaints;
            const inProgressLoad = inProgressTasks + inProgressComplaints;
            const completedLoad = completedTasks + resolvedComplaints;

            // Unassigned pools
            const unassignedTasks = tasks.filter(t => !t.assigned_staff_id);
            const unassignedComplaints = complaints.filter(c => !c.assigned_to);

            const sortedStaffByWorkload = [...staff].sort((a, b) => {
                const aTasks = tasks.filter(t => t.assigned_staff_id === a.id).length;
                const aComplaints = complaints.filter(c => c.assigned_to === a.id).length;
                const aTotal = aTasks + aComplaints;

                const bTasks = tasks.filter(t => t.assigned_staff_id === b.id).length;
                const bComplaints = complaints.filter(c => c.assigned_to === b.id).length;
                const bTotal = bTasks + bComplaints;

                if (bTotal !== aTotal) {
                    return bTotal - aTotal;
                }
                return (a.name || '').localeCompare(b.name || '');
            });

            if (showWorkloadReport) {
                return (
                    <div className="space-y-6 bg-white p-8 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-4 print:hidden">
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">{tr("Karyakarta Workload Report", "कार्यकर्ता कार्यभार अहवाल")}</h1>
                                <p className="text-xs text-slate-500">{tr("Printable workload status and completion rates", "छापण्यायोग्य कार्यभार स्थिती आणि पूर्णत्वाचा दर")}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="ns-btn-primary bg-brand-600 hover:bg-brand-700 text-white border-none flex items-center gap-2"
                                >
                                    <Printer className="w-4 h-4" /> {tr("Print", "प्रिंट करा")}
                                </button>
                                <button
                                    onClick={() => setShowWorkloadReport(false)}
                                    className="ns-btn-ghost border border-slate-200"
                                >
                                    {tr("Close Report", "अहवाल बंद करा")}
                                </button>
                            </div>
                        </div>

                        <div className="text-center space-y-2 py-4 hidden print:block border-b border-slate-200 mb-6">
                            <h1 className="text-3xl font-extrabold text-slate-900">{tr("Karyakarta Workload & Performance Report", "कार्यकर्ता कार्यभार आणि कामगिरी अहवाल")}</h1>
                            <p className="text-sm text-slate-500 font-mono">{tr("Date Generated", "अहवाल तारीख")}: {new Date().toLocaleString(language === 'mr' ? 'mr-IN' : 'en-US')}</p>
                            <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto pt-4 text-xs font-semibold">
                                <div className="border border-slate-100 p-2 rounded">{tr("Total Assigned", "एकूण सोपवलेले")}: {totalLoad}</div>
                                <div className="border border-slate-100 p-2 rounded">{tr("Pending Work", "प्रलंबित कामे")}: {pendingLoad}</div>
                                <div className="border border-slate-100 p-2 rounded">{tr("In Progress", "प्रगतीपथावर")}: {inProgressLoad}</div>
                                <div className="border border-slate-100 p-2 rounded">{tr("Completed Work", "पूर्ण झालेली कामे")}: {completedLoad}</div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                                <thead className="bg-slate-50 print:bg-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{tr("Karyakarta", "कार्यकर्ता")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{tr("Role", "भूमिका")}</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">{tr("Tasks (Pending/Total)", "कामे (प्रलंबित/एकूण)")}</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">{tr("Complaints (Pending/Total)", "तक्रारी (प्रलंबित/एकूण)")}</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">{tr("Total Pending Load", "एकूण प्रलंबित कार्यभार")}</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">{tr("Completed Load", "पूर्ण झालेला कार्यभार")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{tr("Progress", "प्रगती")}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {sortedStaffByWorkload.map((member) => {
                                        const memberTasks = tasks.filter(t => t.assigned_staff_id === member.id);
                                        const mT_pending = memberTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
                                        const mT_total = memberTasks.length;

                                        const memberComplaints = complaints.filter(c => c.assigned_to === member.id);
                                        const mC_pending = memberComplaints.filter(c => c.status === 'Pending' || c.status === 'Assigned' || c.status === 'InProgress').length;
                                        const mC_total = memberComplaints.length;

                                        const totalPending = mT_pending + mC_pending;
                                        const totalAssigned = mT_total + mC_total;
                                        const totalCompleted = memberTasks.filter(t => t.status === 'Completed').length + memberComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
                                        const progressPct = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

                                        return (
                                            <tr key={member.id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-4 text-sm font-bold text-slate-900"><TranslatedText text={member.name} isName={true} /></td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{translateRole(member.role)}</td>
                                                <td className="px-6 py-4 text-sm text-center font-medium text-slate-800">{mT_pending} / {mT_total}</td>
                                                <td className="px-6 py-4 text-sm text-center font-medium text-slate-800">{mC_pending} / {mC_total}</td>
                                                <td className="px-6 py-4 text-sm text-center font-bold text-amber-600">{totalPending}</td>
                                                <td className="px-6 py-4 text-sm text-center font-bold text-emerald-600">{totalCompleted}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-700 text-xs w-8">{progressPct}%</span>
                                                        <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200 print:hidden">
                                                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${progressPct}%` }}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            }

            return (
                <div className="space-y-6">
                    <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{tr("Karyakarta Work Management", "कार्यकर्ता काम व्यवस्थापन")}</h1>
                                <p className="text-sm text-gray-500">{tr("Monitor, track, and assign tasks to your team members", "तुमच्या टीममधील सदस्यांच्या कामांवर लक्ष ठेवा, ट्रॅक करा आणि कामे सोपवा")}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowWorkloadReport(true)}
                                    className="ns-btn-ghost border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-2 text-xs py-2 shadow-sm font-semibold text-slate-700"
                                >
                                    <FileText className="w-4 h-4 text-slate-500" /> {tr("Workload Report", "कार्यभार अहवाल")}
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 overflow-x-auto">
                            {[
                                { id: 'Office', label: t('staff.tabs.office'), icon: Building2 },
                                { id: 'Party', label: t('staff.tabs.party'), icon: Flag },
                                { id: 'WorkManagement', label: tr('Work Management', 'काम व्यवस्थापन'), icon: CheckSquare },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id as any);
                                        setSelectedKaryakartaForTasks(null);
                                    }}
                                    className={clsx(
                                        "flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                        activeTab === tab.id
                                            ? "bg-brand-50 text-brand-700 shadow-sm"
                                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                    )}
                                >
                                    <tab.icon className={clsx("w-4 h-4", activeTab === tab.id ? "text-brand-600" : "text-gray-400")} />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                            <p className="text-sm font-semibold text-slate-500">{tr("Total Workload", "एकूण कार्यभार")}</p>
                            <p className="text-3xl font-black text-slate-900 mt-1">{totalLoad}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{totalTasks} {tr("Tasks", "कामे")} · {totalComplaints} {tr("Complaints", "तक्रारी")}</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                            <p className="text-sm font-semibold text-amber-600">{tr("Pending Load", "प्रलंबित कार्यभार")}</p>
                            <p className="text-3xl font-black text-amber-600 mt-1">{pendingLoad}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{pendingTasks} {tr("Tasks", "कामे")} · {pendingComplaints} {tr("Complaints", "तक्रारी")}</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                            <p className="text-sm font-semibold text-blue-600">{tr("In Progress", "चालू कामे (प्रगतीपथावर)")}</p>
                            <p className="text-3xl font-black text-blue-600 mt-1">{inProgressLoad}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{inProgressTasks} {tr("Tasks", "कामे")} · {inProgressComplaints} {tr("Complaints", "तक्रारी")}</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                            <p className="text-sm font-semibold text-emerald-600">{tr("Completed Work", "पूर्ण झालेली कामे")}</p>
                            <p className="text-3xl font-black text-emerald-600 mt-1">{completedLoad}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{completedTasks} {tr("Tasks", "कामे")} · {resolvedComplaints} {tr("Complaints", "तक्रारी")}</p>
                        </div>
                    </div>

                    {/* Karyakarta Matrix */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">{tr("Team Workload Monitor", "टीम कार्यभार मॉनिटर")}</h3>
                            <p className="text-xs text-slate-500">{tr("Overview of combined Task and Complaint assignments per Karyakarta", "प्रत्येक कार्यकर्त्याला सोपवलेल्या एकूण कामे आणि तक्रारींचा आढावा")}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{tr("Karyakarta", "कार्यकर्ता")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{tr("Role", "भूमिका")}</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">{tr("Tasks (Pending/Total)", "कामे (प्रलंबित/एकूण)")}</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">{tr("Complaints (Pending/Total)", "तक्रारी (प्रलंबित/एकूण)")}</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">{tr("Total Pending Load", "एकूण प्रलंबित कार्यभार")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{tr("Overall Progress", "एकूण प्रगती")}</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">{tr("Actions", "कृती")}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {sortedStaffByWorkload.map((member) => {
                                        const memberTasks = tasks.filter(t => t.assigned_staff_id === member.id);
                                        const mT_pending = memberTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
                                        const mT_total = memberTasks.length;

                                        const memberComplaints = complaints.filter(c => c.assigned_to === member.id);
                                        const mC_pending = memberComplaints.filter(c => c.status === 'Pending' || c.status === 'Assigned' || c.status === 'InProgress').length;
                                        const mC_total = memberComplaints.length;

                                        const totalPending = mT_pending + mC_pending;
                                        const totalAssigned = mT_total + mC_total;
                                        const totalCompleted = memberTasks.filter(t => t.status === 'Completed').length + memberComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
                                        const progressPct = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

                                        return (
                                            <tr key={member.id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-4 text-sm font-bold text-slate-900"><TranslatedText text={member.name} isName={true} /></td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{translateRole(member.role)}</td>
                                                <td className="px-6 py-4 text-sm text-center font-medium text-slate-800">
                                                    <span className={clsx(mT_pending > 0 ? "text-amber-600 font-bold" : "text-slate-500")}>{mT_pending}</span> / {mT_total}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-center font-medium text-slate-800">
                                                    <span className={clsx(mC_pending > 0 ? "text-blue-600 font-bold" : "text-slate-500")}>{mC_pending}</span> / {mC_total}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-center font-black text-slate-900">
                                                    <span className={clsx(totalPending > 0 ? "bg-amber-50 border border-amber-200 text-amber-800 rounded px-2 py-0.5" : "text-slate-400 font-medium")}>
                                                        {totalPending}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
                                                        </div>
                                                        <span className="font-bold text-slate-700 text-xs">{progressPct}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-center flex justify-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedKaryakartaForTasks(member);
                                                            setActiveDetailTab('tasks');
                                                            setTimeout(() => {
                                                                if (detailsRef.current) {
                                                                    detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                                }
                                                            }, 100);
                                                        }}
                                                        className="ns-btn-ghost py-1 px-3 text-xs bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" /> {tr("View Workload", "कार्यभार पहा")}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setQuickTaskStaff(member);
                                                            setShowQuickTaskModal(true);
                                                        }}
                                                        className="ns-btn-primary bg-brand-600 hover:bg-brand-700 text-white border-none py-1 px-3 text-xs"
                                                    >
                                                        {tr("Assign Task", "काम सोपवा")}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {sortedStaffByWorkload.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">{tr("No staff members found", "कोणतेही कर्मचारी आढळले नाहीत")}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Unassigned Work Pool */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
                        <div className="border-b border-slate-100 pb-3 flex justify-between items-center bg-slate-50/50 -m-6 mb-2 p-6">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-amber-500 animate-pulse" />
                                    <span>{tr("Unassigned Work Pool", "असोपवलेल्या कामांचा संच")}</span>
                                </h3>
                                <p className="text-xs text-slate-500">{tr("Distribute unassigned tasks and citizen complaints to your team", "तुमच्या टीमला अजून न सोपवलेली कामे आणि नागरिकांच्या तक्रारींचे वाटप करा")}</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-2.5 py-1 rounded-full">
                                    {unassignedTasks.length} {tr("Unassigned Tasks", "असोपवलेली कामे")}
                                </span>
                                <span className="bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold px-2.5 py-1 rounded-full">
                                    {unassignedComplaints.length} {tr("Unassigned Complaints", "असोपवलेल्या तक्रारी")}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                            {/* Unassigned Tasks */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-slate-700 text-sm border-b border-slate-100 pb-2">{tr("Unassigned Tasks", "असोपवलेली कामे")}</h4>
                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                    {unassignedTasks.map(task => (
                                        <div key={task.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50/30 flex justify-between items-center gap-4 hover:bg-slate-50 transition-colors">
                                            <div className="min-w-0 flex-1">
                                                <h5 className="font-bold text-slate-800 text-sm truncate"><TranslatedText text={task.title} /></h5>
                                                <p className="text-xs text-slate-500 truncate"><TranslatedText text={task.description} /></p>
                                                <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-100">
                                                    {task.priority === 'High' ? tr("High Priority", "उच्च प्राथमिकता") : task.priority === 'Medium' ? tr("Medium Priority", "मध्यम प्राथमिकता") : tr("Low Priority", "कमी प्राथमिकता")}
                                                </span>
                                            </div>
                                            <select
                                                value=""
                                                onChange={(e) => handleAssignTask(task.id, e.target.value)}
                                                className="ns-input text-xs py-1 px-2 border-slate-200 focus:ring-brand-500 rounded bg-white w-40 flex-shrink-0 cursor-pointer"
                                            >
                                                <option value="">{tr("Assign Karyakarta...", "कार्यकर्ता निवडा...")}</option>
                                                {staff.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                    {unassignedTasks.length === 0 && (
                                        <p className="text-xs text-slate-400 italic py-4 text-center">{tr("No unassigned tasks.", "कोणतीही असोपवलेली कामे नाहीत.")}</p>
                                    )}
                                </div>
                            </div>

                            {/* Unassigned Complaints */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-slate-700 text-sm border-b border-slate-100 pb-2">{tr("Unassigned Complaints", "असोपवलेल्या तक्रारी")}</h4>
                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                    {unassignedComplaints.map(complaint => (
                                        <div key={complaint.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50/30 flex justify-between items-center gap-4 hover:bg-slate-50 transition-colors">
                                            <div className="min-w-0 flex-1">
                                                <h5 className="font-bold text-slate-800 text-sm truncate"><TranslatedText text={complaint.title || complaint.problem} /></h5>
                                                <p className="text-xs text-slate-500 truncate"><TranslatedText text={complaint.description} /></p>
                                                <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                                    {tr(complaint.category || 'Complaint', complaint.category === 'Water' ? 'पाणी समस्या' : complaint.category === 'Electricity' ? 'वीज समस्या' : complaint.category === 'Roads' ? 'रस्ते समस्या' : complaint.category === 'Garbage' ? 'कचरा समस्या' : complaint.category || 'तक्रार')}
                                                </span>
                                            </div>
                                            <select
                                                value=""
                                                onChange={(e) => handleAssignComplaint(complaint.id, e.target.value)}
                                                className="ns-input text-xs py-1 px-2 border-slate-200 focus:ring-brand-500 rounded bg-white w-40 flex-shrink-0 cursor-pointer"
                                            >
                                                <option value="">{tr("Assign Karyakarta...", "कार्यकर्ता निवडा...")}</option>
                                                {staff.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                    {unassignedComplaints.length === 0 && (
                                        <p className="text-xs text-slate-400 italic py-4 text-center">{tr("No unassigned complaints.", "कोणतीही असोपवलेली तक्रार नाही.")}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Task & Complaint View */}
                    {selectedKaryakartaForTasks && (
                        <div ref={detailsRef} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 animate-in fade-in duration-200">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{tr("Workload Details for", "कार्यभार तपशील:")} <TranslatedText text={selectedKaryakartaForTasks.name} isName={true} /></h3>
                                    <p className="text-xs text-slate-500">{translateRole(selectedKaryakartaForTasks.role)} · {tr("Assigned Area", "नियुक्त परिसर")}: {tr(selectedKaryakartaForTasks.area || 'All', selectedKaryakartaForTasks.area || 'सर्व')}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedKaryakartaForTasks(null)}
                                    className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                                >
                                    {tr("Close Details", "तपशील बंद करा")}
                                </button>
                            </div>

                            {/* Detail Tabs */}
                            <div className="flex border-b border-slate-200">
                                <button
                                    onClick={() => setActiveDetailTab('tasks')}
                                    className={`py-2 px-4 border-b-2 font-bold text-sm transition-colors ${activeDetailTab === 'tasks' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                >
                                    {tr("Assigned Tasks", "सोपवलेली कामे")} ({tasks.filter(t => t.assigned_staff_id === selectedKaryakartaForTasks.id).length})
                                </button>
                                <button
                                    onClick={() => setActiveDetailTab('complaints')}
                                    className={`py-2 px-4 border-b-2 font-bold text-sm transition-colors ${activeDetailTab === 'complaints' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                >
                                    {tr("Assigned Complaints", "सोपवलेल्या तक्रारी")} ({complaints.filter(c => c.assigned_to === selectedKaryakartaForTasks.id).length})
                                </button>
                            </div>

                            {activeDetailTab === 'tasks' ? (
                                <div className="grid gap-3">
                                    {tasks.filter(t => t.assigned_staff_id === selectedKaryakartaForTasks.id).map(task => (
                                        <div key={task.id} className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-slate-800 text-base"><TranslatedText text={task.title} /></h4>
                                                <p className="text-sm text-slate-650"><TranslatedText text={task.description} /></p>
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                                                    <span className={`px-2 py-0.5 rounded-full font-medium ${task.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-100' :
                                                            task.priority === 'Medium' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                                                                'bg-slate-50 text-slate-650 border border-slate-200'
                                                        }`}>
                                                        {task.priority === 'High' ? tr("High Priority", "उच्च प्राथमिकता") : task.priority === 'Medium' ? tr("Medium Priority", "मध्यम प्राथमिकता") : tr("Low Priority", "कमी प्राथमिकता")}
                                                    </span>
                                                    {task.due_date && <span>{tr("Due", "मुदत")}: {task.due_date} {task.due_time}</span>}
                                                    {task.address && <span>{tr("Address", "पत्ता")}: {task.address}</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 self-start md:self-center">
                                                <label className="text-xs font-bold text-slate-600">{tr("Status:", "स्थिती:")}</label>
                                                <select
                                                    value={task.status}
                                                    onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                                                    className="ns-input py-1 px-3 text-xs bg-white border-slate-250 focus:ring-brand-500 font-semibold"
                                                >
                                                    <option value="Pending">{tr("Pending", "प्रलंबित")}</option>
                                                    <option value="In Progress">{tr("In Progress", "चालू")}</option>
                                                    <option value="Completed">{tr("Completed", "पूर्ण")}</option>
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                    {tasks.filter(t => t.assigned_staff_id === selectedKaryakartaForTasks.id).length === 0 && (
                                        <div className="py-6 text-center text-slate-500 italic text-sm">
                                            {tr("No tasks currently assigned to this member.", "या सदस्याला सध्या कोणतेही काम सोपवले नाही.")}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {complaints.filter(c => c.assigned_to === selectedKaryakartaForTasks.id).map(complaint => (
                                        <div key={complaint.id} className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-slate-800 text-base"><TranslatedText text={complaint.title || complaint.problem} /></h4>
                                                    <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded font-medium">
                                                        {tr(complaint.category || 'Complaint', complaint.category === 'Water' ? 'पाणी समस्या' : complaint.category === 'Electricity' ? 'वीज समस्या' : complaint.category === 'Roads' ? 'रस्ते समस्या' : complaint.category === 'Garbage' ? 'कचरा समस्या' : complaint.category || 'तक्रार')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-650"><TranslatedText text={complaint.description} /></p>
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                                                    {complaint.voter && (
                                                        <span>{tr("Reporter", "तक्रारदार")}: {complaint.voter.name_marathi || complaint.voter.name_english} ({complaint.voter.mobile || 'N/A'})</span>
                                                    )}
                                                    {complaint.location && <span>{tr("Location", "ठिकाण")}: {complaint.location}</span>}
                                                    <span>{tr("Created", "दिनांक")}: {new Date(complaint.created_at).toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-US')}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 self-start md:self-center">
                                                <label className="text-xs font-bold text-slate-600">{tr("Status:", "स्थिती:")}</label>
                                                <select
                                                    value={complaint.status}
                                                    onChange={(e) => handleUpdateComplaintStatus(complaint.id, e.target.value)}
                                                    className="ns-input py-1 px-3 text-xs bg-white border-slate-250 focus:ring-brand-500 font-semibold"
                                                >
                                                    <option value="Pending">{tr("Pending", "प्रलंबित")}</option>
                                                    <option value="Assigned">{tr("Assigned", "सोपवले")}</option>
                                                    <option value="InProgress">{tr("In Progress", "काम सुरू")}</option>
                                                    <option value="Resolved">{tr("Resolved", "निवारण झाले")}</option>
                                                    <option value="Closed">{tr("Closed", "बंद केले")}</option>
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                    {complaints.filter(c => c.assigned_to === selectedKaryakartaForTasks.id).length === 0 && (
                                        <div className="py-6 text-center text-slate-500 italic text-sm">
                                            {tr("No complaints currently assigned to this member.", "या सदस्याला सध्या कोणत्याही तक्रारी सोपवल्या नाहीत.")}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Quick Task Modal */}
                    {showQuickTaskModal && quickTaskStaff && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
                                <h3 className="text-lg font-bold text-slate-900">{tr("Assign New Task to", "नवीन काम सोपवा:")} <TranslatedText text={quickTaskStaff.name} isName={true} /></h3>
                                <form onSubmit={handleCreateQuickTask} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">{tr("Task Title", "कामाचे शीर्षक")}</label>
                                        <input
                                            type="text" required
                                            className="ns-input"
                                            value={quickTaskForm.title}
                                            onChange={e => setQuickTaskForm({ ...quickTaskForm, title: e.target.value })}
                                            placeholder={tr("e.g. Inspect water pipeline leakage", "उदा. पाणी पुरवठा पाईपलाईन गळती पाहणे")}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">{tr("Description", "कामाचा तपशील")}</label>
                                        <textarea
                                            rows={3} required
                                            className="ns-input"
                                            value={quickTaskForm.description}
                                            onChange={e => setQuickTaskForm({ ...quickTaskForm, description: e.target.value })}
                                            placeholder={tr("Details of the work to be done...", "करायच्या कामाची माहिती...")}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">{tr("Priority", "प्राथमिकता")}</label>
                                            <select
                                                className="ns-input"
                                                value={quickTaskForm.priority}
                                                onChange={e => setQuickTaskForm({ ...quickTaskForm, priority: e.target.value as any })}
                                            >
                                                <option value="Low">{tr("Low", "कमी")}</option>
                                                <option value="Medium">{tr("Medium", "मध्यम")}</option>
                                                <option value="High">{tr("High", "उच्च")}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">{tr("Due Date", "मुदत तारीख")}</label>
                                            <input
                                                type="date"
                                                className="ns-input"
                                                value={quickTaskForm.due_date}
                                                onChange={e => setQuickTaskForm({ ...quickTaskForm, due_date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">{tr("Due Time", "मुदत वेळ")}</label>
                                            <input
                                                type="time"
                                                className="ns-input"
                                                value={quickTaskForm.due_time}
                                                onChange={e => setQuickTaskForm({ ...quickTaskForm, due_time: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">{tr("Address / Office", "पत्ता / ठिकाण")}</label>
                                            <input
                                                type="text"
                                                className="ns-input"
                                                value={quickTaskForm.address}
                                                onChange={e => setQuickTaskForm({ ...quickTaskForm, address: e.target.value })}
                                                placeholder={tr("e.g. Ward 12 Main Road", "उदा. प्रभाग १२ मुख्य रस्ता")}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => setShowQuickTaskModal(false)}
                                            className="ns-btn-ghost text-xs"
                                        >
                                            {tr("Cancel", "रद्द करा")}
                                        </button>
                                        <button
                                            type="submit" disabled={savingQuickTask}
                                            className="ns-btn-primary bg-brand-600 hover:bg-brand-700 text-white border-none py-2 px-6 text-xs font-bold"
                                        >
                                            {savingQuickTask ? tr("Saving...", "जतन करत आहे...") : tr("Assign Task", "काम सोपवा")}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{t('staff.title')}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm text-gray-500">{t('staff.subtitle')}</p>
                                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-sky-50 text-sky-700 border border-sky-200">
                                    {t('staff.list.found')}: {filteredStaff.length}
                                </span>
                                {filteredStaff.length !== staffInCurrentTab.length && (
                                    <span className="text-xs text-slate-400">
                                        of {staffInCurrentTab.length}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="ns-btn-primary"
                        >
                            <Plus className="w-4 h-4" /> {t('staff.add_staff')}
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 overflow-x-auto">
                        {[
                            { id: 'Office', label: t('staff.tabs.office'), icon: Building2 },
                            { id: 'Party', label: t('staff.tabs.party'), icon: Flag },
                            { id: 'WorkManagement', label: tr('Work Management', 'काम व्यवस्थापन'), icon: CheckSquare },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={clsx(
                                    "flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "bg-brand-50 text-brand-700 shadow-sm"
                                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                )}
                            >
                                <tab.icon className={clsx("w-4 h-4", activeTab === tab.id ? "text-brand-600" : "text-gray-400")} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={t('staff.list.search_name_mobile') || "Search Name or Mobile"}
                            value={nameSearch}
                            onChange={(e) => setNameSearch(e.target.value)}
                            className="ns-input pl-9 w-full"
                        />
                    </div>
                    <div className="relative" ref={areaWrapperRef}>
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={t('staff.list.search_area') || "Search Area"}
                            value={areaSearch}
                            onChange={(e) => {
                                setAreaSearch(e.target.value);
                                setShowAreaSuggestions(true);
                            }}
                            onFocus={() => setShowAreaSuggestions(true)}
                            className="ns-input pl-9 w-full"
                        />
                        {showAreaSuggestions && filteredAreaSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filteredAreaSuggestions.map((item, idx) => (
                                    <button
                                        key={idx}
                                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center justify-between group"
                                        onClick={() => {
                                            setAreaSearch(item.value);
                                            setShowAreaSuggestions(false);
                                        }}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                            <span className="truncate">{item.value}</span>
                                        </div>
                                        <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded group-hover:bg-slate-200 flex-shrink-0 ml-2">
                                            {item.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex justify-end mt-2">
                    <div className="bg-white border border-slate-200 rounded-lg p-1 flex shadow-sm">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={clsx(
                                "px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors",
                                viewMode === 'grid' ? "bg-brand-50 text-brand-700" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" /> {t('common.grid')}</button>
                        <button
                            onClick={() => setViewMode('report')}
                            className={clsx(
                                "px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors",
                                viewMode === 'report' ? "bg-brand-50 text-brand-700" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <FileText className="w-4 h-4" /> {t('common.report')}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>)}
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStaff.length > 0 ? (
                            filteredStaff.map((member) => (
                                <div
                                    key={member.id}
                                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group relative cursor-pointer"
                                    onClick={() => setSelectedStaff(member)}
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-12 w-12 flex-shrink-0 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 shadow-sm border border-brand-100">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 leading-tight"><TranslatedText text={member.name} /></h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="inline-flex items-center text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                    <TranslatedText text={member.role} />
                                                </span>
                                                {member.area && (
                                                    <span className="inline-flex items-center text-xs text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded">
                                                        <TranslatedText text={member.area} />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 pt-3 border-t border-gray-50">
                                        <div className="flex items-center text-sm text-gray-600 gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span className="font-mono">{member.mobile}</span>
                                        </div>

                                        <div className="flex items-start text-sm text-gray-600 gap-2">
                                            <Tag className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <div className="flex flex-wrap gap-1.5">
                                                {member.keywords && member.keywords.length > 0 ? (
                                                    member.keywords.map((k, i) => (
                                                        <span key={i} className="bg-gray-50 px-2 py-0.5 rounded text-xs text-gray-500 border border-gray-100">
                                                            {k}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400 italic text-xs">{t('staff.list.no_keywords')}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-16 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <User className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">{t('staff.list.no_members')}</h3>
                                <p className="text-gray-500 max-w-sm mt-1">
                                    {t('staff.list.get_started')}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="font-semibold text-gray-800">
                                {t('staff.tabs.office')} - {t('common.report')} ({filteredStaff.length})
                            </h3>
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                            >
                                <Printer className="w-4 h-4" /> Print
                            </button>
                        </div>
                        <div className="overflow-x-auto print:overflow-visible">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 print:bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name & Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keywords/Categories</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredStaff.length > 0 ? filteredStaff.map((member) => (
                                        <tr key={member.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedStaff(member)}>
                                            <td className="px-6 py-4 text-sm text-gray-800">
                                                <div className="font-semibold"><TranslatedText text={member.name} /></div>
                                                <div className="text-xs text-gray-500"><TranslatedText text={member.role} /></div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                                {member.mobile}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {member.area || <span className="text-gray-400 italic">N/A</span>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <div className="flex flex-wrap gap-1">
                                                    {member.keywords && member.keywords.length > 0 ? (
                                                        member.keywords.slice(0, 3).map((k, i) => (
                                                            <span key={i} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-medium border border-blue-100">
                                                                {k}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-400 italic text-[10px]">None</span>
                                                    )}
                                                    {member.keywords && member.keywords.length > 3 && (
                                                        <span className="text-[10px] text-gray-500 items-center flex">+{member.keywords.length - 3}</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                                                {t('staff.list.no_members')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {selectedStaff ? (
                <StaffProfile
                    member={selectedStaff}
                    onBack={() => setSelectedStaff(null)}
                    onEdit={(m) => {
                        handleEdit(m);
                    }}
                    onDelete={(id) => {
                        handleDelete(id);
                    }}
                />
            ) : (
                renderContent()
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-4 md:p-6 shadow-xl max-h-[85vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">{editingStaffId ? 'Edit Staff Member' : t('staff.modal.title')}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('staff.modal.category')}</label>
                                <select
                                    className="ns-input mt-1"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                >
                                    <option value="Office">{t('staff.modal.office_desc')}</option>
                                    <option value="Party">{t('staff.modal.party_desc')}</option>
                                    <option value="Cooperative">{t('staff.modal.coop_desc')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('staff.modal.name')}</label>
                                <input
                                    type="text" required
                                    className="ns-input mt-1"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={t('staff.modal.name_placeholder')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('staff.modal.mobile')}</label>
                                <div className="flex mt-1">
                                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        required
                                        maxLength={10}
                                        className="ns-input rounded-l-none border-l-0"
                                        value={formData.mobile}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, ''); // Only numbers
                                            setFormData({ ...formData, mobile: val });
                                        }}
                                        placeholder="9876543210"
                                    />
                                </div>
                            </div>

                            {/* Email & Password for New Users */}
                            {!editingStaffId && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email (Login ID)</label>
                                        <input
                                            type="email"
                                            required={!editingStaffId}
                                            className="ns-input mt-1"
                                            value={formData.user_email}
                                            onChange={e => setFormData({ ...formData, user_email: e.target.value })}
                                            placeholder="staff@example.com"
                                        />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700">Password</label>
                                        <div className="relative mt-1">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required={!editingStaffId}
                                                className="ns-input pr-10"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('staff.modal.role')}</label>
                                    <input
                                        type="text"
                                        list="roles"
                                        required
                                        className="ns-input mt-1"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        placeholder={t('staff.modal.role_placeholder')}
                                    />
                                    <datalist id="roles">
                                        <option value="Office Admin" />
                                        <option value="Personal Assistant" />
                                        <option value="Ward President" />
                                        <option value="Booth Pramukh" />
                                        <option value="Electrician" />
                                        <option value="Plumber" />
                                        <option value="Sanitation Worker" />
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('staff.modal.area')}</label>
                                    <input
                                        type="text"
                                        className="ns-input mt-1"
                                        value={formData.area || ''}
                                        onChange={e => setFormData({ ...formData, area: e.target.value })}
                                        placeholder={t('staff.modal.area_placeholder')}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {t('staff.modal.keywords')}
                                    <span className="ml-2 text-xs text-gray-500 font-normal">{t('staff.modal.optional')}</span>
                                </label>
                                <input
                                    type="text"
                                    className="ns-input mt-1"
                                    value={formData.keywords}
                                    onChange={e => setFormData({ ...formData, keywords: e.target.value })}
                                    placeholder={t('staff.modal.keywords_placeholder')}
                                />
                                <p className="text-xs text-gray-500 mt-1">{t('staff.modal.keywords_help')}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Complaint Categories (Auto-Assign)
                                </label>
                                <div className="grid grid-cols-2 gap-2 p-2 border border-gray-100 rounded-lg bg-indigo-50/50 mb-4">
                                    {COMPLAINT_CATEGORIES.map((cat) => (
                                        <label key={cat.id} className="flex items-center space-x-2 text-sm cursor-pointer p-1 rounded hover:bg-indigo-100/50">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={formData.categories.includes(cat.id)}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        categories: checked
                                                            ? [...prev.categories, cat.id]
                                                            : prev.categories.filter(c => c !== cat.id)
                                                    }));
                                                }}
                                            />
                                            <span className="text-gray-700">{cat.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Permissions (Access Control)
                                </label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-100 rounded-lg bg-gray-50/50">
                                    {AVAILABLE_PERMISSIONS.map((perm) => (
                                        <label key={perm.id} className="flex items-center space-x-2 text-sm cursor-pointer p-1 rounded hover:bg-gray-100">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                                checked={formData.permissions.includes(perm.id)}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        permissions: checked
                                                            ? [...prev.permissions, perm.id]
                                                            : prev.permissions.filter(p => p !== perm.id)
                                                    }));
                                                }}
                                            />
                                            <span className="text-gray-700">{perm.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="ns-btn-ghost"
                                >
                                    {t('staff.modal.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="ns-btn-primary"
                                >
                                    {editingStaffId ? 'Update' : t('staff.modal.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-sm overflow-hidden p-6 space-y-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Delete Staff Member?</h3>
                            <p className="text-slate-500 mt-2 text-sm">
                                Are you sure you want to delete <span className="font-semibold text-slate-900">{deleteTarget.name}</span>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default StaffList;
