const fs = require('fs');
const schema = fs.readFileSync('production_schema.sql', 'utf8');

const definerFunctions = [
  'get_authorized_tenants',
  'get_survey_tenant',
  'rls_auto_enable',
  'get_event_tenant',
  'derive_survey_response_tenant',
  'has_feature_access',
  'has_member_feature_access',
  'validate_staff_permissions_entitlement',
  'prevent_staff_permission_escalation',
  'log_security_event'
];

let output = '';
for (const fn of definerFunctions) {
  // Regex to match the function definition
  const regex = new RegExp(`CREATE OR REPLACE FUNCTION (?:public\\.)?"?${fn}"?\\s*\\([\\s\\S]*?\\)[\\s\\S]*?(?:\\$\\$|\\$_\\$)[\\s\\S]*?(?:\\$\\$|\\$_\\$);`, 'gi');
  const match = regex.exec(schema);
  if (match) {
    output += `\n--- FUNCTION ${fn} ---\n`;
    output += match[0] + '\n';
  }
}

fs.writeFileSync('C:\\Users\\SAHIL\\.gemini\\antigravity-ide\\brain\\0a07aff7-4808-4938-95d6-7a8e4b4645ad\\scratch\\definer_funcs.txt', output);
console.log('Wrote to definer_funcs.txt');
