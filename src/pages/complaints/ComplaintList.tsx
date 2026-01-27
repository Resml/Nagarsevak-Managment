import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { type Complaint, type ComplaintStatus } from '../../types';
import { Plus, Calendar, MapPin, User, FileText, Languages, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { translateText } from '../../services/aiTranslation';

const ComplaintList = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [filterStatus, setFilterStatus] = useState<ComplaintStatus | 'All'>('All');
    const [activeTab, setActiveTab] = useState<'Complaints' | 'Personal Help' | 'Self Identified'>('Complaints');
    const [loading, setLoading] = useState(true);

    // Translation State
    const [translatedData, setTranslatedData] = useState<Record<string, { title: string, description: string }>>({});
    const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());

    const fetchComplaints = async () => {
        try {
            // Select complaints and join with voters table
            const { data, error } = await supabase
                .from('complaints')
                .select(`
                    *,
                    voter:voters (
                        name_english,
                        name_marathi,
                        mobile
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching complaints:', error);
                return;
            }

            // Map Supabase data to App Type
            const mappedComplaints: Complaint[] = (data || []).map((row: any) => ({
                id: row.id.toString(),
                title: row.problem || 'Request',
                description: row.problem,
                type: row.category || 'Complaint', // Use DB category
                status: row.status,
                ward: row.location || 'N/A',
                location: row.location,
                area: row.area,
                voterId: row.voter_id,
                voter: row.voter,
                createdAt: row.created_at,
                photos: [],
                updatedAt: row.created_at
            }));

            setComplaints(mappedComplaints);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();

        // Real-time Subscription
        const subscription = supabase
            .channel('complaints_channel')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'complaints' }, () => {
                fetchComplaints();
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'complaints' }, () => {
                fetchComplaints();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Auto-Translate Effect
    useEffect(() => {
        if (language === 'en' || loading || complaints.length === 0) return;

        const translateVisibleItems = async () => {
            const itemsToTranslate = complaints.filter(c => !translatedData[c.id]);
            if (itemsToTranslate.length === 0) return;

            // Translate in batches to avoid rate limits
            const BATCH_SIZE = 5;
            for (let i = 0; i < itemsToTranslate.length; i += BATCH_SIZE) {
                const batch = itemsToTranslate.slice(i, i + BATCH_SIZE);

                await Promise.all(batch.map(async (item) => {
                    try {
                        const [transTitle, transDesc] = await Promise.all([
                            translateText(item.title, language as 'mr' | 'hi'),
                            translateText(item.description, language as 'mr' | 'hi')
                        ]);

                        setTranslatedData(prev => ({
                            ...prev,
                            [item.id]: { title: transTitle, description: transDesc }
                        }));
                    } catch (err) {
                        console.error(`Failed to translate item ${item.id}`, err);
                    }
                }));
            }
        };

        translateVisibleItems();
    }, [language, complaints, loading]);

    const filteredComplaints = complaints.filter(c => {
        const statusMatch = filterStatus === 'All' || c.status === filterStatus;
        let typeMatch = false;

        if (activeTab === 'Complaints') {
            // Area Complaints: Exclude Personal Help and Self Identified
            typeMatch = c.type !== 'Personal Help' && c.type !== 'SelfIdentified';
        } else if (activeTab === 'Personal Help') {
            typeMatch = c.type === 'Personal Help';
        } else if (activeTab === 'Self Identified') {
            typeMatch = c.type === 'SelfIdentified';
        }

        return statusMatch && typeMatch;
    });

    const getStatusColor = (status: ComplaintStatus) => {
        switch (status) {
            case 'Resolved': return 'bg-green-100 text-green-800 border-green-200';
            case 'Closed': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'Pending': return 'bg-red-50 text-red-700 border-red-100';
            case 'Assigned': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'InProgress': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeColor = (type: string) => {
        if (type === 'Help') return 'bg-purple-50 text-purple-700 border-purple-100';
        if (type === 'SelfIdentified') return 'bg-orange-50 text-orange-700 border-orange-100';
        return 'bg-brand-50 text-brand-700 border-brand-100';
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">{t('complaints.loading')}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('complaints.title')}</h1>
                    <p className="text-sm text-gray-500">{t('complaints.subtitle')}</p>
                </div>
                <Link
                    to="/complaints/new"
                    className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span>{t('complaints.new_request')}</span>
                </Link>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="-mb-px flex space-x-8 min-w-max" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('Complaints')}
                        className={clsx(
                            activeTab === 'Complaints'
                                ? 'border-brand-500 text-brand-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                        )}
                    >
                        {t('complaints.tabs.area')}
                    </button>
                    <button
                        onClick={() => setActiveTab('Personal Help')}
                        className={clsx(
                            activeTab === 'Personal Help'
                                ? 'border-brand-500 text-brand-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                        )}
                    >
                        {t('complaints.tabs.personal')}
                    </button>
                    <button
                        onClick={() => setActiveTab('Self Identified')}
                        className={clsx(
                            activeTab === 'Self Identified'
                                ? 'border-brand-500 text-brand-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                        )}
                    >
                        {t('complaints.tabs.self')}
                    </button>
                </nav>
            </div>

            {/* Filters */}
            <div className="flex overflow-x-auto space-x-2 pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                {['All', 'Pending', 'Assigned', 'InProgress', 'Resolved', 'Closed'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status as ComplaintStatus | 'All')}
                        className={clsx(
                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors",
                            filterStatus === status
                                ? "bg-brand-600 text-white border-brand-600"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        )}
                    >
                        {status === 'All' ? t('complaints.filters.all') :
                            status === 'InProgress' ? t('complaints.filters.in_progress') :
                                status === 'Pending' ? t('complaints.filters.pending') :
                                    status === 'Assigned' ? t('complaints.filters.assigned') :
                                        status === 'Resolved' ? t('complaints.filters.resolved') :
                                            t('complaints.filters.closed')}
                    </button>
                ))}
            </div>

            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
                {filteredComplaints.length > 0 ? filteredComplaints.map((complaint) => {
                    const isTranslating = translatingIds.has(complaint.id);
                    const translation = translatedData[complaint.id];

                    return (
                        <div
                            key={complaint.id}
                            onClick={() => navigate(`/ complaints / ${complaint.id} `)}
                            className="bg-white p-4 md:p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full overflow-hidden w-full relative group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className={clsx("px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap", getStatusColor(complaint.status))}>
                                    {complaint.status === 'InProgress' ? t('complaints.status.in_progress') :
                                        complaint.status === 'Pending' ? t('complaints.status.pending') :
                                            complaint.status === 'Assigned' ? t('complaints.status.assigned') :
                                                complaint.status === 'Resolved' ? t('complaints.status.resolved') :
                                                    t('complaints.status.closed')}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className={clsx("px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap ml-2", getTypeColor(complaint.type))}>
                                        {complaint.type}
                                    </span>
                                </div>
                            </div>

                            {complaint.voter && (
                                <div className="mb-2 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded flex items-center gap-1 w-fit">
                                    <User className="w-3 h-3" />
                                    {complaint.voter.name_english || complaint.voter.name_marathi}
                                </div>
                            )}

                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                                {translation ? translation.title : complaint.title}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                                {translation ? translation.description : complaint.description}
                            </p>

                            <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{format(new Date(complaint.createdAt), 'MMM d, h:mm a')}</span>
                                </div>
                                {complaint.location && (
                                    <div className="flex items-center space-x-1 max-w-[50%]">
                                        <MapPin className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">
                                            {complaint.area ? `${complaint.area}, ` : ''}{complaint.location}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-full w-full py-12 text-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-200">
                        {t('complaints.no_requests')} "{filterStatus}"
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComplaintList;
