import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../services/supabaseClient';
import { Plus, CheckCircle, Clock, AlertCircle, Camera, Sparkles, Calendar, X, Edit2, Trash2, Search, Wand2, MapPin, Building2, LayoutGrid, FileText, Printer, ChevronLeft, ChevronRight, User, HelpCircle, Download } from 'lucide-react';
import { AIAnalysisService, AIService } from '../../services/aiService';
import { TranslatedText } from '../../components/TranslatedText';
import { format } from 'date-fns';
import clsx from 'clsx';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { useTutorial } from '../../context/TutorialContext';
import { TaskTutorial } from '../../components/tutorial/TaskTutorial';
import { TaskReportGenerator } from '../../components/reports/TaskReportGenerator';

const Tasks = () => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();
    const { startTutorial } = useTutorial();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);

    // New Task State
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'Medium' as 'Low' | 'Medium' | 'High',
        due_date: '',
        due_time: '',
        address: '',
        status: 'Pending',
        assigned_to: '',
        office_name: '',
        meet_person_name: '',
        assigned_staff_id: ''
    });
    const [staffList, setStaffList] = useState<any[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, title: string } | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'timeline' | 'grid' | 'report'>('timeline');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showTaskReport, setShowTaskReport] = useState(false);
    const [selectedTasksForReport, setSelectedTasksForReport] = useState<any[]>([]);

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [areaSearch, setAreaSearch] = useState('');
    const [showAreaDropdown, setShowAreaDropdown] = useState(false);
    const [dateSearch, setDateSearch] = useState('');
    const [showDateDropdown, setShowDateDropdown] = useState(false);

    useEffect(() => {
        // Close dropdowns when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (!(event.target as Element).closest('.dropdown-container')) {
                setShowAreaDropdown(false);
                setShowDateDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchTasks();
        fetchStaff();
    }, []);

    const fetchTasks = async () => {
        // Simulate network delay
        setTimeout(async () => {
            try {
                // Check if tasks table exists, otherwise handle gracefully or using mocks if needed? 
                // Assuming table 'tasks' exists as per plan.
                const { data, error } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('tenant_id', tenantId) // Secured
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setTasks(data || []);
            } catch (err) {
                console.error('Error fetching tasks (using mock fallback maybe?)', err);
                // Fallback for demo if table missing?
            } finally {
                setLoading(false);
            }
        }, 800);
    };

    const fetchStaff = async () => {
        // Changed from 'users' to 'staff' for consistency and tenant isolation
        const { data } = await supabase.from('staff').select('id, name, role').eq('tenant_id', tenantId);
        setStaffList(data || []);
    };

    const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsScanning(true);
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onloadend = async () => {
                const base64String = reader.result as string;
                try {
                    const parsed = await AIAnalysisService.parseDocument(base64String);
                    setNewTask(prev => ({
                        ...prev,
                        title: parsed.title,
                        description: parsed.description,
                        due_date: parsed.deadline || '',
                        priority: parsed.priority as 'Low' | 'Medium' | 'High'
                    }));
                    setShowForm(true);
                } catch (error) {
                    console.error("Scan failed", error);
                    toast.error("Could not scan document.");
                } finally {
                    setIsScanning(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAutoGenerate = async () => {
        if (!newTask.title) return;
        setGeneratingAI(true);
        try {
            const desc = await AIService.generateContent(newTask.title, 'Work Report', 'Professional', 'Marathi');
            setNewTask(prev => ({ ...prev, description: desc }));
        } catch (error) {
            console.error(error);
            toast.error(t('work_history.desc_gen_failed'));
        } finally {
            setGeneratingAI(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...newTask,
                due_date: newTask.due_date || null,
                due_time: newTask.due_time || null,
                assigned_staff_id: newTask.assigned_staff_id || null,
                tenant_id: tenantId
            };

            let error;
            if (editingId) {
                const { error: updateError } = await supabase
                    .from('tasks')
                    .update(payload)
                    .eq('id', editingId);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('tasks')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            toast.success(editingId ? t('common.save_changes') : t('tasks.save_task'));
            setShowForm(false);
            setNewTask({
                title: '',
                description: '',
                priority: 'Medium',
                due_date: '',
                due_time: '',
                address: '',
                status: 'Pending',
                assigned_to: '',
                office_name: '',
                meet_person_name: '',
                assigned_staff_id: ''
            });
            setEditingId(null);
            fetchTasks();
        } catch (err) {
            console.error('Error saving task:', err);
            toast.error('Failed to save task');
        }
    };

    const handleEdit = (task: any) => {
        setNewTask({
            title: task.title,
            description: task.description || '',
            priority: task.priority || 'Medium',
            due_date: task.due_date || '',
            due_time: task.due_time || '',
            address: task.address || '',
            status: task.status || 'Pending',
            assigned_to: task.assigned_to || '',
            office_name: task.office_name || '',
            meet_person_name: task.meet_person_name || '',
            assigned_staff_id: task.assigned_staff_id || ''
        });
        setEditingId(task.id);
        setShowForm(true);
    };

    const handleDeleteClick = (task: any) => {
        setDeleteTarget({ id: task.id, title: task.title });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', deleteTarget.id);

            if (error) throw error;
            toast.success(t('common.deleted'));
            setDeleteTarget(null);
            fetchTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
            toast.error('Failed to delete task');
        }
    };

    // Helper: Get Unique Areas with Counts
    const getAreaSuggestions = () => {
        const stats: Record<string, number> = {};
        tasks.forEach(task => {
            const area = task.address || task.office_name; // Use address or office name as "Area"
            if (area) {
                stats[area] = (stats[area] || 0) + 1;
            }
        });
        return Object.entries(stats).map(([area, count]) => ({ area, count }));
    };

    // Helper: Get Unique Dates with Counts
    const getDateSuggestions = () => {
        const stats: Record<string, number> = {};
        tasks.forEach(task => {
            if (task.due_date) {
                const dateStr = format(new Date(task.due_date), 'MMM d, yyyy');
                stats[dateStr] = (stats[dateStr] || 0) + 1;
            }
        });
        return Object.entries(stats).map(([date, count]) => ({ date, count }));
    };

    const formatTaskTitle = (title: string) => {
        if (!title) return '';

        // Handle "Greeting from Name"
        const greetingMatch = title.match(/^Greeting from (.+)$/i);
        if (greetingMatch) {
            return t('tasks.greeting_from').replace('{{name}}', greetingMatch[1]);
        }

        // Handle "Invitation from Name"
        const invitationMatch = title.match(/^Invitation from (.+)$/i);
        if (invitationMatch) {
            return t('tasks.invitation_from').replace('{{name}}', invitationMatch[1]);
        }

        // Handle "Complaint from Name"
        const complaintMatch = title.match(/^Complaint from (.+)$/i);
        if (complaintMatch) {
            return t('tasks.complaint_from').replace('{{name}}', complaintMatch[1]);
        }

        return title;
    };

    const renderDynamicTitle = (title: string) => {
        if (!title) return null;

        const patterns = [
            { regex: /^Greeting from (.+)$/i, key: 'tasks.greeting_from' },
            { regex: /^Invitation from (.+)$/i, key: 'tasks.invitation_from' },
            { regex: /^Complaint from (.+)$/i, key: 'tasks.complaint_from' }
        ];

        for (const { regex, key } of patterns) {
            const match = title.match(regex);
            if (match) {
                const parts = t(key).split('{{name}}');
                return (
                    <>
                        {parts[0]}
                        <TranslatedText text={match[1]} />
                        {parts[1]}
                    </>
                );
            }
        }

        return <TranslatedText text={title} />;
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = !searchTerm || (() => {
            const term = searchTerm.toLowerCase();
            const translatedTitle = formatTaskTitle(task.title).toLowerCase();
            return (
                translatedTitle.includes(term) ||
                task.title.toLowerCase().includes(term) ||
                (task.description && task.description.toLowerCase().includes(term)) ||
                (task.address && task.address.toLowerCase().includes(term)) ||
                (task.office_name && task.office_name.toLowerCase().includes(term))
            );
        })();

        const taskArea = task.address || task.office_name || '';
        const matchesArea = !areaSearch || taskArea.toLowerCase().includes(areaSearch.toLowerCase());

        const matchesDate = !dateSearch || (task.due_date && format(new Date(task.due_date), 'MMM d, yyyy').toLowerCase().includes(dateSearch.toLowerCase()));

        return matchesSearch && matchesArea && matchesDate;
    });

    const timelineTasks = filteredTasks
        .filter(task => {
            if (!task.due_date) return false;
            // Matches strict selectedDate
            const taskDate = new Date(task.due_date);
            return taskDate.getFullYear() === selectedDate.getFullYear() &&
                taskDate.getMonth() === selectedDate.getMonth() &&
                taskDate.getDate() === selectedDate.getDate();
        })
        .sort((a, b) => {
            const timeA = a.due_time || '23:59';
            const timeB = b.due_time || '23:59';
            return timeA.localeCompare(timeB);
        });

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    return (
        <>
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="tutorial-task-header">
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            {t('tasks.title')}
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                                {t('work_history.found') || 'Found'}: {viewMode === 'timeline' ? timelineTasks.length : filteredTasks.length}
                            </span>
                        </h1>
                        <p className="text-sm text-slate-500">{t('tasks.subtitle')}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={startTutorial}
                            className="ns-btn-ghost border border-brand-200 text-brand-700 bg-white hover:bg-brand-50 px-4 py-2 rounded-xl flex items-center gap-2 tutorial-task-help shadow-sm"
                        >
                            <HelpCircle className="w-5 h-5 text-brand-600" />
                            <span className="font-semibold">{language === 'mr' ? 'मदत' : 'Help'}</span>
                        </button>
                        <label className={`ns-btn-ghost border border-slate-200 cursor-pointer tutorial-task-scan ${isScanning ? 'opacity-70 pointer-events-none' : ''}`}>
                            {isScanning ? <Sparkles className="w-4 h-4 animate-spin text-brand-600" /> : <Camera className="w-4 h-4" />}
                            <span className="text-sm font-medium">{isScanning ? t('tasks.scanning') : t('tasks.scan_doc')}</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleScan} disabled={isScanning} />
                        </label>
                        <button
                            onClick={() => setShowForm(true)}
                            className="ns-btn-primary tutorial-task-add"
                        >
                            <Plus className="w-4 h-4" /> {t('tasks.new_task')}
                        </button>
                    </div>
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Main Search */}
                    <div className="md:col-span-6 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t('work_history.search_placeholder') || "Search tasks..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="ns-input pl-10 w-full tutorial-task-search"
                        />
                    </div>

                    {/* Area Search */}
                    <div className="md:col-span-3 relative dropdown-container">
                        <input
                            type="text"
                            placeholder={t('work_history.search_area') || "Search Area"}
                            className="ns-input w-full bg-white shadow-sm tutorial-task-area"
                            value={areaSearch}
                            onFocus={() => { setShowAreaDropdown(true); setShowDateDropdown(false); }}
                            onChange={(e) => setAreaSearch(e.target.value)}
                        />
                        {showAreaDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {getAreaSuggestions().filter(s => s.area.toLowerCase().includes(areaSearch.toLowerCase())).map((item) => (
                                    <div
                                        key={item.area}
                                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                                        onClick={() => {
                                            setAreaSearch(item.area);
                                            setShowAreaDropdown(false);
                                        }}
                                    >
                                        <span className="text-sm text-slate-700">{item.area}</span>
                                        <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{item.count}</span>
                                    </div>
                                ))}
                                {getAreaSuggestions().filter(s => s.area.toLowerCase().includes(areaSearch.toLowerCase())).length === 0 && (
                                    <div className="px-4 py-2 text-sm text-slate-500 italic">{t('work_history.no_areas') || "No areas found"}</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Date Search */}
                    <div className="md:col-span-3 relative dropdown-container">
                        <input
                            type="text"
                            placeholder={t('work_history.filter_date') || "Filter Date"}
                            className="ns-input w-full bg-white shadow-sm tutorial-task-date"
                            value={dateSearch}
                            onFocus={() => { setShowDateDropdown(true); setShowAreaDropdown(false); }}
                            onChange={(e) => setDateSearch(e.target.value)}
                        />
                        {showDateDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {getDateSuggestions().filter(d => d.date.toLowerCase().includes(dateSearch.toLowerCase())).map((item) => (
                                    <div
                                        key={item.date}
                                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                                        onClick={() => {
                                            setDateSearch(item.date);
                                            setShowDateDropdown(false);
                                        }}
                                    >
                                        <span className="text-sm text-slate-700">{item.date}</span>
                                        <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* View Mode & Date Navigator */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                {/* View Toggles */}
                <div className="flex p-1 bg-slate-100 rounded-lg">
                    <button
                        onClick={() => setViewMode('timeline')}
                        className={`px-4 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'timeline' ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                    >
                        <Clock className="w-4 h-4" /> {t('tasks.timeline_view') || 'दैनंदिनी (Timeline)'}
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-4 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'grid' ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                    >
                        <LayoutGrid className="w-4 h-4" /> {t('common.grid')}
                    </button>
                    <button
                        onClick={() => setViewMode('report')}
                        className={`px-4 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'report' ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                    >
                        <FileText className="w-4 h-4" /> {t('common.report')}
                    </button>
                </div>

                {/* Date Navigator (Only show if in Timeline view) */}
                {viewMode === 'timeline' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedDate(new Date())}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${isToday(selectedDate) ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {t('tasks.today') || 'Today'}
                        </button>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                            <button
                                onClick={() => changeDate(-1)}
                                className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-md transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-2 px-3 py-1 bg-white mx-1 rounded-md border border-slate-100 font-medium text-slate-800 min-w-[140px] justify-center shadow-sm">
                                <Calendar className="w-4 h-4 text-brand-500" />
                                {format(selectedDate, 'MMM d, yyyy')}
                            </div>
                            <button
                                onClick={() => changeDate(1)}
                                className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-md transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Task Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="ns-card w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-slate-200/70 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                            <h2 className="text-lg font-semibold text-slate-900">
                                {editingId ? t('tasks.edit_task') || 'Edit Task' : (newTask.title ? t('tasks.edit_scanned_task') : t('tasks.create_new_task'))}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('tasks.task_title')}</label>
                                <input
                                    type="text"
                                    required
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    className="ns-input"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('tasks.priority')}</label>
                                    <select
                                        value={newTask.priority}
                                        onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })}
                                        className="ns-input"
                                    >
                                        <option value="Low">{t('tasks.priority_low')}</option>
                                        <option value="Medium">{t('tasks.priority_medium')}</option>
                                        <option value="High">{t('tasks.priority_high')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('tasks.due_date')}</label>
                                    <input
                                        type="date"
                                        value={newTask.due_date}
                                        onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                                        className="ns-input"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('tasks.due_time')}</label>
                                    <input
                                        type="time"
                                        value={newTask.due_time}
                                        onChange={e => setNewTask({ ...newTask, due_time: e.target.value })}
                                        className="ns-input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('tasks.address')}</label>
                                    <input
                                        type="text"
                                        value={newTask.address}
                                        onChange={e => setNewTask({ ...newTask, address: e.target.value })}
                                        className="ns-input"
                                        placeholder={t('tasks.address_placeholder')}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('tasks.office_name')}</label>
                                    <input
                                        type="text"
                                        value={newTask.office_name}
                                        onChange={e => setNewTask({ ...newTask, office_name: e.target.value })}
                                        className="ns-input"
                                        placeholder={t('tasks.office_placeholder')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('tasks.meet_person')}</label>
                                    <input
                                        type="text"
                                        value={newTask.meet_person_name}
                                        onChange={e => setNewTask({ ...newTask, meet_person_name: e.target.value })}
                                        className="ns-input"
                                        placeholder={t('tasks.person_placeholder')}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('tasks.assign_staff')}</label>
                                <select
                                    value={newTask.assigned_staff_id}
                                    onChange={e => setNewTask({ ...newTask, assigned_staff_id: e.target.value })}
                                    className="ns-input"
                                >
                                    <option value="">{t('tasks.select_staff')}</option>
                                    {staffList.map(staff => (
                                        <option key={staff.id} value={staff.id}>
                                            {staff.name} ({staff.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('tasks.description')}</label>
                                <div className="relative">
                                    <textarea
                                        required
                                        rows={3}
                                        value={newTask.description}
                                        onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                        className="ns-input pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAutoGenerate}
                                        disabled={generatingAI || !newTask.title}
                                        className="absolute right-2 bottom-2 text-brand-700 hover:text-brand-800 disabled:opacity-50"
                                        title="Auto draft description"
                                    >
                                        <Wand2 className={`w-5 h-5 ${generatingAI ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{t('work_history.auto_draft_hint')}</p>
                            </div>

                            <button
                                type="submit"
                                className="ns-btn-primary w-full justify-center"
                            >
                                {isScanning ? t('tasks.processing') : t('tasks.save_task')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Tasks List */}
            {viewMode === 'report' ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-semibold text-slate-800">{t('tasks.title') || 'Tasks'} {t('common.report_view')} ({filteredTasks.length})</h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setSelectedTasksForReport(filteredTasks);
                                    setShowTaskReport(true);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-200 rounded-lg text-sm font-medium text-brand-700 hover:bg-brand-100 shadow-sm transition-colors"
                                title={t('work_history.download_pdf') || 'Download PDF'}
                            >
                                <Download className="w-4 h-4" /> {t('work_history.download_pdf') || 'PDF'}
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
                                title={t('common.print')}
                            >
                                <Printer className="w-4 h-4" /> {t('common.print')}
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('common.report_columns.title')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('common.report_columns.priority')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('common.report_columns.status')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('common.report_columns.due_date')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('common.report_columns.address_office')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('common.report_columns.assigned_to')}</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('common.actions') || 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredTasks.map(task => (
                                    <tr key={task.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-800">{renderDynamicTitle(task.title)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${task.priority === 'High' ? 'bg-red-100 text-red-700' :
                                                    task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                                }`}>
                                                {task.priority === 'High' ? t('tasks.priority_high') : task.priority === 'Medium' ? t('tasks.priority_medium') : t('tasks.priority_low')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${task.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {task.status === 'Completed' ? t('tasks.status_completed') : t('tasks.status_pending')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{task.due_date || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500"><TranslatedText text={task.address || task.office_name || '-'} /></td>
                                        <td className="px-6 py-4 text-sm text-slate-500"><TranslatedText text={task.assigned_to || task.meet_person_name || '-'} /></td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <button
                                                onClick={() => {
                                                    setSelectedTasksForReport([task]);
                                                    setShowTaskReport(true);
                                                }}
                                                className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                                title={t('work_history.download_pdf') || 'Download PDF'}
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredTasks.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                            {t('work_history.no_records')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : viewMode === 'timeline' ? (
                /* TIMELINE VIEW */
                <div className="relative border-l-[3px] border-slate-200 ml-20 md:ml-32 space-y-8 pb-12">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="relative pl-8 md:pl-12">
                                <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-slate-200 border-[3px] border-white animate-pulse" />
                                <div className="ns-card p-5">
                                    <div className="h-5 w-32 bg-slate-200 rounded animate-pulse mb-3" />
                                    <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-3" />
                                    <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
                                </div>
                            </div>
                        ))
                    ) : timelineTasks.length > 0 ? (
                        timelineTasks.map((task, index) => {
                            // Determine relative time status
                            const taskTime = task.due_time ? new Date(`${task.due_date}T${task.due_time}`) : null;
                            const now = new Date();
                            const isPast = taskTime && taskTime < now;
                            const isNext = !isPast && (index === 0 || (timelineTasks[index - 1].due_time && new Date(`${timelineTasks[index - 1].due_date}T${timelineTasks[index - 1].due_time}`) < now));

                            return (
                                <div key={task.id} className="relative pl-8 md:pl-12 transition-all">
                                    {/* Timeline Dot */}
                                    <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-[3px] border-white z-10 
                                            ${task.status === 'Completed' ? 'bg-green-500' :
                                            isNext ? 'bg-brand-500 ring-4 ring-brand-100' :
                                                isPast ? 'bg-slate-300' : 'bg-slate-300'}`}
                                    />

                                    {/* Timeline Connection Line (Colored if completed/passed) */}
                                    {index !== timelineTasks.length - 1 && (
                                        <div className={`absolute -left-[2px] top-6 bottom-[-2rem] w-[3px] -translate-x-1/2 
                                                ${task.status === 'Completed' || isPast ? 'bg-slate-300' : 'bg-transparent'}`}
                                        />
                                    )}

                                    {/* Time Label (Desktop usually) */}
                                    <div className="absolute left-0 top-0.5 -translate-x-[120%] text-right w-24 hidden md:block">
                                        <div className={`text-sm font-black ${isNext ? 'text-brand-700' : isPast ? 'text-brand-600' : 'text-brand-700'}`}>
                                            {task.due_time ? format(new Date(`2000-01-01T${task.due_time}`), 'hh:mm a') : 'Anytime'}
                                        </div>
                                    </div>

                                    {/* Task Card */}
                                    <div className={`ns-card p-5 group transition-shadow ${isNext ? 'ring-2 ring-brand-500 shadow-md' : 'hover:shadow-md'}`}>
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                                            <div>
                                                {/* Mobile Time Label */}
                                                <div className="flex items-center gap-2 mb-2 md:hidden">
                                                    <Clock className={`w-4 h-4 ${isNext ? 'text-brand-700' : 'text-brand-600'}`} />
                                                    <span className={`text-sm font-black ${isNext ? 'text-brand-700' : isPast ? 'text-brand-600' : 'text-brand-700'}`}>
                                                        {task.due_time ? format(new Date(`2000-01-01T${task.due_time}`), 'hh:mm a') : 'Anytime'}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-slate-900 text-lg leading-tight">
                                                    {renderDynamicTitle(task.title)}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={clsx(
                                                    "px-2.5 py-0.5 rounded-md text-xs font-semibold",
                                                    task.priority === 'High' ? "bg-red-50 text-red-700 border border-red-100" :
                                                        task.priority === 'Medium' ? "bg-yellow-50 text-yellow-700 border border-yellow-100" :
                                                            "bg-green-50 text-green-700 border border-green-100"
                                                )}>
                                                    {task.priority === 'High' ? t('tasks.priority_high') : task.priority === 'Medium' ? t('tasks.priority_medium') : t('tasks.priority_low')}
                                                </span>
                                                <span className={clsx(
                                                    "px-2.5 py-0.5 rounded-md text-xs font-semibold border",
                                                    task.status === 'Completed' ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-600 border-slate-200"
                                                )}>
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-slate-600 text-sm mb-4">
    <TranslatedText text={task.description} />
</p>

                                        {/* Task Metadata Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 bg-slate-50 rounded-lg p-3 text-sm">
                                            {(task.address || task.office_name) && (
                                                <div className="flex items-start gap-2 text-slate-700">
                                                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                                    <span className="font-medium"><TranslatedText text={task.office_name || task.address} /></span>
                                                </div>
                                            )}
                                            {task.meet_person_name && (
                                                <div className="flex items-start gap-2 text-slate-700">
                                                    <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                                    <span>{t('tasks.meet_person') || 'Meet'}: <span className="font-medium"><TranslatedText text={task.meet_person_name} /></span></span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-2 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(task)}
                                                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" /> {t('common.edit')}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(task)}
                                                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> {t('common.delete')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="px-8 md:px-12 py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300 ml-4 md:ml-0">
                            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="font-medium text-slate-600 mb-1">{t('work_history.no_timeline_tasks') || `No tasks scheduled for ${isToday(selectedDate) ? 'today' : format(selectedDate, 'MMM d')}`}</p>
                            <button
                                onClick={() => {
                                    setNewTask(prev => ({ ...prev, due_date: format(selectedDate, 'yyyy-MM-dd') }));
                                    setShowForm(true);
                                }}
                                className="mt-4 text-brand-600 hover:text-brand-700 font-medium text-sm inline-flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" /> {t('tasks.new_task')}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                /* GRID VIEW */
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="ns-card p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="space-y-2 w-full pr-4">
                                        <div className="h-6 w-full bg-slate-200 rounded animate-pulse" />
                                        <div className="flex gap-2">
                                            <div className="h-5 w-20 bg-slate-200 rounded-full animate-pulse" />
                                            <div className="h-5 w-24 bg-slate-200 rounded-full animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse shrink-0" />
                                </div>
                                <div className="h-4 w-full bg-slate-200 rounded animate-pulse mt-4 mb-2" />
                                <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
                            </div>
                        ))
                    ) : filteredTasks.map(task => (
                        <div key={task.id} className="ns-card flex flex-col hover:shadow-md transition-shadow">
                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start gap-4 mb-3">
                                    <h3 className="font-semibold text-slate-900 text-lg line-clamp-2">
                                        {renderDynamicTitle(task.title)}
                                    </h3>
                                    <span className={clsx(
                                        "px-2.5 py-1 rounded-md text-xs font-semibold shrink-0 cursor-default",
                                        task.status === 'Completed' ? "bg-green-50 text-green-700 border border-green-200" : "bg-slate-50 text-slate-700 border border-slate-200"
                                    )}>
                                        {task.status === 'Completed' ? t('tasks.status_completed') : t('tasks.status_pending')}
                                    </span>
                                </div>
                                
                                <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                                    <TranslatedText text={task.description} />
                                </p>

                                <div className="space-y-2 mt-auto">
                                    <div className="flex items-center gap-2">
                                        <span className={clsx(
                                            "px-2 py-0.5 rounded-full text-xs font-medium",
                                            task.priority === 'High' ? "bg-red-50 text-red-700" :
                                                task.priority === 'Medium' ? "bg-yellow-50 text-yellow-700" :
                                                    "bg-green-50 text-green-700"
                                        )}>
                                            {task.priority === 'High' ? t('tasks.priority_high') : task.priority === 'Medium' ? t('tasks.priority_medium') : t('tasks.priority_low')} {t('tasks.priority_label')}
                                        </span>
                                    </div>
                                    
                                    {(task.due_date || task.due_time) && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <span>
                                                {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : ''}
                                                {task.due_date && task.due_time ? ' • ' : ''}
                                                {task.due_time ? format(new Date(`2000-01-01T${task.due_time}`), 'hh:mm a') : ''}
                                            </span>
                                        </div>
                                    )}

                                    {(task.office_name || task.address) && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            {task.office_name ? <Building2 className="w-4 h-4 text-slate-400" /> : <MapPin className="w-4 h-4 text-slate-400" />}
                                            <span className="truncate"><TranslatedText text={task.office_name || task.address} /></span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center gap-2 rounded-b-xl">
                                <button
                                    onClick={() => handleEdit(task)}
                                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-white rounded-lg transition-colors shadow-sm"
                                    title={t('common.edit')}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(task)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors shadow-sm"
                                    title={t('common.delete')}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredTasks.length === 0 && !loading && (
                        <div className="col-span-full text-center py-16 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                            <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="font-medium text-slate-600">{t('tasks.no_tasks') || 'No tasks found'}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="ns-card max-w-sm w-full p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{t('common.delete_confirm')}</h3>
                        <p className="text-slate-600 mb-6">
                            {t('common.delete_warning_item')?.replace('{item}', '')}
                            <span className="font-semibold mx-1">{renderDynamicTitle(deleteTarget.title)}</span>?
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="ns-btn-secondary"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                            >
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showTaskReport && (
                <TaskReportGenerator
                    tasks={selectedTasksForReport}
                    onClose={() => setShowTaskReport(false)}
                />
            )}
        </>
    );
};

export default Tasks;
