import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { type Complaint } from '../../types';
import { type Staff } from '../../types/staff';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Calendar, FileText, MapPin, Mic, Video, Phone, Trash2, X, Clock, CheckCircle, XCircle, Edit, Save, Download, ChevronRight, Image as ImageIcon, Music, File, Maximize2, Eye, Sparkles, Check, ZoomIn, User, Layers, CheckCircle2, Edit3, Plus, Edit2 } from 'lucide-react';
import { SecureStorageService } from '../../services/secureStorageService';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import clsx from 'clsx';

import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { translateText } from '../../services/translationService';
import { TranslatedText } from '../../components/TranslatedText';
import { CustomSelect } from '../../components/common/CustomSelect';
import { StatusUpdateModal } from '../../components/complaints/StatusUpdateModal';
import { EditLogModal } from '../../components/complaints/EditLogModal';

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

    // Status Update Modal State
    const [statusModalState, setStatusModalState] = useState<{
        isOpen: boolean;
        mode: 'InProgress' | 'Resolved';
        showStatusSelector?: boolean;
    }>({
        isOpen: false,
        mode: 'InProgress',
        showStatusSelector: false
    });

    // Image Lightbox State
    const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string } | null>(null);

    // Edit & Delete Progress Log States
    const [editingLog, setEditingLog] = useState<{
        isOpen: boolean;
        index: number;
        status: 'InProgress' | 'Resolved';
        note: string;
        images?: { url: string; name?: string; size?: number }[];
    } | null>(null);

    const [deletingLogIndex, setDeletingLogIndex] = useState<number | null>(null);
    const [deletingLog, setDeletingLog] = useState(false);

    // Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [editForm, setEditForm] = useState({
        problem: '',
        category: ''
    });

    const resolveMetaImages = async (imagesList: any[]) => {
        if (!Array.isArray(imagesList) || imagesList.length === 0) return [];
        return await Promise.all(
            imagesList.map(async (img: any) => {
                const rawUrl = typeof img === 'string' ? img : (img?.url || '');
                const secureUrl = rawUrl ? await SecureStorageService.getUrl('documents', rawUrl) : '';
                return {
                    url: secureUrl,
                    name: typeof img === 'object' && img?.name ? img.name : 'Photo',
                    size: typeof img === 'object' && img?.size ? img.size : 0
                };
            })
        );
    };

    const parseProgressUpdatesFromMeta = async (parsedMeta: any, fallbackWip?: any, fallbackRes?: any) => {
        let updates: any[] = [];
        if (parsedMeta?.progress_updates && Array.isArray(parsedMeta.progress_updates) && parsedMeta.progress_updates.length > 0) {
            updates = await Promise.all(
                parsedMeta.progress_updates.map(async (u: any) => ({
                    note: u.note || '',
                    images: await resolveMetaImages(u.images),
                    status: u.status || 'InProgress',
                    timestamp: u.timestamp || u.updated_at || u.resolved_at || new Date().toISOString(),
                    updatedBy: u.updated_by || u.resolved_by
                }))
            );
        } else {
            if (fallbackWip) {
                updates.push({
                    note: fallbackWip.note,
                    images: fallbackWip.images || [],
                    status: 'InProgress',
                    timestamp: fallbackWip.updatedAt,
                    updatedBy: fallbackWip.updatedBy
                });
            }
            if (fallbackRes) {
                updates.push({
                    note: fallbackRes.note,
                    images: fallbackRes.images || [],
                    status: 'Resolved',
                    timestamp: fallbackRes.resolvedAt,
                    updatedBy: fallbackRes.resolvedBy
                });
            }
        }
        return updates;
    };

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

                    let parsedMeta = null;
                    try {
                        parsedMeta = typeof data.description_meta === 'string' ? JSON.parse(data.description_meta) : (data.description_meta || null);
                    } catch (e) {
                        console.error("Error parsing meta", e);
                    }

                    let workInProgress = undefined;
                    if (parsedMeta?.work_in_progress) {
                        workInProgress = {
                            note: parsedMeta.work_in_progress.note || '',
                            images: await resolveMetaImages(parsedMeta.work_in_progress.images),
                            updatedAt: parsedMeta.work_in_progress.updated_at || data.created_at,
                            updatedBy: parsedMeta.work_in_progress.updated_by
                        };
                    }

                    let resolutionDetails = undefined;
                    if (parsedMeta?.resolution_details) {
                        resolutionDetails = {
                            note: parsedMeta.resolution_details.note || '',
                            images: await resolveMetaImages(parsedMeta.resolution_details.images),
                            resolvedAt: parsedMeta.resolution_details.resolved_at || data.created_at,
                            resolvedBy: parsedMeta.resolution_details.resolved_by
                        };
                    }

                    const progressUpdates = await parseProgressUpdatesFromMeta(parsedMeta, workInProgress, resolutionDetails);

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
                        attachments: resolvedAttachments,
                        workInProgress,
                        resolutionDetails,
                        progressUpdates
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

                    let parsedMeta = null;
                    try {
                        parsedMeta = typeof data.description_meta === 'string' ? JSON.parse(data.description_meta) : (data.description_meta || null);
                    } catch (e) {
                        console.error("Error parsing meta", e);
                    }

                    let workInProgress = undefined;
                    if (parsedMeta?.work_in_progress) {
                        workInProgress = {
                            note: parsedMeta.work_in_progress.note || '',
                            images: await resolveMetaImages(parsedMeta.work_in_progress.images),
                            updatedAt: parsedMeta.work_in_progress.updated_at || data.created_at,
                            updatedBy: parsedMeta.work_in_progress.updated_by
                        };
                    }

                    let resolutionDetails = undefined;
                    if (parsedMeta?.resolution_details) {
                        resolutionDetails = {
                            note: parsedMeta.resolution_details.note || '',
                            images: await resolveMetaImages(parsedMeta.resolution_details.images),
                            resolvedAt: parsedMeta.resolution_details.resolved_at || data.created_at,
                            resolvedBy: parsedMeta.resolution_details.resolved_by
                        };
                    }

                    const progressUpdates = await parseProgressUpdatesFromMeta(parsedMeta, workInProgress, resolutionDetails);

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
                        attachments: resolvedAttachments,
                        workInProgress,
                        resolutionDetails,
                        progressUpdates
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

                    let workInProgress = undefined;
                    if (parsedMeta?.work_in_progress) {
                        workInProgress = {
                            note: parsedMeta.work_in_progress.note || '',
                            images: await resolveMetaImages(parsedMeta.work_in_progress.images),
                            updatedAt: parsedMeta.work_in_progress.updated_at || data.created_at,
                            updatedBy: parsedMeta.work_in_progress.updated_by
                        };
                    }

                    let resolutionDetails = undefined;
                    if (parsedMeta?.resolution_details) {
                        resolutionDetails = {
                            note: parsedMeta.resolution_details.note || '',
                            images: await resolveMetaImages(parsedMeta.resolution_details.images),
                            resolvedAt: parsedMeta.resolution_details.resolved_at || data.created_at,
                            resolvedBy: parsedMeta.resolution_details.resolved_by
                        };
                    }

                    const progressUpdates = await parseProgressUpdatesFromMeta(parsedMeta, workInProgress, resolutionDetails);

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
                        added_by_staff_id: data.added_by_staff_id,
                        workInProgress,
                        resolutionDetails,
                        progressUpdates
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

    const handleOpenStatusModal = (mode: 'InProgress' | 'Resolved', showStatusSelector = false) => {
        setStatusModalState({
            isOpen: true,
            mode,
            showStatusSelector
        });
    };

    const handleStatusModalSubmit = async (note: string, files: File[], customStatus?: 'InProgress' | 'Resolved') => {
        if (!complaint) return;
        try {
            const isPersonal = complaint.id.startsWith('pr-');
            const isAreaProblem = complaint.id.startsWith('ap-');
            const actualId = (isPersonal || isAreaProblem) ? complaint.id.split('-').slice(1).join('-') : complaint.id;
            const table = isPersonal ? 'personal_requests' : isAreaProblem ? 'area_problems' : 'complaints';
            const targetStatus = customStatus || statusModalState.mode;

            // 1. Upload files concurrently
            const uploadedImages = await Promise.all(
                files.map(async (file) => {
                    const relativePath = await SecureStorageService.uploadFile('documents', 'complaints', file);
                    return {
                        url: relativePath,
                        name: file.name,
                        size: file.size,
                        type: file.type
                    };
                })
            );

            // 2. Fetch existing description_meta to prevent race condition / overwriting
            const { data: currentData } = await supabase
                .from(table)
                .select('description_meta')
                .eq('id', actualId)
                .single();

            let metaObj: any = {};
            if (currentData?.description_meta) {
                metaObj = typeof currentData.description_meta === 'string'
                    ? JSON.parse(currentData.description_meta)
                    : currentData.description_meta;
            }

            const timestamp = new Date().toISOString();
            const updaterName = user?.name || user?.email || 'Staff';

            const newUpdateRecord = {
                note,
                images: uploadedImages,
                status: targetStatus,
                timestamp,
                updated_by: updaterName
            };

            const existingUpdates = Array.isArray(metaObj.progress_updates) ? metaObj.progress_updates : [];
            metaObj.progress_updates = [...existingUpdates, newUpdateRecord];

            if (targetStatus === 'InProgress') {
                metaObj.work_in_progress = {
                    note,
                    images: uploadedImages,
                    updated_at: timestamp,
                    updated_by: updaterName
                };
            } else if (targetStatus === 'Resolved') {
                metaObj.resolution_details = {
                    note,
                    images: uploadedImages,
                    resolved_at: timestamp,
                    resolved_by: updaterName
                };
            }

            // 3. Update database
            const updatePayload: any = {
                status: targetStatus,
                description_meta: metaObj
            };

            const { error: updateError } = await supabase
                .from(table)
                .update(updatePayload)
                .eq('id', actualId)
                .eq('tenant_id', tenantId);

            if (updateError) {
                console.error('Error updating status in DB:', updateError);
                throw updateError;
            }

            // 4. Resolve URLs for immediate local preview
            const resolvedNewImages = await Promise.all(
                uploadedImages.map(async (img) => ({
                    url: await SecureStorageService.getUrl('documents', img.url),
                    name: img.name,
                    size: img.size
                }))
            );

            const newLocalUpdate = {
                note,
                images: resolvedNewImages,
                status: targetStatus as any,
                timestamp,
                updatedBy: updaterName
            };

            setComplaint(prev => {
                if (!prev) return undefined;
                const currentUpdates = prev.progressUpdates ? [...prev.progressUpdates, newLocalUpdate] : [newLocalUpdate];
                return {
                    ...prev,
                    status: targetStatus as any,
                    progressUpdates: currentUpdates,
                    workInProgress: targetStatus === 'InProgress' ? {
                        note,
                        images: resolvedNewImages,
                        updatedAt: timestamp,
                        updatedBy: updaterName
                    } : prev.workInProgress,
                    resolutionDetails: targetStatus === 'Resolved' ? {
                        note,
                        images: resolvedNewImages,
                        resolvedAt: timestamp,
                        resolvedBy: updaterName
                    } : prev.resolutionDetails
                };
            });

            toast.success(targetStatus === 'InProgress' 
                ? (language === 'mr' ? 'कामाची प्रगती यशस्वीरित्या नोंदवली!' : 'Work marked in progress with notes & photos!')
                : (language === 'mr' ? 'तक्रार यशस्वीरित्या निवारण म्हणून नोंदवली!' : 'Complaint marked as resolved with completion notes & photos!')
            );
        } catch (err: any) {
            console.error('Error updating status with modal:', err);
            toast.error(err.message || 'Failed to update status');
            throw err;
        }
    };

    const handleOpenEditLogModal = (index: number, update: any) => {
        setEditingLog({
            isOpen: true,
            index,
            status: update.status || 'InProgress',
            note: update.note || '',
            images: update.images || []
        });
    };

    const handleSaveEditLog = async (
        logIndex: number,
        note: string,
        targetStatus: 'InProgress' | 'Resolved',
        remainingExistingImages: { url: string; name?: string; size?: number }[],
        newFiles: File[]
    ) => {
        if (!complaint) return;
        try {
            const isPersonal = complaint.id.startsWith('pr-');
            const isAreaProblem = complaint.id.startsWith('ap-');
            const actualId = (isPersonal || isAreaProblem) ? complaint.id.split('-').slice(1).join('-') : complaint.id;
            const table = isPersonal ? 'personal_requests' : isAreaProblem ? 'area_problems' : 'complaints';

            // 1. Upload new files if any
            const uploadedNewImages = await Promise.all(
                newFiles.map(async (file) => {
                    const relativePath = await SecureStorageService.uploadFile('documents', 'complaints', file);
                    return {
                        url: relativePath,
                        name: file.name,
                        size: file.size,
                        type: file.type
                    };
                })
            );

            // 2. Fetch current description_meta
            const { data: currentData } = await supabase
                .from(table)
                .select('description_meta')
                .eq('id', actualId)
                .single();

            let metaObj: any = {};
            if (currentData?.description_meta) {
                metaObj = typeof currentData.description_meta === 'string'
                    ? JSON.parse(currentData.description_meta)
                    : currentData.description_meta;
            }

            const existingUpdates = Array.isArray(metaObj.progress_updates) ? [...metaObj.progress_updates] : [];
            const originalRecord = existingUpdates[logIndex] || {};

            // Retain original stored image objects that were not removed
            const origImages: any[] = originalRecord.images || [];
            const keptOrigImages = origImages.filter(orig =>
                remainingExistingImages.some(rem => rem.name === orig.name || rem.url === orig.url || rem.url.includes(orig.url))
            );

            const updatedStoredImages = [...keptOrigImages, ...uploadedNewImages];

            const updatedRecord = {
                ...originalRecord,
                note,
                status: targetStatus,
                images: updatedStoredImages,
                updated_by: user?.name || user?.email || originalRecord.updated_by || 'Staff'
            };

            if (logIndex >= 0 && logIndex < existingUpdates.length) {
                existingUpdates[logIndex] = updatedRecord;
            } else {
                existingUpdates.push(updatedRecord);
            }

            metaObj.progress_updates = existingUpdates;

            // If updating latest log, sync work_in_progress or resolution_details
            if (logIndex === existingUpdates.length - 1) {
                if (targetStatus === 'InProgress') {
                    metaObj.work_in_progress = {
                        note,
                        images: updatedStoredImages,
                        updated_at: originalRecord.timestamp || new Date().toISOString(),
                        updated_by: updatedRecord.updated_by
                    };
                } else if (targetStatus === 'Resolved') {
                    metaObj.resolution_details = {
                        note,
                        images: updatedStoredImages,
                        resolved_at: originalRecord.timestamp || new Date().toISOString(),
                        resolved_by: updatedRecord.updated_by
                    };
                }
            }

            const { error: updateError } = await supabase
                .from(table)
                .update({ description_meta: metaObj })
                .eq('id', actualId)
                .eq('tenant_id', tenantId);

            if (updateError) throw updateError;

            // Resolve preview URLs for newly uploaded images
            const resolvedNewUploaded = await Promise.all(
                uploadedNewImages.map(async (img) => ({
                    url: await SecureStorageService.getUrl('documents', img.url),
                    name: img.name,
                    size: img.size
                }))
            );

            const allResolvedLocalImages = [...remainingExistingImages, ...resolvedNewUploaded];

            setComplaint(prev => {
                if (!prev) return undefined;
                const current = prev.progressUpdates ? [...prev.progressUpdates] : [];
                if (logIndex >= 0 && logIndex < current.length) {
                    current[logIndex] = {
                        ...current[logIndex],
                        note,
                        status: targetStatus as any,
                        images: allResolvedLocalImages,
                        updatedBy: updatedRecord.updated_by
                    };
                }
                return {
                    ...prev,
                    progressUpdates: current
                };
            });

            toast.success(language === 'mr' ? 'प्रगती नोंद यशस्वीरित्या बदलली!' : 'Progress log updated successfully!');
            setEditingLog(null);
        } catch (err: any) {
            console.error('Error saving edited log:', err);
            toast.error(err.message || 'Failed to update log');
            throw err;
        }
    };

    const handleOpenDeleteLogModal = (index: number) => {
        setDeletingLogIndex(index);
    };

    const handleConfirmDeleteLog = async () => {
        if (deletingLogIndex === null || !complaint) return;
        setDeletingLog(true);
        try {
            const isPersonal = complaint.id.startsWith('pr-');
            const isAreaProblem = complaint.id.startsWith('ap-');
            const actualId = (isPersonal || isAreaProblem) ? complaint.id.split('-').slice(1).join('-') : complaint.id;
            const table = isPersonal ? 'personal_requests' : isAreaProblem ? 'area_problems' : 'complaints';

            const { data: currentData } = await supabase
                .from(table)
                .select('description_meta')
                .eq('id', actualId)
                .single();

            let metaObj: any = {};
            if (currentData?.description_meta) {
                metaObj = typeof currentData.description_meta === 'string'
                    ? JSON.parse(currentData.description_meta)
                    : currentData.description_meta;
            }

            const existingUpdates = Array.isArray(metaObj.progress_updates) ? [...metaObj.progress_updates] : [];
            existingUpdates.splice(deletingLogIndex, 1);
            metaObj.progress_updates = existingUpdates;

            const { error: updateError } = await supabase
                .from(table)
                .update({ description_meta: metaObj })
                .eq('id', actualId)
                .eq('tenant_id', tenantId);

            if (updateError) throw updateError;

            setComplaint(prev => {
                if (!prev) return undefined;
                const current = prev.progressUpdates ? [...prev.progressUpdates] : [];
                current.splice(deletingLogIndex, 1);
                return {
                    ...prev,
                    progressUpdates: current
                };
            });

            toast.success(language === 'mr' ? 'प्रगती नोंद यशस्वीरित्या हटवली!' : 'Progress log deleted successfully!');
            setDeletingLogIndex(null);
        } catch (err: any) {
            console.error('Error deleting log:', err);
            toast.error(err.message || 'Failed to delete log');
        } finally {
            setDeletingLog(false);
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
                    {/* Top Ticket Overview Card - Original Simple Layout */}
                    <div className={clsx(
                        "p-6 rounded-xl shadow-sm border notranslate overflow-hidden",
                        complaint.status === 'Resolved' ? "bg-green-50 border-green-300" :
                        (complaint.status === 'InProgress' || complaint.status === 'Assigned') ? "bg-yellow-50 border-yellow-300" :
                        complaint.status === 'Pending' ? "bg-red-50 border-red-300" :
                        "bg-white border-slate-200"
                    )}>
                        <div className="flex justify-between items-start mb-4 gap-3">
                            <div className="min-w-0 flex-1">
                                <span className={`notranslate ns-badge border-transparent ${complaint.type === 'Help' ? 'bg-purple-100 text-purple-700' : 'bg-brand-50 text-brand-800'}`}>
                                    {t(`complaints.form.types.${complaint.type == 'Personal Help' ? 'personal_help' : complaint.type.toLowerCase().replace(/ /g, '_')}`) || complaint.type}
                                </span>
                                <h1 className="text-2xl font-bold text-slate-900 mt-3 break-words leading-snug">
                                    {translatedData ? translatedData.title : complaint.title}
                                </h1>
                            </div>
                            <span className={`ns-badge px-3 py-1 text-sm border font-semibold shrink-0 ${
                                complaint.status === 'Resolved' ? 'bg-green-100 text-green-800 border-green-200' :
                                complaint.status === 'InProgress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                complaint.status === 'Assigned' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                complaint.status === 'Pending' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-100 text-gray-800'
                            }`}>
                                {complaint.status === 'Pending' ? t('complaints.status.pending') :
                                    complaint.status === 'Assigned' ? t('complaints.status.assigned') :
                                        complaint.status === 'Resolved' ? t('complaints.status.resolved') :
                                            complaint.status === 'InProgress' ? t('complaints.status.in_progress') :
                                                t('complaints.status.closed')}
                            </span>
                        </div>

                        {/* Description Box */}
                        <div className="text-slate-700 mb-6 bg-white/70 p-4 rounded-xl border border-white/50 overflow-hidden shadow-sm">
                            <p className="whitespace-pre-wrap font-medium leading-relaxed break-words [overflow-wrap:anywhere]">
                                {translatedData ? translatedData.description : complaint.description}
                            </p>
                        </div>

                        {/* Media Section */}
                        <div className="space-y-4 notranslate">
                            {complaint.attachments && complaint.attachments.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-slate-500" /> Attachments ({complaint.attachments.length})
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {complaint.attachments.map((att, idx) => {
                                            const isImage = att.type.startsWith('image/');
                                            const isVideo = att.type.startsWith('video/');
                                            const isAudio = att.type.startsWith('audio/');

                                            return (
                                                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-xs min-w-0">
                                                    {isImage ? (
                                                        <div
                                                            onClick={() => setLightboxImage({ url: att.url, title: att.name || `Attachment ${idx + 1}` })}
                                                            className="block cursor-pointer relative group aspect-4/3 overflow-hidden bg-slate-100"
                                                        >
                                                            <img src={att.url} alt={att.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                                <Eye className="w-5 h-5" />
                                                            </div>
                                                        </div>
                                                    ) : isVideo ? (
                                                        <video controls className="w-full h-40 bg-black">
                                                            <source src={att.url} type={att.type} />
                                                        </video>
                                                    ) : isAudio ? (
                                                        <div className="p-3">
                                                            <audio controls className="w-full h-8">
                                                                <source src={att.url} type={att.type} />
                                                            </audio>
                                                        </div>
                                                    ) : (
                                                        <a href={att.url} target="_blank" rel="noreferrer" className="p-3 flex items-center justify-between hover:bg-slate-100 transition-colors">
                                                            <span className="truncate text-xs font-medium text-slate-800 break-all">{att.name}</span>
                                                            <Download className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                                                        </a>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Legacy Single Photo fallback */}
                            {(!complaint.attachments || complaint.attachments.length === 0) && complaint.imageUrl && (
                                <div
                                    onClick={() => setLightboxImage({ url: complaint.imageUrl!, title: 'Evidence Photo' })}
                                    className="max-w-sm aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer relative group shadow-xs"
                                >
                                    <img src={complaint.imageUrl} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <Eye className="w-5 h-5" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Location & Date Footer */}
                        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="truncate"><TranslatedText text={complaint.location || ''} /></span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                {format(new Date(complaint.createdAt), 'PP p')}
                            </div>
                        </div>
                    </div>

                    {/* Progress History Section - Alternating Left & Right Timeline */}
                    <div className="ns-card p-6 shadow-sm notranslate overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-2 min-w-0">
                                <Clock className="w-5 h-5 text-brand-600 shrink-0" />
                                <h3 className="text-lg font-bold text-slate-900 truncate">
                                    {language === 'mr' ? 'कामाचा प्रगती इतिहास' : 'Progress History'}
                                </h3>
                            </div>

                            {isAdminOrStaff && (
                                <button
                                    type="button"
                                    onClick={() => handleOpenStatusModal('InProgress', true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors shrink-0"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{language === 'mr' ? 'नोंद जोडा' : 'Add Log'}</span>
                                </button>
                            )}
                        </div>

                        {complaint.progressUpdates && complaint.progressUpdates.length > 0 ? (
                            <div className="relative py-2">
                                {/* Center Vertical Stem Line */}
                                <div className="absolute top-3 bottom-3 left-4 md:left-1/2 -ml-px w-0.5 bg-slate-200 z-0" />

                                <div className="space-y-6 relative z-10">
                                    {complaint.progressUpdates.map((update, index) => {
                                        // Alternate: index 0 -> Left, index 1 -> Right, index 2 -> Left, index 3 -> Right
                                        const isLeft = index % 2 === 0;
                                        const isResolved = update.status === 'Resolved';

                                        return (
                                            <div
                                                key={index}
                                                className="relative flex flex-col md:flex-row items-start md:items-center min-w-0"
                                            >
                                                {/* Center Node Icon Marker on Line */}
                                                <div className={`absolute left-4 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-xs z-20 shrink-0 ${
                                                    isResolved
                                                        ? 'border-2 border-emerald-400 text-emerald-600'
                                                        : 'border-2 border-blue-400 text-blue-600'
                                                }`}>
                                                    {isResolved ? (
                                                        <Check className="w-4 h-4" />
                                                    ) : (
                                                        <Edit3 className="w-4 h-4" />
                                                    )}
                                                </div>

                                                {/* Left Branch (Render on Left when isLeft is true on desktop) */}
                                                <div className={`w-full pl-11 md:pl-0 md:w-1/2 min-w-0 ${
                                                    isLeft ? 'md:pr-8' : 'md:hidden'
                                                }`}>
                                                    {isLeft && (
                                                        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3 overflow-hidden min-w-0">
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                                                                        isResolved
                                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                                                    }`}>
                                                                        {update.status === 'InProgress' ? (language === 'mr' ? 'प्रगतीपथावर' : 'In Progress') : update.status}
                                                                    </span>
                                                                    <span className="text-xs text-slate-400 font-medium">
                                                                        {format(new Date(update.timestamp), 'MMM d, h:mm a')}
                                                                    </span>
                                                                </div>

                                                                {isAdminOrStaff && (
                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleOpenEditLogModal(index, update)}
                                                                            className="p-1 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-md transition-colors"
                                                                            title={language === 'mr' ? 'नोंद संपादित करा' : 'Edit Log'}
                                                                        >
                                                                            <Edit2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleOpenDeleteLogModal(index)}
                                                                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                                            title={language === 'mr' ? 'नोंद हटवा' : 'Delete Log'}
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                                                                {update.note}
                                                            </p>

                                                            {update.images && update.images.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 pt-1">
                                                                    {update.images.map((img, imgIdx) => (
                                                                        <div
                                                                            key={imgIdx}
                                                                            onClick={() => setLightboxImage({ url: img.url, title: `Update Photo ${imgIdx + 1}` })}
                                                                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity shadow-2xs shrink-0 bg-slate-50"
                                                                        >
                                                                            <img
                                                                                src={img.url}
                                                                                alt={img.name || `Photo ${imgIdx + 1}`}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {update.updatedBy && (
                                                                <div className="text-right text-xs text-slate-400 pt-1 truncate">
                                                                    Updated by <span className="text-slate-600 font-medium">{update.updatedBy}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right Branch (Render on Right when isLeft is false on desktop) */}
                                                <div className={`w-full pl-11 md:pl-0 md:w-1/2 min-w-0 ${
                                                    !isLeft ? 'md:pl-8 md:ml-auto' : 'hidden md:block'
                                                }`}>
                                                    {!isLeft && (
                                                        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3 overflow-hidden min-w-0">
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                                                                        isResolved
                                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                                                    }`}>
                                                                        {update.status === 'InProgress' ? (language === 'mr' ? 'प्रगतीपथावर' : 'In Progress') : update.status}
                                                                    </span>
                                                                    <span className="text-xs text-slate-400 font-medium">
                                                                        {format(new Date(update.timestamp), 'MMM d, h:mm a')}
                                                                    </span>
                                                                </div>

                                                                {isAdminOrStaff && (
                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleOpenEditLogModal(index, update)}
                                                                            className="p-1 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-md transition-colors"
                                                                            title={language === 'mr' ? 'नोंद संपादित करा' : 'Edit Log'}
                                                                        >
                                                                            <Edit2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleOpenDeleteLogModal(index)}
                                                                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                                            title={language === 'mr' ? 'नोंद हटवा' : 'Delete Log'}
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                                                                {update.note}
                                                            </p>

                                                            {update.images && update.images.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 pt-1">
                                                                    {update.images.map((img, imgIdx) => (
                                                                        <div
                                                                            key={imgIdx}
                                                                            onClick={() => setLightboxImage({ url: img.url, title: `Update Photo ${imgIdx + 1}` })}
                                                                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity shadow-2xs shrink-0 bg-slate-50"
                                                                        >
                                                                            <img
                                                                                src={img.url}
                                                                                alt={img.name || `Photo ${imgIdx + 1}`}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {update.updatedBy && (
                                                                <div className="text-right text-xs text-slate-400 pt-1 truncate">
                                                                    Updated by <span className="text-slate-600 font-medium">{update.updatedBy}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-xs">
                                {language === 'mr' ? 'अद्याप कोणताही प्रगती इतिहास नोंदवला नाही.' : 'No progress updates recorded yet.'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6 notranslate">
                    {isAdminOrStaff && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4 tracking-tight">{t('complaints.form.detail.manage_ticket')}</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{t('complaints.form.detail.update_status')}</label>
                                    <div className="flex flex-col gap-2.5">
                                        {!complaint.id.startsWith('pr-') && (
                                            <button
                                                onClick={() => handleOpenStatusModal('InProgress')}
                                                className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                                                    complaint.status === 'InProgress'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold shadow-xs'
                                                        : 'border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50'
                                                }`}
                                            >
                                                <Clock className={`w-4 h-4 shrink-0 ${complaint.status === 'InProgress' ? 'text-blue-600' : 'text-slate-400'}`} />
                                                <span>
                                                    {complaint.status === 'InProgress'
                                                        ? (language === 'mr' ? 'प्रगती तपशील अपडेट करा' : 'Update Work In Progress')
                                                        : t('complaints.form.detail.mark_in_progress')}
                                                </span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleOpenStatusModal('Resolved')}
                                            className={`w-full flex items-center justify-start gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                                                complaint.status === 'Resolved'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold shadow-xs'
                                                    : 'border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                                            }`}
                                        >
                                            <CheckCircle className={`w-4 h-4 shrink-0 ${complaint.status === 'Resolved' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                            <span>
                                                {complaint.status === 'Resolved'
                                                    ? (language === 'mr' ? 'निवारण तपशील अपडेट करा' : 'Update Resolution Details')
                                                    : t('complaints.form.detail.mark_resolved')}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Assignment */}
                                {(user?.role === 'admin' || user?.can_assign_work === true) && (
                                    <div className="pt-4 border-t border-slate-200">
                                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{t('complaints.form.detail.assign_staff')}</label>
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
                                                }} className="ns-input border-slate-300"
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

                    {/* Meta / Ticket Details Card (Monochrome) */}
                    <div className="bg-white border border-slate-300 rounded-2xl p-6 shadow-xs">
                        <h3 className="font-bold text-black mb-4 tracking-tight">{t('complaints.form.detail.ticket_details')}</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">{t('complaints.form.detail.ticket_id')}</span>
                                <span className="font-mono font-bold text-black">#{complaint.id}</span>
                            </li>
                            <li className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">{t('complaints.form.detail.citizen')}</span>
                                <span className="font-semibold text-black">
                                    {(language === 'mr' && complaint.voter?.name_marathi)
                                        ? complaint.voter.name_marathi
                                        : <TranslatedText text={complaint.voter?.name_english || complaint.voter?.name_marathi || t('complaints.form.detail.anonymous')} isName={true} />}
                                </span>
                            </li>
                            {(complaint.voter?.mobile) && (
                                <li className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">{t('complaints.form.detail.mobile')}</span>
                                    <span className="font-mono font-medium text-black">{complaint.voter.mobile}</span>
                                </li>
                            )}
                            <li className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500">{t('complaints.form.detail.assigned_to')}</span>
                                <div>
                                    {staffList.find(s => s.id === assignee) ? (
                                        <div className="text-right">
                                            <div className="font-bold text-black"><TranslatedText text={staffList.find(s => s.id === assignee)?.name || ''} isName={true} /></div>
                                            <div className="text-xs text-slate-600 font-mono flex items-center justify-end gap-1">
                                                <Phone className="w-3 h-3" />
                                                {staffList.find(s => s.id === assignee)?.mobile}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 font-medium">{t('complaints.form.detail.unassigned')}</span>
                                    )}
                                </div>
                            </li>
                            {complaint.added_by_staff_id && (
                                <li className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Added By</span>
                                    <div className="text-right font-semibold text-black">
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

            {/* Status Update Modal */}
            <StatusUpdateModal
                isOpen={statusModalState.isOpen}
                onClose={() => setStatusModalState(prev => ({ ...prev, isOpen: false }))}
                mode={statusModalState.mode}
                showStatusSelector={statusModalState.showStatusSelector}
                complaintTitle={translatedData ? translatedData.title : complaint.title}
                complaintId={complaint.id}
                onSubmit={handleStatusModalSubmit}
            />

            {/* Edit Progress Log Modal */}
            {editingLog && (
                <EditLogModal
                    isOpen={editingLog.isOpen}
                    onClose={() => setEditingLog(null)}
                    logIndex={editingLog.index}
                    initialStatus={editingLog.status}
                    initialNote={editingLog.note}
                    initialImages={editingLog.images}
                    onSubmit={handleSaveEditLog}
                />
            )}

            {/* Delete Log Confirmation Modal */}
            {deletingLogIndex !== null && (
                <div className="notranslate fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-sm overflow-hidden p-6 space-y-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">
                                {language === 'mr' ? 'प्रगती नोंद हटवायची का?' : 'Delete Progress Log?'}
                            </h3>
                            <p className="text-slate-500 mt-2 text-sm">
                                {language === 'mr'
                                    ? 'तुम्हाला ही प्रगती नोंद कायमची हटवायची आहे का? ही क्रिया पूर्ववत करता येणार नाही.'
                                    : 'Are you sure you want to delete this progress log? This action cannot be undone.'}
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setDeletingLogIndex(null)}
                                disabled={deletingLog}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition"
                            >
                                {t('complaints.form.detail.cancel')}
                            </button>
                            <button
                                onClick={handleConfirmDeleteLog}
                                disabled={deletingLog}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition disabled:opacity-50"
                            >
                                {deletingLog ? 'Deleting...' : (language === 'mr' ? 'हटवा' : 'Delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Lightbox Viewer Modal */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setLightboxImage(null)}
                >
                    <div
                        className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-700"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-3.5 px-5 bg-slate-900 text-white border-b border-slate-800">
                            <span className="text-sm font-medium truncate">{lightboxImage.title || 'Photo View'}</span>
                            <div className="flex items-center gap-2">
                                <a
                                    href={lightboxImage.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    download
                                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Open / Download photo"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                                <button
                                    onClick={() => setLightboxImage(null)}
                                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-3 flex items-center justify-center bg-black/60 overflow-auto max-h-[80vh]">
                            <img
                                src={lightboxImage.url}
                                alt={lightboxImage.title || 'Enlarged photo'}
                                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplaintDetail;
