/**
 * Menu Definitions for WhatsApp Bot
 * All menus with multi-language support (Marathi, Hindi, English)
 */

const getMenus = (polNameEn = 'Nagarsevak', polNameMr = 'नगरसेवक', polNameHi = 'नगरसेवक') => ({
    // Language Selection Menu
    language: {
        en: {
            text: `🙏 *Welcome!*\n\nI am your ${polNameEn} Assistant Bot.\n\nPlease select your language:\n\n1️⃣ English\n2️⃣ मराठी (Marathi)\n3️⃣ हिंदी (Hindi)\n\n_Reply with 1, 2, or 3_`
        },
        mr: {
            text: `🙏 *स्वागत आहे!*\n\nमी तुमचा ${polNameMr} सहाय्यक बॉट आहे.\n\nकृपया तुमची भाषा निवडा:\n\n1️⃣ English\n2️⃣ मराठी (Marathi)\n3️⃣ हिंदी (Hindi)\n\n_1, 2, किंवा 3 टाइप करा_`
        },
        hi: {
            text: `🙏 *स्वागत है!*\n\nमैं आपका ${polNameHi} सहायक बॉट हूं.\n\nकृपया अपनी भाषा चुनें:\n\n1️⃣ English\n2️⃣ मराठी (Marathi)\n3️⃣ हिंदी (Hindi)\n\n_1, 2, या 3 टाइप करें_`
        }
    },

    // Main Menu - Restructured (7 options)
    main: {
        en: {
            text: `📋 *Main Menu*\n\nWhat would you like to do?\n\n1️⃣ Submit Complaint\n2️⃣ Letters\n3️⃣ Government Schemes\n4️⃣ Ward Problems\n5️⃣ Personal Request\n6️⃣ Other Services\n\n0️⃣ Change Language\n\n_Reply with a number (1-6, 0)_`
        },
        mr: {
            text: `📋 *मुख्य मेनू*\n\nतुम्हाला काय करायचे आहे?\n\n1️⃣ तक्रार नोंदवा\n2️⃣ पत्र\n3️⃣ सरकारी योजना\n4️⃣ प्रभाग समस्या\n5️⃣ वैयक्तिक विनंती/मदत\n6️⃣ इतर सेवा\n\n0️⃣ भाषा बदला\n\n_कृपया क्रमांक निवडा (1-6, 0)_`
        },
        hi: {
            text: `📋 *मुख्य मेनू*\n\nआप क्या करना चाहेंगे?\n\n1️⃣ शिकायत दर्ज करें\n2️⃣ पत्र\n3️⃣ सरकारी योजनाएं\n4️⃣ वार्ड समस्याएं\n5️⃣ व्यक्तिगत अनुरोध\n6️⃣ अन्य सेवाएं\n\n0️⃣ भाषा बदलें\n\n_कृपया नंबर चुनें (1-6, 0)_`
        }
    },

    // Complaints Sub-Menu
    complaints: {
        en: {
            text: `📝 *Complaints Service*\n\nHow can I help you?\n\n1️⃣ Submit New Complaint\n2️⃣ Check Complaint Status\n3️⃣ View My Complaints\n\n9️⃣ Main Menu\n0️⃣ Change Language\n\n_Reply with a number_`
        },
        mr: {
            text: `📝 *तक्रार सेवा*\n\nमी तुम्हाला कशी मदत करू शकतो?\n\n1️⃣ नवीन तक्रार नोंदवा\n2️⃣ तक्रार स्थिती तपासा\n3️⃣ माझ्या तक्रारी पहा\n\n9️⃣ मुख्य मेनू\n0️⃣ भाषा बदला\n\n_कृपया क्रमांक निवडा_`
        },
        hi: {
            text: `📝 *शिकायत सेवा*\n\nमैं आपकी कैसे मदद कर सकता हूं?\n\n1️⃣ नई शिकायत दर्ज करें\n2️⃣ शिकायत स्थिति जांचें\n3️⃣ मेरी शिकायतें देखें\n\n9️⃣ मुख्य मेनू\n0️⃣ भाषा बदलें\n\n_कृपया नंबर चुनें_`
        }
    },

    // Schemes Sub-Menu
    schemes: {
        en: {
            text: `🏛️ *Government Schemes*\n\nExplore available schemes:\n\n1️⃣ View All Schemes\n2️⃣ Search Scheme\n3️⃣ Schemes For Me\n4️⃣ How to Apply\n\n9️⃣ Main Menu\n0️⃣ Change Language\n\n_Reply with a number_`
        },
        mr: {
            text: `🏛️ *सरकारी योजना*\n\nउपलब्ध योजना पहा:\n\n1️⃣ सर्व योजना पहा\n2️⃣ योजना शोधा\n3️⃣ माझ्यासाठी योजना\n4️⃣ अर्ज कसा करायचा\n\n9️⃣ मुख्य मेनू\n0️⃣ भाषा बदला\n\n_कृपया क्रमांक निवडा_`
        },
        hi: {
            text: `🏛️ *सरकारी योजनाएं*\n\nउपलब्ध योजनाएं देखें:\n\n1️⃣ सभी योजनाएं देखें\n2️⃣ योजना खोजें\n3️⃣ मेरे लिए योजनाएं\n4️⃣ आवेदन कैसे करें\n\n9️⃣ मुख्य मेनू\n0️⃣ भाषा बदलें\n\n_कृपया नंबर चुनें_`
        }
    },

    // Voter Information Menu
    voter: {
        en: {
            text: `🗳️ *Voter Information*\n\nHow can I help you?\n\n1️⃣ Search Voter\n2️⃣ Link WhatsApp to Voter\n3️⃣ Polling Booth Location\n4️⃣ Election Results\n\n9️⃣ Main Menu\n0️⃣ Change Language\n\n_Reply with a number_`
        },
        mr: {
            text: `🗳️ *मतदार माहिती*\n\nमी तुम्हाला कशी मदत करू शकतो?\n\n1️⃣ मतदार शोधा\n2️⃣ व्हॉट्सॲपला मतदाराशी लिंक करा\n3️⃣ मतदान केंद्र स्थान\n4️⃣ निवडणूक निकाल\n\n9️⃣ मुख्य मेनू\n0️⃣ भाषा बदला\n\n_कृपया क्रमांक निवडा_`
        },
        hi: {
            text: `🗳️ *मतदाता जानकारी*\n\nमैं आपकी कैसे मदद कर सकता हूं?\n\n1️⃣ मतदाता खोजें\n2️⃣ व्हाट्सएप को मतदाता से जोड़ें\n3️⃣ मतदान केंद्र स्थान\n4️⃣ चुनाव परिणाम\n\n9️⃣ मुख्य मेनू\n0️⃣ भाषा बदलें\n\n_कृपया नंबर चुनें_`
        }
    },

    // Events Menu - Simplified (removed Gallery)
    events: {
        en: {
            text: `🎉 *Events & Programs*\n\nStay updated:\n\n1️⃣ Upcoming Events\n2️⃣ Today's Events\n3️⃣ Past Events\n\n9️⃣ Main Menu\n0️⃣ Change Language\n\n_Reply with a number_`
        },
        mr: {
            text: `🎉 *कार्यक्रम/इव्हेंट*\n\nअद्ययावत रहा:\n\n1️⃣ आगामी कार्यक्रम\n2️⃣ आजचे कार्यक्रम\n3️⃣ मागील कार्यक्रम\n\n9️⃣ मुख्य मेनू\n0️⃣ भाषा बदला\n\n_कृपया क्रमांक निवडा_`
        },
        hi: {
            text: `🎉 *कार्यक्रम/इवेंट*\n\nअपडेट रहें:\n\n1️⃣ आगामी कार्यक्रम\n2️⃣ आज के कार्यक्रम\n3️⃣ पिछले कार्यक्रम\n\n9️⃣ मुख्य मेनू\n0️⃣ भाषा बदलें\n\n_कृपया नंबर चुनें_`
        }
    },

    // Development Works Menu
    works: {
        en: {
            text: `🏗️ *Development Works*\n\nTrack progress:\n\n1️⃣ Ongoing Works\n2️⃣ Completed Works\n3️⃣ Planned Works\n4️⃣ Work Details\n\n9️⃣ Main Menu\n0️⃣ Change Language\n\n_Reply with a number_`
        },
        mr: {
            text: `🏗️ *विकास कामे*\n\nप्रगती पहा:\n\n1️⃣ सुरू असलेली कामे\n2️⃣ पूर्ण झालेली कामे\n3️⃣ नियोजित कामे\n4️⃣ कामाचा तपशील\n\n9️⃣ मुख्य मेनू\n0️⃣ भाषा बदला\n\n_कृपया क्रमांक निवडा_`
        },
        hi: {
            text: `🏗️ *विकास कार्य*\n\nप्रगति देखें:\n\n1️⃣ चल रहे कार्य\n2️⃣ पूर्ण कार्य\n3️⃣ नियोजित कार्य\n4️⃣ कार्य विवरण\n\n9️⃣ मुख्य मेनू\n0️⃣ भाषा बदलें\n\n_कृपया नंबर चुनें_`
        }
    },

    // Ward Problems Menu
    ward_problems: {
        en: {
            text: `🏘️ *Ward Problems*\n\nReport or view issues:\n\n1️⃣ Report New Problem\n2️⃣ View My Problems\n3️⃣ Solved Problems\n\n9️⃣ Main Menu\n0️⃣ Change Language\n\n_Reply with a number_`
        },
        mr: {
            text: `🏘️ *प्रभाग समस्या*\n\nसमस्या नोंदवा किंवा पहा:\n\n1️⃣ नवीन समस्या नोंदवा\n2️⃣ माझ्या समस्या पहा\n3️⃣ सोडवलेल्या समस्या\n\n9️⃣ मुख्य मेनू\n0️⃣ भाषा बदला\n\n_कृपया क्रमांक निवडा_`
        },
        hi: {
            text: `🏘️ *वार्ड समस्याएं*\n\nसमस्या दर्ज करें या देखें:\n\n1️⃣ नई समस्या दर्ज करें\n2️⃣ मेरी समस्याएं देखें\n3️⃣ हल की गई समस्याएं\n\n9️⃣ मुख्य मेनू\n0️⃣ भाषा बदलें\n\n_कृपया नंबर चुनें_`
        }
    },

    // Contact Information Menu
    contact: {
        en: {
            text: `📞 *Contact Information*\n\n1️⃣ Office Address\n2️⃣ Office Hours\n3️⃣ Phone Numbers\n4️⃣ Email Address\n5️⃣ Social Media\n\n9️⃣ Main Menu\n0️⃣ Change Language\n\n_Reply with a number_`
        },
        mr: {
            text: `📞 *संपर्क माहिती*\n\n1️⃣ कार्यालय पत्ता\n2️⃣ कार्यालय वेळ\n3️⃣ फोन नंबर\n4️⃣ ईमेल पत्ता\n5️⃣ सोशल मीडिया\n\n9️⃣ मुख्य मेनू\n0️⃣ भाषा बदला\n\n_कृपया क्रमांक निवडा_`
        },
        hi: {
            text: `📞 *संपर्क जानकारी*\n\n1️⃣ कार्यालय पता\n2️⃣ कार्यालय समय\n3️⃣ फोन नंबर\n4️⃣ ईमेल पता\n5️⃣ सोशल मीडिया\n\n9️⃣ मुख्य मेनू\n0️⃣ भाषा बदलें\n\n_कृपया नंबर चुनें_`
        }
    },

    // Other Services Menu
    other: {
        en: {
            text: `🔧 *Other Services*\n\n1️⃣ Events & Programs\n2️⃣ Development Works\n3️⃣ Contact Information\n\n9️⃣ Main Menu\n0️⃣ Change Language\n\n_Reply with a number_`
        },
        mr: {
            text: `🔧 *इतर सेवा*\n\n1️⃣ कार्यक्रम/इव्हेंट\n2️⃣ विकास कामे\n3️⃣ संपर्क माहिती\n\n9️⃣ मुख्य मेनू\n0️⃣ भाषा बदला\n\n_कृपया क्रमांक निवडा_`
        },
        hi: {
            text: `🔧 *अन्य सेवाएं*\n\n1️⃣ कार्यक्रम/इवेंट\n2️⃣ विकास कार्य\n3️⃣ संपर्क जानकारी\n\n9️⃣ मुख्य मेनू\n0️⃣ भाषा बदलें\n\n_कृपया नंबर चुनें_`
        }
    }
});

