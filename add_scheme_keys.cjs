const fs = require('fs');
let c = fs.readFileSync('src/utils/translations.ts', 'utf8');

// We need to add keys to `schemes: {` in EN and MR.
// EN block starts with:
// schemes: {
//             title: "Government Schemes",

c = c.replace(
    /        schemes: \{\n            title: "Government Schemes",/,
    '        schemes: {\n            applicant_name: "Applicant Name",\n            mobile_address: "Mobile / Address",\n            benefit_reason: "Benefit / Reason",\n            application_report: "Application Report",\n            total_applications: "Total Applications",\n            title: "Government Schemes",'
);

// MR block starts with:
// schemes: {
//             title: "सरकारी योजना",
// BUT remember there are two! One for MR and one for HI (which starts with title: "सरकारी योजनाएं").
// Let's match MR exactly.

c = c.replace(
    /        schemes: \{\n            title: "सरकारी योजना",/,
    '        schemes: {\n            applicant_name: "अर्जदाराचे नाव",\n            mobile_address: "मोबाईल / पत्ता",\n            benefit_reason: "लाभ / कारण",\n            application_report: "अर्ज अहवाल",\n            total_applications: "एकूण अर्ज",\n            title: "सरकारी योजना",'
);

fs.writeFileSync('src/utils/translations.ts', c);
console.log("Added schemes keys");
