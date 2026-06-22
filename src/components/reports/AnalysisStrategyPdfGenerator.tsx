import React, { useRef, useState } from 'react';
import { Download, X, FileText, Users, MapPin, Activity, PieChart, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useLanguage } from '../../context/LanguageContext';
import { type AreaMetrics } from '../../pages/political/AnalysisStrategy';
import { format } from 'date-fns';

interface AnalysisStrategyPdfGeneratorProps {
    reportData: AreaMetrics;
    generatedBrief: string;
    onClose: () => void;
}

export const AnalysisStrategyPdfGenerator: React.FC<AnalysisStrategyPdfGeneratorProps> = ({ reportData, generatedBrief, onClose }) => {
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

            // Capture all blocks
            const blocks = Array.from(reportRef.current.querySelectorAll('.report-block')) as HTMLElement[];
            for (let i = 0; i < blocks.length; i++) {
                const block = blocks[i];
                const { imgData, height } = await captureElement(block);

                if (currentY + height > pdfHeight - margin && currentY > margin) {
                    pdf.addPage();
                    currentY = margin;
                }

                pdf.addImage(imgData, 'PNG', margin, currentY, pdfWidth - (margin * 2), height, undefined, 'FAST');
                currentY += height + 5;
                setProgress(Math.round(((i + 1) / blocks.length) * 100));

                await new Promise(resolve => setTimeout(resolve, 10));
            }

            pdf.save(`Intelligence_Report_${reportData.areaName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
                        <h2 className="text-lg font-bold text-slate-800">{isMr ? 'विश्लेषण धोरण अहवाल' : 'Analysis Strategy Report'}</h2>
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
                        className="bg-white shadow-lg mx-auto p-10 min-h-[297mm] w-[210mm] text-slate-800 space-y-6"
                    >
                        {/* Header Block */}
                        <div className="report-block border-b-2 border-brand-600 pb-6">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-brand-700 mb-1">{isMr ? 'क्षेत्रीय गुप्तचर व सल्लागार अहवाल' : 'Area Intelligence & Briefing Docket'}</h1>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <MapPin className="w-4 h-4 text-brand-500" />
                                        <span className="font-semibold text-brand-700">{reportData.areaName}</span>
                                    </div>
                                </div>
                                <div className="text-right text-sm text-slate-400">
                                    <p>{t('common.date')}: {format(new Date(), 'dd/MM/yyyy')}</p>
                                    <p className="text-xs font-mono mt-1">CONFIDENTIAL POLITICAL DOCUMENT</p>
                                </div>
                            </div>

                            {/* Key Stats Row */}
                            <div className="flex gap-4">
                                <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <Users className="w-4 h-4" />
                                        <span className="text-xs font-semibold">{isMr ? 'एकूण मतदार' : 'Total Voters'}</span>
                                    </div>
                                    <p className="text-xl font-bold text-slate-900">{reportData.totalVoters.toLocaleString()}</p>
                                </div>
                                <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <Activity className="w-4 h-4" />
                                        <span className="text-xs font-semibold">{isMr ? 'कार्यालयीन कर्मचारी / कार्यकर्ते' : 'Office Staff / Karyakartas'}</span>
                                    </div>
                                    <p className="text-xl font-bold text-brand-700">{reportData.staffCount.toLocaleString()}</p>
                                </div>
                                <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-green-600 mb-1">
                                        <Users className="w-4 h-4" />
                                        <span className="text-xs font-semibold">{isMr ? 'समर्थक व स्नेही मतदार' : 'Supporters & Friendly Voters'}</span>
                                    </div>
                                    <p className="text-xl font-bold text-green-700">{reportData.supportersCount.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Demographics Block */}
                        <div className="report-block bg-white p-4 border border-slate-200 rounded-xl">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">{isMr ? 'मतदार लोकसंख्याशास्त्र (लोकसंख्या विश्लेषण)' : 'Voter Demographics (Population Analysis)'}</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-600 mb-3">{isMr ? 'वय गट विश्लेषण' : 'Age Group Analysis'}</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span>{isMr ? 'युवा (१८-३५ वर्षे)' : 'Youth (18-35 yrs)'}</span>
                                            <span className="font-bold">{reportData.age18_35}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>{isMr ? 'मध्यमवयीन (३६-६० वर्षे)' : 'Middle Aged (36-60 yrs)'}</span>
                                            <span className="font-bold">{reportData.age36_60}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>{isMr ? 'ज्येष्ठ नागरिक (६०+ वर्षे)' : 'Seniors (60+ yrs)'}</span>
                                            <span className="font-bold">{reportData.age61Plus}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-600 mb-3">{isMr ? 'लिंग गुणोत्तर' : 'Gender Ratio'}</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span>{isMr ? 'पुरुष' : 'Male'}</span>
                                            <span className="font-bold text-brand-600">{reportData.genderMale}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>{isMr ? 'महिला' : 'Female'}</span>
                                            <span className="font-bold text-rose-500">{reportData.genderFemale}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-slate-500">
                                            <span>{isMr ? 'मोबाईल संपर्क पोहोच' : 'Mobile Contact Reach'}</span>
                                            <span className="font-bold">{reportData.mobileReach}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Caste Distribution Block */}
                        <div className="report-block bg-white p-4 border border-slate-200 rounded-xl">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">{isMr ? 'अंदाजे जात लोकसंख्या' : 'Estimated Caste Population'}</h3>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                {Object.entries(reportData.casteDistribution).map(([caste, count]) => (
                                    <div key={caste} className="flex justify-between text-sm">
                                        <span className="text-slate-600">{caste}</span>
                                        <span className="font-bold">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Problems & Requests Block */}
                        <div className="report-block grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 border border-slate-200 rounded-xl">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">{isMr ? 'नागरी समस्या व तक्रारी' : 'Civic Problems & Complaints'}</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600 font-semibold">{isMr ? 'सोडवलेल्या तक्रारी' : 'Solved Complaints'}</span>
                                        <span className="font-bold">{reportData.solvedComplaints}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-amber-600 font-semibold">{isMr ? 'प्रलंबित कामे / तक्रारी' : 'Ongoing/Pending Complaints'}</span>
                                        <span className="font-bold">{reportData.ongoingComplaints}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600 font-semibold">{isMr ? 'एकूण प्राप्त तक्रारी' : 'Total Complaints Received'}</span>
                                        <span className="font-bold">{reportData.totalComplaints}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 border border-slate-200 rounded-xl">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">{isMr ? 'वैयक्तिक स्वरूपाची कामे' : 'Personal Requests'}</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600 font-semibold">{isMr ? 'पूर्ण केलेली कामे' : 'Completed Requests'}</span>
                                        <span className="font-bold">{reportData.solvedRequests}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-amber-600 font-semibold">{isMr ? 'प्रलंबित विनंत्या' : 'Pending Requests'}</span>
                                        <span className="font-bold">{reportData.pendingRequests}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Election Performance Block */}
                        <div className="report-block bg-white p-4 border border-slate-200 rounded-xl">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">{isMr ? 'मागील निवडणूक कामगिरी विश्लेषण' : 'Past Election Performance Analysis'}</h3>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="bg-slate-50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-slate-500 mb-1 uppercase">{isMr ? 'विजेता पक्ष / उमेदवार' : 'Winner'}</p>
                                    <p className="text-sm font-bold text-slate-800">{reportData.winnerName}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-slate-500 mb-1 uppercase">{isMr ? 'मताधिक्य' : 'Winning Margin'}</p>
                                    <p className="text-sm font-bold text-brand-600">+{reportData.winningMargin}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-slate-500 mb-1 uppercase">{isMr ? 'एकूण मतदान' : 'Total Votes'}</p>
                                    <p className="text-sm font-bold text-slate-800">{reportData.totalElectionVotes}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {Object.entries(reportData.partyPerformance).map(([party, votes]) => (
                                    <div key={party} className="flex items-center text-sm">
                                        <span className="w-32 truncate text-slate-600">{party}</span>
                                        <div className="flex-1 mx-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-brand-500" style={{ width: `${(votes / (reportData.totalElectionVotes || 1)) * 100}%` }} />
                                        </div>
                                        <span className="font-bold w-16 text-right">{votes}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Briefing Block */}
                        {generatedBrief && (
                            <div className="report-block bg-brand-50 p-6 border border-brand-200 rounded-xl">
                                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-brand-200/50">
                                    <Sparkles className="w-5 h-5 text-brand-600" />
                                    <h3 className="text-lg font-bold text-brand-800">{isMr ? '🤖 जेमिनी एआय धोरणात्मक सल्ला मसुदा' : '🤖 Gemini AI Visiting Brief & Strategy'}</h3>
                                </div>
                                <div className="text-sm text-brand-900 leading-relaxed whitespace-pre-wrap">
                                    {generatedBrief}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
