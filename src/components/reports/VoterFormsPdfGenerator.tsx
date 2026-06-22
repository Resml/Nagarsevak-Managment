import React, { useRef, useState } from 'react';
import { Download, X, FileText, ClipboardList, CheckCircle2, UserPlus, UserMinus, UserCheck, Search, History } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useLanguage } from '../../context/LanguageContext';
import { format } from 'date-fns';
import type { VoterApplication } from '../../types';

interface VoterFormsPdfGeneratorProps {
    activeTab: 'forms' | 'applications';
    formsData?: any[];
    applications?: VoterApplication[];
    onClose: () => void;
}

export const VoterFormsPdfGenerator: React.FC<VoterFormsPdfGeneratorProps> = ({ activeTab, formsData = [], applications = [], onClose }) => {
    const { t, language } = useLanguage();
    const isMr = language === 'mr';
    const reportRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const getFormTypeLabel = (type: string) => {
        const key = `voter_forms.form_type_${type.toLowerCase().replace(' ', '')}`;
        return t(key) || type;
    };

    const getStatusLabel = (status: string) => {
        const key = `voter_forms.status_${status.toLowerCase()}`;
        return t(key) || status;
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
                .text-emerald-700 { color: #047857 !important; }
                .bg-emerald-50 { background-color: #ecfdf5 !important; }
                .text-emerald-500 { color: #10b981 !important; }
                .bg-emerald-500 { background-color: #10b981 !important; }
                .text-amber-700 { color: #b45309 !important; }
                .bg-amber-50 { background-color: #fffbeb !important; }
                .border-amber-200 { border-color: #fde68a !important; }
                .text-red-700 { color: #b91c1c !important; }
                .bg-red-50 { background-color: #fef2f2 !important; }
                .border-red-200 { border-color: #fecaca !important; }
                .text-blue-700 { color: #1d4ed8 !important; }
                .bg-blue-50 { background-color: #eff6ff !important; }
                .border-blue-200 { border-color: #bfdbfe !important; }
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

            const title = activeTab === 'forms' ? 'Voter_Forms_Guide' : 'Voter_Applications_History';
            pdf.save(`${title}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
                        <h2 className="text-lg font-bold text-slate-800">
                            {isMr ? 'मतदार नोंदणी अर्ज' : 'Voter Registration Forms'} - {t('common.report_view') || 'Report View'}
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
                                        {activeTab === 'forms' ? <ClipboardList className="w-8 h-8" /> : <History className="w-8 h-8" />}
                                        {activeTab === 'forms' 
                                            ? (isMr ? 'मतदार अर्ज आणि माहिती' : 'Voter Forms & Guidelines')
                                            : (isMr ? 'अर्ज केलेले इतिहास' : 'Voter Applications History')}
                                    </h1>
                                    <p className="text-slate-500">
                                        {activeTab === 'forms'
                                            ? (isMr ? 'विविध मतदार अर्जांसाठी आवश्यक कागदपत्रे' : 'Required documents for various voter forms')
                                            : (isMr ? 'लॉग केलेल्या सर्व अर्जांची यादी' : 'List of all logged voter form applications')}
                                    </p>
                                </div>
                                <div className="text-right text-sm text-slate-400">
                                    <p>{t('common.date') || 'Date'}: {format(new Date(), 'dd/MM/yyyy, hh:mm a')}</p>
                                </div>
                            </div>

                            {activeTab === 'applications' && (
                                <div className="flex gap-4 mb-4">
                                    <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg border-l-4 border-l-brand-500">
                                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                                            <span className="text-xs font-semibold">{isMr ? 'एकूण अर्ज' : 'Total Applications'}</span>
                                        </div>
                                        <p className="text-lg font-black text-brand-600">{applications.length}</p>
                                    </div>
                                    <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg border-l-4 border-l-emerald-500">
                                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                                            <span className="text-xs font-semibold">{getStatusLabel('Approved')}</span>
                                        </div>
                                        <p className="text-lg font-black text-emerald-600">
                                            {applications.filter(a => a.status === 'Approved').length}
                                        </p>
                                    </div>
                                    <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg border-l-4 border-l-amber-500">
                                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                                            <span className="text-xs font-semibold">{getStatusLabel('Pending')}</span>
                                        </div>
                                        <p className="text-lg font-black text-amber-600">
                                            {applications.filter(a => a.status === 'Pending').length}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {activeTab === 'forms' ? (
                                formsData.map((form) => (
                                    <div key={form.id} className="report-row border border-slate-200 rounded-xl p-6 bg-white break-inside-avoid shadow-sm mb-4">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100 flex-shrink-0">
                                                {form.id === 'search' ? <Search className="w-6 h-6" /> :
                                                 form.id === 'form6' ? <UserPlus className="w-6 h-6" /> :
                                                 form.id === 'form7' ? <UserMinus className="w-6 h-6" /> :
                                                 <UserCheck className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg">
                                                    {form.title}
                                                </h3>
                                                <p className="text-sm text-slate-600 mt-1">
                                                    {form.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                                                <ClipboardList className="w-4 h-4 text-brand-600" />
                                                {isMr ? 'आवश्यक कागदपत्रे / माहिती' : 'Required Documents / Details'}
                                            </h4>
                                            <ul className="grid grid-cols-2 gap-2">
                                                {form.requirements.map((req: string, idx: number) => (
                                                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                        <span>{req}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))
                            ) : applications.length === 0 ? (
                                <div className="text-center p-10 text-slate-500">
                                    {isMr ? 'कोणतेही अर्ज सापडले नाहीत.' : 'No applications found.'}
                                </div>
                            ) : (
                                applications.map((app) => (
                                    <div key={app.id} className="report-row border border-slate-200 rounded-xl p-4 bg-white break-inside-avoid shadow-sm mb-3">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-base">{app.applicant_name}</h3>
                                                {app.applicant_mobile && (
                                                    <span className="text-xs text-slate-500 mt-1 inline-block">📞 {app.applicant_mobile}</span>
                                                )}
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                                app.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                app.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                app.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                                {getStatusLabel(app.status)}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 border-t border-slate-100 pt-3">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{t('voter_forms.form_type') || 'Form Type'}</span>
                                                <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                    {getFormTypeLabel(app.form_type)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{t('voter_forms.date') || 'Date'}</span>
                                                <span className="font-medium text-slate-700">
                                                    {new Date(app.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        {app.notes && (
                                            <div className="mt-3 bg-slate-50 p-2 rounded text-xs text-slate-600 italic border border-slate-100">
                                                <span className="font-semibold not-italic block mb-1 text-slate-500">Notes:</span>
                                                {app.notes}
                                            </div>
                                        )}
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
