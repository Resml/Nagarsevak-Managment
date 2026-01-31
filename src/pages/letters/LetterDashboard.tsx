import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../services/supabaseClient';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, Printer, Send, Plus, Settings, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface LetterRequest {
    id: string;
    user_id: string;
    type: string;
    area?: string;
    details: any;
    status: 'Pending' | 'Approved' | 'Rejected';
    created_at: string;
}

const LetterDashboard = () => {
    const { t } = useLanguage();
    const [requests, setRequests] = useState<LetterRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<LetterRequest | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // New State for Advanced Filtering
    const [areaSearch, setAreaSearch] = useState('');
    const [showAreaDropdown, setShowAreaDropdown] = useState(false);
    const [dateSearch, setDateSearch] = useState('');
    const [showDateDropdown, setShowDateDropdown] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        const { data, error } = await supabase
            .from('letter_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setRequests(data);
        setLoading(false);
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

    const generatePDF = (req: LetterRequest, returnBlob: boolean = false) => {
        const doc = new jsPDF();

        // --- Letterhead Header (simple, official) ---
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Rajesh Sharma', 20, 20);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Nagar Sevak - Ward 12, Shivaji Nagar', 20, 28);
        doc.setDrawColor(180, 180, 180);
        doc.line(20, 34, 190, 34);

        // --- Content ---
        doc.setFontSize(12);
        doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 160, 50);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('TO WHOMSOEVER IT MAY CONCERN', 105, 70, { align: 'center', underline: true } as any);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');

        const bodyText = `
This is to certify that Mr./Ms. ${req.details?.name || 'Unknown'},
residing at ${req.details?.text || 'the address provided'}, is a resident of Ward 12
to the best of my knowledge.

This letter is issued upon their request for the purpose of ${req.type}.
I wish them all the best for their future endeavors.
        `;

        const splitText = doc.splitTextToSize(bodyText, 170);
        doc.text(splitText, 20, 90);

        // --- Signature ---
        doc.text('Regards,', 150, 200);
        doc.setFont('helvetica', 'bold');
        doc.text('Rajesh Sharma', 150, 210);
        doc.setFont('helvetica', 'normal');
        doc.text('(Nagar Sevak)', 150, 215);
        doc.setTextColor(90, 90, 90);
        doc.setFontSize(9);
        doc.text('Office: 123, Main Road, Shivaji Nagar | Contact: +91 98765 43210', 105, 285, { align: 'center' });

        if (returnBlob) {
            return doc.output('blob');
        } else {
            doc.save(`${req.type}_${req.details?.name}.pdf`);
        }
    };

    const updateStatus = async (id: string, status: string, request?: LetterRequest) => {
        let updateData: any = { status };

        if (status === 'Approved' && request) {
            try {
                const pdfBlob = generatePDF(request, true) as Blob;
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

        await supabase.from('letter_requests').update(updateData).eq('id', id);
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
                                Found: {filteredRequests.length}
                            </span>
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            to="/letters/types"
                            className="ns-btn-ghost border border-slate-200"
                        >
                            <Settings className="w-4 h-4" /> {t('letters.manage_types')}
                        </Link>
                        <Link
                            to="/letters/new"
                            className="ns-btn-primary"
                        >
                            <Plus className="w-4 h-4" /> {t('letters.new_request')}
                        </Link>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Main Search */}
                    <div className="md:col-span-6 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t('letters.search_placeholder')}
                            className="ns-input pl-10 py-3 bg-white shadow-sm w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Area Search */}
                    <div className="md:col-span-3 relative dropdown-container">
                        <input
                            type="text"
                            placeholder="Search Area..."
                            className="ns-input w-full bg-white shadow-sm"
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
                                        <span className="text-sm text-slate-700">{item.area}</span>
                                        <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{item.count}</span>
                                    </div>
                                ))}
                                {getAreaSuggestions().filter(s => s.area.toLowerCase().includes(areaSearch.toLowerCase())).length === 0 && (
                                    <div className="px-4 py-2 text-sm text-slate-500 italic">No areas found</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Date Search */}
                    <div className="md:col-span-3 relative dropdown-container">
                        <input
                            type="text"
                            placeholder="Filter by Date..."
                            className="ns-input w-full bg-white shadow-sm"
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
                    {loading ? <div className="p-4">{t('letters.loading')}</div> : filteredRequests.map(req => (
                        <div
                            key={req.id}
                            onClick={() => setSelectedRequest(req)}
                            className={`p-4 border-b border-slate-200/70 cursor-pointer hover:bg-slate-50 transition ${selectedRequest?.id === req.id ? 'bg-brand-50/60 border-l-4 border-l-brand-600' : ''}`}
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-slate-800">{req.type}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded ${req.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                    {req.status}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">{req.details?.name || req.user_id}</p>
                            {req.area && <p className="text-xs text-brand-600 mt-1">{req.area}</p>}
                            <p className="text-xs text-slate-500 mt-1">{format(new Date(req.created_at), 'PP p')}</p>
                        </div>
                    ))}
                    {filteredRequests.length === 0 && !loading && (
                        <div className="p-8 text-center flex flex-col items-center justify-center h-64">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-3">
                                <FileText className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-slate-500 mb-4">{t('letters.no_requests')}</p>
                            <Link
                                to="/letters/new"
                                className="ns-btn-primary"
                            >
                                <Plus className="w-4 h-4" /> {t('letters.new_request')}
                            </Link>
                        </div>
                    )}
                </div>

                {/* Preview */}
                <div className="ns-card md:col-span-2 p-6 min-h-[500px] flex flex-col">
                    {selectedRequest ? (
                        <>
                            <div className="flex justify-between items-start pb-4 border-b border-slate-200/70">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{selectedRequest.type}</h2>
                                    <p className="text-sm text-slate-500">{t('letters.request_from')}: {selectedRequest.user_id}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => generatePDF(selectedRequest)}
                                        className="ns-btn-primary"
                                    >
                                        <Printer className="w-4 h-4" /> {t('letters.generate_pdf')}
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 py-6 space-y-4">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">{t('letters.request_details')}</h4>
                                    <p className="text-slate-800"><span className="font-semibold">{t('letters.name')}:</span> {selectedRequest.details?.name}</p>
                                    <p className="text-slate-800 mt-2"><span className="font-semibold">{t('letters.address')}:</span></p>
                                    <p className="bg-white p-3 rounded-xl border border-slate-200 mt-1 text-sm text-slate-700">{selectedRequest.details?.text}</p>
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
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <FileText className="w-16 h-16 mb-4 opacity-20" />
                            <p>{t('letters.select_request')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LetterDashboard;
