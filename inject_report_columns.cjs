const fs = require('fs');
let c = fs.readFileSync('src/utils/translations.ts', 'utf8');

// EN common block starts here:
c = c.replace(
    /export const translations = \{\n    en: \{\n        common: \{/,
    'export const translations = {\n    en: {\n        common: {\n            report_columns: {\n                sr_no: "Sr No",\n                date_time: "Date & Time",\n                date: "Date",\n                citizen_info: "Citizen Info",\n                title_type: "Title / Type",\n                location_area: "Location / Area",\n                staff: "Staff",\n                status: "Status",\n                mobile: "Mobile",\n                area: "Area",\n                scheme_name: "Scheme Name",\n                description: "Description",\n                category: "Category",\n                benefits: "Benefits",\n                thumbnail: "Thumbnail",\n                title_desc: "Title / Description",\n                type: "Type"\n            },'
);

// MR common block starts here:
c = c.replace(
    /        common: \{\s*\n\s*welcome: "स्वागत आहे",/,
    '        common: {\n            report_columns: {\n                sr_no: "अ. क्र.",\n                date_time: "दिनांक आणि वेळ",\n                date: "दिनांक",\n                citizen_info: "नागरिकांची माहिती",\n                title_type: "शीर्षक / प्रकार",\n                location_area: "ठिकाण / भाग",\n                staff: "कर्मचारी",\n                status: "स्थिती",\n                mobile: "मोबाईल",\n                area: "भाग",\n                scheme_name: "योजनेचे नाव",\n                description: "वर्णन",\n                category: "श्रेणी",\n                benefits: "फायदे",\n                thumbnail: "थंबनेल",\n                title_desc: "शीर्षक / वर्णन",\n                type: "प्रकार"\n            },\n            welcome: "स्वागत आहे",'
);

fs.writeFileSync('src/utils/translations.ts', c);
console.log('report_columns added to both EN and MR.');
