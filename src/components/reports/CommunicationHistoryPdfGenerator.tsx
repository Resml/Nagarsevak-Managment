import React, { useRef, useState } from 'react';
import { Download, X, History, MessageSquare, Phone, Smartphone, CheckCircle2, XCircle, Clock } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useLanguage } from '../../context/LanguageContext';
import { format } from 'date-fns';

interface MessageLog {
    id: string;
    sent_at: string;
    channel: 'whatsapp' | 'sms' | 'call';
    message: string;
    recipients: number;
    sent_count: number;
    failed_count: number;
    created_by?: string;
}

interface CommunicationHistoryPdfGeneratorProps {
    logs: MessageLog[];
    onClose: () => void;
}

export const CommunicationHistoryPdfGenerator: React.FC<CommunicationHistoryPdfGeneratorProps> = ({ 
    logs = [], 
    onClose 
}) => {
    const { t, language } = useLanguage();
    const isMr = language === 'mr';
    const reportRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleDownload = async () => {
        if (!reportRef.current) return;
        setGenerating(true);
        setProgress(0);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            let currentY = margin;

            const safeStyles = `
                * { font-family: Arial, sans-serif !important; }
                .text-brand-900 { color: #0c4a6e !important; }
                .text-brand-800 { color: #075985 !important; }
                .text-brand-700 { color: #0369a1 !important; }
                .text-brand-600 { color: #0284c7 !important; }
                .bg-brand-50 { background-color: #f0f9ff !important; }
                .bg-brand-100 { background-color: #e0f2fe !important; }
                .text-slate-900 { color: #0f172a !important; }
                .text-slate-800 { color: #1e293b !important; }
                .text-slate-700 { color: #334155 !important; }
                .text-slate-600 { color: #475569 !important; }
                .text-slate-500 { color: #64748b !important; }
                .text-slate-400 { color: #94a3b8 !important; }
                .bg-slate-50 { background-color: #f8fafc !important; }
                .bg-slate-100 { background-color: #f1f5f9 !important; }
                .bg-white { background-color: #ffffff !important; }
                .border-slate-200 { border-color: #e2e8f0 !important; }
                .text-emerald-700 { color: #047857 !important; }
                .bg-emerald-50 { background-color: #ecfdf5 !important; }
                .text-emerald-600 { color: #059669 !important; }
                .bg-green-100 { background-color: #dcfce7 !important; }
                .text-green-600 { color: #16a34a !important; }
                .text-green-700 { color: #15803d !important; }
                .bg-green-50 { background-color: #f0fdf4 !important; }
                .border-green-200 { border-color: #bbf7d0 !important; }
                .text-red-500 { color: #ef4444 !important; }
                .text-red-700 { color: #b91c1c !important; }
                .bg-red-50 { background-color: #fef2f2 !important; }
                .border-red-200 { border-color: #fecaca !important; }
                .text-amber-700 { color: #b45309 !important; }
                .bg-amber-50 { background-color: #fffbeb !important; }
                .border-amber-200 { border-color: #fde68a !important; }
                .text-blue-600 { color: #2563eb !important; }
                .bg-blue-100 { background-color: #dbeafe !important; }
                .border-brand-600 { border-color: #0284c7 !important; }
                .shadow-sm { box-shadow: none !important; }
            `;

            const onClone = (clonedDoc: Document) => {
                const style = clonedDoc.createElement('style');
                style.innerHTML = safeStyles;
                clonedDoc.head.appendChild(style);

                const elements = clonedDoc.getElementsByTagName('*');
                for (let i = 0; i < elements.length; i++) {
                    const el = elements[i] as HTMLElement;
                    ['color', 'background-color', 'border-color', 'fill', 'stroke'].forEach(prop => {
                        const style = window.getComputedStyle(el);
                        const val = style.getPropertyValue(prop);
                        if (val && val.includes('oklch')) {
                            el.style.setProperty(prop, prop.includes('color') ? '#334155' : 'transparent', 'important');
                        }
                    });
                }
            };

            const captureElement = async (element: HTMLElement) => {
                const canvas = await html2canvas(element, {
                    scale: 2,
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

            // 2. Capture Rows
            const rows = Array.from(reportRef.current.querySelectorAll('.report-row')) as HTMLElement[];
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const { imgData, height } = await captureElement(row);

                if (currentY + height > pdfHeight - margin) {
                    pdf.addPage();
                    currentY = margin;
                }

                pdf.addImage(imgData, 'PNG', margin, currentY, pdfWidth - (margin * 2), height, undefined, 'FAST');
                currentY += height + 3; // Adding a small gap between rows
                setProgress(Math.round(((i + 1) / rows.length) * 100));

                await new Promise(resolve => setTimeout(resolve, 10));
            }

            pdf.save(`Communication_History_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            onClose();
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setGenerating(false);
            setProgress(0);
        }
    };

    const StatusBadge = ({ log }: { log: MessageLog }) => {
        const successRate = log.recipients > 0 ? (log.sent_count / log.recipients) * 100 : 0;
        if (successRate === 100) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200"><CheckCircle2 className="w-3 h-3" />{isMr ? 'सर्व पाठवले' : 'All Sent'}</span>;
        if (successRate === 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200"><XCircle className="w-3 h-3" />{isMr ? 'अयशस्वी' : 'Failed'}</span>;
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" />{isMr ? 'अंशतः' : 'Partial'}</span>;
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b bg-slate-50">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-brand-600" />
                        <h2 className="text-lg font-bold text-slate-800">
                            {isMr ? 'संदेश इतिहास' : 'Message History'} - {t('common.report_view') || 'Report View'}
                        </h2>
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
                            {generating ? (t('work_history.generating') || 'Generating...') : (isMr ? 'पीडीएफ डाउनलोड करा' : 'Download PDF')}
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
                        <div className="report-header border-b-2 border-brand-600 pb-6 mb-8">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-brand-700 mb-1 flex items-center gap-2">
                                        <History className="w-8 h-8" />
                                        {isMr ? 'सार्वजनिक संवाद इतिहास' : 'Public Communication History'}
                                    </h1>
                                    <p className="text-slate-500 font-medium">
                                        {isMr ? 'सर्व प्रसारित मोहिमांचा अहवाल' : 'Report of all broadcasted campaigns'}
                                    </p>
                                </div>
                                <div className="text-right text-sm text-slate-400">
                                    <p>{t('common.date') || 'Date'}: {format(new Date(), 'dd/MM/yyyy, hh:mm a')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {logs.length === 0 ? (
                                <div className="text-center p-10 text-slate-500 border border-slate-200 rounded-xl">
                                    {isMr ? 'कोणतेही संदेश पाठवले नाहीत.' : 'No messages sent yet.'}
                                </div>
                            ) : (
                                logs.map((log) => (
                                    <div key={log.id} className="report-row border border-slate-200 rounded-xl p-4 bg-white break-inside-avoid shadow-sm">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${log.channel === 'whatsapp' ? 'bg-green-100' : log.channel === 'call' ? 'bg-brand-100' : 'bg-blue-100'}`}>
                                                    {log.channel === 'whatsapp'
                                                        ? <Smartphone className="w-5 h-5 text-green-600" />
                                                        : log.channel === 'call'
                                                            ? <Phone className="w-5 h-5 text-brand-600" />
                                                            : <MessageSquare className="w-5 h-5 text-blue-600" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-1 font-medium">
                                                        <span>{format(new Date(log.sent_at), 'dd MMM yyyy, hh:mm a')}</span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="uppercase text-brand-700 font-bold bg-brand-50 px-1.5 py-0.5 rounded">{log.channel}</span>
                                                        {log.created_by && <><span className="text-slate-300">•</span><span>{isMr ? 'द्वारा: ' : 'By: '}{log.created_by}</span></>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 flex-shrink-0">
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-slate-800">{log.recipients}</div>
                                                    <div className="text-[10px] text-slate-500 uppercase">{isMr ? 'लक्ष्य' : 'Targeted'}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-green-600">{log.sent_count}</div>
                                                    <div className="text-[10px] text-slate-500 uppercase">{isMr ? 'पाठवले' : 'Sent'}</div>
                                                </div>
                                                {log.failed_count > 0 && (
                                                    <div className="text-center">
                                                        <div className="text-lg font-bold text-red-500">{log.failed_count}</div>
                                                        <div className="text-[10px] text-slate-500 uppercase">{isMr ? 'अयशस्वी' : 'Failed'}</div>
                                                    </div>
                                                )}
                                                <div className="ml-2">
                                                    <StatusBadge log={log} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{isMr ? 'संदेश' : 'Message Content'}</p>
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{log.message}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-slate-400 text-[10px] italic">
                            {t('common.generated_by')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
