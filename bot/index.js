const { makeWASocket, DisconnectReason, getAggregateVotesInPollMessage, delay } = require('@whiskeysockets/baileys');
// const makeInMemoryStore = require('@whiskeysockets/baileys').makeInMemoryStore; // Removed as it is missing

const pino = require('pino');
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const store = require('./store');
const broadcastService = require('./broadcast');
const { startSurveyForUser } = require('./surveyBot');
// AI Service removed - using menu-driven navigation instead
const MenuNavigator = require('./menuNavigator');
const supabaseAuthState = require('./supabaseAuthState');

// Initial LID Cache
const lidCache = {};

// --- Custom Simple Store for Polls ---
class SimpleStore {
    constructor() {
        this.messages = {}; // jid -> { id -> message }
        this.contacts = {}; // jid -> contact
    }

    bind(ev) {
        ev.on('messages.upsert', (data) => {
            for (const msg of data.messages) {
                const jid = msg.key.remoteJid;
                if (!this.messages[jid]) this.messages[jid] = {};
                this.messages[jid][msg.key.id] = msg;
            }
        });

        ev.on('contacts.upsert', (contacts) => {
            for (const contact of contacts) {
                // Determine JID (some contacts might just be updates)
                const id = contact.id;
                if (id) {
                    this.contacts[id] = Object.assign(this.contacts[id] || {}, contact);
                }
            }
        });

        ev.on('contacts.update', (updates) => {
            for (const update of updates) {
                if (update.id && this.contacts[update.id]) {
                    Object.assign(this.contacts[update.id], update);
                }
            }
        });
    }

    async loadMessage(jid, id) {
        return this.messages[jid]?.[id];
    }
}

// --- Baileys Store (For Polls) ---
// Note: In multi-tenancy, we might want one store per tenant, but for now a global store keyed by JID is okay 
// as long as JIDs don't conflict (which they won't).
const msgRetryCounterCache = new Map();
const baileysStore = new SimpleStore();

// --- Server Setup ---
const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins (Vercel, Localhost, etc.)
        methods: ["GET", "POST"]
    }
});

const PORT = 4000;

// Middleware
app.use(express.json());

// --- Root Route for Health Check ---
app.get('/', (req, res) => {
    res.send(`
        <h1>WhatsApp Bot Server is Running 🚀</h1>
        <p>Multi-Tenant Mode Active</p>
        <p>Active Sessions: <strong>${sessions.size}</strong></p>
    `);
});

// --- Supabase Setup ---
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Multi-Tenant Globals ---
// Map<tenantId, { sock: WASocket, status: string, qr: string, store: SimpleStore, menuNavigator: MenuNavigator, retryCount: number }>
const sessions = new Map();

// Connection retry configuration
const MAX_RETRY_ATTEMPTS = 10;
const INITIAL_RETRY_DELAY = 5000; // 5 seconds
const MAX_RETRY_DELAY = 300000; // 5 minutes

// Calculate exponential backoff delay
function getRetryDelay(retryCount) {
    const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY);
    return delay;
}

// Manual logout function
async function logoutSession(tenantId) {
    const session = sessions.get(tenantId);
    if (!session) {
        console.log(`[${tenantId}] No session to logout`);
        return false;
    }

    try {
        // Close socket connection
        if (session.sock) {
            session.sock.end();
            session.ev.removeAllListeners();
        }

        // Clear session data
        sessions.delete(tenantId);

        // Clear session from Supabase
        const { error } = await supabase
            .from('whatsapp_sessions')
            .delete()
            .eq('session_id', tenantId);

        if (error) {
            console.error(`[${tenantId}] Error deleting session from Supabase:`, error);
        } else {
            console.log(`[${tenantId}] Session deleted from Supabase`);
        }

        // Emit logout status to frontend
        io.to(tenantId).emit('status', 'disconnected');
        io.to(tenantId).emit('logged_out', true);

        console.log(`[${tenantId}] Successfully logged out`);
        return true;
    } catch (error) {
        console.error(`[${tenantId}] Error during logout:`, error);
        return false;
    }
}

// --- Vapi Routes ---
const vapiRoutes = require('./vapiRoutes');
app.use('/api/vapi', vapiRoutes);

