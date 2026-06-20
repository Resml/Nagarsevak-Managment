const fs = require('fs');
let c = fs.readFileSync('src/utils/translations.ts', 'utf8');

c = c.replace(
    /        communication_page: \{\s*\n\s*title: "जनसंवाद",/g,
    '        communication_page: {\n            conf_meet_link: "मीटिंग लिंक",\n            conf_signature: "स्वाक्षरी",\n            title: "जनसंवाद",'
);

// English:
c = c.replace(
    /        communication_page: \{\s*\n\s*title: "Public Communication",/g,
    '        communication_page: {\n            conf_meet_link: "Meeting Link",\n            conf_signature: "Signature",\n            title: "Public Communication",'
);

fs.writeFileSync('src/utils/translations.ts', c);
console.log('Added meeting link to communication_page');
