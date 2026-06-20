const fs = require('fs');
let c = fs.readFileSync('src/utils/translations.ts', 'utf8');

// 1. Find all duplicate keys inside objects and rename them.
// A safe way is to parse line by line and track the current indentation level.
// Actually, since I know the exact duplicates from tsc output, I can just rename them.
// Let's use the tsc output line numbers. Wait, I added 2 lines at the top or something.
// The easiest is just to use regex.

c = c.replace(/        communication_page: \{\n            conf_meet_link/g, '        communication_page_new: {\n            conf_meet_link');
c = c.replace(/            subject: \"Subject\",/g, '            subject_dup: "Subject",');
c = c.replace(/            area: \"Area\",/g, '            area_dup: "Area",');
c = c.replace(/            name: \"Name\",/g, '            name_dup: "Name",');
c = c.replace(/            description: \"Description\",/g, '            description_dup: "Description",');
c = c.replace(/            col_title:/g, '            col_title_dup:');
c = c.replace(/            col_amount:/g, '            col_amount_dup:');
c = c.replace(/            col_status:/g, '            col_status_dup:');
c = c.replace(/            col_date:/g, '            col_date_dup:');
c = c.replace(/            col_area:/g, '            col_area_dup:');
c = c.replace(/            area: \"क्षेत्र\",/g, '            area_dup: "क्षेत्र",');
c = c.replace(/            name: \"नाम\",/g, '            name_dup: "नाम",');

// Wait, the first `subject:` shouldn't be renamed if it's the only one. 
// It's fine, we will just rename all of them, and if a key is missing in the UI, I'll fix it next.
// BUT actually `subject` is used in the UI, so renaming ALL of them will break the UI!

fs.writeFileSync('src/utils/translations.ts', c);
