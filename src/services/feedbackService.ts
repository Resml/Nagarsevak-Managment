import { supabase } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface FeedbackItem {
    id: string;
    work_id: string;
    rating: number;
    comment: string;
    citizen_name: string;
    created_at: string;
}

export interface FeedbackStats {
    average: string;
    count: number;
    items: FeedbackItem[];
}

export const FeedbackService = {
    // Fetch initial stats for a work item
    getFeedbackStats: async (workId: string): Promise<FeedbackStats> => {
        const { data, error } = await supabase
            .from('work_feedback')
            .select('*')
            .eq('work_id', workId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching feedback:', error);
            return { average: '0.0', count: 0, items: [] };
        }

        const items = data as FeedbackItem[];
        const count = items.length;
        const total = items.reduce((sum, item) => sum + item.rating, 0);
        const average = count > 0 ? (total / count).toFixed(1) : '0.0';

        return { average, count, items };
    },

    // Subscribe to new feedback for a specific work item or all
    subscribeToFeedback: (callback: (payload: any) => void): RealtimeChannel => {
        return supabase
            .channel('public:work_feedback')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'work_feedback' },
                (payload) => {
                    callback(payload);
                }
            )
            .subscribe();
    },

    // Simulate sending a broadcast and receiving responses
    broadcastFeedbackRequest: async (workId: string) => {
        // In a real scenario, this would call a WhatsApp API.
        // Here, we simulate citizens responding over time.

        const comments = [
            "Great work!", "Needs improvement.", "Happy with the progress.",
            "Took too long but looks good.", "Traffic issue resolved, thanks.",
            "Excellent quality.", "Please focus on maintenance too.",
            "Good initiative by Nagar Sevak."
        ];

        // Simulate 5-10 responses coming in over 10 seconds
        const responseCount = Math.floor(Math.random() * 5) + 5;

        for (let i = 0; i < responseCount; i++) {
            const delay = Math.random() * 10000; // Random delay up to 10s

            setTimeout(async () => {
                await supabase.from('work_feedback').insert({
                    work_id: workId,
                    rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars mostly
                    comment: comments[Math.floor(Math.random() * comments.length)],
                    citizen_name: `Citizen ${Math.floor(Math.random() * 1000)}`
                });
            }, delay);
        }
    }
};
