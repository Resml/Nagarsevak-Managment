const fs = require('fs');
let c = fs.readFileSync('src/utils/translations.ts', 'utf8');

// For EN
c = c.replace(
    /schemes:\s*\{\s*title:\s*"Government Schemes",/,
    'schemes: {\n            applicant_name: "Applicant Name",\n            mobile_address: "Mobile / Address",\n            benefit_reason: "Benefit / Reason",\n            application_report: "Application Report",\n            total_applications: "Total Applications",\n            title: "Government Schemes",'
);

// For MR
c = c.replace(
    /schemes:\s*\{\s*title:\s*"सरकारी योजना",/,
    'schemes: {\n            applicant_name: "अर्जदाराचे नाव",\n            mobile_address: "मोबाईल / पत्ता",\n            benefit_reason: "लाभ / कारण",\n            application_report: "अर्ज अहवाल",\n            total_applications: "एकूण अर्ज",\n            title: "सरकारी योजना",'
);

fs.writeFileSync('src/utils/translations.ts', c);
console.log("Replaced with flexible regex");
