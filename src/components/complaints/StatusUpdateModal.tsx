import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, Trash2, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from 'sonner';

export interface StatusUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'InProgress' | 'Resolved';
    showStatusSelector?: boolean;
    complaintTitle?: string;
    complaintId?: string;
    onSubmit: (note: string, files: File[], status: 'InProgress' | 'Resolved') => Promise<void>;
}

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
    isOpen,
    onClose,
    mode = 'InProgress',
    showStatusSelector = false,
    complaintTitle,
    complaintId,
    onSubmit,
}) => {
    const { t, language } = useLanguage();
    const [selectedStatus, setSelectedStatus] = useState<'InProgress' | 'Resolved'>(mode);
    const [note, setNote] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isInProgress = selectedStatus === 'InProgress';

    // Update selectedStatus when mode prop changes
    useEffect(() => {
        if (mode) {
            setSelectedStatus(mode);
        }
    }, [mode, isOpen]);

    // Generate previews when files change
    useEffect(() => {
        const objectUrls = files.map(file => ({
            file,
            url: URL.createObjectURL(file)
        }));
        setPreviews(objectUrls);

        return () => {
            objectUrls.forEach(p => URL.revokeObjectURL(p.url));
        };
    }, [files]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setNote('');
            setFiles([]);
            setSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileSelect = (selectedFiles: FileList | null) => {
        if (!selectedFiles) return;
        const validFiles: File[] = [];

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image. Only photos are supported.`);
                continue;
            }
            if (file.size > 15 * 1024 * 1024) {
                toast.error(`${file.name} exceeds 15MB size limit.`);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length > 0) {
            setFiles(prev => [...prev, ...validFiles]);
        }
    };

    const handleRemoveFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            handleFileSelect(e.dataTransfer.files);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!note.trim()) {
            toast.error(isInProgress 
                ? 'Please enter a progress note describing ongoing work.'
                : 'Please enter a resolution note describing how the issue was resolved.'
            );
            return;
        }

        try {
            setSubmitting(true);
            await onSubmit(note.trim(), files, selectedStatus);
            onClose();
        } catch (error: any) {
            console.error('Status modal submit error:', error);
            toast.error(error.message || 'Failed to add progress log.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="notranslate fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/30 backdrop-blur-sm">
            <div className="ns-card relative w-full max-w-md max-h-[88vh] flex flex-col overflow-hidden shadow-xl border border-slate-200">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 border ${
                            isInProgress
                                ? 'bg-blue-50 text-blue-600 border-blue-200'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        }`}>
                            {isInProgress ? (
                                <Clock className="w-4 h-4" />
                            ) : (
                                <CheckCircle className="w-4 h-4" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-slate-900 leading-snug truncate">
                                {isInProgress 
                                    ? (language === 'mr' ? 'कामाची प्रगती नोंदवा' : 'Add Progress Log') 
                                    : (language === 'mr' ? 'काम पूर्ण व निवारण नोंदवा' : 'Add Resolution Log')}
                            </h3>
                            {complaintTitle && (
                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                    {complaintId && <span className="font-mono font-semibold text-slate-600 mr-1">#{complaintId}</span>}
                                    {complaintTitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} id="status-update-form" className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
                    {/* Status Dropdown Selector - only shown when adding arbitrary logs from Add Log button */}
                    {showStatusSelector && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                {language === 'mr' ? 'नोंदीची स्थिती' : 'Log Status'}
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value as 'InProgress' | 'Resolved')}
                                disabled={submitting}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-xs"
                            >
                                <option value="InProgress">
                                    {language === 'mr' ? 'प्रगतीपथावर (In Progress)' : 'In Progress'}
                                </option>
                                <option value="Resolved">
                                    {language === 'mr' ? 'निवारण झाले (Resolved)' : 'Resolved'}
                                </option>
                            </select>
                        </div>
                    )}

                    {/* Note Input */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-slate-700">
                                {isInProgress 
                                    ? (language === 'mr' ? 'प्रगती तपशील' : 'Progress Note')
                                    : (language === 'mr' ? 'निवारण तपशील' : 'Resolution Note')}
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <span className="text-[10px] text-slate-400 font-mono">
                                {note.length} chars
                            </span>
                        </div>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={isInProgress 
                                ? (language === 'mr' ? 'कामाची सद्यस्थिती आणि काय काम झाले आहे ते लिहा...' : 'Describe current work progress, actions taken...') 
                                : (language === 'mr' ? 'काम कशा प्रकारे पूर्ण झाले व समस्या कशी सुटली ते लिहा...' : 'Describe how the issue was completely resolved...')}
                            rows={3}
                            disabled={submitting}
                            required
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-xs resize-none shadow-xs leading-relaxed"
                        />
                    </div>

                    {/* Photo Upload Dropzone */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-slate-700">
                                {language === 'mr' ? 'छायाचित्रे (ऐच्छिक)' : 'Upload Photos (Optional)'}
                            </label>
                            <span className="text-[11px] text-slate-400">
                                Max 15MB each
                            </span>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleFileSelect(e.target.files)}
                            className="hidden"
                            disabled={submitting}
                        />

                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => !submitting && fileInputRef.current?.click()}
                            className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                                isDragging
                                    ? 'border-brand-500 bg-brand-50'
                                    : 'border-slate-200 hover:border-brand-500 hover:bg-slate-50 bg-slate-50/50'
                            } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <div className="p-1.5 bg-white text-brand-600 border border-slate-200 rounded-md shadow-xs shrink-0">
                                    <UploadCloud className="w-4 h-4" />
                                </div>
                                <div className="text-xs text-slate-600 text-left">
                                    <span className="font-semibold text-brand-600 hover:underline">Click to upload</span> or drop photos
                                </div>
                            </div>
                        </div>

                        {/* Previews */}
                        {previews.length > 0 && (
                            <div className="mt-2">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[11px] font-semibold text-slate-700">
                                        Photos ({previews.length})
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setFiles([])}
                                        disabled={submitting}
                                        className="text-[11px] text-red-600 hover:text-red-700 font-semibold"
                                    >
                                        Clear all
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                                    {previews.map((preview, index) => (
                                        <div key={index} className="relative group w-12 h-12 rounded-md overflow-hidden border border-slate-200 bg-white shadow-xs shrink-0">
                                            <img
                                                src={preview.url}
                                                alt={preview.file.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveFile(index);
                                                    }}
                                                    disabled={submitting}
                                                    className="p-1 bg-white text-red-600 rounded-full hover:bg-red-50 shadow-md transition-colors"
                                                    title="Remove photo"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-xs transition-colors"
                    >
                        {t('complaints.form.detail.cancel')}
                    </button>
                    <button
                        type="submit"
                        form="status-update-form"
                        disabled={submitting || !note.trim()}
                        className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg font-medium text-xs shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white bg-brand-600 hover:bg-brand-700"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                {isInProgress ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                <span>
                                    {isInProgress
                                        ? (language === 'mr' ? 'प्रगती नोंद जोडा' : 'Save Progress')
                                        : (language === 'mr' ? 'निवारण नोंद जोडा' : 'Save Resolution')}
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