const PERSONAL_REQUEST_MENU = {
    en: {
        text: `🤝 *Personal Request & Help*\n\nSelect category of help needed:\n\n1️⃣ Education/Admission\n2️⃣ Medical Help/Hospital\n3️⃣ Financial Assistance\n4️⃣ General Help\n5️⃣ Other Help\n\n6️⃣ Track My Requests\n\n9️⃣ Main Menu\n0️⃣ Change Language\n\n_Reply with a number (1-6)_`
    },
    mr: {
        text: `🤝 *वैयक्तिक विनंती आणि मदत*\n\nमदतीचा प्रकार निवडा:\n\n1️⃣ शिक्षण/प्रवेश मदत\n2️⃣ वैद्यकीय मदत/हॉस्पिटल\n3️⃣ आर्थिक मदत\n4️⃣ सामान्य मदत\n5️⃣ इतर मदत\n\n6️⃣ माझ्या विनंत्यांचा मागोवा घ्या\n\n9️⃣ मुख्य मेनू\n0️⃣ भाषा बदला\n\n_कृपया क्रमांक निवडा (१-६)_`
    },
    hi: {
        text: `🤝 *व्यक्तिगत अनुरोध और सहायता*\n\nआवश्यक सहायता की श्रेणी चुनें:\n\n1️⃣ शिक्षा/प्रवेश\n2️⃣ चिकित्सा सहायता/अस्पताल\n3️⃣ वित्तीय सहायता\n4️⃣ सामान्य सहायता\n5️⃣ अन्य सहायता\n\n6️⃣ मेरे अनुरोधों को ट्रैक करें\n\n9️⃣ मुख्य मेनू\n0️⃣ भाषा बदलें\n\n_कृपया नंबर चुनें (1-6)_`
    }
};

