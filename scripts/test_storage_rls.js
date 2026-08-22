import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminClient = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function verifyStorageRLS() {
    console.log('--- STORAGE RLS VERIFICATION SCRIPT ---');
    
    const tenantA = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4';
    const tenantB = 'e5a973bb-54de-4a92-bd17-91a97d7fefc3';

    // 1. Create temporary test users
    console.log('1. Creating test users for Tenant A and Tenant B...');
    
    const testPassword = 'testpassword123!';
    const userAEmail = `test.tenantA.${Date.now()}@example.com`;
    const userBEmail = `test.tenantB.${Date.now()}@example.com`;

    const { data: userAData, error: errA } = await adminClient.auth.admin.createUser({
        email: userAEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { tenant_id: tenantA }
    });
    
    if (errA) throw new Error('Failed to create user A: ' + errA.message);

    const { data: userBData, error: errB } = await adminClient.auth.admin.createUser({
        email: userBEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { tenant_id: tenantB }
    });
    if (errB) throw new Error('Failed to create user B: ' + errB.message);

    console.log('Users created successfully. Now adding to user_tenant_mapping...');

    await adminClient.from('user_tenant_mapping').insert({ user_id: userAData.user.id, tenant_id: tenantA, role: 'staff' });
    await adminClient.from('user_tenant_mapping').insert({ user_id: userBData.user.id, tenant_id: tenantB, role: 'staff' });

    try {
        // 2. Sign in User A
        const clientA = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
        const { error: loginAError } = await clientA.auth.signInWithPassword({ email: userAEmail, password: testPassword });
        if (loginAError) throw new Error('Failed to login User A: ' + loginAError.message);

        // 3. Sign in User B
        const clientB = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
        const { error: loginBError } = await clientB.auth.signInWithPassword({ email: userBEmail, password: testPassword });
        if (loginBError) throw new Error('Failed to login User B: ' + loginBError.message);

        const anonClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

        console.log('\n--- Running Tests ---\n');

        // ==== ANON TESTS ====
        console.log('ANON: Attempting to read documents bucket...');
        const { data: anonRead, error: anonReadErr } = await anonClient.storage.from('documents').list('letters');
        if (anonReadErr && anonReadErr.message.includes('Tenant ID is missing')) {
             console.log('✅ ANON read DENIED (expected).');
        } else if (anonRead && anonRead.length === 0) {
             console.log('✅ ANON read RETURNED EMPTY (RLS correctly blocked select access).');
        } else if (anonReadErr) {
             console.log(`✅ ANON read DENIED: ${anonReadErr.message}`);
        } else {
             console.error('❌ ANON read ALLOWED when it should be DENIED! ' + JSON.stringify(anonRead));
        }

        console.log('ANON: Attempting to upload...');
        const anonFile = new Blob(['hello anon'], { type: 'text/plain' });
        const { error: anonUploadErr } = await anonClient.storage.from('app-assets').upload(`${tenantA}/files/anon.txt`, anonFile);
        if (anonUploadErr) console.log('✅ ANON upload DENIED (expected).');
        else console.error('❌ ANON upload ALLOWED!');

        // ==== TENANT A TESTS ====
        console.log('\nTENANT A: Attempting to upload to own path...');
        const fileA = new Blob(['hello A'], { type: 'text/plain' });
        const pathA = `${tenantA}/files/test_upload_A_${Date.now()}.txt`;
        const { data: uploadA, error: uploadAErr } = await clientA.storage.from('app-assets').upload(pathA, fileA);
        if (uploadAErr) console.error('❌ Tenant A upload own path DENIED: ', uploadAErr.message);
        else console.log('✅ Tenant A upload own path ALLOWED.');

        console.log('\nTENANT A: Attempting to read own path...');
        const { data: readA, error: readAErr } = await clientA.storage.from('app-assets').list(`${tenantA}/files`);
        if (readAErr) console.error('❌ Tenant A read own path DENIED: ', readAErr.message);
        else console.log(`✅ Tenant A read own path ALLOWED (Found ${readA.length} files).`);

        console.log('\nTENANT A: Attempting to get signed URL for own path...');
        if (uploadA?.path) {
            const { data: signedUrlA, error: signedUrlErr } = await clientA.storage.from('app-assets').createSignedUrl(uploadA.path, 60);
            if (signedUrlErr) console.error('❌ Tenant A signed URL own path DENIED: ', signedUrlErr.message);
            else console.log('✅ Tenant A signed URL own path ALLOWED.');
        }

        console.log('\nTENANT A: Attempting to upload to Tenant B path...');
        const pathAB = `${tenantB}/files/test_upload_AB_${Date.now()}.txt`;
        const { data: uploadAB, error: uploadABErr } = await clientA.storage.from('app-assets').upload(pathAB, fileA);
        if (uploadABErr) console.log('✅ Tenant A upload to Tenant B path DENIED (expected).');
        else console.error('❌ Tenant A upload to Tenant B ALLOWED!');

        console.log('\nTENANT A: Attempting to read Tenant B path...');
        const { data: readAB, error: readABErr } = await clientA.storage.from('app-assets').list(`${tenantB}/files`);
        if (readABErr) {
            console.log('✅ Tenant A read Tenant B path DENIED (expected).');
        } else if (readAB.length === 0) {
            console.log('✅ Tenant A read Tenant B path RETURNED EMPTY (RLS enforced).');
        } else {
            console.error('❌ Tenant A read Tenant B path RETURNED DATA!', readAB.length);
        }

        // ==== TENANT B TESTS ====
        console.log('\nTENANT B: Attempting to update Tenant A file...');
        if (uploadA?.path) {
            const fileB = new Blob(['hello B'], { type: 'text/plain' });
            const { data: updateBA, error: updateBAErr } = await clientB.storage.from('app-assets').update(uploadA.path, fileB);
            if (updateBAErr) console.log('✅ Tenant B update Tenant A object DENIED (expected).');
            else console.error('❌ Tenant B update Tenant A object ALLOWED!');
        }

        console.log('\nTENANT B: Attempting to delete Tenant A file...');
        if (uploadA?.path) {
            const { data: delBA, error: delBAErr } = await clientB.storage.from('app-assets').remove([uploadA.path]);
            if (delBAErr) {
                 console.log('✅ Tenant B delete Tenant A object DENIED (expected).');
            } else if (delBA.length === 0) {
                 console.log('✅ Tenant B delete Tenant A object HIDDEN/DENIED by RLS (expected).');
            } else {
                 console.error('❌ Tenant B delete Tenant A object ALLOWED! DELETED: ', delBA);
            }
        }

        console.log('\nTENANT B: Attempting to get signed URL for Tenant A file...');
        if (uploadA?.path) {
            const { data: signedUrlB, error: signedUrlBErr } = await clientB.storage.from('app-assets').createSignedUrl(uploadA.path, 60);
            if (signedUrlBErr) console.log('✅ Tenant B signed URL Tenant A file DENIED (expected).');
            else console.error('❌ Tenant B signed URL Tenant A file ALLOWED!');
        }

        // Clean up own object
        if (uploadA?.path) {
            const { data: delA, error: delAErr } = await clientA.storage.from('app-assets').remove([uploadA.path]);
            if (delAErr) console.error('❌ Tenant A delete own object failed:', delAErr.message);
            else console.log('\n✅ Tenant A delete own object ALLOWED.');
        }

    } finally {
        console.log('\nCleaning up test users...');
        await adminClient.from('user_tenant_mapping').delete().in('user_id', [userAData.user.id, userBData.user.id]);
        await adminClient.auth.admin.deleteUser(userAData.user.id);
        await adminClient.auth.admin.deleteUser(userBData.user.id);
        console.log('Test users deleted.');
    }
}

verifyStorageRLS().catch(console.error);
