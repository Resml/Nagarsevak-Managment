const fs = require('fs');
let c = fs.readFileSync('src/utils/translations.ts', 'utf8');

// Replace commented out keys
c = c.replace(/\/\/         communication_page: \{/g, '        communication_page: {');
c = c.replace(/\/\/             subject: \"Subject\",/g, '            subject: "Subject",');
c = c.replace(/\/\/             area: \"Area\",/g, '            area: "Area",');
c = c.replace(/\/\/             name: \"Name\",/g, '            name: "Name",');
c = c.replace(/\/\/             description: \"Description\",/g, '            description: "Description",');
c = c.replace(/\/\/             col_title/g, '            col_title');
c = c.replace(/\/\/             col_amount/g, '            col_amount');
c = c.replace(/\/\/             col_status/g, '            col_status');
c = c.replace(/\/\/             col_date/g, '            col_date');
c = c.replace(/\/\/             col_area/g, '            col_area');
c = c.replace(/\/\/             area: \"क्षेत्र\",/g, '            area: "क्षेत्र",');
c = c.replace(/\/\/             name: \"नाम\",/g, '            name: "नाम",');

// Wait, the user added `communication_page` around line 326 which causes a duplicate key.
// Let's rename the new ones to `communication_page_extra` temporarily to avoid duplicate key errors.
// Wait, no. If we just rename the first `communication_page` to `communication_page_extra`, it won't break the build and the user's keys will still exist.
// Let's just fix the `// ` comments first.

fs.writeFileSync('src/utils/translations.ts', c);
console.log('Fixed comments');
