import React, { useRef, useState } from 'react';
import { Download, X, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useLanguage } from '../../context/LanguageContext';

interface Scheme {
    id: number;
    name: string;
    description: string;
    eligibility: string;
    benefits: string;
    documents: string;
    category?: string;
}

interface SingleSchemePdfGeneratorProps {
    scheme: Scheme;
    onClose: () => void;
}

export const SingleSchemePdfGenerator: React.FC<SingleSchemePdfGeneratorProps> = ({ scheme, onClose }) => {
    const { t } = useLanguage();
    const reportRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const extractLanguages = (text: string) => {
        if (!text) return { en: '', mr: '' };
        const parts = text.split(' / ');
        if (parts.length === 2) {
            return { en: parts[0], mr: parts[1] };
        }
        const hasDevanagari = /[\u0900-\u097F]/.test(text);
        if (hasDevanagari) {
            const match = text.match(/[\u0900-\u097F].*/s);
            const mr = match ? match[0] : text;
            const split = text.split(/[\u0900-\u097F]/);
            const en = split[0].trim().replace(/[./]*$/, '');
            return { en, mr };
        }
        return { en: text, mr: text };
    };

    const name = extractLanguages(scheme.name);
    const description = extractLanguages(scheme.description);
    const eligibility = extractLanguages(scheme.eligibility);
    const benefits = extractLanguages(scheme.benefits);
    const documents = extractLanguages(scheme.documents);

    const handleDownload = async () => {
        if (!reportRef.current) return;
        setGenerating(true);
        setProgress(0);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const element = reportRef.current;
            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                onclone: (_doc, el) => {
                    el.style.overflow = 'visible';
                    el.style.height = 'auto';
                }
            });

            setProgress(60);

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 8;
            const usableWidth = pdfWidth - margin * 2;
            const imgHeight = (canvas.height * usableWidth) / canvas.width;

            let posY = margin;
            let remaining = imgHeight;
            let sourceY = 0;
            const pageContentHeight = pdfHeight - margin * 2;

            while (remaining > 0) {
                const sliceHeight = Math.min(remaining, pageContentHeight);
                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = canvas.width;
                sliceCanvas.height = Math.round((sliceHeight * canvas.width) / usableWidth);
                const ctx = sliceCanvas.getContext('2d')!;
                ctx.drawImage(
                    canvas,
                    0, Math.round(sourceY * canvas.width / usableWidth),
                    canvas.width, sliceCanvas.height,
                    0, 0,
                    canvas.width, sliceCanvas.height
                );
                const sliceData = sliceCanvas.toDataURL('image/png');
                pdf.addImage(sliceData, 'PNG', margin, posY, usableWidth, sliceHeight, undefined, 'FAST');

                remaining -= sliceHeight;
                sourceY += sliceHeight;
                if (remaining > 0) {
                    pdf.addPage();
                    posY = margin;
                }
            }

            setProgress(100);
            pdf.save(`${name.en || 'Scheme'}_Details.pdf`);
            onClose();
        } catch (err) {
            console.error(err);
            alert(t('schemes.pdf_error') || 'Failed to generate PDF. Please try again.');
        } finally {
            setGenerating(false);
            setProgress(0);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

                {/* Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText style={{ width: 20, height: 20, color: '#0284c7' }} />
                        <span style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>{t('schemes.title') || 'Government Scheme'} — PDF Preview</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {generating && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#0284c7' }}>
                                <div style={{ width: '120px', height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${progress}%`, background: '#0284c7', transition: 'width 0.3s' }} />
                                </div>
                                <span>{progress}%</span>
                            </div>
                        )}
                        <button
                            onClick={handleDownload}
                            disabled={generating}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: generating ? '#94a3b8' : '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: generating ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '14px' }}
                        >
                            {generating
                                ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                : <Download style={{ width: 16, height: 16 }} />}
                            {generating ? 'Generating...' : 'Download PDF'}
                        </button>
                        <button onClick={onClose} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', borderRadius: '50%' }}>
                            <X style={{ width: 20, height: 20 }} />
                        </button>
                    </div>
                </div>

                {/* Report content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#f1f5f9' }}>
                    <div
                        ref={reportRef}
                        style={{ background: 'white', margin: '0 auto', padding: '40px', width: '794px', minHeight: '1123px', fontFamily: 'Arial, sans-serif', color: '#1e293b', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
                    >
                        {/* Report Header */}
                        <div style={{ borderBottom: '2px solid #0284c7', paddingBottom: '20px', marginBottom: '32px', textAlign: 'center' }}>
                            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0369a1', margin: 0, marginBottom: '8px' }}>
                                {name.en}
                            </h1>
                            {name.mr && name.mr !== name.en && (
                                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0284c7', margin: 0 }}>
                                    {name.mr}
                                </h2>
                            )}
                            <div style={{ marginTop: '12px', display: 'inline-block', padding: '4px 12px', background: '#e0f2fe', color: '#0369a1', borderRadius: '999px', fontSize: '14px', fontWeight: 600 }}>
                                {scheme.category || 'Government Scheme'}
                            </div>
                        </div>

                        {/* Content Sections */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            
                            {/* Description */}
                            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                    Description / माहिती
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div>
                                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>English</h4>
                                        <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: 0 }}>{description.en}</p>
                                    </div>
                                    <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '24px' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>मराठी</h4>
                                        <p style={{ fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: 0 }}>{description.mr}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Eligibility */}
                            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                    Eligibility / पात्रता
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div>
                                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>English</h4>
                                        <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
                                            {eligibility.en.split('\\n').map((line: string, i: number) => <span key={i}>{line}<br/></span>)}
                                        </div>
                                    </div>
                                    <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '24px' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>मराठी</h4>
                                        <div style={{ fontSize: '15px', color: '#334155', lineHeight: '1.6' }}>
                                            {eligibility.mr.split('\\n').map((line: string, i: number) => <span key={i}>{line}<br/></span>)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Benefits */}
                            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', borderLeft: '4px solid #f59e0b' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                    Benefits / फायदे
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div>
                                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>English</h4>
                                        <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
                                            {benefits.en.split('\\n').map((line: string, i: number) => <span key={i}>{line}<br/></span>)}
                                        </div>
                                    </div>
                                    <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '24px' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>मराठी</h4>
                                        <div style={{ fontSize: '15px', color: '#334155', lineHeight: '1.6' }}>
                                            {benefits.mr.split('\\n').map((line: string, i: number) => <span key={i}>{line}<br/></span>)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Documents */}
                            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', borderLeft: '4px solid #8b5cf6' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                    Required Documents / आवश्यक कागदपत्रे
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div>
                                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>English</h4>
                                        <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
                                            {documents.en.split('\\n').map((line: string, i: number) => <span key={i}>{line}<br/></span>)}
                                        </div>
                                    </div>
                                    <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '24px' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>मराठी</h4>
                                        <div style={{ fontSize: '15px', color: '#334155', lineHeight: '1.6' }}>
                                            {documents.mr.split('\\n').map((line: string, i: number) => <span key={i}>{line}<br/></span>)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div style={{ marginTop: '60px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
                            Generated by Nagarsevak Management System • {new Date().toLocaleDateString('en-IN')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
