const fs = require('fs');

const schema = fs.readFileSync('production_schema.sql', 'utf8');

// Extraction logic
const tables = [];
const rlsStatus = {};
const policies = [];
const indexes = [];
const triggers = [];
const functions = [];

// 1. Tables
// The schema uses CREATE TABLE public.table_name (
const tableRegex = /CREATE\s+TABLE\s+(?:public\.|"public"\.)?"?([a-zA-Z0-9_]+)"?\s*\(([\s\S]*?)\);/g;
let match;
while ((match = tableRegex.exec(schema)) !== null) {
  const tableName = match[1];
  const columnsDef = match[2];
  tables.push({
    name: tableName,
    has_tenant_id: columnsDef.includes('tenant_id'),
  });
}

// 2. RLS Status
const rlsRegex = /ALTER\s+TABLE\s+(?:ONLY\s+)?(?:public\.|"public"\.)?"?([a-zA-Z0-9_]+)"?\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/gi;
while ((match = rlsRegex.exec(schema)) !== null) {
  rlsStatus[match[1]] = true;
}

// 3. Policies
const policyRegex = /CREATE\s+POLICY\s+"?([^"]+)"?\s+ON\s+(?:public\.|"public"\.)?"?([a-zA-Z0-9_]+)"?([\s\S]*?);/gi;
while ((match = policyRegex.exec(schema)) !== null) {
  policies.push({
    policy_name: match[1],
    table: match[2],
    definition: match[3]
  });
}

// 4. Indexes
const indexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+"?([^"]+)"?\s+ON\s+(?:public\.|"public"\.)?"?([a-zA-Z0-9_]+)"?(?:[\s\S]*?)\(([^)]+)\);/gi;
while ((match = indexRegex.exec(schema)) !== null) {
  indexes.push({
    index_name: match[1],
    table: match[2],
    columns: match[3]
  });
}

// 5. Triggers
const triggerRegex = /CREATE\s+TRIGGER\s+"?([^"]+)"?\s+(?:BEFORE|AFTER|INSTEAD OF)[\s\S]*?ON\s+(?:public\.|"public"\.)?"?([a-zA-Z0-9_]+)"?[\s\S]*?EXECUTE\s+(?:FUNCTION|PROCEDURE)\s+([^;]+);/gi;
while ((match = triggerRegex.exec(schema)) !== null) {
  triggers.push({
    name: match[1],
    table: match[2],
    action: match[3].trim()
  });
}

// 6. Functions (Security Definer)
const funcRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.|"public"\.)?"?([a-zA-Z0-9_]+)"?\s*\(([\s\S]*?)\)\s+RETURNS\s+([\s\S]*?)\s+LANGUAGE\s+([^\s]+)\s+([\s\S]*?AS\s+\$\$[\s\S]*?\$\$;)/gi;
while ((match = funcRegex.exec(schema)) !== null) {
  const funcName = match[1];
  const body = match[5];
  if (body.toUpperCase().includes('SECURITY DEFINER')) {
    functions.push({
      name: funcName,
      body: body
    });
  }
}

// Also check using search_path in case some use alternative quoting
const funcRegexAlt = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.|"public"\.)?"?([a-zA-Z0-9_]+)"?\s*\([\s\S]*?\)([\s\S]*?AS\s+\$_?\$[\s\S]*?\$_?\$)/gi;
// Wait, the functions are already extracted by splitting the file perhaps.
// I will just use string search to find all SECURITY DEFINER functions.
const lines = schema.split('\n');
let currentFunc = '';
let inFunc = false;
let funcName2 = '';
const secDefFunctions = [];

for (let i=0; i<lines.length; i++) {
  const line = lines[i];
  if (line.match(/^CREATE OR REPLACE FUNCTION/)) {
    inFunc = true;
    currentFunc = line + '\n';
    const m = line.match(/FUNCTION (?:public\.|"public"\.)?"?([a-zA-Z0-9_]+)"?/);
    funcName2 = m ? m[1] : 'unknown';
  } else if (inFunc) {
    currentFunc += line + '\n';
    if (line.match(/^\$\$;/) || line.match(/^\$_\$;/)) {
      inFunc = false;
      if (currentFunc.includes('SECURITY DEFINER')) {
        secDefFunctions.push({
          name: funcName2,
          body: currentFunc
        });
      }
    }
  }
}


const report = {
  tables,
  rlsStatus,
  policies,
  indexes,
  triggers,
  functions: secDefFunctions
};

fs.writeFileSync('C:\\Users\\SAHIL\\.gemini\\antigravity-ide\\brain\\0a07aff7-4808-4938-95d6-7a8e4b4645ad\\scratch\\phase24_db_audit.json', JSON.stringify(report, null, 2));
console.log('Parsed schema and wrote to phase24_db_audit.json');
