/**
 * Politician Letter Management Handler
 * Handles incoming scanned letters, outgoing letters, and search.
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
 * 1. Fetch Incoming Letters
 */
async function getIncomingLetters(tenantId, lang = 'mr') {
    try {
        const { data, error } = await supabase
            .from('incoming_letters')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('received_date', { ascending: false })
            .limit(10);

        if (error) {
            // If table doesn't have tenant_id or empty, fallback gracefully
            console.warn('[LetterHandler] incoming_letters query notice:', error.message);
        }

        if (!data || data.length === 0) {
            return `📥 *नवीन आलेली पत्रे (Incoming Letters)*\n\nℹ️ कोणतीही नवीन आलेली पत्रे नोंदवलेली नाहीत.\n\n9️⃣ मुख्य मेनू`;
        }

        let text = `📥 *नवीन आलेली पत्रे (${data.length})*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        data.forEach((l, idx) => {
            const dateStr = formatDateDisplay(l.received_date || l.created_at);
            text += `*${idx + 1}. ${l.title || 'पत्र'}* (📅 ${dateStr})\n`;
            if (l.description) text += `   📝 विषय/तपशील: ${l.description}\n`;
            if (l.area) text += `   📍 परिसर: ${l.area}\n`;
            text += `\n`;
        });
        text += `━━━━━━━━━━━━━━━━━━━━━\n_9️⃣ मुख्य मेनू_`;
        return text;
    } catch (err) {
        console.error('[LetterHandler] Incoming error:', err);
        return `❌ पत्रे मिळवण्यात अडचण आली.`;
    }
}

/**
 * 2. Fetch Outgoing / Requested Letters
 */
async function getOutgoingLetters(tenantId, lang = 'mr') {
    try {
        const { data, error } = await supabase
            .from('letter_requests')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        if (!data || data.length === 0) {
            return `📤 *पाठवलेली / मागणी केलेली पत्रे*\n\nℹ️ कोणतीही पत्रे नोंदवलेली नाहीत.\n\n9️⃣ मुख्य मेनू`;
        }

        let text = `📤 *पत्रे व अर्ज (${data.length})*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        data.forEach((l, idx) => {
            const dateStr = formatDateDisplay(l.created_at);
            const status = l.status || 'Pending';
            text += `*${idx + 1}. ${l.letter_type || 'शिफारस पत्र'}* [${status}]\n`;
            text += `   👤 अर्जदार: ${l.applicant_name || 'नागरिक'} (📱 ${l.mobile || ''})\n`;
            text += `   📅 दिनांक: ${dateStr}\n`;
            if (l.purpose) text += `   📝 कारण: ${l.purpose}\n`;
            text += `\n`;
        });
        text += `━━━━━━━━━━━━━━━━━━━━━\n_9️⃣ मुख्य मेनू_`;
        return text;
    } catch (err) {
        console.error('[LetterHandler] Outgoing error:', err);
        return `❌ माहिती मिळवण्यात अडचण आली.`;
    }
}

/**
 * 3. Search Letters
 */
async function searchLetters(tenantId, query, lang = 'mr') {
    const clean = (query || '').trim();
    if (!clean) return 'कृपया शोधण्यासाठी शब्द किंवा पत्र क्रमांक टाका.';

    try {
        const [incomingRes, outgoingRes] = await Promise.all([
            supabase.from('incoming_letters').select('*').eq('tenant_id', tenantId).ilike('title', `%${clean}%`).limit(5),
            supabase.from('letter_requests').select('*').eq('tenant_id', tenantId).or(`applicant_name.ilike.%${clean}%,letter_type.ilike.%${clean}%,purpose.ilike.%${clean}%`).limit(5)
        ]);

        const incoming = incomingRes.data || [];
        const outgoing = outgoingRes.data || [];

        if (incoming.length === 0 && outgoing.length === 0) {
            return `🔍 *शोध निकाल:* "${clean}"\n\nℹ️ कोणतेही पत्र आढळले नाही.\n\n9️⃣ मुख्य मेनू`;
        }

        let text = `🔍 *पत्र शोध निकाल:* "${clean}"\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        if (incoming.length > 0) {
            text += `📥 *आलेली पत्रे:*\n`;
            incoming.forEach((l, i) => {
                text += `• *${l.title}* (${formatDateDisplay(l.received_date)})\n`;
            });
            text += `\n`;
        }

        if (outgoing.length > 0) {
            text += `📤 *अर्ज / शिफारस पत्रे:*\n`;
            outgoing.forEach((l, i) => {
                text += `• *${l.applicant_name}* - ${l.letter_type} (${l.status})\n`;
            });
        }

        text += `\n━━━━━━━━━━━━━━━━━━━━━\n_9️⃣ मुख्य मेनू_`;
        return text;
    } catch (err) {
        console.error('[LetterHandler] Search error:', err);
        return `❌ शोधताना त्रुटी आली.`;
    }
}

module.exports = {
    getIncomingLetters,
    getOutgoingLetters,
    searchLetters
};
