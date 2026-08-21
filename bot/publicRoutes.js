const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

// Service Role Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY; 
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Rate Limiter: Max 5 submissions per IP per 15 minutes
const publicFormLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5,
    message: { error: 'Too many submissions from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware to resolve tenant from Origin
const resolveTenantFromOrigin = async (req, res, next) => {
    try {
        const origin = req.get('Origin');
        if (!origin) {
            return res.status(400).json({ error: 'Origin header is required for public submissions.' });
        }

        // Parse subdomain (e.g., https://mumbai.krishnaniti.in -> mumbai)
        const url = new URL(origin);
        let subdomain = url.hostname.split('.')[0].toLowerCase();
        
        // Handle local dev and default fallbacks
        if (subdomain === 'localhost' || subdomain === 'www' || subdomain === 'krishnaniti') {
            subdomain = 'default';
        }
        if (subdomain === 'amadar') {
            subdomain = 'amdar';
        }

        // Lookup tenant_id
        const { data: tenant, error } = await supabaseAdmin
            .from('tenants')
            .select('id')
            .eq('subdomain', subdomain)
            .single();

        if (error || !tenant) {
            console.error(`Tenant lookup failed for subdomain: ${subdomain}`, error);
            return res.status(404).json({ error: 'Tenant not found for this origin.' });
        }

        // Forcefully bind the resolved tenant_id to the request
        req.resolvedTenantId = tenant.id;
        next();
    } catch (err) {
        console.error('Error resolving tenant:', err);
        return res.status(500).json({ error: 'Internal server error during tenant resolution.' });
    }
};

// Apply rate limiting and tenant resolution to all public routes
router.use(publicFormLimiter);
router.use(resolveTenantFromOrigin);

// POST /api/public/complaints
router.post('/complaints', async (req, res) => {
    try {
        // 1. Extract and sanitize fields (Ignore any tenant_id from body)
        const { problem, category, priority, location, area, image_url, description_meta, source } = req.body;
        
        if (!problem || !category) {
            return res.status(400).json({ error: 'Problem description and category are required.' });
        }

        // 2. Construct safe payload
        const payload = {
            problem: String(problem).substring(0, 5000), // Enforce limits
            category: String(category).substring(0, 50),
            status: 'Pending',
            priority: priority ? String(priority).substring(0, 20) : 'Medium',
            location: location ? String(location).substring(0, 100) : null,
            area: area ? String(area).substring(0, 100) : null,
            source: source ? String(source).substring(0, 50) : 'Website',
            image_url: image_url ? String(image_url).substring(0, 500) : null,
            description_meta: description_meta ? JSON.stringify(description_meta) : null, // Assuming JSON
            tenant_id: req.resolvedTenantId, // SECURE BINDING
            voter_id: null // Public forms shouldn't link voters directly by ID without auth
        };

        // 3. Insert using Service Role
        const { data, error } = await supabaseAdmin
            .from('complaints')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({ success: true, data });
    } catch (err) {
        console.error('Error submitting public complaint:', err);
        return res.status(500).json({ error: 'Failed to submit complaint.' });
    }
});

// POST /api/public/voter_applications
router.post('/voter_applications', async (req, res) => {
    try {
        // 1. Extract and sanitize fields
        const { form_type, applicant_name, applicant_mobile, status, notes, voter_id } = req.body;

        if (!form_type || !applicant_name || !applicant_mobile) {
            return res.status(400).json({ error: 'form_type, applicant_name, and applicant_mobile are required.' });
        }

        // 2. Construct safe payload
        const payload = {
            form_type: String(form_type).substring(0, 50),
            applicant_name: String(applicant_name).substring(0, 100),
            applicant_mobile: String(applicant_mobile).substring(0, 15),
            status: status ? String(status).substring(0, 50) : 'Pending',
            notes: notes ? String(notes).substring(0, 1000) : null,
            voter_id: voter_id ? parseInt(voter_id) : null,
            tenant_id: req.resolvedTenantId // SECURE BINDING
        };

        // 3. Insert using Service Role
        const { data, error } = await supabaseAdmin
            .from('voter_applications')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({ success: true, data });
    } catch (err) {
        console.error('Error submitting voter application:', err);
        return res.status(500).json({ error: 'Failed to submit application.' });
    }
});

module.exports = router;
