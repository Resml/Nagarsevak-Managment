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
// AI Service removed - using menu-driven navigation instead
const MenuNavigator = require('./menuNavigator');
const { sendLetterStatusNotification } = require('./notifications');

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

        // Delete auth folder to force fresh QR scan on next login
        const authPath = path.join('auth_info_baileys', `session_${tenantId}`);
        if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true });
            console.log(`[${tenantId}] Auth folder deleted for fresh login`);
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

// --- Baileys Connection Logic (Per Tenant) ---
async function connectToWhatsApp(tenantId, socketToEmit = null, isRetry = false) {
    if (!tenantId) return;

    const session = sessions.get(tenantId);
    const retryCount = session?.retryCount || 0;

    // Check if we've exceeded max retry attempts
    if (isRetry && retryCount >= MAX_RETRY_ATTEMPTS) {
        console.error(`[${tenantId}] Max retry attempts (${MAX_RETRY_ATTEMPTS}) exceeded. Stopping retries.`);
        updateSessionStatus(tenantId, 'failed');
        return;
    }

    // specific auth folder for this tenant
    const authPath = path.join('auth_info_baileys', `session_${tenantId}`);

    // Create folder if it doesn't exist
    if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authPath, { recursive: true });
    }

    console.log(`[${tenantId}] Initializing Baileys connection... ${isRetry ? `(Retry attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})` : ''}`);

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
        },
        // Add connection stability options
        connectTimeoutMs: 60000, // 60 seconds connection timeout
        keepAliveIntervalMs: 25000, // 25 seconds keep alive
        retryRequestDelayMs: 5000, // 5 seconds between retries
        maxMsgRetryCount: 5, // Maximum message retry attempts
    });

    // Save session to map
    // Create menu navigator instance for this tenant
    const menuNavigator = new MenuNavigator(store);

    sessions.set(tenantId, {
        sock,
        status: 'connecting',
        qr: '',
        store: baileysStore,
        menuNavigator,  // Store MenuNavigator for webhook access
        retryCount: isRetry ? retryCount : 0,
        ev: sock.ev // Store event emitter for cleanup
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
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
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
                // Optionally delete auth folder
                // fs.rmSync(authPath, { recursive: true, force: true });
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
                console.log(`[${tenantId}] [DEBUG] Message from ${from} (Tenant: ${tenantId}) | Media: ${isMedia} | Text: ${cleanText}`);

                // If we receive a message, we are clearly connected
                if (sessions.get(tenantId)?.status !== 'connected') {
                    updateSessionStatus(tenantId, 'connected');
                }

                await handleMessage(sock, tenantId, from, contactName, cleanText, msg);
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
    const authDir = 'auth_info_baileys';
    if (!fs.existsSync(authDir)) return;

    try {
        const files = fs.readdirSync(authDir);
        for (const file of files) {
            // Check for session folders (format: session_{tenantId})
            if (file.startsWith('session_') && fs.lstatSync(path.join(authDir, file)).isDirectory()) {
                const tenantId = file.replace('session_', '');
                console.log(`[Startup] Restoring session for tenant: ${tenantId}`);
                await connectToWhatsApp(tenantId);
            }
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
});
