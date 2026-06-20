const fs = require('fs');
let c = fs.readFileSync('src/utils/translations.ts', 'utf8');

// MR report_columns
c = c.replace(
    /        report_columns: \{\s*\n/,
    '        report_columns: {\n            citizen_info: "नागरिकांची माहिती",\n            title_type: "शीर्षक / प्रकार",\n            location_area: "ठिकाण / भाग",\n'
);

// EN report_columns
c = c.replace(
    /export const translations = \{\n    en: \{\n        common: \{\s*\n[\s\S]*?        report_columns: \{\s*\n/,
    match => match.replace('report_columns: {', 'report_columns: {\n            citizen_info: "Citizen Info",\n            title_type: "Title / Type",\n            location_area: "Location / Area",')
);

// MR letters
c = c.replace(
    /        letters: \{\s*\n\s*title: "पत्र डॅशबोर्ड",/,
    '        letters: {\n            recipient: "प्राप्तकर्ता",\n            sender: "प्रेषक",\n            title: "पत्र डॅशबोर्ड",'
);

// EN letters
c = c.replace(
    /        letters: \{\s*\n\s*title: "Letters Dashboard",/,
    '        letters: {\n            recipient: "Recipient",\n            sender: "Sender",\n            title: "Letters Dashboard",'
);

// MR communication_page
c = c.replace(
    /        communication_page: \{\s*\n/,
    '        communication_page: {\n            conf_scheduled: "नियोजित",\n            conf_completed: "पूर्ण झाले",\n            conf_cancelled: "रद्द केले",\n            conf_invited: "निमंत्रित केले",\n'
);

// EN communication_page
c = c.replace(
    /export const translations = \{\n    en: \{\n[\s\S]*?        communication_page: \{\s*\n/,
    match => match.replace('communication_page: {', 'communication_page: {\n            conf_scheduled: "Scheduled",\n            conf_completed: "Completed",\n            conf_cancelled: "Cancelled",\n            conf_invited: "Invited",')
);

fs.writeFileSync('src/utils/translations.ts', c);
console.log('All missing PDF translation keys added successfully.');
