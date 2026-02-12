import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Search, FileText, ChevronRight, Info, Sparkles, RefreshCw, Plus, Filter, Trash2, Edit, Newspaper } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import SchemeMatcher from './SchemeMatcher';
import SchemeApplicationModal from './SchemeApplicationModal';
import SchemeBeneficiaryList from './SchemeBeneficiaryList';
import clsx from 'clsx';
import { TranslatedText } from '../../components/TranslatedText';

interface Scheme {
    id: number;
    name: string;
    description: string;
    eligibility: string;
    benefits: string;
    documents: string;
}

const SchemeList = () => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant(); // Added tenantId
    const navigate = useNavigate();
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedScheme, setExpandedScheme] = useState<number | null>(null);
    const [showMatcher, setShowMatcher] = useState(false);
    const [filteredSchemes, setFilteredSchemes] = useState<number[] | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [deleteTarget, setDeleteTarget] = useState<Scheme | null>(null);
    const [applyingScheme, setApplyingScheme] = useState<Scheme | null>(null);
    const [showApplications, setShowApplications] = useState(false);

    // Helper to split "English / Marathi" text based on current language
    const getLocalizedData = (text: string) => {
        if (!text) return text;

        // 1. Try strict separator first
        const parts = text.split(' / ');
        if (parts.length === 2) {
            return language === 'mr' ? parts[1] : parts[0];
        }

        // 2. Fallback: Detect Devanagari script for mixed content (e.g. "English. मराठी")
        const hasDevanagari = /[\u0900-\u097F]/.test(text);

        if (hasDevanagari) {
            if (language === 'mr') {
                // Extract the Marathi part (starting from first Devanagari char)
                const match = text.match(/[\u0900-\u097F].*/s);
                return match ? match[0] : text;
            } else {
                // Extract English part (everything before the first Devanagari char)
                const split = text.split(/[\u0900-\u097F]/);
                return split[0].trim().replace(/[./]*$/, ''); // removing trailing punctuation
            }
        }

        return text;
    };

    const categories = [
        { id: 'All', label: t('common.All') || 'All' },
        { id: 'Women', label: t('common.Women') || 'Women', keywords: ['women', 'mahila', 'girl', 'lady', 'widow', 'wife', 'female', 'महिला', 'विधवा', 'पत्नी', 'मुली'] },
        { id: 'Student', label: t('common.Student') || 'Student', keywords: ['student', 'education', 'scholarship', 'school', 'college', 'vidyarthi', 'विद्यार्थी', 'शिक्षण', 'शिष्यवृत्ती', 'शाळा', 'महाविद्यालय'] },
        { id: 'Senior Citizen', label: t('common.Senior Citizen') || 'Senior Citizen', keywords: ['senior', 'pension', 'old', 'age', 'vrrudh', 'jeyshtha', 'ज्येष्ठ', 'नागरिक', 'पेन्शन', 'वृद्ध'] },
        { id: 'Farmer', label: t('common.Farmer') || 'Farmer', keywords: ['farmer', 'agriculture', 'kisan', 'crop', 'shetkari', 'शेतकरी', 'कृषी', 'पीक'] },
        { id: 'Health', label: t('common.Health') || 'Health', keywords: ['health', 'medical', 'treatment', 'hospital', 'insurance', 'aarogya', 'आरोग्य', 'वैद्यकीय', 'उपचार', 'रुग्णालय', 'विमा'] },
        { id: 'Youth', label: t('common.Youth') || 'Youth', keywords: ['youth', 'employment', 'job', 'skill', 'training', 'tarun', 'युवक', 'रोजगार', 'नोकरी', 'कौशल्य', 'प्रशिक्षण', 'तरुण'] },
        { id: 'Housing', label: t('common.Housing') || 'Housing', keywords: ['housing', 'home', 'house', 'awas', 'gharkul', 'घरकुल', 'आवास', 'घर'] },
    ];

    useEffect(() => {
        const fetchSchemes = async () => {
            try {
                const { data, error } = await supabase
                    .from('schemes')
                    .select('*')
                    .eq('tenant_id', tenantId) // Secured
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setSchemes(data || []);
            } catch (err) {
                console.error('Error fetching schemes:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSchemes();
    }, []);

    const schemesToDisplay = schemes.filter(s => {
        const matchesFilter = filteredSchemes ? filteredSchemes.includes(s.id) : true;

        if (!searchQuery) return matchesFilter;

        const term = searchQuery.toLowerCase();
        // Search in both parts if possible, but for now searching the raw text is safer to find matches in either lang
        const matchesSearch =
            s.name.toLowerCase().includes(term) ||
            s.description.toLowerCase().includes(term) ||
            s.benefits.toLowerCase().includes(term);

        let matchesCategory = true;
        if (activeCategory !== 'All') {
            const category = categories.find(c => c.id === activeCategory);
            if (category && category.keywords) {
                const combinedText = `${s.name} ${s.description} ${s.eligibility} ${s.benefits}`.toLowerCase();
                matchesCategory = category.keywords.some(keyword => combinedText.includes(keyword));
            }
        }

        return matchesFilter && matchesSearch && matchesCategory;
    });

    const toggleScheme = (id: number) => {
        if (expandedScheme === id) {
            setExpandedScheme(null);
        } else {
            setExpandedScheme(id);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            const { error } = await supabase
                .from('schemes')
                .delete()
                .eq('id', deleteTarget.id)
                .eq('tenant_id', tenantId); // Secured

            if (error) throw error;

            setSchemes(prev => prev.filter(s => s.id !== deleteTarget.id));
            toast.success(t('Scheme deleted successfully') || 'Scheme deleted successfully');
            setDeleteTarget(null);
        } catch (err) {
            console.error('Error deleting scheme:', err);
            toast.error(t('Failed to delete scheme') || 'Failed to delete scheme');
        }
    };

    return (
        <div className="space-y-6">
            {/* Sticky Header Section */}
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 -mx-4 px-4 sm:-mx-8 sm:px-8 border-b border-slate-200/60 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-50 rounded-xl border border-brand-100 hidden sm:flex">
                            <Newspaper className="w-6 h-6 text-brand-700" />
                        </div>
                        <div className="border-l-4 border-brand-600 pl-3 md:border-l-0 md:pl-0">
                            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{t('schemes.title')}</h1>
                            <p className="text-sm text-slate-500 mt-0.5">{t('schemes.subtitle')}</p>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 border-b border-slate-200">
                    <button
                        onClick={() => setShowApplications(false)}
                        className={`px-6 py-3 font-semibold transition border-b-2 ${!showApplications
                            ? 'border-brand-600 text-brand-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {t('schemes.schemes_tab')} ({schemesToDisplay.length})
                    </button>
                    <button
                        onClick={() => setShowApplications(true)}
                        className={`px-6 py-3 font-semibold transition border-b-2 ${showApplications
                            ? 'border-brand-600 text-brand-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {t('schemes.applications_tab')}
                    </button>
                </div>

                {/* Filters - Only show for Schemes tab */}
                {!showApplications && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            {/* Category Filters */}
                            <div className="flex overflow-x-auto space-x-2 pb-1 scrollbar-hide w-full sm:w-auto sm:flex-1 sm:mr-4">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={clsx(
                                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors",
                                            activeCategory === cat.id
                                                ? "bg-brand-600 text-white border-brand-600"
                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                        )}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-3 w-full sm:w-auto">
                                <button
                                    onClick={() => {
                                        if (filteredSchemes) {
                                            setFilteredSchemes(null);
                                        } else {
                                            setShowMatcher(true);
                                        }
                                    }}
                                    className={`flex-1 sm:flex-none ${filteredSchemes ? "ns-btn-ghost border border-slate-200" : "ns-btn-primary"}`}
                                >
                                    {filteredSchemes ? (
                                        <>
                                            <RefreshCw className="w-4 h-4" /> {t('schemes.show_all')}
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" /> {t('schemes.find_schemes')}
                                        </>
                                    )}
                                </button>
                                <Link
                                    to="/schemes/new"
                                    className="ns-btn-primary flex-1 sm:flex-none"
                                >
                                    <Plus className="w-4 h-4" /> {t('schemes.add_scheme')}
                                </Link>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder={t('schemes.search_placeholder')}
                                className="ns-input pl-10 py-3 bg-white shadow-sm w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {showApplications ? (
                <SchemeBeneficiaryList />
            ) : loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="ns-card p-6">
                            <div className="flex justify-between items-center">
                                <div className="flex items-start gap-4 w-full">
                                    <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                                        <div className="w-6 h-6 bg-slate-200 rounded animate-pulse" />
                                    </div>
                                    <div className="space-y-2 w-full max-w-lg">
                                        <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse" />
                                        <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                                    </div>
                                </div>
                                <div className="w-5 h-5 bg-slate-200 rounded-full animate-pulse shrink-0 ml-4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid gap-4">
                    {schemesToDisplay.map((scheme) => (
                        <div key={scheme.id} className="ns-card overflow-hidden hover:shadow-md transition">
                            <div
                                className="p-6 cursor-pointer flex justify-between items-center"
                                onClick={() => toggleScheme(scheme.id)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-brand-50 text-brand-700 rounded-xl border border-brand-100">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">{getLocalizedData(scheme.name)}</h3>
                                        <p className="text-slate-500 text-sm mt-1">{getLocalizedData(scheme.description)}</p>
                                    </div>
                                </div>
                                <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedScheme === scheme.id ? 'rotate-90' : ''}`} />
                            </div>

                            {/* Expanded Details */}
                            {expandedScheme === scheme.id && (
                                <div className="px-6 pb-6 pt-0 ml-16 space-y-4 border-t border-slate-200/70 mt-2">
                                    <div className="grid md:grid-cols-3 gap-6 pt-4">
                                        <div className="ns-card-muted p-4">
                                            <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                                <Info className="w-4 h-4 text-blue-500" /> {t('schemes.eligibility')}
                                            </h4>
                                            <p className="text-sm text-slate-600">{getLocalizedData(scheme.eligibility)}</p>
                                        </div>
                                        <div className="ns-card-muted p-4">
                                            <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                                <Info className="w-4 h-4 text-green-500" /> {t('schemes.benefits')}
                                            </h4>
                                            <p className="text-sm text-slate-600">{getLocalizedData(scheme.benefits)}</p>
                                        </div>
                                        <div className="ns-card-muted p-4">
                                            <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                                <Info className="w-4 h-4 text-orange-500" /> {t('schemes.documents')}
                                            </h4>
                                            <p className="text-sm text-slate-600">{getLocalizedData(scheme.documents)}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setApplyingScheme(scheme);
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors shadow-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            {t('schemes.apply')}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/schemes/edit/${scheme.id}`);
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                            {t('schemes.edit')}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteTarget(scheme);
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            {t('schemes.delete')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {schemesToDisplay.length === 0 && (
                        <div className="text-center py-12 text-slate-500 flex flex-col items-center justify-center ns-card border-dashed">
                            <p className="mb-4">{t('schemes.no_schemes')}</p>
                            <button
                                onClick={() => setShowMatcher(true)}
                                className="ns-btn-primary"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span>{t('schemes.find_schemes')}</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {showMatcher && (
                <SchemeMatcher
                    schemes={schemes}
                    onClose={() => setShowMatcher(false)}
                    onMatch={(ids) => setFilteredSchemes(ids)}
                />
            )}

            {applyingScheme && (
                <SchemeApplicationModal
                    scheme={applyingScheme}
                    onClose={() => setApplyingScheme(null)}
                    onSuccess={() => {
                        // Optional: Refresh some stats or show success confetti
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-sm overflow-hidden p-6 space-y-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">{t('schemes.delete_confirm_title')}</h3>
                            <p className="text-slate-500 mt-2 text-sm">
                                {t('schemes.delete_confirm_msg')}
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                            >
                                {t('schemes.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchemeList;
