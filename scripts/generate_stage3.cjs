const fs = require('fs');

const csv = fs.readFileSync('migrations/live_policies.csv', 'utf8');
const lines = csv.split('\n');
const headers = lines[0].split(',');

const policies = lines.slice(1).map(line => {
    let result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && line[i+1] === '"') {
            current += '"';
            i++;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    
    if (result.length < 7) return null;
    return {
        tablename: result[0],
        rls_enabled: result[1],
        policyname: result[2],
        roles: result[3],
        cmd: result[4],
        qual: result[5] === 'null' ? null : result[5],
        with_check: result[6] === 'null' ? null : result[6]
    };
}).filter(p => p !== null);

const mapping = {
  'tasks': ['tasks'],
  'letters': ['incoming_letters', 'letter_requests', 'letter_types'],
  'visitors': ['visitors'],
  'complaints': ['complaints', 'personal_requests'],
  'ward_problems': ['area_problems'],
  'work_history': ['works', 'work_trackers', 'work_tracker_history'],
  'voters': ['voters', 'non_voters'],
  'housing_societies': ['housing_societies'],
  'staff': ['staff'],
  'public_comm': ['message_logs'],
  'schemes': ['schemes', 'scheme_applications'],
  'provision': ['ward_provisions'],
  'ai_content': ['ai_history'],
  'gallery': ['gallery'],
  'results': ['election_results'],
  'sadasya': ['sadasya'],
  'improvements': ['improvements'],
  'gb_register': ['gb_diary'],
  'opposition': ['opposition_karyakartas'],
  'social_organizations': ['social_organizations'],
  'voter_forms': ['voter_applications'],
  'surveys': ['surveys', 'survey_responses'],
  'events': ['events', 'event_rsvps'],
  'conference_room': ['conference_rooms']
};

let migrationSql = 'BEGIN;\n\n';
let rollbackSql = 'BEGIN;\n\n';
let matrixMd = '| Table | Feature | Policy Name | Command | Roles | Original Condition | New Condition |\n|:---|:---|:---|:---|:---|:---|:---|\n';

let stats = {
    insert: 0,
    update: 0,
    select: 0,
    delete: 0,
    anon: 0,
    whatsapp: 0,
    storage: 0
};

const tableToFeature = {};
for (const [feat, tables] of Object.entries(mapping)) {
    for (const t of tables) {
        tableToFeature[t] = feat;
    }
}

// Helper to truncate policy names so suffixes fit in Postgres' 63 byte limit
function safePolicyName(baseName, suffix) {
    const maxLength = 63 - suffix.length;
    let safeBase = baseName;
    if (safeBase.length > maxLength) {
        safeBase = safeBase.substring(0, maxLength);
    }
    return safeBase + suffix;
}

