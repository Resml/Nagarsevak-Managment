import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Search, FileText, ChevronRight, Info, Sparkles, RefreshCw } from 'lucide-react';
import SchemeMatcher from './SchemeMatcher';

interface Scheme {
    id: number;
    name: string;
    description: string;
    eligibility: string;
    benefits: string;
    documents: string;
}

const SchemeList = () => {
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedScheme, setExpandedScheme] = useState<number | null>(null);
    const [showMatcher, setShowMatcher] = useState(false);
    const [filteredSchemes, setFilteredSchemes] = useState<number[] | null>(null);

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

    const toggleScheme = (id: number) => {
        if (expandedScheme === id) {
            setExpandedScheme(null);
        } else {
            setExpandedScheme(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Government Schemes</h1>
                    <p className="text-sm text-gray-500">Information about active welfare schemes</p>
                </div>
                <button
                    onClick={() => {
                        if (filteredSchemes) {
                            setFilteredSchemes(null);
                        } else {
                            setShowMatcher(true);
                        }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition shadow-sm ${filteredSchemes
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-brand-600 text-white hover:bg-brand-700'
                        }`}
                >
                    {filteredSchemes ? (
                        <>
                            <RefreshCw className="w-4 h-4" /> Show All
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" /> Find Schemes for Me
                        </>
                    )}
                </button>
            </div>

            {showMatcher && (
                <SchemeMatcher
                    schemes={schemes}
                    onClose={() => setShowMatcher(false)}
                    onMatch={(ids) => setFilteredSchemes(ids)}
                />
            )}

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse h-32"></div>
                    ))}
                </div>
            ) : (
                <div className="grid gap-4">
                    {schemes
                        .filter(s => filteredSchemes ? filteredSchemes.includes(s.id) : true)
                        .map((scheme) => (
                            <div key={scheme.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition">
                                <div
                                    className="p-6 cursor-pointer flex justify-between items-center"
                                    onClick={() => toggleScheme(scheme.id)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-brand-50 text-brand-600 rounded-lg">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{scheme.name}</h3>
                                            <p className="text-gray-500 text-sm mt-1">{scheme.description}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedScheme === scheme.id ? 'rotate-90' : ''}`} />
                                </div>

                                {/* Expanded Details */}
                                {expandedScheme === scheme.id && (
                                    <div className="px-6 pb-6 pt-0 ml-16 space-y-4 border-t border-gray-100 mt-2">
                                        <div className="grid md:grid-cols-3 gap-6 pt-4">
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                                                    <Info className="w-4 h-4 text-blue-500" /> Eligibility
                                                </h4>
                                                <p className="text-sm text-gray-600">{scheme.eligibility}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                                                    <Info className="w-4 h-4 text-green-500" /> Benefits
                                                </h4>
                                                <p className="text-sm text-gray-600">{scheme.benefits}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                                                    <Info className="w-4 h-4 text-orange-500" /> Documents Required
                                                </h4>
                                                <p className="text-sm text-gray-600">{scheme.documents}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                    {schemes.filter(s => filteredSchemes ? filteredSchemes.includes(s.id) : true).length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No schemes found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SchemeList;
