// ===== PASTE THIS INTO menuNavigator.js =====
// Replace the handleSchemesMenu function (around line 567) with this implementation
// Also add the 3 new handler functions below

async handleSchemesMenu(sock, tenantId, userId, input) {
    const session = this.getSession(userId);
    const lang = session.language;

    switch (input) {
        case '1': // View All Schemes
            session.schemeOffset = 0; // Reset offset
            const schemes = await this.store.getSchemes(tenantId, { limit: 10, offset: 0 });
            if (!schemes || schemes.length === 0) {
                const noSchemes = lang === 'en' ? 'No schemes available at the moment.' :
                    lang === 'mr' ? 'सध्या कोणत्याही योजना उपलब्ध नाहीत.' : 'फिलहाल कोई योजनाएं उपलब्ध नहीं हैं।';
                await sock.sendMessage(userId, { text: noSchemes });
            } else {
                await this.displaySchemes(sock, userId, schemes, lang, 0);

                // Check if there are more schemes
                const moreSchemes = await this.store.getSchemes(tenantId, { limit: 1, offset: 10 });
                if (moreSchemes && moreSchemes.length > 0) {
                    const moreMsg = lang === 'en' ? '\n📄 Send *MORE* to see more schemes or press 9 for menu' :
                        lang === 'mr' ? '\n📄 अधिक योजना पाहण्यासाठी *MORE* पाठवा किंवा मेनूसाठी 9 दाबा' :
                            '\n📄 अधिक योजनाएं देखने के लिए *MORE* भेजें या मेनू के लिए 9 दबाएं';
                    await sock.sendMessage(userId, { text: moreMsg });
                    session.currentMenu = MENU_STATES.SCHEME_VIEW_MORE;
                    session.schemeOffset = 10;
                    return; // Don't show menu again yet
                }
            }
            await this.showSchemesMenu(sock, userId, lang);
            break;

        case '2': // Search Scheme
            session.currentMenu = MENU_STATES.SCHEME_SEARCH_PROMPT;
            const searchMsg = lang === 'en' ? '🔍 Enter scheme name or keyword to search:' :
                lang === 'mr' ? '🔍 शोध करण्यासाठी योजनेचे नाव किंवा मुख्य शब्द प्रविष्ट करा:' :
                    '🔍 खोजने के लिए योजना का नाम या कीवर्ड दर्ज करें:';
            await sock.sendMessage(userId, { text: searchMsg });
            break;

        case '3': // Schemes For Me (Basic - show all for now)
            const personalizedMsg = lang === 'en' ?
                `👤 *Personalized Recommendations*

Showing all available schemes. Please check eligibility for each scheme:
` :
                lang === 'mr' ?
                    `👤 *वैयक्तिक शिफारसी*

सर्व उपलब्ध योजना दर्शविल्या जात आहेत. कृपया प्रत्येक योजनेसाठी पात्रता तपासा:
` :
                    `👤 *व्यक्तिगत सिफारिशें*

सभी उपलब्ध योजनाएं दिखाई जा रही हैं। कृपया प्रत्येक योजना के लिए पात्रता जांचें:
`;
            await sock.sendMessage(userId, { text: personalizedMsg });

            const allSchemes = await this.store.getSchemes(tenantId, { limit: 10, offset: 0 });
            if (allSchemes && allSchemes.length > 0) {
                await this.displaySchemes(sock, userId, allSchemes, lang, 0);
            }
            await this.showSchemesMenu(sock, userId, lang);
            break;

        case '4': // How to Apply
            const applyGuide = lang === 'en' ?
                `📝 *How to Apply for Schemes*

1️⃣ *Check Eligibility*
   Read scheme details carefully and verify you meet all criteria

2️⃣ *Prepare Documents*
   Gather required documents (usually Aadhar, Income Certificate, etc.)

3️⃣ *Visit Office or Apply Online*
   • Visit our office during working hours
   • Or check if online application is available
   • Call for more details: See Contact section

4️⃣ *Submit Application*
   Fill form completely with correct details

5️⃣ *Follow Up*
   Track your application status
   Contact office if needed

💡 *Tip*: Keep photocopies of all documents` :
                lang === 'mr' ?
                    `📝 *योजनांसाठी अर्ज कसा करावा*

1️⃣ *पात्रता तपासा*
   योजनेचे तपशील काळजीपूर्वक वाचा आणि तुम्ही सर्व निकषांची पूर्तता करता याची पडताळणी करा

2️⃣ *कागदपत्रे तयार करा*
   आवश्यक कागदपत्रे गोळा करा (सामान्यतः आधार, उत्पन्न प्रमाणपत्र इ.)

3️⃣ *कार्यालयात भेट द्या किंवा ऑनलाइन अर्ज करा*
   • कामकाजाच्या वेळेत आमच्या कार्यालयाला भेट द्या
   • किंवा ऑनलाइन अर्ज उपलब्ध आहे का ते तपासा
   • अधिक माहितीसाठी कॉल करा: संपर्क विभाग पहा

4️⃣ *अर्ज सादर करा*
   योग्य तपशीलांसह फॉर्म पूर्णपणे भरा

5️⃣ *पाठपुरावा करा*
   तुमच्या अर्जाची स्थिती ट्रॅक करा
   आवश्यक असल्यास कार्यालयाशी संपर्क साधा

💡 *टीप*: सर्व कागदपत्रांच्या फोटोकॉपी ठेवा` :
                    `📝 *योजनाओं के लिए आवेदन कैसे करें*

1️⃣ *पात्रता जांचें*
   योजना विवरण ध्यान से पढ़ें और सत्यापित करें कि आप सभी मानदंडों को पूरा करते हैं

2️⃣ *दस्तावेज़ तैयार करें*
   आवश्यक दस्तावेज़ इकट्ठा करें (आमतौर पर आधार, आय प्रमाण पत्र आदि)

3️⃣ *कार्यालय जाएँ या ऑनलाइन आवेदन करें*
   • कार्य घंटों के दौरान हमारे कार्यालय जाएँ
   • या जांचें कि ऑनलाइन आवेदन उपलब्ध है या नहीं
   • अधिक जानकारी के लिए कॉल करें: संपर्क अनुभाग देखें

4️⃣ *आवेदन जमा करें*
   सही विवरण के साथ फॉर्म पूरी तरह भरें

5️⃣ *फॉलो अप करें*
   अपने आवेदन की स्थिति ट्रैक करें
   आवश्यकता पड़ने पर कार्यालय से संपर्क करें

💡 *सुझाव*: सभी दस्तावेज़ों की फोटोकॉपी रखें`;

            await sock.sendMessage(userId, { text: applyGuide });
            await this.showSchemesMenu(sock, userId, lang);
            break;

        default:
            const errorMsg = MESSAGES.invalid_option[lang] + '\n\n' + MENUS.schemes[lang].text;
            await sock.sendMessage(userId, { text: errorMsg });
            return;
    }
}

