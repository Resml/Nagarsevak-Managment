import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../services/supabaseClient';
import { Plus, CheckCircle, Clock, AlertCircle, Camera, Sparkles, User, Calendar, X } from 'lucide-react';
import { AIAnalysisService } from '../../services/aiService';
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

    // New Task State
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'Medium' as 'Low' | 'Medium' | 'High',
        due_date: '',
        due_time: '',
        address: '',
        status: 'Pending',
        assigned_to: '' // For MVP we might not list all staff, or just a text field
    });
    const [staffList, setStaffList] = useState<any[]>([]);

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
        const { data } = await supabase.from('staff').select('id, name').eq('tenant_id', tenantId);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('tasks').insert([{ ...newTask, tenant_id: tenantId }]); // Secured
            if (error) throw error;

            setShowForm(false);
            setNewTask({
                title: '',
                description: '',
                priority: 'Medium',
                due_date: '',
                due_time: '',
                address: '',
                status: 'Pending',
                assigned_to: ''
            });
            fetchTasks();
        } catch (err) {
            console.error('Error creating task:', err);
            toast.error('Failed to create task');
        }
    };

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{t('tasks.title')}</h1>
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
            </div>

            {/* Task Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="ns-card w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200/70 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-semibold text-slate-900">
                                {newTask.title ? t('tasks.edit_scanned_task') : t('tasks.create_new_task')}
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

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('tasks.description')}</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={newTask.description}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                    className="ns-input"
                                />
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
                ) : tasks.map(task => (
                    <div key={task.id} className="ns-card p-5 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-semibold text-slate-900 text-lg">{task.title}</h3>
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
                                </div>
                            </div>
                            <span className={clsx(
                                "px-3 py-1 rounded-full text-xs font-medium",
                                task.status === 'Completed' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                            )}>
                                {task.status === 'Completed' ? t('tasks.status_completed') : t('tasks.status_pending')}
                            </span>
                        </div>
                        <p className="text-slate-600 text-sm mb-4">{task.description}</p>

                        <div className="pt-4 border-t border-slate-200/70 flex justify-between items-center text-sm">
                            <span className="text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {t('tasks.created')} {new Date(task.created_at).toLocaleDateString()}
                            </span>
                            <button className="text-brand-700 font-semibold hover:underline">{t('tasks.view_details')}</button>
                        </div>
                    </div>
                ))}

                {tasks.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-500 ns-card border-dashed">
                        <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p>{t('tasks.no_tasks')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tasks;
