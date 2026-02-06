
const fs = require('fs');
const path = require('path');

const translationsPath = path.join(__dirname, '../src/utils/translations.ts');

try {
    let content = fs.readFileSync(translationsPath, 'utf8');

    // Remove the type definition
    content = content.replace(/export type Language = .*/g, '');

    // specific fix for any TS syntax if present, but the file looks mostly JS compatible
    // We need to isolate the `translations` object.

    // Find the start of the object
    const startMarker = 'export const translations = {';
    const startIndex = content.indexOf(startMarker);

    if (startIndex === -1) {
        console.error('Could not find translations object');
        process.exit(1);
    }

    // We will construct a valid JS extraction
    // Replace export const with const
    content = content.replace('export const translations =', 'const translations =');

    // Eval the content to get the object
    // output translations.en

    const ctx = { exports: {} };
    // We can't easily eval because it might rely on other things, but here it seems self-contained.
    // Let's try to run it in a VM or just eval.

    eval(content);

    const englishTranslations = translations.en;

    function getAllValues(obj, prefix = '') {
        let values = [];
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                values = values.concat(getAllValues(obj[key], prefix + key + '.'));
            } else if (typeof obj[key] === 'string') {
                values.push({ key: prefix + key, value: obj[key] });
            }
        }
        return values;
    }

    const allStrings = getAllValues(englishTranslations);

    // Format for user
    const output = allStrings.map(item => item.value).join('\n');
    const outputWithKeys = allStrings.map(item => `${item.key}: ${item.value}`).join('\n');

    console.log('Found ' + allStrings.length + ' strings.');

    fs.writeFileSync(path.join(__dirname, '../extracted_english_words.txt'), output);
    fs.writeFileSync(path.join(__dirname, '../extracted_english_words_with_keys.txt'), outputWithKeys);

    console.log('Successfully wrote to extracted_english_words.txt and extracted_english_words_with_keys.txt');

} catch (err) {
    console.error('Error extracting strings:', err);
}