// --- API Routes ---
app.post('/api/broadcast', async (req, res) => {
    const { eventId, tenantId } = req.body;

    if (!eventId || !tenantId) {
        return res.status(400).json({ error: 'Event ID and Tenant ID required' });
    }

    const session = sessions.get(tenantId);
    if (!session || session.status !== 'connected') {
        return res.status(503).json({ error: 'Bot not connected for this tenant.' });
    }

    console.log(`[${tenantId}] Received broadcast request for Event:`, eventId);
    broadcastService.broadcastEvent(session.sock, eventId);
    res.json({ success: true, message: 'Broadcast started in background' });
});

// --- Selective Event Invite Sender ---
// POST /api/send-event-invites
// Body: { tenantId, eventId, mobiles: [{ mobile, name }] }
app.post('/api/send-event-invites', async (req, res) => {
    const { eventId, tenantId, mobiles } = req.body;

    if (!eventId || !tenantId || !Array.isArray(mobiles) || mobiles.length === 0) {
        return res.status(400).json({ error: 'eventId, tenantId, and non-empty mobiles[] are required' });
    }

    const session = sessions.get(tenantId);
    if (!session || session.status !== 'connected') {
        return res.status(503).json({ error: 'WhatsApp bot not connected for this tenant. Please connect the bot first.' });
    }

    // Fetch event details
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

    if (eventError || !event) {
        return res.status(404).json({ error: 'Event not found' });
    }

    console.log(`[${tenantId}] Sending event invites for "${event.title}" to ${mobiles.length} citizens`);

    // Send in background (non-blocking)
    res.json({ success: true, message: `Sending invites to ${mobiles.length} citizens in background` });

    // Build message
    const eventDateStr = event.event_date ? new Date(event.event_date).toLocaleDateString('mr-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : event.event_date;
    const messageText = `🎉 *आमंत्रण / Invitation*\n\nआपणास *${event.title}* कार्यक्रमासाठी आमंत्रित करण्यात आले आहे!\n\n📅 *दिनांक:* ${eventDateStr}\n⏰ *वेळ:* ${event.event_time}\n📍 *ठिकाण:* ${event.location}\n\n${event.description ? `${event.description}\n\n` : ''}कृपया उपस्थित राहावे.\n\n_- नगरसेवक कार्यालय_`;

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    (async () => {
        let sent = 0;
        for (const recipient of mobiles) {
            try {
                let number = (recipient.mobile || '').replace(/\D/g, '');
                if (number.length === 10) number = '91' + number;
                if (!number || number.length < 11) continue;

                const jid = number + '@s.whatsapp.net';
                await session.sock.sendMessage(jid, { text: messageText });
                console.log(`[${tenantId}] ✅ Invite sent to ${recipient.name || number}`);
                sent++;

                // Random 2-4s delay to avoid spam detection
                const delay = Math.floor(Math.random() * 2000) + 2000;
                await sleep(delay);
            } catch (sendErr) {
                console.error(`[${tenantId}] ❌ Failed to send to ${recipient.mobile}:`, sendErr.message);
            }
        }
        console.log(`[${tenantId}] Event invite broadcast complete: ${sent}/${mobiles.length} sent`);
    })();
});

// --- Survey via WhatsApp Bot ---
// POST /api/send-survey
// Body: { tenantId, surveyId, mobiles: [{ mobile, name, voterId? }] }
app.post('/api/send-survey', async (req, res) => {
    const { surveyId, tenantId, mobiles } = req.body;

    if (!surveyId || !tenantId || !Array.isArray(mobiles) || mobiles.length === 0) {
        return res.status(400).json({ error: 'surveyId, tenantId, and non-empty mobiles[] are required' });
    }

    const session = sessions.get(tenantId);
    if (!session || session.status !== 'connected') {
        return res.status(503).json({ error: 'WhatsApp bot is not connected for this tenant.' });
    }

    if (!session.menuNavigator) {
        return res.status(500).json({ error: 'MenuNavigator not initialized' });
    }

    // Fetch survey with questions from DB
    const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .single();

    if (surveyError || !survey) {
        return res.status(404).json({ error: 'Survey not found' });
    }

    // Normalize questions (could be JSONB array in DB)
    let questions = survey.questions;
    if (typeof questions === 'string') {
        try { questions = JSON.parse(questions); } catch { questions = []; }
    }
    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'Survey has no questions' });
    }

    const surveyObj = { id: survey.id, title: survey.title, questions };

    console.log(`[${tenantId}] Starting WhatsApp survey "${survey.title}" for ${mobiles.length} citizens`);

    // Respond immediately - processing happens in background
    res.json({ success: true, message: `Survey started for ${mobiles.length} citizens in background` });

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    (async () => {
        let started = 0;
        for (const recipient of mobiles) {
            try {
                let number = (recipient.mobile || '').replace(/\D/g, '');
                if (number.length === 10) number = '91' + number;
                if (!number || number.length < 11) continue;

                const jid = number + '@s.whatsapp.net';
                await startSurveyForUser(
                    session.sock,
                    session.menuNavigator,
                    jid,
                    surveyObj,
                    tenantId,
                    recipient.voterId || null
                );
                started++;
                console.log(`[${tenantId}] ✅ Survey started for ${recipient.name || number}`);

                // 3-6s delay between citizens to avoid rate limits
                const delay = Math.floor(Math.random() * 3000) + 3000;
                await sleep(delay);
            } catch (err) {
                console.error(`[${tenantId}] ❌ Failed to start survey for ${recipient.mobile}:`, err.message);
            }
        }
        console.log(`[${tenantId}] Survey dispatch complete: ${started}/${mobiles.length}`);
    })();
});

