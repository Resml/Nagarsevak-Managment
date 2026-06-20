import React, { useRef } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useLanguage } from '../../context/LanguageContext';
import { format } from 'date-fns';
import { type Voter } from '../../types';

interface VoterReportGeneratorProps {
    voters: Voter[];
    onClose: () => void;
    title?: string;
    subtitle?: string;
}

export const VoterReportGenerator: React.FC<VoterReportGeneratorProps> = ({ voters, onClose, title, subtitle }) => {
    const { t, language } = useLanguage();
    const reportRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = React.useState(false);
    const [progress, setProgress] = React.useState(0);

    const getDisplayName = (voter: Voter) => {
        if (language === 'mr') {
            return voter.name_marathi || voter.name || voter.name_english;
        }
        return voter.name_english || voter.name;
    };

    const getDisplayAddress = (voter: Voter) => {
        if (language === 'mr') {
            return voter.address_marathi || voter.address || voter.address_english;
        }
        return voter.address_english || voter.address;
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
                .bg-brand-50 { background-color: #f0f9ff !important; }
                .text-slate-900 { color: #0f172a !important; }
                .text-slate-800 { color: #1e293b !important; }
                .text-slate-700 { color: #334155 !important; }
                .text-slate-600 { color: #475569 !important; }
                .text-slate-500 { color: #64748b !important; }
                .bg-slate-50 { background-color: #f8fafc !important; }
                .bg-white { background-color: #ffffff !important; }
                .border-slate-200 { border-color: #e2e8f0 !important; }
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

                await new Promise(resolve => setTimeout(resolve, 5));
            }

            pdf.save(`Voter_List_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
                        <h2 className="text-lg font-bold text-slate-800">{t('voters.title') || 'Voters'} - {t('common.report_view') || 'Report'}</h2>
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
                                <h1 className="text-3xl font-bold text-brand-700 mb-1">{title || t('voters.title') || 'Voters List'}</h1>
                                <p className="text-slate-500">{subtitle || t('common.report_view') || 'Detailed Report'}</p>
                            </div>
                            <div className="text-right text-sm text-slate-400">
                                <p>{t('common.date') || 'Date'}: {format(new Date(), 'dd/MM/yyyy')}</p>
                                <p>{t('voters.found') || 'Found'}: {voters.length}</p>
                            </div>
                        </div>

                        <table className="w-full border-collapse border border-slate-200 text-[10px] table-fixed report-table-header">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[5%]">#</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[20%]">{t('common.name') || 'Name'}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[12%]">{t('common.epic_no') || 'EPIC No'}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[6%]">{t('voters.age') || 'Age'}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[6%]">{t('add_voter.form.gender') || 'Gender'}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[25%]">{t('voters.address') || 'Address'}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[10%]">{t('voters.ward') || 'Ward'} / {t('voters.booth') || 'Booth'}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[8%]">{t('add_voter.form.caste') || 'Caste'}</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-[8%]">{t('voters.favour_label') || 'Favour'}</th>
                                </tr>
                            </thead>
                        </table>

                        {voters.map((voter, index) => (
                            <table key={voter.id} className="report-row w-full border-collapse border-b border-l border-r border-slate-200 text-[10px] table-fixed bg-white">
                                <tbody>
                                    <tr>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[5%] align-top">{voter.serial_no || index + 1}</td>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[20%] align-top font-bold text-slate-800">{getDisplayName(voter)}</td>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[12%] align-top text-slate-600">{voter.epicNo || '-'}</td>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[6%] align-top text-slate-600">{voter.age || '-'}</td>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[6%] align-top text-slate-600">{voter.gender || '-'}</td>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[25%] align-top text-slate-600">{getDisplayAddress(voter) || '-'}</td>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[10%] align-top text-slate-600">{voter.ward} / {voter.booth}</td>
                                        <td className="border-r border-slate-200 px-2 py-2 w-[8%] align-top text-slate-600">{voter.caste || '-'}</td>
                                        <td className="px-2 py-2 w-[8%] align-top font-medium text-slate-700">{voter.favour || '-'}</td>
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
