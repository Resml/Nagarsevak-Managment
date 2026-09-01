const fs = require('fs');
const path = require('path');

const targetComponentPath = path.join(process.cwd(), 'src/components/common/CustomSelect');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Check if file uses <select>
    if (!/<select[\s>]/g.test(content)) {
        return;
    }

    // Replace <select and </select>
    content = content.replace(/<select([\s>])/g, '<CustomSelect$1');
    content = content.replace(/<\/select>/g, '</CustomSelect>');

    // Add import statement if it doesn't exist
    if (!content.includes('CustomSelect')) {
        // Technically it now includes CustomSelect from the replace above, 
        // so we check if the import statement is there
    }
    
    if (!content.includes('import { CustomSelect }')) {
        let relativePath = path.relative(path.dirname(filePath), targetComponentPath).replace(/\\/g, '/');
        if (!relativePath.startsWith('.')) {
            relativePath = './' + relativePath;
        }
        
        const importStatement = `import { CustomSelect } from '${relativePath}';\n`;
        
        // Find the last import statement to append to, or just put it at top
        const importMatch = content.match(/^import .*?from .*?;?$/m);
        if (importMatch) {
            // Find the index of the last import
            const lastImportIndex = content.lastIndexOf('import ');
            const endOfLastImport = content.indexOf('\n', lastImportIndex);
            if (endOfLastImport !== -1) {
                content = content.slice(0, endOfLastImport + 1) + importStatement + content.slice(endOfLastImport + 1);
            } else {
                content = importStatement + content;
            }
        } else {
            content = importStatement + content;
        }
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
            // Don't modify the CustomSelect file itself
            if (!file.includes('CustomSelect')) {
                walk(file);
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
            if (!file.endsWith('CustomSelect.tsx')) {
                processFile(file);
            }
        }
    });
}

walk('./src');
