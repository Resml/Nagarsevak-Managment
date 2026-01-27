import { useEffect, useState } from 'react';
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

    const filteredRequests = requests.filter(req => {
        if (!searchQuery) return true;
        const term = searchQuery.toLowerCase();
        return (
            req.user_id.toLowerCase().includes(term) ||
            req.type.toLowerCase().includes(term) ||
            (req.area && req.area.toLowerCase().includes(term)) ||
            (req.details?.name && req.details.name.toLowerCase().includes(term))
        );
    });

    const generatePDF = (req: LetterRequest, returnBlob: boolean = false) => {
        const doc = new jsPDF();

        // --- Letterhead Header (Visual Mock) ---
        doc.setFillColor(255, 140, 0); // Orange Header
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('Rajesh Sharma', 20, 20);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Nagar Sevak - Ward 12, Shivaji Nagar', 20, 30);

        // --- Content ---
        doc.setTextColor(0, 0, 0);
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

        // --- Footer ---
        doc.setFillColor(0, 100, 0); // Green Footer
        doc.rect(0, 280, 210, 17, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('Office: 123, Main Road, Shivaji Nagar | Contact: +91 98765 43210', 105, 290, { align: 'center' });

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
                alert('Failed to generate/upload PDF. Check console.');
                return;
            }
        }

        await supabase.from('letter_requests').update(updateData).eq('id', id);
        fetchRequests();
        setSelectedRequest(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-8 h-8 text-brand-600" /> {t('letters.title')}
                </h1>
                <div className="flex gap-2">
                    <Link
                        to="/letters/types"
                        className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition shadow-sm"
                    >
                        <Settings className="w-4 h-4" /> {t('letters.manage_types')}
                    </Link>
                    <Link
                        to="/letters/new"
                        className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> {t('letters.new_request')}
                    </Link>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder={t('letters.search_placeholder')}
                    className="w-full pl-10 pr-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* List */}
                <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden md:col-span-1 h-[calc(100vh-12rem)] overflow-y-auto">
                    {loading ? <div className="p-4">{t('letters.loading')}</div> : filteredRequests.map(req => (
                        <div
                            key={req.id}
                            onClick={() => setSelectedRequest(req)}
                            className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${selectedRequest?.id === req.id ? 'bg-brand-50 border-l-4 border-l-brand-600' : ''}`}
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-gray-800">{req.type}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded ${req.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                    {req.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{req.details?.name || req.user_id}</p>
                            {req.area && <p className="text-xs text-brand-600 mt-1">{req.area}</p>}
                            <p className="text-xs text-gray-400 mt-1">{format(new Date(req.created_at), 'PP p')}</p>
                        </div>
                    ))}
                    {filteredRequests.length === 0 && !loading && (
                        <div className="p-8 text-center text-gray-500">
                            {t('letters.no_requests')}
                        </div>
                    )}
                </div>

                {/* Preview */}
                <div className="bg-white rounded-xl shadow border border-gray-200 md:col-span-2 p-6 min-h-[500px] flex flex-col">
                    {selectedRequest ? (
                        <>
                            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{selectedRequest.type}</h2>
                                    <p className="text-sm text-gray-500">{t('letters.request_from')}: {selectedRequest.user_id}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => generatePDF(selectedRequest)}
                                        className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700"
                                    >
                                        <Printer className="w-4 h-4" /> {t('letters.generate_pdf')}
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 py-6 space-y-4">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">{t('letters.request_details')}</h4>
                                    <p className="text-gray-800"><span className="font-semibold">{t('letters.name')}:</span> {selectedRequest.details?.name}</p>
                                    <p className="text-gray-800 mt-2"><span className="font-semibold">{t('letters.address')}:</span></p>
                                    <p className="bg-white p-2 rounded border border-gray-200 mt-1 text-sm">{selectedRequest.details?.text}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                                {selectedRequest.status === 'Pending' && (
                                    <>
                                        <button
                                            onClick={() => updateStatus(selectedRequest.id, 'Rejected')}
                                            className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <XCircle className="w-4 h-4" /> {t('letters.reject')}
                                        </button>
                                        <button
                                            onClick={() => updateStatus(selectedRequest.id, 'Approved', selectedRequest)}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" /> {t('letters.approve')}
                                        </button>
                                    </>
                                )}
                                {selectedRequest.status !== 'Pending' && (
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        Request is {selectedRequest.status}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
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
