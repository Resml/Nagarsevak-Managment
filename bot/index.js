const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const store = require('./store');
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

// --- Server Setup ---
const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Valid for Vite default port
        methods: ["GET", "POST"]
    }
});

const PORT = 4000;
const broadcastService = require('./broadcast');
const aiService = require('./aiService');

// Middleware
app.use(express.json()); // Enable JSON body parsing

// --- API Routes ---
app.post('/api/broadcast', async (req, res) => {
    const { eventId } = req.body;

    if (!eventId) {
        return res.status(400).json({ error: 'Event ID required' });
    }

    if (connectionStatus !== 'ready' && connectionStatus !== 'connected') {
        return res.status(503).json({ error: 'Bot not ready yet. Please wait.' });
    }

    console.log('Received broadcast request for Event:', eventId);

    // Run async (don't block response) - or block if we want to confirm start
    // Let's return immediate success that it started
    res.json({ success: true, message: 'Broadcast started in background' });

    // Start Broadcasting
    broadcastService.broadcastEvent(client, eventId);
});

// --- Supabase Setup ---
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Bot Setup ---
const client = new Client({
    authStrategy: new LocalAuth(),
    authTimeoutMs: 60000,
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let lastQR = '';
let connectionStatus = 'disconnected';

io.on('connection', (socket) => {
    console.log('Frontend connected');
    socket.emit('status', connectionStatus);
    if (connectionStatus === 'scanning' && lastQR) {
        socket.emit('qr', lastQR);
    }
});

// --- Realtime Listener for Letters ---
supabase
    .channel('letters-update')
    .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'letter_requests' },
        async (payload) => {
            const newData = payload.new;
            console.log('Letter Request Update:', newData.id, newData.status);

            if (newData.status === 'Approved' && newData.pdf_url) {
                console.log('Letter Approved! Sending PDF to', newData.user_id);

                try {
                    // Fetch PDF Data
                    const response = await fetch(newData.pdf_url);
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    // Create Media
                    const media = new MessageMedia(
                        'application/pdf',
                        buffer.toString('base64'),
                        `${newData.type}_Letter.pdf`
                    );

                    // Send to User
                    const userNumber = newData.user_id.replace('+', '').replace(' ', '') + '@c.us';

                    await client.sendMessage(userNumber, media, {
                        caption: `✅ *Your ${newData.type} Letter is Approved!* \n\nPlease find the document attached.\n\n_Regards,_\n_Nagar Sevak Office_`
                    });

                    console.log('PDF Sent Successfully');

                } catch (err) {
                    console.error('Failed to send PDF:', err);
                }
            }
        }
    )
    .subscribe();

// --- Realtime Listener for Complaints (Auto-Assign) ---
supabase
    .channel('complaints-auto-assign')
    .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'complaints' },
        async (payload) => {
            const newComplaint = payload.new;
            console.log('New Complaint Received:', newComplaint.id);

            // Trigger Auto-Assign
            // We verify if it is already assigned to avoid overwriting (though unlikely on insert)
            if (newComplaint.status === 'Pending' && !newComplaint.assigned_to) {
                await checkAndAssignStaff(newComplaint);
            }
        }
    )
    .subscribe();

client.on('qr', (qr) => {
    // Terminal fallback
    qrcode.generate(qr, { small: true });
    console.log('QR RECEIVED', qr);

    // Web update
    lastQR = qr;
    connectionStatus = 'scanning';
    io.emit('qr', qr);
    io.emit('status', 'scanning');
});

client.on('ready', () => {
    console.log('Client is ready!');
    connectionStatus = 'connected';
    io.emit('status', 'connected');
    io.emit('qr', '');
});

client.on('authenticated', () => {
    console.log('Client is authenticated!');
    connectionStatus = 'authenticated';
    io.emit('status', 'authenticated');
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
    connectionStatus = 'disconnected';
    io.emit('status', 'disconnected');
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
    connectionStatus = 'disconnected';
    io.emit('status', 'disconnected');
});

// --- Bot Logic ---
const userStates = {};

