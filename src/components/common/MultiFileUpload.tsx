import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Trash2, File, FileText, Image as ImageIcon, Video, Music, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';

export interface MultiFileUploadProps {
    files: File[];
    onChange: (files: File[]) => void;
    maxFiles?: number;
    maxSizeMB?: number;
    accept?: string;
    className?: string;
    title?: string;
    subtitle?: string;
}

export const isImageFile = (file: File) => {
    if (file.type && file.type.startsWith('image/')) return true;
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'heic', 'heif', 'svg'].includes(ext || '');
};

export const isVideoFile = (file: File) => {
    if (file.type && file.type.startsWith('video/')) return true;
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp'].includes(ext || '');
};

export const isAudioFile = (file: File) => {
    if (file.type && file.type.startsWith('audio/')) return true;
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus', 'wma', 'amr'].includes(ext || '');
};

export const isPdfFile = (file: File) => {
    if (file.type === 'application/pdf') return true;
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext === 'pdf';
};

export const isWordFile = (file: File) => {
    if (file.type.includes('word') || file.type.includes('officedocument.wordprocessingml')) return true;
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ['doc', 'docx'].includes(ext || '');
};

export const isExcelFile = (file: File) => {
    if (file.type.includes('sheet') || file.type.includes('excel') || file.type.includes('spreadsheetml')) return true;
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ['xls', 'xlsx', 'csv'].includes(ext || '');
};

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export function MultiFileUpload({
    files,
    onChange,
    maxFiles = 10,
    maxSizeMB = 50,
    accept = "*/*",
    className,
    title,
    subtitle
}: MultiFileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Generate previews when files change - Identical to StatusUpdateModal
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

    const handleFileSelect = (selectedFiles: FileList | null) => {
        if (!selectedFiles) return;
        setError(null);
        const validFiles: File[] = [];

        if (files.length + selectedFiles.length > maxFiles) {
            const msg = `You can only upload a maximum of ${maxFiles} files.`;
            setError(msg);
            toast.error(msg);
            return;
        }

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            if (file.size > maxSizeMB * 1024 * 1024) {
                const msg = `${file.name} exceeds the ${maxSizeMB}MB size limit.`;
                setError(msg);
                toast.error(msg);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length > 0) {
            onChange([...files, ...validFiles]);
        }
    };

    const handleRemoveFile = (index: number) => {
        onChange(files.filter((_, i) => i !== index));
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

    const handleClickUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        fileInputRef.current?.click();
    };

    // Separate visual media (images/videos) from audio and documents for optimal UI
    const mediaPreviews = previews
        .map((preview, index) => ({ preview, originalIndex: index }))
        .filter(({ preview }) => isImageFile(preview.file) || isVideoFile(preview.file));

    const otherPreviews = previews
        .map((preview, index) => ({ preview, originalIndex: index }))
        .filter(({ preview }) => !isImageFile(preview.file) && !isVideoFile(preview.file));

    return (
        <div className={clsx("w-full", className)}>
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
            />

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClickUpload}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    isDragging
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-300 hover:border-brand-500 hover:bg-slate-50 bg-slate-50/50'
                }`}
            >
                <div className="flex flex-col items-center justify-center">
                    <div className="p-3 bg-white text-brand-600 border border-slate-200 rounded-full shadow-xs shrink-0 mb-2">
                        <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-medium text-slate-700">
                        {title || 'Click to upload or drop photos/files'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                        {subtitle || `Max ${maxSizeMB}MB each`}
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-2 flex items-center text-red-600 text-xs bg-red-50 p-2.5 rounded-lg border border-red-100">
                    <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Previews */}
            {previews.length > 0 && (
                <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">
                            Attached Files ({previews.length})
                        </span>
                        <button
                            type="button"
                            onClick={() => onChange([])}
                            className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                        >
                            Clear all
                        </button>
                    </div>

                    {/* Visual Media Grid (Images & Videos) */}
                    {mediaPreviews.length > 0 && (
                        <div className="flex flex-wrap gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                            {mediaPreviews.map(({ preview, originalIndex }) => (
                                <div 
                                    key={originalIndex} 
                                    className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-xs shrink-0 flex items-center justify-center"
                                >
                                    {isImageFile(preview.file) ? (
                                        <img
                                            src={preview.url}
                                            alt={preview.file.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <video
                                            src={preview.url}
                                            className="w-full h-full object-cover"
                                        />
                                    )}

                                    {/* Delete Button */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveFile(originalIndex);
                                        }}
                                        className="absolute top-1 right-1 p-1 bg-white/95 text-red-600 rounded-full hover:bg-red-50 shadow-sm transition-all cursor-pointer"
                                        title="Remove photo"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Audio & Documents List */}
                    {otherPreviews.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                            {otherPreviews.map(({ preview, originalIndex }) => {
                                const isAud = isAudioFile(preview.file);
                                const isPdf = isPdfFile(preview.file);
                                const isWord = isWordFile(preview.file);
                                const isExcel = isExcelFile(preview.file);

                                return (
                                    <div 
                                        key={originalIndex} 
                                        className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg shadow-xs min-w-0 gap-2"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div className="p-2 rounded-md shrink-0 flex items-center justify-center bg-slate-50 border border-slate-100">
                                                {isAud ? (
                                                    <Music className="w-4 h-4 text-purple-600" />
                                                ) : isPdf ? (
                                                    <FileText className="w-4 h-4 text-red-600" />
                                                ) : isWord ? (
                                                    <FileText className="w-4 h-4 text-blue-600" />
                                                ) : isExcel ? (
                                                    <FileText className="w-4 h-4 text-emerald-600" />
                                                ) : (
                                                    <File className="w-4 h-4 text-slate-500" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-slate-800 truncate" title={preview.file.name}>
                                                    {preview.file.name}
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    {formatSize(preview.file.size)}
                                                </p>
                                                {isAud && (
                                                    <audio controls src={preview.url} className="mt-1.5 h-6 w-full max-w-[200px]" />
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveFile(originalIndex);
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                                            title="Remove file"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
