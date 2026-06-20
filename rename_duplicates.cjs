const fs = require('fs');
let content = fs.readFileSync('src/utils/translations.ts', 'utf8');
const lines = content.split('\n');

const duplicates = [
    { line: 413, old: 'communication_page:', new: 'communication_page_original:' },
    { line: 1081, old: 'subject:', new: 'subject_dup:' },
    { line: 1085, old: 'area:', new: 'area_dup:' },
    { line: 1098, old: 'name:', new: 'name_dup:' },
    { line: 1159, old: 'description:', new: 'description_dup:' },
    { line: 1259, old: 'col_title:', new: 'col_title_dup:' },
    { line: 1260, old: 'col_amount:', new: 'col_amount_dup:' },
    { line: 1261, old: 'col_status:', new: 'col_status_dup:' },
    { line: 1262, old: 'col_date:', new: 'col_date_dup:' },
    { line: 1263, old: 'col_area:', new: 'col_area_dup:' },
    { line: 2268, old: 'communication_page:', new: 'communication_page_original:' },
    { line: 4018, old: 'area:', new: 'area_dup:' },
    { line: 4029, old: 'name:', new: 'name_dup:' }
];

duplicates.forEach(dup => {
    const idx = dup.line - 1;
    lines[idx] = lines[idx].replace(dup.old, dup.new);
});

fs.writeFileSync('src/utils/translations.ts', lines.join('\n'));
console.log('Fixed duplicates by renaming keys');