// --- Webhook endpoint for letter status updates ---
app.post('/webhook/letter-status', async (req, res) => {
    try {
        // Validate webhook secret for security
        const webhookSecret = process.env.WEBHOOK_SECRET;
        const authHeader = req.headers['x-webhook-secret'];

        if (webhookSecret && authHeader !== webhookSecret) {
            console.warn('Unauthorized webhook attempt');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { type, letter_id, user_id, status, letter_type, tenant_id, pdf_url } = req.body;

        if (type !== 'letter_status_change') {
            return res.status(400).json({ error: 'Invalid webhook type' });
        }

        console.log(`[${tenant_id}] Letter status webhook: ${status} for user ${user_id}`);

        // Get bot connection for this tenant
        const session = sessions.get(tenant_id);
        if (!session || !session.sock) {
            console.error(`No bot connection for tenant ${tenant_id}`);
            return res.status(404).json({ error: 'Bot not connected for this tenant' });
        }

        // If not explicitly connected but we have a session, it might be in 'connecting' state
        // but still functional (as seen in logs where messages are being handled).
        if (session.status !== 'connected' && session.status !== 'connecting') {
            console.warn(`Bot status is ${session.status} for tenant ${tenant_id}, notification might fail`);
        }

        // Get MenuNavigator for this tenant to access user sessions
        const menuNav = session.menuNavigator;
        if (!menuNav) {
            console.error(`No MenuNavigator found for tenant ${tenant_id}`);
            return res.status(500).json({ error: 'MenuNavigator not initialized' });
        }

        // Get user's language preference from session
        const userSession = menuNav.getSession(`${user_id}@s.whatsapp.net`);
        const lang = userSession?.language || 'mr'; // Default to Marathi

        // Fallback: If pdf_url is missing (e.g. Edge Function not redeployed), try to fetch it from DB
        let finalPdfUrl = pdf_url;
        if (!finalPdfUrl && status === 'Approved') {
            try {
                const { data } = await supabase
                    .from('letter_requests')
                    .select('pdf_url')
                    .eq('id', letter_id)
                    .single();
                if (data?.pdf_url) {
                    finalPdfUrl = data.pdf_url;
                    console.log(`[${tenant_id}] Retrieved missing PDF URL from DB: ${finalPdfUrl}`);
                }
            } catch (dbErr) {
                console.warn(`[${tenant_id}] Failed to fetch missing PDF URL:`, dbErr.message);
            }
        }

        // Send notification
        const success = await sendLetterStatusNotification(
            session.sock,
            user_id,
            status,
            letter_type,
            lang,
            tenant_id,
            finalPdfUrl
        );

        if (success) {
            console.log(`[${tenant_id}] Letter status notification sent to ${user_id}`);
            res.json({ success: true, message: 'Notification sent' });
        } else {
            res.status(500).json({ error: 'Failed to send notification' });
        }
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// --- Endpoint for Staff Assignment Notification ---
app.post('/api/assign-complaint', async (req, res) => {
    try {
        const { complaintId, staffId, tenantId, table = 'complaints' } = req.body;

        if (!complaintId || !staffId || !tenantId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log(`[${tenantId}] Assigning ${table} #${complaintId} to staff ${staffId}`);

        // Get bot session
        const session = sessions.get(tenantId);
        if (!session || !session.sock) {
            return res.status(503).json({ error: 'Bot not connected for this tenant' });
        }

        // Fetch item details based on table
        let query = supabase.from(table).select('*').eq('id', complaintId).single();

        // Add specific joins based on table
        if (table === 'complaints') {
            query = supabase.from(table).select('*, voter:voters(name_english, name_marathi, mobile)').eq('id', complaintId).single();
        }

        const { data: item, error: itemError } = await query;

        if (itemError || !item) {
            console.error(`[${tenantId}] Error fetching item from ${table}:`, itemError);
            return res.status(404).json({ error: 'Item not found' });
        }

        // Map item to common structure for Notification
        let complaintData = {
            id: item.id,
            category: item.category || item.request_type || item.title || 'Task',
            problem: item.problem || item.description || 'Description not available',
            location: item.location || item.ward || 'N/A',
            voter: null,
            description_meta: item.description_meta
        };

        if (table === 'complaints' && item.voter) {
            complaintData.voter = item.voter;
        } else if (table === 'personal_requests') {
            complaintData.voter = {
                name_english: item.reporter_name,
                mobile: item.reporter_mobile
            };
        } else if (table === 'area_problems') {
            complaintData.voter = {
                name_english: item.reporter_name,
                mobile: item.reporter_mobile
            };
        }

        // Fetch staff details (Or use provided details to bypass RLS)
        let staffMobile = req.body.staffMobile;

        if (!staffMobile) {
            const { data: staff, error: staffError } = await supabase
                .from('staff')
                .select('*')
                .eq('id', staffId)
                .single();

            if (staffError || !staff) {
                console.error(`[${tenantId}] Error fetching staff:`, staffError);
                return res.status(404).json({ error: 'Staff not found' });
            }
            staffMobile = staff.mobile;
        }

        if (!staffMobile) {
            return res.status(400).json({ error: 'Staff member has no mobile number' });
        }

        // Trigger notification via MenuNavigator
        if (session.menuNavigator) {
            await session.menuNavigator.handleStaffAssignment(session.sock, staffMobile, complaintData, tenantId);
            res.json({ success: true, message: 'Staff notified successfully' });
        } else {
            res.status(500).json({ error: 'MenuNavigator not initialized' });
        }

    } catch (error) {
        console.error('Error assigning complaint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- Baileys Connection Logic (Per Tenant) ---
async function connectToWhatsApp(tenantId, socketToEmit = null, isRetry = false) {
    if (!tenantId) return;

    // Race Condition Fix:
    // If we are NOT retrying, and a session header exists, check its status.
    // If it is already connecting/connected/scanning, we should NOT start another connection.
    if (!isRetry && sessions.has(tenantId)) {
        const s = sessions.get(tenantId);
        if (s.status === 'connecting' || s.status === 'connected' || s.status === 'scanning') {
            console.log(`[${tenantId}] Connection already in progress or active (Status: ${s.status}). Skipping duplicate request.`);
            return;
        }
    }

    // Immediately initialize a placeholder session to block other concurrent requests
    // This must happen synchronously before any await
    if (!sessions.has(tenantId)) {
        console.log(`[${tenantId}] Initializing new session placeholder.`);
        sessions.set(tenantId, {
            sock: null,
            status: 'connecting',
            qr: '',
            store: baileysStore,
            menuNavigator: null,
            retryCount: 0,
            ev: null
        });
    }

    const session = sessions.get(tenantId);
    // If retrying, we use the existing retry count.
    // If not retrying, we reset it (passed as 0 or handled by placeholder init above)
    // Note: If we just created the placeholder, retryCount is 0.
    // If we are retrying, session exists, so we get its count.

    // However, if isRetry is true, we might be here because of a disconnect.
    // We should make sure we don't double-increment or mess up the object ref.

    // Let's get the retry count from the session object if it exists and we are retrying.
    const retryCount = (isRetry && session) ? (session.retryCount || 0) : 0;

    // Check if we've exceeded max retry attempts
    if (isRetry && retryCount >= MAX_RETRY_ATTEMPTS) {
        console.error(`[${tenantId}] Max retry attempts (${MAX_RETRY_ATTEMPTS}) exceeded. Stopping retries.`);
        updateSessionStatus(tenantId, 'failed');
        return;
    }

    console.log(`[${tenantId}] Initializing Baileys connection... ${isRetry ? `(Retry attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})` : ''}`);

    // Update status to connecting
    updateSessionStatus(tenantId, 'connecting');

    // Use Supabase Auth State
    const { state, saveCreds } = await supabaseAuthState(supabase, tenantId);

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        msgRetryCounterCache,
        printQRInTerminal: false, // We handle QR manually
        getMessage: async (key) => {
            if (baileysStore) {
                const msg = await baileysStore.loadMessage(key.remoteJid, key.id);
                return msg?.message || undefined;
            }
            return { conversation: 'hello' };
        },
        // Add connection stability options
        connectTimeoutMs: 60000, // 60 seconds connection timeout
        keepAliveIntervalMs: 25000, // 25 seconds keep alive
        retryRequestDelayMs: 5000, // 5 seconds between retries
        maxMsgRetryCount: 5, // Maximum message retry attempts
    });

    // Create or Reuse menu navigator instance for this tenant
    // CRITICAL: We must reuse the existing MenuNavigator to preserve user sessions (state) across reconnects!
    const currentSession = sessions.get(tenantId);
    let menuNavigator;

    if (currentSession && currentSession.menuNavigator) {
        console.log(`[${tenantId}] Reusing existing MenuNavigator (preserving sessions).`);
        menuNavigator = currentSession.menuNavigator;
    } else {
        console.log(`[${tenantId}] Creating new MenuNavigator.`);
        menuNavigator = new MenuNavigator(store);
    }

    // Update the existing session object instead of overwriting it completely
    const existingSession = sessions.get(tenantId);

    sessions.set(tenantId, {
        ...existingSession,
        sock,
        status: 'connecting',
        qr: '',
        store: baileysStore,
        menuNavigator,
        retryCount: isRetry ? retryCount : 0,
        ev: sock.ev
    });

    // Bind Store (Global store for now)
    baileysStore.bind(sock.ev);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log(`[${tenantId}] QR Received`);

            // Reset retry count on QR generation (fresh start)
            const session = sessions.get(tenantId);
            if (session) {
                session.qr = qr;
                session.status = 'scanning';
                session.retryCount = 0;
                sessions.set(tenantId, session);
            }

            // Emit to tenant room
            io.to(tenantId).emit('qr', qr);
            io.to(tenantId).emit('status', 'scanning');
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 405;
            console.log(`[${tenantId}] Connection closed due to:`, lastDisconnect.error, ', Reconnecting:', shouldReconnect);

            updateSessionStatus(tenantId, 'disconnected');

            if (shouldReconnect) {
                // Increment retry count
                const session = sessions.get(tenantId);
                if (session) {
                    session.retryCount = (session.retryCount || 0) + 1;
                    sessions.set(tenantId, session);
                }

                // Calculate delay and retry
                const delay = getRetryDelay(retryCount);
                console.log(`[${tenantId}] Retrying connection in ${delay / 1000} seconds...`);

                setTimeout(() => {
                    connectToWhatsApp(tenantId, socketToEmit, true);
                }, delay);
            } else {
                console.log(`[${tenantId}] Logged out. Cleaning up session.`);
                sessions.delete(tenantId);
                io.to(tenantId).emit('logged_out', true);
                // Also remove from Supabase (already done in logout, but good for safety)
                supabase.from('whatsapp_sessions').delete().eq('session_id', tenantId).then(() => {
                    console.log(`[${tenantId}] Session cleaned from DB after logout/disconnect`);
                });
            }
        } else if (connection === 'open') {
            console.log(`[${tenantId}] ✅ Connection opened! Bot is ready.`);
            updateSessionStatus(tenantId, 'connected');

            const session = sessions.get(tenantId);
            if (session) {
                session.qr = '';
                session.retryCount = 0; // Reset retry count on successful connection
                sessions.set(tenantId, session);
            }

            io.to(tenantId).emit('qr', ''); // Clear QR
        }
    });

    // Add connection timeout handling
    setTimeout(() => {
        const session = sessions.get(tenantId);
        if (session && session.status === 'connecting') {
            console.log(`[${tenantId}] Connection timeout, retrying...`);
            sock.end();

            const retryCount = session.retryCount || 0;
            if (retryCount < MAX_RETRY_ATTEMPTS) {
                session.retryCount = retryCount + 1;
                sessions.set(tenantId, session);

                const delay = getRetryDelay(retryCount);
                setTimeout(() => {
                    connectToWhatsApp(tenantId, socketToEmit, true);
                }, delay);
            } else {
                updateSessionStatus(tenantId, 'failed');
            }
        }
    }, 60000); // 60 second timeout

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const contactName = msg.pushName || 'User';

            // --- POLL HANDLING ---
            // If it's a poll update (vote), we need to translate it to text
            if (msg.message.pollUpdateMessage) {
                console.log(`[${tenantId}] [DEBUG] Received Poll Update from ${from}`);
                const pollCreation = await sock.getMessage(msg.message.pollUpdateMessage.pollCreationMessageKey);

                if (pollCreation) {
                    const pollMessage = {
                        key: msg.message.pollUpdateMessage.pollCreationMessageKey,
                        message: pollCreation
                    };

                    const votes = getAggregateVotesInPollMessage({
                        message: pollMessage,
                        pollUpdates: [msg],
                    });

                    // Find the voted option
                    const selectedVote = votes.find(v => v.voters.length > 0);
                    if (selectedVote) {
                        const votedText = selectedVote.name;
                        console.log(`[${tenantId}] [DEBUG] User voted: ${votedText}`);

                        // Map Poll Options to Language Codes
                        let langCode = null;
                        if (votedText.includes('English')) langCode = 'lang_en';
                        else if (votedText.includes('मराठी')) langCode = 'lang_mr';
                        else if (votedText.includes('हिंदी')) langCode = 'lang_hi';

                        if (langCode) {
                            await handleMessage(sock, tenantId, from, contactName, langCode);
                            return;
                        }
                    }
                }
            }

            // --- NORMAL MESSAGE HANDLING ---
            // Extract text from various message types
            let text = '';
            if (msg.message.conversation) text = msg.message.conversation;
            else if (msg.message.extendedTextMessage) text = msg.message.extendedTextMessage.text;
            else if (msg.message.imageMessage) text = msg.message.imageMessage.caption || '';
            else if (msg.message.videoMessage) text = msg.message.videoMessage.caption || '';
            else if (msg.message.audioMessage) text = ''; // Audio has no text

            // Handle media messages (image, video, audio) even if text is empty
            const isMedia = !!(msg.message.imageMessage || msg.message.videoMessage || msg.message.audioMessage);

            if (!text && !msg.message.pollUpdateMessage && !isMedia) return; // Skip if empty and not a poll/media

            if (text || isMedia) {
                const cleanText = (text || '').trim();

                // --- LID Resolution Fix ---
                // If message is from a LID (Linked Device), try to resolve to Phone JID
                let resolvedFrom = from;
                if (from.endsWith('@lid')) {
                    console.log(`[${tenantId}] Received message from LID: ${from}. Attempting to resolve to Phone JID.`);

                    // --- Cache Check ---
                    // 0. Check in-memory cache first
                    if (lidCache[from]) {
                        resolvedFrom = lidCache[from];
                        console.log(`[${tenantId}] LID Cache Hit: ${from} -> ${resolvedFrom}`);
                    } else {
                        // Search in store checks
                        // 1. Check if we can find a contact with this LID
                        if (baileysStore && baileysStore.contacts) {
                            const contact = Object.values(baileysStore.contacts).find(c => c.lid === from);
                            if (contact && contact.id) {
                                resolvedFrom = contact.id;
                                lidCache[from] = resolvedFrom; // Update Cache
                                console.log(`[${tenantId}] Resolved LID ${from} to ${resolvedFrom}`);
                            } else {
                                // Fallback: If we sent a message to a phone number recently, maybe we can map it? 
                                // Hard to do reliably.
                                console.warn(`[${tenantId}] Could not resolve LID to Phone JID. Session lookup might fail.`);

                                // Debug: Print some contacts to see structure (limit output)
                                // const sample = Object.values(baileysStore.contacts).slice(0, 3);
                                // console.log(`[${tenantId}] Sample contacts:`, JSON.stringify(sample));

                                // --- Fallback Strategy ---
                                // If we can't resolve LID to Phone JID (e.g. contacts not synced yet),
                                // we need to check if there is an active session for this LID itself.
                                // Staff assignment sets session on PhoneJID.
                                // If we can't map LID -> PhoneJID, we can't find the session.

                                // HACK: Try to find ANY session that has the currentMenu set to STAFF_TASK_DATE_ESTIMATE
                                // This is risky if multiple staff are active, but better than being stuck.
                                // A safer bet: If we assume only 1 active staff task per tenant for now (unlikely), or...

                                // BETTER FALLBACK:
                                // Refer to `menuNavigator` sessions directly.
                                const nav = sessions.get(tenantId)?.menuNavigator;
                                if (nav && nav.userSessions) {
                                    // Search for an active staff session
                                    const activeStaffSessions = Object.entries(nav.userSessions).filter(([id, sess]) => {
                                        return sess.currentMenu === 'STAFF_TASK_DATE_ESTIMATE';
                                    });

                                    if (activeStaffSessions.length === 1) {
                                        // Found exactly one active staff session!
                                        // We can reasonably assume this LID belongs to this staff member.
                                        resolvedFrom = activeStaffSessions[0][0];
                                        lidCache[from] = resolvedFrom; // Update Cache (Critical for subsequent commands like COMPLETE)
                                        console.log(`[${tenantId}] Fuzzy matched LID ${from} to active staff session ${resolvedFrom}`);

                                        // Optional: Link them in memory for future?
                                        // For now, just using it is enough to unblock.
                                    } else if (activeStaffSessions.length > 1) {
                                        console.warn(`[${tenantId}] Multiple staff active. Cannot fuzzy match LID ${from}.`);
                                    } else {
                                        console.warn(`[${tenantId}] No active staff sessions found. LID ${from} remains unresolved.`);
                                    }
                                }
                            }
                        } else {
                            console.warn(`[${tenantId}] Contact store is empty or undefined. Cannot resolve LID.`);
                        }
                    }
                }

                console.log(`[${tenantId}] [DEBUG] Message from ${resolvedFrom} (Original: ${from}) | Media: ${isMedia} | Text: ${cleanText}`);

                // --- Session Migration Hack (Optional) ---
                // If we are using valid resolvedFrom (Phone ID) but the session is empty/default,
                // and we originally had a session on... wait.
                // The issue is simply `resolvedFrom` remaining as `from` (LID) when resolution fails.
                // So `handleMessage` looks up session for LID, finds nothing (default Main Menu),
                // and thus hits "Invalid Option".

                // If we cannot resolve, we MUST send a message asking them to reply from their phone?
                // Or we just improved the Store so it SHOULD work.

                // If it STILL fails, it means `baileysStore.contacts` is empty.
                // Log the size of contacts to be sure.
                if (baileysStore && baileysStore.contacts) {
                    console.log(`[${tenantId}] Contact Store Size: ${Object.keys(baileysStore.contacts).length}`);
                }

                // If we receive a message, we are clearly connected
                if (sessions.get(tenantId)?.status !== 'connected') {
                    updateSessionStatus(tenantId, 'connected');
                }

                await handleMessage(sock, tenantId, resolvedFrom, contactName, cleanText, msg);
            }

        } catch (err) {
            console.error(`[${tenantId}] Error handling message upsert:`, err);
        }
    });
}

