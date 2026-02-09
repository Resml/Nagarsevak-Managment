/**
 * Menu Navigator - Handles all menu navigation logic
 * No AI, pure menu-driven system
 */

const { MENUS, MESSAGES } = require('./menus');

// Session storage for each user
const userSessions = {};

// Menu states
const MENU_STATES = {
    LANGUAGE_SELECTION: 'LANGUAGE_SELECTION',
    MAIN_MENU: 'MAIN_MENU',
    COMPLAINTS_MENU: 'COMPLAINTS_MENU',
    SCHEMES_MENU: 'SCHEMES_MENU',
    VOTER_MENU: 'VOTER_MENU',
    EVENTS_MENU: 'EVENTS_MENU',
    WORKS_MENU: 'WORKS_MENU',
    WARD_PROBLEMS_MENU: 'WARD_PROBLEMS_MENU',
    CONTACT_MENU: 'CONTACT_MENU',
    OTHER_MENU: 'OTHER_MENU',
    // Complete Complaint Form states
    COMPLAINT_FORM_NAME: 'COMPLAINT_FORM_NAME',
    COMPLAINT_FORM_MOBILE: 'COMPLAINT_FORM_MOBILE',
    COMPLAINT_FORM_TYPE: 'COMPLAINT_FORM_TYPE',
    COMPLAINT_FORM_DESCRIPTION: 'COMPLAINT_FORM_DESCRIPTION',
    COMPLAINT_FORM_LOCATION: 'COMPLAINT_FORM_LOCATION',
    COMPLAINT_FORM_PHOTO: 'COMPLAINT_FORM_PHOTO',
    COMPLAINT_STATUS_MOBILE: 'COMPLAINT_STATUS_MOBILE',
    VIEW_COMPLAINTS_MOBILE: 'VIEW_COMPLAINTS_MOBILE',
};

class MenuNavigator {
    constructor(store) {
        this.store = store;
    }

    /**
     * Get or create user session
     */
    getSession(userId) {
        if (!userSessions[userId]) {
            userSessions[userId] = {
                language: null,
                currentMenu: MENU_STATES.LANGUAGE_SELECTION,
                previousMenu: null,
                formData: {}
            };
        }
        return userSessions[userId];
    }

    /**
     * Main message handler
     */
    async handleMessage(sock, tenantId, userId, userName, messageText) {
        const session = this.getSession(userId);
        const input = messageText.trim();

        // Check for global navigation commands
        // Check for global navigation commands
        // Exception: 0 is used to skip photo in COMPLAINT_FORM_PHOTO
        if (input === '0' && session.currentMenu !== MENU_STATES.COMPLAINT_FORM_PHOTO) {
            // Change language
            return await this.showLanguageMenu(sock, userId);
        }

        if (input === '9' && session.currentMenu !== MENU_STATES.MAIN_MENU) {
            // Go back to main menu
            return await this.showMainMenu(sock, userId, session.language);
        }

        // Route to appropriate handler based on current state
        switch (session.currentMenu) {
            case MENU_STATES.LANGUAGE_SELECTION:
                return await this.handleLanguageSelection(sock, userId, userName, input);

            case MENU_STATES.MAIN_MENU:
                return await this.handleMainMenu(sock, tenantId, userId, input);

            case MENU_STATES.COMPLAINTS_MENU:
                return await this.handleComplaintsMenu(sock, tenantId, userId, input);

            case MENU_STATES.SCHEMES_MENU:
                return await this.handleSchemesMenu(sock, tenantId, userId, input);

            case MENU_STATES.VOTER_MENU:
                return await this.handleVoterMenu(sock, tenantId, userId, input);

            case MENU_STATES.EVENTS_MENU:
                return await this.handleEventsMenu(sock, tenantId, userId, input);

            case MENU_STATES.WORKS_MENU:
                return await this.handleWorksMenu(sock, tenantId, userId, input);

            case MENU_STATES.WARD_PROBLEMS_MENU:
                return await this.handleWardProblemsMenu(sock, tenantId, userId, input);

            case MENU_STATES.CONTACT_MENU:
                return await this.handleContactMenu(sock, tenantId, userId, input);

            case MENU_STATES.OTHER_MENU:
                return await this.handleOtherMenu(sock, tenantId, userId, input);

            // Form states
            case MENU_STATES.COMPLAINT_FORM_NAME:
                return await this.handleComplaintFormName(sock, tenantId, userId, input);

            case MENU_STATES.COMPLAINT_FORM_MOBILE:
                return await this.handleComplaintFormMobile(sock, tenantId, userId, input);

            case MENU_STATES.COMPLAINT_FORM_TYPE:
                return await this.handleComplaintFormType(sock, tenantId, userId, input);

            case MENU_STATES.COMPLAINT_FORM_DESCRIPTION:
                return await this.handleComplaintFormDescription(sock, tenantId, userId, input);

            case MENU_STATES.COMPLAINT_FORM_LOCATION:
                return await this.handleComplaintFormLocation(sock, tenantId, userId, input);

            case MENU_STATES.COMPLAINT_FORM_PHOTO:
                return await this.handleComplaintFormPhoto(sock, tenantId, userId, input);

            case 'VOTER_SEARCH_PROMPT':
                return await this.handleVoterSearch(sock, tenantId, userId, input);

            case MENU_STATES.COMPLAINT_STATUS_MOBILE:
                return await this.handleComplaintStatusMobile(sock, tenantId, userId, input);

            case MENU_STATES.VIEW_COMPLAINTS_MOBILE:
                return await this.handleViewComplaintsMobile(sock, tenantId, userId, input);

            default:
                // Fallback to language selection
                return await this.showLanguageMenu(sock, userId);
        }
    }

