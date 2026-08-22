import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
    console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is required to bypass RLS for this remediation.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function runRemediation() {
    console.log('Starting remediation...');
    const remediationLog = [];

    const tenantA = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4';
    const tenantB = 'e5a973bb-54de-4a92-bd17-91a97d7fefc3';

    const images = [
        { name: 'party', file: `${tenantA}_party_1778758534146.jpg` },
        { name: 'profile', file: `${tenantA}_profile_1778757111210.jpg` }
    ];

    // 1. Copy storage objects for Tenant B
    for (const img of images) {
        const sourcePath = `${tenantA}/files/profile/${img.file}`;
        const targetPath = `${tenantB}/files/profile/${img.file}`;

        console.log(`Copying ${sourcePath} -> ${targetPath}`);
        
        // Check if target already exists
        const { data: existing } = await supabase.storage.from('app-assets').list(`${tenantB}/files/profile`, { search: img.file });
        if (existing && existing.length > 0) {
            console.log(`  Target already exists, skipping copy.`);
            remediationLog.push({ op: 'copy', status: 'skipped_exists', sourcePath, targetPath, timestamp: new Date().toISOString() });
        } else {
            const { error: copyError } = await supabase.storage.from('app-assets').copy(sourcePath, targetPath);
            if (copyError) {
                console.error(`  Copy failed:`, copyError);
                remediationLog.push({ op: 'copy', status: 'error', sourcePath, targetPath, error: copyError.message, timestamp: new Date().toISOString() });
                process.exit(1);
            }
            console.log(`  Copy successful.`);
            remediationLog.push({ op: 'copy', status: 'success', sourcePath, targetPath, timestamp: new Date().toISOString() });
        }
    }

    // 2. Update Database for Tenant A and Tenant B
    const updates = [
        {
            tenantId: tenantA,
            partyPath: `${tenantA}/files/profile/${images[0].file}`,
            profilePath: `${tenantA}/files/profile/${images[1].file}`
        },
        {
            tenantId: tenantB,
            partyPath: `${tenantB}/files/profile/${images[0].file}`,
            profilePath: `${tenantB}/files/profile/${images[1].file}`
        }
    ];

    for (const update of updates) {
        console.log(`Updating DB for Tenant ${update.tenantId}`);
        // Read current
        const { data: tData, error: readError } = await supabase.from('tenants').select('config').eq('id', update.tenantId).single();
        if (readError) {
            console.error(`  Read failed:`, readError);
            process.exit(1);
        }

        const oldConfig = { ...tData.config };
        const newConfig = { ...tData.config, party_logo_url: update.partyPath, profile_image_url: update.profilePath };

        const { error: updateError } = await supabase.from('tenants').update({ config: newConfig }).eq('id', update.tenantId);
        
        if (updateError) {
            console.error(`  Update failed:`, updateError);
            remediationLog.push({ op: 'update_db', status: 'error', tenant_id: update.tenantId, error: updateError.message, timestamp: new Date().toISOString() });
            process.exit(1);
        }

        console.log(`  Update successful.`);
        remediationLog.push({ 
            op: 'update_db', 
            status: 'success', 
            tenant_id: update.tenantId, 
            old_db_value: { party: oldConfig.party_logo_url, profile: oldConfig.profile_image_url },
            new_db_value: { party: newConfig.party_logo_url, profile: newConfig.profile_image_url },
            timestamp: new Date().toISOString() 
        });
    }

    fs.writeFileSync('migrations/remediation_log.json', JSON.stringify(remediationLog, null, 2));
    console.log('Remediation completed successfully.');
}

runRemediation();
