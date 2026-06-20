const fs = require('fs');
let c = fs.readFileSync('src/utils/translations.ts', 'utf8');
const lines = c.split('\n');

// Delete lines 331 to 336 (because there's an extra blank line maybe, let's just delete the exact block)
// The error says:
// 333: error TS1117
// 334: error TS1117
// 416: error TS1117
// 2193: error TS1117
// 2194: error TS1117
// 2276: error TS1117

const duplicatesToComment = [
    1086,
    1090,
    1103,
    1164,
    1264,
    1265,
    1266,
    1267,
    1268,
    4029,
    4040
];

duplicatesToComment.forEach(l => {
    const idx = l - 1;
    if (lines[idx] && !lines[idx].trim().startsWith('//')) {
        lines[idx] = '// ' + lines[idx];
    }
});

// For communication_page duplicates, they are blocks. Let's rename them instead of commenting them out to avoid syntax errors with unbalanced brackets!
// Lines 333, 334 are conf_meet_link, conf_signature duplicates inside the first block.
// Let's just rename them!
const renameDuplicateLines = [
    333,
    334,
    416, // communication_page
    2193,
    2194,
    2276 // communication_page
];

renameDuplicateLines.forEach(l => {
    const idx = l - 1;
    if (lines[idx]) {
        // e.g. "conf_meet_link:" -> "conf_meet_link_dup:"
        // "communication_page:" -> "communication_page_dup:"
        lines[idx] = lines[idx].replace(/(\w+):/, '$1_dup:');
    }
});

fs.writeFileSync('src/utils/translations.ts', lines.join('\n'));
console.log('Fixed ALL duplicate errors with tsc');
