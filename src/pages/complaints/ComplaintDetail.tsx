import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { type Complaint } from '../../types';
import { type Staff } from '../../types/staff';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Calendar, FileText, MapPin, Mic, Video, Phone, Trash2, X, Clock, CheckCircle, XCircle, Edit, Save, Download, ChevronRight, Image as ImageIcon, Music, File } from 'lucide-react';
import { SecureStorageService } from '../../services/secureStorageService';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { translateText } from '../../services/translationService';
import { TranslatedText } from '../../components/TranslatedText';
import { CustomSelect } from '../../components/common/CustomSelect';

const ComplaintDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();

    const [complaint, setComplaint] = useState<Complaint | undefined>(undefined);
    const [translatedData, setTranslatedData] = useState<{ title: string; description: string } | null>(null);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [assignee, setAssignee] = useState('');
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [editForm, setEditForm] = useState({
        problem: '',
        category: ''
    });

    // Translate content when language changes to Marathi
    // Translate content when language changes - using Standard API
    useEffect(() => {
        const translateContent = async () => {
            if (complaint && language === 'mr') {
                const title = await translateText(complaint.title, 'mr');
                const description = await translateText(complaint.description, 'mr');
                setTranslatedData({ title, description });
            } else {
                setTranslatedData(null);
            }
        };
        translateContent();
    }, [complaint, language]);

    useEffect(() => {
        if (id) {
            window.scrollTo(0, 0);
            fetchComplaint();
            fetchStaff();
        }
    }, [id]);

    const fetchStaff = async () => {
        const { data } = await supabase.from('staff').select('*').eq('tenant_id', tenantId);
        if (data) setStaffList(data);
    };

    const fetchComplaint = async () => {
        try {
            const isPersonal = id?.startsWith('pr-');
            const isAreaProblem = id?.startsWith('ap-');
            const actualId = (isPersonal || isAreaProblem) ? id?.split('-').slice(1).join('-') : id;

            if (isPersonal) {
                const { data, error } = await supabase
                    .from('personal_requests')
                    .select('*')
                    .eq('id', actualId)
                    .eq('tenant_id', tenantId)
                    .single();

                if (error) throw error;

                if (data) {
                    let resolvedAttachments: { url: string; type: string; name: string; size: number }[] = [];
                    if (data.attachments && Array.isArray(data.attachments)) {
                        resolvedAttachments = await Promise.all(
                            data.attachments.map(async (att: any) => ({
                                ...att,
                                url: await SecureStorageService.getUrl('documents', att.url)
                            }))
                        );
                    }

                    const mapped: Complaint = {
                        id: `pr-${data.id}`,
                        title: data.request_type || 'Personal Request',
                        description: data.description,
                        type: 'Personal Help',
                        status: data.status,
                        ward: 'WhatsApp',
                        location: 'WhatsApp',
                        voter: {
                            name_english: data.reporter_name,
                            mobile: data.reporter_mobile
                        },
                        createdAt: data.created_at,
                        updatedAt: data.created_at,
                        photos: [],
                        attachments: resolvedAttachments
                    };
                    setComplaint(mapped);
                    // Initialize edit form
                    setEditForm({
                        problem: data.description || '',
                        category: 'Personal Help'
                    });
                }
            } else if (isAreaProblem) {
                const { data, error } = await supabase
                    .from('area_problems')
                    .select('*')
                    .eq('id', actualId)
                    .eq('tenant_id', tenantId)
                    .single();

                if (error) throw error;

                if (data) {
                    let resolvedAttachments: { url: string; type: string; name: string; size: number }[] = [];
                    if (data.attachments && Array.isArray(data.attachments)) {
                        resolvedAttachments = await Promise.all(
                            data.attachments.map(async (att: any) => ({
                                ...att,
                                url: await SecureStorageService.getUrl('documents', att.url)
                            }))
                        );
                    }

                    const mapped: Complaint = {
                        id: `ap-${data.id}`,
                        title: data.title || 'Area Problem',
                        description: data.description,
                        type: 'SelfIdentified',
                        status: data.status,
                        ward: data.location || 'N/A',
                        location: data.location,
                        voter: {
                            name_english: data.reporter_name || 'Anonymous',
                            mobile: data.reporter_mobile || undefined
                        },
                        createdAt: data.created_at,
                        updatedAt: data.created_at,
                        photos: [],
                        attachments: resolvedAttachments
                    };
                    setComplaint(mapped);
                    setEditForm({
                        problem: data.description || '',
                        category: 'SelfIdentified'
                    });
                }
            } else {
                let data: any = null;
                const { data: joinData, error: joinError } = await supabase
                    .from('complaints')
                    .select(`
                        *,
                        voter:voters (name_english, name_marathi, mobile)
                    `)
                    .eq('id', id)
                    .eq('tenant_id', tenantId)
                    .maybeSingle();

                if (joinError) {
                    console.warn('Join fetch failed, retrying simple select:', joinError.message);
                    const { data: simpleData, error: simpleError } = await supabase
                        .from('complaints')
                        .select('*')
                        .eq('id', id)
                        .eq('tenant_id', tenantId)
                        .maybeSingle();

                    if (simpleError) throw simpleError;
                    data = simpleData;
                } else {
                    data = joinData;
                }
                console.log('Fetched Complaint Data:', data); // Debugging

                if (data) {
                    const secureImageUrl = data.image_url ? await SecureStorageService.getUrl('documents', data.image_url) : undefined;
                    
                    let resolvedAttachments: { url: string; type: string; name: string; size: number }[] = [];
                    if (data.attachments && Array.isArray(data.attachments)) {
                        resolvedAttachments = await Promise.all(
                            data.attachments.map(async (att: any) => ({
                                ...att,
                                url: await SecureStorageService.getUrl('documents', att.url)
                            }))
                        );
                    }

                    let parsedMeta = null;
                    try {
                        parsedMeta = typeof data.description_meta === 'string' ? JSON.parse(data.description_meta) : (data.description_meta || null);
                    } catch (e) {
                        console.error("Error parsing meta", e);
                    }

                    let extractTitle = 'Request';
                    let extractDesc = data.problem || '';
                    if (parsedMeta?.original_title) {
                        extractTitle = parsedMeta.original_title;
                        extractDesc = parsedMeta.original_description || '';
                    } else if (data.problem) {
                        // Fallback logic for old complaints
                        const parts = data.problem.split('\n');
                        if (parts.length > 1) {
                            extractTitle = parts[0];
                            extractDesc = parts.slice(1).join('\n');
                        } else {
                            extractTitle = parts[0];
                            extractDesc = '';
                        }
                    }

                    const mapped: Complaint = {
                        id: data.id.toString(),
                        title: extractTitle,
                        description: extractDesc,
                        type: data.category || 'Complaint',
                        status: data.status,
                        ward: data.location || 'N/A',
                        location: data.location,
                        voter: data.voter
                            ? {
                                name_english: data.voter.name_english ?? undefined,
                                name_marathi: data.voter.name_marathi ?? undefined,
                                mobile: data.voter.mobile ?? undefined,
                            }
                            : (() => {
                                try {
                                    const meta = data.description_meta ? JSON.parse(data.description_meta) : null;
                                    if (meta?.submitter_name) {
                                        return {
                                            name_english: meta.submitter_name,
                                            mobile: meta.submitter_mobile,
                                        };
                                    }
                                } catch (e) {
                                    console.error("Error parsing meta", e);
                                }
                                return undefined;
                            })(),
                        createdAt: data.created_at,
                        updatedAt: data.created_at,
                        photos: secureImageUrl ? [secureImageUrl] : [], // Map image_url to photos array as fallback
                        imageUrl: secureImageUrl,
                        attachments: resolvedAttachments,
                        videoUrl: data.video_url,
                        audioUrl: data.audio_url,
                        voterId: data.voter_id,
                        assignedTo: data.assigned_to,
                        added_by_staff_id: data.added_by_staff_id
                    };
                    setComplaint(mapped);
                    setAssignee(data.assigned_to || '');
                    setEditForm({
                        problem: data.problem || '',
                        category: data.category || 'Complaint'
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching complaint:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        if (!complaint) return;
        try {
            const isPersonal = complaint.id.startsWith('pr-');
            const isAreaProblem = complaint.id.startsWith('ap-');
            const actualId = (isPersonal || isAreaProblem) ? complaint.id.split('-').slice(1).join('-') : complaint.id;
            const table = isPersonal ? 'personal_requests' : isAreaProblem ? 'area_problems' : 'complaints';

            const { error } = await supabase
                .from(table)
                .update({ status: newStatus })
                .eq('id', actualId)
                .eq('tenant_id', tenantId);

            if (error) throw error;
            setComplaint({ ...complaint, status: newStatus as any });
            toast.success(`Status updated to ${newStatus}`);
        } catch (err) {
            console.error('Error updating status:', err);
            toast.error('Failed to update status');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!complaint) return;

        setUpdating(true);
        try {
            const isPersonal = complaint.id.startsWith('pr-');
            const isAreaProblem = complaint.id.startsWith('ap-');
            const actualId = (isPersonal || isAreaProblem) ? complaint.id.split('-').slice(1).join('-') : complaint.id;
            const table = isPersonal ? 'personal_requests' : isAreaProblem ? 'area_problems' : 'complaints';
            const updateData = isPersonal
                ? { description: editForm.problem }
                : isAreaProblem
                    ? { description: editForm.problem }
                    : { problem: editForm.problem, category: editForm.category };

            const { error } = await supabase
                .from(table)
                .update(updateData)
                .eq('id', actualId);

            if (error) throw error;

            setComplaint({
                ...complaint,
                title: isPersonal ? complaint.title : editForm.problem,
                description: editForm.problem,
                type: (isPersonal ? 'Personal Help' : editForm.category) as any
            });
            toast.success('Updated successfully');
            setIsEditModalOpen(false);
        } catch (err) {
            console.error('Error updating:', err);
            toast.error('Failed to update');
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!complaint) return;
        setDeleting(true);
        try {
            const isPersonal = complaint.id.startsWith('pr-');
            const isAreaProblem = complaint.id.startsWith('ap-');
            const actualId = (isPersonal || isAreaProblem) ? complaint.id.split('-').slice(1).join('-') : complaint.id;
            const table = isPersonal ? 'personal_requests' : isAreaProblem ? 'area_problems' : 'complaints';

            const { error, count } = await supabase
                .from(table)
                .delete({ count: 'exact' })
                .eq('id', actualId)
                .eq('tenant_id', tenantId);

            if (error) throw error;

            if (count === 0) {
                toast.error('Could not delete. You may not have permission.');
                return;
            }

            toast.success('Deleted successfully');
            if (location.state?.from) {
                navigate(location.state.from);
            } else if (isAreaProblem || complaint.type === 'SelfIdentified') {
                navigate('/dashboard/ward/problems');
            } else {
                navigate('/dashboard/complaints');
            }
        } catch (err) {
            console.error('Error deleting:', err);
            toast.error('Failed to delete');
        } finally {
            setDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

    if (loading) return (
        <div className="max-w-4xl mx-auto space-y-6 px-4 md:px-0">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="h-9 w-24 bg-slate-200 rounded-full animate-pulse" />
                <div className="flex gap-2">
                    <div className="h-9 w-24 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="h-9 w-24 bg-slate-200 rounded-lg animate-pulse" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content Skeleton */}
                <div className="md:col-span-2 space-y-6">
                    <div className="ns-card p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-3 w-3/4">
                                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
                                <div className="h-8 w-full bg-slate-200 rounded animate-pulse" />
                            </div>
                            <div className="h-8 w-24 bg-slate-200 rounded-full animate-pulse" />
                        </div>

                        <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                            <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                            <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-slate-200/70">
                            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                            <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Sidebar Skeleton */}
                <div className="space-y-6">
                    <div className="ns-card p-6 h-48">
                        <div className="h-5 w-32 bg-slate-200 rounded animate-pulse mb-4" />
                        <div className="space-y-4">
                            <div className="h-8 w-full bg-slate-200 rounded animate-pulse" />
                            <div className="h-8 w-full bg-slate-200 rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="ns-card p-6 h-64">
                        <div className="h-5 w-32 bg-slate-200 rounded animate-pulse mb-4" />
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex justify-between">
                                    <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
                                    <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
    if (!complaint) return <div className="p-8 text-center text-red-500">Complaint not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 px-4 md:px-0 pb-20 md:pb-0">
            {/* Enhanced Header with Back and Delete */}
            <div className="sticky top-14 md:top-0 z-30 bg-slate-50 pt-4 pb-4 flex items-center justify-between notranslate">
                <button
                    onClick={() => {
                        if (location.state?.from) {
                            navigate(location.state.from);
                        } else if (complaint?.id.startsWith('ap-')) {
                            navigate('/dashboard/ward/problems');
                        } else if (complaint?.id.startsWith('pr-')) {
                            navigate('/dashboard/complaints', { state: { tab: 'Personal Help' } });
                        } else {
                            navigate('/dashboard/complaints');
                        }
                    }}
                    className="group flex items-center gap-2 text-slate-600 hover:text-brand-700 transition-colors font-medium"
                >
                    <div className="p-2 bg-white rounded-full border border-slate-200 shadow-sm group-hover:border-brand-200 group-hover:shadow transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span>{t('complaints.form.detail.back_button')}</span>
                </button>

                {isAdminOrStaff && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white hover:bg-slate-50 rounded-lg transition-colors font-medium text-sm border border-slate-200 shadow-sm"
                        >
                            <Edit className="w-4 h-4" />
                            {t('complaints.form.detail.edit')}
                        </button>
                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm border border-red-100"
                        >
                            <Trash2 className="w-4 h-4" />
                            {t('complaints.form.detail.delete')}
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <div className="ns-card p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex flex-col items-start space-y-3">
                                <span className={`notranslate ns-badge border-transparent ${complaint.type === 'Help' ? 'bg-purple-100 text-purple-700' : 'bg-brand-50 text-brand-800'}`}>
                                    {t(`complaints.form.types.${complaint.type == 'Personal Help' ? 'personal_help' : complaint.type.toLowerCase().replace(/ /g, '_')}`) || complaint.type}
                                </span>
                            </div>
                            <span className={`ns-badge px-3 py-1 text-sm border ${complaint.status === 'Resolved' ? 'bg-green-100 text-green-800 border-green-200' :
                                complaint.status === 'Pending' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {complaint.status === 'Pending' ? t('complaints.status.pending') :
                                    complaint.status === 'Assigned' ? t('complaints.status.assigned') :
                                        complaint.status === 'Resolved' ? t('complaints.status.resolved') :
                                            complaint.status === 'InProgress' ? t('complaints.status.in_progress') :
                                                t('complaints.status.closed')}
                            </span>
                        </div>

                        <div className="mb-8">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Title</h4>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                                {translatedData ? translatedData.title : complaint.title}
                            </h1>
                        </div>

                        <div className="mb-8">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <FileText className="w-4 h-4" /> Description
                            </h4>
                            <div className="text-slate-700 bg-white border-l-4 border-brand-500 pl-4 py-1">
                                <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-600">
                                    {translatedData ? translatedData.description : complaint.description}
                                </p>
                            </div>
                        </div>

                        {/* Media Section */}
                        <div className="space-y-4 notranslate">
                            {/* New Multi-Media Attachments Array */}
                            {complaint.attachments && complaint.attachments.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Attachments
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {complaint.attachments.map((att, idx) => {
                                            const isImage = att.type.startsWith('image/');
                                            const isVideo = att.type.startsWith('video/');
                                            const isAudio = att.type.startsWith('audio/');
                                            
                                            return (
                                                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                                    {isImage ? (
                                                        <a href={att.url} target="_blank" rel="noreferrer" className="block">
                                                            <img src={att.url} alt={att.name} className="w-full h-48 object-cover hover:opacity-90 transition-opacity" />
                                                        </a>
                                                    ) : isVideo ? (
                                                        <video controls className="w-full h-48 bg-black">
                                                            <source src={att.url} type={att.type} />
                                                        </video>
                                                    ) : isAudio ? (
                                                        <div className="p-4 flex flex-col items-center justify-center h-48 bg-slate-100">
                                                            <Music className="w-8 h-8 text-slate-400 mb-3" />
                                                            <audio controls className="w-full">
                                                                <source src={att.url} type={att.type} />
                                                            </audio>
                                                        </div>
                                                    ) : (
                                                        <a href={att.url} target="_blank" rel="noreferrer" className="p-4 flex items-center justify-between h-full bg-white hover:bg-slate-50 transition-colors cursor-pointer group">
                                                            <div className="flex items-center space-x-3 overflow-hidden">
                                                                <div className="p-2 bg-brand-50 text-brand-600 rounded-lg shrink-0 group-hover:bg-brand-100 transition-colors">
                                                                    <File className="w-6 h-6" />
                                                                </div>
                                                                <div className="truncate">
                                                                    <p className="text-sm font-medium text-slate-700 truncate group-hover:text-brand-600 transition-colors" title={att.name}>{att.name}</p>
                                                                    <p className="text-xs text-slate-500">{(att.size / 1024 / 1024).toFixed(1)} MB</p>
                                                                </div>
                                                            </div>
                                                            <div className="shrink-0 ml-2 p-2 text-slate-400 group-hover:text-brand-600 rounded-lg transition-colors">
                                                                <Download className="w-4 h-4" />
                                                            </div>
                                                        </a>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Legacy Single Media Fallbacks */}
                            {(!complaint.attachments || complaint.attachments.length === 0) && complaint.imageUrl && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4" /> {t('complaints.form.detail.attached_photo')}
                                    </h3>
                                    <a href={complaint.imageUrl} target="_blank" rel="noreferrer">
                                        <img src={complaint.imageUrl} alt="Evidence" className="rounded-xl border border-slate-200 max-h-96 w-full object-cover hover:opacity-95 transition" />
                                    </a>
                                </div>
                            )}

                            {(!complaint.attachments || complaint.attachments.length === 0) && complaint.videoUrl && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                        <Video className="w-4 h-4" /> {t('complaints.form.detail.attached_video')}
                                    </h3>
                                    <video controls className="rounded-xl border border-slate-200 w-full max-h-96 bg-black">
                                        <source src={complaint.videoUrl} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            )}

                            {(!complaint.attachments || complaint.attachments.length === 0) && complaint.audioUrl && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                        <Mic className="w-4 h-4" /> {t('complaints.form.detail.voice_note')}
                                    </h3>
                                    <audio controls className="w-full">
                                        <source src={complaint.audioUrl} type="audio/ogg" />
                                        <source src={complaint.audioUrl} type="audio/mpeg" />
                                        Your browser does not support audio element.
                                    </audio>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-slate-500 pt-6 mt-6 border-t border-slate-200/70">
                            <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1.5" />
                                <TranslatedText text={complaint.location || ''} />
                            </div>
                            <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1.5" />
                                {format(new Date(complaint.createdAt), 'PP p')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6 notranslate">
                    {isAdminOrStaff && (
                        <div className="ns-card p-6">
                            <h3 className="font-bold text-slate-900 mb-4">{t('complaints.form.detail.manage_ticket')}</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase">{t('complaints.form.detail.update_status')}</label>
                                    <div className="flex flex-col gap-2">
                                        {!complaint.id.startsWith('pr-') && (
                                            <button
                                                onClick={() => handleStatusUpdate('InProgress')}
                                                disabled={complaint.status === 'InProgress'}
                                                className="ns-btn-ghost justify-start border border-slate-200"
                                            >
                                                <Clock className="w-4 h-4 mr-2" />
                                                {t('complaints.form.detail.mark_in_progress')}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleStatusUpdate('Resolved')}
                                            disabled={complaint.status === 'Resolved'}
                                            className="ns-btn-ghost justify-start border border-slate-200"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            {t('complaints.form.detail.mark_resolved')}
                                        </button>
                                    </div>
                                </div>

                                {/* Assignment */}
                                {(user?.role === 'admin' || user?.can_assign_work === true) && (
                                    <div className="pt-4 border-t border-slate-200/70">
                                        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase">{t('complaints.form.detail.assign_staff')}</label>
                                        <div className="flex space-x-2">
                                            <CustomSelect value={assignee}
                                                onChange={async (e) => {
                                                    const newAssignee = e.target.value;
                                                    setAssignee(newAssignee);

                                                    // Auto-save on change
                                                    if (newAssignee) {
                                                        const isPersonal = complaint.id.startsWith('pr-');
                                                        const isAreaProblem = complaint.id.startsWith('ap-');
                                                        const actualId = (isPersonal || isAreaProblem) ? complaint.id.split('-').slice(1).join('-') : complaint.id;
                                                        const table = isPersonal ? 'personal_requests' : isAreaProblem ? 'area_problems' : 'complaints';

                                                        // Update the correct table
                                                        const { error } = await supabase
                                                            .from(table)
                                                            .update({
                                                                assigned_to: newAssignee,
                                                                status: 'Assigned'
                                                            })
                                                            .eq('id', actualId);

                                                        if (!error) {
                                                            setComplaint({ ...complaint, status: 'Assigned', assignedTo: newAssignee });
                                                            toast.success('Staff assigned successfully');

                                                            // Trigger WhatsApp Notification
                                                            try {
                                                                const apiUrl = import.meta.env.VITE_BOT_API_URL || `${window.location.protocol}//${window.location.hostname}:4000`;

                                                                // Find selected staff details
                                                                const selectedStaff = staffList.find(s => s.id === newAssignee);
                                                                const { data: { session } } = await supabase.auth.getSession();

                                                                const response = await fetch(`${apiUrl}/api/assign-complaint`, {
                                                                    method: 'POST',
                                                                    headers: { 
                                                                        'Content-Type': 'application/json',
                                                                        'Authorization': `Bearer ${session?.access_token}`
                                                                    },
                                                                    body: JSON.stringify({
                                                                        complaintId: actualId,
                                                                        table: table,
                                                                        staffId: newAssignee,
                                                                        staffMobile: selectedStaff?.mobile,
                                                                        staffName: selectedStaff?.name,
                                                                        tenantId: tenantId
                                                                    })
                                                                });

                                                                if (!response.ok) {
                                                                    const errorData = await response.json();
                                                                    throw new Error(errorData.error || 'Server responded with error');
                                                                }
                                                            } catch (notifyErr: any) {
                                                                console.error('Failed to notify staff:', notifyErr);
                                                                toast.error(`Assigned, but notification failed: ${notifyErr.message}`);
                                                            }
                                                        } else {
                                                            console.error('Assignment Database Error:', error);
                                                            toast.error(`Failed to assign staff: ${error.message}`);
                                                        }
                                                    }
                                                }} className="ns-input"
                                            >
                                                <option value="">{t('complaints.form.detail.select_staff')}</option>
                                                {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                                            </CustomSelect>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Meta / Ticket Details */}
                    <div className="ns-card p-6">
                        <h3 className="font-bold text-slate-900 mb-4">{t('complaints.form.detail.ticket_details')}</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">{t('complaints.form.detail.ticket_id')}</span>
                                <span className="font-mono font-medium text-slate-700">#{complaint.id}</span>
                            </li>
                            <li className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">{t('complaints.form.detail.citizen')}</span>
                                <span className="font-medium text-blue-600">
                                    {(language === 'mr' && complaint.voter?.name_marathi)
                                        ? complaint.voter.name_marathi
                                        : <TranslatedText text={complaint.voter?.name_english || complaint.voter?.name_marathi || t('complaints.form.detail.anonymous')} isName={true} />}
                                </span>
                            </li>
                            {(complaint.voter?.mobile) && (
                                <li className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">{t('complaints.form.detail.mobile')}</span>
                                    <span className="font-medium text-slate-700">{complaint.voter.mobile}</span>
                                </li>
                            )}
                            <li className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">{t('complaints.form.detail.assigned_to')}</span>
                                <div>
                                    {staffList.find(s => s.id === assignee) ? (
                                        <div className="text-right">
                                            <div className="font-medium text-slate-900"><TranslatedText text={staffList.find(s => s.id === assignee)?.name || ''} isName={true} /></div>
                                            <div className="text-xs text-brand-600 flex items-center justify-end gap-1">
                                                <Phone className="w-3 h-3" />
                                                {staffList.find(s => s.id === assignee)?.mobile}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400">{t('complaints.form.detail.unassigned')}</span>
                                    )}
                                </div>
                            </li>
                            {complaint.added_by_staff_id && (
                                <li className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Added By</span>
                                    <div className="text-right font-medium text-slate-900">
                                        <TranslatedText text={staffList.find(s => s.id === complaint.added_by_staff_id)?.name || 'Unknown Staff'} isName={true} />
                                    </div>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="notranslate fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-sm overflow-hidden p-6 space-y-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">{t('complaints.form.detail.delete_modal_title')}</h3>
                            <p className="text-slate-500 mt-2 text-sm">
                                {t('complaints.form.detail.delete_modal_desc')}
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition"
                            >
                                {t('complaints.form.detail.cancel')}
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : t('complaints.form.detail.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-lg overflow-hidden p-6 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-bold text-slate-900">{t('complaints.form.detail.edit_modal_title')}</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {t('complaints.form.detail.edit_description_label')}
                                </label>
                                <textarea
                                    className="ns-input h-32"
                                    value={editForm.problem}
                                    onChange={e => setEditForm({ ...editForm, problem: e.target.value })}
                                    placeholder={t('complaints.form.desc_placeholder')}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {t('complaints.form.detail.edit_category_label')}
                                </label>
                                <CustomSelect value={editForm.category}
                                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                >
                                    <option value="Complaint">{t('complaints.form.types.complaint')}</option>
                                    <option value="Help">{t('complaints.form.types.help')}</option>
                                    <option value="Suggestion">{t('complaints.form.types.suggestion')}</option>
                                    <option value="Other">{t('complaints.form.types.other')}</option>
                                </CustomSelect>
                            </div>

                            <div className="ns-input flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition"
                                >
                                    {t('complaints.form.detail.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium transition disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {updating ? 'Saving...' : t('complaints.form.detail.save_changes')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplaintDetail;
