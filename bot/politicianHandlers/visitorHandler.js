/**
 * Politician Visitor Log Handler
 * Handles real-time visitor list, date-wise filtering, search, and analytics.
 */

const { supabase } = require('../supabaseClient');

/**
 * Helper to parse various user date inputs into YYYY-MM-DD
 */
function parseDateInput(input) {
    if (!input) return null;
    const clean = input.trim().toLowerCase();

    const now = new Date();

    if (clean === 'today' || clean === 'आज') {
        return now.toISOString().split('T')[0];
    }
    if (clean === 'yesterday' || clean === 'काल') {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        return y.toISOString().split('T')[0];
    }

    // Matches DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
    const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (dmyMatch) {
        const day = dmyMatch[1].padStart(2, '0');
        const month = dmyMatch[2].padStart(2, '0');
        const year = dmyMatch[3];
        return `${year}-${month}-${day}`;
    }

    // Matches YYYY-MM-DD
    const ymdMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (ymdMatch) {
        const year = ymdMatch[1];
        const month = ymdMatch[2].padStart(2, '0');
        const day = ymdMatch[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Matches DD-MM (assumes current year)
    const dmMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})$/);
    if (dmMatch) {
        const day = dmMatch[1].padStart(2, '0');
        const month = dmMatch[2].padStart(2, '0');
        const year = now.getFullYear();
        return `${year}-${month}-${day}`;
    }

    return null;
}

/**
 * Format timestamp to 12-hour time (e.g. 10:30 AM)
 */
function formatTime(isoString) {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
        });
    } catch (e) {
        return '';
    }
}

/**
 * Format date nicely for display (DD-MM-YYYY)
 */
function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    } catch (e) {
        return dateStr;
    }
}

/**
 * Format a list of visitors into a readable WhatsApp message
 */
