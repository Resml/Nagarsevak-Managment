const fs = require('fs');
const content = fs.readFileSync('migrations/phase2_master_execution.sql', 'utf8');

const regex = /CREATE TABLE public\.([^\s\(]+)\s*\(([\s\S]*?)\);/g;
let match;
const planTables = [];
const catTables = [];

while ((match = regex.exec(content)) !== null) {
    const tableName = match[1].replace(/\"/g, '');
    const columns = match[2];
    if (columns.includes('plan text')) planTables.push(tableName);
    if (columns.match(/category\s+text/i)) catTables.push(tableName);
}
console.log('Tables with plan:', planTables);
console.log('Tables with category:', catTables);
