import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

async function createPoliticianAccount() {
  console.log("\n==================================================");
  console.log("    ONBOARD NEW POLITICIAN / NAGARSEVAK TENANT   ");
  console.log("==================================================\n");

  const args = process.argv.slice(2);
  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
  };

  let name = getArg('--name') || await askQuestion("Enter Politician Full Name (e.g. Ramesh Patil): ");
  let email = getArg('--email') || await askQuestion("Enter Email ID for Login: ");
  let password = getArg('--password') || await askQuestion("Enter Password: ");
  let subdomain = getArg('--subdomain') || await askQuestion("Enter Unique Subdomain (e.g. ramesh): ");
  let tier = getArg('--tier') || await askQuestion("Enter Tier (nagarsevak / amdar / khasdar / minister) [default: nagarsevak]: ") || 'nagarsevak';
  let plan = getArg('--plan') || await askQuestion("Enter Plan (basic / pro / advance) [default: advance]: ") || 'advance';

  if (!email || !password || !name || !subdomain) {
    console.error("❌ Error: Name, Email, Password, and Subdomain are required!");
    process.exit(1);
  }

  subdomain = subdomain.toLowerCase().replace(/[^a-z0-9_-]/g, '');

  console.log("\n[1/3] Creating Auth User in Supabase...");
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error("❌ Error creating auth user:", authError.message);
    process.exit(1);
  }

  const userId = authData.user?.id;
  if (!userId) {
    console.error("❌ Failed to retrieve User ID.");
    process.exit(1);
  }
  console.log(`✅ Auth User created successfully! User ID: ${userId}`);

  console.log("\n[2/3] Creating isolated Tenant database entry...");
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants')
    .insert([
      {
        name,
        subdomain,
        tier: tier.toLowerCase(),
        plan: plan.toLowerCase(),
        config: {
          nagarsevak_name_english: name,
          nagarsevak_name_marathi: name,
          email_address: email
        }
      }
    ])
    .select('id')
    .single();

  if (tenantError) {
    console.error("❌ Error creating tenant entry:", tenantError.message);
    process.exit(1);
  }

  const tenantId = tenantData.id;
  console.log(`✅ Tenant created successfully! Tenant ID: ${tenantId}`);

  console.log("\n[3/3] Mapping User to Tenant (Admin Role)...");
  const { error: mapError } = await supabase
    .from('user_tenant_mapping')
    .insert([
      {
        user_id: userId,
        tenant_id: tenantId,
        role: 'admin'
      }
    ]);

  if (mapError) {
    console.error("❌ Error creating user_tenant_mapping:", mapError.message);
    process.exit(1);
  }

  console.log("\n==================================================");
  console.log("🎉 SUCCESS! NEW POLITICIAN ACCOUNT CREATED SUCCESSFULLY 🎉");
  console.log("==================================================");
  console.log(`Politician Name : ${name}`);
  console.log(`Login Email     : ${email}`);
  console.log(`Login Password  : ${password}`);
  console.log(`Subdomain       : ${subdomain}`);
  console.log(`Tenant ID       : ${tenantId}`);
  console.log(`Tier            : ${tier}`);
  console.log(`Plan            : ${plan}`);
  console.log("==================================================");
  console.log("Give these Email and Password credentials to your Nagarsevak client to log in!");
}

createPoliticianAccount();
