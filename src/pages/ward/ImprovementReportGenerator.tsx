import React, { useRef } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useLanguage } from '../../context/LanguageContext';
import { TranslatedText } from '../../components/TranslatedText';

interface ImprovementParam {
    id: string;
    title: string;
    description: string;
    votes: number;
    location: string;
    area: string;
    status: 'Pending' | 'Planned' | 'In Progress' | 'Complete';
    completion_date: string;
    metadata?: any;
    created_at: string;
}

interface ImprovementReportGeneratorProps {
    improvements: ImprovementParam[];
    onClose: () => void;
    title?: string;
    subtitle?: string;
}

export const ImprovementReportGenerator: React.FC<ImprovementReportGeneratorProps> = ({ improvements, onClose, title, subtitle }) => {
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
            await new Promise(resolve => setTimeout(resolve, 1000));

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
                .bg-white { background-color: #ffffff !important; }
                .text-green-700 { color: #15803d !important; }
                .bg-green-50 { background-color: #f0fdf4 !important; }
                .border-green-200 { border-color: #bbf7d0 !important; }
                .text-blue-700 { color: #1d4ed8 !important; }
                .bg-blue-50 { background-color: #eff6ff !important; }
                .border-blue-200 { border-color: #bfdbfe !important; }
                .text-purple-700 { color: #7e22ce !important; }
                .bg-purple-50 { background-color: #faf5ff !important; }
                .border-purple-200 { border-color: #e9d5ff !important; }
                .text-orange-700 { color: #c2410c !important; }
                .bg-orange-50 { background-color: #fff7ed !important; }
                .border-orange-200 { border-color: #fed7aa !important; }
                .border-brand-800 { border-color: #075985 !important; }
                .border-brand-600 { border-color: #0284c7 !important; }
                .border-slate-100 { border-color: #f1f5f9 !important; }
                .border-slate-200 { border-color: #e2e8f0 !important; }
            `;

            const onClone = (clonedDoc: Document) => {
                const style = clonedDoc.createElement('style');
                style.innerHTML = safeStyles;
                clonedDoc.head.appendChild(style);
            };

            const captureElement = async (element: HTMLElement) => {
                const canvas = await html2canvas(element, { 
                    scale: 2, // Memory safe scale
                    useCORS: true, 
                    backgroundColor: '#ffffff',
                    onclone: onClone,
                    logging: false,
                    removeContainer: true
                });
                return {
                    imgData: canvas.toDataURL('image/png'),
                    width: pdfWidth - (margin * 2),
                    height: (canvas.height * (pdfWidth - (margin * 2))) / canvas.width
                };
            };

            // 1. Capture Header
            const header = reportRef.current.querySelector('.report-header') as HTMLElement;
            if (header) {
                const { imgData, height } = await captureElement(header);
                pdf.addImage(imgData, 'PNG', margin, currentY, pdfWidth - (margin * 2), height, undefined, 'FAST');
                currentY += height + 5;
            }

            // 2. Capture Table Header
            const tableHeader = reportRef.current.querySelector('.report-table-header') as HTMLElement;
            let headerImgData: string = '';
            let headerHeight: number = 0;
            if (tableHeader) {
                const { imgData, height } = await captureElement(tableHeader);
                headerImgData = imgData;
                headerHeight = height;
                pdf.addImage(headerImgData, 'PNG', margin, currentY, pdfWidth - (margin * 2), headerHeight, undefined, 'FAST');
                currentY += headerHeight;
            }

            // 3. Capture Rows one by one
            const rows = Array.from(reportRef.current.querySelectorAll('.report-row')) as HTMLElement[];
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const { imgData, height } = await captureElement(row);

                if (currentY + height > pdfHeight - margin) {
                    pdf.addPage();
                    currentY = margin;
                    // Re-add table header on new page
                    if (headerImgData) {
                        pdf.addImage(headerImgData, 'PNG', margin, currentY, pdfWidth - (margin * 2), headerHeight, undefined, 'FAST');
                        currentY += headerHeight;
                    }
                }

                pdf.addImage(imgData, 'PNG', margin, currentY, pdfWidth - (margin * 2), height, undefined, 'FAST');
                currentY += height;
                setProgress(Math.round(((i + 1) / rows.length) * 100));

                // Small delay to keep UI responsive and avoid memory issues
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            pdf.save(`Improvements_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            onClose();
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate PDF. Please try again or try selecting fewer items if the list is very large.');
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
                                <h1 className="text-3xl font-bold text-brand-700 mb-1">{title || t('improvements.title')}</h1>
                                <p className="text-slate-500">{subtitle || t('improvements.subtitle')}</p>
                            </div>
                            <div className="text-right text-sm text-slate-400">
                                <p>{t('common.report_columns.date')}: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                                <p>{t('work_history.found') || 'Found'}: {improvements.length}</p>
                            </div>
                        </div>

                        <table className="w-full border-collapse border border-slate-200 text-[10px] table-fixed report-table-header">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[5%]">{t('common.report_columns.sr_no')}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[35%]">{t('improvements.form_title')}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[30%]">{t('common.report_columns.location_area')}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[15%]">{t('common.report_columns.status')}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[15%]">{t('common.report_columns.date')}</th>
                                </tr>
                            </thead>
                        </table>
                        
                        {improvements.map((item, index) => (
                            <table key={item.id} className="report-row w-full border-collapse border-b border-l border-r border-slate-200 text-[10px] table-fixed bg-white">
                                <tbody>
                                    <tr>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[5%] align-top">{index + 1}</td>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[35%]">
                                            <div className="font-bold"><TranslatedText text={item.title} /></div>
                                            <div className="text-[8px] text-slate-500 mt-0.5"><TranslatedText text={item.description} /></div>
                                        </td>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[30%] align-top">
                                            <div className="font-medium"><TranslatedText text={item.location} /></div>
                                            {item.area && (
                                                <div className="text-[8px] text-slate-400">
                                                    (<TranslatedText text={item.area} />)
                                                </div>
                                            )}
                                        </td>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[15%] align-top">
                                            <span className={`px-1 py-0.5 rounded text-[8px] font-medium border inline-block ${item.status === 'Complete' ? 'bg-green-50 text-green-700 border-green-200' :
                                                item.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    item.status === 'Planned' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        'bg-orange-50 text-orange-700 border-orange-200'
                                                }`}>
                                                {item.status === 'Complete' ? t('improvements.status_complete') :
                                                    item.status === 'In Progress' ? t('improvements.status_in_progress') :
                                                        item.status === 'Planned' ? t('improvements.status_planned') :
                                                            t('improvements.status_pending')}
                                            </span>
                                        </td>
                                        <td className="px-2 py-2 w-[15%] align-top">
                                            {format(new Date(item.created_at), 'MMM d, yyyy')}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        ))}

                        <div className="mt-12 pt-6 border-t border-slate-100 text-center text-slate-400 text-[10px] italic">
                            Generated by Nagarsevak Management System
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
