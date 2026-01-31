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
            name_english: row.name_english,
            name_marathi: row.name_marathi,
            age: row.age || 0,
            gender: row.gender || 'O',
            address: row.address_english || row.address_marathi || '',
            address_english: row.address_english,
            address_marathi: row.address_marathi,
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
            name_english: row.name_english,
            name_marathi: row.name_marathi,
            age: row.age || 0,
            gender: row.gender || 'O',
            address: row.address_english || row.address_marathi || '',
            address_english: row.address_english,
            address_marathi: row.address_marathi,
            ward: row.ward_no || '',
            booth: row.part_no?.toString() || '',
            epicNo: row.epic_no || '',
            mobile: row.mobile || undefined,
            history: []
        }));
    },

    getTotalCount: async (): Promise<number> => {
        const { count, error } = await supabase
            .from('voters')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Error getting total voter count:', error);
            return 0;
        }

        return count || 0;
    },

    getAllVoterPhones: async (): Promise<string[]> => {
        const { data, error } = await supabase
            .from('voters')
            .select('mobile')
            .not('mobile', 'is', null);

        if (error) {
            console.error('Error fetching voter phones:', error);
            return [];
        }

        return (data || []).map((row: any) => row.mobile).filter((m: any) => m);
    }
};