    /**
     * Show language selection menu
     */
    async showLanguageMenu(sock, userId) {
        const session = this.getSession(userId);
        session.currentMenu = MENU_STATES.LANGUAGE_SELECTION;
        session.previousMenu = null;

        // Send multi-language welcome message
        const welcomeText = MENUS.language.en.text;
        await sock.sendMessage(userId, { text: welcomeText });
    }

    /**
     * Handle language selection
     */
    async handleLanguageSelection(sock, userId, userName, input) {
        const session = this.getSession(userId);
        let selectedLanguage = null;

        // Map input to language
        if (input === '1' || input.toLowerCase().includes('english')) {
            selectedLanguage = 'en';
        } else if (input === '2' || input.includes('मराठी')) {
            selectedLanguage = 'mr';
        } else if (input === '3' || input.includes('हिंदी')) {
            selectedLanguage = 'hi';
        }

        if (selectedLanguage) {
            // Save language
            session.language = selectedLanguage;
            await this.store.saveUser(userId, { language: selectedLanguage, name: userName });

            // Send confirmation
            const confirmMsg = MESSAGES.language_selected[selectedLanguage];
            await sock.sendMessage(userId, { text: confirmMsg });

            // Show main menu
            return await this.showMainMenu(sock, userId, selectedLanguage);
        } else {
            // Invalid selection, show menu again
            const errorMsg = MESSAGES.invalid_option.en + '\n\n' + MENUS.language.en.text;
            await sock.sendMessage(userId, { text: errorMsg });
        }
    }

    /**
     * Show main menu
     */
    async showMainMenu(sock, userId, language) {
        const session = this.getSession(userId);
        session.currentMenu = MENU_STATES.MAIN_MENU;
        session.previousMenu = null;

        const menuText = MENUS.main[language].text;
        await sock.sendMessage(userId, { text: menuText });
    }

    /**
     * Handle main menu selection
     */
    async handleMainMenu(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        switch (input) {
            case '1':
                return await this.showComplaintsMenu(sock, userId, lang);
            case '2':
                return await this.showSchemesMenu(sock, userId, lang);
            case '3':
                return await this.showVoterMenu(sock, userId, lang);
            case '4':
                return await this.showEventsMenu(sock, userId, lang);
            case '5':
                return await this.showWorksMenu(sock, userId, lang);
            case '6':
                return await this.showWardProblemsMenu(sock, userId, lang);
            case '7':
                return await this.showContactMenu(sock, userId, lang);
            case '8':
                return await this.showOtherMenu(sock, userId, lang);
            default:
                // Invalid option
                const errorMsg = MESSAGES.invalid_option[lang] + '\n\n' + MENUS.main[lang].text;
                await sock.sendMessage(userId, { text: errorMsg });
        }
    }

    /**
     * Complaints Menu
     */
    async showComplaintsMenu(sock, userId, lang) {
        const session = this.getSession(userId);
        session.currentMenu = MENU_STATES.COMPLAINTS_MENU;
        session.previousMenu = MENU_STATES.MAIN_MENU;

        await sock.sendMessage(userId, { text: MENUS.complaints[lang].text });
    }

    async handleComplaintsMenu(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        switch (input) {
            case '1':
                // Submit new complaint - start form
                session.currentMenu = MENU_STATES.COMPLAINT_FORM_NAME;
                session.formData = {};
                await sock.sendMessage(userId, { text: MESSAGES.complaint_name_prompt[lang] });
                break;
            case '2':
                // Check complaint status
                session.currentMenu = MENU_STATES.COMPLAINT_STATUS_MOBILE;
                const statusMsg = lang === 'en' ? '📱 Please enter your mobile number to check complaint status:' :
                    lang === 'mr' ? '📱 तक्रार स्थिती तपासण्यासाठी कृपया तुमचा मोबाइल नंबर प्रविष्ट करा:' :
                        '📱 शिकायत की स्थिति जांचने के लिए कृपया अपना मोबाइल नंबर दर्ज करें:';
                await sock.sendMessage(userId, { text: statusMsg });
                break;
            case '3':
                // View my complaints
                session.currentMenu = MENU_STATES.VIEW_COMPLAINTS_MOBILE;
                const viewMsg = lang === 'en' ? '📱 Please enter your mobile number to view your complaints:' :
                    lang === 'mr' ? '📱 तुमच्या तक्रारी पाहण्यासाठी कृपया तुमचा मोबाइल नंबर प्रविष्ट करा:' :
                        '📱 अपनी शिकायतें देखने के लिए कृपया अपना मोबाइल नंबर दर्ज करें:';
                await sock.sendMessage(userId, { text: viewMsg });
                break;
            default:
                const errorMsg = MESSAGES.invalid_option[lang] + '\n\n' + MENUS.complaints[lang].text;
                await sock.sendMessage(userId, { text: errorMsg });
        }
    }

