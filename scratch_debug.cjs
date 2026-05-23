const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
const lines = envContent.split('\n');
let url = '', key = '';
for (const line of lines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
}
const supabase = createClient(url, key);

async function run() {
    // Get a sample voter to see what columns look like
    const { data: sample, error: sErr } = await supabase
        .from('voters')
        .select('id, name_marathi, address_marathi, address_english, is_friend_relative, gender, age')
        .limit(3);
    
    console.log('\n=== SAMPLE VOTER ===');
    if (sErr) console.log('Error:', sErr.message);
    else console.log(JSON.stringify(sample, null, 2));

    // Count voters with a test marathi address fragment
    const testFrag = 'लोकमान्य';
    const { data: matched, error: mErr } = await supabase
        .from('voters')
        .select('id, address_marathi, address_english')
        .ilike('address_marathi', `%${testFrag}%`)
        .limit(5);

    console.log('\n=== VOTERS WITH लोकमान्य in address_marathi ===');
    if (mErr) console.log('Error:', mErr.message);
    else {
        console.log('Count:', matched?.length);
        if (matched?.length > 0) console.log('First:', matched[0]);
    }

    // Try includes logic - the exact address from the screenshot
    const exactAddr = 'इमारत क्र. ३५ लोकमान्य नगर शास्त्री रोड दतमंदीर समोर वाघजाई म पुणे';
    const { data: exactMatch } = await supabase
        .from('voters')
        .select('id, address_marathi')
        .eq('address_marathi', exactAddr)
        .limit(3);
    console.log('\n=== EXACT MATCH ===');
    console.log('Count:', exactMatch?.length);

    // Check if voters use 'address' column instead
    const { data: v2 } = await supabase.from('voters').select('*').limit(1);
    if (v2?.length > 0) {
        console.log('\n=== ALL VOTER COLUMNS ===');
        console.log(Object.keys(v2[0]).join(', '));
    }
}

run().catch(console.error);
