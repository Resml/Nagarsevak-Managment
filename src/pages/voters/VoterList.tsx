import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { type Voter } from '../../types';
import { supabase } from '../../services/supabaseClient';

const VoterList = () => {
    const navigate = useNavigate();
    const [voters, setVoters] = useState<Voter[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Debounce search
    useEffect(() => {
        setLoading(true);
        const fetchVoters = async () => {
            try {
                let query = supabase
                    .from('voters')
                    .select('*')
                    .limit(50); // Pagination limit

                if (searchTerm) {
                    // Search in multiple columns
                    query = query.or(`name_english.ilike.%${searchTerm}%,name_marathi.ilike.%${searchTerm}%,epic_no.ilike.%${searchTerm}%,mobile.eq.${searchTerm}`);
                }

                const { data, error } = await query;

                if (error) {
                    console.error('Error fetching voters:', error);
                    return;
                }

                // Map Supabase result to Voter type
                const mappedVoters: Voter[] = (data || []).map((row: any) => ({
                    id: row.id.toString(),
                    name: row.name_english || row.name_marathi, // Prefer English
                    age: row.age,
                    gender: row.gender,
                    address: row.address_english || row.address_marathi,
                    ward: row.ward_no || 'N/A',
                    booth: row.part_no?.toString() || 'N/A',
                    epicNo: row.epic_no,
                    mobile: row.mobile,
                    history: []
                }));

                setVoters(mappedVoters);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchVoters();
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Voter Search</h1>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by Name, EPIC, Address..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 animate-pulse">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3 w-full">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                <div className="h-3 bg-gray-200 rounded w-full"></div>
                                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {voters.map((voter) => (
                        <div
                            key={voter.id}
                            onClick={() => navigate(`/voters/${voter.id}`)}
                            className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                                        {voter.gender === 'F' ? '👩' : '👨'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{voter.name}</h3>
                                        <p className="text-xs text-gray-500">EPIC: {voter.epicNo}</p>
                                    </div>
                                </div>
                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                    Ward {voter.ward}
                                </span>
                            </div>

                            <div className="mt-4 space-y-2 text-sm text-gray-600">
                                <div className="flex items-start space-x-2">
                                    <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                                    <span className="truncate w-64">{voter.address}</span>
                                </div>
                                <div className="flex items-center space-x-2 pl-6 text-xs text-gray-500">
                                    <span>Booth: {voter.booth}</span>
                                    <span>•</span>
                                    <span>Age: {voter.age}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {!loading && voters.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            No voters found matching "{searchTerm}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VoterList;
