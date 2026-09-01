const fs = require('fs');
const path = require('path');

const targetComponentPath = path.join(process.cwd(), 'src/components/common/');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    let i = 0;
    let modifiedDate = false;
    let modifiedTime = false;

    while (i < content.length) {
        let idx = content.indexOf('<input', i);
        if (idx === -1) break;
        
        let nextChar = content[idx + 6];
        if (!/\s/.test(nextChar) && nextChar !== '>') {
            i = idx + 6;
            continue;
        }
        
        let j = idx + 6;
        let braceDepth = 0;
        let inQuotes = false;
        let quoteChar = '';
        let foundEnd = false;
        
        while (j < content.length) {
            let c = content[j];
            if (!inQuotes && (c === '"' || c === "'")) {
                inQuotes = true;
                quoteChar = c;
            } else if (inQuotes && c === quoteChar) {
                inQuotes = false;
            } else if (!inQuotes && c === '{') {
                braceDepth++;
            } else if (!inQuotes && c === '}') {
                braceDepth--;
            } else if (!inQuotes && braceDepth === 0 && c === '/' && content[j+1] === '>') {
                foundEnd = true;
                break;
            } else if (!inQuotes && braceDepth === 0 && c === '>' && content[j-1] !== '/') {
                foundEnd = true;
                break;
            }
            j++;
        }
        
        if (foundEnd) {
            let isSelfClosing = content[j] === '/' && content[j+1] === '>';
            let endLen = isSelfClosing ? 2 : 1;
            let fullTag = content.substring(idx, j + endLen);
            
            if (fullTag.includes('type="date"') || fullTag.includes("type='date'") || fullTag.includes('type="datetime-local"')) {
                let inner = fullTag.substring(6).trim();
                if (inner.endsWith('/>')) inner = inner.slice(0, -2).trim();
                else if (inner.endsWith('>')) inner = inner.slice(0, -1).trim();
                
                content = content.slice(0, idx) + `<CustomDatePicker ${inner} />` + content.slice(j + endLen);
                modifiedDate = true;
                i = idx + 10;
                continue;
            } else if (fullTag.includes('type="time"') || fullTag.includes("type='time'")) {
                let inner = fullTag.substring(6).trim();
                if (inner.endsWith('/>')) inner = inner.slice(0, -2).trim();
                else if (inner.endsWith('>')) inner = inner.slice(0, -1).trim();
                
                content = content.slice(0, idx) + `<CustomTimePicker ${inner} />` + content.slice(j + endLen);
                modifiedTime = true;
                i = idx + 10;
                continue;
            }
        }
        i = idx + 6;
    }

    if (modifiedDate && !content.includes('import { CustomDatePicker }')) {
        let relativePath = path.relative(path.dirname(filePath), path.join(targetComponentPath, 'CustomDatePicker')).replace(/\\/g, '/');
        if (!relativePath.startsWith('.')) relativePath = './' + relativePath;
        content = `import { CustomDatePicker } from '${relativePath}';\n` + content;
    }

    if (modifiedTime && !content.includes('import { CustomTimePicker }')) {
        let relativePath = path.relative(path.dirname(filePath), path.join(targetComponentPath, 'CustomTimePicker')).replace(/\\/g, '/');
        if (!relativePath.startsWith('.')) relativePath = './' + relativePath;
        content = `import { CustomTimePicker } from '${relativePath}';\n` + content;
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Replaced in', filePath);
    }
}

function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            if (!file.includes('CustomDatePicker') && !file.includes('CustomTimePicker')) {
                walk(file);
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
            if (!file.endsWith('CustomDatePicker.tsx') && !file.endsWith('CustomTimePicker.tsx')) {
                processFile(file);
            }
        }
    });
}

walk('./src');
