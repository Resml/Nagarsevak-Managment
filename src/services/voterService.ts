import { supabase } from './supabaseClient';
import { type Voter } from '../types';

export const VoterService = {
    searchVoters: async (query: string): Promise<Voter[]> => {
        if (!query || query.length < 3) return [];

        const { data, error } = await supabase
            .from('voters')
            .select('*')
            .or(`name_english.ilike.%${query}%,epic_no.ilike.%${query}%,mobile.ilike.%${query}%`)
            .limit(20);

        if (error) {
            console.error('Error searching voters:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id.toString(),
            name: row.name_english || row.name_marathi || 'Unknown',
            age: row.age || 0,
            gender: row.gender || 'O',
            address: row.address_english || row.address_marathi || '',
            ward: row.ward_no || '',
            booth: row.part_no?.toString() || '',
            epicNo: row.epic_no || '',
            mobile: row.mobile || undefined,
            history: [] // History not loaded in search
        }));
    },

    // Fetch a few recent voters for default display
    getRecentVoters: async (): Promise<Voter[]> => {
        const { data, error } = await supabase
            .from('voters')
            .select('*')
            .limit(5);

        if (error) {
            console.error('Error fetching recent voters:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id.toString(),
            name: row.name_english || row.name_marathi || 'Unknown',
            age: row.age || 0,
            gender: row.gender || 'O',
            address: row.address_english || row.address_marathi || '',
            ward: row.ward_no || '',
            booth: row.part_no?.toString() || '',
            epicNo: row.epic_no || '',
            mobile: row.mobile || undefined,
            history: []
        }));
    }
};
