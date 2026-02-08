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
                return await this.handleSchemesMenu(sock, userId, input);

            case MENU_STATES.VOTER_MENU:
                return await this.handleVoterMenu(sock, userId, input);

            case MENU_STATES.EVENTS_MENU:
                return await this.handleEventsMenu(sock, userId, input);

            case MENU_STATES.WORKS_MENU:
                return await this.handleWorksMenu(sock, userId, input);

            case MENU_STATES.WARD_PROBLEMS_MENU:
                return await this.handleWardProblemsMenu(sock, userId, input);

            case MENU_STATES.CONTACT_MENU:
                return await this.handleContactMenu(sock, userId, input);

            case MENU_STATES.OTHER_MENU:
                return await this.handleOtherMenu(sock, userId, input);

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
            case '3':
                // TODO: Implement complaint status/view
                const msg = lang === 'en' ? 'Coming soon!' :
                    lang === 'mr' ? 'लवकरच येत आहे!' : 'जल्द आ रहा है!';
                await sock.sendMessage(userId, { text: msg });
                await this.showComplaintsMenu(sock, userId, lang);
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

    /**
     * Schemes Menu
     */
    async showSchemesMenu(sock, userId, lang) {
        const session = this.getSession(userId);
        session.currentMenu = MENU_STATES.SCHEMES_MENU;
        session.previousMenu = MENU_STATES.MAIN_MENU;

        await sock.sendMessage(userId, { text: MENUS.schemes[lang].text });
    }

    async handleSchemesMenu(sock, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        // TODO: Implement schemes functionality
        const msg = lang === 'en' ? 'Schemes information coming soon!' :
            lang === 'mr' ? 'योजनांची माहिती लवकरच!' : 'योजनाओं की जानकारी जल्द!';
        await sock.sendMessage(userId, { text: msg });
        await this.showSchemesMenu(sock, userId, lang);
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

    async handleVoterMenu(sock, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        // TODO: Implement voter info functionality
        const msg = lang === 'en' ? 'Voter information coming soon!' :
            lang === 'mr' ? 'मतदार माहिती लवकरच!' : 'मतदाता जानकारी जल्द!';
        await sock.sendMessage(userId, { text: msg });
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

    async handleEventsMenu(sock, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        // TODO: Implement events functionality
        const msg = lang === 'en' ? 'Events information coming soon!' :
            lang === 'mr' ? 'कार्यक्रम माहिती लवकरच!' : 'कार्यक्रम जानकारी जल्द!';
        await sock.sendMessage(userId, { text: msg });
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

    async handleWorksMenu(sock, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        // TODO: Implement works functionality
        const msg = lang === 'en' ? 'Development works info coming soon!' :
            lang === 'mr' ? 'विकास कामांची माहिती लवकरच!' : 'विकास कार्य की जानकारी जल्द!';
        await sock.sendMessage(userId, { text: msg });
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

    async handleWardProblemsMenu(sock, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        // TODO: Implement ward problems functionality
        const msg = lang === 'en' ? 'Ward problems info coming soon!' :
            lang === 'mr' ? 'प्रभाग समस्या माहिती लवकरच!' : 'वार्ड समस्याओं की जानकारी जल्द!';
        await sock.sendMessage(userId, { text: msg });
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

    async handleContactMenu(sock, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        // TODO: Implement contact info functionality
        const msg = lang === 'en' ? 'Contact information coming soon!' :
            lang === 'mr' ? 'संपर्क माहिती लवकरच!' : 'संपर्क जानकारी जल्द!';
        await sock.sendMessage(userId, { text: msg });
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

    async handleOtherMenu(sock, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        // TODO: Implement other services functionality
        const msg = lang === 'en' ? 'Other services info coming soon!' :
            lang === 'mr' ? 'इतर सेवा माहिती लवकरच!' : 'अन्य सेवाओं की जानकारी जल्द!';
        await sock.sendMessage(userId, { text: msg });
        await this.showOtherMenu(sock, userId, lang);
    }
}

module.exports = MenuNavigator;
