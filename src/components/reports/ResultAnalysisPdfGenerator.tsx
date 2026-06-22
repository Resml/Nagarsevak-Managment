import React, { useRef, useState } from 'react';
import { Download, X, FileText, Users, PieChart, CheckCircle, XCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useLanguage } from '../../context/LanguageContext';
import { type ElectionResult } from '../../types';
import { format } from 'date-fns';

interface ResultAnalysisPdfGeneratorProps {
    ward: string;
    selectedCandidate: string;
    results: ElectionResult[];
    onClose: () => void;
}

export const ResultAnalysisPdfGenerator: React.FC<ResultAnalysisPdfGeneratorProps> = ({ ward, selectedCandidate, results, onClose }) => {
    const { t, language } = useLanguage();
    const reportRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const totalVotesRow = results.find(r => r.boothNumber === 'एकूण मत');
    const totalVotes = totalVotesRow ? totalVotesRow.totalVotesCasted : results.reduce((sum, r) => sum + r.totalVotesCasted, 0);
    const ourVotes = totalVotesRow ? (totalVotesRow.candidateVotes[selectedCandidate] || 0) : results.reduce((sum, r) => sum + (r.candidateVotes[selectedCandidate] || 0), 0);
    const voteShare = totalVotes > 0 ? (ourVotes / totalVotes) * 100 : 0;

    const winningBooths = results.filter(r => r.winner === selectedCandidate).length;
    const losingBooths = results.length - winningBooths;

    const sortedResults = [...results].sort((a, b) => {
        const aNum = a.boothNumber.match(/\d+/);
        const bNum = b.boothNumber.match(/\d+/);
        if (aNum && bNum) {
            return Number(aNum[0]) - Number(bNum[0]);
        }
        return a.boothNumber.localeCompare(b.boothNumber);
    });

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
                .text-green-700 { color: #15803d !important; }
                .bg-green-50 { background-color: #f0fdf4 !important; }
                .text-green-600 { color: #16a34a !important; }
                .text-red-600 { color: #dc2626 !important; }
                .text-blue-500 { color: #3b82f6 !important; }
                .text-purple-500 { color: #a855f7 !important; }
                .text-green-500 { color: #22c55e !important; }
                .text-red-500 { color: #ef4444 !important; }
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

            // 3. Capture Rows
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

            pdf.save(`Election_Results_${ward}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
                        <h2 className="text-lg font-bold text-slate-800">{t('election.title')} - {t('common.report_view')}</h2>
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
                        <div className="report-header border-b-2 border-brand-600 pb-6 mb-8">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-brand-700 mb-1">{t('election.title')}</h1>
                                    <p className="text-slate-500">{t('election.performance_report')} <span className="font-semibold text-brand-700">{selectedCandidate}</span></p>
                                </div>
                                <div className="text-right text-sm text-slate-400">
                                    <p>{t('common.date')}: {format(new Date(), 'dd/MM/yyyy')}</p>
                                    <p>{t('voters.ward')}: {ward}</p>
                                </div>
                            </div>

                            {/* Stats Summary */}
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <Users className="w-4 h-4" />
                                        <span className="text-xs font-semibold">{t('election.total_votes')}</span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-900">{ourVotes.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-500">{t('election.votes_cast').replace('{{total}}', totalVotes.toLocaleString())}</p>
                                </div>
                                <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <PieChart className="w-4 h-4" />
                                        <span className="text-xs font-semibold">{t('election.vote_share')}</span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-900">{voteShare.toFixed(1)}%</p>
                                </div>
                                <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span className="text-xs font-semibold">{t('election.winning_booths')}</span>
                                    </div>
                                    <p className="text-lg font-bold text-green-600">{winningBooths}</p>
                                </div>
                                <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <XCircle className="w-4 h-4 text-red-500" />
                                        <span className="text-xs font-semibold">{t('election.losing_booths')}</span>
                                    </div>
                                    <p className="text-lg font-bold text-red-600">{losingBooths}</p>
                                </div>
                            </div>
                        </div>

                        <table className="w-full border-collapse border border-slate-200 text-[10px] table-fixed report-table-header">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-16">केंद्र क्र.</th>
                                    {sortedResults.length > 0 && Object.keys(sortedResults[0].candidateVotes).map(candidate => (
                                        <th key={candidate} className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700">
                                            <span className="line-clamp-2" title={candidate}>{candidate}</span>
                                        </th>
                                    ))}
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-16">एकूण</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-24">विजयी</th>
                                    <th className="border border-slate-200 px-2 py-2 text-left font-bold text-slate-700 w-16">फरक</th>
                                </tr>
                            </thead>
                        </table>

                        {sortedResults.filter(r => !['सर्व मतदान केंद्र नोंदवण्यात आलेली मते', 'टपाल मतदान'].includes(r.boothNumber)).map((r) => {
                            const candidates = Object.keys(r.candidateVotes);
                            return (
                                <table key={r.id} className="report-row w-full border-collapse border-b border-l border-r border-slate-200 text-[10px] table-fixed bg-white">
                                    <tbody>
                                        <tr>
                                            <td className="border-r border-slate-200 px-2 py-2 align-top text-slate-900 font-semibold w-16">
                                                {r.boothNumber}
                                            </td>
                                            {candidates.map(c => {
                                                const votes = r.candidateVotes[c];
                                                const isWin = r.winner === c;
                                                const isSelected = c === selectedCandidate;
                                                return (
                                                    <td key={c} className={`border-r border-slate-200 px-2 py-2 align-top ${isWin ? 'font-bold text-green-700 bg-green-50' : isSelected ? 'font-semibold text-brand-800 bg-brand-50' : 'text-slate-500'}`}>
                                                        {votes}
                                                    </td>
                                                );
                                            })}
                                            <td className="border-r border-slate-200 px-2 py-2 align-top font-bold text-slate-900 w-16">
                                                {r.totalVotesCasted}
                                            </td>
                                            <td className="border-r border-slate-200 px-2 py-2 align-top text-brand-700 font-semibold w-24">
                                                <div className="line-clamp-2">{r.winner}</div>
                                            </td>
                                            <td className="px-2 py-2 align-top text-slate-500 w-16">
                                                {r.margin}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            );
                        })}

                        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-slate-400 text-[10px] italic">
                            {t('common.generated_by')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
