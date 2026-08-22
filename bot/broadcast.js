const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function broadcastEvent(sock, eventId, tenantId) {
    try {
        console.log(`Starting broadcast for Event ID: ${eventId}, Tenant ID: ${tenantId}`);

        if (!eventId || !tenantId) {
            console.error('Missing eventId or tenantId for broadcast');
            return { success: false, message: 'Missing parameters' };
        }

        // 1. Fetch Event Details (Scoping by tenant_id)
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .eq('tenant_id', tenantId)
            .single();

        if (eventError || !event) {
            console.error('Event not found or unauthorized:', eventError);
            return { success: false, message: 'Event not found or unauthorized' };
        }

        // 2. Fetch Recipients (Voters + Non-Voters with mobile numbers)
        const { data: voters } = await supabase
            .from('voters')
            .select('mobile, name_english')
            .eq('tenant_id', tenantId)
            .not('mobile', 'is', null);

        const { data: nonVoters } = await supabase
            .from('non_voters')
            .select('mobile, name')
            .eq('tenant_id', tenantId)
            .not('mobile', 'is', null);

        // Combine and Deduplicate
        const recipients = new Map();

        voters?.forEach(v => {
            if (v.mobile && v.mobile.length >= 10) recipients.set(v.mobile, v.name_english);
        });

        nonVoters?.forEach(v => {
            if (v.mobile && v.mobile.length >= 10) recipients.set(v.mobile, v.name);
        });

        console.log(`Found ${recipients.size} unique recipients.`);

        // 3. Prepare Message
        const messageText = `📢 *New Event Announcement!* 📢\n\n` +
            `*${event.title}*\n\n` +
            `📅 *Date:* ${event.event_date}\n` +
            `⏰ *Time:* ${event.event_time}\n` +
            `📍 *Location:* ${event.location}\n\n` +
            `${event.description}\n\n` +
            `_You are receiving this update from your Nagar Sevak Office._`;

        // 4. Send with Delay (Broadcasting)
        let count = 0;
        for (const [mobile, name] of recipients) {
            try {
                // Format Number (Assume IN +91 if missing)
                let number = mobile.replace(/\D/g, '');
                if (number.length === 10) number = '91' + number;
                const jid = number.includes('@') ? number : number + "@s.whatsapp.net";

                console.log(`Sending to ${name} (${number})...`);
                await sock.sendMessage(jid, { text: messageText });

                count++;

                // SAFETY DELAY: 2 to 5 seconds random delay
                const delay = Math.floor(Math.random() * 3000) + 2000;
                await sleep(delay);

            } catch (sendError) {
                console.error(`Failed to send to ${mobile}:`, sendError.message);
            }
        }

        return { success: true, count: count };

    } catch (err) {
        console.error('Broadcast failed:', err);
        return { success: false, error: err.message };
    }
}

module.exports = {
    broadcastEvent
};
