import React, { useRef } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useLanguage } from '../../context/LanguageContext';
import { TranslatedText } from '../../components/TranslatedText';
import { format } from 'date-fns';
import { mr } from '../../utils/marathiLocale';
import type { Sadasya } from '../../types';

interface SadasyaReportGeneratorProps {
    sadasyas: Sadasya[];
    onClose: () => void;
}

export const SadasyaReportGenerator: React.FC<SadasyaReportGeneratorProps> = ({ sadasyas, onClose }) => {
    const { t, language } = useLanguage();
    const reportRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = React.useState(false);
    const [progress, setProgress] = React.useState(0);

    const getDisplayName = (member: any) => {
        if (language === 'mr') {
            return member.name_marathi || member.name || member.name_english;
        }
        return member.name_english || member.name;
    };

    const getDisplayAddress = (member: any) => {
        if (language === 'mr') {
            return member.address_marathi || member.address || member.address_english;
        }
        return member.address_english || member.address;
    };

    const handleDownload = async () => {
        if (!reportRef.current) return;
        setGenerating(true);
        setProgress(0);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape for more columns
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
                .text-brand-500 { color: #0ea5e9 !important; }
                .bg-brand-50 { background-color: #f0f9ff !important; }
                .bg-brand-100 { background-color: #e0f2fe !important; }
                .bg-brand-600 { background-color: #0284c7 !important; }
                .text-slate-900 { color: #0f172a !important; }
                .text-slate-800 { color: #1e293b !important; }
                .text-slate-700 { color: #334155 !important; }
                .text-slate-600 { color: #475569 !important; }
                .text-slate-500 { color: #64748b !important; }
                .text-slate-400 { color: #94a3b8 !important; }
                .bg-slate-50 { background-color: #f8fafc !important; }
                .bg-white { background-color: #ffffff !important; }
                .border-slate-200 { border-color: #e2e8f0 !important; }
                .text-green-800 { color: #166534 !important; }
                .bg-green-100 { background-color: #dcfce7 !important; }
                .text-slate-600 { color: #475569 !important; }
                .bg-slate-100 { background-color: #f3f4f6 !important; }
                .shadow-sm { box-shadow: none !important; }
            `;

            const onClone = (clonedDoc: Document) => {
                const style = clonedDoc.createElement('style');
                style.innerHTML = safeStyles;
                clonedDoc.head.appendChild(style);

                // Fix for oklch colors which html2canvas doesn't support
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
                    if (headerImgData) {
                        pdf.addImage(headerImgData, 'PNG', margin, currentY, pdfWidth - (margin * 2), headerHeight, undefined, 'FAST');
                        currentY += headerHeight;
                    }
                }

                pdf.addImage(imgData, 'PNG', margin, currentY, pdfWidth - (margin * 2), height, undefined, 'FAST');
                currentY += height;
                setProgress(Math.round(((i + 1) / rows.length) * 100));

                await new Promise(resolve => setTimeout(resolve, 10));
            }

            pdf.save(`Party_Members_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            onClose();
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setGenerating(false);
            setProgress(0);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b bg-slate-50">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand-600" />
                        <h2 className="text-lg font-bold text-slate-800">{t('sadasya.title')} - {t('common.report_view')}</h2>
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
                            {generating ? (t('work_history.generating') || 'Generating...') : (t('work_history.download_pdf') || 'Download PDF')}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50">
                    <div
                        ref={reportRef}
                        className="bg-white shadow-lg mx-auto p-10 min-h-[210mm] w-[297mm] text-slate-800"
                    >
                        <div className="report-header border-b-2 border-brand-600 pb-6 mb-8 flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-bold text-brand-700 mb-1">{t('sadasya.title')}</h1>
                                <p className="text-slate-500">{t('sadasya.subtitle')}</p>
                            </div>
                            <div className="text-right text-sm text-slate-400">
                                <p>{t('common.date')}: {format(new Date(), 'dd/MM/yyyy')}</p>
                                <p>{t('sadasya.found')}: {sadasyas.length}</p>
                            </div>
                        </div>

                        <table className="w-full border-collapse border border-slate-200 text-[10px] table-fixed report-table-header">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[5%]">{t('common.report_columns.sr_no')}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[25%]">{t('common.report_columns.name')}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[15%]">{t('common.report_columns.mobile')}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[15%]">{t('common.report_columns.area')}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[20%]">{t('common.report_columns.address')}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[10%]">{t('common.report_columns.type')}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[10%]">{t('common.report_columns.joined')}</th>
                                </tr>
                            </thead>
                        </table>

                        {sadasyas.map((member, index) => (
                            <table key={member.id} className="report-row w-full border-collapse border-b border-l border-r border-slate-200 text-[10px] table-fixed bg-white">
                                <tbody>
                                    <tr>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[5%] align-top">{index + 1}</td>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[25%] align-top">
                                            <div className="font-bold text-slate-900">{getDisplayName(member)}</div>
                                        </td>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[15%] align-top">
                                            <div className="font-mono text-slate-700">{member.mobile}</div>
                                        </td>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[15%] align-top">
                                            <div className="text-slate-800"><TranslatedText text={member.area || '-'} /></div>
                                            {member.ward && <div className="text-[8px] text-slate-500 mt-0.5">(Ward {member.ward})</div>}
                                        </td>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[20%] align-top">
                                            <div className="text-slate-600 line-clamp-2">{getDisplayAddress(member) || '-'}</div>
                                        </td>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[10%] align-top">
                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-medium ${member.isVoter ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                                                {member.isVoter ? t('sadasya.is_voter') : t('sadasya.is_member')}
                                            </span>
                                        </td>
                                        <td className="px-2 py-2 w-[10%] align-top text-slate-600">
                                            {format(new Date(member.registeredAt), 'MMM d, yyyy', { locale: language === 'mr' ? mr : undefined })}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        ))}

                        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-slate-400 text-[10px] italic">
                            Generated by Nagarsevak Management System
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
