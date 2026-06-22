import React, { useRef, useState } from 'react';
import { Download, X, FileText, Users, MapPin, Phone, Tag } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useLanguage } from '../../context/LanguageContext';
import { format } from 'date-fns';

interface OppositionMember {
    id: string;
    name: string;
    party: string;
    role?: string;
    area?: string;
    mobile?: string;
    is_candidate?: boolean;
    constituency?: string;
    opposing_candidate?: string;
    candidacy_status?: string;
    strongholds?: string[];
}

interface OppositionReportPdfGeneratorProps {
    members: OppositionMember[];
    onClose: () => void;
}

export const OppositionReportPdfGenerator: React.FC<OppositionReportPdfGeneratorProps> = ({ members, onClose }) => {
    const { t, language } = useLanguage();
    const isMr = language === 'mr';
    const reportRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const totalWorkers = members.filter(m => !m.is_candidate).length;
    const totalCandidates = members.filter(m => m.is_candidate).length;

    const getCandidacyStatusLabel = (status: string) => {
        if (!status) return '';
        switch (status) {
            case 'Declared': return t('opposition.status_declared') || 'Declared';
            case 'Contesting': return t('opposition.status_contesting') || 'Contesting';
            case 'Withdrawn': return t('opposition.status_withdrawn') || 'Withdrawn';
            case 'Won': return t('opposition.status_won') || 'Won';
            case 'Lost': return t('opposition.status_lost') || 'Lost';
            default: return status;
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
                .text-green-800 { color: #166534 !important; }
                .bg-green-100 { background-color: #dcfce3 !important; }
                .text-red-800 { color: #991b1b !important; }
                .bg-red-100 { background-color: #fee2e2 !important; }
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
                currentY += height;
                setProgress(Math.round(((i + 1) / rows.length) * 100));

                await new Promise(resolve => setTimeout(resolve, 10));
            }

            pdf.save(`Opposition_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
                        <h2 className="text-lg font-bold text-slate-800">{isMr ? 'विरोधी पक्षाची माहिती' : 'Opposition Information'} - {t('common.report_view')}</h2>
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
                            {generating ? (t('work_history.generating') || 'Generating...') : (language === 'mr' ? 'पीडीएफ डाउनलोड करा' : 'Download PDF')}
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
                                    <h1 className="text-3xl font-bold text-brand-700 mb-1">{isMr ? 'विरोधी पक्षाची माहिती' : 'Opposition Information'}</h1>
                                    <p className="text-slate-500">{t('opposition.subtitle') || 'Track and monitor opposition workers, strongholds, and key public campaigns'}</p>
                                </div>
                                <div className="text-right text-sm text-slate-400">
                                    <p>{t('common.date')}: {format(new Date(), 'dd/MM/yyyy')}</p>
                                </div>
                            </div>

                            {/* Stats Summary */}
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <Users className="w-4 h-4 text-brand-600" />
                                        <span className="text-xs font-semibold">{t('opposition.candidates') || 'Candidates'}</span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-900">{totalCandidates}</p>
                                </div>
                                <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <Users className="w-4 h-4 text-slate-600" />
                                        <span className="text-xs font-semibold">{t('opposition.workers') || 'Workers'}</span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-900">{totalWorkers}</p>
                                </div>
                                <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <Users className="w-4 h-4 text-brand-800" />
                                        <span className="text-xs font-semibold">{isMr ? 'एकूण सदस्य' : 'Total Members'}</span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-900">{members.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {members.map((member) => (
                                <div key={member.id} className="report-row border border-slate-200 rounded-xl p-4 bg-white break-inside-avoid">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                                {member.name}
                                                {member.is_candidate && (
                                                    <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
                                                )}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mt-2">
                                                <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">{member.party}</span>
                                                <span className={`px-2 py-0.5 rounded-full ${
                                                    member.is_candidate 
                                                        ? 'bg-brand-600 text-white' 
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {member.is_candidate 
                                                        ? (t('opposition.candidate') || 'Candidate') 
                                                        : (t('opposition.worker') || 'Worker')}
                                                </span>
                                                {member.role && (
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{member.role}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-600 border-t border-slate-100 pt-3">
                                        <div className="space-y-2">
                                            {member.mobile && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-slate-400" />
                                                    <span className="font-mono text-slate-700">{member.mobile}</span>
                                                </div>
                                            )}
                                            {member.area && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-slate-400" />
                                                    <span className="text-slate-700">{isMr ? 'मुख्य क्षेत्र' : 'Base Area'}: {member.area}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div>
                                            {member.is_candidate && (
                                                <div className="space-y-1 bg-brand-50 p-3 rounded-lg border border-brand-100">
                                                    {member.constituency && (
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="font-semibold text-slate-500">{t('opposition.constituency') || 'Constituency'}:</span>
                                                            <span className="font-bold text-slate-800">{member.constituency}</span>
                                                        </div>
                                                    )}
                                                    {member.opposing_candidate && (
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="font-semibold text-slate-500">{t('opposition.opposing') || 'Opposing'}:</span>
                                                            <span className="font-bold text-slate-800">{member.opposing_candidate}</span>
                                                        </div>
                                                    )}
                                                    {member.candidacy_status && (
                                                        <div className="flex items-center gap-2 text-xs mt-1">
                                                            <span className="font-semibold text-slate-500">{t('opposition.candidacy_status') || 'Status'}:</span>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold ${
                                                                member.candidacy_status === 'Won' ? 'bg-green-100 text-green-800' :
                                                                member.candidacy_status === 'Lost' ? 'bg-slate-200 text-slate-700' :
                                                                member.candidacy_status === 'Withdrawn' ? 'bg-red-100 text-red-800' :
                                                                member.candidacy_status === 'Contesting' ? 'bg-brand-100 text-brand-800' :
                                                                'bg-brand-50 text-brand-700'
                                                            }`}>
                                                                {getCandidacyStatusLabel(member.candidacy_status)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {member.strongholds && member.strongholds.length > 0 && (
                                                <div className="flex items-start gap-2 mt-2">
                                                    <Tag className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                    <div className="flex flex-wrap gap-1">
                                                        {member.strongholds.map((s: string, idx: number) => (
                                                            <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] border border-slate-200 font-medium">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
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
