const express = require('express');
const router = express.Router();
const store = require('./store');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Vapi Assistant Configuration ---
const getAssistantConfig = (tenantName) => ({
    name: `${tenantName} Voice Assistant`,
    voice: {
        provider: "11labs",
        voiceId: "sarah", // Good standard voice, enables multilingual
    },
    model: {
        model: "gpt-4o", // Best for Marathi understanding
        messages: [
            {
                role: "system",
                content: `You are a helpful voice assistant for the ${tenantName} office. 
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
});

// --- Webhook for Vapi ---
// Vapi sends a POST request here when the call starts or when a tool is called.
router.post('/', async (req, res) => {
    try {
        const body = req.body;
        console.log('[Vapi] Received webhook:', body.type || 'Unknown Type');

        const systemNumber = body.message?.call?.system?.number || body.message?.call?.phoneNumber?.number || '';
        let tenantId = null;
        let tenantName = 'नगरसेवक';
        
        if (systemNumber) {
            const cleanSystemNumber = systemNumber.replace(/\D/g, '');
            const searchNumber = cleanSystemNumber.length > 10 ? cleanSystemNumber.slice(-10) : cleanSystemNumber;
            
            try {
                const { data: tenant } = await supabase
                    .from('tenants')
                    .select('id, name, config')
                    .or(`mobile.ilike.%${searchNumber}%,config->>vapi_phone.ilike.%${searchNumber}%,config->>twilio_phone.ilike.%${searchNumber}%`)
                    .limit(1)
                    .single();
                    
                if (tenant) {
                    tenantId = tenant.id;
                    tenantName = tenant.name || 'नगरसेवक';
                    console.log(`[Vapi] Matched tenant: ${tenantId} (${tenantName}) for number ${searchNumber}`);
                } else {
                    console.warn(`[Vapi] No tenant found for incoming number ${searchNumber}`);
                }
            } catch (err) {
                console.error(`[Vapi] Error looking up tenant for ${searchNumber}:`, err.message);
            }
        }
        
        if (!tenantId) {
            console.warn(`[Vapi] Rejecting call for unknown number`);
            return res.status(404).json({ error: "No tenant associated with this phone number." });
        }

        // 1. Assistant Request (Call Start)
        // Vapi asks "What assistant should I use?"
        if (body.message && body.message.type === 'assistant-request') {
            console.log(`[Vapi] Sending Assistant Config for Tenant: ${tenantName}`);
            return res.json(getAssistantConfig(tenantName));
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
                            resultPayload = await handleCheckStatus(func.arguments, tenantId);
                            break;
                        case 'registerComplaint':
                            resultPayload = await handleRegisterComplaint(func.arguments, tenantId);
                            break;
                        case 'searchSchemes':
                            resultPayload = await handleSearchSchemes(func.arguments, tenantId);
                            break;
                        case 'getEmergencyContacts':
                            resultPayload = await handleGetContacts(tenantId);
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

// --- Helper Functions (Tool Implementations) ---

async function handleCheckStatus(args, tenantId) {
    const { mobile } = args;

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

async function handleRegisterComplaint(args, tenantId) {
    const { name, mobile, category, location, description } = args;

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

async function handleSearchSchemes(args, tenantId) {
    const { query } = args;

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

async function handleGetContacts(tenantId) {
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
