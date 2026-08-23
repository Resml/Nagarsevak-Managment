import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateFinalReport() {
    console.log('Generating final simulation report...');
    
    let report = '| Bucket | Old Path | New Path | Tenant | DB Record | Status |\n';
    report += '|---|---|---|---|---|---|\n';

    // --- 1. Documents Bucket ---
    const { data: docFiles } = await supabase.storage.from('documents').list('', { limit: 1000 });
    const { data: docSubFiles } = await supabase.storage.from('documents').list('letters', { limit: 1000 });
    
    let allDocFiles = [];
    if (docFiles) allDocFiles = [...allDocFiles, ...docFiles.map(f => f.name)];
    if (docSubFiles) allDocFiles = [...allDocFiles, ...docSubFiles.map(f => `letters/${f.name}`)];

    const { data: letterRequests } = await supabase.from('letter_requests').select('id, tenant_id, pdf_url');

    for (const file of allDocFiles) {
        if (file.includes('/') && file.split('/')[0].length === 36) continue; 
        if (file === '.emptyFolderPlaceholder') continue;

        let foundRecord = null;
        let table = '';
        let targetPath = '';

        if (letterRequests) {
            const match = letterRequests.find(r => r.pdf_url && r.pdf_url.includes(file));
            if (match) {
                foundRecord = match;
                table = 'letter_requests';
                targetPath = `${match.tenant_id}/files/letters/${file.split('/').pop()}`;
            }
        }

        if (foundRecord) {
            report += `| documents | \`${file}\` | \`${targetPath}\` | \`${foundRecord.tenant_id}\` | \`${table}\` (\`${foundRecord.id}\`) | ⏳ Pending Migration |\n`;
        } else {
            report += `| documents | \`${file}\` | *Isolate* | *Unknown* | *N/A* | ❌ Skipped (Orphaned) |\n`;
        }
    }

    // --- 2. App-Assets Bucket ---
    const { data: assetFiles } = await supabase.storage.from('app-assets').list('', { limit: 1000 });
    const { data: tenants } = await supabase.from('tenants').select('id, config');

    if (assetFiles) {
        for (const file of assetFiles) {
            if (file.name === '.emptyFolderPlaceholder') continue;
            if (file.name.includes('/') && file.name.split('/')[0].length === 36) continue;

            let foundRecord = null;
            let targetPath = '';

            if (tenants) {
                const t = tenants.find(t => t.id === file.name.substring(0, 36));
                if (t) {
                    foundRecord = t;
                    targetPath = `${t.id}/files/profile/${file.name}`;
                }
            }

            if (foundRecord) {
                report += `| app-assets | \`${file.name}\` | \`${targetPath}\` | \`${foundRecord.id}\` | \`tenants\` (\`${foundRecord.id}\`) | ⏳ Pending Migration |\n`;
            } else {
                report += `| app-assets | \`${file.name}\` | *Isolate* | *Unknown* | *N/A* | ❌ Skipped (Orphaned) |\n`;
            }
        }
    }

    fs.writeFileSync('migrations/final_migration_report.md', report);
    console.log('Done.');
}

generateFinalReport();