    /**
     * Complaint Form Handlers (Complete Multi-Step Form)
     */
    async handleComplaintFormName(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        session.formData.name = input;
        session.currentMenu = MENU_STATES.COMPLAINT_FORM_MOBILE;

        const lang = session.language;
        await sock.sendMessage(userId, { text: MESSAGES.complaint_mobile_prompt[lang] });
    }

    async handleComplaintFormMobile(sock, tenantId, userId, input) {
        const session = this.getSession(userId);

        // Simple validation: must be 10 digits
        const cleanMobile = input.replace(/\D/g, '');
        if (cleanMobile.length !== 10) {
            const lang = session.language;
            const errorMsg = lang === 'en' ? '❌ Please enter a valid 10-digit mobile number' :
                lang === 'mr' ? '❌ कृपया वैध १० अंकी मोबाइल नंबर प्रविष्ट करा' :
                    '❌ कृपया एक वैध 10 अंकों का मोबाइल नंबर दर्ज करें';
            await sock.sendMessage(userId, { text: errorMsg + '\n\n' + MESSAGES.complaint_mobile_prompt[lang] });
            return;
        }

        session.formData.mobile = cleanMobile;
        session.currentMenu = MENU_STATES.COMPLAINT_FORM_TYPE;

        const lang = session.language;
        await sock.sendMessage(userId, { text: MESSAGES.complaint_type_prompt[lang] });
    }

    async handleComplaintFormType(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        // Map complaint types
        const typeMap = {
            '1': { en: 'Road', mr: 'रस्ते', hi: 'सड़कें', db: 'Road' },
            '2': { en: 'Water', mr: 'पाणीपुरवठा', hi: 'पानी की आपूर्ति', db: 'Water' },
            '3': { en: 'Electricity', mr: 'वीजपुरवठा', hi: 'बिजली', db: 'StreetLight' },
            '4': { en: 'Waste', mr: 'कचरा/स्वच्छता', hi: 'कचरा/सफाई', db: 'Cleaning' },
            '5': { en: 'Street Lights', mr: 'स्ट्रीट लाइट', hi: 'स्ट्रीट लाइट', db: 'StreetLight' },
            '6': { en: 'Drainage', mr: 'गटार/ड्रेनेज', hi: 'नाली/ड्रेनेज', db: 'Drainage' },
            '7': { en: 'Other', mr: 'इतर', hi: 'अन्य', db: 'Other' }
        };

        if (!typeMap[input]) {
            await sock.sendMessage(userId, { text: MESSAGES.invalid_option[lang] + '\n\n' + MESSAGES.complaint_type_prompt[lang] });
            return;
        }

        session.formData.type = typeMap[input].db;
        session.formData.typeDisplay = typeMap[input][lang];
        session.currentMenu = MENU_STATES.COMPLAINT_FORM_DESCRIPTION;

        await sock.sendMessage(userId, { text: MESSAGES.complaint_description_prompt[lang] });
    }

    async handleComplaintFormDescription(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        session.formData.description = input;
        session.currentMenu = MENU_STATES.COMPLAINT_FORM_LOCATION;

        const lang = session.language;
        await sock.sendMessage(userId, { text: MESSAGES.complaint_location_prompt[lang] });
    }

    async handleComplaintFormLocation(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        session.formData.location = input;
        session.currentMenu = MENU_STATES.COMPLAINT_FORM_PHOTO;

        const lang = session.language;
        await sock.sendMessage(userId, { text: MESSAGES.complaint_photo_prompt[lang] });
    }

    async handleComplaintFormPhoto(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;
        const cleanInput = input.trim();

        console.log(`[DEBUG] handleComplaintFormPhoto input: '${input}', clean: '${cleanInput}'`);

        // Check if user wants to skip photo
        if (cleanInput === '0' || cleanInput.toLowerCase() === 'skip') {
            // No photo, proceed to save
            console.log('[DEBUG] Skipping photo, saving complaint...');
            return await this.saveComplaint(sock, tenantId, userId);
        }

        // TODO: Handle actual photo message
        // For now, just skip if it's not 0, but ideally we should handle image messages
        // If it's text but not '0', we might want to say "Please send photo or 0 to skip"
        // But for now let's be permissive and just save
        console.log('[DEBUG] Input received (not 0), proceeding to save...');
        return await this.saveComplaint(sock, tenantId, userId);
    }

    async saveComplaint(sock, tenantId, userId) {
        const session = this.getSession(userId);
        const lang = session.language;

        try {
            // Prepare complaint data
            const complaint = {
                user_name: session.formData.name,
                user_id: userId,
                mobile: session.formData.mobile,
                title: `${session.formData.typeDisplay} - ${session.formData.location}`,
                description: session.formData.description,
                type: session.formData.type,
                area: session.formData.location,
                location: session.formData.location,
                status: 'Pending',
                source: 'WhatsApp',
                urgency: 'Medium',
                photos: [],
                tenantId: tenantId
            };

            // Save to database
            const result = await this.store.saveComplaint(complaint);

            // Get the complaint ID from result
            const complaintId = result?.id || 'XXXX';

            // Send success message with ID
            const successMsg = MESSAGES.complaint_registered[lang].replace('#{id}', complaintId);
            await sock.sendMessage(userId, { text: successMsg });

            // Reset form data and return to main menu
            session.formData = {};
            return await this.showMainMenu(sock, userId, lang);

        } catch (error) {
            console.error('Error saving complaint:', error);
            const errorMsg = lang === 'en' ? '❌ Sorry, there was an error saving your complaint. Please try again later.' :
                lang === 'mr' ? '❌ माफ करा, तुमची तक्रार जतन करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.' :
                    '❌ क्षमा करें, आपकी शिकायत सहेजते समय त्रुटि हुई। कृपया बाद में पुनः प्रयास करें।';
            await sock.sendMessage(userId, { text: errorMsg });

            // Reset and show main menu
            session.formData = {};
            return await this.showMainMenu(sock, userId, lang);
        }
    }

