import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { Users, Clock, Save, Phone, Search, UserCircle } from 'lucide-react';
import { format } from 'date-fns';
import { translateText } from '../../services/aiTranslation';

interface Visitor {
    id: string;
    name: string;
    mobile: string;
    purpose: string;
    remarks: string;
    reference: string;
    visit_date: string;
    status: string;
}

const VisitorLog = () => {
    const { t, language } = useLanguage();
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        purpose: 'Complaint', // Default
        reference: '',
        remarks: ''
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Translation State
    const [translatedData, setTranslatedData] = useState<Record<string, { remarks: string, purpose: string }>>({});

    useEffect(() => {
        fetchVisitors();
    }, []);

    // Auto-Translate Effect
    useEffect(() => {
        if (language === 'en' || loading || visitors.length === 0) return;

        const translateVisibleItems = async () => {
            // Only translate items that have remarks or custom purpose, and haven't been translated yet
            const itemsToTranslate = visitors.filter(v =>
                (v.remarks || v.purpose) && !translatedData[v.id]
            );

            if (itemsToTranslate.length === 0) return;

            const BATCH_SIZE = 5;
            for (let i = 0; i < itemsToTranslate.length; i += BATCH_SIZE) {
                const batch = itemsToTranslate.slice(i, i + BATCH_SIZE);

                await Promise.all(batch.map(async (item) => {
                    try {
                        const [transRemarks, transPurpose] = await Promise.all([
                            item.remarks ? translateText(item.remarks, language as 'mr' | 'hi') : item.remarks,
                            item.purpose ? translateText(item.purpose, language as 'mr' | 'hi') : item.purpose
                        ]);

                        setTranslatedData(prev => ({
                            ...prev,
                            [item.id]: { remarks: transRemarks, purpose: transPurpose }
                        }));
                    } catch (err) {
                        console.error(`Failed to translate item ${item.id}`, err);
                    }
                }));
            }
        };

        translateVisibleItems();
    }, [language, visitors, loading]);

    const fetchVisitors = async () => {
        // Fetch today's visitors or last 50
        const { data, error } = await supabase
            .from('visitors')
            .select('*')
            .order('visit_date', { ascending: false })
            .limit(50);

        if (data) setVisitors(data);
        setLoading(false);
    };

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('visitors')
                .insert([{
                    name: formData.name,
                    mobile: formData.mobile,
                    purpose: formData.purpose,
                    reference: formData.reference,
                    remarks: formData.remarks,
                    visit_date: new Date().toISOString()
                }]);

            if (error) throw error;

            setFormData({ name: '', mobile: '', purpose: 'Complaint', reference: '', remarks: '' });
            fetchVisitors();
            alert('Visitor Checked In ✅');
        } catch (err) {
            console.error(err);
            alert('Error logging visitor');
        }
    };

    const filteredVisitors = visitors.filter(v =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.mobile.includes(searchQuery)
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-8 h-8 text-brand-600" /> {t('office.visitor_log')}
            </h1>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Check-in Form */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-500" /> {t('office.new_visitor_title')}
                        </h2>
                        <form onSubmit={handleCheckIn} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('office.full_name')}</label>
                                <input
                                    type="text" required
                                    className="w-full border rounded-lg p-2 mt-1"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={t('office.full_name')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('office.mobile')}</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg p-2 mt-1"
                                    value={formData.mobile}
                                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                    placeholder={t('office.mobile')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('office.purpose')}</label>
                                <select
                                    className="w-full border rounded-lg p-2 mt-1"
                                    value={formData.purpose}
                                    onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                                >
                                    <option value="Complaint">Complaint</option>
                                    <option value="Meeting">Meeting with Saheb</option>
                                    <option value="Greeting">Greeting / Invitation</option>
                                    <option value="Donation">Donation / Help</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('nav.my_team')}</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg p-2 mt-1"
                                    value={formData.reference}
                                    onChange={e => setFormData({ ...formData, reference: e.target.value })}
                                    placeholder="e.g. Sent by Corporator, Staff Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('office.notes')}</label>
                                <textarea
                                    className="w-full border rounded-lg p-2 mt-1 h-20"
                                    value={formData.remarks}
                                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                                    placeholder={t('office.notes_placeholder')}
                                />
                            </div>
                            <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-lg font-medium hover:bg-brand-700 flex justify-center items-center gap-2">
                                <Save className="w-4 h-4" /> {t('office.log_visit')}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Log List */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="font-bold text-gray-700">Recent Visitors</h3>
                                <span className="text-sm text-gray-500">{format(new Date(), 'PP')}</span>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={t('office.search_placeholder')}
                                    className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {loading ? <div className="p-8 text-center">{t('common.loading')}</div> : filteredVisitors.map(v => (
                                <div key={v.id} className="p-4 hover:bg-gray-50 transition flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-gray-900">{v.name}</h4>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                            <span className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded text-xs uppercase font-semibold">
                                                {translatedData[v.id]?.purpose || v.purpose}
                                            </span>
                                            {v.mobile && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {v.mobile}</span>}
                                        </div>
                                        {(v.remarks || v.reference) && (
                                            <div className="mt-2 space-y-1">
                                                {v.reference && (
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <UserCircle className="w-3 h-3" />
                                                        Ref: <span className="font-medium">{v.reference}</span>
                                                    </p>
                                                )}
                                                {v.remarks && (
                                                    <p className="text-gray-600 text-sm italic">
                                                        "{translatedData[v.id]?.remarks || v.remarks}"
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-gray-900">{format(new Date(v.visit_date), 'h:mm a')}</div>
                                        <div className="text-xs text-gray-400">Visited</div>
                                    </div>
                                </div>
                            ))}
                            {filteredVisitors.length === 0 && !loading && (
                                <div className="p-8 text-center text-gray-500">
                                    {t('office.no_logs')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisitorLog;
