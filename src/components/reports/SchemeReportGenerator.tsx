import React, { useRef, useState } from 'react';
import { format } from 'date-fns';
import { Download, X, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useLanguage } from '../../context/LanguageContext';

interface SchemeApplication {
    id: number;
    applicant_name: string;
    scheme_name?: string;
    mobile: string;
    address: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    created_at: string;
    benefit?: string;
    rejection_reason?: string;
}

interface SchemeReportGeneratorProps {
    applications: SchemeApplication[];
    onClose: () => void;
}

export const SchemeReportGenerator: React.FC<SchemeReportGeneratorProps> = ({ applications, onClose }) => {
    const { t } = useLanguage();
    const reportRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const getStatusLabel = (status: string) => {
        if (status === 'Approved') return 'मंजूर';
        if (status === 'Rejected') return 'नाकारले';
        return 'प्रलंबित';
    };

    const getStatusBg = (status: string) => {
        if (status === 'Approved') return '#dcfce7';
        if (status === 'Rejected') return '#fee2e2';
        return '#fef9c3';
    };

    const getStatusColor = (status: string) => {
        if (status === 'Approved') return '#166534';
        if (status === 'Rejected') return '#991b1b';
        return '#854d0e';
    };

    const handleDownload = async () => {
        if (!reportRef.current) return;
        setGenerating(true);
        setProgress(0);
        try {
            // Wait for fonts/layout to settle
            await new Promise(resolve => setTimeout(resolve, 1000));

            const element = reportRef.current;
            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                onclone: (_doc, el) => {
                    // Make sure element is fully visible during capture
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
            pdf.save(`Scheme_Applications_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            onClose();
        } catch (err) {
            console.error('PDF error:', err);
            alert('PDF तयार करण्यात अयशस्वी. पुन्हा प्रयत्न करा.');
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
                        <span style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>सरकारी योजना — अर्ज अहवाल</span>
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
                            {generating ? 'तयार होत आहे...' : 'PDF डाउनलोड करा'}
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
                        <div style={{ borderBottom: '2px solid #0284c7', paddingBottom: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0369a1', margin: 0, marginBottom: '4px' }}>सरकारी योजना</h1>
                                <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>अर्ज नोंदणी अहवाल</p>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '12px', color: '#94a3b8' }}>
                                <p style={{ margin: 0 }}>दिनांक: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                                <p style={{ margin: 0 }}>एकूण अर्ज: {applications.length}</p>
                            </div>
                        </div>

                        {/* Table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    {['अ.क्र.', 'अर्जदाराचे नाव', 'मोबाईल / पत्ता', 'योजनेचे नाव', 'दिनांक', 'स्थिती', 'लाभ / नकाराचे कारण'].map((h, i) => (
                                        <th key={i} style={{ border: '1px solid #e2e8f0', padding: '8px 6px', textAlign: 'left', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app, index) => (
                                    <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9', background: index % 2 === 0 ? 'white' : '#fafafa' }}>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '6px', verticalAlign: 'top', color: '#94a3b8', width: '4%' }}>{index + 1}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '6px', verticalAlign: 'top', fontWeight: 700, width: '16%' }}>{app.applicant_name}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '6px', verticalAlign: 'top', width: '16%' }}>
                                            <div style={{ fontFamily: 'monospace' }}>{app.mobile || '-'}</div>
                                            <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px', wordBreak: 'break-word' }}>{app.address || '-'}</div>
                                        </td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '6px', verticalAlign: 'top', width: '22%' }}>{app.scheme_name || '-'}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '6px', verticalAlign: 'top', color: '#64748b', width: '10%', whiteSpace: 'nowrap' }}>
                                            {format(new Date(app.created_at), 'dd/MM/yyyy')}
                                        </td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '6px', verticalAlign: 'top', width: '10%' }}>
                                            <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: getStatusBg(app.status), color: getStatusColor(app.status) }}>
                                                {getStatusLabel(app.status)}
                                            </span>
                                        </td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '6px', verticalAlign: 'top', width: '22%', wordBreak: 'break-word' }}>
                                            {app.status === 'Rejected'
                                                ? <span style={{ color: '#dc2626' }}>{app.rejection_reason || '-'}</span>
                                                : <span>{app.benefit || '-'}</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ marginTop: '60px', paddingTop: '24px', borderTop: '1px solid #f1f5f9', textAlign: 'center', color: '#94a3b8', fontSize: '10px', fontStyle: 'italic' }}>
                            Generated by Nagarsevak Management System
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
