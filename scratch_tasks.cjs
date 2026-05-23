require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTasks() {
    const { data: tasks, error } = await supabase.from('tasks').select('*').limit(20);
    if (error) {
        console.error('Error fetching tasks:', error);
        return;
    }
    console.log('--- TASKS ---');
    tasks.forEach(t => {
        console.log(`ID: ${t.id}, Title: ${t.title}, Assigned Staff ID: ${t.assigned_staff_id}, Type: ${typeof t.assigned_staff_id}`);
    });

    const { data: staff, error: staffError } = await supabase.from('staff').select('id, name').limit(20);
    if (staffError) {
        console.error('Error fetching staff:', staffError);
        return;
    }
    console.log('\n--- STAFF ---');
    staff.forEach(s => {
        console.log(`ID: ${s.id}, Name: ${s.name}, Type: ${typeof s.id}`);
    });
}

checkTasks();
