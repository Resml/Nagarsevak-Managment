import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qdvciisgxvupvrjygedr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkdmNpaXNneHZ1cHZyanlnZWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwODkzNjAsImV4cCI6MjA4NDY2NTM2MH0.FEoUycRHAu7NxqfUosHO0_dVwB1DKdXHLGsxChpw8V0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMapping() {
    const userId = 'd90b8574-41ea-42f4-8807-a5ec1796683b';
    
    const { data: allTenants } = await supabase.from('tenants').select('id, name, subdomain');
    console.log("All tenants:", allTenants);
}

checkMapping();
