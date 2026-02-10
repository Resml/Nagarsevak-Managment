import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { type Complaint, type ComplaintStatus, type ComplaintType } from '../../types';
import { Plus, Calendar, MapPin, User, Search, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { translateText } from '../../services/aiTranslation';
import { TranslatedText } from '../../components/TranslatedText';

const WardWiseProblem = () => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [filterStatus, setFilterStatus] = useState<ComplaintStatus | 'All'>('All');
    const [loading, setLoading] = useState(true);

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [areaSearch, setAreaSearch] = useState('');
    const [dateSearch, setDateSearch] = useState('');
    const [showAreaDropdown, setShowAreaDropdown] = useState(false);
    const [showDateDropdown, setShowDateDropdown] = useState(false);



    const fetchComplaints = async () => {
        try {
            // Select complaints and join with voters table
            // Filtering for 'SelfIdentified' category specifically
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
                .eq('category', 'SelfIdentified')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching complaints:', error);
                return;
            }

            type ComplaintRow = {
                id: string | number;
                problem: string | null;
                category: string | null;
                status: ComplaintStatus;
                location: string | null;
                area: string | null;
                voter_id: string | number | null;
                created_at: string;
                description_meta?: string | null;
                voter?: {
                    name_english?: string | null;
                    name_marathi?: string | null;
                    mobile?: string | null;
                } | null;
            };

            type AreaProblemRow = {
                id: string | number;
                title: string;
                description: string;
                location: string | null;
                status: ComplaintStatus;
                reporter_name: string | null;
                reporter_mobile: string | null;
                created_at: string;
            };

            const allowedTypes: readonly ComplaintType[] = [
                'Cleaning',
                'Water',
                'Road',
                'Drainage',
                'StreetLight',
                'Other',
                'Help',
                'Personal Help',
                'Complaint',
                'SelfIdentified',
            ] as const;

            const isComplaintType = (value: string): value is ComplaintType =>
                (allowedTypes as readonly string[]).includes(value);

            // Fetch area_problems
            const { data: areaData, error: areaError } = await supabase
                .from('area_problems')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false });

            if (areaError) {
                console.error('Error fetching area problems:', areaError);
            }

            // Map Supabase data to App Type
            const mappedComplaints: Complaint[] = (data || []).map((row: ComplaintRow) => ({
                id: row.id.toString(),
                title: row.problem ?? 'Request',
                description: row.problem ?? '',
                type: row.category && isComplaintType(row.category) ? row.category : 'Complaint',
                status: row.status,
                ward: row.location || 'N/A',
                location: row.location ?? undefined,
                area: row.area ?? undefined,
                voterId: row.voter_id ? row.voter_id.toString() : undefined,
                voter: row.voter
                    ? {
                        name_english: row.voter.name_english ?? undefined,
                        name_marathi: row.voter.name_marathi ?? undefined,
                        mobile: row.voter.mobile ?? undefined,
                    }
                    : (() => {
                        try {
                            const meta = row.description_meta ? JSON.parse(row.description_meta) : null;
                            if (meta?.submitter_name) {
                                return {
                                    name_english: meta.submitter_name,
                                    mobile: meta.submitter_mobile
                                };
                            }
                        } catch (e) { }
                        return undefined;
                    })(),
                createdAt: row.created_at,
                photos: [],
                updatedAt: row.created_at
            }));

            const mappedAreaProblems: Complaint[] = (areaData || []).map((row: AreaProblemRow) => ({
                id: `ap-${row.id}`,
                title: row.title,
                description: row.description,
                type: 'SelfIdentified',
                status: row.status,
                ward: 'Ward Problems',
                location: row.location ?? undefined,
                voter: {
                    name_english: row.reporter_name ?? 'Bot User',
                    mobile: row.reporter_mobile ?? undefined
                },
                createdAt: row.created_at,
                photos: [],
                updatedAt: row.created_at
            }));

            // Merge and sort
            const merged = [...mappedComplaints, ...mappedAreaProblems].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setComplaints(merged);
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
            .channel('ward_wise_problems_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints', filter: `tenant_id=eq.${tenantId}` }, () => {
                fetchComplaints();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'area_problems', filter: `tenant_id=eq.${tenantId}` }, () => {
                fetchComplaints();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [tenantId]);



    // Unique Areas with Counts
    const uniqueAreas = Array.from(new Set(complaints.map(c => c.area).filter(Boolean))).map(area => {
        return {
            name: area,
            count: complaints.filter(c => c.area === area).length
        };
    }).sort((a, b) => b.count - a.count);

    // Unique Dates with Counts
    const uniqueDates = Array.from(new Set(complaints.map(c => format(new Date(c.createdAt), 'yyyy-MM-dd')))).map(dateStr => {
        const displayDate = format(new Date(dateStr), 'MMM d, yyyy');
        return {
            value: dateStr,
            display: displayDate,
            count: complaints.filter(c => format(new Date(c.createdAt), 'yyyy-MM-dd') === dateStr).length
        };
    }).sort((a, b) => new Date(b.value).getTime() - new Date(a.value).getTime());


    const filteredComplaints = complaints.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesArea = !areaSearch || (c.area && c.area.toLowerCase().includes(areaSearch.toLowerCase()));

        const matchesDate = !dateSearch || format(new Date(c.createdAt), 'MMM d, yyyy').toLowerCase().includes(dateSearch.toLowerCase());

        const statusMatch = filterStatus === 'All' || c.status === filterStatus;

        return statusMatch && matchesSearch && matchesArea && matchesDate;
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
        return (
            <div className="space-y-6">
                <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-2 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-1" />
                            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                        </div>
                        <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
                    </div>
                </div>
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white p-4 md:p-5 rounded-lg shadow-sm border border-gray-200 h-64 flex flex-col relative">
                            <div className="flex justify-between items-start mb-3">
                                <div className="h-5 w-20 bg-slate-200 rounded animate-pulse" />
                                <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
                            </div>
                            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-2 bg-blue-50" />
                            <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse mb-2" />
                            <div className="h-4 w-full bg-slate-200 rounded animate-pulse mb-4" />
                            <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-2 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('nav.ward_problem')}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-500">{t('complaints.subtitle')}</p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                                {t('complaints.found')}: {filteredComplaints.length}
                            </span>
                        </div>
                    </div>
                    <Link
                        to="/complaints/new?type=SelfIdentified"
                        className="ns-btn-primary"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t('complaints.new_request')}</span>
                    </Link>
                </div>

                {/* Search and Filters */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* General Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder={t('complaints.search_placeholder')}
                                className="ns-input pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Area Search with Dropdown */}
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder={t('complaints.search_area_placeholder')}
                                className="ns-input pl-10"
                                value={areaSearch}
                                onChange={(e) => {
                                    setAreaSearch(e.target.value);
                                    setShowAreaDropdown(true);
                                }}
                                onFocus={() => setShowAreaDropdown(true)}
                                onBlur={() => setTimeout(() => setShowAreaDropdown(false), 200)}
                            />
                            {showAreaDropdown && uniqueAreas.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto w-full">
                                    {uniqueAreas
                                        .filter(a => !areaSearch || (a.name && a.name.toLowerCase().includes(areaSearch.toLowerCase())))
                                        .map((area, idx) => (
                                            <button
                                                key={idx}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex justify-between items-center text-sm"
                                                onClick={() => {
                                                    setAreaSearch(area.name || '');
                                                    setShowAreaDropdown(false);
                                                }}
                                            >
                                                <span className="text-gray-700">{area.name}</span>
                                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                                                    {area.count}
                                                </span>
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>

                        {/* Date Search with Dropdown */}
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder={t('complaints.filter_date_placeholder')}
                                className="ns-input pl-10"
                                value={dateSearch}
                                onChange={(e) => {
                                    setDateSearch(e.target.value);
                                    setShowDateDropdown(true);
                                }}
                                onFocus={() => setShowDateDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDateDropdown(false), 200)}
                            />
                            {showDateDropdown && uniqueDates.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto w-full">
                                    {uniqueDates
                                        .filter(d => !dateSearch || d.display.toLowerCase().includes(dateSearch.toLowerCase()))
                                        .map((date, idx) => (
                                            <button
                                                key={idx}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex justify-between items-center text-sm"
                                                onClick={() => {
                                                    setDateSearch(date.display);
                                                    setShowDateDropdown(false);
                                                }}
                                            >
                                                <span className="text-gray-700">{date.display}</span>
                                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                                                    {date.count}
                                                </span>
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Filters */}
                    <div className="flex overflow-x-auto space-x-2 pb-1 scrollbar-hide">
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
                </div>
            </div>

            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
                {filteredComplaints.length > 0 ? filteredComplaints.map((complaint) => {
                    return (
                        <div
                            key={complaint.id}
                            onClick={() => navigate(`/complaints/${complaint.id}`)}
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
                                        {complaint.type == 'SelfIdentified' ? t('complaints.form.types.self_identified') : complaint.type}
                                    </span>
                                </div>
                            </div>

                            {complaint.voter && (
                                <div className="mb-2 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded flex items-center gap-1 w-fit">
                                    {language === 'mr' && complaint.voter.name_marathi
                                        ? complaint.voter.name_marathi
                                        : (complaint.voter.name_english || complaint.voter.name_marathi)}
                                    {complaint.voter.mobile && ` | ${complaint.voter.mobile}`}
                                </div>
                            )}

                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                                <TranslatedText text={complaint.title} />
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                                <TranslatedText text={complaint.description} />
                            </p>

                            <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{format(new Date(complaint.createdAt), 'MMM d, h:mm a')}</span>
                                </div>
                                {complaint.location && (
                                    <div className="flex items-center space-x-1 max-w-[50%]">
                                        <MapPin className="w-3 h-3 flex-shrink-0" />
                                        <div className="truncate">
                                            <TranslatedText text={(complaint.area ? `${complaint.area}, ` : '') + complaint.location} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-full w-full py-12 text-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-200 flex flex-col items-center justify-center">
                        <p className="mb-4">{t('complaints.no_requests')} "{filterStatus !== 'All' ? filterStatus : ''}"</p>
                        <Link
                            to="/complaints/new?type=SelfIdentified"
                            className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition shadow-sm flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{t('complaints.new_request')}</span>
                        </Link>
                    </div>
                )}
            </div>
        </div >
    );
};

export default WardWiseProblem;
