
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../services/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, Printer, Send, Plus, Settings, Search, Upload, ExternalLink, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import IncomingLetterUpload from './IncomingLetterUpload';

interface LetterRequest {
    id: string;
    user_id: string;
    type: string;
    area?: string;
    details: any;
    status: 'Pending' | 'Approved' | 'Rejected';
    created_at: string;
}

interface IncomingLetter {
    id: string;
    title: string;
    description?: string;
    scanned_file_url: string;
    file_type: string;
    area?: string;
    received_date: string;
    created_at: string;
}

import { translateText } from '../../services/translationService';
import { TranslatedText } from '../../components/TranslatedText';

// ... (other imports)

const LetterDashboard = () => {
    const { t, language } = useLanguage(); // Get language
    const { tenantId, tenant } = useTenant();
    const navigate = useNavigate();
    const [requests, setRequests] = useState<LetterRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<LetterRequest | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Tab State
    const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming'>('outgoing');

    // Incoming Letters State
    const [incomingLetters, setIncomingLetters] = useState<IncomingLetter[]>([]);
    const [selectedIncoming, setSelectedIncoming] = useState<IncomingLetter | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // New State for Advanced Filtering
    const [areaSearch, setAreaSearch] = useState('');
    const [showAreaDropdown, setShowAreaDropdown] = useState(false);
    const [dateSearch, setDateSearch] = useState('');
    const [showDateDropdown, setShowDateDropdown] = useState(false);

    // Delete Modal State
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'outgoing' | 'incoming'; name: string } | null>(null);

    // Edit State for Incoming
    const [editingIncoming, setEditingIncoming] = useState<IncomingLetter | null>(null);

    // Preview State
    const [previewContent, setPreviewContent] = useState<string>('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewLang, setPreviewLang] = useState<'mr' | 'en'>('mr');

    useEffect(() => {
        fetchRequests();
        fetchIncomingLetters();

        // Real-time Subscriptions
        const subscription = supabase
            .channel('letter-dashboard-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'letter_requests', filter: `tenant_id=eq.${tenantId}` }, () => {
                fetchRequests();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'incoming_letters', filter: `tenant_id=eq.${tenantId}` }, () => {
                fetchIncomingLetters();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [tenantId]);

    // Fetch template and generate preview when selected request changes
    useEffect(() => {
        if (selectedRequest && activeTab === 'outgoing') {
            const loadPreview = async () => {
                setPreviewLoading(true);
                try {
                    const { data } = await supabase
                        .from('letter_types')
                        .select('template_content')
                        .eq('name', selectedRequest.type)
                        .single();

                    let template = data?.template_content || `This is to certify that Mr./Ms. {{name}},\nresiding at {{address}}, is a resident of Ward 12\nto the best of my knowledge.\n\nThis letter is issued upon their request for the purpose of {{purpose}}.\nI wish them all the best for their future endeavors.`;

                    // Translate dynamic details for preview based on template language
                    const isMarathiTemplate = /[अ-ज्ञ]/.test(template);
                    let previewDetails = { ...selectedRequest.details };
                    const targetLang = isMarathiTemplate ? 'mr' : 'en';

                    // Explicitly iterate and translate all string values
                    for (const key of Object.keys(previewDetails)) {
                        const val = previewDetails[key];
                        if (typeof val === 'string' && val.trim() !== '') {
                            if (targetLang === 'mr' && /[a-zA-Z]/.test(val)) {
                                console.log(`Translating ${key} to mr:`, val);
                                previewDetails[key] = await translateText(val, 'mr');
                            } else if (targetLang === 'en' && /[\u0900-\u097F]/.test(val)) {
                                console.log(`Translating ${key} to en:`, val);
                                previewDetails[key] = await translateText(val, 'en');
                            }
                        }
                    }

                    // Hydrate template
                    let filledContent = template
                        .replace(/{{name}}/g, previewDetails?.name || 'Unknown')
                        .replace(/{{address}}/g, previewDetails?.text || 'the address provided')
                        .replace(/{{purpose}}/g, isMarathiTemplate ? await translateText(selectedRequest.type, 'mr') : selectedRequest.type)
                        .replace(/{{date}}/g, format(new Date(), 'dd/MM/yyyy'));

                    if (previewDetails) {
                        Object.keys(previewDetails).forEach(key => {
                            if (!['name', 'text', 'purpose', 'subject', 'mobile'].includes(key)) {
                                const regex = new RegExp(`{{${key}}}`, 'g');
                                filledContent = filledContent.replace(regex, previewDetails[key] || '');
                            }
                        });
                    }

                    // Translate entire content if requested preview language is different from template language
                    if (previewLang === 'en' && isMarathiTemplate && /[अ-ज्ञ]/.test(filledContent)) {
                        toast.loading('Translating preview...', { id: 'preview-translation' });
                        try {
                            filledContent = await translateText(filledContent, 'en', 'mr');
                        } catch (e) {
                            console.error("Preview translation failed", e);
                        } finally {
                            toast.dismiss('preview-translation');
                        }
                    } else if (previewLang === 'mr' && !isMarathiTemplate && /[a-zA-Z]/.test(filledContent)) {
                        toast.loading('Translating preview...', { id: 'preview-translation' });
                        try {
                            filledContent = await translateText(filledContent, 'mr', 'en');
                        } catch (e) {
                            console.error("Preview translation failed", e);
                        } finally {
                            toast.dismiss('preview-translation');
                        }
                    }

                    setPreviewContent(filledContent);
                } catch (err) {
                    console.error("Error loading preview:", err);
                    setPreviewContent("Failed to load preview.");
                } finally {
                    setPreviewLoading(false);
                }
            };
            loadPreview();
        } else {
            setPreviewContent('');
        }
    }, [selectedRequest, activeTab, previewLang]);

    const fetchRequests = async () => {
        const { data, error } = await supabase
            .from('letter_requests')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (data) setRequests(data);
        setLoading(false);
    };

    const fetchIncomingLetters = async () => {
        const { data, error } = await supabase
            .from('incoming_letters')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (data) setIncomingLetters(data);
    };

    // Helper: Get Unique Areas with Counts
    const getAreaSuggestions = () => {
        const stats: Record<string, number> = {};
        requests.forEach(r => {
            if (r.area) {
                stats[r.area] = (stats[r.area] || 0) + 1;
            }
        });
        return Object.entries(stats).map(([area, count]) => ({ area, count }));
    };

    // Helper: Get Unique Dates with Counts
    const getDateSuggestions = () => {
        const stats: Record<string, number> = {};
        requests.forEach(r => {
            if (r.created_at) {
                const dateStr = format(new Date(r.created_at), 'MMM d, yyyy');
                stats[dateStr] = (stats[dateStr] || 0) + 1;
            }
        });
        return Object.entries(stats).map(([date, count]) => ({ date, count }));
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch = !searchQuery || (() => {
            const term = searchQuery.toLowerCase();
            return (
                req.user_id.toLowerCase().includes(term) ||
                req.type.toLowerCase().includes(term) ||
                (req.area && req.area.toLowerCase().includes(term)) ||
                (req.details?.name && req.details.name.toLowerCase().includes(term))
            );
        })();

        const matchesArea = !areaSearch || (req.area && req.area.toLowerCase().includes(areaSearch.toLowerCase()));
        const matchesDate = !dateSearch || (req.created_at && format(new Date(req.created_at), 'MMM d, yyyy').toLowerCase().includes(dateSearch.toLowerCase()));

        return matchesSearch && matchesArea && matchesDate;
    });

    const generatePDF = async (req: LetterRequest, returnBlob: boolean = false, targetLang: 'mr' | 'en' = 'mr') => {
        const doc = new jsPDF();

        // 1. Fetch Letter Type Details to get the template
        let templateContent = '';
        try {
            const { data, error } = await supabase
                .from('letter_types')
                .select('template_content')
                .eq('name', req.type)
                .single();

            if (data?.template_content) {
                templateContent = data.template_content;
            }
        } catch (err) {
            console.error("Error fetching template", err);
        }

        // Fallback Template if DB fetch fails or is empty
        if (!templateContent) {
            templateContent = `This is to certify that Mr./Ms. {{name}},\nresiding at {{address}}, is a resident of Ward 12\nto the best of my knowledge.\n\nThis letter is issued upon their request for the purpose of {{purpose}}.\nI wish them all the best for their future endeavors.`;
        }

        // Translate dynamic details based on targetLang
        let translatedDetails = { ...req.details };
        toast.loading('Preparing document...', { id: 'pdf-prep' });
        try {
            for (const key of Object.keys(translatedDetails)) {
                const val = translatedDetails[key];
                if (typeof val === 'string' && val.trim() !== '') {
                    // Always try to translate names and text if the target language is different from the likely source
                    if (targetLang === 'mr' && /[a-zA-Z]/.test(val)) {
                        console.log(`PDF Translating ${key} to mr:`, val);
                        translatedDetails[key] = await translateText(val, 'mr');
                    } else if (targetLang === 'en' && /[\u0900-\u097F]/.test(val)) {
                        console.log(`PDF Translating ${key} to en:`, val);
                        translatedDetails[key] = await translateText(val, 'en');
                    }
                }
            }
        } catch (e) {
            console.error("Variable translation failed", e);
        } finally {
            toast.dismiss('pdf-prep');
        }

        // 2. Hydrate Template with Request Data
        let filledContent = templateContent
            .replace(/{{name}}/g, translatedDetails?.name || 'Unknown')
            .replace(/{{address}}/g, translatedDetails?.text || 'the address provided')
            .replace(/{{purpose}}/g, targetLang === 'mr' ? await translateText(req.type, 'mr') : req.type)
            .replace(/{{date}}/g, format(new Date(), 'dd/MM/yyyy'));

        // Dynamically replace any other custom placeholders that exist in translatedDetails
        if (translatedDetails) {
            Object.keys(translatedDetails).forEach(key => {
                if (!['name', 'text', 'purpose', 'subject', 'mobile'].includes(key)) {
                    const regex = new RegExp(`{{${key}}}`, 'g');
                    filledContent = filledContent.replace(regex, translatedDetails[key] || '');
                }
            });
        }

        // Translate content if target language is English and content contains Marathi
        let isMarathi = targetLang === 'mr' && /[अ-ज्ञ]/.test(filledContent);

        if (targetLang === 'en' && /[अ-ज्ञ]/.test(filledContent)) {
            toast.loading('Translating PDF to English...', { id: 'pdf-translate' });
            try {
                // translateName checks first name etc, but we want full translation here 
                // Using existing translateText directly on the filled content
                filledContent = await translateText(filledContent, 'en', 'mr');
            } catch (e) {
                console.error("Translation failed", e);
            } finally {
                toast.dismiss('pdf-translate');
            }
            isMarathi = false; // Force English labels
        }

        // Translations for dynamic parts
        const dateLabel = isMarathi ? 'दिनांक:' : 'Date:';
        const regardsLabel = isMarathi ? 'आपला नम्र,' : 'Regards,';
        const nagarSevakLabel = isMarathi ? '(नगरसेवक)' : '(Nagar Sevak)';

        // Only add title if it's explicitly needed or if it's an English letter that usually has it. 
        // For Marathi, they usually put subject (विषय). We'll assume the template handles the subject.
        const titleHtml = isMarathi ? '' : `
            <h2 style="text-align: center; text-decoration: underline; font-size: 20px; font-weight: bold; margin-bottom: 40px;">
                TO WHOMSOEVER IT MAY CONCERN
            </h2>
        `;

        // Generate PDF using html2canvas to fully support Devanagari/Complex text layout
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        container.style.width = '794px';
        container.style.padding = '40px 60px'; // Top/bottom 40px, left/right 60px
        container.style.background = 'white';
        container.style.color = 'black';
        container.style.fontFamily = 'Arial, sans-serif';
        container.style.boxSizing = 'border-box';

        const config = tenant?.config || {};
        const nagarsevakName = isMarathi
            ? (config.nagarsevak_name_marathi || config.nagarsevak_name_english || 'Rajesh Sharma')
            : (config.nagarsevak_name_english || config.nagarsevak_name_marathi || 'Rajesh Sharma');

        const wardName = config.ward_name || '';
        const officeAddress = config.office_address || '';
        const phoneNumber = config.phone_number || '';

        const subtitleText = isMarathi
            ? `नगरसेवक${wardName ? ` - ${wardName}` : ''}`
            : `Nagar Sevak${wardName ? ` - ${wardName}` : ''}`;

        const footerText = isMarathi
            ? `कार्यालय: ${officeAddress} | संपर्क: ${phoneNumber}`
            : `Office: ${officeAddress} | Contact: ${phoneNumber}`;

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: bold;">${nagarsevakName}</h1>
                <p style="margin: 0; font-size: 14px; color: #333;">${subtitleText}</p>
            </div>
            <hr style="border: 1px solid #ccc; margin-bottom: 30px;" />
            
            <div style="text-align: right; margin-bottom: 30px; font-size: 14px; font-weight: bold;">
                ${dateLabel} ${format(new Date(), 'dd/MM/yyyy')}
            </div>
            
            ${titleHtml}
            
            <div style="font-size: 16px; line-height: 1.6; white-space: pre-wrap; margin-bottom: 60px; font-family: sans-serif;">${filledContent.replace(/\\n/g, '<br/>')}</div>
            
            <div style="text-align: right; margin-top: 50px;">
                <p style="margin: 0; margin-bottom: 10px;">${regardsLabel}</p>
                <div style="height: 40px;"></div>
                <p style="margin: 0; font-weight: bold;">${nagarsevakName}</p>
                <p style="margin: 0;">${nagarSevakLabel}</p>
            </div>
            
            <div style="text-align: center; margin-top: 80px; font-size: 12px; color: #555;">
                ${footerText}
            </div>
        `;

        document.body.appendChild(container);

        try {
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            if (returnBlob) {
                return doc.output('blob');
            } else {
                doc.save(`${req.type}_${req.details?.name || 'citizen'}.pdf`);
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF. Please try again.');
        } finally {
            if (document.body.contains(container)) {
                document.body.removeChild(container);
            }
        }
    };

    const updateStatus = async (id: string, status: string, request?: LetterRequest) => {
        let updateData: any = { status };

        if (status === 'Approved' && request) {
            try {
                // Ensure generatePDF is awaited and cast strictly if needed
                const pdfBlob = await generatePDF(request, true) as Blob;

                // Validate if pdfBlob is actually a Blob (safety check)
                if (!(pdfBlob instanceof Blob)) {
                    throw new Error('PDF generation failed to return a valid blob');
                }

                const fileName = `letters/${id}_${Date.now()}.pdf`;

                const { data, error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(fileName, pdfBlob, {
                        contentType: 'application/pdf'
                    });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('documents')
                    .getPublicUrl(fileName);

                updateData.pdf_url = publicUrl;
                console.log('PDF Uploaded:', publicUrl);
            } catch (err) {
                console.error('Failed to upload PDF:', err);
                toast.error('Failed to generate/upload PDF. Check console.');
                return;
            }
        }

        await supabase.from('letter_requests').update(updateData).eq('id', id).eq('tenant_id', tenantId); // Secured
        fetchRequests();
        setSelectedRequest(null);
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!(event.target as Element).closest('.dropdown-container')) {
                setShowAreaDropdown(false);
                setShowDateDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="w-7 h-7 text-brand-700" /> {t('letters.title')}
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                                {t('letters.found')}: {activeTab === 'outgoing' ? filteredRequests.length : incomingLetters.length}
                            </span>
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        {activeTab === 'outgoing' ? (
                            <>
                                <Link
                                    to="/dashboard/letters/types"
                                    className="ns-btn-ghost border border-slate-200"
                                >
                                    <Settings className="w-4 h-4" /> {t('letters.manage_types')}
                                </Link>
                                <Link
                                    to="/dashboard/letters/new"
                                    className="ns-btn-primary"
                                >
                                    <Plus className="w-4 h-4" /> {t('letters.new_request')}
                                </Link>
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    setEditingIncoming(null);
                                    setShowUploadModal(true);
                                }}
                                className="ns-btn-primary"
                            >
                                <Upload className="w-4 h-4" /> {t('letters.upload_incoming')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 border-b border-slate-200">
                    <button
                        onClick={() => {
                            setActiveTab('outgoing');
                            setSelectedRequest(null);
                            setSelectedIncoming(null);
                        }}
                        className={`px-6 py-3 font-semibold transition border-b-2 ${activeTab === 'outgoing'
                            ? 'border-brand-600 text-brand-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {t('letters.outgoing')} ({requests.length})
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('incoming');
                            setSelectedRequest(null);
                            setSelectedIncoming(null);
                        }}
                        className={`px-6 py-3 font-semibold transition border-b-2 ${activeTab === 'incoming'
                            ? 'border-brand-600 text-brand-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {t('letters.incoming')} ({incomingLetters.length})
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Main Search */}
                    <div className="md:col-span-6 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t('letters.search_placeholder')}
                            className="ns-input pl-10 py-3 bg-white shadow-sm w-full notranslate"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Area Search */}
                    <div className="md:col-span-3 relative dropdown-container">
                        <input
                            type="text"
                            placeholder={t('letters.search_area_placeholder')}
                            className="ns-input w-full bg-white shadow-sm notranslate"
                            value={areaSearch}
                            onFocus={() => { setShowAreaDropdown(true); setShowDateDropdown(false); }}
                            onChange={(e) => setAreaSearch(e.target.value)}
                        />
                        {showAreaDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {getAreaSuggestions().filter(s => s.area.toLowerCase().includes(areaSearch.toLowerCase())).map((item) => (
                                    <div
                                        key={item.area}
                                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                                        onClick={() => {
                                            setAreaSearch(item.area);
                                            setShowAreaDropdown(false);
                                        }}
                                    >
                                        <span className="text-sm text-slate-700">
                                            {item.area}
                                        </span>
                                        <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{item.count}</span>
                                    </div>
                                ))}
                                {getAreaSuggestions().filter(s => s.area.toLowerCase().includes(areaSearch.toLowerCase())).length === 0 && (
                                    <div className="px-4 py-2 text-sm text-slate-500 italic">{t('letters.no_areas_found')}</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Date Search */}
                    <div className="md:col-span-3 relative dropdown-container">
                        <input
                            type="text"
                            placeholder={t('letters.filter_date_placeholder')}
                            className="ns-input w-full bg-white shadow-sm notranslate"
                            value={dateSearch}
                            onFocus={() => { setShowDateDropdown(true); setShowAreaDropdown(false); }}
                            onChange={(e) => setDateSearch(e.target.value)}
                        />
                        {showDateDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {getDateSuggestions().filter(d => d.date.toLowerCase().includes(dateSearch.toLowerCase())).map((item) => (
                                    <div
                                        key={item.date}
                                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                                        onClick={() => {
                                            setDateSearch(item.date);
                                            setShowDateDropdown(false);
                                        }}
                                    >
                                        <span className="text-sm text-slate-700">{item.date}</span>
                                        <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* List */}
                <div className="ns-card overflow-hidden md:col-span-1 h-[calc(100vh-12rem)] overflow-y-auto">
                    {activeTab === 'outgoing' ? (
                        <>
                            {loading ? (
                                <div className="space-y-2 p-4">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="p-4 border-b border-slate-200/70">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
                                                <div className="h-5 w-16 bg-slate-200 rounded-full animate-pulse" />
                                            </div>
                                            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-2" />
                                            <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                            ) : filteredRequests.map(req => (
                                <div
                                    key={req.id}
                                    onClick={() => setSelectedRequest(req)}
                                    className={`p-4 border-b border-slate-200/70 cursor-pointer hover:bg-slate-50 transition group ${selectedRequest?.id === req.id ? 'bg-brand-50/60 border-l-4 border-l-brand-600' : ''}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-800">
                                            {req.type}
                                        </h3>
                                        <span className={`text-xs px-2 py-0.5 rounded ${req.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1">
                                        {req.details?.name || req.user_id}
                                    </p>
                                    {req.details?.subject && (
                                        <p className="text-sm text-slate-500 font-medium line-clamp-1 mt-0.5">
                                            {req.details.subject}
                                        </p>
                                    )}
                                    {req.area && (
                                        <p className="text-xs text-brand-600 mt-1">
                                            {req.area}
                                        </p>
                                    )}
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-xs text-slate-500">{format(new Date(req.created_at), 'PP p')}</p>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => navigate(`/dashboard/letters/edit/${req.id}`)}
                                                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
                                                title={t('common.edit')}
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget({ id: req.id, type: 'outgoing', name: req.details?.name || 'Request' })}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                title={t('common.delete')}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredRequests.length === 0 && !loading && (
                                <div className="p-8 text-center flex flex-col items-center justify-center h-64">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-3">
                                        <FileText className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 mb-4">{t('letters.no_requests')}</p>
                                    <Link
                                        to="/dashboard/letters/new"
                                        className="ns-btn-primary"
                                    >
                                        <Plus className="w-4 h-4" /> {t('letters.new_request')}
                                    </Link>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {incomingLetters.map(letter => (
                                <div
                                    key={letter.id}
                                    onClick={() => setSelectedIncoming(letter)}
                                    className={`p-4 border-b border-slate-200/70 cursor-pointer hover:bg-slate-50 transition group ${selectedIncoming?.id === letter.id ? 'bg-brand-50/60 border-l-4 border-l-brand-600' : ''}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-800">
                                            {letter.title}
                                        </h3>
                                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                            {letter.file_type.includes('pdf') ? 'PDF' : 'Image'}
                                        </span>
                                    </div>
                                    {letter.description && (
                                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                            {letter.description}
                                        </p>
                                    )}
                                    {letter.area && (
                                        <p className="text-xs text-brand-600 mt-1">
                                            {letter.area}
                                        </p>
                                    )}
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-xs text-slate-500">{format(new Date(letter.received_date), 'PP')}</p>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => {
                                                    setEditingIncoming(letter);
                                                    setShowUploadModal(true);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
                                                title={t('common.edit')}
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget({ id: letter.id, type: 'incoming', name: letter.title })}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                title={t('common.delete')}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {incomingLetters.length === 0 && (
                                <div className="p-8 text-center flex flex-col items-center justify-center h-64">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-3">
                                        <Upload className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 mb-4">No incoming letters uploaded yet</p>
                                    <button
                                        onClick={() => {
                                            setEditingIncoming(null);
                                            setShowUploadModal(true);
                                        }}
                                        className="ns-btn-primary"
                                    >
                                        <Upload className="w-4 h-4" /> {t('letters.upload_incoming')}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Preview */}
                <div className="ns-card md:col-span-2 p-6 min-h-[500px] flex flex-col">
                    {activeTab === 'outgoing' && selectedRequest ? (
                        <>
                            <div className="flex justify-between items-start pb-4 border-b border-slate-200/70">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        <TranslatedText text={selectedRequest.type} />
                                    </h2>
                                    <p className="text-sm text-slate-500">{t('letters.request_from')}: {selectedRequest.user_id}</p>
                                </div>
                            </div>

                            <div className="flex-1 py-6 space-y-4">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-4">
                                            <h4 className="text-xs font-bold uppercase text-slate-500">Letter Preview</h4>

                                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                                <button
                                                    onClick={() => setPreviewLang('mr')}
                                                    className={`px-3 py-1 text-xs font-medium rounded-md transition ${previewLang === 'mr' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    Marathi
                                                </button>
                                                <button
                                                    onClick={() => setPreviewLang('en')}
                                                    className={`px-3 py-1 text-xs font-medium rounded-md transition ${previewLang === 'en' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    English
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => generatePDF(selectedRequest, false, 'mr')}
                                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-1.5"
                                            >
                                                <Printer className="w-3.5 h-3.5" /> PDF (Marathi)
                                            </button>
                                            <button
                                                onClick={() => generatePDF(selectedRequest, false, 'en')}
                                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1.5"
                                            >
                                                <Printer className="w-3.5 h-3.5" /> PDF (English)
                                            </button>
                                        </div>
                                    </div>

                                    {previewLoading ? (
                                        <div className="animate-pulse space-y-2 p-6 bg-white rounded-lg border border-slate-200">
                                            <div className="h-4 bg-slate-200 rounded w-full"></div>
                                            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                                            <div className="h-4 bg-slate-200 rounded w-4/6"></div>
                                        </div>
                                    ) : (
                                        <div className="bg-white p-6 rounded-lg border border-slate-200 text-slate-800 whitespace-pre-wrap font-serif text-sm leading-relaxed max-h-[400px] overflow-y-auto shadow-inner">
                                            {previewContent}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 opacity-70">
                                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">{t('letters.request_details')}</h4>
                                    <div className="text-sm grid grid-cols-2 gap-2">
                                        <p className="text-slate-800"><span className="font-semibold">{t('letters.name')}:</span> <TranslatedText text={selectedRequest.details?.name || ''} /></p>
                                        {selectedRequest.details?.subject && (
                                            <p className="text-slate-800"><span className="font-semibold">{t('letters.subject')}:</span> <TranslatedText text={selectedRequest.details.subject} /></p>
                                        )}
                                        <p className="text-slate-800 col-span-2"><span className="font-semibold">{t('letters.address')}:</span> <TranslatedText text={selectedRequest.details?.text || ''} /></p>
                                        {(selectedRequest.details?.purpose || selectedRequest.details?.reason) && (
                                            <p className="text-slate-800 col-span-2"><span className="font-semibold">{t('office.purpose')}:</span> <TranslatedText text={selectedRequest.details?.purpose || selectedRequest.details?.reason || ''} /></p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200/70 flex justify-end gap-3">
                                {selectedRequest.status === 'Pending' && (
                                    <>
                                        <button
                                            onClick={() => updateStatus(selectedRequest.id, 'Rejected')}
                                            className="ns-btn-ghost border border-red-200 text-red-700"
                                        >
                                            <XCircle className="w-4 h-4" /> {t('letters.reject')}
                                        </button>
                                        <button
                                            onClick={() => updateStatus(selectedRequest.id, 'Approved', selectedRequest)}
                                            className="ns-btn-primary bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle className="w-4 h-4" /> {t('letters.approve')}
                                        </button>
                                    </>
                                )}
                                {selectedRequest.status !== 'Pending' && (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        Request is {selectedRequest.status}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : activeTab === 'incoming' && selectedIncoming ? (
                        <>
                            <div className="flex justify-between items-start pb-4 border-b border-slate-200/70">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        <TranslatedText text={selectedIncoming.title} />
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        {t('letters.received_date')}: {format(new Date(selectedIncoming.received_date), 'PPP')}
                                    </p>
                                </div>
                                <a
                                    href={selectedIncoming.scanned_file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ns-btn-primary"
                                >
                                    <ExternalLink className="w-4 h-4" /> {t('letters.view_document')}
                                </a>
                            </div>

                            <div className="flex-1 py-6 space-y-4">
                                {selectedIncoming.description && (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                                        <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">{t('letters.description')}</h4>
                                        <p className="text-slate-700"><TranslatedText text={selectedIncoming.description} /></p>
                                    </div>
                                )}

                                {selectedIncoming.area && (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                                        <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">{t('letters.area')}</h4>
                                        <p className="text-slate-700"><TranslatedText text={selectedIncoming.area} /></p>
                                    </div>
                                )}

                                {/* Document Preview */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Document Preview</h4>
                                    {selectedIncoming.file_type.includes('image') ? (
                                        <img
                                            src={selectedIncoming.scanned_file_url}
                                            alt={selectedIncoming.title}
                                            className="w-full rounded-lg border border-slate-200"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center bg-white p-8 rounded-lg border border-slate-200">
                                            <div className="text-center">
                                                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                                                <p className="text-slate-600 font-semibold">PDF Document</p>
                                                <p className="text-sm text-slate-500 mt-1">Click "View Document" to open</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <FileText className="w-16 h-16 mb-4 opacity-20" />
                            <p>{activeTab === 'outgoing' ? t('letters.select_request') : 'Select an incoming letter'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {
                showUploadModal && (
                    <IncomingLetterUpload
                        initialData={editingIncoming}
                        onClose={() => {
                            setShowUploadModal(false);
                            setEditingIncoming(null);
                        }}
                        onSuccess={() => {
                            fetchIncomingLetters();
                            setShowUploadModal(false);
                            setEditingIncoming(null);
                        }}
                    />
                )
            }

            {/* Delete Confirmation Modal */}
            {
                deleteTarget && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden p-6 space-y-4 shadow-xl animate-in fade-in zoom-in duration-200">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{t('letters.delete_confirm_title') || 'Are you sure?'}</h3>
                                <p className="text-slate-500 mt-2 text-sm">
                                    {t('letters.delete_confirm_msg') || 'This action cannot be undone. This will permanently delete'} <strong>{deleteTarget.name}</strong>.
                                </p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={async () => {
                                        /* Handle Delete */
                                        const { id, type } = deleteTarget;
                                        const isIncoming = type === 'incoming';
                                        const table = isIncoming ? 'incoming_letters' : 'letter_requests';

                                        try {
                                            const { error } = await supabase.from(table).delete().eq('id', id);
                                            if (error) throw error;

                                            toast.success(`${isIncoming ? 'Incoming letter' : 'Request'} deleted successfully`);
                                            if (isIncoming) {
                                                fetchIncomingLetters();
                                                setSelectedIncoming(null);
                                            } else {
                                                fetchRequests();
                                                setSelectedRequest(null);
                                            }
                                        } catch (err) {
                                            console.error(err);
                                            toast.error('Failed to delete item');
                                        } finally {
                                            setDeleteTarget(null);
                                        }
                                    }}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm"
                                >
                                    {t('common.delete')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default LetterDashboard;
