const fs = require('fs');
let c = fs.readFileSync('src/utils/translations.ts', 'utf8');

c = c.replace(
    '        report_columns: {',
    '        report_columns: {\n            citizen_info: "नागरिकांची माहिती",\n            title_type: "शीर्षक / प्रकार",\n            location_area: "ठिकाण / भाग",'
);

c = c.replace(
    '        report_columns: {',
    '        report_columns: {\n            citizen_info: "Citizen Info",\n            title_type: "Title / Type",\n            location_area: "Location / Area",'
);

c = c.replace(
    '        letters: {\n            title: "पत्र डॅशबोर्ड",',
    '        letters: {\n            recipient: "प्राप्तकर्ता",\n            sender: "प्रेषक",\n            title: "पत्र डॅशबोर्ड",'
);

c = c.replace(
    '        letters: {\n            title: "Letters Dashboard",',
    '        letters: {\n            recipient: "Recipient",\n            sender: "Sender",\n            title: "Letters Dashboard",'
);

fs.writeFileSync('src/utils/translations.ts', c);
console.log('Fixed missing again.');
