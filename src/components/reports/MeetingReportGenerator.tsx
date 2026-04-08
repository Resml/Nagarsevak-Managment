import React, { useRef, useState } from 'react';
import { format } from 'date-fns';
import { Download, X, FileText, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { TranslatedText } from '../TranslatedText';

interface MeetingReportGeneratorProps {
    meetings: any[];
    onClose: () => void;
}

export const MeetingReportGenerator: React.FC<MeetingReportGeneratorProps> = ({ meetings, onClose }) => {
    const { t } = useLanguage();
    const { tenant } = useTenant();
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const reportRef = useRef<HTMLDivElement>(null);

    const generatePDF = async () => {
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

            // 2. Capture Meeting Rows
            const meetingRows = Array.from(reportRef.current.querySelectorAll('.meeting-row')) as HTMLElement[];
            for (let i = 0; i < meetingRows.length; i++) {
                const row = meetingRows[i];
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
                setProgress(Math.round(((i + 1) / meetingRows.length) * 100));
                
                if (i % 5 === 0) await new Promise(resolve => setTimeout(resolve, 0));
            }

            pdf.save(`Meeting_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            onClose();
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again with fewer meetings.');
        } finally {
            setIsGenerating(false);
            setProgress(0);
        }
    };

    const config = tenant?.config || {};
    const nagarsevakName = config.nagarsevak_name_marathi || config.nagarsevak_name_english || 'Nagarsevak';

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
                                onClick={generatePDF}
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
                                {t('communication_page.past_meetings') || 'Meeting Report'}
                            </h1>
                            <p className="text-lg font-bold text-brand-800 mb-1">{nagarsevakName}</p>
                            <p className="text-slate-600 font-medium">
                                {t('work_history.col_date') || 'Date'}: {format(new Date(), 'dd MMMM, yyyy')}
                            </p>
                        </div>

                        <div className="space-y-6">
                            {meetings.map((meeting, index) => (
                                <div key={meeting.id} className="meeting-row border border-slate-200 rounded-xl p-5 break-inside-avoid">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-xl font-bold text-slate-900 flex items-start gap-3">
                                            <span className="text-brand-500">{index + 1}.</span>
                                            <span><TranslatedText text={meeting.title} /></span>
                                        </h3>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-50 text-brand-700 whitespace-nowrap`}>
                                                {meeting.status === 'Scheduled' ? t('communication_page.conf_scheduled') :
                                                 meeting.status === 'Completed' ? t('communication_page.conf_completed') :
                                                 meeting.status === 'Cancelled' ? t('communication_page.conf_cancelled') :
                                                 meeting.status}
                                            </span>
                                            <span className="text-xs text-slate-500 italic whitespace-nowrap">
                                                {format(new Date(meeting.scheduled_at), 'dd MMM yyyy, hh:mm a')}
                                            </span>
                                        </div>
                                    </div>

                                    {meeting.notes && (
                                        <p className="text-slate-700 leading-relaxed mb-4 pl-7 text-justify">
                                            <TranslatedText text={meeting.notes} />
                                        </p>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 pl-7 pt-4 border-t border-slate-100">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                                                {t('communication_page.conf_invited') || 'Invited'}
                                            </p>
                                            <p className="text-sm font-medium text-slate-900">
                                                {meeting.invited_count}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                                                Meeting Link
                                            </p>
                                            <p className="text-xs font-mono text-brand-600 truncate max-w-[200px]">
                                                {meeting.meet_link}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-20 pt-10 border-t border-slate-200 flex justify-end break-before-avoid">
                            <div className="text-center w-64">
                                <div className="h-16 border-b border-dashed border-slate-400 mb-2"></div>
                                <p className="font-bold text-slate-900">Signature / स्वाक्षरी</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
