const fs = require('fs');
let c = fs.readFileSync('src/utils/translations.ts', 'utf8');
const lines = c.split('\n');

// Delete lines 329 to 334
for (let i = 328; i < 334; i++) {
    lines[i] = '';
}

// Delete lines 2188 to 2193
for (let i = 2187; i < 2193; i++) {
    lines[i] = '';
}

// The following lines reported by tsc (excluding 415 and 2274):
const duplicateLines = [
    1085,
    1089,
    1102,
    1163,
    1263,
    1264,
    1265,
    1266,
    1267,
    4026,
    4037
];

duplicateLines.forEach(l => {
    const idx = l - 1;
    if (lines[idx] && !lines[idx].trim().startsWith('//')) {
        lines[idx] = '// ' + lines[idx];
    }
});

fs.writeFileSync('src/utils/translations.ts', lines.join('\n'));
console.log('Fixed exactly according to tsc');
