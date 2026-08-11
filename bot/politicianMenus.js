/**
 * Politician & Office Admin WhatsApp Menu Definitions
 * Full Multi-Language Support (Marathi, English, Hindi)
 */

const POLITICIAN_MENUS = {
    // Master Dynamic Menu Template
    greeting: {
        mr: {
            title: '🏛️ *मा. {NAME} - कार्यालयीन डिजिटल सहाय्यक*',
            subtitle: '📍 प्रभाग/कार्यालय: *{WARD}* | योजना: *{PLAN}*',
            header: 'नमस्कार साहेब! 🙏\nआपल्या कार्यालयाचे सर्व कामकाज व माहिती खालीलप्रमाणे उपलब्ध आहे:\n',
            footer: '\n0️⃣ भाषा बदला (Change Language)\n🔄 टाईप करा *CITIZEN* (नागरिक मोड चाचणीसाठी)\n\n_कृपया आवश्यक पर्यायाचा क्रमांक निवडा._',
            switch_to_citizen: '🔄 नागरिक मोड (Citizen Mode Test)',
            daily_summary: '📊 आजचा 360° दैनिक आढावा (Daily Pulse)'
        },
        en: {
            title: '🏛️ *Hon. {NAME} - Office Digital Assistant*',
            subtitle: '📍 Ward/Office: *{WARD}* | Plan: *{PLAN}*',
            header: 'Welcome Sir! 🙏\nHere is your real-time office management portal:\n',
            footer: '\n0️⃣ Change Language\n🔄 Type *CITIZEN* (To test Citizen Bot view)\n\n_Please reply with an option number._',
            switch_to_citizen: '🔄 Switch to Citizen Mode (Test)',
            daily_summary: '📊 Today\'s 360° Executive Pulse'
        },
        hi: {
            title: '🏛️ *माननीय {NAME} - कार्यालयीन डिजिटल सहायक*',
            subtitle: '📍 वार्ड/कार्यालय: *{WARD}* | योजना: *{PLAN}*',
            header: 'नमस्ते सर! 🙏\nआपके कार्यालय का संपूर्ण कामकाज और विवरण यहां उपलब्ध है:\n',
            footer: '\n0️⃣ भाषा बदलें (Change Language)\n🔄 टाइप करें *CITIZEN* (नागरिक मोड देखने के लिए)\n\n_कृपया आवश्यक विकल्प का नंबर चुनें._',
            switch_to_citizen: '🔄 नागरिक मोड (Citizen Mode Test)',
            daily_summary: '📊 आज का 360° दैनिक अवलोकन (Daily Pulse)'
        }
    },

    // Feature Labels for Dynamic Menu
    feature_labels: {
        visitors: {
            mr: '👥 भेट देणारे (Visitor Log)',
            en: '👥 Visitor Log',
            hi: '👥 आगंतुक रजिस्टर (Visitor Log)'
        },
        complaints: {
            mr: '📝 तक्रार निवारण (Complaints)',
            en: '📝 Complaint Management',
            hi: '📝 शिकायत निवारण (Complaints)'
        },
        letters: {
            mr: '📥 पत्र व्यवहार (Letters Log)',
            en: '📥 Letters Tracking',
            hi: '📥 पत्र व्यवहार (Letters)'
        },
        tasks: {
            mr: '📌 रोजचे कामकाज व टीम (Tasks & Team)',
            en: '📌 Daily Tasks & Team',
            hi: '📌 दैनिक कार्य व टीम (Tasks)'
        },
        gb_register: {
            mr: '📅 दैनंदिनी व कार्यक्रम (Daily Diary / GB)',
            en: '📅 Daily Diary & Events',
            hi: '📅 दैनंदिनी व कार्यक्रम (Diary)'
        },
        schemes: {
            mr: '🏛️ सरकारी योजना लाभार्थी (Schemes)',
            en: '🏛️ Govt Schemes Beneficiaries',
            hi: '🏛️ सरकारी योजनाएं (Schemes)'
        },
        ward_problems: {
            mr: '⚠️ प्रभाग समस्या (Ward Issues)',
            en: '⚠️ Ward Issues Tracker',
            hi: '⚠️ वार्ड समस्याएं (Ward Issues)'
        },
        voters: {
            mr: '🗳️ मतदार माहिती व आकडेवारी (Voter Stats)',
            en: '🗳️ Voter Information & Stats',
            hi: '🗳️ मतदाता आंकड़े (Voter Stats)'
        }
    },

    // 1. Visitor Sub-Menu
    visitors_menu: {
        mr: {
            text: `👥 *भेट देणारे (Visitor Log Management)*\n\nकार्यालयात भेट दिलेल्या नागरिकांची माहिती:\n\n1️⃣ आजचे भेट देणारे (Today's Visitors)\n2️⃣ कालचे भेट देणारे (Yesterday's Visitors)\n3️⃣ विशिष्ट तारखेचे व्हिजिटर्स (Date-wise Filter)\n4️⃣ व्हिजिटर शोधा (Search by Name / Mobile)\n5️⃣ भेट देणारे सांख्यिकी व सारांश (Visitor Analytics)\n\n9️⃣ मुख्य मेनू (Main Menu)\n0️⃣ भाषा बदला`
        },
        en: {
            text: `👥 *Visitor Log Management*\n\nReview citizens visiting your office:\n\n1️⃣ Today's Visitors\n2️⃣ Yesterday's Visitors\n3️⃣ Custom Date Visitors (Date Filter)\n4️⃣ Search Visitor (By Name / Mobile)\n5️⃣ Visitor Analytics & Summary\n\n9️⃣ Main Menu\n0️⃣ Change Language`
        },
        hi: {
            text: `👥 *आगंतुक रजिस्टर (Visitor Log Management)*\n\nकार्यालय में आने वाले नागरिकों की सूची:\n\n1️⃣ आज के आगंतुक (Today's Visitors)\n2️⃣ कल के आगंतुक (Yesterday's Visitors)\n3️⃣ तारीख अनुसार फिल्टर (Date-wise Filter)\n4️⃣ आगंतुक खोजें (Search by Name / Mobile)\n5️⃣ आगंतुक सांख्यिकी (Visitor Analytics)\n\n9️⃣ मुख्य मेनू (Main Menu)\n0️⃣ भाषा बदलें`
        }
    },

    // 2. Complaints Sub-Menu
    complaints_menu: {
        mr: {
            text: `📝 *तक्रार निवारण आढावा (Complaints Overview)*\n\n1️⃣ प्रलंबित तक्रारी (Pending Complaints)\n2️⃣ आज सोडवलेल्या तक्रारी (Resolved Today)\n3️⃣ तातडीच्या / हाय प्रायोरिटी तक्रारी (Urgent Priority)\n4️⃣ तक्रारींची स्थिती व सांख्यिकी (Status Summary)\n\n9️⃣ मुख्य मेनू (Main Menu)\n0️⃣ भाषा बदला`
        },
        en: {
            text: `📝 *Complaints Overview*\n\n1️⃣ Pending Complaints\n2️⃣ Resolved Today\n3️⃣ Urgent / High Priority Complaints\n4️⃣ Complaints Summary & Statistics\n\n9️⃣ Main Menu\n0️⃣ Change Language`
        },
        hi: {
            text: `📝 *शिकायत निवारण समीक्षा (Complaints Overview)*\n\n1️⃣ लंबित शिकायतें (Pending Complaints)\n2️⃣ आज हल की गई शिकायतें (Resolved Today)\n3️⃣ उच्च प्राथमिकता शिकायतें (Urgent Priority)\n4️⃣ शिकायतों की सांख्यिकी (Status Summary)\n\n9️⃣ मुख्य मेनू (Main Menu)\n0️⃣ भाषा बदलें`
        }
    },

    // 3. Letters Sub-Menu
    letters_menu: {
        mr: {
            text: `📥 *पत्र व्यवहार (Letters Management)*\n\n1️⃣ नवीन आलेली पत्रे (Incoming Letters - Pending)\n2️⃣ पाठवलेली / मंजूर पत्रे (Outgoing Letters)\n3️⃣ पत्र शोधा (Search Letter by Subject/Sender)\n\n9️⃣ मुख्य मेनू (Main Menu)\n0️⃣ भाषा बदला`
        },
        en: {
            text: `📥 *Letters Management*\n\n1️⃣ Incoming Letters (Pending Action)\n2️⃣ Outgoing / Issued Letters\n3️⃣ Search Letters (By Subject/Sender)\n\n9️⃣ Main Menu\n0️⃣ Change Language`
        },
        hi: {
            text: `📥 *पत्र व्यवहार (Letters Management)*\n\n1️⃣ नए आए हुए पत्र (Incoming Letters)\n2️⃣ भेजे गए पत्र (Outgoing Letters)\n3️⃣ पत्र खोजें (Search Letters)\n\n9️⃣ मुख्य मेनू (Main Menu)\n0️⃣ भाषा बदलें`
        }
    },

    // 4. Tasks & Team Sub-Menu
    tasks_menu: {
        mr: {
            text: `📌 *रोजचे कामकाज व टीम (Daily Tasks & Team)*\n\n1️⃣ आजची महत्त्वाची कामे (Today's Tasks)\n2️⃣ मुदत संपलेली प्रलंबित कामे (Overdue Tasks)\n3️⃣ टीम व कर्मचारी कामांची स्थिती (Staff Workload)\n\n9️⃣ मुख्य मेनू (Main Menu)\n0️⃣ भाषा बदला`
        },
        en: {
            text: `📌 *Daily Tasks & Team*\n\n1️⃣ Today's Scheduled Tasks\n2️⃣ Overdue Tasks\n3️⃣ Staff & Team Workload Status\n\n9️⃣ Main Menu\n0️⃣ Change Language`
        },
        hi: {
            text: `📌 *दैनिक कार्य व टीम (Tasks & Team)*\n\n1️⃣ आज के महत्वपूर्ण कार्य (Today's Tasks)\n2️⃣ लंबित समयोत्तीर्ण कार्य (Overdue Tasks)\n3️⃣ स्टाफ व टीम कार्य स्थिति (Staff Status)\n\n9️⃣ मुख्य मेनू (Main Menu)\n0️⃣ भाषा बदलें`
        }
    },

    // 5. Daily Diary Sub-Menu
    diary_menu: {
        mr: {
            text: `📅 *दैनंदिनी व कार्यक्रम (Daily Diary / GB Register)*\n\n1️⃣ आजची दैनंदिनी व नियोजित बैठका (Today's Schedule)\n2️⃣ उद्याचे नियोजन व कार्यक्रम (Tomorrow's Schedule)\n\n9️⃣ मुख्य मेनू (Main Menu)\n0️⃣ भाषा बदला`
        },
        en: {
            text: `📅 *Daily Diary & Schedule*\n\n1️⃣ Today's Schedule & Meetings\n2️⃣ Tomorrow's Schedule & Events\n\n9️⃣ Main Menu\n0️⃣ Change Language`
        },
        hi: {
            text: `📅 *दैनंदिनी व कार्यक्रम (Daily Diary)*\n\n1️⃣ आज का शेड्यूल व बैठकें (Today's Schedule)\n2️⃣ कल का शेड्यूल (Tomorrow's Schedule)\n\n9️⃣ मुख्य मेनू (Main Menu)\n0️⃣ भाषा बदलें`
        }
    },

    // Prompts
    prompts: {
        date_input: {
            mr: '📅 *तारीख निवडा (Date Filter)*\n\nकृपया ज्या तारखेची माहिती पाहायची आहे ती तारीख पाठवा.\nउदा:\n• *DD-MM-YYYY* (उदा. `11-08-2026`)\n• *YYYY-MM-DD* (उदा. `2026-08-11`)\n• किंवा *today* / *yesterday*\n\n9️⃣ मागे जाण्यासाठी 9 पाठवा.',
            en: '📅 *Select Date*\n\nPlease enter the date to view records.\nExamples:\n• *DD-MM-YYYY* (e.g. `11-08-2026`)\n• *YYYY-MM-DD* (e.g. `2026-08-11`)\n• or type *today* / *yesterday*\n\n9️⃣ Reply with 9 to go back.',
            hi: '📅 *तारीख चुनें (Date Filter)*\n\nकृपया वह तारीख भेजें जिसकी जानकारी आप देखना चाहते हैं।\nउदा:\n• *DD-MM-YYYY* (उदा. `11-08-2026`)\n• *YYYY-MM-DD* (उदा. `2026-08-11`)\n• या *today* / *yesterday*\n\n9️⃣ वापस जाने के लिए 9 भेजें।'
        },
        visitor_search: {
            mr: '🔍 *व्हिजिटर शोधा (Search Visitor)*\n\nकृपया नागरिकाचे *नाव* किंवा *१० अंकी मोबाईल नंबर* पाठवा:\nउदा. `रुपेश` किंवा `9876543210`\n\n9️⃣ मागे जाण्यासाठी 9 पाठवा.',
            en: '🔍 *Search Visitor*\n\nPlease send visitor\'s *name* or *10-digit mobile number*:\nExample: `Ramesh` or `9876543210`\n\n9️⃣ Reply with 9 to go back.',
            hi: '🔍 *आगंतुक खोजें (Search Visitor)*\n\nकृपया नागरिक का *नाम* या *10 अंकों का मोबाइल नंबर* भेजें:\nउदा. `रमेश` या `9876543210`\n\n9️⃣ वापस जाने के लिए 9 भेजें।'
        },
        letter_search: {
            mr: '🔍 *पत्र शोधा (Search Letter)*\n\nकृपया पत्राचा विषय, पाठवणाऱ्याचे नाव किंवा पत्र क्रमांक पाठवा:\n\n9️⃣ मागे जाण्यासाठी 9 पाठवा.',
            en: '🔍 *Search Letters*\n\nPlease send letter subject, sender name, or letter number:\n\n9️⃣ Reply with 9 to go back.',
            hi: '🔍 *पत्र खोजें (Search Letters)*\n\nकृपया पत्र का विषय, प्रेषक का नाम या पत्र संख्या भेजें:\n\n9️⃣ वापस जाने के लिए 9 भेजें।'
        }
    }
};

module.exports = {
    POLITICIAN_MENUS
};
