/**
 * Politician Daily Tasks & Team Status Handler
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

/**
 * 1. Fetch Today's Tasks
 */
async function getTodayTasks(tenantId, lang = 'mr') {
    try {
        const todayYMD = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('tenant_id', tenantId)
            .or(`due_date.eq.${todayYMD},created_at.gte.${todayYMD}T00:00:00.000Z`)
            .order('priority', { ascending: false })
            .limit(10);

        if (error) {
            console.warn('[TaskHandler] Query notice:', error.message);
        }

        if (!data || data.length === 0) {
            return `📌 *आजचे कामकाज (Today's Tasks)*\n\nℹ️ आजसाठी कोणतेही नवीन कामकाज प्रलंबित नाही.\n\n9️⃣ मुख्य मेनू`;
        }

        let text = `📌 *आजचे कामकाज (${data.length} कामे)*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        data.forEach((t, i) => {
            const pBadge = t.priority === 'High' ? '🚨' : (t.priority === 'Medium' ? '🟡' : '🟢');
            text += `*${i + 1}. ${t.title}* ${pBadge} [${t.status || 'Pending'}]\n`;
            if (t.description) text += `   📝 ${t.description}\n`;
            if (t.assigned_to) text += `   👤 नेमणूक: ${t.assigned_to}\n`;
            if (t.address) text += `   📍 ठिकाण: ${t.address}\n`;
            text += `\n`;
        });
        text += `━━━━━━━━━━━━━━━━━━━━━\n_9️⃣ मुख्य मेनू_`;
        return text;
    } catch (err) {
        console.error('[TaskHandler] Today tasks error:', err);
        return `❌ माहिती मिळवण्यात अडचण आली.`;
    }
}

/**
 * 2. Fetch Overdue Tasks
 */
async function getOverdueTasks(tenantId, lang = 'mr') {
    try {
        const todayYMD = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('tenant_id', tenantId)
            .lt('due_date', todayYMD)
            .neq('status', 'Completed')
            .order('due_date', { ascending: true })
            .limit(10);

        if (!data || data.length === 0) {
            return `⏳ *मुदत संपलेली कामे (Overdue Tasks)*\n\n✅ कोणतीही मुदत संपलेली कामे प्रलंबित नाहीत. उत्कृष्ट!\n\n9️⃣ मुख्य मेनू`;
        }

        let text = `⏳ *मुदत संपलेली प्रलंबित कामे (${data.length})*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        data.forEach((t, i) => {
            text += `*${i + 1}. ${t.title}* (मुदत: ${formatDateDisplay(t.due_date)})\n`;
            if (t.assigned_to) text += `   👤 जबाबदार व्यक्ती: ${t.assigned_to}\n`;
            if (t.description) text += `   📝 तपशील: ${t.description}\n\n`;
        });
        text += `━━━━━━━━━━━━━━━━━━━━━\n_9️⃣ मुख्य मेनू_`;
        return text;
    } catch (err) {
        console.error('[TaskHandler] Overdue tasks error:', err);
        return `❌ माहिती मिळवण्यात अडचण आली.`;
    }
}

/**
 * 3. Fetch Staff / Team Workload Status
 */
async function getTeamStatus(tenantId, lang = 'mr') {
    try {
        const { data: staffList, error } = await supabase
            .from('staff')
            .select('id, name, mobile, role, category')
            .eq('tenant_id', tenantId)
            .limit(15);

        if (error || !staffList || staffList.length === 0) {
            return `👥 *माझी टीम (My Team)*\n\nℹ️ कोणतीही टीम माहिती उपलब्ध नाही.\n\n9️⃣ मुख्य मेनू`;
        }

        let text = `👥 *कार्यालयीन टीम व कार्यकर्ते (${staffList.length} सदस्य)*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        staffList.forEach((s, i) => {
            text += `*${i + 1}. ${s.name}*\n`;
            text += `   👔 पद/भूमिका: ${s.role || 'कार्यकर्ता'}\n`;
            if (s.mobile) text += `   📱 ${s.mobile}\n`;
            text += `\n`;
        });
        text += `━━━━━━━━━━━━━━━━━━━━━\n_9️⃣ मुख्य मेनू_`;
        return text;
    } catch (err) {
        console.error('[TaskHandler] Team status error:', err);
        return `❌ माहिती मिळवण्यात अडचण आली.`;
    }
}

module.exports = {
    getTodayTasks,
    getOverdueTasks,
    getTeamStatus
};
