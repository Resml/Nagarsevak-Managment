import { supabase } from './supabaseClient';
import { type ElectionResult } from '../types';

const RESULT_STORAGE_KEY = 'ns_election_results';

export const ResultService = {
    getResults: async (ward?: string): Promise<ElectionResult[]> => {
        try {
            console.log('[ResultService] Fetching election results from database...');
            let query = supabase.from('election_results').select('*');
            if (ward) {
                query = query.eq('ward_name', ward);
                console.log(`[ResultService] Filtering by ward: ${ward}`);
            }

            const { data, error } = await query;

            if (error) {
                console.error('[ResultService] Database error:', error);
                throw error;
            }

            console.log(`[ResultService] Database returned ${data?.length || 0} results`);

            // If we got data from the database, use it!
            if (data && data.length > 0) {
                console.log('[ResultService] Using database results');
                return data.map((row: any) => ({
                    id: row.id,
                    wardName: row.ward_name,
                    boothNumber: row.booth_number,
                    boothName: row.booth_name,
                    totalVoters: row.total_voters,
                    totalVotesCasted: row.total_votes_casted,
                    candidateVotes: row.candidate_votes,
                    winner: row.winner,
                    margin: row.margin,
                    createdAt: row.created_at
                }));
            }

            // Only check localStorage if database is empty
            console.log('[ResultService] No database results, checking localStorage...');
            const stored = JSON.parse(localStorage.getItem(RESULT_STORAGE_KEY) || '[]');
            if (stored.length > 0) {
                console.log('[ResultService] Using localStorage data');
                return filterResults(stored, ward);
            }

            // No data available
            console.log('[ResultService] No data available anywhere');
            return [];

        } catch (e) {
            console.error('[ResultService] Exception in getResults:', e);

            // Try localStorage as last resort
            const stored = JSON.parse(localStorage.getItem(RESULT_STORAGE_KEY) || '[]');
            if (stored.length > 0) {
                console.log('[ResultService] Exception - using localStorage data');
                return filterResults(stored, ward);
            }

            // Return empty array instead of dummy data
            console.log('[ResultService] Exception - returning empty array');
            return [];
        }
    },
};

const filterResults = (items: ElectionResult[], ward?: string) => {
    if (!ward) return items;
    return items.filter(i => i.wardName === ward);
};
