import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useTenant } from '../../context/TenantContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronDown, ChevronUp, Search, Users, RefreshCw, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';

interface DuplicateGroup {
    normalizedName: string;
    voters: any[];
}

const DuplicateVoters = () => {
    const { tenantId } = useTenant();
    const { t, language } = useLanguage();
    const isMr = language === 'mr';
    const navigate = useNavigate();

    const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [totalDuplicates, setTotalDuplicates] = useState(0);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchDuplicates();
    }, [tenantId]);

    const fetchDuplicates = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('voters')
                .select('id, name_english, name_marathi, epic_no, serial_no, age, gender, ward_no, part_no, house_no, caste, mobile, address_english, address_marathi')
                .eq('tenant_id', tenantId)
                .not('name_english', 'is', null)
                .order('name_english', { ascending: true });

            if (error) throw error;

            if (!data || data.length === 0) {
                setDuplicateGroups([]);
                setTotalDuplicates(0);
                return;
            }

            const groups = new Map<string, any[]>();
            data.forEach(voter => {
                const raw = (voter.name_english || '').trim();
                const normalized = raw.toLowerCase().replace(/\s+/g, ' ');
                if (!normalized) return;
                if (!groups.has(normalized)) groups.set(normalized, []);
                groups.get(normalized)!.push(voter);
            });

            const dupGroups: DuplicateGroup[] = [];
            let total = 0;
            groups.forEach((voters, normalizedName) => {
                if (voters.length > 1) {
                    dupGroups.push({ normalizedName, voters });
                    total += voters.length;
                }
            });

            dupGroups.sort((a, b) => b.voters.length - a.voters.length);
            setDuplicateGroups(dupGroups);
            setTotalDuplicates(total);
        } catch (err) {
            console.error('Error fetching duplicates:', err);
            toast.error('Failed to fetch voter data');
        } finally {
            setLoading(false);
        }
    };

    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const handleDeleteVoter = async (voterId: string) => {
        setDeletingId(voterId);
        try {
            const { error } = await supabase
                .from('voters')
                .delete()
                .eq('id', voterId)
                .eq('tenant_id', tenantId);
            if (error) throw error;
            toast.success('Duplicate voter record removed.');
            setConfirmDeleteId(null);
            fetchDuplicates();
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete voter record');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredGroups = duplicateGroups.filter(g =>
        !searchTerm || g.normalizedName.includes(searchTerm.toLowerCase())
    );

    const expandAll = () => setExpandedGroups(new Set(filteredGroups.map(g => g.normalizedName)));
    const collapseAll = () => setExpandedGroups(new Set());

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6 text-brand-500" />
                            {t('duplicate_voters.title') || 'Duplicate Voter Detection'}
                        </h1>
                        <p className="text-sm text-slate-500">{t('duplicate_voters.subtitle') || 'Identify and clean up duplicate voter records with matching full names'}</p>
                    </div>
                    <button
                        onClick={fetchDuplicates}
                        className="ns-btn-soft flex items-center gap-2 text-sm"
                    >
                        <RefreshCw className="w-4 h-4" /> {t('duplicate_voters.refresh') || 'Refresh'}
                    </button>
                </div>

                {/* Stats Row */}
                {!loading && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="ns-card p-4 border-l-4 border-l-brand-500">
                            <p className="text-xs font-semibold text-brand-600">{t('duplicate_voters.duplicate_groups') || 'Duplicate Groups'}</p>
                            <p className="text-3xl font-black text-brand-600 mt-1">{filteredGroups.length}</p>
                        </div>
                        <div className="ns-card p-4 border-l-4 border-l-red-500">
                            <p className="text-xs font-semibold text-red-600">{t('duplicate_voters.total_affected') || 'Total Affected Voters'}</p>
                            <p className="text-3xl font-black text-red-600 mt-1">{totalDuplicates}</p>
                        </div>
                        <div className="ns-card p-4 border-l-4 border-l-slate-400 col-span-2 md:col-span-1">
                            <p className="text-xs font-semibold text-slate-500">{t('duplicate_voters.est_extra') || 'Est. Extra Records'}</p>
                            <p className="text-3xl font-black text-slate-700 mt-1">
                                {duplicateGroups.reduce((sum, g) => sum + (g.voters.length - 1), 0)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Search + Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={t('duplicate_voters.search_placeholder') || 'Search duplicate name groups...'}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="ns-input pl-9 w-full bg-white"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={expandAll} className="ns-btn-soft text-xs px-3 py-2">{t('duplicate_voters.expand_all') || 'Expand All'}</button>
                        <button onClick={collapseAll} className="ns-btn-ghost text-xs px-3 py-2">{t('duplicate_voters.collapse_all') || 'Collapse All'}</button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : filteredGroups.length === 0 ? (
                <div className="ns-card p-16 text-center border-dashed space-y-3">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                        <Users className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">
                        {searchTerm 
                            ? (t('duplicate_voters.no_matches') || 'No matches found') 
                            : (t('duplicate_voters.no_duplicates') || 'No Duplicate Voters Detected!')}
                    </h3>
                    <p className="text-sm text-slate-500">
                        {searchTerm
                            ? (t('duplicate_voters.search_fallback') || 'Try a different search term.')
                            : (t('duplicate_voters.clean_fallback') || 'All voter records appear to have unique names. Great job keeping the data clean!')}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredGroups.map(group => {
                        const isExpanded = expandedGroups.has(group.normalizedName);
                        const count = group.voters.length;
                        return (
                            <div
                                key={group.normalizedName}
                                className="ns-card overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Group Header */}
                                <button
                                    onClick={() => toggleGroup(group.normalizedName)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center border border-brand-100">
                                            <AlertTriangle className="w-4 h-4 text-brand-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">
                                                {isMr && group.voters.find(v => v.name_marathi)?.name_marathi
                                                    ? group.voters.find(v => v.name_marathi).name_marathi
                                                    : group.voters[0].name_english
                                                }
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {t('duplicate_voters.records_count', { count }) || `${count} records with this exact name`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs bg-brand-100 text-brand-700 font-bold px-2 py-0.5 rounded-full border border-brand-200">
                                            {t('duplicate_voters.duplicates_count', { count }) || `${count} duplicates`}
                                        </span>
                                        {isExpanded
                                            ? <ChevronUp className="w-4 h-4 text-slate-400" />
                                            : <ChevronDown className="w-4 h-4 text-slate-400" />
                                        }
                                    </div>
                                </button>

                                {/* Expanded Voter Cards */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 p-4 bg-slate-50/30">
                                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">
                                            {t('duplicate_voters.comparison_banner') || 'Side-by-Side Comparison — Keep the correct record, delete the duplicate'}
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {group.voters.map((voter, idx) => (
                                                <div
                                                    key={voter.id}
                                                    className={`relative bg-white border rounded-xl p-4 shadow-sm space-y-2 ${idx === 0 ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-200'}`}
                                                >
                                                    {idx === 0 && (
                                                        <div className="absolute top-3 right-3">
                                                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                                                                {t('duplicate_voters.first_record') || 'First Record'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <p className="font-bold text-slate-900 text-sm pr-16">
                                                        {language === 'mr' && voter.name_marathi ? voter.name_marathi : voter.name_english}
                                                    </p>
                                                    {language !== 'mr' && voter.name_marathi && (
                                                        <p className="text-xs text-slate-500">{voter.name_marathi}</p>
                                                    )}
                                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600 border-t border-slate-50 pt-2 mt-2">
                                                        <div>
                                                            <span className="text-slate-400 font-semibold">{t('duplicate_voters.epic_no') || 'EPIC No'}</span>
                                                            <p className="font-mono font-bold text-slate-800">{voter.epic_no || '—'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 font-semibold">{t('duplicate_voters.serial_no') || 'Serial No'}</span>
                                                            <p className="font-bold text-slate-800">{voter.serial_no || '—'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 font-semibold">{t('duplicate_voters.age') || 'Age'}</span>
                                                            <p className="font-bold text-slate-800">{voter.age || '—'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 font-semibold">{t('duplicate_voters.gender') || 'Gender'}</span>
                                                            <p className="font-bold text-slate-800">
                                                                {voter.gender === 'M' 
                                                                    ? (t('duplicate_voters.male') || 'Male') 
                                                                    : voter.gender === 'F' 
                                                                        ? (t('duplicate_voters.female') || 'Female') 
                                                                        : voter.gender || '—'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 font-semibold">{t('duplicate_voters.ward') || 'Ward'}</span>
                                                            <p className="font-bold text-slate-800">{voter.ward_no || '—'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 font-semibold">{t('duplicate_voters.booth_part') || 'Booth/Part'}</span>
                                                            <p className="font-bold text-slate-800">{voter.part_no || '—'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 font-semibold">{t('duplicate_voters.house_no') || 'House No'}</span>
                                                            <p className="font-bold text-slate-800">{voter.house_no || '—'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 font-semibold">{t('duplicate_voters.mobile') || 'Mobile'}</span>
                                                            <p className="font-bold text-slate-800">{voter.mobile || '—'}</p>
                                                        </div>
                                                    </div>
                                                    {isMr ? (
                                                        voter.address_marathi && (
                                                            <p className="text-[10px] text-slate-400 border-t border-slate-50 pt-2 line-clamp-2">
                                                                📍 {voter.address_marathi}
                                                            </p>
                                                        )
                                                    ) : (
                                                        voter.address_english && (
                                                            <p className="text-[10px] text-slate-400 border-t border-slate-50 pt-2 line-clamp-2">
                                                                📍 {voter.address_english}
                                                            </p>
                                                        )
                                                    )}

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-2 pt-2 border-t border-slate-50">
                                                        <button
                                                            onClick={() => navigate(`/dashboard/voters/${voter.id}`)}
                                                            className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 px-2 rounded-lg border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700 transition-colors"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                            {t('duplicate_voters.view_profile') || 'View Profile'}
                                                        </button>
                                                        {idx !== 0 && (
                                                            <button
                                                                onClick={() => setConfirmDeleteId(voter.id)}
                                                                className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 px-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors font-semibold"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                                {t('duplicate_voters.delete_duplicate') || 'Delete Duplicate'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Confirm Delete Modal */}
            {confirmDeleteId && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl space-y-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <AlertTriangle className="w-6 h-6 text-rose-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">{t('duplicate_voters.delete_modal_title') || 'Delete Duplicate Record?'}</h3>
                            <p className="text-slate-500 mt-2 text-sm">
                                {t('duplicate_voters.delete_modal_desc') || 'This will permanently delete this voter record. This action cannot be undone. Make sure you are deleting the correct duplicate.'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium text-sm"
                            >
                                {t('duplicate_voters.cancel') || 'Cancel'}
                            </button>
                            <button
                                onClick={() => handleDeleteVoter(confirmDeleteId)}
                                disabled={deletingId === confirmDeleteId}
                                className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium text-sm disabled:opacity-60"
                            >
                                {deletingId === confirmDeleteId 
                                    ? (t('duplicate_voters.deleting') || 'Deleting...') 
                                    : (t('duplicate_voters.delete_confirm_btn') || 'Yes, Delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DuplicateVoters;