function updateSessionStatus(tenantId, status) {
    const session = sessions.get(tenantId);
    if (session) {
        session.status = status;
        sessions.set(tenantId, session);
    }
    io.to(tenantId).emit('status', status);
}

// Handler - Route to MenuNavigator
async function handleMessage(sock, tenantId, userId, userName, text, msg = null) {
    try {
        const session = sessions.get(tenantId);
        if (!session || !session.menuNavigator) {
            console.error(`[${tenantId}] No MenuNavigator found for tenant`);
            return;
        }
        await session.menuNavigator.handleMessage(sock, tenantId, userId, userName, text, msg);
    } catch (error) {
        console.error(`[${tenantId}] Error in menu navigation:`, error);
        // Fallback: show language menu
        const session = sessions.get(tenantId);
        if (session?.menuNavigator) {
            await session.menuNavigator.showLanguageMenu(sock, userId);
        }
    }
}

io.on('connection', (socket) => {
    // console.log('Frontend connected', socket.id);

    // Client must join a tenant room to get events
    socket.on('join_tenant', ({ tenantId }) => {
        if (!tenantId) return;

        console.log(`Socket ${socket.id} joining tenant: ${tenantId}`);
        socket.join(tenantId);

        // Send current status immediately
        const session = sessions.get(tenantId);
        if (session) {
            socket.emit('status', session.status);
            if (session.qr && session.status === 'scanning') {
                socket.emit('qr', session.qr);
            }
        } else {
            // No session exists? Maybe start one automatically?
            // For now, let's say "disconnected"
            socket.emit('status', 'disconnected');
        }
    });

    socket.on('start_session', ({ tenantId }) => {
        if (!tenantId) return;

        // Check if already running
        if (sessions.has(tenantId)) {
            const session = sessions.get(tenantId);
            socket.emit('status', session.status);
            if (session.qr) socket.emit('qr', session.qr);
        } else {
            // Start new session
            connectToWhatsApp(tenantId);
        }
    });

    socket.on('logout_session', ({ tenantId }) => {
        if (!tenantId) return;

        console.log(`[${tenantId}] Manual logout requested by user`);
        logoutSession(tenantId);
    });

    socket.on('disconnect', () => {
        // console.log('Frontend disconnected', socket.id);
    });
});

