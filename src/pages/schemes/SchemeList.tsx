import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Search, FileText, ChevronRight, Info, Sparkles, RefreshCw, Plus, Filter, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../context/LanguageContext';
import SchemeMatcher from './SchemeMatcher';
import clsx from 'clsx';

interface Scheme {

    id: number;
    name: string;
    description: string;
    eligibility: string;
    benefits: string;
    documents: string;
}

const SchemeList = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedScheme, setExpandedScheme] = useState<number | null>(null);
    const [showMatcher, setShowMatcher] = useState(false);
    const [filteredSchemes, setFilteredSchemes] = useState<number[] | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [deleteTarget, setDeleteTarget] = useState<Scheme | null>(null);

    const categories = [
        { id: 'All', label: t('All') || 'All' },
        { id: 'Women', label: t('Women') || 'Women', keywords: ['women', 'mahila', 'girl', 'lady', 'widow', 'wife', 'female'] },
        { id: 'Student', label: t('Student') || 'Student', keywords: ['student', 'education', 'scholarship', 'school', 'college', 'vidyarthi'] },
        { id: 'Senior Citizen', label: t('Senior Citizen') || 'Senior Citizen', keywords: ['senior', 'pension', 'old', 'age', 'vrrudh'] },
        { id: 'Farmer', label: t('Farmer') || 'Farmer', keywords: ['farmer', 'agriculture', 'kisan', 'crop', 'shetkari'] },
        { id: 'Health', label: t('Health') || 'Health', keywords: ['health', 'medical', 'treatment', 'hospital', 'insurance', 'aarogya'] },
        { id: 'Youth', label: t('Youth') || 'Youth', keywords: ['youth', 'employment', 'job', 'skill', 'training', 'tarun'] },
        { id: 'Housing', label: t('Housing') || 'Housing', keywords: ['housing', 'home', 'house', 'awas', 'gharkul'] },
    ];

    useEffect(() => {
        const fetchSchemes = async () => {
            try {
                const { data, error } = await supabase
                    .from('schemes')
                    .select('*')
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
                .eq('id', deleteTarget.id);

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
            <div className="sticky top-0 z-10 bg-slate-50 pt-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{t('schemes.title')}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-slate-500">{t('schemes.subtitle')}</p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                                Found: {schemesToDisplay.length}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                if (filteredSchemes) {
                                    setFilteredSchemes(null);
                                } else {
                                    setShowMatcher(true);
                                }
                            }}
                            className={filteredSchemes ? "ns-btn-ghost border border-slate-200" : "ns-btn-primary"}
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
                            className="ns-btn-primary"
                        >
                            <Plus className="w-4 h-4" /> {t('schemes.add_scheme')}
                        </Link>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t('schemes.search_placeholder')}
                            className="ns-input pl-10 py-3 bg-white shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Category Filters */}
                    <div className="flex overflow-x-auto space-x-2 pb-1 scrollbar-hide">
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
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="ns-card p-6 animate-pulse h-32"></div>
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
                                        <h3 className="text-lg font-semibold text-slate-900">{scheme.name}</h3>
                                        <p className="text-slate-500 text-sm mt-1">{scheme.description}</p>
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
                                            <p className="text-sm text-slate-600">{scheme.eligibility}</p>
                                        </div>
                                        <div className="ns-card-muted p-4">
                                            <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                                <Info className="w-4 h-4 text-green-500" /> {t('schemes.benefits')}
                                            </h4>
                                            <p className="text-sm text-slate-600">{scheme.benefits}</p>
                                        </div>
                                        <div className="ns-card-muted p-4">
                                            <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                                <Info className="w-4 h-4 text-orange-500" /> {t('schemes.documents')}
                                            </h4>
                                            <p className="text-sm text-slate-600">{scheme.documents}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/schemes/edit/${scheme.id}`);
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteTarget(scheme);
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
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

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-sm overflow-hidden p-6 space-y-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Delete Scheme?</h3>
                            <p className="text-slate-500 mt-2 text-sm">
                                Are you sure you want to delete <span className="font-semibold text-slate-900">{deleteTarget.name}</span>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchemeList;
