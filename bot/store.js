require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase keys missing! Check .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Fallback local file
const DATA_DIR = path.join(__dirname, 'data');
const COMPLAINTS_FILE = path.join(DATA_DIR, 'complaints.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(COMPLAINTS_FILE)) fs.writeFileSync(COMPLAINTS_FILE, JSON.stringify([], null, 2));

const USERS_FILE = path.join(DATA_DIR, 'users.json');
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));

async function saveUser(userId, data) {
    // 1. Local File Update
    const fileData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    fileData[userId] = { ...fileData[userId], ...data, lastUpdated: new Date().toISOString() };
    fs.writeFileSync(USERS_FILE, JSON.stringify(fileData, null, 2));

    // 2. Supabase Update (Upsert)
    try {
        const { error } = await supabase
            .from('voters') // Assuming we map whatsapp users to voters or a 'users' table
            .upsert({
                mobile: userId.replace('@s.whatsapp.net', ''),
                ...data
            }, { onConflict: 'mobile' });

        // If voters table is strict, we might need a separate 'bot_users' table. 
        // For now, let's rely on local file for preferences to be fast and safe.
    } catch (err) {
        console.error('Supabase User Save Error:', err);
    }
}

async function getUser(userId) {
    const fileData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    return fileData[userId] || null;
}

async function saveComplaint(complaint) {
    console.log('Saving complaint to Supabase...', { tenantId: complaint.tenantId });

    // 1. Try Supabase
    try {
        let voterId = null;

        // --- VOTER LINKING LOGIC ---
        // Try to find a matching voter by mobile or name
        if (complaint.mobile) {
            const cleanMobile = complaint.mobile.replace(/\D/g, '').slice(-10); // Last 10 digits

            // Search by Mobile
            let query = supabase
                .from('voters')
                .select('id, name_english, name_marathi, mobile')
                .eq('tenant_id', complaint.tenantId)
                .ilike('mobile', `%${cleanMobile}%`)
                .limit(1);

            const { data: voters } = await query;

            if (voters && voters.length > 0) {
                voterId = voters[0].id;
                console.log(`Linked complaint to Voter ID: ${voterId} (${voters[0].name_english || voters[0].name_marathi})`);
            } else {
                console.log('No matching voter found for linking.');
            }
        }

        // Prepare data for database (matching website schema)
        const dbData = {
            problem: complaint.description,  // Website uses 'problem' not 'description'
            category: complaint.type,        // Website uses 'category' not 'type'
            status: complaint.status || 'Pending',
            priority: complaint.urgency || 'Medium',  // Website uses 'priority' not 'urgency'
            location: complaint.location ? `Ward ${complaint.ward || '12'} - ${complaint.location}` : `Ward ${complaint.ward || '12'}`,
            area: complaint.area,
            source: complaint.source || 'WhatsApp',
            voter_id: voterId, // Linked voter ID
            tenant_id: complaint.tenantId,
            description_meta: JSON.stringify({
                submitter_name: complaint.user_name,
                mobile: complaint.mobile,  // Add mobile for lookup
                title: complaint.title,  // Store original title in meta
                full_description: complaint.description,
                from_whatsapp: true
            }),
            created_at: new Date().toISOString()
        };

        console.log('--- DB INSERT DEBUG ---');
        console.log('Tenant:', complaint.tenantId);
        console.log('Data:', JSON.stringify(dbData, null, 2));

        const { data, error } = await supabase
            .from('complaints')
            .insert([dbData])
            .select('id')
            .single();

        if (error) {
            console.error('Supabase Error:', error);
            throw error;
        }

        console.log('Saved to Supabase successfully. Complaint ID:', data?.id);
        return data; // Return the inserted row with ID

    } catch (err) {
        console.log('Failed to save to Supabase, falling back to local file.', err);

        // 2. Fallback to Local File
        const data = fs.readFileSync(COMPLAINTS_FILE, 'utf8');
        const complaints = JSON.parse(data);
        const newComplaint = {
            id: 'LOCAL_' + Date.now(),
            ...complaint,
            timestamp: new Date().toISOString()
        };
        complaints.push(newComplaint);
        fs.writeFileSync(COMPLAINTS_FILE, JSON.stringify(complaints, null, 2));
        return newComplaint; // Return with generated ID
    }
}

