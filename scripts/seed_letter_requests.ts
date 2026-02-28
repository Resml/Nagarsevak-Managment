import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials. Have you set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env?');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const dummyRequests = [
    {
        type: 'Residence Certificate',
        details: {
            name: "Ramesh Tukaram Patil",
            mobile: "9876543210",
            address: "Shivaji Nagar, Lane 4, Pune",
            age: "45",
            years_of_residency: "15",
            ward_no: "42"
        }
    },
    {
        type: 'School Admission Recommendation',
        details: {
            name: "Aarav Ramesh Patil",
            mobile: "9876543210",
            address: "Shivaji Nagar, Lane 4, Pune",
            school_name: "Saraswati Vidyalaya",
            school_city: "Pune",
            financial_condition: "गरजू",
            class_or_course_name: "पाचवी (5th Std)"
        }
    },
    {
        type: 'Job Recommendation Letter',
        details: {
            name: "Suresh Kadam",
            mobile: "8888888888",
            address: "Kothrud, Pune",
            company_name: "Tata Motors",
            company_address: "Pimpri, Pune",
            education_degree: "B.E. Mechanical",
            experience: "३ वर्षांचा"
        }
    },
    {
        type: 'Character & Identity Certificate',
        details: {
            name: "Vinayak Joshi",
            mobile: "9999999999",
            address: "Deccan Gymkhana, Pune",
            years_known: "१०",
            reason_for_certificate: "पासपोर्ट पडताळणी"
        }
    },
    {
        type: 'Death Certificate Request',
        details: {
            name: "Late. Laxmibai Deshmukh",
            mobile: "7777777777",
            address: "Swargate, Pune",
            age: "78",
            date_of_death: "१५ जानेवारी २०२६",
            cause_of_death: "वृद्धापकाळ आणि आजारपण",
            hospital_name: "ससून रुग्णालय",
            municipality_name: "पुणे महानगरपालिका"
        }
    },
    {
        type: 'Gas Connection Recommendation',
        details: {
            name: "Sunita Kamble",
            mobile: "6666666666",
            address: "Yerawada D-Block, Pune",
            gas_agency_name: "Bharat Gas Agency",
            city_name: "Pune",
            ward_no: "15"
        }
    },
    {
        type: 'Income Certificate Recommendation',
        details: {
            name: "Prakash Pawar",
            mobile: "5555555555",
            address: "Hinjawadi Phase 1, Pune",
            tehsil_name: "Mulshi",
            annual_income: "८५,०००",
            source_of_income: "शेतमजुरी"
        }
    },
    {
        type: 'New Electricity Meter Recommendation',
        details: {
            name: "Anil Shinde",
            mobile: "4444444444",
            address: "Hadapsar, Pune",
            mseb_branch_name: "हडपसर उपविभाग"
        }
    }
];

async function seedLetterRequests() {
    console.log('Fetching a valid tenant_id from existing letters...');
    const { data: tenantData } = await supabase.from('letter_types').select('tenant_id').limit(1);
    const tenant_id = tenantData && tenantData[0] ? tenantData[0].tenant_id : null;

    if (!tenant_id) {
        console.error('Could not find a valid tenant_id. Cannot proceed with insertion.');
        return;
    }

    // Try to get a dummy user_id from voter_profiles to attach to the requests
    const { data: userData } = await supabase.from('voter_profiles').select('mobile').limit(1);
    const user_id = userData && userData[0] ? userData[0].mobile : '919876543210';

    console.log(`Using tenant_id: ${tenant_id}`);
    console.log(`Using dummy user_id: ${user_id}`);
    console.log('Seeding dummy letter requests...');

    let successCount = 0;

    for (const req of dummyRequests) {
        const payload = {
            user_id: user_id,
            tenant_id: tenant_id,
            type: req.type,
            details: req.details,
            status: 'Pending',
            area: ''
        };

        const { error: insertError } = await supabase
            .from('letter_requests')
            .insert([payload]);

        if (insertError) {
            console.error(`Failed to insert request for ${req.type}:`, insertError);
        } else {
            console.log(`Successfully inserted dummy request for ${req.type}`);
            successCount++;
        }
    }

    console.log(`Seeding complete. Added ${successCount} dummy letter requests.`);
}

seedLetterRequests().catch(console.error);
