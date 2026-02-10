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
    LETTERS_MENU: 'LETTERS_MENU',
    LETTER_TYPE_SELECT: 'LETTER_TYPE_SELECT',
    LETTER_FORM_NAME: 'LETTER_FORM_NAME',
    LETTER_FORM_MOBILE: 'LETTER_FORM_MOBILE',
    LETTER_FORM_ADDRESS: 'LETTER_FORM_ADDRESS',
    LETTER_FORM_PURPOSE: 'LETTER_FORM_PURPOSE',
    AREA_PROBLEM_MENU: 'AREA_PROBLEM_MENU',
    AREA_PROBLEM_REPORT: 'AREA_PROBLEM_REPORT',
    AREA_PROBLEM_FORM_TITLE: 'AREA_PROBLEM_FORM_TITLE',
    AREA_PROBLEM_FORM_DESCRIPTION: 'AREA_PROBLEM_FORM_DESCRIPTION',
    AREA_PROBLEM_FORM_LOCATION: 'AREA_PROBLEM_FORM_LOCATION',
    // Complete Complaint Form states
    COMPLAINT_FORM_NAME: 'COMPLAINT_FORM_NAME',
    COMPLAINT_FORM_MOBILE: 'COMPLAINT_FORM_MOBILE',
    COMPLAINT_FORM_TYPE: 'COMPLAINT_FORM_TYPE',
    COMPLAINT_FORM_DESCRIPTION: 'COMPLAINT_FORM_DESCRIPTION',
    COMPLAINT_FORM_LOCATION: 'COMPLAINT_FORM_LOCATION',
    COMPLAINT_FORM_PHOTO: 'COMPLAINT_FORM_PHOTO',
    COMPLAINT_STATUS_MOBILE: 'COMPLAINT_STATUS_MOBILE',
    VIEW_COMPLAINTS_MOBILE: 'VIEW_COMPLAINTS_MOBILE',
    SCHEME_SEARCH_PROMPT: 'SCHEME_SEARCH_PROMPT',
    SCHEME_VIEW_MORE: 'SCHEME_VIEW_MORE',
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

            case MENU_STATES.SCHEME_SEARCH_PROMPT:
                return await this.handleSchemeSearch(sock, tenantId, userId, input);

            case MENU_STATES.SCHEME_VIEW_MORE:
                return await this.handleSchemeViewMore(sock, tenantId, userId, input);

            case MENU_STATES.LETTER_TYPE_SELECT:
                return await this.handleLetterTypeSelect(sock, tenantId, userId, input);

            case MENU_STATES.LETTER_FORM_NAME:
                return await this.handleLetterFormName(sock, tenantId, userId, input);

            case MENU_STATES.LETTER_FORM_MOBILE:
                return await this.handleLetterFormMobile(sock, tenantId, userId, input);

            case MENU_STATES.LETTER_FORM_ADDRESS:
                return await this.handleLetterFormAddress(sock, tenantId, userId, input);

            case MENU_STATES.LETTER_FORM_PURPOSE:
                return await this.handleLetterFormPurpose(sock, tenantId, userId, input);

            case MENU_STATES.AREA_PROBLEM_REPORT:
                return await this.handleAreaProblemReport(sock, tenantId, userId, input);

            case MENU_STATES.AREA_PROBLEM_FORM_TITLE:
                return await this.handleAreaProblemTitle(sock, tenantId, userId, input);

            case MENU_STATES.AREA_PROBLEM_FORM_DESCRIPTION:
                return await this.handleAreaProblemDescription(sock, tenantId, userId, input);

            case MENU_STATES.AREA_PROBLEM_FORM_LOCATION:
                return await this.handleAreaProblemLocation(sock, tenantId, userId, input);

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
            case '1': // Complaints
                return await this.showComplaintsMenu(sock, userId, lang);
            case '2': // Government Schemes
                return await this.showSchemesMenu(sock, userId, lang);
            case '3': // Events & Programs (was 4)
                return await this.showEventsMenu(sock, userId, lang);
            case '4': // Development Works (was 5)
                return await this.showWorksMenu(sock, userId, lang);
            case '5': // Ward Problems (was 6)
                return await this.showWardProblemsMenu(sock, userId, lang);
            case '6': // Letters/Documents (NEW - from Other Services)
                return await this.showLettersMenu(sock, userId, lang, tenantId);
            case '7': // Contact Information (was 7)
                return await this.showContactMenu(sock, userId, lang);
            default:
                const errorMsg = MESSAGES.invalid_option[lang] + '\n\n' + MENUS.main[lang].text;
                await sock.sendMessage(userId, { text: errorMsg });
                return;
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
                `${statusEmoji} *Complaint Status*

Complaint ID: #${complaint.id}
Status: ${complaint.status}
Category: ${complaint.category}
Priority: ${complaint.priority}

Problem: ${complaint.problem}

_Latest complaint shown. Total: ${complaints.length}_` :
                lang === 'mr' ?
                    `${statusEmoji} *तक्रार स्थिती*

तक्रार क्रमांक: #${complaint.id}
स्थिती: ${complaint.status}
प्रकार: ${complaint.category}
प्राधान्य: ${complaint.priority}

समस्या: ${complaint.problem}

_नवीनतम तक्रार दर्शविली. एकूण: ${complaints.length}_` :
                    `${statusEmoji} *शिकायत स्थिति*

शिकायत ID: #${complaint.id}
स्थिति: ${complaint.status}
श्रेणी: ${complaint.category}
प्राथमिकता: ${complaint.priority}

समस्या: ${complaint.problem}

_नवीनतम शिकायत दिखाई गई। कुल: ${complaints.length}_`;
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
            let listText = lang === 'en' ? `📋 *Your Complaints* (${complaints.length})

` :
                lang === 'mr' ? `📋 *तुमच्या तक्रारी* (${complaints.length})

` :
                    `📋 *आपकी शिकायतें* (${complaints.length})

`;

            complaints.forEach((complaint, index) => {
                const statusEmoji = complaint.status === 'Resolved' ? '✅' : complaint.status === 'In Progress' ? '⏳' : '🔴';
                const date = new Date(complaint.created_at).toLocaleDateString(lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN');

                listText += lang === 'en' ?
                    `${index + 1}. ${statusEmoji} ID: #${complaint.id}
   ${complaint.category} - ${complaint.status}
   ${date}

` :
                    lang === 'mr' ?
                        `${index + 1}. ${statusEmoji} क्रमांक: #${complaint.id}
   ${complaint.category} - ${complaint.status}
   ${date}

` :
                        `${index + 1}. ${statusEmoji} ID: #${complaint.id}
   ${complaint.category} - ${complaint.status}
   ${date}

`;
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
                session.schemeOffset = 0;
                const schemes = await this.store.getSchemes(tenantId, { limit: 10, offset: 0 });
                if (!schemes || schemes.length === 0) {
                    const noSchemes = lang === 'en' ? 'No schemes available at the moment.' :
                        lang === 'mr' ? 'सध्या कोणत्याही योजना उपलब्ध नाहीत.' : 'फिलहाल कोई योजनाएं उपलब्ध नहीं हैं।';
                    await sock.sendMessage(userId, { text: noSchemes });
                } else {
                    await this.displaySchemes(sock, userId, schemes, lang, 0);
                    const moreSchemes = await this.store.getSchemes(tenantId, { limit: 1, offset: 10 });
                    if (moreSchemes && moreSchemes.length > 0) {
                        const moreMsg = lang === 'en' ? '\n📄 Send *MORE* to see more schemes or press 9 for menu' : lang === 'mr' ? '\n📄 अधिक योजना पाहण्यासाठी *MORE* पाठवा किंवा मेनूसाठी 9 दाबा' : '\n📄 अधिक योजनाएं देखने के लिए *MORE* भेजें या मेनू के लिए 9 दबाएं';
                        await sock.sendMessage(userId, { text: moreMsg });
                        session.currentMenu = MENU_STATES.SCHEME_VIEW_MORE;
                        session.schemeOffset = 10;
                        return;
                    }
                }
                await this.showSchemesMenu(sock, userId, lang);
                break;

            case '2': // Search Scheme
                session.currentMenu = MENU_STATES.SCHEME_SEARCH_PROMPT;
                const searchMsg = lang === 'en' ? '🔍 Enter scheme name or keyword to search:' : lang === 'mr' ? '🔍 शोध करण्यासाठी योजनेचे नाव किंवा मुख्य शब्द प्रविष्ट करा:' : '🔍 खोजने के लिए योजना का नाम या कीवर्ड दर्ज करें:';
                await sock.sendMessage(userId, { text: searchMsg });
                break;

            case '3': // Schemes For Me
                const personalizedMsg = lang === 'en' ? `👤 *Personalized Recommendations*\n\nShowing all available schemes. Please check eligibility for each scheme:\n` : lang === 'mr' ? `👤 *वैयक्तिक शिफारसी*\n\nसर्व उपलब्ध योजना दर्शविल्या जात आहेत. कृपया प्रत्येक योजनेसाठी पात्रता तपासा:\n` : `👤 *व्यक्तिगत सिफारिशें*\n\nसभी उपलब्ध योजनाएं दिखाई जा रही हैं। कृपया प्रत्येक योजना के लिए पात्रता जांचें:\n`;
                await sock.sendMessage(userId, { text: personalizedMsg });
                const allSchemes = await this.store.getSchemes(tenantId, { limit: 10, offset: 0 });
                if (allSchemes && allSchemes.length > 0) {
                    await this.displaySchemes(sock, userId, allSchemes, lang, 0);
                }
                await this.showSchemesMenu(sock, userId, lang);
                break;

            case '4': // How to Apply
                const applyGuide = lang === 'en' ? `📝 *How to Apply for Schemes*\n\n1️⃣ *Check Eligibility*\n   Read scheme details carefully and verify you meet all criteria\n\n2️⃣ *Prepare Documents*\n   Gather required documents (usually Aadhar, Income Certificate, etc.)\n\n3️⃣ *Visit Office or Apply Online*\n   • Visit our office during working hours\n   • Or check if online application is available\n   • Call for more details: See Contact section\n\n4️⃣ *Submit Application*\n   Fill form completely with correct details\n\n5️⃣ *Follow Up*\n   Track your application status\n   Contact office if needed\n\n💡 *Tip*: Keep photocopies of all documents` : lang === 'mr' ? `📝 *योजनांसाठी अर्ज कसा करावा*\n\n1️⃣ *पात्रता तपासा*\n   योजनेचे तपशील काळजीपूर्वक वाचा आणि तुम्ही सर्व निकषांची पूर्तता करता याची पडताळणी करा\n\n2️⃣ *कागदपत्रे तयार करा*\n   आवश्यक कागदपत्रे गोळा करा (सामान्यतः आधार, उत्पन्न प्रमाणपत्र इ.)\n\n3️⃣ *कार्यालयात भेट द्या किंवा ऑनलाइन अर्ज करा*\n   • कामकाजाच्या वेळेत आमच्या कार्यालयाला भेट द्या\n   • किंवा ऑनलाइन अर्ज उपलब्ध आहे का ते तपासा\n   • अधिक माहितीसाठी कॉल करा: संपर्क विभाग पहा\n\n4️⃣ *अर्ज सादर करा*\n   योग्य तपशीलांसह फॉर्म पूर्णपणे भरा\n\n5️⃣ *पाठपुरावा करा*\n   तुमच्या अर्जाची स्थिती ट्रॅक करा\n   आवश्यक असल्यास कार्यालयाशी संपर्क साधा\n\n💡 *टीप*: सर्व कागदपत्रांच्या फोटोकॉपी ठेवा` : `📝 *योजनाओं के लिए आवेदन कैसे करें*\n\n1️⃣ *पात्रता जांचें*\n   योजना विवरण ध्यान से पढ़ें और सत्यापित करें कि आप सभी मानदंडों को पूरा करते हैं\n\n2️⃣ *दस्तावेज़ तैयार करें*\n   आवश्यक दस्तावेज़ इकट्ठा करें (आमतौर पर आधार, आय प्रमाण पत्र आदि)\n\n3️⃣ *कार्यालय जाएँ या ऑनलाइन आवेदन करें*\n   • कार्य घंटों के दौरान हमारे कार्यालय जाएँ\n   • या जांचें कि ऑनलाइन आवेदन उपलब्ध है या नहीं\n   • अधिक जानकारी के लिए कॉल करें: संपर्क अनुभाग देखें\n\n4️⃣ *आवेदन जमा करें*\n   सही विवरण के साथ फॉर्म पूरी तरह भरें\n\n5️⃣ *फॉलो अप करें*\n   अपने आवेदन की स्थिति ट्रैक करें\n   आवश्यकता पड़ने पर कार्यालय से संपर्क करें\n\n💡 *सुझाव*: सभी दस्तावेज़ों की फोटोकॉपी रखें`;
                await sock.sendMessage(userId, { text: applyGuide });
                await this.showSchemesMenu(sock, userId, lang);
                break;

            default:
                const errorMsg = MESSAGES.invalid_option[lang] + '\n\n' + MENUS.schemes[lang].text;
                await sock.sendMessage(userId, { text: errorMsg });
                return;
        }
    }

    async displaySchemes(sock, userId, schemes, lang, offset) {
        let schemeText = lang === 'en' ? `🏛️ *Government Schemes* (Showing ${schemes.length} schemes)\n\n` : lang === 'mr' ? `🏛️ *सरकारी योजना* (${schemes.length} योजना दर्शवित)\n\n` : `🏛️ *सरकारी योजनाएं* (${schemes.length} योजनाएं दिखा रहे हैं)\n\n`;
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
            const tooShort = lang === 'en' ? 'Please enter at least 2 characters to search.' : lang === 'mr' ? 'कृपया शोधण्यासाठी किमान २ वर्ण प्रविष्ट करा.' : 'कृपया खोजने के लिए कम से कम 2 अक्षर दर्ज करें।';
            await sock.sendMessage(userId, { text: tooShort });
            return;
        }
        const schemes = await this.store.getSchemes(tenantId, { limit: 10, offset: 0, searchQuery });
        if (!schemes || schemes.length === 0) {
            const noResults = lang === 'en' ? `❌ No schemes found for "${searchQuery}"` : lang === 'mr' ? `❌ "${searchQuery}" साठी कोणत्याही योजना सापडल्या नाहीत` : `❌ "${searchQuery}" के लिए कोई योजना नहीं मिली`;
            await sock.sendMessage(userId, { text: noResults });
        } else {
            const resultsMsg = lang === 'en' ? `🔍 *Search Results for "${searchQuery}"*\n\n` : lang === 'mr' ? `🔍 *"${searchQuery}" साठी शोध परिणाम*\n\n` : `🔍 *"${searchQuery}" के लिए खोज परिणाम*\n\n`;
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
                const noMore = lang === 'en' ? '✅ No more schemes to display.' : lang === 'mr' ? '✅ दर्शविण्यासाठी आणखी योजना नाहीत.' : '✅ प्रदर्शित करने के लिए और योजनाएं नहीं हैं।';
                await sock.sendMessage(userId, { text: noMore });
                session.currentMenu = MENU_STATES.SCHEMES_MENU;
                await this.showSchemesMenu(sock, userId, lang);
                return;
            }
            await this.displaySchemes(sock, userId, schemes, lang, offset);
            const moreSchemes = await this.store.getSchemes(tenantId, { limit: 1, offset: offset + 10 });
            if (moreSchemes && moreSchemes.length > 0) {
                const moreMsg = lang === 'en' ? '\n📄 Send *MORE* to see more schemes or press 9 for menu' : lang === 'mr' ? '\n📄 अधिक योजना पाहण्यासाठी *MORE* पाठवा किंवा मेनूसाठी 9 दाबा' : '\n📄 अधिक योजनाएं देखने के लिए *MORE* भेजें या मेनू के लिए 9 दबाएं';
                await sock.sendMessage(userId, { text: moreMsg });
                session.schemeOffset = offset + 10;
                return;
            } else {
                session.currentMenu = MENU_STATES.SCHEMES_MENU;
                await this.showSchemesMenu(sock, userId, lang);
            }
        } else {
            session.currentMenu = MENU_STATES.SCHEMES_MENU;
            await this.showSchemesMenu(sock, userId, lang);
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
        else {
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
                session.currentMenu = MENU_STATES.AREA_PROBLEM_FORM_TITLE;
                session.areaFormData = {};
                const titlePrompt = lang === 'en' ? '📝 *Report Area Problem*\n\nWhat is the problem title?\n\n_Example: Broken streetlight, road damage, etc._' :
                    lang === 'mr' ? '📝 *क्षेत्र समस्या नोंदवा*\n\nसमस्याचे शीर्षक काय आहे?\n\n_उदाहरण: तुटलेला रस्ता दिवा, रस्त्याचे नुकसान, इ._' :
                        '📝 *क्षेत्र समस्या रिपोर्ट करें*\n\nसमस्या का शीर्षक क्या है?\n\n_उदाहरण: टूटी हुई स्ट्रीटलाइट, सड़क क्षति, आदि।_';
                await sock.sendMessage(userId, { text: titlePrompt });
                return;

            case '2': // View Ward Issues
                try {
                    const problems = await this.store.getAreaProblems(tenantId, 'Pending', 5);
                    let problemsText = lang === 'en' ? '🚨 *Area Problems (Pending)*\n\n' :
                        lang === 'mr' ? '🚨 *क्षेत्र समस्या (प्रलंबित)*\n\n' :
                            '🚨 *क्षेत्र समस्याएं (लंबित)*\n\n';

                    if (problems.length === 0) {
                        problemsText += lang === 'en' ? 'No pending problems reported.' :
                            lang === 'mr' ? 'कोणत्याही प्रलंबित समस्या नोंदविल्या नाहीत.' :
                                'कोई लंबित समस्या नहीं';
                    } else {
                        problems.forEach((problem, idx) => {
                            const date = new Date(problem.created_at).toLocaleDateString();
                            problemsText += `${idx + 1}. *${problem.title}*\n`;
                            problemsText += `   ${problem.description.substring(0, 60)}...\n`;
                            problemsText += `   📅 ${date} | 📍 ${problem.location || 'N/A'}\n\n`;
                        });
                    }

                    await sock.sendMessage(userId, { text: problemsText });
                } catch (error) {
                    console.error('Error fetching area problems:', error);
                    const errMsg = lang === 'en' ? 'Error fetching problems.' :
                        lang === 'mr' ? 'समस्या आणण्यात त्रुटी.' : 'समस्याएं प्राप्त करने में त्रुटि।';
                    await sock.sendMessage(userId, { text: errMsg });
                }
                break;

            case '3': // Resolved Problems  
                try {
                    const resolved = await this.store.getAreaProblems(tenantId, 'Resolved', 5);
                    let resolvedText = lang === 'en' ? '✅ *Resolved Area Problems*\n\n' :
                        lang === 'mr' ? '✅ *निराकरण झालेल्या समस्या*\n\n' :
                            '✅ *हल की गई समस्याएं*\n\n';

                    if (resolved.length === 0) {
                        resolvedText += lang === 'en' ? 'No resolved problems yet.' :
                            lang === 'mr' ? 'अद्याप कोणत्याही समस्या सोडवल्या नाहीत.' :
                                'अभी तक कोई समस्या हल नहीं हुई।';
                    } else {
                        resolved.forEach((problem, idx) => {
                            const date = new Date(problem.resolved_at).toLocaleDateString();
                            resolvedText += `${idx + 1}. *${problem.title}*\n`;
                            resolvedText += `   ✓ Resolved on ${date}\n\n`;
                        });
                    }

                    await sock.sendMessage(userId, { text: resolvedText });
                } catch (error) {
                    console.error('Error fetching resolved problems:', error);
                }
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

        // Fetch contact info from database
        const config = await this.store.getContactInfo(tenantId);

        // Extract data with fallbacks
        const nameEn = config.nagarsevak_name_english || 'Nagarsevak';
        const nameMr = config.nagarsevak_name_marathi || 'नगरसेवक';
        const ward = config.ward_name || config.ward_number || 'N/A';
        const office_phone = config.office_phone || 'Not Available';
        const mobile = config.mobile || 'Not Available';
        const email = config.email || 'Not Available';
        const office_address = config.office_address || 'Ward Office';
        const office_hours = config.office_hours || 'Monday - Friday: 10 AM - 5 PM';

        let contactText = '';

        switch (input) {
            case '1': // Office Address
                contactText = lang === 'en' ? `🏢 *Office Address*\n\n${office_address}\nWard: ${ward}` :
                    lang === 'mr' ? `🏢 *कार्यालय पत्ता*\n\n${office_address}\nप्रभाग: ${ward}` :
                        `🏢 *कार्यालय पता*\n\n${office_address}\nवार्ड: ${ward}`;
                break;
            case '2': // Office Hours
                contactText = lang === 'en' ? `⏰ *Office Hours*\n\n${office_hours}` :
                    lang === 'mr' ? `⏰ *कार्यालय वेळ*\n\n${office_hours}` :
                        `⏰ *कार्यालय समय*\n\n${office_hours}`;
                break;
            case '3': // Phone Numbers
                contactText = lang === 'en' ? `📞 *Contact Numbers*\n\nNagarsevak: ${nameEn}\nMobile: ${mobile}\nOffice: ${office_phone}` :
                    lang === 'mr' ? `📞 *संपर्क क्रमांक*\n\nनगरसेवक: ${nameMr}\nमोबाइल: ${mobile}\nकार्यालय: ${office_phone}` :
                        `📞 *संपर्क नंबर*\n\nनगरसेवक: ${nameEn}\nमोबाइल: ${mobile}\nकार्यालय: ${office_phone}`;
                break;
            case '4': // Email
                contactText = lang === 'en' ? `📧 *Email Address*\n\n${email}` :
                    lang === 'mr' ? `📧 *ईमेल पत्ता*\n\n${email}` :
                        `📧 *ईमेल पता*\n\n${email}`;
                break;
            case '5': // Social Media
                const facebook = config.facebook || '/NagarsevakOfficial';
                const twitter = config.twitter || '@nagarsevak';
                const instagram = config.instagram || '@nagarsevak';
                contactText = lang === 'en' ? `📱 *Follow Us*\n\nFacebook: ${facebook}\nTwitter: ${twitter}\nInstagram: ${instagram}` :
                    lang === 'mr' ? `📱 *आम्हाला फॉलो करा*\n\nFacebook: ${facebook}\nTwitter: ${twitter}\nInstagram: ${instagram}` :
                        `📱 *हमें फॉलो करें*\n\nFacebook: ${facebook}\nTwitter: ${twitter}\nInstagram: ${instagram}`;
                break;
            default:
                const errorMsg = MESSAGES.invalid_option[lang] + '\n\n' + MENUS.contact[lang].text;
                await sock.sendMessage(userId, { text: errorMsg });
                return;
        }

        if (contactText) {
            await sock.sendMessage(userId, { text: contactText });
        }

        await this.showContactMenu(sock, userId, lang);
    }

    /**
     * Other Services Menu
     */
    /**
     * Letters/Documents Menu
     */
    async showLettersMenu(sock, userId, lang, tenantId) {
        const session = this.getSession(userId);
        session.currentMenu = MENU_STATES.LETTER_TYPE_SELECT;

        // Fetch letter types from database
        const letterTypes = await this.store.getLetterTypes(tenantId);

        if (!letterTypes || letterTypes.length === 0) {
            const noTypes = lang === 'en' ? '\u274c No letter types configured. Please contact the office.' :
                lang === 'mr' ? '\u274c \u092a\u0924\u094d\u0930 \u092a\u094d\u0930\u0915\u093e\u0930 \u0938\u0902\u0930\u091a\u093f\u0924 \u0928\u093e\u0939\u0940\u0924. \u0915\u0943\u092a\u092f\u093e \u0915\u093e\u0930\u094d\u092f\u093e\u0932\u092f\u093e\u0936\u0940 \u0938\u0902\u092a\u0930\u094d\u0915 \u0938\u093e\u0927\u093e.' :
                    '\u274c \u0915\u094b\u0908 \u092a\u0924\u094d\u0930 \u092a\u094d\u0930\u0915\u093e\u0930 \u0915\u0949\u0928\u094d\u092b\u093c\u093f\u0917\u0930 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964 \u0915\u0943\u092a\u092f\u093e \u0915\u093e\u0930\u094d\u092f\u093e\u0932\u092f \u0938\u0947 \u0938\u0902\u092a\u0930\u094d\u0915 \u0915\u0930\u0947\u0902\u0964';
            await sock.sendMessage(userId, { text: noTypes });
            await this.showMainMenu(sock, userId, lang);
            return;
        }

        // Store letter types in session for later reference
        session.letterTypes = letterTypes;

        // Build menu text
        let menuText = lang === 'en' ? '\ud83d\udcc4 *Letter Request*\\n\\nSelect the type of letter you need:\\n\\n' :
            lang === 'mr' ? '\ud83d\udcc4 *\u092a\u0924\u094d\u0930 \u0935\u093f\u0928\u0902\u0924\u0940*\\n\\n\u0924\u0941\u092e\u094d\u0939\u093e\u0932\u093e \u0906\u0935\u0936\u094d\u092f\u0915 \u0905\u0938\u0932\u0947\u0932\u0947 \u092a\u0924\u094d\u0930 \u092a\u094d\u0930\u0915\u093e\u0930 \u0928\u093f\u0935\u0921\u093e:\\n\\n' :
                '\ud83d\udcc4 *\u092a\u0924\u094d\u0930 \u0905\u0928\u0941\u0930\u094b\u0927*\\n\\n\u0906\u0935\u0936\u094d\u092f\u0915 \u092a\u0924\u094d\u0930 \u092a\u094d\u0930\u0915\u093e\u0930 \u091a\u0941\u0928\u0947\u0902:\\n\\n';

        letterTypes.forEach((type, index) => {
            const displayName = (lang === 'mr' && type.name_marathi) ? type.name_marathi : type.name;
            menuText += `${index + 1}\ufe0f\u20e3 ${displayName}\\n`;
        });

        menuText += lang === 'en' ? '\\n9\ufe0f\u20e3 Main Menu\\n\\n_Reply with a number_' :
            lang === 'mr' ? '\\n9\ufe0f\u20e3 \u092e\u0941\u0916\u094d\u092f \u092e\u0947\u0928\u0942\\n\\n_\u0915\u0943\u092a\u092f\u093e \u0915\u094d\u0930\u092e\u093e\u0902\u0915 \u0928\u093f\u0935\u0921\u093e_' :
                '\\n9\ufe0f\u20e3 \u092e\u0941\u0916\u094d\u092f \u092e\u0947\u0928\u0942\\n\\n_\u0915\u0943\u092a\u092f\u093e \u0928\u0902\u092c\u0930 \u091a\u0941\u0928\u0947\u0902_';

        await sock.sendMessage(userId, { text: menuText });
    }

    async handleLetterTypeSelect(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        const index = parseInt(input) - 1;
        if (index >= 0 && index < session.letterTypes.length) {
            const selectedType = session.letterTypes[index];
            session.letterFormData = {
                type: selectedType.name,
                typeName: (lang === 'mr' && selectedType.name_marathi) ? selectedType.name_marathi : selectedType.name
            };

            session.currentMenu = MENU_STATES.LETTER_FORM_NAME;
            const namePrompt = lang === 'en' ? '\ud83d\udcdd Please enter your full name (First Middle Last):' :
                lang === 'mr' ? '\ud83d\udcdd\u0915\u0943\u092a\u092f\u093e \u0924\u0941\u092e\u091a\u0947 \u092a\u0942\u0930\u094d\u0923 \u0928\u093e\u0935 \u092a\u094d\u0930\u0935\u093f\u0937\u094d\u091f \u0915\u0930\u093e (\u0928\u093e\u0935 \u092e\u0927\u094d\u092f\u0932\u0947 \u0928\u093e\u0935 \u0906\u0921\u0928\u093e\u0935):' :
                    '\ud83d\udcdd \u0915\u0943\u092a\u092f\u093e \u0905\u092a\u0928\u093e \u092a\u0942\u0930\u093e \u0928\u093e\u092e \u0926\u0930\u094d\u091c \u0915\u0930\u0947\u0902 (\u092a\u0939\u0932\u093e \u092e\u0927\u094d\u092f \u0905\u0902\u0924\u093f\u092e):';
            await sock.sendMessage(userId, { text: namePrompt });
        } else {
            const errorMsg = MESSAGES.invalid_option[lang];
            await sock.sendMessage(userId, { text: errorMsg });
        }
    }

    async handleLetterFormName(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        session.letterFormData.name = input.trim();
        session.currentMenu = MENU_STATES.LETTER_FORM_MOBILE;

        const mobilePrompt = lang === 'en' ? '\ud83d\udcf1 Please enter your mobile number (10 digits):' :
            lang === 'mr' ? '\ud83d\udcf1 \u0915\u0943\u092a\u092f\u093e \u0924\u0941\u092e\u091a\u093e \u092e\u094b\u092c\u093e\u0907\u0932 \u0928\u0902\u092c\u0930 \u092a\u094d\u0930\u0935\u093f\u0937\u094d\u091f \u0915\u0930\u093e (\u0967\u0966 \u0905\u0902\u0915):' :
                '\ud83d\udcf1 \u0915\u0943\u092a\u092f\u093e \u0905\u092a\u0928\u093e \u092e\u094b\u092c\u093e\u0907\u0932 \u0928\u0902\u092c\u0930 \u0926\u0930\u094d\u091c \u0915\u0930\u0947\u0902 (10 \u0905\u0902\u0915):';
        await sock.sendMessage(userId, { text: mobilePrompt });
    }

    async handleLetterFormMobile(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        const mobile = input.trim().replace(/\D/g, '');
        if (mobile.length !== 10) {
            const invalidMsg = lang === 'en' ? '\u274c Invalid mobile number. Please enter 10 digits.' :
                lang === 'mr' ? '\u274c \u091a\u0941\u0915\u0940\u091a\u093e \u092e\u094b\u092c\u093e\u0907\u0932 \u0928\u0902\u092c\u0930. \u0915\u0943\u092a\u092f\u093e \u0967\u0966 \u0905\u0902\u0915 \u092a\u094d\u0930\u0935\u093f\u0937\u094d\u091f \u0915\u0930\u093e.' :
                    '\u274c \u0905\u092e\u093e\u0928\u094d\u092f \u092e\u094b\u092c\u093e\u0907\u0932 \u0928\u0902\u092c\u0930\u0964 \u0915\u0943\u092a\u092f\u093e 10 \u0905\u0902\u0915 \u0926\u0930\u094d\u091c \u0915\u0930\u0947\u0902\u0964';
            await sock.sendMessage(userId, { text: invalidMsg });
            return;
        }

        session.letterFormData.mobile = mobile;
        session.currentMenu = MENU_STATES.LETTER_FORM_ADDRESS;

        const addressPrompt = lang === 'en' ? '🏠 Please enter your full address:' :
            lang === 'mr' ? '🏠 कृपया तुमचा पूर्ण पत्ता प्रविष्ट करा:' :
                '🏠 कृपया अपना पूरा पता दर्ज करें:';
        await sock.sendMessage(userId, { text: addressPrompt });
    }

    async handleLetterFormAddress(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        session.letterFormData.address = input.trim();
        session.currentMenu = MENU_STATES.LETTER_FORM_PURPOSE;

        const purposePrompt = lang === 'en' ? '\ud83c\udfaf What is the purpose of this letter?\\n\\n_Example: For bank loan, school admission, etc._' :
            lang === 'mr' ? '\ud83c\udfaf \u092f\u093e \u092a\u0924\u094d\u0930\u093e\u091a\u093e \u0909\u0926\u094d\u0926\u0947\u0936 \u0915\u093e\u092f?\\n\\n_\u0909\u0926\u093e\u0939\u0930\u0923: \u092c\u0901\u0915 \u0915\u0930\u094d\u091c, \u0936\u093e\u0933\u093e \u092a\u094d\u0930\u0935\u0947\u0936 \u0907._' :
                '\ud83c\udfaf \u0907\u0938 \u092a\u0924\u094d\u0930 \u0915\u093e \u0909\u0926\u094d\u0926\u0947\u0936\u094d\u092f \u0915\u094d\u092f\u093e \u0939\u0948?\\n\\n_\u0909\u0926\u093e\u0939\u0930\u0923: \u092c\u0948\u0902\u0915 \u0932\u094b\u0928, \u0938\u094d\u0915\u0942\u0932 \u092a\u094d\u0930\u0935\u0947\u0936 \u0906\u0926\u093f\u0964_';
        await sock.sendMessage(userId, { text: purposePrompt });
    }

    async handleLetterFormPurpose(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        session.letterFormData.purpose = input.trim();

        // Submit the letter request
        try {
            const letterRequest = {
                user_id: userId.replace('@s.whatsapp.net', ''),
                tenant_id: tenantId,
                type: session.letterFormData.type,
                area: '', // Optional
                details: {
                    name: session.letterFormData.name,
                    mobile: session.letterFormData.mobile,
                    text: session.letterFormData.address,
                    purpose: session.letterFormData.purpose
                },
                status: 'Pending'
            };

            const result = await this.store.saveLetterRequest(letterRequest);

            if (result) {
                const successMsg = lang === 'en' ? `\u2705 *Letter Request Submitted!*\\n\\nType: ${session.letterFormData.typeName}\\nName: ${session.letterFormData.name}\\nMobile: ${session.letterFormData.mobile}\\n\\nYour request has been sent to the office for approval. You will be notified once it's ready.` :
                    lang === 'mr' ? `\u2705 *\u092a\u0924\u094d\u0930 \u0935\u093f\u0928\u0902\u0924\u0940 \u0938\u093e\u0926\u0930 \u0915\u0947\u0932\u0940!*\\n\\n\u092a\u094d\u0930\u0915\u093e\u0930: ${session.letterFormData.typeName}\\n\u0928\u093e\u0935: ${session.letterFormData.name}\\n\u092e\u094b\u092c\u093e\u0907\u0932: ${session.letterFormData.mobile}\\n\\n\u0924\u0941\u092e\u091a\u0940 \u0935\u093f\u0928\u0902\u0924\u0940 \u092e\u0902\u091c\u0942\u0930\u0940\u0938\u093e\u0920\u0940 \u0915\u093e\u0930\u094d\u092f\u093e\u0932\u092f\u093e\u0924 \u092a\u093e\u0920\u0935\u0932\u0940 \u0906\u0939\u0947. \u0924\u092f\u093e\u0930 \u091d\u093e\u0932\u094d\u092f\u093e\u0935\u0930 \u0924\u0941\u092e\u094d\u0939\u093e\u0932\u093e \u0938\u0942\u091a\u093f\u0924 \u0915\u0947\u0932\u0947 \u091c\u093e\u0908\u0932.` :
                        `\u2705 *\u092a\u0924\u094d\u0930 \u0905\u0928\u0941\u0930\u094b\u0927 \u091c\u092e\u093e \u0915\u093f\u092f\u093e \u0917\u092f\u093e!*\\n\\n\u092a\u094d\u0930\u0915\u093e\u0930: ${session.letterFormData.typeName}\\n\u0928\u093e\u092e: ${session.letterFormData.name}\\n\u092e\u094b\u092c\u093e\u0907\u0932: ${session.letterFormData.mobile}\\n\\n\u0906\u092a\u0915\u093e \u0905\u0928\u0941\u0930\u094b\u0927 \u0915\u093e\u0930\u094d\u092f\u093e\u0932\u092f \u0915\u094b \u092e\u0902\u091c\u0942\u0930\u0940 \u0915\u0947 \u0932\u093f\u090f \u092d\u0947\u091c\u093e \u0917\u092f\u093e \u0939\u0948\u0964 \u0924\u0948\u092f\u093e\u0930 \u0939\u094b\u0928\u0947 \u092a\u0930 \u0906\u092a\u0915\u094b \u0938\u0942\u091a\u093f\u0924 \u0915\u093f\u092f\u093e \u091c\u093e\u090f\u0917\u093e\u0964`;
                await sock.sendMessage(userId, { text: successMsg });
            }

            // Clear form data
            delete session.letterFormData;
            delete session.letterTypes;

            // Return to main menu
            await this.showMainMenu(sock, userId, lang);

        } catch (error) {
            console.error('Error saving letter request:', error);
            const errorMsg = lang === 'en' ? '\u274c Failed to submit letter request. Please try again later.' :
                lang === 'mr' ? '\u274c \u092a\u0924\u094d\u0930 \u0935\u093f\u0928\u0902\u0924\u0940 \u0938\u093e\u0926\u0930 \u0915\u0930\u0923\u094d\u092f\u093e\u0924 \u0905\u092f\u0936\u0938\u094d\u0935\u0940. \u0915\u0943\u092a\u092f\u093e \u092a\u0941\u0928\u094d\u0939\u093e \u092a\u094d\u0930\u092f\u0924\u094d\u0928 \u0915\u0930\u093e.' :
                    '\u274c \u092a\u0924\u094d\u0930 \u0905\u0928\u0941\u0930\u094b\u0927 \u091c\u092e\u093e \u0915\u0930\u0928\u0947 \u092e\u0947\u0902 \u0935\u093f\u092b\u0932\u0964 \u0915\u0943\u092a\u092f\u093e \u092c\u093e\u0926 \u092e\u0947\u0902 \u092a\u0941\u0928: \u092a\u094d\u0930\u092f\u093e\u0938 \u0915\u0930\u0947\u0902\u0964';
            await sock.sendMessage(userId, { text: errorMsg });
            await this.showMainMenu(sock, userId, lang);
        }
    }

    /**
     * Area Problem Report Form Handlers
     */
    async handleAreaProblemTitle(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        session.areaFormData.title = input.trim();
        session.currentMenu = MENU_STATES.AREA_PROBLEM_FORM_DESCRIPTION;

        const descPrompt = lang === 'en' ? '📄 Please describe the problem in detail:' :
            lang === 'mr' ? '📄 कृपया समस्याचे तपशीलवार वर्णन करा:' :
                '📄 कृपया समस्या का विस्तार से वर्णन करें:';
        await sock.sendMessage(userId, { text: descPrompt });
    }

    async handleAreaProblemDescription(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        session.areaFormData.description = input.trim();
        session.currentMenu = MENU_STATES.AREA_PROBLEM_FORM_LOCATION;

        const locPrompt = lang === 'en' ? '📍 Where is this problem located?\n\n_Example: Near bus stand, Main road, etc._' :
            lang === 'mr' ? '📍 ही समस्या कुठे आहे?\n\n_उदाहरण: बस स्थानकाजवळ, मुख्य रस्ता, इ._' :
                '📍 यह समस्या कहाँ है?\n\n_उदाहरण: बस स्टैंड के पास, मुख्य सड़क, आदि।_';
        await sock.sendMessage(userId, { text: locPrompt });
    }

    async handleAreaProblemLocation(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        session.areaFormData.location = input.trim();

        // Submit the area problem
        try {
            const problemData = {
                tenant_id: tenantId,
                user_id: userId.replace('@s.whatsapp.net', ''),
                title: session.areaFormData.title,
                description: session.areaFormData.description,
                location: session.areaFormData.location,
                status: 'Pending'
            };

            const result = await this.store.reportAreaProblem(problemData);

            if (result) {
                const successMsg = lang === 'en' ? `✅ *Area Problem Reported!*\n\nTitle: ${session.areaFormData.title}\nLocation: ${session.areaFormData.location}\n\nYour report has been submitted and will be reviewed by the office. Thank you for helping improve our ward!` :
                    lang === 'mr' ? `✅ *क्षेत्र समस्या नोंदविली!*\n\nशीर्षक: ${session.areaFormData.title}\nस्थान: ${session.areaFormData.location}\n\nतुमचा अहवाल सादर करण्यात आला आहे आणि कार्यालयाद्वारे त्याचे पुनरावलोकन केले जाईल. आमच्या प्रभागाला सुधारण्यात मदत केल्याबद्दल धन्यवाद!` :
                        `✅ *क्षेत्र समस्या रिपोर्ट की गई!*\n\nशीर्षक: ${session.areaFormData.title}\nस्थान: ${session.areaFormData.location}\n\nआपकी रिपोर्ट जमा कर दी गई है और कार्यालय द्वारा इसकी समीक्षा की जाएगी। हमारे वार्ड को बेहतर बनाने में मदद के लिए धन्यवाद!`;
                await sock.sendMessage(userId, { text: successMsg });
            }

            // Clear form data
            delete session.areaFormData;

            // Return to main menu
            await this.showMainMenu(sock, userId, lang);

        } catch (error) {
            console.error('Error reporting area problem:', error);
            const errorMsg = lang === 'en' ? '❌ Failed to submit report. Please try again later.' :
                lang === 'mr' ? '❌ अहवाल सादर करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.' :
                    '❌ रिपोर्ट जमा करने में विफल। कृपया बाद में पुनः प्रयास करें।';
            await sock.sendMessage(userId, { text: errorMsg });
            await this.showMainMenu(sock, userId, lang);
        }
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
