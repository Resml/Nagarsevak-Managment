const fs = require('fs');
let c = fs.readFileSync('src/utils/translations.ts', 'utf8');

// 1. Remove the user's added communication_page blocks entirely
c = c.replace(/        communication_page: \{\n            conf_meet_link: "Meeting Link",\n            conf_signature: "Signature"\n        \},\n/g, '');

c = c.replace(/        communication_page: \{\n            conf_meet_link: "मीटिंग लिंक",\n            conf_signature: "स्वाक्षरी"\n        \},\n/g, '');

// 2. Insert the keys into the main communication_page blocks
c = c.replace(/        communication_page: \{/g, '        communication_page: {\n            conf_meet_link: "Meeting Link",\n            conf_signature: "Signature",');
// Wait, the marathi one needs Marathi strings
c = c.replace(/        communication_page: \{\n            conf_meet_link: "Meeting Link",\n            conf_signature: "Signature",\n            title: "जनसंवाद",/g, 
              '        communication_page: {\n            conf_meet_link: "मीटिंग लिंक",\n            conf_signature: "स्वाक्षरी",\n            title: "जनसंवाद",');

// 3. For the other duplicate keys (subject, area, name, description, col_title, etc.)
// They seem to be accidentally duplicated in letter_dashboard or similar objects.
// Let's just comment them out properly because the user themselves commented them out (but they failed because of syntax). Wait, commenting them out was my initial idea which worked, but the user broke it by uncommenting.
// Let's just rename them safely so TS doesn't complain and we don't break syntax.
const duplicates = [
    { line: 1081, old: 'subject:', new: 'subject_dup:' },
    { line: 1085, old: 'area:', new: 'area_dup:' },
    { line: 1098, old: 'name:', new: 'name_dup:' },
    { line: 1159, old: 'description:', new: 'description_dup:' },
    { line: 1259, old: 'col_title:', new: 'col_title_dup:' },
    { line: 1260, old: 'col_amount:', new: 'col_amount_dup:' },
    { line: 1261, old: 'col_status:', new: 'col_status_dup:' },
    { line: 1262, old: 'col_date:', new: 'col_date_dup:' },
    { line: 1263, old: 'col_area:', new: 'col_area_dup:' },
    { line: 4018, old: 'area:', new: 'area_dup:' },
    { line: 4029, old: 'name:', new: 'name_dup:' }
];

const lines = c.split('\n');
duplicates.forEach(dup => {
    // Wait, the lines might have shifted because we removed 8 lines from the top!
    // It's better to just string replace using precise regex.
});
fs.writeFileSync('src/utils/translations.ts', lines.join('\n'));
