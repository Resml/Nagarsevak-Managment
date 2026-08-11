require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'dummy-key';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
    supabase
};
