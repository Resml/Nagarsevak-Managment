/**
 * Politician Daily Diary & Schedule Handler (GB Diary & Events)
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
 * 1. Fetch Today's Diary & Schedule
 */
async function getTodayDiary(tenantId, lang = 'mr') {
    try {
        const todayYMD = new Date().toISOString().split('T')[0];

        const [diaryRes, eventsRes] = await Promise.all([
            supabase.from('gb_diary').select('*').eq('tenant_id', tenantId).eq('entry_date', todayYMD).limit(10),
            supabase.from('events').select('*').eq('tenant_id', tenantId).eq('event_date', todayYMD).limit(10)
        ]);

        const diary = diaryRes.data || [];
        const events = eventsRes.data || [];

        if (diary.length === 0 && events.length === 0) {
            return `📅 *आजची दैनंदिनी व कार्यक्रम (${formatDateDisplay(todayYMD)})*\n\nℹ️ आजसाठी कोणतेही कार्यक्रम किंवा दैनंदिनी नोंदी नियोजित नाहीत.\n\n9️⃣ मुख्य मेनू`;
        }

        let text = `📅 *आजचे नियोजन व कार्यक्रम (${formatDateDisplay(todayYMD)})*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;

        if (events.length > 0) {
            text += `🎉 *आजचे कार्यक्रम / बैठका:*\n`;
            events.forEach((e, i) => {
                text += `*${i + 1}. ${e.title}* ${e.event_time ? `⏰ ${e.event_time}` : ''}\n`;
                if (e.location) text += `   📍 ठिकाण: ${e.location}\n`;
                if (e.description) text += `   📝 ${e.description}\n`;
                text += `\n`;
            });
        }

        if (diary.length > 0) {
            text += `📖 *दैनंदिनी नोंदी (Diary):*\n`;
            diary.forEach((d, i) => {
                text += `• *${d.subject || 'नोंद'}*\n`;
                if (d.details) text += `   ${d.details}\n`;
            });
        }

        text += `\n━━━━━━━━━━━━━━━━━━━━━\n_9️⃣ मुख्य मेनू_`;
        return text;
    } catch (err) {
        console.error('[DiaryHandler] Today diary error:', err);
        return `❌ माहिती मिळवण्यात अडचण आली.`;
    }
}

/**
 * 2. Fetch Tomorrow's Schedule
 */
async function getTomorrowSchedule(tenantId, lang = 'mr') {
    try {
        const tm = new Date();
        tm.setDate(tm.getDate() + 1);
        const tomorrowYMD = tm.toISOString().split('T')[0];

        const [diaryRes, eventsRes] = await Promise.all([
            supabase.from('gb_diary').select('*').eq('tenant_id', tenantId).eq('entry_date', tomorrowYMD).limit(10),
            supabase.from('events').select('*').eq('tenant_id', tenantId).eq('event_date', tomorrowYMD).limit(10)
        ]);

        const diary = diaryRes.data || [];
        const events = eventsRes.data || [];

        if (diary.length === 0 && events.length === 0) {
            return `🗓️ *उद्याचे नियोजन (${formatDateDisplay(tomorrowYMD)})*\n\nℹ️ उद्यासाठी कोणतेही कार्यक्रम नोंदवलेले नाहीत.\n\n9️⃣ मुख्य मेनू`;
        }

        let text = `🗓️ *उद्याचे नियोजन (${formatDateDisplay(tomorrowYMD)})*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;

        events.forEach((e, i) => {
            text += `*${i + 1}. ${e.title}* ${e.event_time ? `⏰ ${e.event_time}` : ''}\n`;
            if (e.location) text += `   📍 ${e.location}\n`;
            text += `\n`;
        });

        text += `━━━━━━━━━━━━━━━━━━━━━\n_9️⃣ मुख्य मेनू_`;
        return text;
    } catch (err) {
        console.error('[DiaryHandler] Tomorrow schedule error:', err);
        return `❌ माहिती मिळवण्यात अडचण आली.`;
    }
}

module.exports = {
    getTodayDiary,
    getTomorrowSchedule
};
