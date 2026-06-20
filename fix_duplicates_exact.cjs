const fs = require('fs');
let c = fs.readFileSync('src/utils/translations.ts', 'utf8');
const lines = c.split('\n');

const duplicateLines = [413, 1081, 1085, 1098, 1159, 1259, 1260, 1261, 1262, 1263, 2268, 4018, 4029];

duplicateLines.forEach(lineNum => {
    const idx = lineNum - 1;
    // Comment it out if not already commented
    if (!lines[idx].trim().startsWith('//')) {
        // Wait, if it's the `communication_page: {`, we need to rename it, NOT comment it out.
        // Because if we comment it out, we leave the closing `}` uncommented, which causes syntax errors!
        if (lines[idx].includes('communication_page: {')) {
             lines[idx] = lines[idx].replace('communication_page: {', 'communication_page_dup: {');
        } else {
             lines[idx] = '// ' + lines[idx];
        }
    }
});

fs.writeFileSync('src/utils/translations.ts', lines.join('\n'));
console.log('Fixed exactly the duplicate lines');
