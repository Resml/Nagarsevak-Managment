import React, { useRef, useState } from 'react';
import { Download, X, BarChart2, CheckCircle2, Phone, MapPin } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useLanguage } from '../../context/LanguageContext';
import { format } from 'date-fns';
import { TranslatedText } from '../TranslatedText';

interface KaryakartaWorkloadPdfGeneratorProps {
    staffData: any[];
    tasksData: any[];
    complaintsData: any[];
    activeTabLabel: string;
    onClose: () => void;
}

export const KaryakartaWorkloadPdfGenerator: React.FC<KaryakartaWorkloadPdfGeneratorProps> = ({ 
    staffData = [], 
    tasksData = [], 
    complaintsData = [], 
    activeTabLabel,
    onClose 
}) => {
    const { t, language } = useLanguage();
    const isMr = language === 'mr';
    const reportRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const getStaffStats = (staffId: string) => {
        const mTasks = tasksData.filter(t => t.assigned_staff_id === staffId);
        const mComplaints = complaintsData.filter(c => c.assigned_to === staffId);
        const mT_pending = mTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
        const mC_pending = mComplaints.filter(
            c => c.status === 'Pending' || c.status === 'Assigned' || c.status === 'InProgress'
        ).length;
        const totalAssigned = mTasks.length + mComplaints.length;
        const totalCompleted =
            mTasks.filter(t => t.status === 'Completed').length +
            mComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
        const progressPct =
            totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

        return {
            mT_total: mTasks.length,
            mC_total: mComplaints.length,
            mT_pending,
            mC_pending,
            totalPending: mT_pending + mC_pending,
            totalAssigned,
            totalCompleted,
            progressPct,
        };
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
                .text-slate-400 { color: #94a3b8 !important; }
                .bg-slate-50 { background-color: #f8fafc !important; }
                .bg-slate-100 { background-color: #f1f5f9 !important; }
                .bg-white { background-color: #ffffff !important; }
                .border-slate-200 { border-color: #e2e8f0 !important; }
                .text-emerald-700 { color: #047857 !important; }
                .bg-emerald-50 { background-color: #ecfdf5 !important; }
                .text-emerald-500 { color: #10b981 !important; }
                .bg-emerald-500 { background-color: #10b981 !important; }
                .text-amber-700 { color: #b45309 !important; }
                .bg-amber-50 { background-color: #fffbeb !important; }
                .text-amber-600 { color: #d97706 !important; }
                .text-blue-700 { color: #1d4ed8 !important; }
                .bg-blue-50 { background-color: #eff6ff !important; }
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
                currentY += height;
                setProgress(Math.round(((i + 1) / rows.length) * 100));

                await new Promise(resolve => setTimeout(resolve, 10));
            }

            pdf.save(`Workload_Report_${activeTabLabel}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
                        <BarChart2 className="w-5 h-5 text-brand-600" />
                        <h2 className="text-lg font-bold text-slate-800">
                            {isMr ? 'टीम कार्यभार मॉनिटर' : 'Team Workload Monitor'} - {t('common.report_view') || 'Report View'}
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
                                        <BarChart2 className="w-8 h-8" />
                                        {isMr ? 'टीम कार्यभार मॉनिटर' : 'Team Workload Monitor'}
                                    </h1>
                                    <p className="text-slate-500 font-medium">
                                        {isMr ? 'विभाग' : 'Department'}: {activeTabLabel}
                                    </p>
                                </div>
                                <div className="text-right text-sm text-slate-400">
                                    <p>{t('common.date') || 'Date'}: {format(new Date(), 'dd/MM/yyyy, hh:mm a')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {staffData.length === 0 ? (
                                <div className="text-center p-10 text-slate-500">
                                    {isMr ? 'कोणतेही सदस्य आढळले नाहीत.' : 'No members found.'}
                                </div>
                            ) : (
                                staffData.map((member) => {
                                    const s = getStaffStats(member.id);
                                    return (
                                        <div key={member.id} className="report-row border border-slate-200 rounded-xl p-4 bg-white break-inside-avoid shadow-sm mb-4">
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-lg border border-brand-100 flex-shrink-0">
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 text-base">
                                                            <TranslatedText text={member.name} isName={true} />
                                                        </h3>
                                                        <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                                                            {member.mobile && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {member.mobile}</span>}
                                                            {member.area && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> <TranslatedText text={member.area} /></span>}
                                                            {member.role && <span className="text-slate-600 font-medium px-1.5 py-0.5 bg-slate-100 rounded"><TranslatedText text={member.role} /></span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-black text-brand-600 mb-1">{s.progressPct}%</div>
                                                    <div className="text-[10px] text-slate-400 font-semibold uppercase">{isMr ? 'प्रगती' : 'Progress'}</div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs font-bold text-slate-600 uppercase">{isMr ? 'कामे (Tasks)' : 'Tasks'}</span>
                                                        <span className="text-xs font-black text-slate-800">{s.mT_total} Total</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1 bg-white border border-amber-200 rounded px-2 py-1 text-center">
                                                            <div className="text-sm font-bold text-amber-600">{s.mT_pending}</div>
                                                            <div className="text-[9px] text-amber-700 uppercase">{isMr ? 'प्रलंबित' : 'Pending'}</div>
                                                        </div>
                                                        <div className="flex-1 bg-white border border-emerald-200 rounded px-2 py-1 text-center">
                                                            <div className="text-sm font-bold text-emerald-600">{s.mT_total - s.mT_pending}</div>
                                                            <div className="text-[9px] text-emerald-700 uppercase">{isMr ? 'पूर्ण' : 'Completed'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs font-bold text-slate-600 uppercase">{isMr ? 'तक्रारी (Complaints)' : 'Complaints'}</span>
                                                        <span className="text-xs font-black text-slate-800">{s.mC_total} Total</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1 bg-white border border-blue-200 rounded px-2 py-1 text-center">
                                                            <div className="text-sm font-bold text-blue-600">{s.mC_pending}</div>
                                                            <div className="text-[9px] text-blue-700 uppercase">{isMr ? 'प्रलंबित' : 'Pending'}</div>
                                                        </div>
                                                        <div className="flex-1 bg-white border border-emerald-200 rounded px-2 py-1 text-center">
                                                            <div className="text-sm font-bold text-emerald-600">{s.mC_total - s.mC_pending}</div>
                                                            <div className="text-[9px] text-emerald-700 uppercase">{isMr ? 'पूर्ण' : 'Resolved'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
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
