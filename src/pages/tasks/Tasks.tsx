import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../services/supabaseClient';
import { Plus, CheckCircle, Clock, AlertCircle, Camera, Sparkles, Calendar, X, Edit2, Trash2, Search, Wand2, MapPin, Building2 } from 'lucide-react';
import { AIAnalysisService, AIService } from '../../services/aiService';
import { TranslatedText } from '../../components/TranslatedText';
import { format } from 'date-fns';
import clsx from 'clsx';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';

const Tasks = () => {
    const { t } = useLanguage();
    const { tenantId } = useTenant();
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

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            {t('tasks.title')}
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                                {t('work_history.found') || 'Found'}: {filteredTasks.length}
                            </span>
                        </h1>
                        <p className="text-sm text-slate-500">{t('tasks.subtitle')}</p>
                    </div>
                    <div className="flex gap-2">
                        <label className={`ns-btn-ghost border border-slate-200 cursor-pointer ${isScanning ? 'opacity-70 pointer-events-none' : ''}`}>
                            {isScanning ? <Sparkles className="w-4 h-4 animate-spin text-brand-600" /> : <Camera className="w-4 h-4" />}
                            <span className="text-sm font-medium">{isScanning ? t('tasks.scanning') : t('tasks.scan_doc')}</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleScan} disabled={isScanning} />
                        </label>
                        <button
                            onClick={() => setShowForm(true)}
                            className="ns-btn-primary"
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
                            className="ns-input pl-10 w-full"
                        />
                    </div>

                    {/* Area Search */}
                    <div className="md:col-span-3 relative dropdown-container">
                        <input
                            type="text"
                            placeholder={t('work_history.search_area') || "Search Area"}
                            className="ns-input w-full bg-white shadow-sm"
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
                            className="ns-input w-full bg-white shadow-sm"
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
            <div className="grid gap-4">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="ns-card p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="space-y-2">
                                        <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
                                        <div className="flex gap-2">
                                            <div className="h-5 w-24 bg-slate-200 rounded-full animate-pulse" />
                                            <div className="h-5 w-32 bg-slate-200 rounded-full animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="h-6 w-24 bg-slate-200 rounded-full animate-pulse" />
                                </div>
                                <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse mb-2 mt-4" />
                                <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse mb-4" />
                                <div className="pt-4 border-t border-slate-200/70 flex justify-between items-center">
                                    <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                                    <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredTasks.map(task => (
                    <div key={task.id} className="ns-card p-5 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-semibold text-slate-900 text-lg">
                                    {renderDynamicTitle(task.title)}
                                </h3>
                                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                    <span className={clsx(
                                        "px-2 py-0.5 rounded-full text-xs font-medium",
                                        task.priority === 'High' ? "bg-red-100 text-red-700" :
                                            task.priority === 'Medium' ? "bg-yellow-100 text-yellow-700" :
                                                "bg-green-100 text-green-700"
                                    )}>
                                        {task.priority === 'High' ? t('tasks.priority_high') : task.priority === 'Medium' ? t('tasks.priority_medium') : t('tasks.priority_low')} {t('tasks.priority_label')}
                                    </span>
                                    {task.due_date && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {task.due_date}
                                        </span>
                                    )}
                                    {task.office_name && (
                                        <span className="flex items-center gap-1 text-slate-600">
                                            <Building2 className="w-3 h-3" /> <TranslatedText text={task.office_name} />
                                        </span>
                                    )}
                                    {task.address && (
                                        <span className="flex items-center gap-1 text-slate-600">
                                            <MapPin className="w-3 h-3" /> <TranslatedText text={task.address} />
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={clsx(
                                    "px-3 py-1 rounded-full text-xs font-medium",
                                    task.status === 'Completed' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                                )}>
                                    {task.status === 'Completed' ? t('tasks.status_completed') : t('tasks.status_pending')}
                                </span>
                            </div>
                        </div>
                        <p className="text-slate-600 text-sm mb-4">
                            <TranslatedText text={task.description} />
                        </p>

                        <div className="pt-4 border-t border-slate-200/70 flex justify-between items-center text-sm">
                            <span className="text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {t('tasks.created')} {new Date(task.created_at).toLocaleDateString()}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(task)}
                                    className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                    title={t('common.edit')}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(task)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title={t('common.delete')}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredTasks.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-500 ns-card border-dashed">
                        <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p>{t('tasks.no_tasks')}</p>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="ns-card max-w-sm w-full p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{t('common.delete_confirm')}</h3>
                        <p className="text-slate-600 mb-6">
                            {t('common.delete_warning_item').replace('{item}', '')}
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
        </div>
    );
};

export default Tasks;
