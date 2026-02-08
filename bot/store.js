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
            photos: complaint.photos || [],
            tenant_id: complaint.tenantId,
            description_meta: JSON.stringify({
                submitter_name: complaint.user_name,
                title: complaint.title,  // Store original title in meta
                full_description: complaint.description,
                from_whatsapp: true
            }),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('Inserting complaint data:', dbData);

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

async function getSchemes() {
    try {
        const { data, error } = await supabase
            .from('schemes')
            .select('*');
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching schemes:', err);
        return [];
    }
}

module.exports = {
    saveComplaint,
    getSchemes,
    saveUser,
    getUser
};
