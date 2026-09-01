const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace <select without className
    content = content.replace(/<select(?![^>]*className=)([^>]*)>/g, '<select className="ns-input"$1>');
    
    // Replace <select with className
    content = content.replace(/<select([^>]*?)className=(['"])(.*?)\2([^>]*)>/g, (match, p1, quote, classes, p4) => {
        if (!classes.includes('ns-input')) {
            return `<select${p1}className=${quote}ns-input ${classes}${quote}${p4}>`;
        }
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
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
