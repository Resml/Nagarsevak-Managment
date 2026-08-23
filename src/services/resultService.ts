import { supabase } from './supabaseClient';
import { type ElectionResult } from '../types';

export const ResultService = {
    getResults: async (tenantId: string, ward?: string): Promise<ElectionResult[]> => {
        if (!tenantId) {
            console.warn('[ResultService] No tenantId provided, returning empty results');
            return [];
        }

        try {
            console.log('[ResultService] Fetching election results from database...');
            let query = supabase.from('election_results').select('*').eq('tenant_id', tenantId);
            
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

            if (data && data.length > 0) {
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

            return [];
        } catch (e) {
            console.error('[ResultService] Exception in getResults:', e);
            return [];
        }
    },
};