// ADD THESE 3 NEW FUNCTIONS AFTER handleSchemesMenu():

async displaySchemes(sock, userId, schemes, lang, offset) {
    let schemeText = lang === 'en' ? `🏛️ *Government Schemes* (Showing ${schemes.length} schemes)

` :
        lang === 'mr' ? `🏛️ *सरकारी योजना* (${schemes.length} योजना दर्शवित)

` :
            `🏛️ *सरकारी योजनाएं* (${schemes.length} योजनाएं दिखा रहे हैं)

`;

    schemes.forEach((scheme, index) => {
        const name = (lang === 'mr' && scheme.name_mr) ? scheme.name_mr : scheme.name;
        const desc = (lang === 'mr' && scheme.description_mr) ? scheme.description_mr : scheme.description;
        const benefits = (lang === 'mr' && scheme.benefits_mr) ? scheme.benefits_mr : scheme.benefits;

        schemeText += `${offset + index + 1}. *${name}*\n`;
        if (desc) schemeText += `   ${desc.substring(0, 100)}...\n`;
        if (benefits) schemeText += `   💰 ${benefits}\n`;
        schemeText += `\n`;
    });

    await sock.sendMessage(userId, { text: schemeText });
}

async handleSchemeSearch(sock, tenantId, userId, input) {
    const session = this.getSession(userId);
    const lang = session.language;
    const searchQuery = input.trim();

    if (searchQuery.length < 2) {
        const tooShort = lang === 'en' ? 'Please enter at least 2 characters to search.' :
            lang === 'mr' ? 'कृपया शोधण्यासाठी किमान २ वर्ण प्रविष्ट करा.' :
                'कृपया खोजने के लिए कम से कम 2 अक्षर दर्ज करें।';
        await sock.sendMessage(userId, { text: tooShort });
        return;
    }

    const schemes = await this.store.getSchemes(tenantId, { limit: 10, offset: 0, searchQuery });

    if (!schemes || schemes.length === 0) {
        const noResults = lang === 'en' ? `❌ No schemes found for "${searchQuery}"` :
            lang === 'mr' ? `❌ "${searchQuery}" साठी कोणत्याही योजना सापडल्या नाहीत` :
                `❌ "${searchQuery}" के लिए कोई योजना नहीं मिली`;
        await sock.sendMessage(userId, { text: noResults });
    } else {
        const resultsMsg = lang === 'en' ? `🔍 *Search Results for "${searchQuery}"*

` :
            lang === 'mr' ? `🔍 *"${searchQuery}" साठी शोध परिणाम*

` :
                `🔍 *"${searchQuery}" के लिए खोज परिणाम*

`;

        await sock.sendMessage(userId, { text: resultsMsg });
        await this.displaySchemes(sock, userId, schemes, lang, 0);
    }

    session.currentMenu = MENU_STATES.SCHEMES_MENU;
    await this.showSchemesMenu(sock, userId, lang);
}