for (const p of policies) {
    if (!tableToFeature[p.tablename]) {
        if (p.tablename === 'whatsapp_sessions') stats.whatsapp++;
        continue;
    }
    const feat = tableToFeature[p.tablename];
    
    // SKIPS based on User Instructions
    if (p.roles && p.roles.includes('anon')) {
        stats.anon++;
        continue;
    }
    if (p.roles && p.roles.includes('service_role')) {
        continue;
    }
    if (p.cmd === 'SELECT') {
        stats.select++;
        continue;
    }
    if (p.cmd === 'DELETE') {
        stats.delete++;
        continue;
    }
    
    // Reformat roles
    const roleStr = p.roles ? p.roles.replace('{','').replace('}','') : 'public';
    
    if (p.cmd === 'ALL') {
        stats.insert++;
        stats.update++;
        stats.select++; 
        stats.delete++;
        
        const selName = safePolicyName(p.policyname, '_sel');
        const delName = safePolicyName(p.policyname, '_del');
        const insName = safePolicyName(p.policyname, '_ins');
        const updName = safePolicyName(p.policyname, '_upd');
        
        migrationSql += `-- Splitting ALL policy '${p.policyname}' on table '${p.tablename}'\n`;
        migrationSql += `DROP POLICY IF EXISTS "${p.policyname}" ON public."${p.tablename}";\n`;
        // ensure cleanup of existing if previous migration ran partially
        migrationSql += `DROP POLICY IF EXISTS "${selName}" ON public."${p.tablename}";\n`;
        migrationSql += `DROP POLICY IF EXISTS "${delName}" ON public."${p.tablename}";\n`;
        migrationSql += `DROP POLICY IF EXISTS "${insName}" ON public."${p.tablename}";\n`;
        migrationSql += `DROP POLICY IF EXISTS "${updName}" ON public."${p.tablename}";\n`;
        
        rollbackSql += `DROP POLICY IF EXISTS "${selName}" ON public."${p.tablename}";\n`;
        rollbackSql += `DROP POLICY IF EXISTS "${insName}" ON public."${p.tablename}";\n`;
        rollbackSql += `DROP POLICY IF EXISTS "${updName}" ON public."${p.tablename}";\n`;
        rollbackSql += `DROP POLICY IF EXISTS "${delName}" ON public."${p.tablename}";\n`;
        
        const rlsQual = p.qual || 'true';
        const rlsCheck = p.with_check ? ` WITH CHECK (${p.with_check})` : '';
        
        rollbackSql += `DROP POLICY IF EXISTS "${p.policyname}" ON public."${p.tablename}";\n`;
        rollbackSql += `CREATE POLICY "${p.policyname}" ON public."${p.tablename}" FOR ALL TO ${roleStr} USING (${rlsQual})${rlsCheck};\n`;

        migrationSql += `CREATE POLICY "${selName}" ON public."${p.tablename}" FOR SELECT TO ${roleStr} USING (${rlsQual});\n`;
        migrationSql += `CREATE POLICY "${delName}" ON public."${p.tablename}" FOR DELETE TO ${roleStr} USING (${rlsQual});\n`;
        
        const newQual = `(${rlsQual}) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, '${feat}'))`;
        const newWithCheck = p.with_check ? `(${p.with_check}) AND (auth.role() = 'anon' OR public.has_feature_access(tenant_id, '${feat}'))` : newQual;
        
        migrationSql += `CREATE POLICY "${insName}" ON public."${p.tablename}" FOR INSERT TO ${roleStr} WITH CHECK (${newWithCheck});\n`;
        migrationSql += `CREATE POLICY "${updName}" ON public."${p.tablename}" FOR UPDATE TO ${roleStr} USING (${newQual}) WITH CHECK (${newWithCheck});\n\n`;
        
        matrixMd += `| ${p.tablename} | ${feat} | ${p.policyname} | ALL | ${p.roles} | (Split to 4 ops) | INSERT/UPDATE now check has_feature_access |\n`;
        continue;
    }
    
    if (p.cmd === 'INSERT' || p.cmd === 'UPDATE') {
        if (p.cmd === 'INSERT') stats.insert++;
        if (p.cmd === 'UPDATE') stats.update++;
        
        migrationSql += `DROP POLICY IF EXISTS "${p.policyname}" ON public."${p.tablename}";\n`;
        
        const bypassAnon = `(auth.role() = 'anon' OR public.has_feature_access(tenant_id, '${feat}'))`;

        if (p.cmd === 'INSERT') {
            const existingWithCheck = p.with_check ? p.with_check : 'true';
            const newWithCheck = `(${existingWithCheck}) AND ${bypassAnon}`;
            
            migrationSql += `CREATE POLICY "${p.policyname}" ON public."${p.tablename}" FOR INSERT TO ${roleStr} WITH CHECK (${newWithCheck});\n\n`;
            rollbackSql += `DROP POLICY IF EXISTS "${p.policyname}" ON public."${p.tablename}";\n`;
            rollbackSql += `CREATE POLICY "${p.policyname}" ON public."${p.tablename}" FOR INSERT TO ${roleStr} WITH CHECK (${existingWithCheck});\n\n`;
            
            matrixMd += `| ${p.tablename} | ${feat} | ${p.policyname} | ${p.cmd} | ${p.roles} | \`${existingWithCheck}\` | \`${newWithCheck}\` |\n`;
        } else {
            const existingQual = p.qual ? p.qual : 'true';
            const newQual = `(${existingQual}) AND ${bypassAnon}`;
            
            let rollbackWithCheckClause = p.with_check ? ` WITH CHECK (${p.with_check})` : '';
            
            if (p.with_check) {
                const newWithCheck = `(${p.with_check}) AND ${bypassAnon}`;
                migrationSql += `CREATE POLICY "${p.policyname}" ON public."${p.tablename}" FOR UPDATE TO ${roleStr} USING (${newQual}) WITH CHECK (${newWithCheck});\n\n`;
                matrixMd += `| ${p.tablename} | ${feat} | ${p.policyname} | ${p.cmd} | ${p.roles} | \`USING(${existingQual}) WITH CHECK(${p.with_check})\` | \`USING(${newQual}) WITH CHECK(${newWithCheck})\` |\n`;
            } else {
                migrationSql += `CREATE POLICY "${p.policyname}" ON public."${p.tablename}" FOR UPDATE TO ${roleStr} USING (${newQual});\n\n`;
                matrixMd += `| ${p.tablename} | ${feat} | ${p.policyname} | ${p.cmd} | ${p.roles} | \`USING(${existingQual})\` | \`USING(${newQual})\` |\n`;
            }
            
            rollbackSql += `DROP POLICY IF EXISTS "${p.policyname}" ON public."${p.tablename}";\n`;
            rollbackSql += `CREATE POLICY "${p.policyname}" ON public."${p.tablename}" FOR UPDATE TO ${roleStr} USING (${existingQual})${rollbackWithCheckClause};\n\n`;
        }
    }
}

migrationSql += 'COMMIT;\n';
rollbackSql += 'COMMIT;\n';

fs.writeFileSync('migrations/phase4_stage3_rls_integration.sql', migrationSql);
fs.writeFileSync('migrations/phase4_stage3_rollback.sql', rollbackSql);
fs.writeFileSync('migrations/phase4_stage3_matrix.md', matrixMd);
console.log('Done generating sql files with safe policy names');
