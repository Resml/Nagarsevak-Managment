const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const twilio = require('twilio');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// --- API Keys & Config ---
const SARVAM_API_KEY = process.env.VITE_SARVAM_KEY;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text-translate';
const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech';

// --- In-Memory State for Conversations ---
// We store conversation history grouped by Twilio's CallSid.
// In a production app with multiple instances, use Redis or Supabase.
// Map<CallSid, { history: Array<{role: string, parts: Array<{text: string}>}> }>
const activeCalls = new Map();

// Generate Gemini model
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const SYSTEM_PROMPT = `
You are the AI Assistant for a Nagarsevak (City Councilor) office in Maharashtra.
You are talking to a citizen on a phone call.
Your goal is to help them politely, concisely, and efficiently.
Always respond in natural, conversational Marathi.
DO NOT use markdown (**bold**, *italics*, etc.) because this text will be read by a Text-to-Speech voice engine.
Keep responses short (1-3 sentences maximum) so the user doesn't have to wait long on the phone.

The user can ask about:
- Registering a complaint
- Checking the status of a complaint
- Information on government schemes
- Finding their voter details

Start by asking how you can help them today.
`;

// Helper: Get Base URL
function getBaseUrl(req) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}`;
}

// --------------------------------------------------------------------------
// 1. INCOMING CALL WEBHOOK
// Twilio calls this when someone dials the number.
// --------------------------------------------------------------------------
router.post('/incoming', async (req, res) => {
    const callSid = req.body.CallSid;
    const fromNumber = req.body.From;

    console.log(`[AI-Call] 📞 Incoming call from ${fromNumber} (Sid: ${callSid})`);

    // Initialize conversation state
    activeCalls.set(callSid, {
        history: [
            { role: "user", parts: [{ text: "System Instruction: " + SYSTEM_PROMPT }] },
            { role: "model", parts: [{ text: "Understood." }] }
        ]
    });

    const botBaseUrl = getBaseUrl(req);
    const twiml = new twilio.twiml.VoiceResponse();

    // Welcome message directly in TwiML (Generate TTS on the fly or use a hardcoded audio URL for speed)
    // For speed on the first ring, we'll ask Twilio to gather right away, using a pre-generated basic intro,
    // or we can generate the intro via Sarvam right now.

    try {
        const introText = "नमस्कार! नगरसेवक कार्यालयात आपले स्वागत आहे. मी तुम्हाला कशी मदत करू शकेन?";
        console.log(`[AI-Call][${callSid}] Generating welcome TTS...`);

        const ttsRes = await axios.post(SARVAM_TTS_URL, {
            inputs: [introText],
            target_language_code: "mr-IN",
            speaker: "meera",
            pitch: 0,
            pace: 1.0,
            loudness: 1.5,
            speech_sample_rate: 8000,
            enable_preprocessing: true,
            model: "bulbul:v1"
        }, {
            headers: {
                'Content-Type': 'application/json',
                'api-subscription-key': SARVAM_API_KEY,
            }
        });

        // Store the intro audio temporarily in memory based on Turn ID 0
        const audioBase64 = ttsRes.data.audios[0];
        activeCalls.get(callSid).latestAudio = audioBase64;

        // Play the intro and then start recording
        twiml.play(`${botBaseUrl}/api/inbound-ai/audio/${callSid}`);

    } catch (err) {
        console.error(`[AI-Call][${callSid}] Failed to generate welcome TTS:`, err.message);
        // Fallback to basic Twilio voice if Sarvam fails
        twiml.say({ language: 'mr-IN' }, "Namaskar. Nagarsevak karyalayat aaple swagat aahe. Kashi madat karu shakto?");
    }

    // Start recording user's voice
    twiml.record({
        action: `${botBaseUrl}/api/inbound-ai/process`, // Where to send the recording
        method: 'POST',
        timeout: 2, // Stop recording after 2 seconds of silence
        playBeep: true, // Let the user know they can speak
    });

    res.type('text/xml');
    res.send(twiml.toString());
});


// --------------------------------------------------------------------------
// 2. PROCESS WEBHOOK (Twilio sends the recording here)
// --------------------------------------------------------------------------
router.post('/process', async (req, res) => {
    const callSid = req.body.CallSid;
    const recordingUrl = req.body.RecordingUrl;
    const botBaseUrl = getBaseUrl(req);

    console.log(`[AI-Call][${callSid}] 🎤 Received recording: ${recordingUrl}`);

    const twiml = new twilio.twiml.VoiceResponse();
    const session = activeCalls.get(callSid);

    if (!session) {
        twiml.say({ language: 'mr-IN' }, "Sorry, the session expired. Please call again.");
        twiml.hangup();
        res.type('text/xml');
        return res.send(twiml.toString());
    }

    if (!recordingUrl) {
        // User didn't say anything
        twiml.play(`${botBaseUrl}/api/inbound-ai/audio/${callSid}`); // replay the last thing
        twiml.record({ action: `${botBaseUrl}/api/inbound-ai/process`, timeout: 2, playBeep: true });
        res.type('text/xml');
        return res.send(twiml.toString());
    }

    try {
        // --- STEP A: Download Audio from Twilio ---
        // Note: Twilio appends .wav to the URL when we want WAV format
        const audioRes = await axios.get(`${recordingUrl}.wav`, { responseType: 'arraybuffer' });
        const audioBuffer = Buffer.from(audioRes.data, 'binary');

        // --- STEP B: STT (Sarvam Speech to Text Translate) ---
        console.log(`[AI-Call][${callSid}] Sending to Sarvam STT...`);
        const form = new FormData();
        form.append('file', audioBuffer, { filename: 'recording.wav', contentType: 'audio/wav' });
        form.append('prompt', '');

        const sttRes = await axios.post(SARVAM_STT_URL, form, {
            headers: {
                ...form.getHeaders(),
                'api-subscription-key': SARVAM_API_KEY
            }
        });

        const transcript = sttRes.data.transcript;
        console.log(`[AI-Call][${callSid}] 👤 Citizen said: "${transcript}"`);

        if (!transcript || transcript.trim() === '') {
            // Nothing transcribed
            twiml.record({ action: `${botBaseUrl}/api/inbound-ai/process`, timeout: 2, playBeep: true });
            res.type('text/xml');
            return res.send(twiml.toString());
        }

        // --- STEP C: LLM Brain (Gemini) ---
        console.log(`[AI-Call][${callSid}] Asking Gemini...`);
        const chat = model.startChat({ history: session.history });
        const aiResponse = await chat.sendMessage(transcript);
        const replyText = aiResponse.response.text();

        console.log(`[AI-Call][${callSid}] 🤖 AI replied: "${replyText}"`);

        // Save back to our history state (Gemini handles it internally on the 'chat' object, 
        // but we overwrite our history array so we can re-instantiate it next turn)
        session.history = await chat.getHistory();

        // --- STEP D: TTS (Sarvam Text to Speech) ---
        console.log(`[AI-Call][${callSid}] Generating TTS...`);
        const ttsRes = await axios.post(SARVAM_TTS_URL, {
            inputs: [replyText],
            target_language_code: "mr-IN",
            speaker: "meera",
            pitch: 0,
            pace: 1.0,
            loudness: 1.5,
            speech_sample_rate: 8000,
            enable_preprocessing: true,
            model: "bulbul:v1"
        }, {
            headers: {
                'Content-Type': 'application/json',
                'api-subscription-key': SARVAM_API_KEY,
            }
        });

        // Store new audio in session
        session.latestAudio = ttsRes.data.audios[0];

        // --- STEP E: Render TwiML ---
        // Play the audio we just made, then immediately record again
        twiml.play(`${botBaseUrl}/api/inbound-ai/audio/${callSid}?t=${Date.now()}`); // Cache buster
        twiml.record({
            action: `${botBaseUrl}/api/inbound-ai/process`,
            timeout: 3, // Wait longer for them to think before cutting off
            playBeep: true,
        });

    } catch (err) {
        console.error(`[AI-Call][${callSid}] Pipeline Error:`, err.message);
        if (err.response) {
            console.error(`Status: ${err.response.status}`, err.response.data);
        }
        twiml.say({ language: 'mr-IN' }, "Kahi taantrik adchan aali aahe. Krupaya nantar prayatna kara.");
        twiml.hangup();
    }

    res.type('text/xml');
    res.send(twiml.toString());
});

// --------------------------------------------------------------------------
// 3. AUDIO SERVER (Twilio fetches the TTS generated audio)
// --------------------------------------------------------------------------
router.get('/audio/:callSid', (req, res) => {
    const callSid = req.params.callSid;
    const session = activeCalls.get(callSid);

    if (!session || !session.latestAudio) {
        console.log(`[AI-Call][${callSid}] Audio requested but none found!`);
        return res.status(404).send('Audio not found');
    }

    // Convert base64 from Sarvam back to binary buffer
    const audioBuffer = Buffer.from(session.latestAudio, 'base64');

    // Add simple WAV header (Sarvam returns raw PCM 8000Hz)
    // Twilio requires perfectly formatted audio.
    const wavHeader = buildWavHeader(audioBuffer.length, 8000);
    const finalAudio = Buffer.concat([wavHeader, audioBuffer]);

    res.set({
        'Content-Type': 'audio/x-wav',
        'Content-Length': finalAudio.length
    });

    res.send(finalAudio);
});

// --- Fallback Routing for Call Status ---
router.post('/status', (req, res) => {
    const callSid = req.body.CallSid;
    const status = req.body.CallStatus;
    console.log(`[AI-Call][${callSid}] Status Update: ${status}`);

    if (status === 'completed' || status === 'failed' || status === 'busy' || status === 'no-answer') {
        // Clean up memory
        activeCalls.delete(callSid);
        console.log(`[AI-Call][${callSid}] Call ended. Session cleaned up.`);
    }

    res.sendStatus(200);
});

// --- Helpers ---
function buildWavHeader(dataLength, sampleRate = 8000) {
    const buffer = Buffer.alloc(44);
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataLength, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size
    buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(1, 22);  // NumChannels (1 = Mono)
    buffer.writeUInt32LE(sampleRate, 24); // SampleRate
    buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
    buffer.writeUInt16LE(2, 32);  // BlockAlign (NumChannels * BitsPerSample/8)
    buffer.writeUInt16LE(16, 34); // BitsPerSample
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);
    return buffer;
}

module.exports = router;
