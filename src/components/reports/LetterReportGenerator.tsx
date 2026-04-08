import React, { useRef, useState } from 'react';
import { format } from 'date-fns';
import { Download, X, FileText, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useLanguage } from '../../context/LanguageContext';
import { TranslatedText } from '../TranslatedText';
import { CUSTOM_TRANSLATIONS } from '../../services/translationService';

interface LetterReportGeneratorProps {
    letters: any[];
    type: 'incoming' | 'outgoing';
    onClose: () => void;
}

export const LetterReportGenerator: React.FC<LetterReportGeneratorProps> = ({ letters, type, onClose }) => {
    const { t } = useLanguage();
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const reportRef = useRef<HTMLDivElement>(null);

    // Normalize data to ensure consistency between incoming/outgoing
    const normalizedLetters = letters.map(letter => {
        if (type === 'outgoing') {
            // For outgoing letters, the 'type' field is the letter name (e.g. "Residence Certificate")
            // Use it as the subject if no explicit subject is stored
            return {
                ...letter,
                subject: letter.details?.subject || letter.details?.purpose || letter.type || '-',
                letter_type: letter.type,
                date: letter.created_at,
                recipient_name: letter.details?.name || '-',
                reference_no: letter.details?.letter_ref || '-'
            };
        } else {
            return {
                ...letter,
                subject: letter.title || '-',
                letter_type: letter.file_type?.includes('pdf') ? 'PDF' : (letter.file_type?.includes('image') ? 'Image' : 'Incoming'),
                date: letter.received_date || letter.created_at,
                sender_name: letter.sender_name || letter.from || '-',
                reference_no: letter.reference_no || '-'
            };
        }
    });

    const safeFormatDate = (dateStr: any) => {
        try {
            if (!dateStr) return 'N/A';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'N/A';
            return format(date, 'dd MMM yyyy');
        } catch (e) {
            return 'N/A';
        }
    };

    const handleDownload = async () => {
        if (!reportRef.current) return;
        setIsGenerating(true);
        setProgress(0);

        try {
            // Give extra time for TranslatedText and fonts to settle
            await new Promise(resolve => setTimeout(resolve, 800));

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            let currentY = margin;

            // Safe styles to avoid oklch errors in html2canvas
            const safeStyles = `
                .text-brand-900 { color: #0c4a6e !important; }
                .text-brand-800 { color: #075985 !important; }
                .text-brand-700 { color: #0369a1 !important; }
                .text-brand-600 { color: #0284c7 !important; }
                .text-brand-500 { color: #0ea5e9 !important; }
                .bg-brand-50 { background-color: #f0f9ff !important; }
                .bg-brand-600 { background-color: #0284c7 !important; }
                .text-slate-900 { color: #0f172a !important; }
                .text-slate-800 { color: #1e293b !important; }
                .text-slate-700 { color: #334155 !important; }
                .text-slate-600 { color: #475569 !important; }
                .text-slate-500 { color: #64748b !important; }
                .text-slate-400 { color: #94a3b8 !important; }
                .bg-slate-50 { background-color: #f8fafc !important; }
                .bg-slate-100 { background-color: #f1f5f9 !important; }
                .bg-slate-200 { background-color: #e2e8f0 !important; }
                .border-brand-800 { border-color: #075985 !important; }
                .border-brand-600 { border-color: #0284c7 !important; }
                .border-slate-200 { border-color: #e2e8f0 !important; }
            `;

            const onClone = (clonedDoc: Document) => {
                const style = clonedDoc.createElement('style');
                style.innerHTML = safeStyles;
                clonedDoc.head.appendChild(style);
            };

            // 1. Capture Header
            const header = reportRef.current.querySelector('.report-header') as HTMLElement;
            if (header) {
                const canvas = await html2canvas(header, { 
                    scale: 3, 
                    useCORS: true, 
                    logging: false,
                    backgroundColor: '#ffffff',
                    onclone: onClone
                });
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pdfWidth - (margin * 2);
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight, undefined, 'FAST');
                currentY += imgHeight + 10;
            }

            // 2. Capture Letter Rows
            const letterRows = Array.from(reportRef.current.querySelectorAll('.letter-row')) as HTMLElement[];
            for (let i = 0; i < letterRows.length; i++) {
                const row = letterRows[i];
                const canvas = await html2canvas(row, { 
                    scale: 3, 
                    useCORS: true, 
                    logging: false,
                    backgroundColor: '#ffffff',
                    onclone: onClone
                });
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pdfWidth - (margin * 2);
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                if (currentY + imgHeight > pdfHeight - margin) {
                    pdf.addPage();
                    currentY = margin;
                }

                pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight, undefined, 'FAST');
                currentY += imgHeight + 6;
                setProgress(Math.round(((i + 1) / letterRows.length) * 100));
                
                if (i % 5 === 0) await new Promise(resolve => setTimeout(resolve, 0));
            }

            pdf.save(`${type === 'outgoing' ? 'Outgoing' : 'Incoming'}_Letters_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            onClose();
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate PDF. Please try again with fewer letters.');
        } finally {
            setIsGenerating(false);
            setProgress(0);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] overflow-y-auto">
            <div className="bg-slate-100 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 bg-white border-b border-slate-200 rounded-t-2xl shrink-0">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand-600" />
                        <h2 className="text-xl font-bold text-slate-900">{t('work_history.preview_report') || 'Preview Report'}</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-4">
                            {isGenerating && (
                                <div className="flex items-center gap-2 text-sm font-medium text-brand-600">
                                    <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-brand-600 transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <span>{progress}%</span>
                                </div>
                            )}
                            <button
                                onClick={handleDownload}
                                disabled={isGenerating}
                                className="ns-btn-primary flex items-center gap-2"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                {isGenerating ? t('work_history.generating') || 'Generating...' : t('work_history.download_pdf') || 'Download PDF'}
                            </button>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-slate-200/50">
                    <div
                        ref={reportRef}
                        className="bg-white shadow-lg shrink-0 overflow-hidden"
                        style={{
                            width: '210mm',
                            minHeight: '297mm',
                            padding: '20mm',
                            boxSizing: 'border-box'
                        }}
                    >
                        <div className="report-header text-center border-b-2 border-brand-800 pb-6 mb-8">
                            <h1 className="text-3xl font-extrabold text-brand-900 mb-2">
                                {type === 'outgoing' ? (t('letters.outgoing') || 'जावक पत्रे') : (t('letters.incoming') || 'आवक पत्रे')}
                            </h1>
                            <p className="text-slate-600 font-medium font-mono">
                                {format(new Date(), 'dd MMMM, yyyy')}
                            </p>
                        </div>

                        <div className="space-y-6">
                            {normalizedLetters.map((letter, index) => {
                                // Translate English letter type to Marathi using known map
                                const marathiTypeName = CUSTOM_TRANSLATIONS[letter.letter_type] || letter.letter_type || 'General';
                                // Use Marathi name as subject title if it's the same as the type
                                const subjectDisplay = (letter.subject === letter.letter_type)
                                    ? marathiTypeName
                                    : letter.subject;
                                return (
                                <div key={letter.id} className="letter-row border border-slate-200 rounded-xl p-5 break-inside-avoid">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-xl font-bold text-slate-900 flex items-start gap-3">
                                            <span className="text-brand-500">{index + 1}.</span>
                                            <span>{subjectDisplay}</span>
                                        </h3>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 text-right max-w-[160px] break-words leading-tight">
                                                {marathiTypeName}
                                            </span>
                                            <span className="text-xs text-slate-500 italic whitespace-nowrap">
                                                {safeFormatDate(letter.date)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pl-7 pt-4 border-t border-slate-100">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                                                {type === 'outgoing' ? 'प्राप्तकर्ता' : 'प्रेषक'}
                                            </p>
                                            <p className="text-sm font-medium text-slate-900">
                                                <TranslatedText text={type === 'outgoing' ? letter.recipient_name : letter.sender_name} />
                                            </p>
                                        </div>
                                        <div>
                                             <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                                                 मोबाईल नंबर
                                             </p>
                                             <p className="text-sm font-mono text-slate-900">
                                                 {letter.details?.mobile || letter.mobile || letter.voter?.mobile || '-'}
                                             </p>
                                        </div>
                                    </div>

                                    {/* Area row - always shown for outgoing letters */}
                                    {(letter.area || letter.details?.area) && (
                                        <div className="pl-7 pt-3">
                                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">क्षेत्र / पत्ता</p>
                                            <p className="text-sm text-slate-700">{letter.area || letter.details?.area}</p>
                                        </div>
                                    )}

                                    {letter.description && (
                                        <div className="mt-4 pl-7 text-sm text-slate-600 text-justify">
                                            <TranslatedText text={letter.description} />
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>

                        <div className="mt-20 pt-10 border-t border-slate-200 flex justify-end break-before-avoid text-center">
                            <div className="w-64">
                                <div className="h-16 border-b border-dashed border-slate-400 mb-2"></div>
                                <p className="font-bold text-slate-900 italic">Office Seal & Signature</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