async function getSchemes(tenantId, options = {}) {
    try {
        const { limit = 10, offset = 0, searchQuery = '', excludeKeywords = [], lang = 'en' } = options;

        let query = supabase
            .from('schemes')
            .select('*')
            .eq('tenant_id', tenantId);

        // Search functionality
        if (searchQuery) {
            const keywords = searchQuery.split(/\s+/).filter(k => k.length > 0);
            if (keywords.length > 0) {
                // For multiple keywords, we search if ANY keyword matches ANY field
                // This is a simple but effective way for WhatsApp bot searches
                const orConditions = [];
                keywords.forEach(keyword => {
                    orConditions.push(`name.ilike.%${keyword}%`);
                    orConditions.push(`description.ilike.%${keyword}%`);
                    orConditions.push(`name_mr.ilike.%${keyword}%`);
                    orConditions.push(`description_mr.ilike.%${keyword}%`);
                });
                query = query.or(orConditions.join(','));
            }
        }

        // Exclusion functionality
        if (excludeKeywords && excludeKeywords.length > 0) {
            excludeKeywords.forEach(keyword => {
                query = query.not('name', 'ilike', `%${keyword}%`)
                    .not('description', 'ilike', `%${keyword}%`);
                // Also check MR columns if they exist
                query = query.not('name_mr', 'ilike', `%${keyword}%`)
                    .not('description_mr', 'ilike', `%${keyword}%`);
            });
        }

        const { data, error } = await query
            .order('id', { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching schemes:', err);
        return [];
    }
}

async function searchVoters(tenantId, query, searchType = 'name', limit = 5) {
    try {
        let dbQuery = supabase
            .from('voters')
            .select('id, name_english, name_marathi, card_number, age, gender, polling_booth_name, ward, mobile')
            .eq('tenant_id', tenantId);

        if (searchType === 'name') {
            dbQuery = dbQuery.or(`name_english.ilike.%${query}%,name_marathi.ilike.%${query}%`);
        } else if (searchType === 'mobile') {
            const cleanMobile = query.replace(/\D/g, '');
            dbQuery = dbQuery.ilike('mobile', `%${cleanMobile}%`);
        } else if (searchType === 'voter_id') {
            dbQuery = dbQuery.ilike('card_number', `%${query}%`);
        }

        const { data, error } = await dbQuery.limit(limit);
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error searching voters:', err);
        return [];
    }
}

async function getEvents(tenantId, filter = 'upcoming', limit = 5) {
    try {
        let query = supabase
            .from('events')
            .select('*')
            .eq('tenant_id', tenantId);

        const now = new Date().toISOString();

        if (filter === 'upcoming') {
            query = query.gte('event_date', now);
        } else if (filter === 'past') {
            query = query.lt('event_date', now);
        } else if (filter === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            query = query.gte('event_date', today.toISOString()).lt('event_date', tomorrow.toISOString());
        }

        query = query.order('event_date', { ascending: filter !== 'past' }).limit(limit);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching events:', err);
        return [];
    }
}

async function getUpcomingEvents(tenantId, limit = 5) {
    return await getEvents(tenantId, 'upcoming', limit);
}

async function getTodaysEvents(tenantId, limit = 5) {
    return await getEvents(tenantId, 'today', limit);
}

async function getPastEvents(tenantId, limit = 5) {
    return await getEvents(tenantId, 'past', limit);
}

async function getWorks(tenantId, status = 'all', limit = 5) {
    try {
        let query = supabase
            .from('works')
            .select('*')
            .eq('tenant_id', tenantId);

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching works:', err);
        return [];
    }
}

async function getImprovements(tenantId, limit = 5) {
    try {
        const { data, error } = await supabase
            .from('improvements')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching improvements:', err);
        return [];
    }
}

async function saveSchemeApplication(application) {
    try {
        const dbData = {
            scheme_id: application.schemeId,
            applicant_name: application.name,
            mobile: application.mobile,
            additional_info: application.additionalInfo || '',
            status: 'Pending',
            tenant_id: application.tenantId,
            source: 'WhatsApp',
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('scheme_beneficiaries')
            .insert([dbData])
            .select('id')
            .single();

        if (error) throw error;
        console.log('Scheme application saved:', data?.id);
        return data;
    } catch (err) {
        console.error('Error saving scheme application:', err);
        throw err;
    }
}

async function saveEventRSVP(rsvp) {
    try {
        const dbData = {
            event_id: rsvp.eventId,
            attendee_name: rsvp.name,
            mobile: rsvp.mobile,
            status: 'confirmed',
            tenant_id: rsvp.tenantId,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('event_rsvps')
            .insert([dbData])
            .select('id')
            .single();

        if (error) throw error;
        console.log('Event RSVP saved:', data?.id);
        return data;
    } catch (err) {
        console.error('Error saving event RSVP:', err);
        throw err;
    }
}

async function getComplaintsByMobile(tenantId, mobile) {
    try {
        const cleanMobile = mobile.replace(/\D/g, '').slice(-10);

        // Search for voter by mobile to get voter_id
        const { data: voters } = await supabase
            .from('voters')
            .select('id')
            .eq('tenant_id', tenantId)
            .ilike('mobile', `%${cleanMobile}%`)
            .limit(1);

        if (!voters || voters.length === 0) {
            // No voter found, search complaints by description_meta using textSearch
            // textSearch works on JSONB columns, searching all text fields within the JSON
            const { data, error } = await supabase
                .from('complaints')
                .select('id, problem, status, category, priority, created_at')
                .eq('tenant_id', tenantId)
                .textSearch('description_meta', cleanMobile)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            return data || [];
        }

        // Search by voter_id
        const { data, error } = await supabase
            .from('complaints')
            .select('id, problem, status, category, priority, created_at')
            .eq('tenant_id', tenantId)
            .eq('voter_id', voters[0].id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching complaints:', err);
        return [];
    }
}

// Letter Functions
async function getLetterTypes(tenantId) {
    try {
        console.log('[getLetterTypes] Querying for tenantId:', tenantId);

        const { data, error } = await supabase
            .from('letter_types')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('is_active', true)
            .order('name');

        console.log('[getLetterTypes] Query result - data:', data, 'error:', error);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching letter types:', error);
        return [];
    }
}

async function saveLetterRequest(letterRequest) {
    try {
        const { data, error } = await supabase
            .from('letter_requests')
            .insert([letterRequest])
            .select();

        if (error) throw error;
        return data ? data[0] : null;
    } catch (error) {
        console.error('Error saving letter request:', error);
        throw error;
    }
}

// Contact Info Functions
async function getContactInfo(tenantId) {
    try {
        const { data, error } = await supabase
            .from('tenants')
            .select('config')
            .eq('id', tenantId)
            .single();

        if (error) throw error;
        return data?.config || {};
    } catch (error) {
        console.error('Error fetching contact info:', error);
        return {};
    }
}

// Area Problems Functions
async function reportAreaProblem(problem) {
    try {
        const { data, error } = await supabase
            .from('area_problems')
            .insert([problem])
            .select();

        if (error) throw error;
        return data ? data[0] : null;
    } catch (error) {
        console.error('Error reporting area problem:', error);
        throw error;
    }
}

async function getAreaProblems(tenantId, status = 'all', limit = 10) {
    try {
        let query = supabase
            .from('area_problems')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching area problems:', error);
        return [];
    }
}

async function getAreaProblemsByUser(userId, limit = 10) {
    try {
        const { data, error } = await supabase
            .from('area_problems')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching area problems by user:', error);
        return [];
    }
}

async function savePersonalRequest(request) {
    try {
        const { data, error } = await supabase
            .from('personal_requests')
            .insert([request])
            .select();

        if (error) throw error;
        return data ? data[0] : null;
    } catch (error) {
        console.error('Error saving personal request:', error);
        throw error;
    }
}

module.exports = {
    saveUser,
    getUser,
    saveComplaint,
    getSchemes,
    searchVoters,
    getEvents,
    getUpcomingEvents,
    getTodaysEvents,
    getPastEvents,
    getWorks,
    getImprovements,
    saveSchemeApplication,
    saveEventRSVP,
    getComplaintsByMobile,
    getLetterTypes,
    saveLetterRequest,
    getContactInfo,
    reportAreaProblem,
    getAreaProblems,
    getAreaProblemsByUser,
    savePersonalRequest
};
