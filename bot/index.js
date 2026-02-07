const { makeWASocket, useMultiFileAuthState, DisconnectReason, getAggregateVotesInPollMessage, delay } = require('@whiskeysockets/baileys');
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
const aiService = require('./aiService');
const LOCALES = require('./locales'); // Import Locales

// --- Custom Simple Store for Polls ---
class SimpleStore {
    constructor() {
        this.messages = {}; // jid -> { id -> message }
    }

    bind(ev) {
        ev.on('messages.upsert', (data) => {
            for (const msg of data.messages) {
                const jid = msg.key.remoteJid;
                if (!this.messages[jid]) this.messages[jid] = {};
                this.messages[jid][msg.key.id] = msg;
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
// Map<tenantId, { sock: WASocket, status: string, qr: string, store: SimpleStore }>
const sessions = new Map();

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

// --- Baileys Connection Logic (Per Tenant) ---
async function connectToWhatsApp(tenantId, socketToEmit = null) {
    if (!tenantId) return;

    // specific auth folder for this tenant
    const authPath = path.join('auth_info_baileys', `session_${tenantId}`);

    // Create folder if it doesn't exist
    if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authPath, { recursive: true });
    }

    console.log(`[${tenantId}] Initializing Baileys connection...`);

    // Update status to connecting
    updateSessionStatus(tenantId, 'connecting');

    const { state, saveCreds } = await useMultiFileAuthState(authPath);

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
        }
    });

    // Save session to map
    sessions.set(tenantId, {
        sock,
        status: 'connecting',
        qr: '',
        store: baileysStore
    });

    // Bind Store (Global store for now)
    baileysStore.bind(sock.ev);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log(`[${tenantId}] QR Received`);

            // Generate basic text QR for terminal logs if needed, but mainly emit to frontend
            // qrcode.generate(qr, { small: true }); 

            const session = sessions.get(tenantId);
            if (session) {
                session.qr = qr;
                session.status = 'scanning';
                sessions.set(tenantId, session);
            }

