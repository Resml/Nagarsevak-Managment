
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = 'result/प्रभाग_क्र_5_अ_पूर्ण_डेटा final.xls';

try {
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON to see structure
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    console.log('Headers (Row 0):', data[0]);
    console.log('Row 1:', data[1]);
    console.log('Row 2:', data[2]);
    console.log('Row 3:', data[3]);
    console.log('Total Rows:', data.length);
} catch (error) {
    console.error('Error reading file:', error);
}
