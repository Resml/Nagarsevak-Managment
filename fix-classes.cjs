const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Fix double className: <select className="ns-input" ... className="..." ... >
    content = content.replace(/<select\s+className="ns-input"([\s\S]*?)className=(['"])(.*?)\2([\s\S]*?)>/gi, (match, p1, quote, classes, p4) => {
        let combined = classes;
        if (!combined.includes('ns-input')) combined = 'ns-input ' + combined;
        return `<select ${p1.trim()} className=${quote}${combined}${quote}${p4}>`;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed double className in', filePath);
    }
}

function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            walk(file);
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
            processFile(file);
        }
    });
}

walk('./src');