async handleSchemeViewMore(sock, tenantId, userId, input) {
    const session = this.getSession(userId);
    const lang = session.language;

    if (input.toLowerCase() === 'more' || input === '1') {
        const offset = session.schemeOffset || 10;
        const schemes = await this.store.getSchemes(tenantId, { limit: 10, offset });

        if (!schemes || schemes.length === 0) {
            const noMore = lang === 'en' ? '✅ No more schemes to display.' :
                lang === 'mr' ? '✅ दर्शविण्यासाठी आणखी योजना नाहीत.' :
                    '✅ प्रदर्शित करने के लिए और योजनाएं नहीं हैं।';
            await sock.sendMessage(userId, { text: noMore });
            session.currentMenu = MENU_STATES.SCHEMES_MENU;
            await this.showSchemesMenu(sock, userId, lang);
            return;
        }

        await this.displaySchemes(sock, userId, schemes, lang, offset);

        // Check if there are even more schemes
        const moreSchemes = await this.store.getSchemes(tenantId, { limit: 1, offset: offset + 10 });
        if (moreSchemes && moreSchemes.length > 0) {
            const moreMsg = lang === 'en' ? '\n📄 Send *MORE* to see more schemes or press 9 for menu' :
                lang === 'mr' ? '\n📄 अधिक योजना पाहण्यासाठी *MORE* पाठवा किंवा मेनूसाठी 9 दाबा' :
                    '\n📄 अधिक योजनाएं देखने के लिए *MORE* भेजें या मेनू के लिए 9 दबाएं';
            await sock.sendMessage(userId, { text: moreMsg });
            session.schemeOffset = offset + 10;
            return; // Stay in SCHEME_VIEW_MORE state
        } else {
            session.currentMenu = MENU_STATES.SCHEMES_MENU;
            await this.showSchemesMenu(sock, userId, lang);
        }
    } else {
        // User entered something else, go back to schemes menu
        session.currentMenu = MENU_STATES.SCHEMES_MENU;
        await this.showSchemesMenu(sock, userId, lang);
    }
}
