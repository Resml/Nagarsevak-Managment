import React, { useRef, useState } from 'react';
import { Download, X, FileText, AlertTriangle, Users } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useLanguage } from '../../context/LanguageContext';
import { format } from 'date-fns';

interface DuplicateGroup {
    normalizedName: string;
    voters: any[];
}

interface DuplicateVotersPdfGeneratorProps {
    duplicateGroups: DuplicateGroup[];
    totalDuplicates: number;
    onClose: () => void;
}

export const DuplicateVotersPdfGenerator: React.FC<DuplicateVotersPdfGeneratorProps> = ({ duplicateGroups, totalDuplicates, onClose }) => {
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
                .bg-slate-100 { background-color: #f1f5f9 !important; }
                .bg-white { background-color: #ffffff !important; }
                .border-slate-200 { border-color: #e2e8f0 !important; }
                .border-slate-50 { border-color: #f8fafc !important; }
                .text-red-600 { color: #dc2626 !important; }
                .border-emerald-200 { border-color: #a7f3d0 !important; }
                .bg-emerald-50 { background-color: #ecfdf5 !important; }
                .text-emerald-700 { color: #047857 !important; }
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
                currentY += height + 5;
                setProgress(Math.round(((i + 1) / rows.length) * 100));

                await new Promise(resolve => setTimeout(resolve, 10));
            }

            pdf.save(`Duplicate_Voters_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
                        <h2 className="text-lg font-bold text-slate-800">{isMr ? 'ड्युप्लिकेट मतदार शोध' : 'Duplicate Voter Detection'} - {t('common.report_view') || 'Report View'}</h2>
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
                            disabled={generating || duplicateGroups.length === 0}
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
                                        <AlertTriangle className="w-8 h-8 text-brand-500" />
                                        {isMr ? 'ड्युप्लिकेट मतदार शोध अहवाल' : 'Duplicate Voter Detection Report'}
                                    </h1>
                                    <p className="text-slate-500">
                                        {isMr ? 'सारखे नाव असलेल्या मतदारांची यादी' : 'List of voters with matching full names'}
                                    </p>
                                </div>
                                <div className="text-right text-sm text-slate-400">
                                    <p>{t('common.date') || 'Date'}: {format(new Date(), 'dd/MM/yyyy, hh:mm a')}</p>
                                </div>
                            </div>

                            {/* Stats Summary */}
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg border-l-4 border-l-brand-500">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <Users className="w-4 h-4 text-brand-600" />
                                        <span className="text-xs font-semibold">{t('duplicate_voters.duplicate_groups') || 'Duplicate Groups'}</span>
                                    </div>
                                    <p className="text-lg font-black text-brand-600">{duplicateGroups.length}</p>
                                </div>
                                <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg border-l-4 border-l-red-500">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <AlertTriangle className="w-4 h-4 text-red-600" />
                                        <span className="text-xs font-semibold">{t('duplicate_voters.total_affected') || 'Total Affected Voters'}</span>
                                    </div>
                                    <p className="text-lg font-black text-red-600">{totalDuplicates}</p>
                                </div>
                                <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg border-l-4 border-l-slate-400">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <FileText className="w-4 h-4 text-slate-600" />
                                        <span className="text-xs font-semibold">{t('duplicate_voters.est_extra') || 'Est. Extra Records'}</span>
                                    </div>
                                    <p className="text-lg font-black text-slate-700">
                                        {duplicateGroups.reduce((sum, g) => sum + (g.voters.length - 1), 0)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {duplicateGroups.length === 0 ? (
                            <div className="text-center p-10 text-slate-500">
                                {isMr ? 'ड्युप्लिकेट मतदार सापडले नाहीत.' : 'No duplicate voters found.'}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {duplicateGroups.map((group) => {
                                    const count = group.voters.length;
                                    const groupName = isMr && group.voters.find(v => v.name_marathi)?.name_marathi
                                        ? group.voters.find(v => v.name_marathi)?.name_marathi
                                        : group.voters[0].name_english;

                                    return (
                                        <div key={group.normalizedName} className="report-row border border-brand-200 rounded-xl bg-white overflow-hidden break-inside-avoid shadow-sm">
                                            {/* Group Header */}
                                            <div className="bg-brand-50 p-4 border-b border-brand-100 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-brand-100 shadow-sm">
                                                        <AlertTriangle className="w-4 h-4 text-brand-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-brand-900 text-lg">
                                                            {groupName}
                                                        </h3>
                                                        <span className="text-xs text-brand-700 font-semibold mt-0.5 block">
                                                            {t('duplicate_voters.records_count', { count }) || `${count} records with this exact name`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Voters Grid */}
                                            <div className="p-4 bg-slate-50 grid grid-cols-2 gap-4">
                                                {group.voters.map((voter, idx) => (
                                                    <div
                                                        key={voter.id}
                                                        className={`relative bg-white border rounded-xl p-3 shadow-sm ${idx === 0 ? 'border-emerald-200' : 'border-slate-200'}`}
                                                    >
                                                        {idx === 0 && (
                                                            <div className="absolute top-2 right-2">
                                                                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                                                                    {t('duplicate_voters.first_record') || 'First Record'}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="pr-16 mb-2">
                                                            <p className="font-bold text-slate-900 text-sm">
                                                                {isMr && voter.name_marathi ? voter.name_marathi : voter.name_english}
                                                            </p>
                                                            {!isMr && voter.name_marathi && (
                                                                <p className="text-[10px] text-slate-500">{voter.name_marathi}</p>
                                                            )}
                                                            {isMr && voter.name_english && !voter.name_marathi && (
                                                                <p className="text-[10px] text-slate-500">{voter.name_english}</p>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-600 border-t border-slate-50 pt-2">
                                                            <div>
                                                                <span className="text-slate-400 font-semibold">{t('duplicate_voters.epic_no') || 'EPIC No'}: </span>
                                                                <span className="font-mono font-bold text-slate-800">{voter.epic_no || '—'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400 font-semibold">{t('duplicate_voters.serial_no') || 'Serial No'}: </span>
                                                                <span className="font-bold text-slate-800">{voter.serial_no || '—'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400 font-semibold">{t('duplicate_voters.age') || 'Age'}: </span>
                                                                <span className="font-bold text-slate-800">{voter.age || '—'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400 font-semibold">{t('duplicate_voters.gender') || 'Gender'}: </span>
                                                                <span className="font-bold text-slate-800">
                                                                    {voter.gender === 'M' ? (isMr ? 'पुरुष' : 'Male') : voter.gender === 'F' ? (isMr ? 'महिला' : 'Female') : voter.gender || '—'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400 font-semibold">{t('duplicate_voters.ward') || 'Ward'}: </span>
                                                                <span className="font-bold text-slate-800">{voter.ward_no || '—'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400 font-semibold">{t('duplicate_voters.booth_part') || 'Part'}: </span>
                                                                <span className="font-bold text-slate-800">{voter.part_no || '—'}</span>
                                                            </div>
                                                            <div className="col-span-2 mt-1">
                                                                <span className="text-slate-400 font-semibold">{t('duplicate_voters.house_no') || 'House No'}: </span>
                                                                <span className="font-bold text-slate-800">{voter.house_no || '—'}</span>
                                                            </div>
                                                            {voter.mobile && (
                                                                <div className="col-span-2 mt-1">
                                                                    <span className="text-slate-400 font-semibold">{t('duplicate_voters.mobile') || 'Mobile'}: </span>
                                                                    <span className="font-bold text-slate-800">{voter.mobile}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {(voter.address_marathi || voter.address_english) && (
                                                            <div className="text-[9px] text-slate-500 border-t border-slate-50 pt-1.5 mt-1.5">
                                                                📍 {isMr ? (voter.address_marathi || voter.address_english) : (voter.address_english || voter.address_marathi)}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-slate-400 text-[10px] italic">
                            {t('common.generated_by')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
