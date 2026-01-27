
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const resultDir = 'result';
const outputFile = 'src/data/election_data.json';
const outputDir = 'src/data';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Map filenames to Ward Names
const fileMapping = {
    'प्रभाग_क्र_5_अ_पूर्ण_डेटा final.xls': 'Prabhag 5 A',
    'प्रभाग_क्र_5_ब_पूर्ण_डेटा final.xls': 'Prabhag 5 B',
    'प्रभाग_क्र_5_क_पूर्ण_डेटा final.xls': 'Prabhag 5 C',
    'प्रभाग_क्र_5_ड_पूर्ण_डेटा final.xls': 'Prabhag 5 D'
};

const allResults = [];
let globalIdCounter = 1;

fs.readdirSync(resultDir).forEach(file => {
    if (!file.endsWith('.xls') && !file.endsWith('.xlsx')) return;

    const wardName = fileMapping[file];
    if (!wardName) {
        console.warn('Skipping Unknown File:', file);
        return;
    }

    console.log(`Processing ${file} as ${wardName}...`);
    const buf = fs.readFileSync(path.join(resultDir, file));
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    // Row 0 is Headers
    const headers = rows[0];
    // console.log('Headers:', headers);

    // Identify Columns
    // Col 1: Booth No ('मतदान केंद्र क्र.')
    // Last Col: Total Votes ('एकूण मते')
    // Candidates: Col 2 to Length-3 (Assuming last 2 are Valid and Total, allow NOTA)

    // Based on inspection:
    // [ 'अ.क्र.', 'मतदान केंद्र क्र.', 'P1', 'P2', 'P3', 'P4', 'NOTA', 'Valid', 'Total' ]
    const candidateStartIndex = 2; // Column 2
    const totalVotesIndex = headers.length - 1; // Last column

    // Extract Candidate Names
    const candidateNames = headers.slice(candidateStartIndex, totalVotesIndex - 1); // Exclude Valid and Total
    // Check if 'Valid Votes' is truly just before Total?
    // Headers: [..., 'नोटा', 'वैध मते', 'एकूण मते']
    // So Candidates end before 'वैध मते' (Valid Votes).
    // Let's find index of 'वैध मते' or 'Total'

    let validVotesIndex = -1;
    headers.forEach((h, i) => {
        if (h && h.toString().includes('वैध मते')) validVotesIndex = i;
    });

    const candidates = headers.slice(candidateStartIndex, validVotesIndex);
    console.log('Candidates found:', candidates);

    // Iterate Data Rows
    // Skip Row 0 (Headers)
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[1]) continue; // Skip empty rows

        const boothNo = row[1];
        const totalVotes = row[totalVotesIndex];

        const voteMap = {};
        let winnerName = '';
        let maxVotes = -1;
        let secondMaxVotes = -1;

        candidates.forEach((cand, idx) => {
            const votes = Number(row[candidateStartIndex + idx]) || 0;
            voteMap[cand] = votes;

            if (cand !== 'नोटा') { // Don't count NOTA as winner usually
                if (votes > maxVotes) {
                    secondMaxVotes = maxVotes;
                    maxVotes = votes;
                    winnerName = cand;
                } else if (votes > secondMaxVotes) {
                    secondMaxVotes = votes;
                }
            }
        });

        const margin = maxVotes - secondMaxVotes;

        allResults.push({
            id: `res_${globalIdCounter++}`,
            wardName: wardName,
            boothNumber: boothNo.toString(),
            boothName: `Booth ${boothNo}`, // Default name as none in Excel
            totalVoters: 0, // Not in excel? 'Total Votes' is casted. Total Voters (Registered) might be missing?
            totalVotesCasted: Number(totalVotes) || 0,
            candidateVotes: voteMap,
            winner: winnerName,
            margin: margin,
            createdAt: new Date().toISOString()
        });
    }
});

fs.writeFileSync(outputFile, JSON.stringify(allResults, null, 2));
console.log(`Saved ${allResults.length} records to ${outputFile}`);
