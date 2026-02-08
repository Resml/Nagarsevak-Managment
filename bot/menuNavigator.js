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
    // Form states
    COMPLAINT_FORM_NAME: 'COMPLAINT_FORM_NAME',
    COMPLAINT_FORM_PROBLEM: 'COMPLAINT_FORM_PROBLEM',
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
        if (input === '0') {
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

            case MENU_STATES.COMPLAINT_FORM_PROBLEM:
                return await this.handleComplaintFormProblem(sock, tenantId, userId, input);

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
     * Complaint Form Handlers
     */
    async handleComplaintFormName(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        session.formData.name = input;
        session.currentMenu = MENU_STATES.COMPLAINT_FORM_PROBLEM;

        const lang = session.language;
        await sock.sendMessage(userId, { text: MESSAGES.complaint_problem_prompt[lang] });
    }

    async handleComplaintFormProblem(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        session.formData.problem = input;

        // Save complaint
        const complaint = {
            userId,
            userName: session.formData.name,
            problem: session.formData.problem,
            timestamp: new Date().toISOString(),
            tenantId
        };
        await this.store.saveComplaint(complaint);

        // Send confirmation
        const lang = session.language;
        await sock.sendMessage(userId, { text: MESSAGES.complaint_registered[lang] });

        // Reset and show main menu
        session.formData = {};
        return await this.showMainMenu(sock, userId, lang);
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