    async handleComplaintStatusMobile(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;
        const mobile = input.trim();

        // Validate mobile number
        if (!/^\d{10}$/.test(mobile.replace(/\D/g, ''))) {
            const invalidMsg = lang === 'en' ? '❌ Invalid mobile number. Please enter a 10-digit number:' :
                lang === 'mr' ? '❌ अवैध मोबाइल नंबर. कृपया 10 अंकी नंबर प्रविष्ट करा:' :
                    '❌ अमान्य मोबाइल नंबर। कृपया 10 अंकों का नंबर दर्ज करें:';
            await sock.sendMessage(userId, { text: invalidMsg });
            return;
        }

        const complaints = await this.store.getComplaintsByMobile(tenantId, mobile);

        if (!complaints || complaints.length === 0) {
            const noComplaints = lang === 'en' ? '❌ No complaints found for this mobile number.' :
                lang === 'mr' ? '❌ या मोबाइल नंबरसाठी कोणत्याही तक्रारी सापडल्या नाहीत.' :
                    '❌ इस मोबाइल नंबर के लिए कोई शिकायत नहीं मिली।';
            await sock.sendMessage(userId, { text: noComplaints });
        } else {
            const complaint = complaints[0];
            const statusEmoji = complaint.status === 'Resolved' ? '✅' : complaint.status === 'In Progress' ? '⏳' : '🔴';
            const statusText = lang === 'en' ?
                `${statusEmoji} *Complaint Status*\\n\\nComplaint ID: #${complaint.id}\\nStatus: ${complaint.status}\\nCategory: ${complaint.category}\\nPriority: ${complaint.priority}\\n\\nProblem: ${complaint.problem}\\n\\n_Latest complaint shown. Total: ${complaints.length}_` :
                lang === 'mr' ?
                    `${statusEmoji} *तक्रार स्थिती*\\n\\nतक्रार क्रमांक: #${complaint.id}\\nस्थिती: ${complaint.status}\\nप्रकार: ${complaint.category}\\nप्राधान्य: ${complaint.priority}\\n\\nसमस्या: ${complaint.problem}\\n\\n_नवीनतम तक्रार दर्शविली. एकूण: ${complaints.length}_` :
                    `${statusEmoji} *शिकायत स्थिति*\\n\\nशिकायत ID: #${complaint.id}\\nस्थिति: ${complaint.status}\\nश्रेणी: ${complaint.category}\\nप्राथमिकता: ${complaint.priority}\\n\\nसमस्या: ${complaint.problem}\\n\\n_नवीनतम शिकायत दिखाई गई। कुल: ${complaints.length}_`;
            await sock.sendMessage(userId, { text: statusText });
        }

        session.currentMenu = MENU_STATES.COMPLAINTS_MENU;
        await this.showComplaintsMenu(sock, userId, lang);
    }

