import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function verifyRemediation() {
    const tenantA = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4';
    const tenantB = 'e5a973bb-54de-4a92-bd17-91a97d7fefc3';

    const { data: dbA } = await supabase.from('tenants').select('config').eq('id', tenantA).single();
    const { data: dbB } = await supabase.from('tenants').select('config').eq('id', tenantB).single();

    console.log(`\n--- Verification Report ---`);
    console.log(`Tenant A Party Image: ${dbA.config.party_logo_url}`);
    console.log(`Tenant A Profile Image: ${dbA.config.profile_image_url}`);
    console.log(`Tenant B Party Image: ${dbB.config.party_logo_url}`);
    console.log(`Tenant B Profile Image: ${dbB.config.profile_image_url}`);

    const hasNoAbsolute = !dbA.config.party_logo_url.startsWith('http') && !dbB.config.party_logo_url.startsWith('http');
    console.log(`Database Absolute URLs = 0: ${hasNoAbsolute}`);

    const pathDifferent = dbA.config.party_logo_url !== dbB.config.party_logo_url;
    console.log(`Cross-tenant paths distinct: ${pathDifferent}`);

    const { data: filesA } = await supabase.storage.from('app-assets').list(`${tenantA}/files/profile`);
    const { data: filesB } = await supabase.storage.from('app-assets').list(`${tenantB}/files/profile`);

    console.log(`Storage Tenant A objects exist: ${filesA && filesA.length > 0}`);
    console.log(`Storage Tenant B objects exist: ${filesB && filesB.length > 0}`);

    console.log(`\nUnrelated data checks:`);
    const { data: docList } = await supabase.storage.from('documents').list('letters', { limit: 100 });
    console.log(`Remaining legacy objects exist (e.g. documents/letters): ${docList && docList.length > 0}`);
}
verifyRemediation();
