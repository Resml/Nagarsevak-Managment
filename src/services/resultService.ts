import { supabase } from './supabaseClient';
import { type ElectionResult } from '../types';

const RESULT_STORAGE_KEY = 'ns_election_results';

// Simulated Data for Prabhag 5 (A, B, C, D) based on common election structures
// Candidate: Mamit Chougale
const CANDIDATE_NAME = "Mamit Chougale";
const OPPONENT_1 = "Ramesh Patil"; // Dummy Opponent
const OPPONENT_2 = "Suresh Shinde"; // Dummy Opponent

const generateDummyData = (): ElectionResult[] => {
    const wards = ['Prabhag 5 A', 'Prabhag 5 B', 'Prabhag 5 C', 'Prabhag 5 D'];
    const results: ElectionResult[] = [];

    let idCounter = 1;

    wards.forEach(ward => {
        // Generate ~10 booths per ward
        for (let i = 1; i <= 10; i++) {
            const totalVoters = Math.floor(Math.random() * (1200 - 800) + 800); // 800-1200 voters
            const turnout = Math.floor(Math.random() * (0.7 - 0.5) + 0.5 * totalVoters); // 50-70% turnout

            // Randomly decide if Mamit wins or loses slightly in this booth
            // Let's make him win generally in A and B, mixed in C, lose in D for analysis variety
            let votesMamit = 0;
            if (ward.includes('A') || ward.includes('B')) {
                votesMamit = Math.floor(turnout * (Math.random() * (0.6 - 0.45) + 0.45)); // 45-60% votes
            } else {
                votesMamit = Math.floor(turnout * (Math.random() * (0.45 - 0.3) + 0.3)); // 30-45% votes
            }

            const remaining = turnout - votesMamit;
            const votesOpp1 = Math.floor(remaining * 0.7);
            const votesOpp2 = remaining - votesOpp1;

            const winner = votesMamit > votesOpp1 ? CANDIDATE_NAME : OPPONENT_1;
            const margin = Math.abs(votesMamit - votesOpp1);

            results.push({
                id: `res_${idCounter++}`,
                wardName: ward,
                boothNumber: `${i + (wards.indexOf(ward) * 100)}`, // 101, 201 etc logic roughly
                boothName: `Booth ${i} - School No ${i}`,
                totalVoters: totalVoters,
                totalVotesCasted: turnout,
                candidateVotes: {
                    [CANDIDATE_NAME]: votesMamit,
                    [OPPONENT_1]: votesOpp1,
                    [OPPONENT_2]: votesOpp2
                },
                winner: winner,
                margin: margin,
                createdAt: new Date().toISOString()
            });
        }
    });

    return results;
};

const DUMMY_RESULTS = generateDummyData();

export const ResultService = {
    getResults: async (ward?: string): Promise<ElectionResult[]> => {
        try {
            let query = supabase.from('election_results').select('*');
            if (ward) {
                query = query.eq('ward_name', ward);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (!data || data.length === 0) {
                const stored = JSON.parse(localStorage.getItem(RESULT_STORAGE_KEY) || '[]');
                if (stored.length > 0) return filterResults(stored, ward);
                // Fallback to our generated dummy data
                return filterResults(DUMMY_RESULTS, ward);
            }

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

        } catch (e) {
            const stored = JSON.parse(localStorage.getItem(RESULT_STORAGE_KEY) || '[]');
            if (stored.length > 0) return filterResults(stored, ward);
            return filterResults(DUMMY_RESULTS, ward);
        }
    },

    // Helper to allow user to adding real data later (skipped for now as we just need analysis view)
};

const filterResults = (items: ElectionResult[], ward?: string) => {
    if (!ward) return items;
    return items.filter(i => i.wardName === ward);
};
