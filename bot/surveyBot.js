/**
 * surveyBot.js
 * Handles WhatsApp-driven conversational surveys for the Nagarsevak Management System.
 *
 * Flow:
 *  1. API sends survey initiation → bot sends first question
 *  2. User replies → answer is stored, next question is sent
 *  3. After all questions answered → save survey_response to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Session State Key ─────────────────────────────────────────────────────────
// We use 'SURVEY_IN_PROGRESS' as the menu state key, stored in menuNavigator sessions
const SURVEY_MENU_STATE = 'SURVEY_IN_PROGRESS';

/**
 * Formats a question for WhatsApp display based on its type.
 */
function formatQuestion(question, index, total) {
    const header = `📋 *प्रश्न ${index + 1}/${total}*\n\n`;
    let body = `*${question.text}*\n`;

    if (question.type === 'yes_no') {
        body += `\n1️⃣ होय (Yes)\n2️⃣ नाही (No)`;
    } else if (question.type === 'mcq' && Array.isArray(question.options)) {
        question.options.forEach((opt, i) => {
            body += `\n${i + 1}️⃣ ${opt}`;
        });
    } else if (question.type === 'rating') {
        body += `\n\n⭐ 1 ते 5 मधील रेटिंग द्या (Type 1 to 5)`;
    } else {
        // text / open-ended
        body += `\n\n✏️ तुमचे उत्तर टाइप करा.`;
    }

    return header + body;
}

/**
 * Validates and normalizes an answer based on question type.
 * Returns { valid: bool, value: any, display: string }
 */
function parseAnswer(question, input) {
    const trimmed = input.trim();

    if (question.type === 'yes_no') {
        if (trimmed === '1' || /^(होय|yes|हो|हां|ha|y)$/i.test(trimmed)) {
            return { valid: true, value: 'yes', display: 'होय (Yes)' };
        } else if (trimmed === '2' || /^(नाही|no|nahi|n)$/i.test(trimmed)) {
            return { valid: true, value: 'no', display: 'नाही (No)' };
        }
        return { valid: false, value: null, display: '' };
    }

    if (question.type === 'mcq' && Array.isArray(question.options)) {
        const idx = parseInt(trimmed) - 1;
        if (!isNaN(idx) && idx >= 0 && idx < question.options.length) {
            return { valid: true, value: question.options[idx], display: question.options[idx] };
        }
        // Try text match
        const match = question.options.find(o => o.toLowerCase().includes(trimmed.toLowerCase()));
        if (match) return { valid: true, value: match, display: match };
        return { valid: false, value: null, display: '' };
    }

    if (question.type === 'rating') {
        const num = parseInt(trimmed);
        if (!isNaN(num) && num >= 1 && num <= 5) {
            return { valid: true, value: num, display: `${num} ⭐` };
        }
        return { valid: false, value: null, display: '' };
    }

    // text/open-ended - accept anything non-empty
    if (trimmed.length > 0) {
        return { valid: true, value: trimmed, display: trimmed };
    }
    return { valid: false, value: null, display: '' };
}

/**
 * Starts a survey conversation for a single citizen (called from API).
 * Sets menuNavigator session state to SURVEY_IN_PROGRESS.
 *
 * @param {object} sock - Baileys socket
 * @param {object} menuNavigator - MenuNavigator instance for this tenant
 * @param {string} userId - WhatsApp JID (e.g. 919876543210@s.whatsapp.net)
 * @param {object} survey - Survey object { id, title, questions: [] }
 * @param {string} tenantId
 * @param {string|null} voterId - voter_id if known (null for anonymous)
 */
async function startSurveyForUser(sock, menuNavigator, userId, survey, tenantId, voterId = null) {
    if (!survey.questions || survey.questions.length === 0) {
        console.log(`[${tenantId}] Survey ${survey.id} has no questions, skipping ${userId}`);
        return;
    }

    const session = menuNavigator.getSession(userId);

    // Set survey state
    session.currentMenu = SURVEY_MENU_STATE;
    session.surveyState = {
        surveyId: survey.id,
        tenantId,
        voterId,
        questions: survey.questions,
        currentQuestionIndex: 0,
        answers: {} // { questionIndex: answer }
    };

    // Send intro message
    const intro = `📊 *सर्वेक्षण सुरू*\n\n*${survey.title}*\n\nकृपया खालील प्रश्नांची उत्तरे द्या.\n\n_(उत्तरे द्यायची नसल्यास "SKIP" टाइप करा)_`;
    await sock.sendMessage(userId, { text: intro });

    // Small delay then first question
    await new Promise(r => setTimeout(r, 1200));
    await sendNextQuestion(sock, userId, session);
}