function formatVisitorList(visitors, title, dateLabel, lang = 'mr') {
    if (!visitors || visitors.length === 0) {
        if (lang === 'mr') {
            return `👥 *${title}*\n📅 तारीख: ${dateLabel}\n\nℹ️ या तारखेला एकही भेट नोंदवलेली नाही.\n\n9️⃣ मुख्य मेनू | 0️⃣ भाषा बदला`;
        } else if (lang === 'hi') {
            return `👥 *${title}*\n📅 तारीख: ${dateLabel}\n\nℹ️ इस तारीख को कोई आगंतुक दर्ज नहीं है।\n\n9️⃣ मुख्य मेनू | 0️⃣ भाषा बदलें`;
        } else {
            return `👥 *${title}*\n📅 Date: ${dateLabel}\n\nℹ️ No visitors recorded on this date.\n\n9️⃣ Main Menu | 0️⃣ Change Language`;
        }
    }

    let text = `👥 *${title}*\n📅 *तारीख:* ${dateLabel} | *एकूण संख्या:* ${visitors.length}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    visitors.forEach((v, index) => {
        const timeStr = v.visit_date ? formatTime(v.visit_date) : '';
        const purpose = v.purpose || 'भेट (Meeting)';
        const mobile = v.mobile ? `📱 ${v.mobile}` : '';
        const area = v.area ? `📍 ${v.area}` : '';
        const ref = v.reference ? `🤝 संदर्भ: ${v.reference}` : '';
        const remarks = v.remarks ? `💬 टीप: ${v.remarks}` : '';

        text += `*${index + 1}. ${v.name || 'नागरिक'}* ${timeStr ? `⏱️ (${timeStr})` : ''}\n`;
        text += `   📌 *कारण:* ${purpose}\n`;
        if (mobile) text += `   ${mobile}\n`;
        if (area) text += `   ${area}\n`;
        if (ref) text += `   ${ref}\n`;
        if (remarks) text += `   ${remarks}\n`;
        text += `\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_9️⃣ मुख्य मेनू | 🔄 इतर पर्याय निवडण्यासाठी क्रमांक पाठवा_`;
    return text;
}

/**
 * 1. Fetch Today's Visitors
 */
async function getTodayVisitors(tenantId, lang = 'mr') {
    const todayYMD = new Date().toISOString().split('T')[0];
    const startOfDay = `${todayYMD}T00:00:00.000Z`;
    const endOfDay = `${todayYMD}T23:59:59.999Z`;

    try {
        const { data, error } = await supabase
            .from('visitors')
            .select('*')
            .eq('tenant_id', tenantId)
            .gte('visit_date', startOfDay)
            .lte('visit_date', endOfDay)
            .order('visit_date', { ascending: true });

        if (error) throw error;

        const title = lang === 'mr' ? "आजचे भेट देणारे नागरिक" : (lang === 'hi' ? "आज के आगंतुक" : "Today's Visitors");
        return formatVisitorList(data, title, formatDateDisplay(todayYMD), lang);
    } catch (err) {
        console.error('[VisitorHandler] Error fetching today visitors:', err);
        return `❌ त्रुटी: माहिती मिळवण्यात अडचण आली. कृपया नंतर प्रयत्न करा.`;
    }
}

/**
 * 2. Fetch Yesterday's Visitors
 */
async function getYesterdayVisitors(tenantId, lang = 'mr') {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterdayYMD = y.toISOString().split('T')[0];
    const startOfDay = `${yesterdayYMD}T00:00:00.000Z`;
    const endOfDay = `${yesterdayYMD}T23:59:59.999Z`;

    try {
        const { data, error } = await supabase
            .from('visitors')
            .select('*')
            .eq('tenant_id', tenantId)
            .gte('visit_date', startOfDay)
            .lte('visit_date', endOfDay)
            .order('visit_date', { ascending: true });

        if (error) throw error;

        const title = lang === 'mr' ? "कालचे भेट देणारे नागरिक" : (lang === 'hi' ? "कल के आगंतुक" : "Yesterday's Visitors");
        return formatVisitorList(data, title, formatDateDisplay(yesterdayYMD), lang);
    } catch (err) {
        console.error('[VisitorHandler] Error fetching yesterday visitors:', err);
        return `❌ त्रुटी: माहिती मिळवण्यात अडचण आली. कृपया नंतर प्रयत्न करा.`;
    }
}

/**
 * 3. Fetch Visitors by Specific Date
 */
async function getVisitorsByDate(tenantId, dateInput, lang = 'mr') {
    const parsedYMD = parseDateInput(dateInput);
    if (!parsedYMD) {
        if (lang === 'mr') {
            return `⚠️ चुकीची तारीख स्वरूप! कृपया *DD-MM-YYYY* (उदा. \`11-08-2026\`) किंवा \`today\` / \`yesterday\` पाठवा.\n\n9️⃣ मुख्य मेनू`;
        } else if (lang === 'hi') {
            return `⚠️ अमान्य तारीख प्रारूप! कृपया *DD-MM-YYYY* (उदा. \`11-08-2026\`) या \`today\` / \`yesterday\` भेजें।\n\n9️⃣ मुख्य मेनू`;
        } else {
            return `⚠️ Invalid date format! Please enter *DD-MM-YYYY* (e.g. \`11-08-2026\`) or \`today\` / \`yesterday\`.\n\n9️⃣ Main Menu`;
        }
    }

    const startOfDay = `${parsedYMD}T00:00:00.000Z`;
    const endOfDay = `${parsedYMD}T23:59:59.999Z`;

    try {
        const { data, error } = await supabase
            .from('visitors')
            .select('*')
            .eq('tenant_id', tenantId)
            .gte('visit_date', startOfDay)
            .lte('visit_date', endOfDay)
            .order('visit_date', { ascending: true });

        if (error) throw error;

        const title = lang === 'mr' ? `भेट देणारे नागरिक (${formatDateDisplay(parsedYMD)})` : (lang === 'hi' ? `आगंतुक सूची (${formatDateDisplay(parsedYMD)})` : `Visitors List (${formatDateDisplay(parsedYMD)})`);
        return formatVisitorList(data, title, formatDateDisplay(parsedYMD), lang);
    } catch (err) {
        console.error('[VisitorHandler] Error fetching date visitors:', err);
        return `❌ त्रुटी: माहिती मिळवण्यात अडचण आली.`;
    }
}

/**
 * 4. Search Visitors by Name or Mobile
 */