const STATES = {
    IDLE: 'IDLE',
    REPORTING_NAME: 'REPORTING_NAME',
    REPORTING_PROBLEM: 'REPORTING_PROBLEM',
    REPORTING_LOCATION: 'REPORTING_LOCATION',
    REQUESTING_LETTER_TYPE: 'REQUESTING_LETTER_TYPE',
    REQUESTING_LETTER_DETAILS: 'REQUESTING_LETTER_DETAILS',
    REPORTING_PERSONAL_HELP: 'REPORTING_PERSONAL_HELP',
};

client.on('message', async msg => {
    try {
        const chat = await msg.getChat();
        const contact = await msg.getContact();
        const userId = contact.number;
        const userState = userStates[userId] || { step: STATES.IDLE, data: {} };
        const text = msg.body.trim();

        // --- AUDIO HANDLING ---
        if (msg.hasMedia && (msg.type === 'audio' || msg.type === 'ptt')) {
            console.log(`Audio received from ${userId}`);
            await chat.sendMessage('🎤 Received Audio. Processing...');

            try {
                const media = await msg.downloadMedia();
                const fileName = `audio_${userId}_${Date.now()}.ogg`;

                // Upload to Supabase Storage
                // Buffer from base64
                const buffer = Buffer.from(media.data, 'base64');

                const { data, error } = await supabase
                    .storage
                    .from('audio')
                    .upload(fileName, buffer, {
                        contentType: media.mimetype
                    });

                if (error) {
                    console.error('Supabase Upload Error:', error);
                    await chat.sendMessage('❌ Failed to save audio. Please try again.');
                    return;
                }

                // Get Public URL
                const { data: { publicUrl } } = supabase
                    .storage
                    .from('audio')
                    .getPublicUrl(fileName);

                console.log('Audio Uploaded:', publicUrl);

                // Save Complaint
                const complaint = {
                    id: Date.now().toString(),
                    userId: userId,
                    userName: contact.pushname || 'WhatsApp User',
                    problem: 'Voice Message',
                    location: 'Not Provided',
                    audioUrl: publicUrl,
                    timestamp: new Date().toISOString()
                };

                store.saveComplaint(complaint);
                await chat.sendMessage('✅ Voice Complaint Registered!');
                await chat.sendMessage(`Ticket ID: #${complaint.id}`);
                return;

            } catch (err) {
                console.error('Audio processing failed:', err);
                await chat.sendMessage('❌ Error processing audio.');
                return;
            }
        }

        console.log(`Message from ${userId}: ${text} (State: ${userState.step})`);

        // Reset command
        if (text.toLowerCase() === 'reset' || text.toLowerCase() === 'cancel') {
            userStates[userId] = { step: STATES.IDLE, data: {} };
            await chat.sendMessage('❌ Action cancelled. Send "Hi" to start again.');
            return;
        }

        // Main Menu Handler
        if (userState.step === STATES.IDLE) {
            if (['hi', 'hello', 'start', 'menu'].includes(text.toLowerCase())) {
                await sendMainMenu(chat);
            } else if (text === '1') {
                userStates[userId] = { step: STATES.REPORTING_NAME, data: {} };
                await chat.sendMessage('Please enter your *Full Name*:');
            } else if (text === '2') {
                await sendCandidateInfo(chat);
            } else if (text === '3') {
                await sendSchemesInfo(chat);
            } else if (text === '4') {
                await sendEventsInfo(chat);

            } else if (text === '5') {
                userStates[userId] = { step: STATES.REQUESTING_LETTER_TYPE, data: {} };
                const types = `📄 *Select Letter Type*\n\n` +
                    `A. Residential Certificate\n` +
                    `B. Character Certificate\n` +
                    `C. No Objection Certificate (NOC)\n\n` +
                    `_Reply with A, B, or C_`;
                await chat.sendMessage(types);
            } else if (text === '6') {
                userStates[userId] = { step: STATES.REPORTING_PERSONAL_HELP, data: {} };
                await chat.sendMessage(`🆘 *Need Help with Personal Problems?*\n\nWe are here to support you. Please tell us your problem briefly (e.g., "Need financial help for education", "Medical emergency support").\n\n_Type your message below:_`);
            } else {
                // AI Human Touch Fallback
                // If it's not a command, treat it as a conversation
                await chat.sendStateTyping(); // Simulate typing
                const aiResponse = await aiService.getChatResponse(text);
                await chat.sendMessage(aiResponse);
            }
        }
        // Reporting Flow
        else if (userState.step === STATES.REPORTING_NAME) {
            userStates[userId].data.name = text;
            userStates[userId].step = STATES.REPORTING_PROBLEM;
            await chat.sendMessage('Please describe the *Problem* you are facing:');
        }
        else if (userState.step === STATES.REPORTING_PROBLEM) {
            userStates[userId].data.problem = text;
            userStates[userId].step = STATES.REPORTING_LOCATION;
            await chat.sendMessage('Please enter the *Location/Ward* (or send 0 to skip):');
        }
        else if (userState.step === STATES.REPORTING_LOCATION) {
            userStates[userId].data.location = text === '0' ? 'Not Provided' : text;

            // Save Complaint
            const complaint = {
                // id: Date.now().toString(), // No, we insert to supabase and let it generate ID
                userId: userId,
                userName: userStates[userId].data.name,
                problem: userStates[userId].data.problem,
                location: userStates[userId].data.location,
                timestamp: new Date().toISOString()
            };

            // DB Insert
            const { data: insertedData, error } = await supabase
                .from('complaints')
                .insert([{
                    user_id: complaint.userId,
                    user_name: complaint.userName,
                    problem: complaint.problem,
                    location: complaint.location,
                    status: 'Pending',
                    source: 'WhatsApp'
                }])
                .select()
                .single();

            if (error) {
                console.error('Error saving complaint:', error);
                await chat.sendMessage('❌ Error saving complaint. Please try again.');
            } else {
                await chat.sendMessage('✅ *Complaint Registered Successfully!*');
                await chat.sendMessage(`Ticket ID: #${insertedData.id}\nWe will contact you shortly.`);

                await chat.sendMessage(`Ticket ID: #${insertedData.id}\nWe will contact you shortly.`);

                // --- Auto-Assign Logic ---
                // Removed explicit call here as Realtime listener handles it now.
                // await checkAndAssignStaff(insertedData);
            }

            // Reset state
            userStates[userId] = { step: STATES.IDLE, data: {} };
            await sendMainMenu(chat);
        }
        // Letter Request Flow
        else if (userState.step === STATES.REQUESTING_LETTER_TYPE) {
            const map = { 'a': 'Residential', 'b': 'Character', 'c': 'NOC' };
            const selected = map[text.toLowerCase()];

            if (selected) {
                userStates[userId].data.type = selected;
                userStates[userId].step = STATES.REQUESTING_LETTER_DETAILS;
                await chat.sendMessage(`You selected: *${selected}*\n\nPlease enter your *Full Name* for the certificate:`);
            } else {
                await chat.sendMessage('❌ Invalid Option. Please reply with A, B, or C.');
            }
        }
        else if (userState.step === STATES.REQUESTING_LETTER_DETAILS) {
            const name = text;
            const type = userStates[userId].data.type;

            // DB Insert
            const { data, error } = await supabase
                .from('letter_requests')
                .insert([{
                    user_id: userId,
                    type: type,
                    details: { name: name },
                    status: 'Pending'
                }]);

            if (error) {
                console.error('Error saving letter request:', error);
                await chat.sendMessage('❌ Error submitting request. Please try again.');
            } else {
                await chat.sendMessage('✅ *Request Submitted!*');
                await chat.sendMessage(`Your request for a *${type}* has been received.\nWe will notify you once it is approved.`);
            }

            // Reset state
            userStates[userId] = { step: STATES.IDLE, data: {} };
            await sendMainMenu(chat);
        }

        // Personal Help Flow
        else if (userState.step === STATES.REPORTING_PERSONAL_HELP) {
            const problem = text;

            // Save to Complaints with 'Personal Help' category
            const { data: insertedData, error } = await supabase
                .from('complaints')
                .insert([{
                    user_id: userId,
                    user_name: contact.pushname || 'WhatsApp User',
                    problem: problem,
                    location: 'Not Provided',
                    status: 'Pending',
                    category: 'Personal Help',
                    source: 'WhatsApp'
                }])
                .select()
                .single();

            if (error) {
                console.error('Error saving help request:', error);
                await chat.sendMessage('❌ Error submitting request. Please try again.');
            } else {
                await chat.sendMessage('✅ *Request Received!*');
                await chat.sendMessage(`We have noted your problem: "${problem}".\n\nOur team will contact you personally to assist provided we can help. Ticket ID: #${insertedData.id}`);
            }

            // Reset state
            userStates[userId] = { step: STATES.IDLE, data: {} };
            await sendMainMenu(chat);
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
});

// --- Auto Assignment ---
async function checkAndAssignStaff(complaint) {
    try {
        // Fetch all staff
        const { data: staffList } = await supabase.from('staff').select('*');
        if (!staffList || staffList.length === 0) return;

        const problemText = complaint.problem.toLowerCase();
        let assignedStaff = null;

        // Find match
        for (const staff of staffList) {
            if (staff.keywords && staff.keywords.some(k => problemText.includes(k.toLowerCase()))) {
                assignedStaff = staff;
                break;
            }
        }

        if (assignedStaff) {
            console.log(`Auto-assigning complaint #${complaint.id} to ${assignedStaff.name}`);

            // Update DB
            await supabase
                .from('complaints')
                .update({
                    assigned_to: assignedStaff.id,
                    status: 'Assigned'
                })
                .eq('id', complaint.id);

            // Notify Staff via WhatsApp (if valid number)
            // We use the same client to send message
            const staffNumber = assignedStaff.mobile.replace('+', '').replace(' ', '') + '@c.us';
            const message = `🚨 *New Task Assigned*\n\n` +
                `🆔 Ticket: #${complaint.id}\n` +
                `📍 Location: ${complaint.location}\n` +
                `📝 Issue: ${complaint.problem}\n\n` +
                `Please attend to this immediately.`;

            try {
                await client.sendMessage(staffNumber, message);
                console.log(`Notification sent to ${assignedStaff.name}`);
            } catch (msgErr) {
                console.error('Failed to message staff:', msgErr);
            }
        }

    } catch (err) {
        console.error('Auto-assign error:', err);
    }
}

async function sendMainMenu(chat) {
    const menu = `🏛 *Nagar Sevak Bot* 🏛\n\n` +
        `Welcome! How can I help you today?\n\n` +
        `1️⃣ *Report a Problem* 📝\n` +
        `2️⃣ *Candidate Info* 👤\n` +
        `3️⃣ *Schemes* 📜\n` +
        `4️⃣ *Upcoming Events* 🗓\n` +
        `5️⃣ *Request Letter* 📄\n` +
        `6️⃣ *Need Help* 🆘\n\n` +
        `_Reply with the number to select an option._`;
    await chat.sendMessage(menu);
}

async function sendCandidateInfo(chat) {
    const info = `👤 *Candidate Information*\n\n` +
        `*Name:* Rajesh Sharma\n` +
        `*Party:* Janta Sewa Party\n` +
        `*Ward:* 12 - Shivaji Nagar\n\n` +
        `*Vision:* "Clean Ward, Green Ward. Committed to 24/7 water supply and better roads."\n\n` +
        `*Contact:* +91 98765 43210`;
    await chat.sendMessage(info);
}

async function sendSchemesInfo(chat) {
    const schemes = `📜 *Government Schemes*\n\n` +
        `1. *PM Awas Yojana*: Housing for all.\n` +
        `2. *Swachh Bharat*: Sanitation facilities subsidy.\n` +
        `3. *Ayushman Bharat*: Health insurance up to 5L.\n\n` +
        `Reply with scheme name for more details (Mock).`;
    await chat.sendMessage(schemes);
}

async function sendEventsInfo(chat) {
    const events = `🗓 *Upcoming Events*\n\n` +
        `🔹 *Free Health Checkup Camp*\n` +
        `   📅 Date: 25th Jan 2026\n` +
        `   📍 Location: Community Hall, Ward 12\n\n` +
        `🔹 *Voter ID Registration Drive*\n` +
        `   📅 Date: 28th Jan 2026\n` +
        `   📍 Location: Ward Office`;
    await chat.sendMessage(events);
}

client.initialize().catch(err => {
    console.error('Initialization Error:', err);
});

server.listen(PORT, () => {
    console.log(`Bot Server running on port ${PORT}`);
});