// --- Session Management ---
async function restoreSessions() {
    try {
        // Use a Set to retrieve unique session IDs
        const { data, error } = await supabase
            .from('whatsapp_sessions')
            .select('session_id');

        if (error) {
            console.error('[Startup] Error fetching sessions from Supabase:', error);
            return;
        }

        // De-duplicate session IDs
        const uniqueSessionIds = [...new Set(data.map(item => item.session_id))];

        console.log(`[Startup] Found ${uniqueSessionIds.length} sessions to restore:`, uniqueSessionIds);

        for (const tenantId of uniqueSessionIds) {
            console.log(`[Startup] Restoring session for tenant: ${tenantId}`);
            // Force connection, which will use existing creds from DB
            await connectToWhatsApp(tenantId);
        }
    } catch (err) {
        console.error('[Startup] Error restoring sessions:', err);
    }
}

// Start server
server.listen(PORT, async () => {
    console.log(`Baileys Multi-Tenant Bot Server running on port ${PORT}`);

    // Restore previous sessions
    await restoreSessions();

    // Keep-Alive Mechanism for Render Free Tier
    // Pings the server every 10 minutes to prevent it from spinning down
    const keepAliveUrl = `http://localhost:${PORT}/`;
    setInterval(() => {
        http.get(keepAliveUrl, (res) => {
            if (res.statusCode === 200) {
                // console.log('[Keep-Alive] Ping successful');
            } else {
                console.error(`[Keep-Alive] Ping failed with status: ${res.statusCode}`);
            }
        }).on('error', (err) => {
            console.error('[Keep-Alive] Ping error:', err.message);
        });
    }, 10 * 60 * 1000); // 10 minutes
});
