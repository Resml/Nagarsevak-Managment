
function getWhatsappId(userId) {
    return userId.includes('@') ? userId : `${userId}@s.whatsapp.net`;
}

const testCases = [
    '919876543210',
    '105029583282256@lid',
    'user@s.whatsapp.net',
    '1234567890'
];

console.log('--- JID CONSTRUCTION TESTS ---');
testCases.forEach(tc => {
    console.log(`Input: ${tc.padEnd(25)} -> Output: ${getWhatsappId(tc)}`);
});