// Response Messages
const MESSAGES = {
    language_selected: {
        en: '✅ Language set to English',
        mr: '✅ भाषा मराठी मध्ये सेट केली',
        hi: '✅ भाषा हिंदी में सेट की गई'
    },
    invalid_option: {
        en: '❌ Invalid option. Please try again.',
        mr: '❌ चुकीचा पर्याय. कृपया पुन्हा प्रयत्न करा.',
        hi: '❌ गलत विकल्प। कृपया पुनः प्रयास करें।'
    },
    complaint_name_prompt: {
        en: '📝 Please enter your full name:',
        mr: '📝 कृपया तुमचे पूर्ण नाव प्रविष्ट करा:',
        hi: '📝 कृपया अपना पूरा नाम दर्ज करें:'
    },
    complaint_mobile_prompt: {
        en: '📱 Please enter your mobile number (10 digits):',
        mr: '📱 कृपया तुमचा मोबाइल नंबर प्रविष्ट करा (१० अंक):',
        hi: '📱 कृपया अपना मोबाइल नंबर दर्ज करें (10 अंक):'
    },
    complaint_type_prompt: {
        en: '🏷️ Select complaint type:\n\n1️⃣ Roads\n2️⃣ Water Supply\n3️⃣ Electricity\n4️⃣ Waste/Garbage\n5️⃣ Street Lights\n6️⃣ Drainage\n7️⃣ Other\n\n_Reply with number (1-7)_',
        mr: '🏷️ तक्रारीचा प्रकार निवडा:\n\n1️⃣ रस्ते\n2️⃣ पाणीपुरवठा\n3️⃣ वीजपुरवठा\n4️⃣ कचरा/स्वच्छता\n5️⃣ स्ट्रीट लाइट\n6️⃣ गटार/ड्रेनेज\n7️⃣ इतर\n\n_कृपया क्रमांक निवडा (१-७)_',
        hi: '🏷️ शिकायत का प्रकार चुनें:\n\n1️⃣ सड़कें\n2️⃣ पानी की आपूर्ति\n3️⃣ बिजली\n4️⃣ कचरा/सफाई\n5️⃣ स्ट्रीट लाइट\n6️⃣ नाली/ड्रेनेज\n7️⃣ अन्य\n\n_कृपया नंबर चुनें (1-7)_'
    },
    complaint_description_prompt: {
        en: '📝 Please describe your complaint in detail:',
        mr: '📝 कृपया तुमची तक्रार तपशीलवार वर्णन करा:',
        hi: '📝 कृपया अपनी शिकायत का विस्तार से वर्णन करें:'
    },
    complaint_location_prompt: {
        en: '📍 Please provide the location/area:',
        mr: '📍 कृपया ठिकाण/भाग सांगा:',
        hi: '📍 कृपया स्थान/क्षेत्र बताएं:'
    },
    complaint_photo_prompt: {
        en: '📷 Send a photo (optional)\n\n_Type 0 to skip_',
        mr: '📷 फोटो पाठवा (ऐच्छिक)\n\n_नसल्यास 0 टाइप करा_',
        hi: '📷 फोटो भेजें (वैकल्पिक)\n\n_छोड़ने के लिए 0 टाइप करें_'
    },
    complaint_registered: {
        en: '✅ *Complaint Registered Successfully!*\n\nComplaint ID: #{id}\n\nOur team will review it soon and take appropriate action.\n\nYou can check the status on our website.',
        mr: '✅ *तक्रार यशस्वीरित्या नोंदविली!*\n\nतक्रार क्रमांक: #{id}\n\nआमची टीम लवकरच त्याचे पुनरावलोकन करेल आणि योग्य कार्यवाही करेल.',
        hi: '✅ *शिकायत सफलतापूर्वक दर्ज की गई!*\n\nशिकायत ID: #{id}\n\nहमारी टीम जल्द ही इसकी समीक्षा करेगी और उचित कार्रवाई करेगी.\n\nआप हमारी वेबसाइट पर स्थिति जांच सकते हैं।'
    },
    scheme_question_age: {
        en: '🔢 *Schemes For Me (1/3)*\n\nPlease enter your age (e.g., 25):',
        mr: '🔢 *माझ्यासाठी योजना (१/३)*\n\nकृपया तुमचे वय प्रविष्ट करा (उदा. २५):',
        hi: '🔢 *मेरे लिए योजनाएं (1/3)*\n\nकृपया अपनी आयु दर्ज करें (जैसे, 25):'
    },
    scheme_question_gender: {
        en: '👤 *Schemes For Me (2/3)*\n\nPlease select your gender:\n\n1️⃣ Male\n2️⃣ Female\n3️⃣ Other\n\n_Reply with number (1-3)_',
        mr: '👤 *माझ्यासाठी योजना (२/३)*\n\nकृपया तुमचे लिंग निवडा:\n\n1️⃣ पुरुष\n2️⃣ स्त्री\n3️⃣ इतर\n\n_कृपया क्रमांक निवडा (१-३)_',
        hi: '👤 *मेरे लिए योजनाएं (2/3)*\n\nकृपया अपना लिंग चुनें:\n\n1️⃣ पुरुष\n2️⃣ महिला\n3️⃣ अन्य\n\n_कृपया नंबर चुनें (1-3)_'
    },
    scheme_question_category: {
        en: '📋 *Schemes For Me (3/3)*\n\nPlease select your category:\n\n1️⃣ SC/ST\n2️⃣ OBC\n3️⃣ General\n4️⃣ EWS\n5️⃣ VJNT\n\n_Reply with number (1-5)_',
        mr: '📋 *माझ्यासाठी योजना (३/३)*\n\nकृपया तुमची प्रवर्ग (Category) निवडा:\n\n1️⃣ अनुसूचित जाती/जमाती (SC/ST)\n2️⃣ इतर मागासवर्गीय (OBC)\n3️⃣ सामान्य (General)\n4️⃣ आर्थिकदृष्ट्या दुर्बल घटक (EWS)\n5️⃣ वि.जा.भ.ज. (VJNT)\n\n_कृपया क्रमांक निवडा (१-५)_',
        hi: '📋 *मेरे लिए योजनाएं (3/3)*\n\nकृपया अपनी श्रेणी चुनें:\n\n1️⃣ SC/ST\n2️⃣ OBC\n3️⃣ सामान्य (General)\n4️⃣ EWS\n5️⃣ VJNT\n\n_कृपया नंबर चुनें (1-5)_'
    },
    personal_request_desc_prompt: {
        en: '📝 Please describe your request in detail:',
        mr: '📝 कृपया तुमच्या विनंतीचे तपशीलवार वर्णन करा:',
        hi: '📝 कृपया अपने अनुरोध का विस्तार से वर्णन करें:'
    },
    personal_request_track_prompt: {
        en: '📱 Please enter your mobile number to view your personal requests:',
        mr: '📱 तुमच्या वैयक्तिक विनंत्या पाहण्यासाठी कृपया तुमचा मोबाइल नंबर प्रविष्ट करा:',
        hi: '📱 अपने व्यक्तिगत अनुरोध देखने के लिए कृपया अपना मोबाइल नंबर दर्ज करें:'
    },
    voter_verify_name_prompt: {
        en: '📝 Please enter your full name (as per voter list):',
        mr: '📝 कृपया तुमचे पूर्ण नाव प्रविष्ट करा (मतदार यादीनुसार):',
        hi: '📝 कृपया अपना पूरा नाम दर्ज करें (मतदाता सूची के अनुसार):'
    },
    voter_register_ward_prompt: {
        en: '🏘️ Please enter your Ward Number:',
        mr: '🏘️ कृपया तुमचा प्रभाग क्रमांक प्रविष्ट करा:',
        hi: '🏘️ कृपया अपना वार्ड नंबर दर्ज करें:'
    }
};

module.exports = { getMenus, MESSAGES, PERSONAL_REQUEST_MENU };
