const fs = require('fs');
const schema = fs.readFileSync('production_schema.sql', 'utf8');

// Split the file by statements using ; followed by newline, but this is brittle.
// A better way is to find all "CREATE OR REPLACE FUNCTION" and get the body.
let funcs = [];
let idx = schema.indexOf('CREATE OR REPLACE FUNCTION');
while (idx !== -1) {
  let nextIdx = schema.indexOf('CREATE OR REPLACE FUNCTION', idx + 1);
  if (nextIdx === -1) nextIdx = schema.length;
  
  let funcBody = schema.substring(idx, nextIdx);
  if (funcBody.includes('SECURITY DEFINER')) {
    funcs.push(funcBody.trim());
  }
  idx = schema.indexOf('CREATE OR REPLACE FUNCTION', nextIdx);
}

fs.writeFileSync('C:\\Users\\SAHIL\\.gemini\\antigravity-ide\\brain\\0a07aff7-4808-4938-95d6-7a8e4b4645ad\\scratch\\sec_def_funcs.txt', funcs.join('\n\n====================\n\n'));
console.log('Done writing sec_def_funcs.txt');
