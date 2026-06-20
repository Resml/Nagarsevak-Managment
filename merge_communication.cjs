const fs = require('fs');
let c = fs.readFileSync('src/utils/translations.ts', 'utf8');

// 1. Merge the user's new communication_page keys into the main communication_page blocks

// English:
c = c.replace(/        communication_page: \{\n            conf_meet_link: "Meeting Link",\n            conf_signature: "Signature"\n        \},\n/g, '');
c = c.replace(/        communication_page: \{/g, '        communication_page: {\n            conf_meet_link: "Meeting Link",\n            conf_signature: "Signature",');

// Marathi:
c = c.replace(/        communication_page: \{\n            conf_meet_link: "मीटिंग लिंक",\n            conf_signature: "स्वाक्षरी"\n        \},\n/g, '');
c = c.replace(/        communication_page: \{\n            conf_meet_link: "Meeting Link",\n            conf_signature: "Signature",\n            title: "जनसंवाद",/g, 
              '        communication_page: {\n            conf_meet_link: "मीटिंग लिंक",\n            conf_signature: "स्वाक्षरी",\n            title: "जनसंवाद",');

fs.writeFileSync('src/utils/translations.ts', c);

console.log('Merged communication_page');
