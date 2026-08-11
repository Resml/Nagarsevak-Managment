/**
 * Politician Complaint Overview Handler
 * Handles real-time pending complaints, urgent issues, resolved counts, and stats.
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
 * 1. Fetch Pending Complaints
 */
async function getPendingComplaints(tenantId, lang = 'mr') {
    try {
        const { data, error } = await supabase
            .from('complaints')
            .select('id, problem, category, priority, status, created_at, location, user_name, user_id')
            .eq('tenant_id', tenantId)
            .neq('status', 'Resolved')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        if (!data || data.length === 0) {
            return `📝 *प्रलंबित तक्रारी (Pending Complaints)*\n\n🎉 अभिनंदन! कार्यालयात एकही तक्रार प्रलंबित नाही. सर्व तक्रारी मार्गी लागल्या आहेत.\n\n9️⃣ मुख्य मेनू`;
        }

        let text = `📝 *प्रलंबित तक्रारी (${data.length} नोंदी)*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        data.forEach((c, index) => {
            const dateStr = formatDateDisplay(c.created_at);
            const pBadge = (c.priority === 'High' || c.priority === 'उच्च') ? '🚨 *तातडीची*' : '🟡 सामान्य';
            const name = c.user_name || 'नागरिक';
            const loc = c.location ? `📍 ${c.location}` : '';

            text += `*${index + 1}. तक्रार #${c.id}* [${pBadge}]\n`;
            text += `   👤 *नागरिक:* ${name} (📅 ${dateStr})\n`;
            text += `   📌 *प्रकार:* ${c.category || 'सर्वसाधारण'}\n`;
            text += `   📝 *समस्या:* ${c.problem || 'तपशील नाही'}\n`;
            if (loc) text += `   ${loc}\n`;
            text += `\n`;
        });

        text += `━━━━━━━━━━━━━━━━━━━━━\n_9️⃣ मुख्य मेनू_`;
        return text;
    } catch (err) {
        console.error('[ComplaintHandler] Pending error:', err);
        return `❌ माहिती मिळवण्यात अडचण आली.`;
    }
}

/**
 * 2. Fetch Resolved Today Complaints
 */
async function getResolvedTodayComplaints(tenantId, lang = 'mr') {
    try {
        const todayYMD = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('complaints')
            .select('id, problem, category, user_name, updated_at')
            .eq('tenant_id', tenantId)
            .eq('status', 'Resolved')
            .gte('updated_at', `${todayYMD}T00:00:00.000Z`)
            .order('updated_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        if (!data || data.length === 0) {
            return `✅ *आज सोडवलेल्या तक्रारी (Resolved Today)*\n\nℹ️ आज अजून एकही तक्रार सोडवलेली नोंदवली गेलेली नाही.\n\n9️⃣ मुख्य मेनू`;
        }

        let text = `✅ *आज सोडवलेल्या तक्रारी (${data.length})*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        data.forEach((c, index) => {
            text += `*${index + 1}. तक्रार #${c.id}* - ${c.category || 'काम'}\n`;
            text += `   👤 नागरिक: ${c.user_name || 'नागरिक'}\n`;
            text += `   📝 समस्या: ${c.problem || ''}\n\n`;
        });
        text += `━━━━━━━━━━━━━━━━━━━━━\n_9️⃣ मुख्य मेनू_`;
        return text;
    } catch (err) {
        console.error('[ComplaintHandler] Resolved error:', err);
        return `❌ माहिती मिळवण्यात अडचण आली.`;
    }
}

/**
 * 3. Fetch Urgent / High Priority Complaints
 */
async function getUrgentComplaints(tenantId, lang = 'mr') {
    try {
        const { data, error } = await supabase
            .from('complaints')
            .select('id, problem, category, status, created_at, location, user_name')
            .eq('tenant_id', tenantId)
            .neq('status', 'Resolved')
            .or('priority.ilike.High,priority.ilike.Urgent,priority.ilike.उच्च')
            .order('created_at', { ascending: true })
            .limit(10);

        if (error) throw error;

        if (!data || data.length === 0) {
            return `🚨 *तातडीच्या तक्रारी (Urgent Complaints)*\n\n✅ कोणतीही तातडीची / हाय प्रायोरिटी तक्रार प्रलंबित नाही.\n\n9️⃣ मुख्य मेनू`;
        }

        let text = `🚨 *तातडीच्या / हाय प्रायोरिटी तक्रारी (${data.length})*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        data.forEach((c, index) => {
            const dateStr = formatDateDisplay(c.created_at);
            text += `*${index + 1}. #${c.id} - ${c.category || 'तक्रार'}* (📅 ${dateStr})\n`;
            text += `   👤 ${c.user_name || 'नागरिक'}\n`;
            text += `   📝 ${c.problem || ''}\n`;
            if (c.location) text += `   📍 ${c.location}\n`;
            text += `\n`;
        });
        text += `━━━━━━━━━━━━━━━━━━━━━\n_9️⃣ मुख्य मेनू_`;
        return text;
    } catch (err) {
        console.error('[ComplaintHandler] Urgent error:', err);
        return `❌ माहिती मिळवण्यात अडचण आली.`;
    }
}

/**
 * 4. Complaints Breakdown Statistics
 */
async function getComplaintsStats(tenantId, lang = 'mr') {
    try {
        const [totalRes, pendingRes, inProgRes, resolvedRes] = await Promise.all([
            supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
            supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'Pending'),
            supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'In Progress'),
            supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'Resolved')
        ]);

        const total = totalRes.count || 0;
        const pending = pendingRes.count || 0;
        const inProg = inProgRes.count || 0;
        const resolved = resolvedRes.count || 0;

        let text = `📊 *तक्रार निवारण सांख्यिकी*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        text += `📈 *एकूण नोंदवलेल्या तक्रारी:* ${total}\n`;
        text += `🔴 *प्रलंबित (Pending):* ${pending}\n`;
        text += `🟡 *सुरू असलेले काम (In Progress):* ${inProg}\n`;
        text += `🟢 *सोडवलेल्या (Resolved):* ${resolved}\n`;

        if (total > 0) {
            const rate = Math.round((resolved / total) * 100);
            text += `\n🎯 *निवारण दर (Resolution Rate):* ${rate}%\n`;
        }

        text += `\n━━━━━━━━━━━━━━━━━━━━━\n_9️⃣ मुख्य मेनू_`;
        return text;
    } catch (err) {
        console.error('[ComplaintHandler] Stats error:', err);
        return `❌ सांख्यिकी मिळवण्यात अडचण आली.`;
    }
}

module.exports = {
    getPendingComplaints,
    getResolvedTodayComplaints,
    getUrgentComplaints,
    getComplaintsStats
};
