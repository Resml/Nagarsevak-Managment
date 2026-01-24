const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'final excels', '27 ward final_cleaned.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Get headers (first row)
const headers = [];
const range = XLSX.utils.decode_range(sheet['!ref']);
for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!sheet[address]) continue;
    headers.push(sheet[address].v);
}

console.log('Headers:', JSON.stringify(headers, null, 2));

// Get first row of data to see formatting
const data = XLSX.utils.sheet_to_json(sheet, { limit: 1 });
console.log('Sample Data:', JSON.stringify(data[0], null, 2));
