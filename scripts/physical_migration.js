import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runPhysicalMigration() {
    console.log('Starting Physical Object Migration...');
    
    const migrationLog = [];
    const rollbackMapping = [];

    // --- 1. Documents Bucket ---
    const { data: docFiles } = await supabase.storage.from('documents').list('', { limit: 1000 });
    const { data: docSubFiles } = await supabase.storage.from('documents').list('letters', { limit: 1000 });
    
    let allDocFiles = [];
    if (docFiles) allDocFiles = [...allDocFiles, ...docFiles.map(f => f.name)];
    if (docSubFiles) allDocFiles = [...allDocFiles, ...docSubFiles.map(f => `letters/${f.name}`)];

    const { data: letterRequests } = await supabase.from('letter_requests').select('id, tenant_id, pdf_url');
    const { data: complaints } = await supabase.from('complaints').select('id, tenant_id, image_url');

    for (const file of allDocFiles) {
        if (file.includes('/') && file.split('/')[0].length === 36) continue; // Already migrated/new format
        if (file === '.emptyFolderPlaceholder') continue;

        let foundRecord = null;
        let table = '';
        let targetPath = '';
        let updateColumn = '';

        if (letterRequests) {
            const match = letterRequests.find(r => r.pdf_url && r.pdf_url.includes(file));
            if (match) {
                foundRecord = match;
                table = 'letter_requests';
                targetPath = `${match.tenant_id}/files/letters/${file.split('/').pop()}`;
                updateColumn = 'pdf_url';
            }
        }

        if (foundRecord) {
            console.log(`Migrating documents object: ${file} -> ${targetPath}`);
            
            // Step A: Check if target exists
            const { data: targetCheck } = await supabase.storage.from('documents').list(targetPath.substring(0, targetPath.lastIndexOf('/')), { search: targetPath.split('/').pop() });
            if (targetCheck && targetCheck.length > 0) {
                console.log(`  -> Target already exists. Skipping move.`);
            } else {
                // Step B: Move object
                const { error: moveError } = await supabase.storage.from('documents').move(file, targetPath);
                if (moveError) {
                    console.error(`  -> Move failed: ${moveError.message}`);
                    continue;
                }
            }

            // Step C: Update Database
            const { error: dbError } = await supabase.from(table).update({ [updateColumn]: targetPath }).eq('id', foundRecord.id);
            if (dbError) {
                console.error(`  -> DB Update failed: ${dbError.message}`);
                // Database failed after move! Log it for manual intervention
                migrationLog.push({ bucket: 'documents', oldPath: file, newPath: targetPath, table, id: foundRecord.id, status: 'DB_ERROR', error: dbError.message });
            } else {
                console.log(`  -> Successfully migrated.`);
                migrationLog.push({ bucket: 'documents', oldPath: file, newPath: targetPath, table, id: foundRecord.id, status: 'SUCCESS' });
                rollbackMapping.push({ bucket: 'documents', old_path: file, new_path: targetPath, table, id: foundRecord.id, column: updateColumn, old_db_value: foundRecord[updateColumn] });
            }
        } else {
            console.log(`Skipping unmapped legacy document: ${file}`);
            migrationLog.push({ bucket: 'documents', oldPath: file, status: 'SKIPPED_UNMAPPED' });
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
                // strict UUID matching rule: filename must start with the exact tenant UUID to be migrated
                const t = tenants.find(t => t.id === file.name.substring(0, 36));
                if (t) {
                    foundRecord = t;
                    targetPath = `${t.id}/files/profile/${file.name}`;
                }
            }

            if (foundRecord) {
                console.log(`Migrating app-assets object: ${file.name} -> ${targetPath}`);
                
                // Check if target exists
                const { data: targetCheck } = await supabase.storage.from('app-assets').list(targetPath.substring(0, targetPath.lastIndexOf('/')), { search: targetPath.split('/').pop() });
                if (targetCheck && targetCheck.length > 0) {
                    console.log(`  -> Target already exists. Skipping move.`);
                } else {
                    const { error: moveError } = await supabase.storage.from('app-assets').move(file.name, targetPath);
                    if (moveError) {
                        console.error(`  -> Move failed: ${moveError.message}`);
                        continue;
                    }
                }

                // Update Tenant Config
                const newConfig = { ...foundRecord.config };
                let updated = false;
                if (newConfig.profile_image_url && newConfig.profile_image_url.includes(file.name)) {
                    newConfig.profile_image_url = targetPath;
                    updated = true;
                }
                if (newConfig.party_logo_url && newConfig.party_logo_url.includes(file.name)) {
                    newConfig.party_logo_url = targetPath;
                    updated = true;
                }

                if (updated) {
                    const { error: dbError } = await supabase.from('tenants').update({ config: newConfig }).eq('id', foundRecord.id);
                    if (dbError) {
                        console.error(`  -> DB Update failed: ${dbError.message}`);
                        migrationLog.push({ bucket: 'app-assets', oldPath: file.name, newPath: targetPath, table: 'tenants', id: foundRecord.id, status: 'DB_ERROR', error: dbError.message });
                    } else {
                        console.log(`  -> Successfully migrated.`);
                        migrationLog.push({ bucket: 'app-assets', oldPath: file.name, newPath: targetPath, table: 'tenants', id: foundRecord.id, status: 'SUCCESS' });
                        rollbackMapping.push({ bucket: 'app-assets', old_path: file.name, new_path: targetPath, table: 'tenants', id: foundRecord.id, column: 'config', old_db_value: foundRecord.config });
                    }
                } else {
                     console.log(`  -> Successfully migrated object but DB did not strictly reference it.`);
                     migrationLog.push({ bucket: 'app-assets', oldPath: file.name, newPath: targetPath, table: 'tenants', id: foundRecord.id, status: 'SUCCESS_NO_DB_CHANGE' });
                }
            } else {
                console.log(`Skipping unmapped legacy app-asset: ${file.name}`);
                migrationLog.push({ bucket: 'app-assets', oldPath: file.name, status: 'SKIPPED_UNMAPPED' });
            }
        }
    }

    fs.writeFileSync('migrations/migration_log.json', JSON.stringify(migrationLog, null, 2));
    fs.writeFileSync('migrations/rollback_mapping.json', JSON.stringify(rollbackMapping, null, 2));
    
    console.log('\\nMigration script generation complete. Logs and rollbacks saved.');
}

runPhysicalMigration();