/**
 * Sends the next question in the survey sequence.
 */
async function sendNextQuestion(sock, userId, session) {
    const state = session.surveyState;
    const { questions, currentQuestionIndex } = state;

    if (currentQuestionIndex >= questions.length) {
        await finalizeSurvey(sock, userId, session);
        return;
    }

    const q = questions[currentQuestionIndex];
    const text = formatQuestion(q, currentQuestionIndex, questions.length);
    await sock.sendMessage(userId, { text });
}

/**
 * Finalizes the survey: saves response to DB and thanks the user.
 */
async function finalizeSurvey(sock, userId, session) {
    const state = session.surveyState;

    try {
        // Build answers object keyed by question text
        const answersPayload = {};
        state.questions.forEach((q, i) => {
            answersPayload[q.text] = state.answers[i] ?? null;
        });

        const { error } = await supabase.from('survey_responses').insert([{
            survey_id: state.surveyId,
            voter_id: state.voterId || null,
            answers: answersPayload,
            tenant_id: state.tenantId
        }]);

        if (error) {
            console.error(`[SurveyBot] Failed to save response:`, error);
            await sock.sendMessage(userId, { text: '❌ तुमचे उत्तर जतन करण्यात त्रुटी आली. कृपया पुन्हा प्रयत्न करा.' });
        } else {
            const thankyou = `✅ *सर्वेक्षण पूर्ण!*\n\nआपल्या मौल्यवान प्रतिसादाबद्दल धन्यवाद! 🙏\nआपचे मत आमच्यासाठी खूप महत्त्वाचे आहे.`;
            await sock.sendMessage(userId, { text: thankyou });
        }
    } catch (err) {
        console.error('[SurveyBot] Error finalizing survey:', err);
    }

    // Reset session state
    session.currentMenu = 'MAIN_MENU';
    delete session.surveyState;
}

/**
 * Called by menuNavigator when the user's currentMenu === 'SURVEY_IN_PROGRESS'.
 * Processes the user's reply to the current question.
 *
 * @param {object} sock
 * @param {string} userId
 * @param {object} session - menuNavigator session
 * @param {string} input - user's reply text
 */
async function handleSurveyReply(sock, userId, session, input) {
    const state = session.surveyState;
    if (!state) {
        session.currentMenu = 'MAIN_MENU';
        return;
    }

    const { questions, currentQuestionIndex } = state;

    // Allow skip
    if (input.trim().toUpperCase() === 'SKIP') {
        state.answers[currentQuestionIndex] = null;
        state.currentQuestionIndex++;
        await sendNextQuestion(sock, userId, session);
        return;
    }

    const q = questions[currentQuestionIndex];
    const parsed = parseAnswer(q, input);

    if (!parsed.valid) {
        // Invalid answer — show hint and re-ask
        let hint = '❌ अवैध उत्तर. ';
        if (q.type === 'yes_no') hint += '1 (होय) किंवा 2 (नाही) टाइप करा.';
        else if (q.type === 'mcq') hint += `कृपया 1 ते ${q.options.length} मधील क्रमांक टाइप करा.`;
        else if (q.type === 'rating') hint += '1 ते 5 मधील रेटिंग टाइप करा.';
        else hint += 'कृपया उत्तर टाइप करा.';

        await sock.sendMessage(userId, { text: hint });
        // Re-send the same question
        await sendNextQuestion(sock, userId, session);
        return;
    }

    // Store valid answer
    state.answers[currentQuestionIndex] = parsed.value;
    state.currentQuestionIndex++;

    // Brief confirmation
    const confirm = `✅ *नोंद झाली:* ${parsed.display}`;
    await sock.sendMessage(userId, { text: confirm });

    await new Promise(r => setTimeout(r, 800));
    await sendNextQuestion(sock, userId, session);
}

module.exports = {
    SURVEY_MENU_STATE,
    startSurveyForUser,
    handleSurveyReply
};
