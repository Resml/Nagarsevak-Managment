import React, { useRef, useState } from 'react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useLanguage } from '../../context/LanguageContext';
import { FileText, Download, X, Loader2 } from 'lucide-react';
import { TranslatedText } from '../../components/TranslatedText';

interface WorkItem {
    id: string;
    source: 'Manual' | 'Complaint' | 'Help';
    title: string;
    description: string;
    location: string;
    area?: string;
    status: string;
    date: string;
    citizenName?: string;
    amount?: number;
}

interface AhwalReportGeneratorProps {
    selectedWorks: WorkItem[];
    onClose: () => void;
}

export const AhwalReportGenerator: React.FC<AhwalReportGeneratorProps> = ({ selectedWorks, onClose }) => {
    const { t } = useLanguage();
    const [isGenerating, setIsGenerating] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const totalEstimatedAmount = selectedWorks.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const generatePDF = async () => {
        if (!reportRef.current) return;
        setIsGenerating(true);

        try {
            // Safe styles to avoid oklch errors in html2canvas
            const safeStyles = `
                .text-brand-900 { color: #0c4a6e !important; }
                .text-brand-800 { color: #075985 !important; }
                .text-brand-700 { color: #0369a1 !important; }
                .text-brand-600 { color: #0284c7 !important; }
                .text-brand-500 { color: #0ea5e9 !important; }
                .bg-brand-50 { background-color: #f0f9ff !important; }
                .bg-brand-900 { background-color: #0c4a6e !important; }
                .text-slate-900 { color: #0f172a !important; }
                .text-slate-800 { color: #1e293b !important; }
                .text-slate-700 { color: #334155 !important; }
                .text-slate-600 { color: #475569 !important; }
                .text-slate-500 { color: #64748b !important; }
                .text-slate-400 { color: #94a3b8 !important; }
                .bg-slate-50 { background-color: #f8fafc !important; }
                .bg-slate-100 { background-color: #f1f5f9 !important; }
                .bg-slate-200 { background-color: #e2e8f0 !important; }
                .text-green-700 { color: #15803d !important; }
                .border-brand-100 { border-color: #e0f2fe !important; }
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

            // Wait for translations to settle
            await new Promise(resolve => setTimeout(resolve, 800));

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 20; // 20mm margin
            let currentY = margin;

            const captureElement = async (element: HTMLElement) => {
                const canvas = await html2canvas(element, {
                    scale: 2, // Slightly lower scale for memory safety
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    onclone: onClone,
                    logging: false
                });
                return {
                    imgData: canvas.toDataURL('image/png'),
                    width: pdfWidth - (margin * 2),
                    height: (canvas.height * (pdfWidth - (margin * 2))) / canvas.width
                };
            };

            // 1. Capture Header & Summary
            const topSection = reportRef.current.querySelector('.report-header')?.parentElement;
            if (topSection) {
                // We'll capture everything before the works list first
                const header = reportRef.current.querySelector('.text-center.border-b-2') as HTMLElement;
                const summary = reportRef.current.querySelector('.grid-cols-2') as HTMLElement;

                if (header) {
                    const { imgData, height } = await captureElement(header);
                    pdf.addImage(imgData, 'PNG', margin, currentY, pdfWidth - (margin * 2), height);
                    currentY += height + 10;
                }

                if (summary) {
                    const { imgData, height } = await captureElement(summary);
                    pdf.addImage(imgData, 'PNG', margin, currentY, pdfWidth - (margin * 2), height);
                    currentY += height + 10;
                }
            }

            // 2. Capture each Work Block
            const workBlocks = reportRef.current.querySelectorAll('.break-inside-avoid');
            for (let i = 0; i < workBlocks.length; i++) {
                const block = workBlocks[i] as HTMLElement;
                const { imgData, height } = await captureElement(block);

                // Check if it fits on the current page
                if (currentY + height > pdfHeight - margin) {
                    pdf.addPage();
                    currentY = margin;
                }

                pdf.addImage(imgData, 'PNG', margin, currentY, pdfWidth - (margin * 2), height);
                currentY += height + 8;
            }

            // 3. Capture Signature Area
            const footer = reportRef.current.querySelector('.mt-20.pt-10') as HTMLElement;
            if (footer) {
                const { imgData, height } = await captureElement(footer);
                if (currentY + height > pdfHeight - margin) {
                    pdf.addPage();
                    currentY = margin;
                }
                pdf.addImage(imgData, 'PNG', margin, currentY, pdfWidth - (margin * 2), height);
            }

            pdf.save(`Ahwal_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            onClose();
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] overflow-y-auto">
            <div className="bg-slate-100 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header Actions */}
                <div className="flex justify-between items-center p-4 bg-white border-b border-slate-200 rounded-t-2xl shrink-0">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand-600" />
                        <h2 className="text-xl font-bold text-slate-900">{t('work_history.preview_report') || 'Preview Report'}</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={generatePDF}
                            disabled={isGenerating}
                            className="ns-btn-primary flex items-center gap-2"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {t('work_history.download_pdf') || 'Download PDF'}
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Preview Area Container (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-slate-200/50">
                    {/* The A4 Report Element to be captured */}
                    <div
                        ref={reportRef}
                        className="bg-white shadow-lg shrink-0 overflow-hidden"
                        style={{
                            width: '210mm',          // A4 width
                            minHeight: '297mm',      // A4 height minimum
                            padding: '20mm',         // Page margins
                            boxSizing: 'border-box'
                        }}
                    >
                        {/* Report Header */}
                        <div className="text-center border-b-2 border-brand-800 pb-6 mb-8">
                            <h1 className="text-3xl font-extrabold text-brand-900 mb-2">
                                {t('work_history.ahwal_title') || 'Political Work Report'}
                            </h1>
                            <p className="text-slate-600 font-medium">
                                {t('work_history.col_date') || 'Date'}: {format(new Date(), 'dd MMMM, yyyy')}
                            </p>
                        </div>

                        {/* Report Summary */}
                        <div className="grid grid-cols-2 gap-6 mb-8 bg-brand-50 p-6 rounded-xl border border-brand-100">
                            <div>
                                <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider mb-1">
                                    {t('work_history.works_selected') || 'Total Works'}
                                </p>
                                <p className="text-3xl font-bold text-brand-900">{selectedWorks.length}</p>
                            </div>
                            {totalEstimatedAmount > 0 && (
                                <div>
                                    <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider mb-1">
                                        {t('work_history.total_estimated_amount') || 'Total Estimated Amount'}
                                    </p>
                                    <p className="text-3xl font-bold text-green-700">₹{totalEstimatedAmount.toLocaleString('en-IN')}</p>
                                </div>
                            )}
                        </div>

                        {/* Works List */}
                        <div className="space-y-6">
                            {selectedWorks.map((work, index) => (
                                <div key={work.id} className="border border-slate-200 rounded-xl p-5 break-inside-avoid">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-xl font-bold text-slate-900 flex items-start gap-3">
                                            <span className="text-brand-500">{index + 1}.</span>
                                            <span><TranslatedText text={work.title} /></span>
                                        </h3>
                                        <span className="text-sm bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium whitespace-nowrap ml-4">
                                            {format(new Date(work.date), 'dd MMM yyyy')}
                                        </span>
                                    </div>

                                    <p className="text-slate-700 leading-relaxed mb-4 pl-7 text-justify">
                                        <TranslatedText text={work.description} />
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 pl-7 pt-4 border-t border-slate-100">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                                                {t('work_history.location') || 'Location'}
                                            </p>
                                            <p className="text-sm font-medium text-slate-900">
                                                <TranslatedText text={work.location} />
                                                {work.area && ` (${work.area})`}
                                            </p>
                                        </div>
                                        {work.amount ? (
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                                                    {t('work_history.total_amount_spent') || 'Amount'}
                                                </p>
                                                <p className="text-sm font-bold text-slate-900">
                                                    ₹{Number(work.amount).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer / Signature Area */}
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
