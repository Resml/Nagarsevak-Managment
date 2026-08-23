import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateMappingReport() {
    console.log('# Legacy Storage Object Mapping Report\n');
    let report = '| Bucket | Legacy Object Path | Database Table | Record ID | Record Tenant ID | Target Secure Path | Status |\n';
    report += '|---|---|---|---|---|---|---|\n';

    // 1. Documents Bucket
    const { data: docFiles, error: docError } = await supabase.storage.from('documents').list('', { limit: 1000 });
    const { data: docSubFiles, error: docSubError } = await supabase.storage.from('documents').list('letters', { limit: 1000 });
    
    let allDocFiles = [];
    if (docFiles) allDocFiles = [...allDocFiles, ...docFiles.map(f => f.name)];
    if (docSubFiles) allDocFiles = [...allDocFiles, ...docSubFiles.map(f => `letters/${f.name}`)];

    // Fetch all potential referencing records
    const { data: letterRequests } = await supabase.from('letter_requests').select('id, tenant_id, pdf_url');
    // const { data: incomingLetters } = await supabase.from('incoming_letters').select('id, tenant_id, file_url').catch(() => ({data: []}));
    const { data: complaints } = await supabase.from('complaints').select('id, tenant_id, image_url');

    for (const file of allDocFiles) {
        // Is it legacy? (Doesn't start with UUID length 36 or doesn't have a slash)
        if (file.includes('/') && file.split('/')[0].length === 36) continue;
        if (file === '.emptyFolderPlaceholder') continue;

        let foundRecord = null;
        let table = '';
        let targetPath = '';

        // Search letter_requests
        if (letterRequests) {
            const match = letterRequests.find(r => r.pdf_url && r.pdf_url.includes(file));
            if (match) {
                foundRecord = match;
                table = 'letter_requests';
                targetPath = `${match.tenant_id}/files/letters/${file.split('/').pop()}`;
            }
        }

        if (foundRecord) {
            report += `| documents | \`${file}\` | \`${table}\` | \`${foundRecord.id}\` | \`${foundRecord.tenant_id}\` | \`${targetPath}\` | ✅ Mapped |\n`;
        } else {
            report += `| documents | \`${file}\` | *None* | *N/A* | *Unknown* | *Isolate* | ❌ Unmapped |\n`;
        }
    }

    // 2. App-Assets Bucket
    const { data: assetFiles } = await supabase.storage.from('app-assets').list('', { limit: 1000 });
    const { data: tenants } = await supabase.from('tenants').select('id, config');

    if (assetFiles) {
        for (const file of assetFiles) {
            if (file.name === '.emptyFolderPlaceholder') continue;
            // Legacy if it doesn't start with tenant_id/
            if (file.name.includes('/') && file.name.split('/')[0].length === 36) continue;

            let foundRecord = null;
            let targetPath = '';

            if (tenants) {
                const match = tenants.find(t => 
                    (t.config?.profile_image_url && t.config.profile_image_url.includes(file.name)) ||
                    (t.config?.party_logo_url && t.config.party_logo_url.includes(file.name))
                );
                if (match) {
                    foundRecord = match;
                    targetPath = `${match.id}/files/profile/${file.name}`;
                } else if (file.name.length > 36 && tenants.find(t => t.id === file.name.substring(0, 36))) {
                    // Implicit match based on prefix
                    const t = tenants.find(t => t.id === file.name.substring(0, 36));
                    foundRecord = t;
                    targetPath = `${t.id}/files/profile/${file.name}`;
                }
            }

            if (foundRecord) {
                report += `| app-assets | \`${file.name}\` | \`tenants\` | \`${foundRecord.id}\` | \`${foundRecord.id}\` | \`${targetPath}\` | ✅ Mapped |\n`;
            } else {
                report += `| app-assets | \`${file.name}\` | *None* | *N/A* | *Unknown* | *Isolate* | ❌ Unmapped |\n`;
            }
        }
    }

    fs.writeFileSync('migrations/legacy_storage_mapping_report.md', report);
    console.log('Report generated at migrations/legacy_storage_mapping_report.md');
}

generateMappingReport();
