// Notification functions for letter status updates
async function sendLetterStatusNotification(sock, userId, status, letterType, lang, tenantId) {
    try {
        const whatsappId = userId.includes('@') ? userId : `${userId}@s.whatsapp.net`;

        let message;
        if (status === 'Approved') {
            message = lang === 'en'
                ? `✅ *Letter Request Approved!*\n\nYour ${letterType} request has been approved.\n\n📄 You can collect your letter from the office during working hours.\n\n⏰ Office Hours: 10:00 AM - 5:00 PM`
                : lang === 'mr'
                    ? `✅ *पत्र विनंती मंजूर झाली!*\n\nतुमची ${letterType} विनंती मंजूर झाली आहे.\n\n📄 तुम्ही कार्यालयीन वेळेत तुमचे पत्र घेऊ शकता.\n\n⏰ कार्यालय वेळ: सकाळी 10:00 - संध्याकाळी 5:00`
                    : `✅ *पत्र अनुरोध स्वीकृत!*\n\nआपका ${letterType} अनुरोध स्वीकृत हो गया है.\n\n📄 आप कार्यालय समय में अपना पत्र ले सकते हैं.\n\n⏰ कार्यालय समय: सुबह 10:00 - शाम 5:00`;
        } else if (status === 'Rejected') {
            message = lang === 'en'
                ? `❌ *Letter Request Rejected*\n\nYour ${letterType} request could not be approved.\n\nPlease contact the office for more information.`
                : lang === 'mr'
                    ? `❌ *पत्र विनंती नाकारली*\n\nतुमची ${letterType} विनंती मंजूर करता आली नाही.\n\nअधिक माहितीसाठी कृपया कार्यालयाशी संपर्क साधा.`
                    : `❌ *पत्र अनुरोध अस्वीकृत*\n\nआपका ${letterType} अनुरोध स्वीकृत नहीं किया जा सका.\n\nअधिक जानकारी के लिए कृपया कार्यालय से संपर्क करें.`;
        }

        console.log(`[${tenantId}] Sending letter status notification to ${userId}: ${status}`);
        await sock.sendMessage(whatsappId, { text: message });
        return true;
    } catch (error) {
        console.error(`Error sending letter status notification:`, error);
        return false;
    }
}

module.exports = { sendLetterStatusNotification };
