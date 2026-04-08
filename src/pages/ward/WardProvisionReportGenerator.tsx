import React, { useRef } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useLanguage } from '../../context/LanguageContext';
import { TranslatedText } from '../../components/TranslatedText';
import { type ProvisionRecord } from '../../types';

interface WardProvisionReportGeneratorProps {
    provisions: ProvisionRecord[];
    year: string;
    onClose: () => void;
}

export const WardProvisionReportGenerator: React.FC<WardProvisionReportGeneratorProps> = ({ provisions, year, onClose }) => {
    const { t, language } = useLanguage();
    const reportRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = React.useState(false);
    const [progress, setProgress] = React.useState(0);

    const formatCurrency = (amount: number | null) => {
        if (amount === null || amount === undefined) return '₹0';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const totalRequested = provisions.reduce((sum, p) => sum + (p.requestedAmount || 0), 0);
    const totalSanctioned = provisions.reduce((sum, p) => sum + (p.sanctionedAmount || 0), 0);

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'Approved': return language === 'mr' ? 'मंजूर' : 'Approved';
            case 'Partially Approved': return language === 'mr' ? 'अंशतः मंजूर' : 'Partially Approved';
            case 'Rejected': return language === 'mr' ? 'नाकारले' : 'Rejected';
            default: return language === 'mr' ? 'प्रलंबित' : 'Pending';
        }
    };

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
                .text-brand-500 { color: #0ea5e9 !important; }
                .bg-brand-50 { background-color: #f0f9ff !important; }
                .bg-brand-100 { background-color: #e0f2fe !important; }
                .bg-brand-500 { background-color: #0ea5e9 !important; }
                .bg-brand-600 { background-color: #0284c7 !important; }
                .border-brand-100 { border-color: #e0f2fe !important; }
                .border-brand-200 { border-color: #bae6fd !important; }
                .border-brand-600 { border-color: #0284c7 !important; }
                .border-brand-800 { border-color: #075985 !important; }
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
                .border-slate-100 { border-color: #f1f5f9 !important; }
                .border-slate-200 { border-color: #e2e8f0 !important; }
                .text-green-700 { color: #15803d !important; }
                .bg-green-50 { background-color: #f0fdf4 !important; }
                .border-green-200 { border-color: #bbf7d0 !important; }
                .text-blue-700 { color: #1d4ed8 !important; }
                .bg-blue-50 { background-color: #eff6ff !important; }
                .border-blue-200 { border-color: #bfdbfe !important; }
                .text-yellow-700 { color: #a16207 !important; }
                .bg-yellow-50 { background-color: #fefce8 !important; }
                .border-yellow-200 { border-color: #fef08a !important; }
                .text-red-700 { color: #b91c1c !important; }
                .bg-red-50 { background-color: #fef2f2 !important; }
                .border-red-200 { border-color: #fecaca !important; }
                .shadow-lg { box-shadow: none !important; }
                .shadow-md { box-shadow: none !important; }
                .shadow-sm { box-shadow: none !important; }
            `;

            const onClone = (clonedDoc: Document) => {
                const style = clonedDoc.createElement('style');
                style.innerHTML = safeStyles;
                clonedDoc.head.appendChild(style);
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

            pdf.save(`Ward_Provision_Report_${year}.pdf`);
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
                        className="bg-white shadow-lg mx-auto p-10 min-h-[297mm] w-[210mm] text-slate-800"
                    >
                        <div className="report-header border-b-2 border-brand-600 pb-6 mb-8 flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-bold text-brand-700 mb-1">{t('ward_provision.title')}</h1>
                                <p className="text-slate-500">{t('ward_provision.subtitle')}</p>
                            </div>
                            <div className="text-right text-sm text-slate-400">
                                <p>{language === 'mr' ? 'आर्थिक वर्ष' : 'Financial Year'}: {year}</p>
                                <p>{language === 'mr' ? 'एकूण नोंदी' : 'Total Records'}: {provisions.length}</p>
                                <p className="mt-1 text-xs">
                                    {language === 'mr' ? 'विनंती' : 'Requested'}: {formatCurrency(totalRequested)} |{' '}
                                    {language === 'mr' ? 'मंजूर' : 'Sanctioned'}: {formatCurrency(totalSanctioned)}
                                </p>
                            </div>
                        </div>

                        <table className="w-full border-collapse border border-slate-200 text-[10px] table-fixed report-table-header">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[5%]">{t('common.report_columns.sr_no')}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[30%]">{t('ward_provision.col_title')}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[15%]">{t('ward_provision.col_area')}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[20%]">{language === 'mr' ? 'विनंती रक्कम' : 'Requested Amount'}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[15%]">{language === 'mr' ? 'मंजूर रक्कम' : 'Sanctioned Amount'}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[15%]">{t('ward_provision.col_status')}</th>
                                </tr>
                            </thead>
                        </table>

                        {provisions.map((item, index) => (
                            <table key={item.id} className="report-row w-full border-collapse border-b border-l border-r border-slate-200 text-[10px] table-fixed bg-white">
                                <tbody>
                                    <tr>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[5%] align-top">{index + 1}</td>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[30%]">
                                            <div className="font-bold"><TranslatedText text={item.title} /></div>
                                            <div className="text-[8px] text-slate-500 mt-0.5"><TranslatedText text={item.category || ''} /></div>
                                            {item.letterReference && (
                                                <div className="text-[8px] text-slate-400">Ref: {item.letterReference}</div>
                                            )}
                                        </td>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[15%] align-top">
                                            <TranslatedText text={item.area || '-'} />
                                        </td>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[20%] align-top font-medium">
                                            {formatCurrency(item.requestedAmount)}
                                        </td>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[15%] align-top font-bold text-green-700">
                                            {item.sanctionedAmount ? formatCurrency(item.sanctionedAmount) : '--'}
                                        </td>
                                        <td className="px-2 py-2 w-[15%] align-top">
                                            <span className={`px-1 py-0.5 rounded text-[8px] font-bold border inline-block ${
                                                item.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                item.status === 'Partially Approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                item.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-yellow-50 text-yellow-700 border-yellow-200'
                                            }`}>
                                                {getStatusLabel(item.status)}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        ))}

                        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between text-[10px] text-slate-500">
                            <span>{language === 'mr' ? 'एकूण विनंती:' : 'Total Requested:'} <strong>{formatCurrency(totalRequested)}</strong></span>
                            <span>{language === 'mr' ? 'एकूण मंजूर:' : 'Total Sanctioned:'} <strong className="text-green-700">{formatCurrency(totalSanctioned)}</strong></span>
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-slate-400 text-[10px] italic">
                            Generated by Nagarsevak Management System
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
