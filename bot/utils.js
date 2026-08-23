/**
 * Normalizes a mobile number into a valid WhatsApp JID.
 * Strips non-digits, ensures it starts with 91 if it is a 10-digit Indian number,
 * and appends @s.whatsapp.net if missing.
 *
 * @param {string} mobile 
 * @returns {string|null} The formatted JID or null if invalid.
 */
function formatJid(mobile) {
    if (!mobile) return null;
    
    // If it's already a JID, return it
    if (mobile.includes('@s.whatsapp.net')) return mobile;
    // For LID
    if (mobile.includes('@lid')) return mobile;
    // Groups
    if (mobile.includes('@g.us')) return mobile;
    
    let cleanMobile = mobile.toString().replace(/\D/g, '');
    
    // If exact 10 digits, assume India and prepend 91
    if (cleanMobile.length === 10) {
        cleanMobile = '91' + cleanMobile;
    }
    
    // Basic validation (at least 11 digits for country code + number)
    if (cleanMobile.length < 11) {
        return null; // Invalid number
    }
    
    return cleanMobile + '@s.whatsapp.net';
}

/**
 * Extracts a clean 10-digit mobile number from a JID or string.
 */
function extractMobile(jid) {
    if (!jid) return null;
    return jid.toString().replace('@s.whatsapp.net', '').replace('@lid', '').replace(/^91/, '').slice(-10);
}

module.exports = {
    formatJid,
    extractMobile
};
