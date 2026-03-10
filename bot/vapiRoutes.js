const express = require('express');
const router = express.Router();
const store = require('./store');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Vapi Assistant Configuration ---
const ASSISTANT_CONFIG = {
    name: "Nagarsevak Voice Assistant",
    voice: {
        provider: "11labs",
        voiceId: "sarah", // Good standard voice, enables multilingual
    },
    model: {
        model: "gpt-4o", // Best for Marathi understanding
        messages: [
            {
                role: "system",
                content: `You are a helpful voice assistant for a Nagarsevak (City Councilor) office. 
Your goal is to help citizens with their complaints, schemes information, and emergency contacts.

**Language Handling:**
- You MUST support **Marathi**, **Hindi**, and **English**.
- Detect the user's language from their greeting or first sentence.
- If they speak Marathi, reply in Marathi.
- If they speak English, reply in English.
- If mixed, reply in the language that seems most comfortable for them (usually Marathi/Hindi in this context).

**Personality:**
- Be polite, patient, and respectful (use "Namaskar", "Johar", "Hello" as appropriate).
- Keep answers concise suitable for voice (avoid long lists, summarize).
- Act as a bridge between the citizen and the administration.

**Capabilities (Tools):**
1.  **Check Complaint Status**: Ask for their mobile number.
2.  **Register Complaint**: Ask for Name, Mobile, Location, and Problem Description.
3.  **Search Schemes**: Answer questions about government schemes.
4.  **Emergency Contacts**: Provide helper numbers.

**Important:**
- When asking for a mobile number, wait for the user to speak it. If unclear, ask to repeat.
- For complaints, summarize what you heard before confirming registration.
`
            }
        ],
        tools: [
            {
                type: "function",
                function: {
                    name: "checkComplaintStatus",
                    description: "Check the status of a complaint using the user's mobile number.",
                    parameters: {
                        type: "object",
                        properties: {
                            mobile: {
                                type: "string",
                                description: "The 10-digit mobile number of the user."
                            }
                        },
                        required: ["mobile"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "registerComplaint",
                    description: "Register a new complaint for the user.",
                    parameters: {
                        type: "object",
                        properties: {
                            name: { type: "string", description: "Name of the complainant" },
                            mobile: { type: "string", description: "Mobile number" },
                            category: {
                                type: "string",
                                enum: ["Road", "Water", "Electricity", "Waste", "Drainage", "Other"],
                                description: "Category of the problem"
                            },
                            location: { type: "string", description: "Location or area of the problem" },
                            description: { type: "string", description: "Detailed description of the problem" }
                        },
                        required: ["name", "mobile", "category", "location", "description"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "searchSchemes",
                    description: "Search for government schemes based on keywords.",
                    parameters: {
                        type: "object",
                        properties: {
                            query: { type: "string", description: "Keywords to search for (e.g. 'education', 'women', 'senior citizen')" }
                        },
                        required: ["query"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "getEmergencyContacts",
                    description: "Get emergency contact numbers for the ward.",
                    parameters: {
                        type: "object",
                        properties: {}
                    }
                }
            }
        ]
    }
};

// --- Webhook for Vapi ---
// Vapi sends a POST request here when the call starts or when a tool is called.
router.post('/', async (req, res) => {
    try {
        const body = req.body;
        console.log('[Vapi] Received webhook:', body.type || 'Unknown Type');

        // 1. Assistant Request (Call Start)
        // Vapi asks "What assistant should I use?"
        if (body.message && body.message.type === 'assistant-request') {
            console.log('[Vapi] Sending Assistant Config');
            return res.json(ASSISTANT_CONFIG);
        }

        // 2. Tool Calls (Function Execution)
        // Vapi says "The AI wants to call this function."
        if (body.message && body.message.type === 'tool-calls') {
            const toolCalls = body.message.toolCalls;
            const results = [];

            for (const call of toolCalls) {
                const { id, type, function: func } = call;
                console.log(`[Vapi] Tool Call: ${func.name}`, func.arguments);

                let resultPayload = {};

                // Execute the Requested Function
                try {
                    switch (func.name) {
                        case 'checkComplaintStatus':
                            resultPayload = await handleCheckStatus(func.arguments);
                            break;
                        case 'registerComplaint':
                            resultPayload = await handleRegisterComplaint(func.arguments);
                            break;
                        case 'searchSchemes':
                            resultPayload = await handleSearchSchemes(func.arguments);
                            break;
                        case 'getEmergencyContacts':
                            resultPayload = await handleGetContacts();
                            break;
                        default:
                            resultPayload = { error: "Function not found" };
                    }
                } catch (err) {
                    console.error(`[Vapi] Error executing ${func.name}:`, err);
                    resultPayload = { error: "Execution failed", details: err.message };
                }

                results.push({
                    toolCallId: id,
                    result: JSON.stringify(resultPayload) // Vapi expects a stringified JSON result
                });
            }

            // Return the results to Vapi
            return res.json({
                results: results
            });
        }

        // 3. Status Updates (Call End, Speech Update, etc.)
        // Just acknowledge
        res.json({ status: 'ok' });

    } catch (error) {
        console.error('[Vapi] Error handling webhook:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Helper Functions (Tool Implementations) ---

async function handleCheckStatus(args) {
    const { mobile } = args;
    // Hardcoded tenantId for now or pass via custom param if Vapi allows
    // For this context, we'll try to get it from the call metadata if possible,
    // but usually, we might need a default or lookup.
    // Assuming a default tenant or searching across tenants (less ideal).
    // Let's assume the first active tenant for now or a specific ID.
    // A better way is to pass tenantId in the "SIP Headers" or "Custom Data" from Vapi.

    // For now, let's look up the user by mobile across tenants? No, `getComplaintsByMobile` needs tenantId.
    // We'll peek at the sessions map or just use a known test tenant ID if available.
    // HACK: We will try to find a tenant where this user exists, or just use a default.

    // REALITY: We need the Tenant ID.
    // For this demo, let's grab the first session from the store? No access to `sessions` map here directly easily without exporting it.
    // Let's rely on `store.getComplaintsByMobile` but we need a tenantId.

    // We'll define a default tenant ID if one isn't provided.
    // In a real multi-tenant Vapi setup, you'd embed the tenantId in the "Server URL": https://api.com/vapi?tenantId=123
    // But since `req.query` isn't easily passed in the tool-call flow (it is stateful), 
    // we might need to hardcode IT for this specific test or user.

    // Let's fetch ANY tenant for now (or a specific one if user provided).
    // TODO: Make this dynamic.
    const { data } = await supabase.from('tenants').select('id').limit(1);
    const tenantId = data?.[0]?.id;

    if (!tenantId) return { message: "System error: No organization found." };

    console.log(`[Vapi] Checking status for ${mobile} in tenant ${tenantId}`);
    const complaints = await store.getComplaintsByMobile(tenantId, mobile);

    if (complaints.length === 0) {
        return { message: "No complaints found for this mobile number." };
    }

    const latest = complaints[0];
    return {
        found: true,
        id: latest.id,
        status: latest.status,
        category: latest.category,
        problem: latest.problem,
        date: new Date(latest.created_at).toLocaleDateString()
    };
}

async function handleRegisterComplaint(args) {
    const { name, mobile, category, location, description } = args;

    // Get Tenant ID (See note above)
    const { data } = await supabase.from('tenants').select('id').limit(1);
    const tenantId = data?.[0]?.id;
    if (!tenantId) return { error: "System error: No organization found." };

    const complaintData = {
        user_name: name,
        mobile: mobile,
        type: category, // 'Road', 'Water' etc.
        location: location,
        description: description,

        // Defaults
        title: `${category} Issue - ${location}`,
        area: location,
        status: 'Pending',
        source: 'Voice Call', // Distinct from WhatsApp
        urgency: 'Medium',
        photos: [],
        tenantId: tenantId
    };

    const result = await store.saveComplaint(complaintData);
    return {
        success: true,
        complaint_id: result.id,
        message: "Complaint registered successfully."
    };
}

async function handleSearchSchemes(args) {
    const { query } = args;
    const { data } = await supabase.from('tenants').select('id').limit(1);
    const tenantId = data?.[0]?.id;

    if (!tenantId) return { error: "No organization found." };

    const schemes = await store.getSchemes(tenantId, { searchQuery: query, limit: 3 });

    if (schemes.length === 0) return { message: "No matching schemes found." };

    return {
        schemes: schemes.map(s => ({
            name: s.name_mr || s.name, // Prefer Marathi name if available
            description: s.description_mr || s.description // Short description
        }))
    };
}

async function handleGetContacts() {
    // Return dummy or real contacts
    return {
        contacts: [
            { name: "Control Room", number: "100" },
            { name: "Fire Brigade", number: "101" },
            { name: "Ambulance", number: "108" },
            { name: "Municipal Office", number: "020-25501000" }
        ]
    };
}

module.exports = router;
