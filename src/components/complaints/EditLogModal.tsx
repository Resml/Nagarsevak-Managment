import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, Trash2, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from 'sonner';

export interface EditLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    logIndex: number;
    initialStatus: 'InProgress' | 'Resolved';
    initialNote: string;
    initialImages?: { url: string; name?: string; size?: number }[];
    onSubmit: (
        logIndex: number,
        note: string,
        status: 'InProgress' | 'Resolved',
        remainingExistingImages: { url: string; name?: string; size?: number }[],
        newFiles: File[]
    ) => Promise<void>;
}

export const EditLogModal: React.FC<EditLogModalProps> = ({
    isOpen,
    onClose,
    logIndex,
    initialStatus,
    initialNote,
    initialImages = [],
    onSubmit,
}) => {
    const { t, language } = useLanguage();
    const [status, setStatus] = useState<'InProgress' | 'Resolved'>(initialStatus);
    const [note, setNote] = useState(initialNote);
    const [existingImages, setExistingImages] = useState<{ url: string; name?: string; size?: number }[]>(initialImages);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isInProgress = status === 'InProgress';

    useEffect(() => {
        if (isOpen) {
            setStatus(initialStatus);
            setNote(initialNote);
            setExistingImages(initialImages || []);
            setNewFiles([]);
            setSubmitting(false);
        }
    }, [isOpen, initialStatus, initialNote, initialImages]);

    useEffect(() => {
        const objectUrls = newFiles.map(file => ({
            file,
            url: URL.createObjectURL(file)
        }));
        setPreviews(objectUrls);

        return () => {
            objectUrls.forEach(p => URL.revokeObjectURL(p.url));
        };
    }, [newFiles]);

    if (!isOpen) return null;

    const handleFileSelect = (selectedFiles: FileList | null) => {
        if (!selectedFiles) return;
        const validFiles: File[] = [];

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image.`);
                continue;
            }
            if (file.size > 15 * 1024 * 1024) {
                toast.error(`${file.name} exceeds 15MB limit.`);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length > 0) {
            setNewFiles(prev => [...prev, ...validFiles]);
        }
    };

    const handleRemoveExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveNewFile = (index: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
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
            toast.error('Please enter a note for this log.');
            return;
        }

        try {
            setSubmitting(true);
            await onSubmit(logIndex, note.trim(), status, existingImages, newFiles);
            onClose();
        } catch (error: any) {
            console.error('Edit log submit error:', error);
            toast.error(error.message || 'Failed to update progress log.');
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
                                {language === 'mr' ? 'प्रगती नोंद संपादित करा' : 'Edit Progress Log'}
                            </h3>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                                {language === 'mr' ? `नोंद #${logIndex + 1} बदल करा` : `Update details for Log #${logIndex + 1}`}
                            </p>
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
                <form onSubmit={handleSubmit} id="edit-log-form" className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
                    {/* Status Dropdown Selector */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {language === 'mr' ? 'नोंदीची स्थिती' : 'Log Status'}
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as 'InProgress' | 'Resolved')}
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

                    {/* Note Input */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-slate-700">
                                {language === 'mr' ? 'नोंद तपशील' : 'Note'}
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
                                ? (language === 'mr' ? 'कामाची सद्यस्थिती लिहा...' : 'Describe current work progress...') 
                                : (language === 'mr' ? 'निवारण तपशील लिहा...' : 'Describe resolution details...')}
                            rows={3}
                            disabled={submitting}
                            required
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-xs resize-none shadow-xs leading-relaxed"
                        />
                    </div>

                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                {language === 'mr' ? 'सध्याची छायाचित्रे' : 'Existing Photos'} ({existingImages.length})
                            </label>
                            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                                {existingImages.map((img, idx) => (
                                    <div key={idx} className="relative group w-12 h-12 rounded-md overflow-hidden border border-slate-200 bg-white shadow-xs shrink-0">
                                        <img
                                            src={img.url}
                                            alt={img.name || `Photo ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveExistingImage(idx)}
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

                    {/* Add More Photos */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {language === 'mr' ? 'नवीन छायाचित्रे जोडा' : 'Add New Photos'}
                        </label>

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
                                    <span className="font-semibold text-brand-600 hover:underline">Click to upload</span> or drop more photos
                                </div>
                            </div>
                        </div>

                        {/* New Photos Previews */}
                        {previews.length > 0 && (
                            <div className="mt-2">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[11px] font-semibold text-slate-700">
                                        New Photos ({previews.length})
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setNewFiles([])}
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
                                                        handleRemoveNewFile(index);
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
                        form="edit-log-form"
                        disabled={submitting || !note.trim()}
                        className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg font-medium text-xs shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white bg-brand-600 hover:bg-brand-700"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <span>{language === 'mr' ? 'बदल जतन करा' : 'Save Changes'}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
