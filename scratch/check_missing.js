import fs from 'fs';
import path from 'path';

const translationsContent = fs.readFileSync('src/utils/translations.ts', 'utf-8');

// A super hacky way to evaluate the translations object in a node script
// We extract everything after `export const translations = `
const match = translationsContent.match(/export\s+const\s+translations\s*=\s*(\{[\s\S]*\});/);

if (!match) {
    console.error("Could not parse translations");
    process.exit(1);
}

let translationsObj;
try {
    // using eval to parse the object string
    translationsObj = eval('(' + match[1] + ')');
} catch (e) {
    console.error("Error evaluating", e);
    process.exit(1);
}

const en = translationsObj['en'];
const mr = translationsObj['mr'];

const keysToCheck = [
"budget.col_actions",
"budget.col_allocated",
"budget.col_category",
"budget.col_progress",
"budget.col_utilized",
"common.actions",
"common.date",
"common.report_columns.address",
"common.report_columns.address_office",
"common.report_columns.amount",
"common.report_columns.area",
"common.report_columns.assigned_to",
"common.report_columns.beneficiaries",
"common.report_columns.benefits",
"common.report_columns.category",
"common.report_columns.citizen_info",
"common.report_columns.contact",
"common.report_columns.date",
"common.report_columns.date_time",
"common.report_columns.department",
"common.report_columns.description",
"common.report_columns.due_date",
"common.report_columns.eligibility",
"common.report_columns.joined",
"common.report_columns.keywords_categories",
"common.report_columns.location_area",
"common.report_columns.meeting_type",
"common.report_columns.mobile",
"common.report_columns.name",
"common.report_columns.name_role",
"common.report_columns.outcome",
"common.report_columns.priority",
"common.report_columns.scheme_name",
"common.report_columns.sr_no",
"common.report_columns.staff",
"common.report_columns.status",
"common.report_columns.subject",
"common.report_columns.thumbnail",
"common.report_columns.ticket_id",
"common.report_columns.title",
"common.report_columns.title_desc",
"common.report_columns.title_type",
"common.report_columns.type",
"common.status",
"communication_page.conf_invited",
"communication_page.conf_meeting_title",
"communication_page.conf_schedule_date",
"complaints.table.date",
"complaints.table.status",
"events.audience_label",
"government_office.address",
"government_office.contact",
"government_office.office_name",
"government_office.officer_name",
"improvements.form_title",
"letters.actions",
"letters.area",
"letters.description",
"letters.has_template",
"letters.name",
"letters.name_english",
"letters.name_marathi",
"letters.subject",
"letters.title",
"letters.type",
"office.area",
"office.full_name",
"office.mobile",
"office.purpose",
"office.reference",
"sadasya.area_address",
"sadasya.contact",
"sadasya.joined_date",
"sadasya.member",
"schemes.beneficiary_list.actions_col",
"schemes.beneficiary_list.applicant_col",
"schemes.beneficiary_list.benefit_col",
"schemes.beneficiary_list.info_col",
"schemes.beneficiary_list.rejection_reason",
"schemes.beneficiary_list.scheme_col",
"schemes.beneficiary_list.status_col",
"surveys.table.actions",
"surveys.table.created_at",
"surveys.table.questions",
"surveys.table.status",
"surveys.table.title",
"voter_forms.applicant_name",
"voter_forms.date",
"voter_forms.form_type",
"voter_forms.notes",
"voter_forms.status",
"ward_provision.col_amount",
"ward_provision.col_area",
"ward_provision.col_date",
"ward_provision.col_status",
"ward_provision.col_title",
"work_history.col_beneficiary",
"work_history.col_date",
"work_history.col_title",
"work_history.col_type",
"work_history.col_ward",
"work_history.project_title"
];

function checkExists(obj, keyPath) {
    const parts = keyPath.split('.');
    let current = obj;
    for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
            current = current[part];
        } else {
            return false;
        }
    }
    return typeof current === 'string';
}

const missingEn = [];
const missingMr = [];

for (const k of keysToCheck) {
    if (!checkExists(en, k)) missingEn.push(k);
    if (!checkExists(mr, k)) missingMr.push(k);
}

console.log("Missing in EN:");
console.log(missingEn.join('\n'));
console.log("\nMissing in MR:");
console.log(missingMr.join('\n'));