async function searchVisitors(tenantId, query, lang = 'mr') {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) return 'कृपया नाव किंवा मोबाईल नंबर टाका.';

    try {
        const isNum = /^\d+$/.test(cleanQuery.replace(/\D/g, ''));
        let dbQuery = supabase
            .from('visitors')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('visit_date', { ascending: false })
            .limit(15);

        if (isNum && cleanQuery.replace(/\D/g, '').length >= 4) {
            const digits = cleanQuery.replace(/\D/g, '').slice(-10);
            dbQuery = dbQuery.ilike('mobile', `%${digits}%`);
        } else {
            dbQuery = dbQuery.ilike('name', `%${cleanQuery}%`);
        }

        const { data, error } = await dbQuery;
        if (error) throw error;

        if (!data || data.length === 0) {
            return `🔍 *शोध निकाल:* "${cleanQuery}"\n\nℹ️ कोणतीही नोंद आढळली नाही.\n\n9️⃣ मुख्य मेनू`;
        }

        let text = `🔍 *शोध निकाल:* "${cleanQuery}" (${data.length} नोंदी)\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        data.forEach((v, i) => {
            const dStr = v.visit_date ? formatDateDisplay(v.visit_date.split('T')[0]) : '';
            const tStr = v.visit_date ? formatTime(v.visit_date) : '';
            text += `*${i + 1}. ${v.name}* (📅 ${dStr} ${tStr ? `⏱️ ${tStr}` : ''})\n`;
            text += `   📌 ${v.purpose || 'भेट'} | 📱 ${v.mobile || 'मोबाईल नाही'}\n`;
            if (v.remarks) text += `   💬 ${v.remarks}\n`;
            if (v.reference) text += `   🤝 संदर्भ: ${v.reference}\n`;
            text += `\n`;
        });
        text += `━━━━━━━━━━━━━━━━━━━━━\n_9️⃣ मुख्य मेनू_`;
        return text;
    } catch (err) {
        console.error('[VisitorHandler] Search error:', err);
        return `❌ शोधताना त्रुटी आली.`;
    }
}

/**
 * 5. Visitor Summary Analytics
 */
async function getVisitorAnalytics(tenantId, lang = 'mr') {
    try {
        const now = new Date();
        const todayYMD = now.toISOString().split('T')[0];

        // 7 days ago
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekYMD = weekAgo.toISOString().split('T')[0];

        // Month start
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // 1. Today count
        const { count: todayCount } = await supabase
            .from('visitors')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('visit_date', `${todayYMD}T00:00:00.000Z`);

        // 2. Week count
        const { count: weekCount } = await supabase
            .from('visitors')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('visit_date', `${weekYMD}T00:00:00.000Z`);

        // 3. Month count
        const { count: monthCount } = await supabase
            .from('visitors')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .gte('visit_date', monthStart);

        // 4. Total all time
        const { count: totalCount } = await supabase
            .from('visitors')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId);

        // 5. Recent purpose breakdown
        const { data: recent } = await supabase
            .from('visitors')
            .select('purpose')
            .eq('tenant_id', tenantId)
            .limit(100);

        const purposeMap = {};
        (recent || []).forEach(r => {
            const p = r.purpose || 'इतर/भेट';
            purposeMap[p] = (purposeMap[p] || 0) + 1;
        });

        let text = `📊 *भेट देणारे सांख्यिकी व सारांश*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        text += `👥 *आजचे भेट देणारे:* ${todayCount || 0}\n`;
        text += `📅 *या आठवड्यातील भेट:* ${weekCount || 0}\n`;
        text += `🗓️ *या महिन्यातील एकूण:* ${monthCount || 0}\n`;
        text += `🏆 *सर्वकालीन एकूण व्हिजिटर्स:* ${totalCount || 0}\n\n`;

        text += `📌 *मुख्य भेट कारणे (Top Reasons):*\n`;
        Object.entries(purposeMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([p, cnt]) => {
                text += `• ${p}: *${cnt}*\n`;
            });

        text += `\n━━━━━━━━━━━━━━━━━━━━━\n_9️⃣ मुख्य मेनू_`;
        return text;
    } catch (err) {
        console.error('[VisitorHandler] Analytics error:', err);
        return `❌ सांख्यिकी मिळवण्यात अडचण आली.`;
    }
}

module.exports = {
    getTodayVisitors,
    getYesterdayVisitors,
    getVisitorsByDate,
    searchVisitors,
    getVisitorAnalytics,
    parseDateInput,
    formatVisitorList,
    formatTime,
    formatDateDisplay
};
