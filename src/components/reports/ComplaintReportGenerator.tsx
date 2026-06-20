import React, { useRef, useState, useEffect } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useLanguage } from '../../context/LanguageContext';
import { type Complaint } from '../../types';
import { translateText, transliterateName } from '../../services/translationService';

interface ComplaintReportGeneratorProps {
    complaints: Complaint[];
    onClose: () => void;
    title?: string;
    subtitle?: string;
}

interface TranslatedComplaint {
    id: string;
    createdAt: string;
    citizenName: string;
    mobile: string;
    title: string;
    type: string;
    area: string;
    location: string;
    status: string;
    staffName: string;
    staffMobile: string;
}

export const ComplaintReportGenerator: React.FC<ComplaintReportGeneratorProps> = ({ complaints, onClose, title, subtitle }) => {
    const { t, language } = useLanguage();
    const reportRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [translatedData, setTranslatedData] = useState<TranslatedComplaint[]>([]);
    const [translating, setTranslating] = useState(true);

    // Pre-translate all dynamic content when the component mounts or language/complaints change
    useEffect(() => {
        const preTranslate = async () => {
            setTranslating(true);
            const isMr = language === 'mr';

            const getStatusLabel = (status: string) => {
                if (status === 'InProgress') return t('complaints.status.in_progress');
                if (status === 'Pending') return t('complaints.status.pending');
                if (status === 'Assigned') return t('complaints.status.assigned');
                if (status === 'Resolved') return t('complaints.status.resolved');
                return t('complaints.status.closed');
            };

            const getTypeLabel = (type: string) => {
                const knownTypes = ['Cleaning', 'Water', 'Road', 'Drainage', 'StreetLight', 'SelfIdentified', 'Other', 'Complaint', 'Help', 'Personal Help'];
                if (knownTypes.includes(type)) {
                    const key = type === 'Personal Help' ? 'personal_help' : type.toLowerCase().replace(/ /g, '_');
                    return t(`complaints.form.types.${key}`);
                }
                return type;
            };

            const results: TranslatedComplaint[] = await Promise.all(
                complaints.map(async (c) => {
                    // Citizen name: prefer Marathi field, otherwise transliterate English
                    let citizenName = 'Anonymous';
                    if (isMr) {
                        if (c.voter?.name_marathi) {
                            citizenName = c.voter.name_marathi;
                        } else if (c.voter?.name_english) {
                            try { citizenName = await transliterateName(c.voter.name_english, 'mr'); }
                            catch { citizenName = c.voter.name_english; }
                        }
                    } else {
                        citizenName = c.voter?.name_english || c.voter?.name_marathi || 'Anonymous';
                    }

                    // Complaint title
                    let complaintTitle = c.title;
                    if (isMr && c.title) {
                        try { complaintTitle = await translateText(c.title, 'mr'); }
                        catch { complaintTitle = c.title; }
                    }

                    // Area
                    let area = c.area || 'N/A';
                    if (isMr && c.area) {
                        try { area = await translateText(c.area, 'mr'); }
                        catch { area = c.area; }
                    }

                    // Location
                    let location = c.location || 'N/A';
                    if (isMr && c.location) {
                        try { location = await translateText(c.location, 'mr'); }
                        catch { location = c.location; }
                    }

                    // Staff name
                    let staffName = '';
                    if (c.staff?.name) {
                        if (isMr) {
                            try { staffName = await transliterateName(c.staff.name, 'mr'); }
                            catch { staffName = c.staff.name; }
                        } else {
                            staffName = c.staff.name;
                        }
                    }

                    return {
                        id: c.id,
                        createdAt: c.createdAt,
                        citizenName,
                        mobile: c.voter?.mobile || 'N/A',
                        title: complaintTitle,
                        type: getTypeLabel(c.type),
                        area,
                        location,
                        status: getStatusLabel(c.status),
                        staffName,
                        staffMobile: c.staff?.mobile || '',
                    };
                })
            );

            setTranslatedData(results);
            setTranslating(false);
        };

        preTranslate();
    }, [complaints, language]);

    const handleDownload = async () => {
        if (!reportRef.current) return;
        setGenerating(true);
        setProgress(0);

        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            let currentY = margin;

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

            const header = reportRef.current.querySelector('.report-header') as HTMLElement;
            if (header) {
                const canvas = await html2canvas(header, { scale: 3, useCORS: true, backgroundColor: '#ffffff', onclone: onClone });
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pdfWidth - (margin * 2);
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight, undefined, 'FAST');
                currentY += imgHeight + 5;
            }

            const tableHeader = reportRef.current.querySelector('.report-table-header') as HTMLElement;
            let headerImgData: string = '';
            let headerHeight: number = 0;
            if (tableHeader) {
                const canvas = await html2canvas(tableHeader, { scale: 3, useCORS: true, backgroundColor: '#ffffff', onclone: onClone });
                headerImgData = canvas.toDataURL('image/png');
                const imgWidth = pdfWidth - (margin * 2);
                headerHeight = (canvas.height * imgWidth) / canvas.width;
                pdf.addImage(headerImgData, 'PNG', margin, currentY, imgWidth, headerHeight, undefined, 'FAST');
                currentY += headerHeight;
            }

            const rows = Array.from(reportRef.current.querySelectorAll('.report-row')) as HTMLElement[];
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const canvas = await html2canvas(row, { scale: 3, useCORS: true, backgroundColor: '#ffffff', onclone: onClone });
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pdfWidth - (margin * 2);
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                if (currentY + imgHeight > pdfHeight - margin) {
                    pdf.addPage();
                    currentY = margin;
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
                        {translating && (
                            <span className="text-xs text-brand-600 font-medium flex items-center gap-1.5">
                                <div className="w-3 h-3 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
                                {language === 'mr' ? 'मराठीत रूपांतर होत आहे...' : 'Translating...'}
                            </span>
                        )}
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
                            disabled={generating || translating}
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

                        {translating ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                                <p className="text-slate-400 text-sm">
                                    {language === 'mr' ? 'मराठीत रूपांतर होत आहे...' : 'Preparing report...'}
                                </p>
                            </div>
                        ) : (
                            <table className="w-full border-collapse border border-slate-200 text-[10px]">
                                <thead className="report-table-header">
                                    <tr className="bg-slate-50">
                                        <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[15%]">{t('common.report_columns.date_time')}</th>
                                        <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[18%]">{t('common.report_columns.citizen_info')}</th>
                                        <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[22%]">{t('common.report_columns.title_type')}</th>
                                        <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[18%]">{t('common.report_columns.location_area')}</th>
                                        <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[16%]">{t('common.report_columns.staff')}</th>
                                        <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[11%]">{t('common.report_columns.status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {translatedData.map((row) => (
                                        <tr key={row.id} className="report-row border-b border-slate-100">
                                            <td className="border border-slate-200 px-2 py-2 w-[15%] align-top">
                                                {format(new Date(row.createdAt), 'dd/MM/yyyy')}<br />
                                                <span className="text-[8px] text-slate-400">{format(new Date(row.createdAt), 'hh:mm a')}</span>
                                            </td>
                                            <td className="border border-slate-200 px-2 py-2 w-[18%]">
                                                <div className="font-bold">{row.citizenName}</div>
                                                <div className="text-[8px] text-slate-500">{row.mobile}</div>
                                            </td>
                                            <td className="border border-slate-200 px-2 py-2 w-[22%] align-top">
                                                <div className="font-medium break-words">{row.title}</div>
                                                <div className="text-[8px] uppercase text-slate-400 font-bold">{row.type}</div>
                                            </td>
                                            <td className="border border-slate-200 px-2 py-2 w-[18%] align-top">
                                                <div className="font-medium break-words">{row.area}</div>
                                                <div className="text-[8px] text-slate-500 break-words">{row.location}</div>
                                            </td>
                                            <td className="border border-slate-200 px-2 py-2 w-[16%] align-top">
                                                {row.staffName ? (
                                                    <>
                                                        <div className="font-medium break-words">{row.staffName}</div>
                                                        {row.staffMobile && <div className="text-[8px] text-slate-500">{row.staffMobile}</div>}
                                                    </>
                                                ) : (
                                                    <span className="text-[8px] text-slate-400 italic">
                                                        {language === 'mr' ? 'नेमलेले नाही' : 'Unassigned'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="border border-slate-200 px-2 py-2 w-[11%] align-top">
                                                <span className="text-[8px] font-bold px-1 py-0.5 rounded border border-slate-200 inline-block break-words">
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        <div className="mt-12 pt-6 border-t border-slate-100 text-center text-slate-400 text-[10px] italic">
                            Generated by Nagarsevak Management System
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
