import React, { useRef, useState } from 'react';
import { Download, X, FileText, Users, Building2, MapPin, Phone, Activity, Sparkles, Flag, Heart } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useLanguage } from '../../context/LanguageContext';
import { format } from 'date-fns';

interface EventConducted {
    id: string;
    title: string;
    title_mr?: string;
    year: number;
    description: string;
    description_mr?: string;
}

interface SocialOrganization {
    id: string;
    name: string;
    name_marathi?: string;
    name_english?: string;
    type: 'ngo' | 'sports_cricket' | 'ganpati_mandal' | 'navratri_mandal' | 'other';
    president_name: string;
    president_mobile: string;
    members_count: number;
    area: string;
    established_year: number;
    support_received: string;
    events_conducted: EventConducted[];
    description: string;
    status: 'Active' | 'Inactive';
}

interface MandalNgoReportPdfGeneratorProps {
    organizations: SocialOrganization[];
    onClose: () => void;
}

export const MandalNgoReportPdfGenerator: React.FC<MandalNgoReportPdfGeneratorProps> = ({ organizations, onClose }) => {
    const { t, language } = useLanguage();
    const isMr = language === 'mr';
    const reportRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const ngos = organizations.filter(o => o.type === 'ngo').length;
    const sports = organizations.filter(o => o.type === 'sports_cricket').length;
    const mandals = organizations.filter(o => o.type === 'ganpati_mandal' || o.type === 'navratri_mandal').length;

    const getOrgTypeName = (type: string) => {
        switch (type) {
            case 'ngo': return isMr ? 'एन.जी.ओ / सामाजिक संस्था' : 'NGO / Foundation';
            case 'sports_cricket': return isMr ? 'क्रीडा व क्रिकेट क्लब' : 'Cricket & Sports Club';
            case 'ganpati_mandal': return isMr ? 'गणेश मंडळ' : 'Ganpati Mandal';
            case 'navratri_mandal': return isMr ? 'नवरात्रौत्सव मंडळ' : 'Navratri Mandal';
            default: return isMr ? 'इतर संस्था व मंडळ' : 'Other Organization';
        }
    };

    const getOrgIcon = (type: string) => {
        switch (type) {
            case 'ngo': return Building2;
            case 'sports_cricket': return Activity;
            case 'ganpati_mandal': return Sparkles;
            case 'navratri_mandal': return Flag;
            default: return Heart;
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
                .text-emerald-700 { color: #047857 !important; }
                .bg-emerald-50 { background-color: #ecfdf5 !important; }
                .text-amber-700 { color: #b45309 !important; }
                .bg-amber-50 { background-color: #fffbeb !important; }
                .text-blue-700 { color: #1d4ed8 !important; }
                .bg-blue-50 { background-color: #eff6ff !important; }
                .text-rose-700 { color: #be123c !important; }
                .bg-rose-50 { background-color: #fff1f2 !important; }
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

            pdf.save(`NGO_Mandal_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
                        <h2 className="text-lg font-bold text-slate-800">{isMr ? 'एन.जी.ओ., क्रीडा व सार्वजनिक मंडळ माहिती' : 'NGOs, Clubs & Mandals Registry'} - {t('common.report_view')}</h2>
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
                                    <h1 className="text-3xl font-bold text-brand-700 mb-1">{isMr ? 'एन.जी.ओ., क्रीडा व मंडळ माहिती' : 'NGO & Mandal Registry'}</h1>
                                    <p className="text-slate-500">{isMr ? 'प्रभागातील एनजीओ, क्लब आणि मंडळांची यादी' : 'List of NGOs, Clubs and Mandals in the ward'}</p>
                                </div>
                                <div className="text-right text-sm text-slate-400">
                                    <p>{t('common.date')}: {format(new Date(), 'dd/MM/yyyy')}</p>
                                </div>
                            </div>

                            {/* Stats Summary */}
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <Building2 className="w-4 h-4 text-blue-600" />
                                        <span className="text-xs font-semibold">{isMr ? 'एकूण एनजीओ' : 'Total NGOs'}</span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-900">{ngos}</p>
                                </div>
                                <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <Activity className="w-4 h-4 text-emerald-600" />
                                        <span className="text-xs font-semibold">{isMr ? 'क्रीडा व क्रिकेट क्लब' : 'Sports Clubs'}</span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-900">{sports}</p>
                                </div>
                                <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <Sparkles className="w-4 h-4 text-amber-600" />
                                        <span className="text-xs font-semibold">{isMr ? 'उत्सव मंडळे' : 'Mandals'}</span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-900">{mandals}</p>
                                </div>
                                <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <Users className="w-4 h-4 text-brand-800" />
                                        <span className="text-xs font-semibold">{isMr ? 'एकूण नोंदणीकृत' : 'Total Registered'}</span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-900">{organizations.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {organizations.map((org) => {
                                const IconComponent = getOrgIcon(org.type);
                                return (
                                    <div key={org.id} className="report-row border border-slate-200 rounded-xl p-4 bg-white break-inside-avoid">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
                                                    <IconComponent className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-lg">
                                                        {isMr ? (org.name_marathi || org.name) : (org.name_english || org.name)}
                                                    </h3>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                                        {getOrgTypeName(org.type)}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                org.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}>
                                                {org.status === 'Active' ? (isMr ? 'सक्रिय' : 'Active') : (isMr ? 'निष्क्रिय' : 'Inactive')}
                                            </span>
                                        </div>

                                        {org.description && (
                                            <p className="text-slate-600 text-xs italic mt-2">"{org.description}"</p>
                                        )}

                                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-600 border-t border-slate-100 pt-3">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-500">{isMr ? 'अध्यक्ष' : 'President'}:</span>
                                                    <span className="font-bold text-slate-800">{org.president_name || '-'}</span>
                                                </div>
                                                {org.president_mobile && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="font-mono text-slate-700">{org.president_mobile}</span>
                                                    </div>
                                                )}
                                                {org.area && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-slate-700">{org.area}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-500">{isMr ? 'एकूण सदस्य' : 'Members Count'}:</span>
                                                    <span className="text-slate-800 font-bold">{org.members_count || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-500">{isMr ? 'स्थापना वर्ष' : 'Established Year'}:</span>
                                                    <span className="text-slate-800 font-bold">{org.established_year || '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {org.support_received && (
                                            <div className="mt-3 bg-brand-50/50 p-2 rounded-lg border border-brand-100/50">
                                                <span className="text-[10px] font-bold text-brand-700 block uppercase tracking-wider mb-1">
                                                    {isMr ? 'आपल्याकडून मिळालेली मदत' : 'Support Received'}
                                                </span>
                                                <p className="text-xs text-brand-900 font-medium">{org.support_received}</p>
                                            </div>
                                        )}

                                        {org.events_conducted && org.events_conducted.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-slate-100">
                                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-2">
                                                    {isMr ? 'प्रमुख उपक्रम' : 'Key Events'}
                                                </span>
                                                <div className="space-y-2">
                                                    {org.events_conducted.map((evt) => (
                                                        <div key={evt.id} className="flex gap-2 text-xs">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                                            <div>
                                                                <span className="font-bold text-slate-700">{isMr ? (evt.title_mr || evt.title) : (evt.title || evt.title_mr)}</span>
                                                                <span className="text-slate-500 ml-1">({evt.year})</span>
                                                                {(evt.description || evt.description_mr) && (
                                                                    <p className="text-slate-500 mt-0.5">{isMr ? (evt.description_mr || evt.description) : (evt.description || evt.description_mr)}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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