            // Emit to tenant room
            io.to(tenantId).emit('qr', qr);
            io.to(tenantId).emit('status', 'scanning');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`[${tenantId}] Connection closed due to:`, lastDisconnect.error, ', Reconnecting:', shouldReconnect);

            updateSessionStatus(tenantId, 'disconnected');

            if (shouldReconnect) {
                connectToWhatsApp(tenantId); // Reconnect
            } else {
                console.log(`[${tenantId}] Logged out. Cleaning up session.`);
                sessions.delete(tenantId);
                // Optionally delete auth folder
                // fs.rmSync(authPath, { recursive: true, force: true });
            }
        } else if (connection === 'open') {
            console.log(`[${tenantId}] ✅ Connection opened! Bot is ready.`);
            updateSessionStatus(tenantId, 'connected');

            const session = sessions.get(tenantId);
            if (session) {
                session.qr = '';
                sessions.set(tenantId, session);
            }

            io.to(tenantId).emit('qr', ''); // Clear QR
        }
    });

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

            // Allow text fallback for languages
            if (!text && !msg.message.pollUpdateMessage) return; // Skip if empty and not a poll

            if (text) {
                text = text.trim();
                console.log(`[${tenantId}] [DEBUG] Message from ${from}: ${text}`);
                await handleMessage(sock, tenantId, from, contactName, text);
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

// --- Bot Logic ---
const userStates = {};

const STATES = {
    IDLE: 'IDLE',
    REPORTING_NAME: 'REPORTING_NAME',
    REPORTING_PROBLEM: 'REPORTING_PROBLEM',
};

// Helper: Send Language Selection (Text Fallback)
async function sendLanguageSelection(sock, jid) {
    const text = `👋 *Welcome / स्वागत आहे / स्वागत है*\n\n` +
        `Please select your language / कृपया तुमची भाषा निवडा:\n\n` +
        `1️⃣ *English*\n` +
        `2️⃣ *मराठी*\n` +
        `3️⃣ *हिंदी*\n\n` +
        `_Reply with 1, 2, or 3_`;

    await sock.sendMessage(jid, { text: text });
}

// Helper: Send Main Menu (Text)
async function sendMainMenu(sock, jid, langCode) {
    const locale = LOCALES[langCode] || LOCALES.en;

    let menuText = `*${locale.menu_title}*\n${locale.menu_body}\n\n`;
    menuText += `1️⃣ ${locale.menu_options.report}\n`;
    menuText += `2️⃣ ${locale.menu_options.candidate}\n`;
    menuText += `3️⃣ ${locale.menu_options.schemes}\n`;
    menuText += `4️⃣ ${locale.menu_options.events}\n`;
    menuText += `\n_Reply with 1-4 to select_`;

    await sock.sendMessage(jid, { text: menuText });
}

// Handler
async function handleMessage(sock, tenantId, userId, userName, text) {
    // 1. Load User & Language Preference
    let user = await store.getUser(userId);
    let lang = user?.language;

    // --- Onboarding Flow (Language Selection) ---
    if (!lang) {
        // Check input
        if (text === 'lang_en' || text === '1' || text.toLowerCase().includes('english')) lang = 'en';
        else if (text === 'lang_mr' || text === '2' || text.includes('मराठी')) lang = 'mr';
        else if (text === 'lang_hi' || text === '3' || text.includes('हिंदी')) lang = 'hi';

        if (lang) {
            // Save Language
            await store.saveUser(userId, { language: lang, name: userName });
            const locale = LOCALES[lang];
            await sock.sendMessage(userId, { text: locale.language_selected });

            // Proceed to Menu
            await sendMainMenu(sock, userId, lang);
            return;
        } else {
            // No Language Set -> Prompt with POLL
            await sendLanguageSelection(sock, userId);
            return;
        }
    }

    // --- Main Flow (Language Set) ---
    const locale = LOCALES[lang];
    // Key user state by tenant too if needed, but mostly userId is unique globally (phone number)
    const userState = userStates[userId] || { step: STATES.IDLE, data: {} };

    // Global Reset
    if (['reset', 'menu', 'start', 'hi', 'hello'].includes(text.toLowerCase())) {
        userStates[userId] = { step: STATES.IDLE, data: {} };
        await sendMainMenu(sock, userId, lang);
        return;
    }

    if (userState.step === STATES.IDLE) {
        // Handle Menu Selections (List IDs or Text IDs)
        if (text === 'menu_report' || text === '1') {
            userStates[userId] = { step: STATES.REPORTING_NAME, data: {} };
            await sock.sendMessage(userId, { text: locale.prompts.name });
        }
        else if (text === 'menu_candidate' || text === '2') {
            await sock.sendMessage(userId, { text: `👤 Candidate: Nagarsevak (Ward 12)` });
            await sendMainMenu(sock, userId, lang);
        }
        else if (text === 'menu_schemes' || text === '3') {
            await sock.sendMessage(userId, { text: `📜 *Available Schemes*:\n\n1. PM Awas Yojana\n2. Ladki Bahin Yojana\n\nVisit Ward Office for forms.` });
            await sendMainMenu(sock, userId, lang);
        }
        // ... Handle other menu items
        else {
            // Unknown Input -> Show Menu Again
            await sendMainMenu(sock, userId, lang);
        }
    }
    // Form Filling Flow
    else if (userState.step === STATES.REPORTING_NAME) {
        userStates[userId].data.name = text;
        userStates[userId].step = STATES.REPORTING_PROBLEM;
        await sock.sendMessage(userId, { text: locale.prompts.problem });
    }
    else if (userState.step === STATES.REPORTING_PROBLEM) {
        userStates[userId].data.problem = text;

        // Save
        const complaint = {
            userId: userId,
            userName: userStates[userId].data.name,
            problem: userStates[userId].data.problem,
            timestamp: new Date().toISOString(),
            tenantId: tenantId // Link complaint to tenant
        };
        store.saveComplaint(complaint);

        await sock.sendMessage(userId, { text: locale.prompts.registered });

        userStates[userId] = { step: STATES.IDLE, data: {} };
        await sendMainMenu(sock, userId, lang);
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

    socket.on('disconnect', () => {
        // console.log('Frontend disconnected', socket.id);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Baileys Multi-Tenant Bot Server running on port ${PORT}`);

    const pino = require('pino');
    const express = require('express');
    const http = require('http');
    const { Server } = require("socket.io");
    const cors = require('cors');
    const { createClient } = require('@supabase/supabase-js');
    const qrcode = require('qrcode-terminal');
    require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

    const store = require('./store');
    const broadcastService = require('./broadcast');
    const aiService = require('./aiService');
    const LOCALES = require('./locales'); // Import Locales

    // --- Custom Simple Store for Polls ---
    class SimpleStore {
        constructor() {
            this.messages = {}; // jid -> { id -> message }
        }

        bind(ev) {
            ev.on('messages.upsert', (data) => {
                for (const msg of data.messages) {
                    const jid = msg.key.remoteJid;
                    if (!this.messages[jid]) this.messages[jid] = {};
                    this.messages[jid][msg.key.id] = msg;
                }
            });
        }

        async loadMessage(jid, id) {
            return this.messages[jid]?.[id];
        }
    }

    // --- Baileys Store (For Polls) ---
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
        <p>Status: <strong>${connectionStatus}</strong></p>
        <p>Use the frontend to scan QR code.</p>
    `);
    });

    // --- Supabase Setup ---
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // --- Globals ---
    let sock;
    let connectionStatus = 'disconnected';
    let lastQR = '';

    // --- API Routes ---
    app.post('/api/broadcast', async (req, res) => {
        const { eventId } = req.body;

        if (!eventId) {
            return res.status(400).json({ error: 'Event ID required' });
        }

        if (connectionStatus !== 'connected') {
            return res.status(503).json({ error: 'Bot not ready yet. Please wait.' });
        }

        console.log('Received broadcast request for Event:', eventId);
        broadcastService.broadcastEvent(sock, eventId);
        res.json({ success: true, message: 'Broadcast started in background' });
    });

    // --- Baileys Connection Logic ---
    async function connectToWhatsApp() {
        console.log('Initializing Baileys connection...');
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

        sock = makeWASocket({
            auth: state,
            logger: pino({ level: 'silent' }),
            msgRetryCounterCache,
            getMessage: async (key) => {
                if (baileysStore) {
                    const msg = await baileysStore.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return { conversation: 'hello' };
            }
        });

        // Bind Store
        baileysStore.bind(sock.ev);

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('QR Received via Baileys');
                qrcode.generate(qr, { small: true });
                lastQR = qr;
                connectionStatus = 'scanning';
                io.emit('qr', qr);
                io.emit('status', 'scanning');
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('Connection closed due to:', lastDisconnect.error, ', Reconnecting:', shouldReconnect);
                connectionStatus = 'disconnected';
                io.emit('status', 'disconnected');
                if (shouldReconnect) {
                    connectToWhatsApp();
                }
            } else if (connection === 'open') {
                console.log('✅ Connection opened! Bot is ready.');
                connectionStatus = 'connected';
                io.emit('status', 'connected');
                io.emit('qr', '');
                lastQR = '';
            }
        });

        sock.ev.on('messages.upsert', async (m) => {
            try {
                const msg = m.messages[0];
                if (!msg.message || msg.key.fromMe) return;

                const from = msg.key.remoteJid;
                const contactName = msg.pushName || 'User';

                // --- POLL HANDLING ---
                // If it's a poll update (vote), we need to translate it to text
                if (msg.message.pollUpdateMessage) {
                    console.log(`[DEBUG] Received Poll Update from ${from}`);
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
                            console.log(`[DEBUG] User voted: ${votedText}`);

                            // Map Poll Options to Language Codes
                            let langCode = null;
                            if (votedText.includes('English')) langCode = 'lang_en';
                            else if (votedText.includes('मराठी')) langCode = 'lang_mr';
                            else if (votedText.includes('हिंदी')) langCode = 'lang_hi';

                            if (langCode) {
                                await handleMessage(from, contactName, langCode);
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

                // Allow text fallback for languages
                if (!text && !msg.message.pollUpdateMessage) return; // Skip if empty and not a poll

                if (text) {
                    text = text.trim();
                    console.log(`[DEBUG] Message from ${from}: ${text}`);
                    await handleMessage(from, contactName, text);
                }

            } catch (err) {
                console.error('Error handling message upsert:', err);
            }
        });
    }

    // --- Bot Logic ---
    const userStates = {};

    const STATES = {
        IDLE: 'IDLE',
        REPORTING_NAME: 'REPORTING_NAME',
        REPORTING_PROBLEM: 'REPORTING_PROBLEM',
    };

    // Helper: Send Language Selection (Text Fallback)
    async function sendLanguageSelection(jid) {
        const text = `👋 *Welcome / स्वागत आहे / स्वागत है*\n\n` +
            `Please select your language / कृपया तुमची भाषा निवडा:\n\n` +
            `1️⃣ *English*\n` +
            `2️⃣ *मराठी*\n` +
            `3️⃣ *हिंदी*\n\n` +
            `_Reply with 1, 2, or 3_`;

        await sock.sendMessage(jid, { text: text });
    }

    // Helper: Send Main Menu (Text)
    async function sendMainMenu(jid, langCode) {
        const locale = LOCALES[langCode] || LOCALES.en;

        let menuText = `*${locale.menu_title}*\n${locale.menu_body}\n\n`;
        menuText += `1️⃣ ${locale.menu_options.report}\n`;
        menuText += `2️⃣ ${locale.menu_options.candidate}\n`;
        menuText += `3️⃣ ${locale.menu_options.schemes}\n`;
        menuText += `4️⃣ ${locale.menu_options.events}\n`;
        menuText += `\n_Reply with 1-4 to select_`;

        await sock.sendMessage(jid, { text: menuText });
    }

    // Handler
    async function handleMessage(userId, userName, text) {
        // 1. Load User & Language Preference
        let user = await store.getUser(userId);
        let lang = user?.language;

        // --- Onboarding Flow (Language Selection) ---
        if (!lang) {
            // Check input
            if (text === 'lang_en' || text === '1' || text.toLowerCase().includes('english')) lang = 'en';
            else if (text === 'lang_mr' || text === '2' || text.includes('मराठी')) lang = 'mr';
            else if (text === 'lang_hi' || text === '3' || text.includes('हिंदी')) lang = 'hi';

            if (lang) {
                // Save Language
                await store.saveUser(userId, { language: lang, name: userName });
                const locale = LOCALES[lang];
                await sock.sendMessage(userId, { text: locale.language_selected });

                // Proceed to Menu
                await sendMainMenu(userId, lang);
                return;
            } else {
                // No Language Set -> Prompt with POLL
                await sendLanguageSelection(userId);
                return;
            }
        }

        // --- Main Flow (Language Set) ---
        const locale = LOCALES[lang];
        const userState = userStates[userId] || { step: STATES.IDLE, data: {} };

        // Global Reset
        if (['reset', 'menu', 'start', 'hi', 'hello'].includes(text.toLowerCase())) {
            userStates[userId] = { step: STATES.IDLE, data: {} };
            await sendMainMenu(userId, lang);
            return;
        }

        if (userState.step === STATES.IDLE) {
            // Handle Menu Selections (List IDs or Text IDs)
            if (text === 'menu_report' || text === '1') {
                userStates[userId] = { step: STATES.REPORTING_NAME, data: {} };
                await sock.sendMessage(userId, { text: locale.prompts.name });
            }
            else if (text === 'menu_candidate' || text === '2') {
                await sock.sendMessage(userId, { text: `👤 Candidate: Rajesh Sharma (Ward 12)` });
                await sendMainMenu(userId, lang);
            }
            else if (text === 'menu_schemes' || text === '3') {
                await sock.sendMessage(userId, { text: `📜 *Available Schemes*:\n\n1. PM Awas Yojana\n2. Ladki Bahin Yojana\n\nVisit Ward Office for forms.` });
                await sendMainMenu(userId, lang);
            }
            // ... Handle other menu items
            else {
                // Unknown Input -> Show Menu Again
                await sendMainMenu(userId, lang);
            }
        }
        // Form Filling Flow
        else if (userState.step === STATES.REPORTING_NAME) {
            userStates[userId].data.name = text;
            userStates[userId].step = STATES.REPORTING_PROBLEM;
            await sock.sendMessage(userId, { text: locale.prompts.problem });
        }
        else if (userState.step === STATES.REPORTING_PROBLEM) {
            userStates[userId].data.problem = text;

            // Save
            const complaint = {
                userId: userId,
                userName: userStates[userId].data.name,
                problem: userStates[userId].data.problem,
                timestamp: new Date().toISOString()
            };
            store.saveComplaint(complaint);

            await sock.sendMessage(userId, { text: locale.prompts.registered });

            userStates[userId] = { step: STATES.IDLE, data: {} };
            await sendMainMenu(userId, lang);
        }
    }

    io.on('connection', (socket) => {
        console.log('Frontend connected');
        socket.emit('status', connectionStatus);
        if (connectionStatus === 'scanning' && lastQR) {
            socket.emit('qr', lastQR);
        }
    });

    // Start
    connectToWhatsApp();

    server.listen(PORT, () => {
        console.log(`Baileys Bot Server running on port ${PORT}`);
    });
