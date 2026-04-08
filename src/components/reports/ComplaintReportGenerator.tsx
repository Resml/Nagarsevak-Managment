import React, { useRef } from 'react';
import { X, Download, FileText, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useLanguage } from '../../context/LanguageContext';
import { type Complaint } from '../../types';
import { TranslatedText } from '../TranslatedText';

interface ComplaintReportGeneratorProps {
    complaints: Complaint[];
    onClose: () => void;
    title?: string;
    subtitle?: string;
}

export const ComplaintReportGenerator: React.FC<ComplaintReportGeneratorProps> = ({ complaints, onClose, title, subtitle }) => {
    const { t, language } = useLanguage();
    const reportRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = React.useState(false);
    const [progress, setProgress] = React.useState(0);

    const handleDownload = async () => {
        if (!reportRef.current) return;
        setGenerating(true);
        setProgress(0);

        try {
            // Give extra time for TranslatedText and fonts to settle
            await new Promise(resolve => setTimeout(resolve, 800));

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
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
                    backgroundColor: '#ffffff',
                    onclone: onClone
                });
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pdfWidth - (margin * 2);
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight, undefined, 'FAST');
                currentY += imgHeight + 5;
            }

            // 2. Capture Table Header
            const tableHeader = reportRef.current.querySelector('.report-table-header') as HTMLElement;
            let headerImgData: string = '';
            let headerHeight: number = 0;
            if (tableHeader) {
                const canvas = await html2canvas(tableHeader, { 
                    scale: 3, 
                    useCORS: true, 
                    backgroundColor: '#ffffff',
                    onclone: onClone
                });
                headerImgData = canvas.toDataURL('image/png');
                const imgWidth = pdfWidth - (margin * 2);
                headerHeight = (canvas.height * imgWidth) / canvas.width;
                pdf.addImage(headerImgData, 'PNG', margin, currentY, imgWidth, headerHeight, undefined, 'FAST');
                currentY += headerHeight;
            }

            // 3. Capture Rows one by one
            const rows = Array.from(reportRef.current.querySelectorAll('.report-row')) as HTMLElement[];
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const canvas = await html2canvas(row, { 
                    scale: 3, 
                    useCORS: true, 
                    backgroundColor: '#ffffff',
                    onclone: onClone
                });
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pdfWidth - (margin * 2);
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                if (currentY + imgHeight > pdfHeight - margin) {
                    pdf.addPage();
                    currentY = margin;
                    // Re-add table header on new page
                    if (headerImgData) {
                        pdf.addImage(headerImgData, 'PNG', margin, currentY, imgWidth, headerHeight, undefined, 'FAST');
                        currentY += headerHeight;
                    }
                }

                pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight, undefined, 'FAST');
                currentY += imgHeight;
                setProgress(Math.round(((i + 1) / rows.length) * 100));

                if (i % 10 === 0) await new Promise(resolve => setTimeout(resolve, 0));
            }

            pdf.save(`Complaints_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            onClose();
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate PDF. Please try again with fewer items.');
        } finally {
            setGenerating(false);
            setProgress(0);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b bg-slate-50">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand-600" />
                        <h2 className="text-lg font-bold text-slate-800">{t('common.report_view')}</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        {generating && (
                            <div className="flex items-center gap-2 text-sm font-medium text-brand-600">
                                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                                <span>{progress}%</span>
                            </div>
                        )}
                        <button
                            onClick={handleDownload}
                            disabled={generating}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {generating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                            {generating ? t('work_history.generating') || 'Generating...' : t('work_history.download_pdf') || 'Download PDF'}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50">
                    <div 
                        ref={reportRef}
                        className="bg-white shadow-lg mx-auto p-10 min-h-[297mm] w-[210mm] text-slate-800"
                    >
                        <div className="report-header border-b-2 border-brand-600 pb-6 mb-8 flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-bold text-brand-700 mb-1">{title || t('complaints.title')}</h1>
                                <p className="text-slate-500">{subtitle || t('complaints.subtitle')}</p>
                            </div>
                            <div className="text-right text-sm text-slate-400">
                                <p>{t('common.report_columns.date_time')}: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                                <p>{t('complaints.found')}: {complaints.length}</p>
                            </div>
                        </div>

                        <table className="w-full border-collapse border border-slate-200 text-[10px]">
                            <thead className="report-table-header">
                                <tr className="bg-slate-50">
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[15%]">{t('common.report_columns.date_time')}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[10%]">ID</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[20%]">{t('common.report_columns.citizen_info')}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[22%]">{t('common.report_columns.title_type')}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[20%]">{t('common.report_columns.location_area')}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[13%]">{t('common.report_columns.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {complaints.map((complaint) => (
                                    <tr key={complaint.id} className="report-row border-b border-slate-100">
                                        <td className="border border-slate-200 px-2 py-2 w-[15%] align-top">
                                            {format(new Date(complaint.createdAt), 'dd/MM/yyyy')}<br />
                                            <span className="text-[8px] text-slate-400">{format(new Date(complaint.createdAt), 'hh:mm a')}</span>
                                        </td>
                                        <td className="border border-slate-200 px-2 py-2 font-mono text-[8px] text-brand-600 w-[10%]">
                                            #{complaint.id.substring(0, 8)}
                                        </td>
                                        <td className="border border-slate-200 px-2 py-2 w-[20%]">
                                            <div className="font-bold">
                                                {language === 'mr' && complaint.voter?.name_marathi 
                                                    ? complaint.voter.name_marathi 
                                                    : complaint.voter?.name_english || 'Anonymous'}
                                            </div>
                                            <div className="text-[8px] text-slate-500">{complaint.voter?.mobile || 'N/A'}</div>
                                        </td>
                                        <td className="border border-slate-200 px-2 py-2 w-[22%] align-top">
                                            <div className="font-medium break-words"><TranslatedText text={complaint.title} /></div>
                                            <div className="text-[8px] uppercase text-slate-400 font-bold">
                                                {['Cleaning', 'Water', 'Road', 'Drainage', 'StreetLight', 'SelfIdentified', 'Other', 'Complaint', 'Help', 'Personal Help'].includes(complaint.type)
                                                    ? t(`complaints.form.types.${complaint.type == 'Personal Help' ? 'personal_help' : complaint.type.toLowerCase().replace(/ /g, '_')}`)
                                                    : complaint.type}
                                            </div>
                                        </td>
                                        <td className="border border-slate-200 px-2 py-2 w-[20%] align-top">
                                            <div className="font-medium break-words"><TranslatedText text={complaint.area || 'N/A'} /></div>
                                            <div className="text-[8px] text-slate-500 break-words"><TranslatedText text={complaint.location || 'N/A'} /></div>
                                        </td>
                                        <td className="border border-slate-200 px-2 py-2 w-[13%] align-top">
                                            <span className="text-[8px] font-bold px-1 py-0.5 rounded border border-slate-200 inline-block break-words">
                                                {complaint.status === 'InProgress' ? t('complaints.status.in_progress') :
                                                 complaint.status === 'Pending' ? t('complaints.status.pending') :
                                                 complaint.status === 'Assigned' ? t('complaints.status.assigned') :
                                                 complaint.status === 'Resolved' ? t('complaints.status.resolved') :
                                                 t('complaints.status.closed')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="mt-12 pt-6 border-t border-slate-100 text-center text-slate-400 text-[10px] italic">
                            Generated by Nagarsevak Management System
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
