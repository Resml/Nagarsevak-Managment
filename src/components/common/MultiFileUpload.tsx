import React, { useRef, useState } from 'react';
import { UploadCloud, X, File, Image as ImageIcon, Video, Music, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export interface MultiFileUploadProps {
    files: globalThis.File[];
    onChange: (files: globalThis.File[]) => void;
    maxFiles?: number;
    maxSizeMB?: number;
    accept?: string;
    className?: string;
}

const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-6 h-6 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="w-6 h-6 text-purple-500" />;
    if (type.startsWith('audio/')) return <Music className="w-6 h-6 text-yellow-500" />;
    return <File className="w-6 h-6 text-slate-500" />;
};

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const FileViewerModal = ({ file, onClose, onPrev, onNext, totalFiles }: { file: globalThis.File; onClose: () => void; onPrev?: () => void; onNext?: () => void; totalFiles: number; }) => {
    const [preview, setPreview] = useState<string | null>(null);

    React.useEffect(() => {
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    const isPdf = file.type === 'application/pdf';

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }}
        >
            <div 
                className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-xl overflow-hidden flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
                    <h3 className="font-semibold text-slate-800 pr-4 flex-1 truncate">{file.name}</h3>
                    
                    {totalFiles > 1 && (
                        <div className="flex items-center space-x-2 mr-4">
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPrev?.(); }}
                                className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors border border-slate-200"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNext?.(); }}
                                className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors border border-slate-200"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                    
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose();
                        }}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center p-4 relative group/viewer">
                    {preview && (
                        <>
                            {isImage && <img src={preview} alt={file.name} className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-sm" />}
                            {isVideo && <video src={preview} controls className="max-w-full max-h-[75vh] rounded-lg shadow-sm" />}
                            {isAudio && (
                                <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-sm text-center">
                                    <Music className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <audio src={preview} controls className="w-full" />
                                </div>
                            )}
                            {isPdf && <iframe src={preview} className="w-full h-[75vh] rounded-lg shadow-sm" title={file.name} />}
                            {!isImage && !isVideo && !isAudio && !isPdf && (
                                <div className="text-center p-8 bg-white rounded-xl shadow-sm">
                                    <File className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-600 mb-4 text-sm">Preview not available for this file type.</p>
                                    <a href={preview} download={file.name} className="ns-btn-primary px-4 py-2 inline-flex items-center">
                                        Download File
                                    </a>
                                </div>
                            )}
                        </>
                    )}
                    
                    {totalFiles > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPrev?.(); }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 hover:bg-white text-slate-700 rounded-full shadow-lg opacity-0 group-hover/viewer:opacity-100 transition-opacity backdrop-blur-sm"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNext?.(); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 hover:bg-white text-slate-700 rounded-full shadow-lg opacity-0 group-hover/viewer:opacity-100 transition-opacity backdrop-blur-sm"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const FilePreview = ({ file, onRemove, onView }: { file: globalThis.File; onRemove: () => void; onView: () => void }) => {
    const [preview, setPreview] = useState<string | null>(null);

    React.useEffect(() => {
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                onView();
            }}
            className="relative group rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm hover:border-brand-300 transition-all aspect-square flex flex-col items-center justify-center cursor-pointer"
        >
            {(isImage || isVideo) && preview ? (
                <>
                    {isImage && <img src={preview} alt={file.name} className="w-full h-full object-cover" />}
                    {isVideo && <video src={preview} className="w-full h-full object-cover" />}
                </>
            ) : (
                <div className="p-2 flex flex-col items-center justify-center text-center space-y-2 w-full h-full bg-white">
                    <div className="p-3 bg-slate-50 rounded-full">
                        {getFileIcon(file.type)}
                    </div>
                    <p className="text-xs font-medium text-slate-700 truncate w-full px-3" title={file.name}>
                        {file.name}
                    </p>
                    <p className="text-[10px] text-slate-500">{formatSize(file.size)}</p>
                </div>
            )}
            
            <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
                className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm text-slate-600 hover:text-red-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

export function MultiFileUpload({
    files,
    onChange,
    maxFiles = 10,
    maxSizeMB = 50,
    accept = "*/*",
    className
}: MultiFileUploadProps) {
    const { t } = useLanguage();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewingIndex, setViewingIndex] = useState<number | null>(null);

    const handleFiles = (newFiles: globalThis.File[]) => {
        setError(null);
        
        if (files.length + newFiles.length > maxFiles) {
            setError(`You can only upload a maximum of ${maxFiles} files.`);
            return;
        }

        const validFiles = newFiles.filter(file => {
            const sizeMB = file.size / (1024 * 1024);
            if (sizeMB > maxSizeMB) {
                setError(`File ${file.name} exceeds the ${maxSizeMB}MB size limit.`);
                return false;
            }
            return true;
        });

        onChange([...files, ...validFiles]);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (indexToRemove: number) => {
        onChange(files.filter((_, index) => index !== indexToRemove));
        if (viewingIndex === indexToRemove) {
            setViewingIndex(null);
        } else if (viewingIndex !== null && viewingIndex > indexToRemove) {
            setViewingIndex(viewingIndex - 1);
        }
    };

    const navigateViewer = (direction: 'prev' | 'next') => {
        if (viewingIndex === null) return;
        if (direction === 'prev') {
            setViewingIndex(viewingIndex > 0 ? viewingIndex - 1 : files.length - 1);
        } else {
            setViewingIndex(viewingIndex < files.length - 1 ? viewingIndex + 1 : 0);
        }
    };

    return (
        <div className={clsx("w-full", className)}>
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={clsx(
                    "relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 overflow-hidden",
                    isDragging ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                )}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    multiple
                    accept={accept}
                    title="Click or drag files here"
                />
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 relative z-0 pointer-events-none">
                    <UploadCloud className={clsx("w-6 h-6", isDragging ? "text-brand-600" : "text-slate-400")} />
                </div>
                <p className="text-sm font-medium text-slate-700 text-center relative z-0 pointer-events-none">
                    Click or drag & drop files here
                </p>
                <p className="text-xs text-slate-500 mt-1 text-center relative z-0 pointer-events-none">
                    Supports Images, Videos, Audio, and Documents (Max {maxSizeMB}MB)
                </p>
            </div>

            {error && (
                <div className="mt-3 flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                    >
                        {files.map((file, idx) => (
                            <FilePreview 
                                key={`${file.name}-${idx}`} 
                                file={file} 
                                onRemove={() => removeFile(idx)}
                                onView={() => setViewingIndex(idx)}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {viewingIndex !== null && files[viewingIndex] && (
                    <FileViewerModal
                        file={files[viewingIndex]}
                        totalFiles={files.length}
                        onClose={() => setViewingIndex(null)}
                        onPrev={() => navigateViewer('prev')}
                        onNext={() => navigateViewer('next')}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
