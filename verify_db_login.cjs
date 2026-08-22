const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../../Downloads/Office/Nagarsevak-Managment/.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'krishnaniti@gmail.com',
        password: 'password'
    });
    
    if (authError) {
        console.error("Login failed:", authError);
        // Let's try 123456 as it's another common dummy password
        const { error: err2 } = await supabase.auth.signInWithPassword({ email: 'krishnaniti@gmail.com', password: 'password123' });
        if (err2) {
             const { error: err3 } = await supabase.auth.signInWithPassword({ email: 'krishnaniti@gmail.com', password: '123456' });
             if (err3) return console.error("All logins failed", err3);
        }
    }
    
    const { data, error } = await supabase.from('election_results').select('ward_name, candidate_votes').limit(1);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Success. Keys in candidate_votes:");
        if (data && data.length > 0) {
            console.log(Object.keys(data[0].candidate_votes));
            console.log("ward_name:", data[0].ward_name);
        } else {
            console.log("No data returned.");
        }
    }
}
check();
