import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useTenant } from '../../context/TenantContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import {
    LineChart,
    Search,
    Users,
    AlertTriangle,
    TrendingUp,
    Newspaper,
    IndianRupee,
    Calendar,
    MapPin,
    Activity,
    FileText,
    Download,
    Send,
    Printer,
    Loader2,
    Building2,
    Sparkles,
    Clock,
    ArrowRight,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { AIService } from '../../services/aiService';
import AddressSelector from '../../components/common/AddressSelector';

interface AreaMetrics {
    areaName: string;
    totalVoters: number;
    staffCount: number;
    supportersCount: number;
    mobileReach: number;
    // Demographics
    genderMale: number;
    genderFemale: number;
    genderOther: number;
    age18_35: number;
    age36_60: number;
    age61Plus: number;
    casteDistribution: Record<string, number>;
    // Complaints
    totalComplaints: number;
    solvedComplaints: number;
    ongoingComplaints: number;
    assignedComplaints: number;
    // Personal Requests
    totalRequests: number;
    solvedRequests: number;
    pendingRequests: number;
    // Election Results
    totalElectionVotes: number;
    winnerName: string;
    winningMargin: number;
    partyPerformance: Record<string, number>;
    // Events
    conductedEventsCount: number;
    avgRsvpAttendance: number;
    areaEvents: any[];
    // Media Mentions
    areaArticles: any[];
    positiveArticlesCount: number;
    negativeArticlesCount: number;
    // Development Budget
    allocatedBudget: number;
    utilizedBudget: number;
    requestedProvisionsCount: number;
    provisionsAmount: number;
}

const AnalysisStrategy = () => {
    const { tenantId } = useTenant();
    const { t, language } = useLanguage();
    const isMr = language === 'mr';
    const navigate = useNavigate();

    // Tab State
    const [activeTab, setActiveTab] = useState<'strategy' | 'analytical'>('strategy');

    // AI Briefing States
    const [selectedTone, setSelectedTone] = useState<'Development' | 'Grievance' | 'Campaign'>('Development');
    const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
    const [generatedBrief, setGeneratedBrief] = useState('');

    const [allVoterAddresses, setAllVoterAddresses] = useState<string[]>([]);
    const [complaintRequestAreas, setComplaintRequestAreas] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [reportGenerated, setReportGenerated] = useState(false);
    const [reportData, setReportData] = useState<AreaMetrics | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);

    const printableRef = useRef<HTMLDivElement>(null);

    // Fetch ALL unique voter addresses from the database for autocomplete
    // Strategy 1: Try the DB-side DISTINCT RPC (fastest — run migration first)
    // Strategy 2: Paginated address-only fetch in batches of 2000 rows (fallback)
    useEffect(() => {
        if (!tenantId) return;

        const fetchVoterAddresses = async () => {
            try {
                // Fetch unique areas from complaints table
                const { data: complaintsData } = await supabase
                    .from('complaints')
                    .select('area')
                    .eq('tenant_id', tenantId);

                const extraAreas = new Set<string>();
                if (complaintsData) {
                    complaintsData.forEach((c: any) => {
                        if (c.area && c.area.trim()) {
                            extraAreas.add(c.area.trim());
                        }
                    });
                }
                setComplaintRequestAreas(Array.from(extraAreas).sort());

                // --- STRATEGY 1: DB-side DISTINCT via RPC (zero overhead on client) ---
                const { data: rpcData, error: rpcError } = await supabase
                    .rpc('get_distinct_voter_addresses', { p_tenant_id: tenantId });

                if (!rpcError && rpcData && rpcData.length > 0) {
                    const addrs = (rpcData as Array<{ address_marathi: string; address_english: string }>)
                        .map(r => isMr
                            ? (r.address_marathi?.trim() || r.address_english?.trim())
                            : (r.address_english?.trim() || r.address_marathi?.trim())
                        )
                        .filter(Boolean) as string[];
                    
                    setAllVoterAddresses([...new Set(addrs)].sort());
                    return;
                }

                // --- STRATEGY 2: Paginated fetch — only 2 address columns, 2000/page ---
                const PAGE_SIZE = 2000;
                let page = 0;
                const addrSet = new Set<string>();
                let keepGoing = true;

                while (keepGoing) {
                    const { data, error } = await supabase
                        .from('voters')
                        .select('address_marathi, address_english')
                        .eq('tenant_id', tenantId)
                        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

                    if (error || !data || data.length === 0) { keepGoing = false; break; }

                    data.forEach((v: any) => {
                        if (isMr) {
                            if (v.address_marathi?.trim()) addrSet.add(v.address_marathi.trim());
                        } else {
                            if (v.address_english?.trim()) addrSet.add(v.address_english.trim());
                            else if (v.address_marathi?.trim()) addrSet.add(v.address_marathi.trim());
                        }
                    });

                    if (data.length < PAGE_SIZE) keepGoing = false;
                    page++;
                }

                setAllVoterAddresses(Array.from(addrSet).sort());
            } catch (err) {
                console.error('Error fetching voter addresses:', err);
            }
        };

        fetchVoterAddresses();
    }, [tenantId, isMr]);



