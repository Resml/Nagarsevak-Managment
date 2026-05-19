import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAmdarUser() {
  const email = 'amdar_test@example.com';
  const password = 'Password123!';

  console.log('Signing up user...');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Error signing up:', error.message);
    return;
  }

  const userId = data.user.id;
  console.log('User created with ID:', userId);

  console.log('Setting role to amdar in user_tenant_mapping...');
  const { error: mappingError } = await supabase
    .from('user_tenant_mapping')
    .insert([
      {
        user_id: userId,
        role: 'amdar',
        tenant_id: 'default' // Or whatever default tenant is
      }
    ]);

  if (mappingError) {
    console.error('Error creating mapping:', mappingError.message);
  } else {
    console.log('Mapping created successfully!');
    console.log(`\n\nLogin with:\nEmail: ${email}\nPassword: ${password}`);
  }
}

createAmdarUser();