    async handleViewComplaintsMobile(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;
        const mobile = input.trim();

        // Validate mobile number
        if (!/^\d{10}$/.test(mobile.replace(/\D/g, ''))) {
            const invalidMsg = lang === 'en' ? '❌ Invalid mobile number. Please enter a 10-digit number:' :
                lang === 'mr' ? '❌ अवैध मोबाइल नंबर. कृपया 10 अंकी नंबर प्रविष्ट करा:' :
                    '❌ अमान्य मोबाइल नंबर। कृपया 10 अंकों का नंबर दर्ज करें:';
            await sock.sendMessage(userId, { text: invalidMsg });
            return;
        }

        const complaints = await this.store.getComplaintsByMobile(tenantId, mobile);

        if (!complaints || complaints.length === 0) {
            const noComplaints = lang === 'en' ? '❌ No complaints found for this mobile number.' :
                lang === 'mr' ? '❌ या मोबाइल नंबरसाठी कोणत्याही तक्रारी सापडल्या नाहीत.' :
                    '❌ इस मोबाइल नंबर के लिए कोई शिकायत नहीं मिली।';
            await sock.sendMessage(userId, { text: noComplaints });
        } else {
            let listText = lang === 'en' ? `📋 *Your Complaints* (${complaints.length})\\n\\n` :
                lang === 'mr' ? `📋 *तुमच्या तक्रारी* (${complaints.length})\\n\\n` :
                    `📋 *आपकी शिकायतें* (${complaints.length})\\n\\n`;

            complaints.forEach((complaint, index) => {
                const statusEmoji = complaint.status === 'Resolved' ? '✅' : complaint.status === 'In Progress' ? '⏳' : '🔴';
                const date = new Date(complaint.created_at).toLocaleDateString(lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN');

                listText += lang === 'en' ?
                    `${index + 1}. ${statusEmoji} ID: #${complaint.id}\\n   ${complaint.category} - ${complaint.status}\\n   ${date}\\n\\n` :
                    lang === 'mr' ?
                        `${index + 1}. ${statusEmoji} क्रमांक: #${complaint.id}\\n   ${complaint.category} - ${complaint.status}\\n   ${date}\\n\\n` :
                        `${index + 1}. ${statusEmoji} ID: #${complaint.id}\\n   ${complaint.category} - ${complaint.status}\\n   ${date}\\n\\n`;
            });

            await sock.sendMessage(userId, { text: listText });
        }

        session.currentMenu = MENU_STATES.COMPLAINTS_MENU;
        await this.showComplaintsMenu(sock, userId, lang);
    }

    /**
     * Schemes Menu
     */
    async showSchemesMenu(sock, userId, lang) {
        const session = this.getSession(userId);
        session.currentMenu = MENU_STATES.SCHEMES_MENU;
        session.previousMenu = MENU_STATES.MAIN_MENU;

        await sock.sendMessage(userId, { text: MENUS.schemes[lang].text });
    }

    async handleSchemesMenu(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        switch (input) {
            case '1': // View All Schemes
                const schemes = await this.store.getSchemes(tenantId);
                if (!schemes || schemes.length === 0) {
                    const noSchemes = lang === 'en' ? 'No schemes available at the moment.' :
                        lang === 'mr' ? 'सध्या कोणत्याही योजना उपलब्ध नाहीत.' : 'फिलहाल कोई योजनाएं उपलब्ध नहीं हैं।';
                    await sock.sendMessage(userId, { text: noSchemes });
                } else {
                    let schemeText = lang === 'en' ? `🏛️ *Government Schemes* (${schemes.length})\n\n` :
                        lang === 'mr' ? `🏛️ *सरकारी योजना* (${schemes.length})\n\n` :
                            `🏛️ *सरकारी योजनाएं* (${schemes.length})\n\n`;

                    schemes.slice(0, 10).forEach((scheme, index) => {
                        const name = scheme.name || 'Untitled';
                        const desc = scheme.description || 'No description';
                        schemeText += `${index + 1}. *${name}*\n   ${desc?.substring(0, 100)}...\n\n`;
                    });

                    await sock.sendMessage(userId, { text: schemeText });
                }
                await this.showSchemesMenu(sock, userId, lang);
                break;

            case '2': // Search Scheme
            case '3': // Schemes For Me
            case '4': // How to Apply
                const comingSoon = lang === 'en' ? 'Coming soon!' :
                    lang === 'mr' ? 'लवकरच येत आहे!' : 'जल्द आ रहा है!';
                await sock.sendMessage(userId, { text: comingSoon });
                await this.showSchemesMenu(sock, userId, lang);
                break;

            default:
                const errorMsg = MESSAGES.invalid_option[lang] + '\n\n' + MENUS.schemes[lang].text;
                await sock.sendMessage(userId, { text: errorMsg });
                return;
        }
    }

    /**
     * Voter Menu
     */
    async showVoterMenu(sock, userId, lang) {
        const session = this.getSession(userId);
        session.currentMenu = MENU_STATES.VOTER_MENU;
        session.previousMenu = MENU_STATES.MAIN_MENU;

        await sock.sendMessage(userId, { text: MENUS.voter[lang].text });
    }

    async handleVoterMenu(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        switch (input) {
            case '1': // Search Voter
                session.currentMenu = 'VOTER_SEARCH_PROMPT';
                const searchMsg = lang === 'en' ? '🔍 *Search Voter*\n\nEnter name, mobile number, or voter ID:' :
                    lang === 'mr' ? '🔍 *मतदार शोधा*\n\nनाव, मोबाइल नंबर किंवा मतदार आयडी प्रविष्ट करा:' :
                        '🔍 *मतदाता खोजें*\n\nनाम, मोबाइल नंबर या मतदाता ID दर्ज करें:';
                await sock.sendMessage(userId, { text: searchMsg });
                break;

            case '2': // Voter Card Status
            case '3': // Polling Booth
            case '4': // Election Results
                const comingSoon = lang === 'en' ? 'Coming soon!' :
                    lang === 'mr' ? 'लवकरच येत आहे!' : 'जल्द आ रहा है!';
                await sock.sendMessage(userId, { text: comingSoon });
                await this.showVoterMenu(sock, userId, lang);
                break;

            default:
                const errorMsg = MESSAGES.invalid_option[lang] + '\n\n' + MENUS.voter[lang].text;
                await sock.sendMessage(userId, { text: errorMsg });
                return;
        }
    }

    async handleVoterSearch(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        // Determine search type
        let searchType = 'name';
        if (/^\d{10}$/.test(input.replace(/\D/g, ''))) {
            searchType = 'mobile';
        } else if (/^[A-Z]{3}\d+/.test(input.toUpperCase())) {
            searchType = 'voter_id';
        }

        const voters = await this.store.searchVoters(tenantId, input, searchType);

        if (!voters || voters.length === 0) {
            const noResults = lang === 'en' ? '❌ No voters found. Please try again with a different search term.' :
                lang === 'mr' ? '❌ कोणतेही मतदार सापडले नाहीत. कृपया वेगळ्या शोध शब्दासह पुन्हा प्रयत्न करा.' :
                    '❌ कोई मतदाता नहीं मिला। कृपया किसी अन्य खोज शब्द के साथ पुनः प्रयास करें।';
            await sock.sendMessage(userId, { text: noResults });
            session.currentMenu = MENU_STATES.VOTER_MENU;
            await this.showVoterMenu(sock, userId, lang);
            return;
        }

        // Format and send results
        let resultText = lang === 'en' ? `✅ *Found ${voters.length} voter(s)*\n\n` :
            lang === 'mr' ? `✅ *${voters.length} मतदार सापडले*\n\n` :
                `✅ *${voters.length} मतदाता मिले*\n\n`;

        voters.forEach((voter, index) => {
            const name = lang === 'mr' ? (voter.name_marathi || voter.name_english) : voter.name_english;
            const cardNum = voter.card_number || 'N/A';
            const age = voter.age || 'N/A';
            const booth = voter.polling_booth_name || 'N/A';
            const ward = voter.ward || 'N/A';

            resultText += lang === 'en' ?
                `${index + 1}. *${name}*\n   Card: ${cardNum}\n   Age: ${age}, Ward: ${ward}\n   Booth: ${booth}\n\n` :
                lang === 'mr' ?
                    `${index + 1}. *${name}*\n   कार्ड: ${cardNum}\n   वय: ${age}, प्रभाग: ${ward}\n   बूथ: ${booth}\n\n` :
                    `${index + 1}. *${name}*\n   कार्ड: ${cardNum}\n   उम्र: ${age}, वार्ड: ${ward}\n   बूथ: ${booth}\n\n`;
        });

        await sock.sendMessage(userId, { text: resultText });

        // Return to menu
        session.currentMenu = MENU_STATES.VOTER_MENU;
        await this.showVoterMenu(sock, userId, lang);
    }

    /**
     * Events Menu
     */
    async showEventsMenu(sock, userId, lang) {
        const session = this.getSession(userId);
        session.currentMenu = MENU_STATES.EVENTS_MENU;
        session.previousMenu = MENU_STATES.MAIN_MENU;

        await sock.sendMessage(userId, { text: MENUS.events[lang].text });
    }

    async handleEventsMenu(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        let filter = 'upcoming';
        if (input === '1') filter = 'upcoming';
        else if (input === '2') filter = 'today';
        else if (input === '3') filter = 'past';
        else if (input === '4') {
            const comingSoon = lang === 'en' ? 'Event gallery coming soon!' :
                lang === 'mr' ? 'इव्हेंट गॅलरी लवकरच!' : 'इवेंट गैलरी जल्द!';
            await sock.sendMessage(userId, { text: comingSoon });
            await this.showEventsMenu(sock, userId, lang);
            return;
        } else {
            const errorMsg = MESSAGES.invalid_option[lang] + '\n\n' + MENUS.events[lang].text;
            await sock.sendMessage(userId, { text: errorMsg });
            return;
        }

        const events = await this.store.getEvents(tenantId, filter);

        if (!events || events.length === 0) {
            const noEvents = lang === 'en' ? `No ${filter} events found.` :
                lang === 'mr' ? 'कोणतेही कार्यक्रम सापडले नाहीत.' : 'कोई कार्यक्रम नहीं मिले।';
            await sock.sendMessage(userId, { text: noEvents });
        } else {
            let eventText = lang === 'en' ? `🎉 *${filter.toUpperCase()} Events* (${events.length})\n\n` :
                lang === 'mr' ? `🎉 *कार्यक्रम* (${events.length})\n\n` :
                    `🎉 *कार्यक्रम* (${events.length})\n\n`;

            events.forEach((event, index) => {
                const title = event.title || 'Untitled';
                const date = new Date(event.date).toLocaleDateString(lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN');
                const location = event.location || 'TBA';
                eventText += `${index + 1}. *${title}*\n   📅 ${date}\n   📍 ${location}\n\n`;
            });

            await sock.sendMessage(userId, { text: eventText });
        }

        await this.showEventsMenu(sock, userId, lang);
    }

    /**
     * Works Menu
     */
    async showWorksMenu(sock, userId, lang) {
        const session = this.getSession(userId);
        session.currentMenu = MENU_STATES.WORKS_MENU;
        session.previousMenu = MENU_STATES.MAIN_MENU;

        await sock.sendMessage(userId, { text: MENUS.works[lang].text });
    }

    async handleWorksMenu(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        let status = 'all';
        if (input === '1') status = 'In Progress';
        else if (input === '2') status = 'Completed';
        else if (input === '3') status = 'Planned';
        else if (input === '4') {
            // Show improvements
            const improvements = await this.store.getImprovements(tenantId);
            if (!improvements || improvements.length === 0) {
                const noData = lang === 'en' ? 'No improvements found.' :
                    lang === 'mr' ? 'कोणतेही सुधारणा सापडल्या नाहीत.' : 'कोई सुधार नहीं मिला।';
                await sock.sendMessage(userId, { text: noData });
            } else {
                let impText = lang === 'en' ? `🏗️ *Improvements* (${improvements.length})\n\n` :
                    lang === 'mr' ? `🏗️ *सुधारणा* (${improvements.length})\n\n` :
                        `🏗️ *सुधार* (${improvements.length})\n\n`;

                improvements.forEach((imp, index) => {
                    const title = imp.title || 'Untitled';
                    const desc = imp.description?.substring(0, 80) || '';
                    impText += `${index + 1}. *${title}*\n   ${desc}...\n\n`;
                });

                await sock.sendMessage(userId, { text: impText });
            }
            await this.showWorksMenu(sock, userId, lang);
            return;
        } else {
            const errorMsg = MESSAGES.invalid_option[lang] + '\n\n' + MENUS.works[lang].text;
            await sock.sendMessage(userId, { text: errorMsg });
            return;
        }

        const works = await this.store.getWorks(tenantId, status);

        if (!works || works.length === 0) {
            const noWorks = lang === 'en' ? `No ${status} works found.` :
                lang === 'mr' ? 'कोणतीही कामे सापडली नाहीत.' : 'कोई कार्य नहीं मिला।';
            await sock.sendMessage(userId, { text: noWorks });
        } else {
            let worksText = lang === 'en' ? `🏗️ *Development Works* (${works.length})\n\n` :
                lang === 'mr' ? `🏗️ *विकास कामे* (${works.length})\n\n` :
                    `🏗️ *विकास कार्य* (${works.length})\n\n`;

            works.forEach((work, index) => {
                const title = work.title || 'Untitled';
                const status = work.status || 'Unknown';
                const budget = work.budget || 'N/A';
                worksText += `${index + 1}. *${title}*\n   Status: ${status}\n   Budget: ₹${budget}\n\n`;
            });

            await sock.sendMessage(userId, { text: worksText });
        }

        await this.showWorksMenu(sock, userId, lang);
    }

    /**
     * Ward Problems Menu
     */
    async showWardProblemsMenu(sock, userId, lang) {
        const session = this.getSession(userId);
        session.currentMenu = MENU_STATES.WARD_PROBLEMS_MENU;
        session.previousMenu = MENU_STATES.MAIN_MENU;

        await sock.sendMessage(userId, { text: MENUS.ward_problems[lang].text });
    }

    async handleWardProblemsMenu(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        switch (input) {
            case '1': // Report New Problem
                const msg = lang === 'en' ? '📝 *Report Ward Problem*\n\nThis feature allows you to report civic issues in your ward.\n\nUse the "Submit Complaint" menu (Option 1 from Main Menu) to report problems.' :
                    lang === 'mr' ? '📝 *प्रभाग समस्या नोंदवा*\n\nहे वैशिष्ट्य तुम्हाला तुमच्या प्रभागातील नागरी समस्या नोंदविण्याची परवानगी देते.\n\nसमस्या नोंदविण्यासाठी "तक्रार नोंदवा" मेनू (मुख्य मेनूमधून पर्याय 1) वापरा.' :
                        '📝 *वार्ड समस्या दर्ज करें*\n\nयह सुविधा आपको अपने वार्ड में नागरिक समस्याओं की रिपोर्ट करने की अनुमति देती है।\n\nसमस्याओं की रिपोर्ट करने के लिए "शिकायत दर्ज करें" मेनू (मुख्य मेनू से विकल्प 1) का उपयोग करें।';
                await sock.sendMessage(userId, { text: msg });
                break;

            case '2': // View Ward Issues
            case '3': // Track Problem Status  
            case '4': // Solved Problems
                const comingSoon = lang === 'en' ? 'Coming soon!' :
                    lang === 'mr' ? 'लवकरच येत आहे!' : 'जल्द आ रहा है!';
                await sock.sendMessage(userId, { text: comingSoon });
                break;

            default:
                const errorMsg = MESSAGES.invalid_option[lang] + '\n\n' + MENUS.ward_problems[lang].text;
                await sock.sendMessage(userId, { text: errorMsg });
        }

        await this.showWardProblemsMenu(sock, userId, lang);
    }

    /**
     * Contact Menu
     */
    async showContactMenu(sock, userId, lang) {
        const session = this.getSession(userId);
        session.currentMenu = MENU_STATES.CONTACT_MENU;
        session.previousMenu = MENU_STATES.MAIN_MENU;

        await sock.sendMessage(userId, { text: MENUS.contact[lang].text });
    }

    async handleContactMenu(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        let contactText = '';

        switch (input) {
            case '1': // Office Address
                contactText = lang === 'en' ? '🏢 *Office Address*\n\nNagarsevak Office\nWard No. 12\nPune, Maharashtra' :
                    lang === 'mr' ? '🏢 *कार्यालय पत्ता*\n\nनगरसेवक कार्यालय\nप्रभाग क्र. 12\nपुणे, महाराष्ट्र' :
                        '🏢 *कार्यालय पता*\n\nनगरसेवक कार्यालय\nवार्ड नं. 12\nपुणे, महाराष्ट्र';
                break;
            case '2': // Office Hours
                contactText = lang === 'en' ? '⏰ *Office Hours*\n\nMonday - Friday: 10:00 AM - 5:00 PM\nSaturday: 10:00 AM - 2:00 PM\nSunday: Closed' :
                    lang === 'mr' ? '⏰ *कार्यालय वेळ*\n\nसोमवार - शुक्रवार: सकाळी 10:00 - संध्याकाळी 5:00\nशनिवार: सकाळी 10:00 - दुपारी 2:00\nरविवार: बंद' :
                        '⏰ *कार्यालय समय*\n\nसोमवार - शुक्रवार: सुबह 10:00 - शाम 5:00\nशनिवार: सुबह 10:00 - दोपहर 2:00\nरविवार: बंद';
                break;
            case '3': // Phone Numbers
                contactText = lang === 'en' ? '📞 *Contact Numbers*\n\nOffice: +91 020 1234 5678\nMobile: +91 98765 43210' :
                    lang === 'mr' ? '📞 *संपर्क क्रमांक*\n\nकार्यालय: +91 020 1234 5678\nमोबाइल: +91 98765 43210' :
                        '📞 *संपर्क नंबर*\n\nकार्यालय: +91 020 1234 5678\nमोबाइल: +91 98765 43210';
                break;
            case '4': // Email
                contactText = lang === 'en' ? '📧 *Email Address*\n\nofficial@nagarsevak.com' :
                    lang === 'mr' ? '📧 *ईमेल पत्ता*\n\nofficial@nagarsevak.com' :
                        '📧 *ईमेल पता*\n\nofficial@nagarsevak.com';
                break;
            case '5': // Social Media
                contactText = lang === 'en' ? '📱 *Follow Us*\n\nFacebook: /NagarsevakWard12\nTwitter: @NagarsevakW12\nInstagram: @nagarsevak_w12' :
                    lang === 'mr' ? '📱 *आम्हाला फॉलो करा*\n\nFacebook: /NagarsevakWard12\nTwitter: @NagarsevakW12\nInstagram: @nagarsevak_w12' :
                        '📱 *हमें फॉलो करें*\n\nFacebook: /NagarsevakWard12\nTwitter: @NagarsevakW12\nInstagram: @nagarsevak_w12';
                break;
            default:
                const errorMsg = MESSAGES.invalid_option[lang] + '\n\n' + MENUS.contact[lang].text;
                await sock.sendMessage(userId, { text: errorMsg });
                return;
        }

        await sock.sendMessage(userId, { text: contactText });
        await this.showContactMenu(sock, userId, lang);
    }

    /**
     * Other Services Menu
     */
    async showOtherMenu(sock, userId, lang) {
        const session = this.getSession(userId);
        session.currentMenu = MENU_STATES.OTHER_MENU;
        session.previousMenu = MENU_STATES.MAIN_MENU;

        await sock.sendMessage(userId, { text: MENUS.other[lang].text });
    }

    async handleOtherMenu(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        let response = '';

        switch (input) {
            case '1': // Letters/Documents
                response = lang === 'en' ? '📄 *Letters & Documents*\n\nFor official letters and documents, please visit our office during working hours or check the website.' :
                    lang === 'mr' ? '📄 *पत्रे/कागदपत्रे*\n\nअधिकृत पत्रे आणि कागदपत्रांसाठी, कृपया कामकाजाच्या वेळेत आमच्या कार्यालयात भेट द्या किंवा वेबसाइट तपासा.' :
                        '📄 *पत्र/दस्तावेज़*\n\nआधिकारिक पत्रों और दस्तावेजों के लिए, कृपया कार्य समय के दौरान हमारे कार्यालय में जाएं या वेबसाइट देखें।';
                break;
            case '2': // Meeting Diary
                response = lang === 'en' ? '📅 *Meeting Diary*\n\nUpcoming meetings and minutes are available on the website.' :
                    lang === 'mr' ? '📅 *मीटिंग डायरी*\n\nआगामी सभा आणि कार्यवृत्त वेबसाइटवर उपलब्ध आहेत.' :
                        '📅 *मीटिंग डायरी*\n\nआगामी बैठकें और कार्यवृत्त वेबसाइट पर उपलब्ध हैं।';
                break;
            case '3': // Photo Gallery
                response = lang === 'en' ? '📸 *Photo Gallery*\n\nView photos of events and development works on our website.' :
                    lang === 'mr' ? '📸 *फोटो गॅलरी*\n\nआमच्या वेबसाइटवर कार्यक्रम आणि विकास कार्यांचे फोटो पहा.' :
                        '📸 *फोटो गैलरी*\n\nहमारी वेबसाइट पर आयोजनों और विकास कार्यों की तस्वीरें देखें।';
                break;
            case '4': // Newspaper Clippings
                response = lang === 'en' ? '📰 *Newspaper Clippings*\n\nLatest news coverage is available on the website.' :
                    lang === 'mr' ? '📰 *वृत्तपत्र कात्रणे*\n\nनवीनतम बातम्यांचा संग्रह वेबसाइटवर उपलब्ध आहे.' :
                        '📰 *अखबार की कतरनें*\n\nनवीनतम समाचार कवरेज वेबसाइट पर उपलब्ध है।';
                break;
            case '5': // Ward Budget Info
                response = lang === 'en' ? '💰 *Ward Budget Information*\n\nDetailed budget allocation and spending reports are available on the website.' :
                    lang === 'mr' ? '💰 *प्रभाग अर्थसंकल्प*\n\nतपशीलवार अर्थसंकल्प वाटप आणि खर्च अहवाल वेबसाइटवर उपलब्ध आहेत.' :
                        '💰 *वार्ड बजट जानकारी*\n\nविस्तृत बजट आवंटन और खर्च रिपोर्ट वेबसाइट पर उपलब्ध हैं।';
                break;
            default:
                const errorMsg = MESSAGES.invalid_option[lang] + '\n\n' + MENUS.other[lang].text;
                await sock.sendMessage(userId, { text: errorMsg });
                return;
        }

        await sock.sendMessage(userId, { text: response });
        await this.showOtherMenu(sock, userId, lang);
    }
}

module.exports = MenuNavigator;
