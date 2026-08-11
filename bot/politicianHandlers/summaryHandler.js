/**
 * Politician 360° Daily Executive Pulse Handler
 * Combines today's visitors, complaints, tasks, and events into a single executive briefing.
 */

const { supabase } = require('../supabaseClient');

function formatDateDisplay(isoString) {
    if (!isoString) return '';
    try {
        const d = new Date(isoString);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    } catch (e) {
        return '';
    }
}

async function get360ExecutiveSummary(tenantId, tenantName = 'मा. नगरसेवक', ward = '', lang = 'mr') {
    try {
        const todayYMD = new Date().toISOString().split('T')[0];
        const startOfDay = `${todayYMD}T00:00:00.000Z`;

        const [
            visitorsRes,
            pendingComplaintsRes,
            resolvedTodayRes,
            urgentComplaintsRes,
            incomingLettersRes,
            todayTasksRes,
            eventsRes
        ] = await Promise.all([
            // 1. Visitors Today
            supabase.from('visitors').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('visit_date', startOfDay),
            // 2. Pending Complaints
            supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).neq('status', 'Resolved'),
            // 3. Resolved Today
            supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'Resolved').gte('updated_at', startOfDay),
            // 4. Urgent Complaints
            supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).neq('status', 'Resolved').or('priority.ilike.High,priority.ilike.Urgent,priority.ilike.उच्च'),
            // 5. Incoming Letters
            supabase.from('incoming_letters').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('received_date', startOfDay),
            // 6. Today's Tasks
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).or(`due_date.eq.${todayYMD},created_at.gte.${startOfDay}`).neq('status', 'Completed'),
            // 7. Today's Events
            supabase.from('events').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('event_date', todayYMD)
        ]);

        const visitorsCount = visitorsRes.count || 0;
        const pendingCount = pendingComplaintsRes.count || 0;
        const resolvedCount = resolvedTodayRes.count || 0;
        const urgentCount = urgentComplaintsRes.count || 0;
        const lettersCount = incomingLettersRes.count || 0;
        const tasksCount = todayTasksRes.count || 0;
        const eventsCount = eventsRes.count || 0;

        let text = `🏛️ *${tenantName} कार्यालय - दैनिक 360° आढावा*\n`;
        if (ward) text += `📍 प्रभाग: *${ward}*\n`;
        text += `📅 दिनांक: *${formatDateDisplay(todayYMD)}*\n`;
        text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

        text += `👥 *आजचे भेट देणारे (Visitors):* ${visitorsCount} नागरिक\n`;
        text += `📝 *प्रलंबित तक्रारी:* ${pendingCount} ${urgentCount > 0 ? `(🚨 *${urgentCount} तातडीच्या*)` : ''}\n`;
        text += `✅ *आज सोडवलेल्या तक्रारी:* ${resolvedCount}\n`;
        text += `📥 *नवीन आलेली पत्रे:* ${lettersCount}\n`;
        text += `📌 *आजचे प्रलंबित कामकाज:* ${tasksCount}\n`;
        text += `🎉 *आजचे नियोजित कार्यक्रम:* ${eventsCount}\n\n`;

        text += `━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `_सविस्तर माहिती पाहण्यासाठी मुख्य मेनूतील क्रमांक निवडा._\n`;
        text += `_9️⃣ मुख्य मेनू_`;

        return text;
    } catch (err) {
        console.error('[SummaryHandler] Executive summary error:', err);
        return `❌ 360° आढावा मिळवण्यात अडचण आली.`;
    }
}

module.exports = {
    get360ExecutiveSummary
};
