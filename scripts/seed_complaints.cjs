const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const dummyComplaints = [
    {
        user_name: 'Rahul Deshmukh',
        problem: 'Street light not working since 3 days',
        location: 'Shivaji Nagar, Ward 12',
        status: 'Pending',
        source: 'WhatsApp',
        category: 'Complaint',
        created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
        user_name: 'Priya Patil',
        problem: 'Garbage pile up near school gate. Please clean immediately.',
        location: 'Main Road, Ward 10',
        status: 'Assigned',
        source: 'Web',
        category: 'Complaint',
        image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18', // Dummy garbage image
        created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
    },
    {
        user_name: 'Amit Joshi',
        problem: 'Need help with Ration Card application',
        location: 'Ganesh Peth',
        status: 'Pending',
        source: 'WhatsApp',
        category: 'Help',
        created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    },
    {
        user_name: 'Suresh Raina',
        problem: 'Pothole on MG Road causing traffic.',
        location: 'MG Road',
        status: 'Resolved',
        source: 'WhatsApp',
        category: 'Complaint',
        image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7', // Dummy pothole
        created_at: new Date(Date.now() - 432000000).toISOString() // 5 days ago
    },
    {
        user_name: 'Vikas Dubey',
        problem: 'Pipeline leakage video evidence',
        location: 'Sector 4',
        status: 'InProgress',
        source: 'WhatsApp',
        category: 'Complaint',
        video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', // Dummy video
        created_at: new Date(Date.now() - 10000000).toISOString()
    }
];

async function seed() {
    console.log('Seeding complaints...');
    const { error } = await supabase
        .from('complaints')
        .insert(dummyComplaints);

    if (error) console.error('Error:', error);
    else console.log('✅ Dummy complaints added!');
}

seed();