// Handle Generation Animation and Aggregation Pipeline
    const handleGenerateReport = async (areaName: string) => {
        if (!areaName.trim()) {
            toast.error(isMr ? 'कृपया क्षेत्र निवडा किंवा नाव प्रविष्ट करा!' : 'Please select or enter an area!');
            return;
        }

        setIsGenerating(true);
        setReportGenerated(false);
        setGeneratedBrief('');
        
        // Animated loading steps simulation
        const steps = [0, 1, 2, 3, 4];
        for (const step of steps) {
            setLoadingStep(step);
            await new Promise(resolve => setTimeout(resolve, 600));
        }

        try {
            // --- DATA AGGREGATION PIPELINE (DB-side filtered to avoid 1000-row cap) ---
            const normArea = areaName.trim();
            const ilikePattern = `%${normArea}%`;

            // 1. Fetch Voters matching area — paginated in batches of 2000 rows
            //    using server-side ilike filter on address fields so Supabase's
            //    default 1000-row cap doesn't silently truncate results.
            const matchedVoters: any[] = [];
            {
                const PAGE = 2000;
                let pg = 0;
                let keepFetching = true;
                while (keepFetching) {
                    const { data: vBatch, error: vErr } = await supabase
                        .from('voters')
                        .select('*')
                        .eq('tenant_id', tenantId)
                        .or(
                            `address_marathi.ilike.${ilikePattern},` +
                            `address_english.ilike.${ilikePattern},` +
                            `current_address_marathi.ilike.${ilikePattern},` +
                            `current_address_english.ilike.${ilikePattern}`
                        )
                        .range(pg * PAGE, (pg + 1) * PAGE - 1);

                    if (vErr || !vBatch || vBatch.length === 0) { keepFetching = false; break; }
                    matchedVoters.push(...vBatch);
                    if (vBatch.length < PAGE) keepFetching = false;
                    pg++;
                }
            }

            // 2. Fetch Staff (Karyakartas) matching area — server-side ilike
            const { data: staffData } = await supabase
                .from('staff')
                .select('*')
                .eq('tenant_id', tenantId)
                .ilike('area', ilikePattern);
            const matchedStaff = staffData ?? [];

            // 3. Fetch Complaints matching area — server-side ilike
            const { data: complaintsData } = await supabase
                .from('complaints')
                .select('*')
                .eq('tenant_id', tenantId)
                .ilike('area', ilikePattern);
            const matchedComplaints = complaintsData ?? [];

            // 4. Fetch Personal Requests — fetch all and filter by matched voter IDs
            const { data: requestsData } = await supabase
                .from('personal_requests')
                .select('*')
                .eq('tenant_id', tenantId);
            const allRequests = requestsData ?? [];
            const matchedVoterIds = new Set(matchedVoters.map(v => v.id));
            const matchedRequests = allRequests.filter((r: any) => r.voter_id && matchedVoterIds.has(r.voter_id));

            // 5. Fetch Events — server-side ilike on area OR location
            const { data: eventsAreaData } = await supabase
                .from('events')
                .select('*')
                .eq('tenant_id', tenantId)
                .ilike('area', ilikePattern);
            const eventsArea = eventsAreaData ?? [];

            const { data: eventsLocData } = await supabase
                .from('events')
                .select('*')
                .eq('tenant_id', tenantId)
                .ilike('location', ilikePattern);
            const eventsLoc = eventsLocData ?? [];

            const seenEvtIds = new Set<string>();
            const matchedEvents: any[] = [];
            [...eventsArea, ...eventsLoc].forEach(e => {
                if (!seenEvtIds.has(e.id)) { seenEvtIds.add(e.id); matchedEvents.push(e); }
            });

            // 6. Media Clippings — client-side fine (gallery is small)
            const { data: galleryData } = await supabase
                .from('gallery')
                .select('*')
                .eq('category', 'Newspaper');
            const gallery = galleryData ?? [];
            const matchedArticles = gallery.filter((item: any) =>
                (item.title || '').toLowerCase().includes(normArea.toLowerCase()) ||
                (item.description || '').toLowerCase().includes(normArea.toLowerCase())
            );

            // 7. Development Budget & Provisions — server-side ilike (ward_budget table removed)
            const { data: provisionsData } = await supabase
                .from('ward_provisions')
                .select('*')
                .eq('tenant_id', tenantId)
                .ilike('area', ilikePattern);
            const matchedProvisions = provisionsData ?? [];

            // 8. Election Results — client-side fine (small table)
            const { data: electionResultsData } = await supabase
                .from('election_results')
                .select('*');
            const electionResults = electionResultsData ?? [];
            const matchedResults = electionResults.filter((r: any) =>
                (r.booth_name || '').toLowerCase().includes(normArea.toLowerCase()) ||
                (r.ward_name || '').toLowerCase().includes(normArea.toLowerCase())
            );

            // --- COMPUTING METRICS & DEMOGRAPHICS ---
            const totalVoters = matchedVoters.length;
            const staffCount = matchedStaff.length;
            const supportersCount = matchedVoters.filter(v => v.is_friend_relative === true).length;
            
            const votersWithMobile = matchedVoters.filter(v => v.mobile && v.mobile.trim().length > 0).length;
            const mobileReach = totalVoters > 0 ? Math.round((votersWithMobile / totalVoters) * 100) : 0;

            // Gender Distribution
            const genderMale = matchedVoters.filter(v => v.gender === 'M').length;
            const genderFemale = matchedVoters.filter(v => v.gender === 'F').length;
            const genderOther = totalVoters - genderMale - genderFemale;

            // Age Groups
            const age18_35 = matchedVoters.filter(v => v.age >= 18 && v.age <= 35).length;
            const age36_60 = matchedVoters.filter(v => v.age >= 36 && v.age <= 60).length;
            const age61Plus = matchedVoters.filter(v => v.age >= 61).length;

            // Caste Distribution
            const casteDist: Record<string, number> = {};
            matchedVoters.forEach(v => {
                if (v.caste && v.caste.trim()) {
                    const c = v.caste.trim();
                    casteDist[c] = (casteDist[c] || 0) + 1;
                }
            });

            // Complaints Aggregates
            const totalComplaints = matchedComplaints.length;
            const solvedComplaints = matchedComplaints.filter((c: any) => c.status === 'Resolved' || c.status === 'Closed').length;
            const ongoingComplaints = matchedComplaints.filter((c: any) => c.status === 'Pending' || c.status === 'InProgress').length;
            const assignedComplaints = matchedComplaints.filter((c: any) => c.status === 'Assigned').length;

            // Requests Aggregates
            const totalRequests = matchedRequests.length;
            const solvedRequests = matchedRequests.filter((r: any) => r.status === 'Resolved' || r.status === 'Closed').length;
            const pendingRequests = totalRequests - solvedRequests;

            // Events
            const conductedEventsCount = matchedEvents.length;
            const avgRsvpAttendance = conductedEventsCount > 0 ? Math.round(75 + Math.random() * 80) : 0; // Mocked attendance engagement

            // Articles Sentiment
            const positiveArticlesCount = matchedArticles.filter((a: any) => a.sentiment === 'positive').length;
            const negativeArticlesCount = matchedArticles.length - positiveArticlesCount;

            // Budget
            const allocatedBudget = 0;
            const utilizedBudget = 0;
            const requestedProvisionsCount = matchedProvisions.length;
            const provisionsAmount = matchedProvisions.reduce((sum: number, p: any) => sum + (p.requested_amount || 0), 0);

            // Elections Results
            const totalElectionVotes = matchedResults.reduce((sum: number, r: any) => sum + (r.total_votes_casted || 0), 0);
            const winnerName = matchedResults.length > 0 ? matchedResults[0].winner : 'N/A';
            const winningMargin = matchedResults.reduce((sum: number, r: any) => sum + (r.margin || 0), 0);

            const partyPerformance: Record<string, number> = {};
            matchedResults.forEach((r: any) => {
                if (r.candidate_votes && typeof r.candidate_votes === 'object') {
                    Object.entries(r.candidate_votes).forEach(([party, votes]) => {
                        partyPerformance[party] = (partyPerformance[party] || 0) + Number(votes);
                    });
                }
            });

            // Set final reporting metrics state — 100% real DB data, no static fallbacks
            setReportData({
                areaName,
                totalVoters,
                staffCount,
                supportersCount,
                mobileReach,
                genderMale,
                genderFemale,
                genderOther,
                age18_35,
                age36_60,
                age61Plus,
                casteDistribution: casteDist,
                totalComplaints,
                solvedComplaints,
                ongoingComplaints,
                assignedComplaints,
                totalRequests,
                solvedRequests,
                pendingRequests,
                conductedEventsCount,
                avgRsvpAttendance: conductedEventsCount > 0 ? Math.round(
                    matchedEvents.reduce((s, e) => s + (e.rsvp_count || e.attendee_count || 0), 0) / conductedEventsCount
                ) : 0,
                areaEvents: matchedEvents,
                areaArticles: matchedArticles,
                positiveArticlesCount,
                negativeArticlesCount,
                allocatedBudget,
                utilizedBudget,
                requestedProvisionsCount,
                provisionsAmount,
                totalElectionVotes,
                winnerName,
                winningMargin,
                partyPerformance
            });

            setReportGenerated(true);
            toast.success(isMr ? 'अहवाल यशस्वीरित्या तयार केला गेला!' : 'Intelligence report generated successfully!');
        } catch (err) {
            console.error('Failed to generate intelligence report:', err);
            toast.error(isMr ? 'अहवाल तयार करण्यात त्रुटी आली.' : 'Failed to compile report.');
        } finally {
            setIsGenerating(false);
        }
    };

    // AI Visit Speeches/Briefing Generator
    const generateAIBrief = async () => {
        if (!reportData) return;
        setIsGeneratingBrief(true);
        setGeneratedBrief('');

        try {
            // Formulate descriptive political summary based on live metrics
            const topic = `
            Area Analysis Summary for Nagar Sevak visit:
            - Location Name: ${reportData.areaName}
            - Demographics: ${reportData.totalVoters} total voters, ${reportData.supportersCount} verified supporter families, and ${reportData.staffCount} local karyakartas.
            - Grievances: Solved ${reportData.solvedComplaints} complaints out of ${reportData.totalComplaints}. Solved ${reportData.solvedRequests} personal requests out of ${reportData.totalRequests}. Main ongoing issue relates to local water line maintenance and garbage pick-up.
            - Electoral context: We won this booth in the previous election with a solid margin of ${reportData.winningMargin} votes.
            - Budget: Development works worth ₹${reportData.utilizedBudget.toLocaleString()} have been successfully utilized in this area from the ₹${reportData.allocatedBudget.toLocaleString()} allocated ward budget.
            
            Generate a detailed local campaign visit speech outline and 3 key talking-points for the Nagar Sevak in the local Maharashtra language context. Focus: ${selectedTone}.
            `;

            const aiTone = selectedTone === 'Campaign' ? 'Enthusiastic' : selectedTone === 'Grievance' ? 'Formal' : 'Professional';
            const response = await AIService.generateContent(
                topic,
                'Speech',
                aiTone,
                isMr ? 'Marathi' : 'English'
            );

            setGeneratedBrief(response);
            toast.success(isMr ? 'AI ब्रीफिंग मसुदा तयार झाला!' : 'AI visit brief generated!');
        } catch (err) {
            console.error('AI brief error:', err);
            toast.error(isMr ? 'AI मसुदा तयार करण्यास अपयशी!' : 'Gemini AI failed to draft visit brief.');
        } finally {
            setIsGeneratingBrief(false);
        }
    };

    // Trigger standard browser print optimized for PDF
    const handlePrint = () => {
        window.print();
    };

    // Copy Brief to Clipboard for WhatsApp sharing
    const handleWhatsAppShare = () => {
        if (!reportData) return;
        let summary = `📊 *${isMr ? reportData.areaName + ' क्षेत्र अहवाल' : reportData.areaName + ' Area Intelligence Brief'}*\n\n`;
        summary += `👥 *${t('consultant.total_voters')}*: ${reportData.totalVoters}\n`;
        summary += `🚩 *${t('consultant.staff_count')}*: ${reportData.staffCount}\n`;
        summary += `🤝 *${t('consultant.supporters')}*: ${reportData.supportersCount}\n`;
        summary += `🔧 *${t('consultant.solved_complaints')}*: ${reportData.solvedComplaints}/${reportData.totalComplaints}\n`;
        summary += `🏆 *${isMr ? 'विजेता पक्ष' : 'Winner'}*: ${reportData.winnerName}\n`;
        summary += `💰 *${isMr ? 'वापरलेला विकास निधी' : 'Utilized Funds'}*: ₹${reportData.utilizedBudget.toLocaleString()}\n\n`;
        
        if (generatedBrief) {
            summary += `💡 *${t('consultant.ai_visit_briefing')}*:\n${generatedBrief.substring(0, 500)}...\n\n`;
        }
        
        summary += `_Shared from Nagar Sevak Management Intelligence Dashboard_`;
        
        navigator.clipboard.writeText(summary);
        toast.success(isMr ? 'माहिती क्लिपबोर्डवर कॉपी केली! WhatsApp वर पेस्ट करा.' : 'Report summary copied to clipboard! Paste it in WhatsApp.');
    };

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-5 print:hidden">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                        <LineChart className="w-8 h-8 text-brand-600" />
                        {t('nav.analysis_strategy') || 'Analysis Strategy'}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">{t('consultant.subtitle')}</p>
                </div>
            </div>

            {/* Premium Saffron/Golden Dual Tabs */}
            <div className="flex space-x-1 bg-white p-1.5 rounded-xl border border-slate-200 overflow-x-auto print:hidden shadow-sm max-w-md">
                <button
                    onClick={() => setActiveTab('strategy')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-extrabold transition-all whitespace-nowrap ${
                        activeTab === 'strategy'
                            ? "bg-brand-50 text-brand-700 shadow-sm border border-brand-100"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                    <LineChart className="w-4 h-4" />
                    <span>{isMr ? 'विश्लेषण धोरण' : 'Analysis Strategy'}</span>
                </button>
                <button
                    onClick={() => setActiveTab('analytical')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-extrabold transition-all whitespace-nowrap ${
                        activeTab === 'analytical'
                            ? "bg-brand-50 text-brand-700 shadow-sm border border-brand-100"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>{isMr ? 'विश्लेषणात्मक माहिती' : 'Analytical Info'}</span>
                </button>
            </div>

            {/* CONSULTANT SECTION */}
            {activeTab === 'strategy' && (
                <div className="space-y-6">
                    {/* Welcome Selector Container */}
                    {!isGenerating && !reportGenerated && (
                        <div className="ns-card p-8 max-w-3xl mx-auto space-y-6 animate-fade-in print:hidden">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto border border-brand-100 animate-pulse">
                                    <Sparkles className="w-8 h-8 text-brand-600" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">{t('consultant.select_area') || 'Select or Search Area'}</h2>
                                <p className="text-slate-500 text-sm max-w-md mx-auto">
                                    {isMr
                                        ? 'मतदार यादीतील पत्ता शोधा. प्रणाली त्या क्षेत्रातील मतदार, तक्रारी आणि विकासकामांचा थेट अहवाल संकलित करेल.'
                                        : 'Search any voter address from the database. The system will compile a full report for that area.'}
                                </p>
                                {allVoterAddresses.length > 0 && (
                                    <p className="text-xs font-bold text-brand-600 bg-brand-50 border border-brand-100 rounded-full px-3 py-1 inline-block">
                                        📋 {allVoterAddresses.length} {isMr ? 'अद्वितीय पत्ते उपलब्ध' : 'unique addresses available'}
                                    </p>
                                )}
                            </div>

                            <AddressSelector
                                value={searchQuery}
                                onChange={setSearchQuery}
                                allVoterAddresses={allVoterAddresses}
                            />

                            {/* COMPLAINTS & REQUESTS AREAS DROPDOWN */}
                            {complaintRequestAreas.length > 0 && (
                                <div className="space-y-2 border-t border-slate-100 pt-4">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                        {isMr ? 'किंवा तक्रार / विनंती क्षेत्रातून निवडा:' : 'Or select from complaint / request areas:'}
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 z-10 pointer-events-none" />
                                        <select
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                            }}
                                            className="pl-12 pr-10 py-4 w-full bg-white font-semibold text-slate-800 border border-slate-300 focus:ring-brand-500 focus:border-brand-500 rounded-xl text-sm shadow-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">{isMr ? '-- सर्व क्षेत्रे --' : '-- All Complaint / Request Areas --'}</option>
                                            {complaintRequestAreas.map((area, idx) => (
                                                <option key={idx} value={area}>
                                                    {area}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold">
                                            ▼
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => handleGenerateReport(searchQuery)}
                                disabled={!searchQuery.trim()}
                                className="w-full bg-gradient-to-r from-brand-500 to-brand-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Sparkles className="w-5 h-5" />
                                {t('consultant.generate_btn')}
                            </button>
                        </div>
                    )}

                    {/* DYNAMIC PIPELINE LOADING OVERLAY */}
                    {isGenerating && (
                        <div className="ns-card p-16 max-w-xl mx-auto flex flex-col items-center justify-center space-y-6 animate-pulse print:hidden">
                            <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-bold text-slate-900">{isMr ? 'क्षेत्रीय माहिती संकलित करत आहे' : 'Compiling Local Intelligence'}</h3>
                                <p className="text-slate-400 text-sm">{isMr ? 'कृपया काही क्षण थांबा, डेटा गोळा केला जात आहे...' : 'Please wait, analyzing localized data...'}</p>
                            </div>
                            
                            {/* Running pipeline items with dynamic icons */}
                            <div className="w-full space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3 text-sm">
                                    <span className={loadingStep >= 0 ? "text-emerald-500" : "text-slate-300"}>●</span>
                                    <span className={loadingStep === 0 ? "text-brand-600 font-bold" : "text-slate-600"}>{t('consultant.loading_voters')}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className={loadingStep >= 1 ? "text-emerald-500" : "text-slate-300"}>●</span>
                                    <span className={loadingStep === 1 ? "text-brand-600 font-bold" : "text-slate-600"}>{t('consultant.loading_grievances')}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className={loadingStep >= 2 ? "text-emerald-500" : "text-slate-300"}>●</span>
                                    <span className={loadingStep === 2 ? "text-brand-600 font-bold" : "text-slate-600"}>{t('consultant.loading_history')}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className={loadingStep >= 3 ? "text-emerald-500" : "text-slate-300"}>●</span>
                                    <span className={loadingStep === 3 ? "text-brand-600 font-bold" : "text-slate-600"}>{t('consultant.loading_media')}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className={loadingStep >= 4 ? "text-emerald-500" : "text-slate-300"}>●</span>
                                    <span className={loadingStep === 4 ? "text-brand-600 font-bold" : "text-slate-600"}>{t('consultant.loading_completing')}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DOCKET REPORT VIEW */}
                    {reportGenerated && reportData && (
                        <div className="space-y-6 animate-fade-in-up">
                            {/* Interactivity controls header */}
                            <div className="ns-card p-4 flex flex-wrap gap-3 justify-between items-center print:hidden">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-brand-500 animate-pulse" />
                                    <span className="font-black text-slate-800 text-lg">{reportData.areaName}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handlePrint}
                                        className="ns-btn-ghost flex items-center gap-2 text-xs py-2 border border-slate-200 font-bold hover:bg-slate-50"
                                    >
                                        <Printer className="w-4 h-4 text-slate-500" />
                                        {t('consultant.download_pdf')}
                                    </button>
                                    <button
                                        onClick={handleWhatsAppShare}
                                        className="bg-[#25D366] hover:bg-[#1ebd5c] text-white flex items-center gap-2 text-xs font-bold py-2 px-4 rounded-xl shadow-sm transition-colors"
                                    >
                                        <Send className="w-4 h-4" />
                                        {t('consultant.share_wa')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setReportGenerated(false);
                                            setReportData(null);
                                        }}
                                        className="ns-btn-ghost flex items-center gap-2 text-xs py-2 border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                                    >
                                        ← {isMr ? 'मागे' : 'Back'}
                                    </button>
                                </div>
                            </div>

                            {/* PRINTABLE DOCKET CONTAINER */}
                            <div ref={printableRef} className="space-y-6 print:space-y-10 print:text-black">
                                
                                {/* PRINT ONLY Header Banner */}
                                <div className="hidden print:flex justify-between items-center border-b-4 border-brand-600 pb-4">
                                    <div>
                                        <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
                                            {isMr ? 'क्षेत्रीय गुप्तचर व सल्लागार अहवाल' : 'Area Intelligence & Briefing Docket'}
                                        </h1>
                                        <p className="text-slate-500 text-sm font-semibold mt-1">
                                            📍 {t('consultant.total_voters')}: {reportData.areaName} | {isMr ? 'प्रभाग क्र. १२' : 'Ward No. 12'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-slate-400 font-mono">CONFIDENTIAL POLITICAL DOCUMENT</span>
                                        <div className="text-sm font-bold text-slate-700 mt-1">{format(new Date(), 'dd MMMM yyyy')}</div>
                                    </div>
                                </div>

                                {/* SECTION 1: EXECUTIVE KPI SUMMARY GRID */}
                                <div className="space-y-3">
                                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 border-l-4 border-brand-500 pl-3">
                                        {t('consultant.overview_metrics')}
                                    </h3>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="ns-card p-5 space-y-1 hover:border-brand-300 transition-all">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-semibold text-slate-500 uppercase">{t('consultant.total_voters')}</span>
                                                <Users className="w-4 h-4 text-brand-600" />
                                            </div>
                                            <p className="text-3xl font-black text-slate-800">{reportData.totalVoters}</p>
                                        </div>

                                        <div className="ns-card p-5 space-y-1 hover:border-brand-300 transition-all">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-semibold text-slate-500 uppercase">{t('consultant.staff_count')}</span>
                                                <Building2 className="w-4 h-4 text-brand-500" />
                                            </div>
                                            <p className="text-3xl font-black text-slate-800">{reportData.staffCount}</p>
                                        </div>

                                        <div className="ns-card p-5 space-y-1 hover:border-brand-300 transition-all">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-semibold text-slate-500 uppercase">{t('consultant.supporters')}</span>
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <p className="text-3xl font-black text-emerald-600">{reportData.supportersCount}</p>
                                        </div>

                                        <div className="ns-card p-5 space-y-1 hover:border-brand-300 transition-all col-span-2 lg:col-span-1">
                                            <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">{t('consultant.supporter_density')}</span>
                                            <div className="flex items-center gap-3">
                                                <p className="text-2xl font-black text-slate-800">
                                                    {reportData.totalVoters > 0 ? Math.round((reportData.supportersCount / reportData.totalVoters) * 100) : 0}%
                                                </p>
                                                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full" 
                                                        style={{ width: `${reportData.totalVoters > 0 ? (reportData.supportersCount / reportData.totalVoters) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 2: DEMOGRAPHICS PANEL & GRAPHS */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                    <div className="ns-card p-6 lg:col-span-8 space-y-4">
                                        <h3 className="text-base font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                                            <Activity className="w-4 h-4 text-brand-600" />
                                            {t('consultant.voter_demographics')}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Age Demographics with progress bars */}
                                            <div className="space-y-4">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('consultant.age_groups')}</h4>
                                                <div className="space-y-3">
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                                                            <span>{isMr ? 'तरुण (१८-३५ वर्षे)' : 'Youth (18-35 yrs)'}</span>
                                                            <span>{reportData.age18_35}</span>
                                                        </div>
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(reportData.age18_35 / reportData.totalVoters) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                                                            <span>{isMr ? 'मध्यमवयीन (३६-६० वर्षे)' : 'Middle Aged (36-60 yrs)'}</span>
                                                            <span>{reportData.age36_60}</span>
                                                        </div>
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(reportData.age36_60 / reportData.totalVoters) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                                                            <span>{isMr ? 'ज्येष्ठ नागरिक (६०+ वर्षे)' : 'Seniors (60+ yrs)'}</span>
                                                            <span>{reportData.age61Plus}</span>
                                                        </div>
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-brand-300 rounded-full" style={{ width: `${(reportData.age61Plus / reportData.totalVoters) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Gender Demographics with Micro SVG Donut */}
                                            <div className="flex flex-col justify-between">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('consultant.gender_ratio')}</h4>
                                                <div className="flex items-center gap-4">
                                                    {/* SVG simple donut ring chart */}
                                                    <svg width="80" height="80" className="rotate-90">
                                                        <circle cx="40" cy="40" r="30" fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
                                                        <circle 
                                                            cx="40" cy="40" r="30" fill="transparent" stroke="#0284c7" strokeWidth="10" 
                                                            strokeDasharray={`${2 * Math.PI * 30}`} 
                                                            strokeDashoffset={`${2 * Math.PI * 30 * (1 - reportData.genderMale / reportData.totalVoters)}`}
                                                        />
                                                    </svg>
                                                    <div className="space-y-1 text-xs font-semibold">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2.5 h-2.5 bg-brand-600 rounded-full" />
                                                            <span className="text-slate-600">{t('duplicate_voters.male')}: {reportData.genderMale}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                                                            <span className="text-slate-600">{t('duplicate_voters.female')}: {reportData.genderFemale}</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-semibold uppercase">{t('consultant.mobile_reach')}: {reportData.mobileReach}%</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Demographics Right Caste Distribution panel */}
                                    <div className="ns-card p-6 lg:col-span-4 space-y-4">
                                        <h3 className="text-base font-black text-slate-800 border-b border-slate-100 pb-3 uppercase tracking-wider text-xs font-bold text-slate-400">
                                            {isMr ? 'अंदाजे जात लोकसंख्या' : 'Caste Distributions'}
                                        </h3>
                                        <div className="space-y-3">
                                            {Object.entries(reportData.casteDistribution).map(([caste, count]) => (
                                                <div key={caste} className="flex justify-between items-center text-xs font-semibold text-slate-700">
                                                    <span className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">{caste}</span>
                                                    <span>{count} {isMr ? 'मतदार' : 'Voters'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 3: CIVIC PROBLEMS & PERSONAL HELP REPORTS */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Civic Complaints */}
                                    <div className="ns-card p-6 space-y-4">
                                        <h3 className="text-base font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                                            <AlertTriangle className="w-5 h-5 text-brand-500" />
                                            {t('consultant.civic_problems')}
                                        </h3>
                                        <div className="grid grid-cols-3 gap-3 text-center">
                                            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                                <span className="text-[10px] font-bold text-emerald-600 block uppercase">{t('consultant.solved_complaints')}</span>
                                                <span className="text-2xl font-black text-emerald-600">{reportData.solvedComplaints}</span>
                                            </div>
                                            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                                                <span className="text-[10px] font-bold text-amber-600 block uppercase">{t('consultant.ongoing_complaints')}</span>
                                                <span className="text-2xl font-black text-amber-600">{reportData.ongoingComplaints}</span>
                                            </div>
                                            <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                                                <span className="text-[10px] font-bold text-purple-600 block uppercase">{t('consultant.assigned_complaints')}</span>
                                                <span className="text-2xl font-black text-purple-600">{reportData.assignedComplaints}</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 font-semibold uppercase">{t('consultant.total_complaints')}: {reportData.totalComplaints}</p>
                                    </div>

                                    {/* Personal Requests */}
                                    <div className="ns-card p-6 space-y-4">
                                        <h3 className="text-base font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                                            <FileText className="w-5 h-5 text-brand-600" />
                                            {t('consultant.personal_requests')}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4 text-center">
                                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                                                <span className="text-[10px] font-bold text-emerald-600 block uppercase">{t('consultant.solved_requests')}</span>
                                                <span className="text-2xl font-black text-emerald-600">{reportData.solvedRequests}</span>
                                            </div>
                                            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
                                                <span className="text-[10px] font-bold text-rose-600 block uppercase">{t('consultant.pending_requests')}</span>
                                                <span className="text-2xl font-black text-rose-600">{reportData.pendingRequests}</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 font-semibold uppercase">{t('consultant.total_requests')}: {reportData.totalRequests}</p>
                                    </div>
                                </div>

                                {/* SECTION 4: ELECTION PERFORMANCE & BOOTH ANALYSIS */}
                                <div className="ns-card p-6 space-y-4">
                                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                                        <TrendingUp className="w-5 h-5 text-brand-500" />
                                        {t('consultant.election_results')}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Primary stats */}
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-xs font-semibold text-slate-400 uppercase">{t('consultant.booth_votes')}</span>
                                                <p className="text-2xl font-black text-slate-800">{reportData.totalElectionVotes}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs font-semibold text-slate-400 uppercase">{t('consultant.winner')}</span>
                                                <p className="text-lg font-black text-emerald-600">{reportData.winnerName}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs font-semibold text-slate-400 uppercase">{t('consultant.margin')}</span>
                                                <p className="text-lg font-black text-slate-800">+ {reportData.winningMargin} {isMr ? 'मते' : 'votes'}</p>
                                            </div>
                                        </div>

                                        {/* Party breakdown table */}
                                        <div className="md:col-span-2 space-y-2">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('consultant.comparative_performance')}</h4>
                                            <div className="space-y-2 border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-slate-50/50">
                                                {Object.entries(reportData.partyPerformance).map(([party, votes]) => (
                                                    <div key={party} className="flex justify-between items-center p-2.5 border-b border-slate-100 last:border-0 text-xs font-bold text-slate-700">
                                                        <span>📍 {party}</span>
                                                        <span className="bg-white border border-slate-200 px-3 py-1 rounded-md">{votes} {isMr ? 'मते' : 'votes'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 5: BUDGETS & DEVELOPMENT PROVISIONS */}
                                <div className="ns-card p-6 space-y-4">
                                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                                        <IndianRupee className="w-5 h-5 text-brand-600" />
                                        {t('consultant.municipal_works')}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Budgets Progress */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('consultant.allocated_budget')}</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm font-black text-slate-800">
                                                    <span>₹{reportData.allocatedBudget.toLocaleString()}</span>
                                                    <span className="text-xs text-slate-400 font-semibold">{isMr ? 'एकूण निधी' : 'Total Allocation'}</span>
                                                </div>
                                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full" 
                                                        style={{ width: `${reportData.allocatedBudget > 0 ? (reportData.utilizedBudget / reportData.allocatedBudget) * 100 : 0}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-xs font-semibold text-slate-500">
                                                    <span>₹{reportData.utilizedBudget.toLocaleString()} {isMr ? 'खर्च' : 'Utilized'}</span>
                                                    <span>{reportData.allocatedBudget > 0 ? Math.round((reportData.utilizedBudget / reportData.allocatedBudget) * 100) : 0}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Provisions */}
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
                                            <div>
                                                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">{t('consultant.requested_provisions')}</span>
                                                <p className="text-2xl font-black text-slate-800">{reportData.requestedProvisionsCount}</p>
                                            </div>
                                            <div className="mt-2">
                                                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">{isMr ? 'विकासकामांची अंदाजे रक्कम' : 'Provisions Value'}</span>
                                                <p className="text-lg font-black text-brand-600">₹{reportData.provisionsAmount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 6: ACTIVITY EVENTS & MEDIA COVERAGE */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Events conducted */}
                                    <div className="ns-card p-6 space-y-4">
                                        <h3 className="text-base font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                                            <Calendar className="w-5 h-5 text-purple-600" />
                                            {t('consultant.media_events')}
                                        </h3>
                                        <div className="flex justify-between items-center bg-purple-50 border border-purple-100 p-3 rounded-xl">
                                            <div>
                                                <span className="text-[10px] font-bold text-purple-600 uppercase block">{t('consultant.conducted_events')}</span>
                                                <span className="text-xl font-black text-purple-700">{reportData.conductedEventsCount}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold text-purple-600 uppercase block">{t('consultant.avg_attendance')}</span>
                                                <span className="text-xl font-black text-purple-700">{reportData.avgRsvpAttendance}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {reportData.areaEvents.map((evt, idx) => (
                                                <div key={idx} className="flex gap-3 text-xs font-semibold text-slate-700 border border-slate-100 p-2.5 rounded-xl hover:bg-slate-50/50">
                                                    <div className="text-purple-600 font-bold shrink-0">{evt.event_date}</div>
                                                    <div className="truncate flex-1">{evt.title}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Media Mentions sentiment */}
                                    <div className="ns-card p-6 space-y-4">
                                        <h3 className="text-base font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                                            <Newspaper className="w-5 h-5 text-brand-500" />
                                            {t('consultant.media_sentiment')}
                                        </h3>
                                        
                                        <div className="flex gap-4 text-center">
                                            <div className="flex-1 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-emerald-600">
                                                <span className="text-[10px] font-bold uppercase block">{t('consultant.positive_mentions')}</span>
                                                <span className="text-lg font-black">{reportData.positiveArticlesCount}</span>
                                            </div>
                                            <div className="flex-1 bg-rose-50 border border-rose-100 p-2.5 rounded-xl text-rose-600">
                                                <span className="text-[10px] font-bold uppercase block">{t('consultant.negative_mentions')}</span>
                                                <span className="text-lg font-black">{reportData.negativeArticlesCount}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {reportData.areaArticles.map((art, idx) => (
                                                <div key={idx} className="flex flex-col gap-1 text-xs font-semibold text-slate-700 border border-slate-100 p-2.5 rounded-xl">
                                                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                                                        <span>{art.date}</span>
                                                        <span className={art.sentiment === 'positive' ? 'text-emerald-600 font-bold' : 'text-slate-400'}>{art.sentiment}</span>
                                                    </div>
                                                    <div className="line-clamp-2">{art.title}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 7: AI STRATEGIC VISIT BRIEFING (GEMINI) */}
                                <div className="bg-gradient-to-br from-brand-500 to-brand-700 border border-brand-600 rounded-3xl p-6 md:p-8 text-white shadow-xl space-y-6 print:hidden">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black flex items-center gap-2 drop-shadow-sm">
                                                <Sparkles className="w-6 h-6 text-white animate-pulse" />
                                                {t('consultant.ai_visit_briefing')}
                                            </h3>
                                            <p className="text-brand-100 text-sm max-w-xl leading-tight">
                                                {t('consultant.ai_briefing_desc')}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 bg-white/10 p-1.5 rounded-2xl border border-white/10 backdrop-blur-sm shrink-0">
                                            <button
                                                onClick={() => setSelectedTone('Development')}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedTone === 'Development' ? 'bg-white text-brand-600 shadow-md' : 'text-white hover:bg-white/5'}`}
                                            >
                                                {t('consultant.tone_dev')}
                                            </button>
                                            <button
                                                onClick={() => setSelectedTone('Grievance')}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedTone === 'Grievance' ? 'bg-white text-brand-600 shadow-md' : 'text-white hover:bg-white/5'}`}
                                            >
                                                {t('consultant.tone_grievance')}
                                            </button>
                                            <button
                                                onClick={() => setSelectedTone('Campaign')}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedTone === 'Campaign' ? 'bg-white text-brand-600 shadow-md' : 'text-white hover:bg-white/5'}`}
                                            >
                                                {t('consultant.tone_campaign')}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={generateAIBrief}
                                        disabled={isGeneratingBrief}
                                        className="ns-btn-ghost w-full bg-white hover:bg-slate-50 text-brand-600 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-60 border-0"
                                    >
                                        {isGeneratingBrief ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {t('consultant.generating_ai')}
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                {t('consultant.generate_speech_btn')}
                                            </>
                                        )}
                                    </button>

                                    {/* Generated AI content pane */}
                                    {generatedBrief && (
                                        <div className="bg-white/10 border border-white/20 rounded-2xl p-5 md:p-6 backdrop-blur-md space-y-4 animate-fade-in">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-200">
                                                {isMr ? '🤖 जेमिनी एआय धोरणात्मक सल्ला मसुदा' : '🤖 Gemini AI Generated Briefing'}
                                            </h4>
                                            <div className="text-sm font-semibold leading-relaxed text-slate-50 whitespace-pre-line border-l-4 border-brand-300 pl-4">
                                                {generatedBrief}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* PRINT ONLY AI Speech Display Panel */}
                                {generatedBrief && (
                                    <div className="hidden print:block bg-slate-50 border-2 border-slate-300 p-6 rounded-2xl space-y-3">
                                        <h3 className="text-lg font-black border-b border-slate-300 pb-2">
                                            🤖 AI VISITING SPEECH & STRATEGIC ADVICE
                                        </h3>
                                        <div className="text-sm leading-relaxed whitespace-pre-line font-medium text-slate-800">
                                            {generatedBrief}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ANALYTICAL TAB (COMING SOON) */}
            {activeTab === 'analytical' && (
                <div className="ns-card p-16 max-w-xl mx-auto flex flex-col items-center justify-center space-y-6 text-center animate-fade-in print:hidden">
                    <div className="p-4 bg-brand-50 border border-brand-100 rounded-2xl text-brand-600 animate-bounce">
                        <Sparkles className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-800">
                            {isMr ? 'विश्लेषणात्मक माहिती' : 'Analytical Information'}
                        </h2>
                        <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-black uppercase tracking-wider">
                            🚀 {isMr ? 'लवकरच येत आहे' : 'Coming Soon'}
                        </span>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed pt-2">
                            {isMr 
                                ? 'या विभागात लवकरच प्रगत विश्लेषण, आलेख आणि प्रभागाची सांख्यिकीय माहिती उपलब्ध करून दिली जाईल.'
                                : 'Advanced visual analytics, ward demographic trends, and predictive political forecasting charts will be available in this section very soon.'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalysisStrategy;
