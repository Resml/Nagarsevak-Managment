const fs = require('fs');
const content = fs.readFileSync('migrations/phase4_stage3_rollback.sql', 'utf8');
const tables = new Set();
const regex = /ON public\."([^"]+)" FOR UPDATE/g;
let match;
while ((match = regex.exec(content)) !== null) {
    tables.add(match[1]);
}
console.log(Array.from(tables).sort());
