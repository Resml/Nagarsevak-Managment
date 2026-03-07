const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
// dotenv already loaded by bot/index.js


// Twilio client
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;
const SARVAM_API_KEY = process.env.VITE_SARVAM_KEY;
const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech';

// Supabase for logging
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

// Log startup config (no sensitive values)
console.log('[SarvamCall] Route loaded. Config check:',
    'TWILIO_SID:', TWILIO_SID ? '✅ set' : '❌ MISSING',
    'TWILIO_TOKEN:', TWILIO_TOKEN ? '✅ set' : '❌ MISSING',
    'TWILIO_FROM:', TWILIO_FROM || '❌ MISSING',
    'SARVAM_KEY:', SARVAM_API_KEY ? '✅ set' : '❌ MISSING'
);

// In-memory store for TTS audio (keyed by callId, cleaned up after use)
const audioStore = {};

// -----------------------------------------------------------------------
// POST /api/sarvam-call
// Body: { tenantId, numbers: [{mobile, name}], message, language }
// -----------------------------------------------------------------------
router.post('/initiate', async (req, res) => {
    const { tenantId, numbers, message, language = 'mr-IN' } = req.body;

    if (!tenantId || !numbers?.length || !message) {
        return res.status(400).json({ error: 'tenantId, numbers[], and message are required' });
    }

    if (!TWILIO_FROM || !TWILIO_SID || !TWILIO_TOKEN) {
        return res.status(500).json({ error: 'Twilio credentials not configured on server. Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER to Render environment variables.' });
    }
    if (!SARVAM_API_KEY) {
        return res.status(500).json({ error: 'VITE_SARVAM_KEY not configured on server.' });
    }

    // Init Twilio client here (to use latest env vars)
    const twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);

    console.log(`[SarvamCall][${tenantId}] Starting AI calls to ${numbers.length} recipients`);

    // 1. Generate Marathi TTS audio using Sarvam Bulbul
    let audioBase64 = null;
    try {
        const ttsRes = await axios.post(SARVAM_TTS_URL, {
            inputs: [message],
            target_language_code: language,   // 'mr-IN' for Marathi
            speaker: 'anushka',               // Female Marathi voice
            model: 'bulbul:v2',
            enable_preprocessing: true,
            speech_sample_rate: 8000          // 8kHz = optimal for phone calls
        }, {
            headers: {
                'api-subscription-key': SARVAM_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        const audios = ttsRes.data?.audios;
        if (!audios || audios.length === 0) {
            return res.status(500).json({ error: 'Sarvam TTS returned no audio' });
        }
        audioBase64 = audios[0];
        console.log(`[SarvamCall][${tenantId}] TTS generated successfully`);
    } catch (ttsErr) {
        console.error(`[SarvamCall][${tenantId}] Sarvam TTS error:`, ttsErr.response?.data || ttsErr.message);
        return res.status(500).json({ error: 'Failed to generate audio: ' + (ttsErr.response?.data?.message || ttsErr.message) });
    }

    // 2. Store audio with a unique key so the Twilio webhook can serve it
    const callBatchId = `batch_${Date.now()}`;
    audioStore[callBatchId] = {
        audio: audioBase64,
        createdAt: Date.now()
    };

    // Clean up old audio entries (older than 15 min)
    const cutoff = Date.now() - 15 * 60 * 1000;
    for (const key of Object.keys(audioStore)) {
        if (audioStore[key].createdAt < cutoff) delete audioStore[key];
    }

    // 3. Build the TwiML webhook URL (Twilio will call this when the call connects)
    const botBaseUrl = process.env.VITE_BOT_API_URL || `http://localhost:${process.env.PORT || 4000}`;
    const twimlUrl = `${botBaseUrl}/api/sarvam-call/twiml/${callBatchId}`;

    // 4. Initiate calls via Twilio (with delay between each)
    res.json({ success: true, message: `Initiating ${numbers.length} calls in background`, callBatchId });

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    let succeeded = 0;
    let failed = 0;

    (async () => {
        for (const recipient of numbers) {
            try {
                let num = (recipient.mobile || '').replace(/\D/g, '');
                if (num.length === 10) num = '91' + num;
                if (!num || num.length < 11) { failed++; continue; }

                const toNumber = '+' + num;

                await twilioClient.calls.create({
                    url: twimlUrl,
                    to: toNumber,
                    from: TWILIO_FROM,
                    timeout: 30,                // Ring for 30 seconds
                    machineDetection: 'Enable', // Skip voicemails
                });

                console.log(`[SarvamCall][${tenantId}] ✅ Call initiated to ${toNumber}`);
                succeeded++;

                // 3s delay between calls to avoid Twilio rate limits
                await sleep(3000);
            } catch (callErr) {
                console.error(`[SarvamCall][${tenantId}] ❌ Call failed to ${recipient.mobile}:`, callErr.message);
                failed++;
            }
        }

        console.log(`[SarvamCall][${tenantId}] Calls complete: ${succeeded} succeeded, ${failed} failed`);

        // Log to message_logs table
        try {
            await supabase.from('message_logs').insert({
                tenant_id: tenantId,
                channel: 'call',
                message,
                recipients: numbers.length,
                sent_count: succeeded,
                failed_count: failed,
                created_by: 'Admin (AI Call)'
            });
        } catch (logErr) {
            console.error(`[SarvamCall][${tenantId}] Failed to save call log:`, logErr.message);
        }
    })();
});

// -----------------------------------------------------------------------
// GET /api/sarvam-call/twiml/:callBatchId
// Twilio calls this when the recipient picks up — returns the TwiML with audio
// -----------------------------------------------------------------------
router.get('/twiml/:callBatchId', (req, res) => {
    const { callBatchId } = req.params;
    const entry = audioStore[callBatchId];

    res.set('Content-Type', 'text/xml');

    if (!entry) {
        // Fallback TwiML if audio expired
        return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="mr-IN">नमस्कार. हा नगरसेवक कार्यालयाचा संदेश आहे. धन्यवाद.</Say>
</Response>`);
    }

    // Serve the Sarvam-generated audio as a base64 WAV
    // Twilio supports Play with a URL — we serve the raw WAV
    const botBaseUrl = process.env.VITE_BOT_API_URL || `http://localhost:${process.env.PORT || 4000}`;
    const audioUrl = `${botBaseUrl}/api/sarvam-call/audio/${callBatchId}`;

    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>${audioUrl}</Play>
    <Pause length="1"/>
    <Hangup/>
</Response>`);
});

// -----------------------------------------------------------------------
// GET /api/sarvam-call/audio/:callBatchId
// Serves the raw WAV audio file to Twilio
// -----------------------------------------------------------------------
router.get('/audio/:callBatchId', (req, res) => {
    const { callBatchId } = req.params;
    const entry = audioStore[callBatchId];

    if (!entry || !entry.audio) {
        return res.status(404).send('Audio not found');
    }

    const audioBuffer = Buffer.from(entry.audio, 'base64');
    res.set('Content-Type', 'audio/wav');
    res.set('Content-Length', audioBuffer.length);
    res.send(audioBuffer);
});

module.exports = router;
