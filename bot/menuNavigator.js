const { MENUS, MESSAGES, PERSONAL_REQUEST_MENU } = require('./menus');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { createClient } = require('@supabase/supabase-js');
const { SURVEY_MENU_STATE, handleSurveyReply } = require('./surveyBot');
const { politicianBotService, POLITICIAN_STATES } = require('./politicianBotService');

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
    LETTER_FORM_GENDER: 'LETTER_FORM_GENDER',
    LETTER_FORM_MOBILE: 'LETTER_FORM_MOBILE',
    LETTER_FORM_ADDRESS: 'LETTER_FORM_ADDRESS',
    LETTER_FORM_PURPOSE: 'LETTER_FORM_PURPOSE',
    LETTER_FORM_DYNAMIC: 'LETTER_FORM_DYNAMIC',
    AREA_PROBLEM_MENU: 'AREA_PROBLEM_MENU',
    AREA_PROBLEM_REPORT: 'AREA_PROBLEM_REPORT',
    AREA_PROBLEM_FORM_TITLE: 'AREA_PROBLEM_FORM_TITLE',
    AREA_PROBLEM_FORM_DESCRIPTION: 'AREA_PROBLEM_FORM_DESCRIPTION',
    AREA_PROBLEM_FORM_LOCATION: 'AREA_PROBLEM_FORM_LOCATION',
    AREA_PROBLEM_FORM_NAME: 'AREA_PROBLEM_FORM_NAME',
    AREA_PROBLEM_FORM_MOBILE: 'AREA_PROBLEM_FORM_MOBILE',
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
    SCHEME_QUESTION_AGE: 'SCHEME_QUESTION_AGE',
    SCHEME_QUESTION_GENDER: 'SCHEME_QUESTION_GENDER',
    SCHEME_QUESTION_CATEGORY: 'SCHEME_QUESTION_CATEGORY',
    PERSONAL_REQUEST_MENU: 'PERSONAL_REQUEST_MENU',
    PERSONAL_REQUEST_FORM_NAME: 'PERSONAL_REQUEST_FORM_NAME',
    PERSONAL_REQUEST_FORM_MOBILE: 'PERSONAL_REQUEST_FORM_MOBILE',
    PERSONAL_REQUEST_FORM_DESC: 'PERSONAL_REQUEST_FORM_DESC',
    PERSONAL_REQUEST_TRACK_MOBILE: 'PERSONAL_REQUEST_TRACK_MOBILE',
    VOTER_VERIFY_NAME_PROMPT: 'VOTER_VERIFY_NAME_PROMPT',
    VOTER_VERIFY_CONFIRM: 'VOTER_VERIFY_CONFIRM',
    VOTER_REGISTER_NAME: 'VOTER_REGISTER_NAME',
    VOTER_REGISTER_WARD: 'VOTER_REGISTER_WARD',
    COMPLAINT_VOTER_VERIFY: 'COMPLAINT_VOTER_VERIFY',
    PERSONAL_REQUEST_VOTER_VERIFY: 'PERSONAL_REQUEST_VOTER_VERIFY',
    LETTER_VOTER_VERIFY: 'LETTER_VOTER_VERIFY',
    AREA_PROBLEM_VOTER_VERIFY: 'AREA_PROBLEM_VOTER_VERIFY',
    VOTER_PROFILE_UPDATE_MENU: 'VOTER_PROFILE_UPDATE_MENU',
    VOTER_UPDATE_MOBILE_VAL: 'VOTER_UPDATE_MOBILE_VAL',
    VOTER_UPDATE_ADDRESS_VAL: 'VOTER_UPDATE_ADDRESS_VAL',
    // Staff Task Management
    STAFF_TASK_DATE_ESTIMATE: 'STAFF_TASK_DATE_ESTIMATE',
    // Survey Conversation
    SURVEY_IN_PROGRESS: 'SURVEY_IN_PROGRESS'
};

class MenuNavigator {
    constructor(store) {
        this.store = store;
        this.userSessions = {}; // Instance-level sessions
    }

    /**
     * Get or create user session
     */
    getSession(userId) {
        if (!this.userSessions[userId]) {
            this.userSessions[userId] = {
                language: null,
                currentMenu: MENU_STATES.LANGUAGE_SELECTION,
                previousMenu: null,
                formData: {}
            };
        }
        return this.userSessions[userId];
    }

    formatTimeTo12hr(timeStr) {
        if (!timeStr) return '';
        try {
            const parts = timeStr.split(':');
            if (parts.length < 2) return timeStr;
            let h = parseInt(parts[0]);
            const m = parts[1];
            const ampm = h >= 12 ? ' PM' : ' AM';
            h = h % 12;
            h = h ? h : 12;
            return `${h}:${m}${ampm}`;
        } catch (e) {
            return timeStr;
        }
    }

    /**
     * Main message handler
     */
    async handleMessage(sock, tenantId, userId, userName, messageText, msg = null) {
        const session = this.getSession(userId);
        const input = messageText.trim();

        // Check for global navigation commands
        // Check for global navigation commands
        // Exception: 0 is used to skip photo in COMPLAINT_FORM_PHOTO
        if (input === '0' && session.currentMenu !== MENU_STATES.COMPLAINT_FORM_PHOTO) {
            // Change language
            return await this.showLanguageMenu(sock, userId);
        }

        // Check for Staff Completion Command
        if (await this.handleStaffCompletionCommand(sock, tenantId, userId, input)) {
            return;
        }

        // --- Politician / Office Admin Auto-Detection & Routing ---
        const polAuth = await politicianBotService.isPolitician(tenantId, userId);
        if (polAuth && polAuth.isPolitician) {
            const polSession = politicianBotService.getSession(userId);

            // Check if politician explicitly requested to switch mode
            if (input.toUpperCase() === 'CITIZEN' || input.toUpperCase() === 'CITIZEN_MODE') {
                polSession.mode = 'citizen';
                await sock.sendMessage(userId, {
                    text: `🔄 *नागरिक मोड सुरू झाला आहे.*\n\nतुम्ही आता सामान्य नागरिकांप्रमाणे बॉट वापरू शकता.\n\nपुन्हा नगरसेवक ॲडमिन पोर्टलवर जाण्यासाठी *ADMIN* टाईप करा.`
                });
                return await this.showMainMenu(sock, userId, session.language || 'mr');
            }

            if (input.toUpperCase() === 'ADMIN' || input.toUpperCase() === 'POLITICIAN' || input.toUpperCase() === 'SAHEB') {
                polSession.mode = 'admin';
                return await politicianBotService.showPoliticianMainMenu(sock, tenantId, userId, polSession.language || session.language || 'mr');
            }

            // If in admin mode, route to Politician Bot Service
            if (polSession.mode !== 'citizen') {
                if (session.language) polSession.language = session.language;

                const handledResult = await politicianBotService.handlePoliticianMessage(sock, tenantId, userId, input, polAuth.politicianInfo);
                if (handledResult && handledResult.handled) {
                    return;
                }
            }
        }

        if (input === '9' && session.currentMenu !== MENU_STATES.MAIN_MENU) {
            // Go back to main menu
            return await this.showMainMenu(sock, userId, session.language);
        }

        // Route to appropriate handler based on current state
        switch (session.currentMenu) {
            case MENU_STATES.LANGUAGE_SELECTION:
                return await this.handleLanguageSelection(sock, userId, userName, input, tenantId);

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

            case MENU_STATES.PERSONAL_REQUEST_MENU:
                return await this.handlePersonalRequestMenu(sock, tenantId, userId, input);

            case MENU_STATES.PERSONAL_REQUEST_FORM_NAME:
                return await this.handlePersonalRequestName(sock, tenantId, userId, input);

            case MENU_STATES.PERSONAL_REQUEST_FORM_MOBILE:
                return await this.handlePersonalRequestMobile(sock, tenantId, userId, input);

            case MENU_STATES.PERSONAL_REQUEST_FORM_DESC:
                return await this.handlePersonalRequestDesc(sock, tenantId, userId, input);

            case MENU_STATES.PERSONAL_REQUEST_TRACK_MOBILE:
                return await this.handlePersonalRequestTrackMobile(sock, tenantId, userId, input);

            case MENU_STATES.COMPLAINT_FORM_DESCRIPTION:
                return await this.handleComplaintFormDescription(sock, tenantId, userId, input);

            case MENU_STATES.COMPLAINT_FORM_LOCATION:
                return await this.handleComplaintFormLocation(sock, tenantId, userId, input);

            case MENU_STATES.COMPLAINT_FORM_PHOTO:
                return await this.handleComplaintFormPhoto(sock, tenantId, userId, input, msg);

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

            case MENU_STATES.SCHEME_QUESTION_AGE:
                return await this.handleSchemeQuestionAge(sock, tenantId, userId, input);

            case MENU_STATES.SCHEME_QUESTION_GENDER:
                return await this.handleSchemeQuestionGender(sock, tenantId, userId, input);

            case MENU_STATES.SCHEME_QUESTION_CATEGORY:
                return await this.handleSchemeQuestionCategory(sock, tenantId, userId, input);

            case MENU_STATES.LETTER_TYPE_SELECT:
                return await this.handleLetterTypeSelect(sock, tenantId, userId, input);

            case MENU_STATES.LETTER_FORM_NAME:
                return await this.handleLetterFormName(sock, tenantId, userId, input);

            case MENU_STATES.LETTER_FORM_MOBILE:
                return await this.handleLetterFormMobile(sock, tenantId, userId, input);

            case MENU_STATES.LETTER_FORM_GENDER:
                return await this.handleLetterFormGender(sock, tenantId, userId, input);

            case MENU_STATES.LETTER_FORM_ADDRESS:
                return await this.handleLetterFormAddress(sock, tenantId, userId, input);

            case MENU_STATES.LETTER_FORM_PURPOSE:
                return await this.handleLetterFormPurpose(sock, tenantId, userId, input);

            case MENU_STATES.LETTER_FORM_DYNAMIC:
                return await this.handleLetterFormDynamic(sock, tenantId, userId, input);


            case MENU_STATES.AREA_PROBLEM_FORM_NAME:
                return await this.handleAreaProblemName(sock, tenantId, userId, input);

            case MENU_STATES.AREA_PROBLEM_FORM_MOBILE:
                return await this.handleAreaProblemMobile(sock, tenantId, userId, input);

            case MENU_STATES.AREA_PROBLEM_FORM_TITLE:
                return await this.handleAreaProblemTitle(sock, tenantId, userId, input);

            case MENU_STATES.AREA_PROBLEM_FORM_DESCRIPTION:
                return await this.handleAreaProblemDescription(sock, tenantId, userId, input);

            case MENU_STATES.AREA_PROBLEM_FORM_LOCATION:
                return await this.handleAreaProblemLocation(sock, tenantId, userId, input);

            case MENU_STATES.VOTER_VERIFY_NAME_PROMPT:
                return await this.handleVoterVerifyName(sock, tenantId, userId, input);

            case MENU_STATES.VOTER_VERIFY_CONFIRM:
                return await this.handleVoterVerifyConfirm(sock, tenantId, userId, input);

            case MENU_STATES.VOTER_REGISTER_NAME:
                return await this.handleVoterRegisterName(sock, tenantId, userId, input);

            case MENU_STATES.VOTER_REGISTER_WARD:
                return await this.handleVoterRegisterWard(sock, tenantId, userId, input);

            case MENU_STATES.COMPLAINT_VOTER_VERIFY:
                return await this.handleComplaintVoterVerify(sock, tenantId, userId, input);

            case MENU_STATES.PERSONAL_REQUEST_VOTER_VERIFY:
                return await this.handlePersonalRequestVoterVerify(sock, tenantId, userId, input);

            case MENU_STATES.LETTER_VOTER_VERIFY:
                return await this.handleLetterVoterVerify(sock, tenantId, userId, input);

            case MENU_STATES.AREA_PROBLEM_VOTER_VERIFY:
                return await this.handleAreaProblemVoterVerify(sock, tenantId, userId, input);

            case MENU_STATES.VOTER_PROFILE_UPDATE_MENU:
                return await this.handleVoterProfileUpdateMenu(sock, tenantId, userId, input);

            case MENU_STATES.VOTER_UPDATE_MOBILE_VAL:
                return await this.handleVoterUpdateMobileVal(sock, tenantId, userId, input);

            case MENU_STATES.VOTER_UPDATE_ADDRESS_VAL:
                return await this.handleVoterUpdateAddressVal(sock, tenantId, userId, input);

            case MENU_STATES.STAFF_TASK_DATE_ESTIMATE:
                return await this.handleStaffTaskDateEstimate(sock, tenantId, userId, input);

            case MENU_STATES.SURVEY_IN_PROGRESS:
                return await handleSurveyReply(sock, userId, session, input);

            default:
                // Check if this is a reply to a pending task (Staff Date Estimate)
                // This makes the bot stateless/robust against restarts
                const pendingTask = await this.findPendingStaffTask(sock, tenantId, userId);
                if (pendingTask) {
                    console.log(`[${tenantId}] Found pending task #${pendingTask.id} for staff ${userId}`);
                    // Restore session state
                    session.currentMenu = MENU_STATES.STAFF_TASK_DATE_ESTIMATE;
                    session.currentComplaintId = pendingTask.id;

                    // Process the input as the date
                    return await this.handleStaffTaskDateEstimate(sock, tenantId, userId, input);
                }

                // Fallback to language selection
                const errorMsg = MESSAGES.invalid_option[session.language || 'en'] || MESSAGES.invalid_option.en;
                // Only show invalid option if not a valid number for main menu (simplification)
                // await sock.sendMessage(userId, { text: errorMsg });

                // Show Main Menu by default instead of Language Validation for better UX
                return await this.showMainMenu(sock, userId, session.language || 'mr');
        }
    }

    /**
     * Find if this user is a staff member with a pending task (assigned but no date)
     */
    async findPendingStaffTask(sock, tenantId, userId) {
        try {
            const supabaseUrl = process.env.VITE_SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
            const supabase = createClient(supabaseUrl, supabaseKey);

            // 1. Get Staff ID from Mobile
            const cleanMobile = userId.replace('@s.whatsapp.net', '').replace(/^91/, '').slice(-10);

            // We need to find staff with this mobile. 
            // Staff table mobile might have 91 or not.
            const { data: staff, error: staffError } = await supabase
                .from('staff')
                .select('id')
                .eq('tenant_id', tenantId)
                .ilike('mobile', `%${cleanMobile}%`) // Robust match
                .limit(1)
                .single();

            if (staffError || !staff) return null;

            // 2. Find Pending Complaint
            // Status InProgress, Assigned to Staff, No Estimated Date
            const { data: complaint, error: taskError } = await supabase
                .from('complaints')
                .select('id')
                .eq('tenant_id', tenantId)
                .eq('assigned_to', staff.id)
                .is('estimated_completion_date', null)
                .neq('status', 'Resolved')
                .neq('status', 'Closed')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (taskError || !complaint) return null;

            return complaint;
        } catch (e) {
            console.error('Error finding pending task:', e);
            return null;
        }
    }

    /**
     * Handle Staff Assignment Notification
     */
    async handleStaffAssignment(sock, staffMobile, complaint, tenantId) {
        console.log(`[${tenantId}] Sending staff assignment to ${staffMobile}`);

        // Ensure mobile has country code
        let whatsappId = staffMobile.replace(/\D/g, '');
        if (whatsappId.length === 10) whatsappId = '91' + whatsappId;
        whatsappId = whatsappId + '@s.whatsapp.net';

        // Initialize session for staff
        const session = this.getSession(whatsappId);
        session.currentMenu = MENU_STATES.STAFF_TASK_DATE_ESTIMATE;
        session.currentComplaintId = complaint.id;

        // Log to debug "Invalid Option" issue
        console.log(`[${tenantId}] Set session for ${whatsappId}: menu=${session.currentMenu}, task=${complaint.id}`);

        // Complainant Name
        let complainantName = 'Anonymous';
        let complainantMobile = 'N/A';

        if (complaint.voter) {
            complainantName = complaint.voter.name_marathi || complaint.voter.name_english || 'Anonymous';
            complainantMobile = complaint.voter.mobile || 'N/A';
        } else if (complaint.description_meta) {
            try {
                const meta = JSON.parse(complaint.description_meta);
                if (meta.submitter_name) complainantName = meta.submitter_name;
                if (meta.submitter_mobile) complainantMobile = meta.submitter_mobile;
            } catch (e) { }
        }

        // Fallback if mobile is in reporter_mobile column (for PR/AP)
        if (complainantMobile === 'N/A' && complaint.voter?.mobile) {
            complainantMobile = complaint.voter.mobile;
        } else if (complainantMobile === 'N/A' && (complaint.reporter_mobile)) {
            complainantMobile = complaint.reporter_mobile;
        }

        // Dynamic Date Example
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

        const msg = `🛠️ *New Task Assigned*\n\n` +
            `🆔 *Ticket ID:* #${complaint.id}\n` +
            `📌 *Type:* ${complaint.category}\n` +
            `📝 *Description:* ${complaint.problem}\n` +
            `📍 *Location:* ${complaint.location || 'N/A'}\n` +
            `👤 *Complainant:* ${complainantName}\n` +
            `📞 *Mobile:* ${complainantMobile}\n\n` +
            `Please reply with the *estimated completion date* for this task (e.g., "Tomorrow", "2 days", "${dateStr}").`;

        await sock.sendMessage(whatsappId, { text: msg });
    }

    /**
     * Handle Staff Date Estimate Response
     */
    async handleStaffTaskDateEstimate(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const complaintId = session.currentComplaintId;

        if (!complaintId) {
            await sock.sendMessage(userId, { text: "❌ Error: No active task found. Reseting..." });
            return await this.showMainMenu(sock, userId, 'en');
        }

        // Save estimated date to DB
        // We need supabase client here. Since we don't have it explicitly injected in handleMessage,
        // we'll instantiate a lightweight one or assume this.store has one?
        // Actually, let's use the one from index.js if possible, but importing creates circular deps.
        // Best way: Use `this.store.updateComplaint` if it exists, or create a method in store.js
        // For now, let's assume `this.store.updateComplaint` exists or we mock it. 
        // Wait, looking at store.js in `bot/store.js` (implied), it has saveComplaint.
        // Let's assume we can add `updateComplaintRequest` to store.js.

        // Since I cannot modify store.js easily without seeing it, I'll use direct supabase call here if needed,
        // BUT better to add a method to `store.js` later. 
        // For now, let's try to update using a direct Supabase client inside the method as done in handleComplaintFormPhoto.

        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase
            .from('complaints')
            .update({ estimated_completion_date: input })
            .eq('id', complaintId);

        if (error) {
            console.error('Error updating estimated date:', error);
            await sock.sendMessage(userId, { text: "❌ Failed to save date. Please try again." });
            return;
        }

        const msg = `✅ *Date Saved*\n\n` +
            `The estimated completion date has been recorded.\n\n` +
            `When the work is done, please reply with:\n` +
            `*COMPLETE ${complaintId}*\n\n` +
            `(e.g., COMPLETE 123)`;

        await sock.sendMessage(userId, { text: msg });

        // Reset state to Main Menu but DO NOT show the menu text
        session.currentMenu = MENU_STATES.MAIN_MENU;

        // 4. Notify Complainant (Citizen) that work has started
        const { data: complaintData, error: fetchError } = await supabase
            .from('complaints')
            .select('*, staff:assigned_to(name, mobile)')
            .eq('id', complaintId)
            .single();

        if (complaintData) {
            let complainantMobile = null;
            // Robust Mobile Lookup (Same as Resolved Notification)
            if (complaintData.reporter_mobile && complaintData.reporter_mobile !== 'N/A') {
                complainantMobile = complaintData.reporter_mobile;
            } else if (complaintData.user_id && /^\d{10,15}$/.test(complaintData.user_id.replace(/\D/g, ''))) {
                complainantMobile = complaintData.user_id;
            }

            if (!complainantMobile && complaintData.description_meta) {
                try {
                    const meta = JSON.parse(complaintData.description_meta);
                    if (meta.submitter_mobile) complainantMobile = meta.submitter_mobile;
                    else if (meta.mobile) complainantMobile = meta.mobile;
                } catch (e) { }
            }

            // If still null, try voter
            if (!complainantMobile && complaintData.voter_id) {
                const { data: voter } = await supabase.from('voters').select('mobile').eq('id', complaintData.voter_id).single();
                if (voter) complainantMobile = voter.mobile;
            }

            if (complainantMobile) {
                let citizenId = complainantMobile.replace(/\D/g, '');
                if (citizenId.length === 10) citizenId = '91' + citizenId;
                citizenId = citizenId + '@s.whatsapp.net';

                // Determine Language
                let lang = 'mr'; // Default to Marathi
                const userSession = this.getSession(citizenId);
                if (userSession && userSession.language) {
                    lang = userSession.language;
                } else {
                    try {
                        const user = await this.store.getUser(citizenId);
                        if (user && user.language) lang = user.language;
                    } catch (e) { }
                }

                // Staff Details
                const staffName = complaintData.staff?.name || 'Staff';
                const staffMobile = complaintData.staff?.mobile || '';

                let citizenMsg = '';
                if (lang === 'mr') {
                    citizenMsg = `👷 *तक्रार अपडेट #${complaintId}*\n\n` +
                        `आमचे कर्मचारी *${staffName}* (📱 ${staffMobile}) यांनी तुमच्या विनंतीवर काम करण्यास सुरुवात केली आहे.\n` +
                        `📅 *अंदाजित पूर्णता:* ${input}\n\n` +
                        `सहकार्याबद्दल धन्यवाद!`;
                } else if (lang === 'hi') {
                    citizenMsg = `👷 *शिकायत अपडेट #${complaintId}*\n\n` +
                        `हमारे कर्मचारी *${staffName}* (📱 ${staffMobile}) ने आपके अनुरोध पर काम शुरू कर दिया है।\n` +
                        `📅 *अनुमानित पूर्णता:* ${input}\n\n` +
                        `आपके धैर्य के लिए धन्यवाद!`;
                } else {
                    citizenMsg = `👷 *Update on Ticket #${complaintId}*\n\n` +
                        `Our staff *${staffName}* (📱 ${staffMobile}) has started working on your request.\n` +
                        `📅 *Estimated Completion:* ${input}\n\n` +
                        `Thank you for your patience!`;
                }

                try {
                    await sock.sendMessage(citizenId, { text: citizenMsg });
                } catch (e) {
                    console.error('Failed to notify citizen:', e);
                }
            }
        }

        // return await this.showMainMenu(sock, userId, session.language || 'en');
        // Do nothing more, state is reset.
        return;
    }

    /**
     * Handle Global "COMPLETE <ID>" Command
     * (This needs to be called from handleMessage before switch case)
     */
    async handleStaffCompletionCommand(sock, tenantId, userId, input) {
        // Check if input starts with "COMPLETE" (case insensitive)
        const match = input.match(/^COMPLETE\s+(\d+)$/i);
        if (match) {
            const complaintId = match[1];

            const supabaseUrl = process.env.VITE_SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
            const supabase = createClient(supabaseUrl, supabaseKey);

            // 1. Verify if this user is the assigned staff
            // We need to fetch the staff ID from the mobile number first? 
            // Or just check if the complaint is assigned to a staff with this mobile.
            // Let's query complaint + staff.

            // Clean mobile
            const mobile = userId.split('@')[0].replace(/^91/, ''); // Remove 91 prefix if present
            // Note: This simple removal might fail if number doesn't start with 91 but has 12 digits.
            // Better regex:
            const cleanMobile = userId.replace('@s.whatsapp.net', '').slice(-10);

            const { data: complaint, error } = await supabase
                .from('complaints')
                .select('*, staff:assigned_to(*), voter:voter_id(*)')
                .eq('id', complaintId)
                .single();

            if (error || !complaint) {
                await sock.sendMessage(userId, { text: `❌ Complaint #${complaintId} not found.` });
                return true; // Handled
            }

            if (complaint.status === 'Resolved') {
                await sock.sendMessage(userId, { text: `✅ Complaint #${complaintId} is already resolved.` });
                return true;
            }

            // Check if assigned staff matches sender
            // Normalize DB mobile as well
            const staffMobile = complaint.staff?.mobile?.replace(/\D/g, '').slice(-10);

            console.log(`[StaffCheck] Sender: ${cleanMobile}, Assigned: ${staffMobile} (Orig: ${complaint.staff?.mobile})`);

            if (staffMobile !== cleanMobile) {
                // Allow admin override? Maybe later.
                await sock.sendMessage(userId, { text: `❌ You are not assigned to this complaint.` });
                return true;
            }

            // 2. Mark as Resolved
            const { error: updateError } = await supabase
                .from('complaints')
                .update({ status: 'Resolved' })
                .eq('id', complaintId);

            if (updateError) {
                await sock.sendMessage(userId, { text: `❌ Failed to update status.` });
                return true;
            }

            await sock.sendMessage(userId, { text: `✅ *Success!* Complaint #${complaintId} marked as Resolved.` });

            // 3. Notify Complainant
            await this.sendComplaintResolvedNotification(sock, complaint, tenantId);

            return true; // Handled
        }
        return false; // Not handled
    }

    async sendComplaintResolvedNotification(sock, complaint, tenantId) {
        console.log(`[NotificationDebug] Attempting to send resolved notification for Complaint #${complaint.id}`);

        let complainantMobile = null;
        let complainantName = 'Citizen';

        // 1. Try Voter Record
        if (complaint.voter && complaint.voter.mobile && complaint.voter.mobile !== 'N/A') {
            complainantMobile = complaint.voter.mobile;
            complainantName = complaint.voter.name_marathi || complaint.voter.name_english || 'Citizen';
            console.log(`[NotificationDebug] Found mobile in Voter record: ${complainantMobile}`);
        }

        // 2. Try Reporter Mobile Column (Fallback)
        if (!complainantMobile && complaint.reporter_mobile && complaint.reporter_mobile !== 'N/A') {
            complainantMobile = complaint.reporter_mobile;
            console.log(`[NotificationDebug] Found mobile in reporter_mobile: ${complainantMobile}`);
        }

        // 3. Try user_id column (Sometimes stores mobile for complaints)
        if (!complainantMobile && complaint.user_id && /^\d{10,15}$/.test(complaint.user_id.replace(/\D/g, ''))) {
            complainantMobile = complaint.user_id;
            console.log(`[NotificationDebug] Found mobile in user_id: ${complainantMobile}`);
        }

        // 4. Try Meta Data (Last Resort)
        if (!complainantMobile && complaint.description_meta) {
            try {
                const meta = JSON.parse(complaint.description_meta);
                if (meta.submitter_mobile) {
                    complainantMobile = meta.submitter_mobile;
                    console.log(`[NotificationDebug] Found mobile in description_meta (submitter_mobile): ${complainantMobile}`);
                } else if (meta.mobile) {
                    complainantMobile = meta.mobile;
                    console.log(`[NotificationDebug] Found mobile in description_meta (mobile): ${complainantMobile}`);
                }
                if (meta.submitter_name) complainantName = meta.submitter_name;
            } catch (e) {
                console.error('[NotificationDebug] Error parsing description_meta:', e);
            }
        }

        if (complainantMobile) {
            // Ensure format
            let whatsappId = complainantMobile.replace(/\D/g, '');
            if (whatsappId.length === 10) whatsappId = '91' + whatsappId;
            whatsappId = whatsappId + '@s.whatsapp.net';

            // Check if it's a valid ID (basic check)
            if (whatsappId.length < 12) { // 91 + 10 digits = 12
                console.warn(`[NotificationDebug] Invalid WhatsApp ID generated: ${whatsappId}`);
                return;
            }

            // Determine Language for Resolved Message
            let lang = 'mr'; // Default
            const userSession = this.getSession(whatsappId);
            if (userSession && userSession.language) {
                lang = userSession.language;
            } else {
                try {
                    const user = await this.store.getUser(whatsappId);
                    if (user && user.language) lang = user.language;
                } catch (e) { }
            }

            let msg = '';
            if (lang === 'mr') {
                msg = `✅ *तक्रार निवारण*\n\n` +
                    `नमस्कार ${complainantName},\n` +
                    `तुमची "${complaint.category}" बाबतची तक्रार #${complaint.id} आमच्या टीमने सोडवली आहे.\n\n` +
                    `सहकार्याबद्दल धन्यवाद!`;
            } else if (lang === 'hi') {
                msg = `✅ *शिकायत का समाधान*\n\n` +
                    `नमस्ते ${complainantName},\n` +
                    `"${complaint.category}" के संबंध में आपकी शिकायत #${complaint.id} का हमारी टीम ने समाधान कर दिया है।\n\n` +
                    `आपके धैर्य के लिए धन्यवाद!`;
            } else {
                msg = `✅ *Complaint Resolved*\n\n` +
                    `Hello ${complainantName},\n` +
                    `Your complaint #${complaint.id} regarding "${complaint.category}" has been resolved by our team.\n\n` +
                    `Thank you for your patience!`;
            }

            try {
                await sock.sendMessage(whatsappId, { text: msg });
                console.log(`[NotificationDebug] Notification SENT to ${whatsappId}`);
            } catch (err) {
                console.error(`[NotificationDebug] FAILED to send notification to ${whatsappId}:`, err);
            }
        } else {
            console.warn(`[NotificationDebug] Could not find ANY mobile number for Complaint #${complaint.id}. Notification skipped.`);
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
    async handleLanguageSelection(sock, userId, userName, input, tenantId) {
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

            // Check if user is Politician / Admin
            const polAuth = await politicianBotService.isPolitician(tenantId, userId);
            if (polAuth && polAuth.isPolitician) {
                const polSession = politicianBotService.getSession(userId);
                if (polSession.mode !== 'citizen') {
                    return await politicianBotService.showPoliticianMainMenu(sock, tenantId, userId, selectedLanguage);
                }
            }

            // Show main menu for citizen
            return await this.showMainMenu(sock, userId, selectedLanguage);
        } else {
            // Check if this is a reply to a pending task (Staff Date Estimate) - Stateless Recovery
            if (tenantId) {
                const pendingTask = await this.findPendingStaffTask(sock, tenantId, userId);
                if (pendingTask) {
                    console.log(`[${tenantId}] Found pending task #${pendingTask.id} for staff ${userId} (in Lang Search)`);
                    session.currentMenu = MENU_STATES.STAFF_TASK_DATE_ESTIMATE;
                    session.currentComplaintId = pendingTask.id;
                    return await this.handleStaffTaskDateEstimate(sock, tenantId, userId, input);
                }
            }

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
        const lang = session.language || 'mr'; // Fix: Default to Marathi to prevent crash

        switch (input) {
            case '1': // Complaints
                return await this.showComplaintsMenu(sock, userId, lang);
            case '2': // Letters
                return await this.showLettersMenu(sock, userId, lang, tenantId);
            case '3': // Government Schemes
                return await this.showSchemesMenu(sock, userId, lang);
            case '4': // Ward Problems
                return await this.showWardProblemsMenu(sock, userId, lang);
            case '5': // Personal Request
                session.currentMenu = MENU_STATES.PERSONAL_REQUEST_MENU;
                return await sock.sendMessage(userId, { text: PERSONAL_REQUEST_MENU[lang].text });
            case '6': // Other Services
                return await this.showOtherMenu(sock, userId, lang);
            default:
                // Check if this is a reply to a pending task (Staff Date Estimate) - Stateless Recovery
                // Even if in Main Menu, if input is not 1-6/0, check if it's a date reply for a task
                if (tenantId) {
                    const pendingTask = await this.findPendingStaffTask(sock, tenantId, userId);
                    if (pendingTask) {
                        console.log(`[${tenantId}] Found pending task #${pendingTask.id} for staff ${userId} (in Main Menu)`);
                        session.currentMenu = MENU_STATES.STAFF_TASK_DATE_ESTIMATE;
                        session.currentComplaintId = pendingTask.id;
                        return await this.handleStaffTaskDateEstimate(sock, tenantId, userId, input);
                    }
                }

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
        const lang = session.language;
        const nameQuery = input.trim();
        session.formData.name = nameQuery;

        const voters = await this.store.searchVoters(tenantId, nameQuery, 'name', 5);

        if (voters && voters.length > 0) {
            session.votersFound = voters;
            session.currentMenu = MENU_STATES.COMPLAINT_VOTER_VERIFY;

            let listMsg = lang === 'en' ? `🔍 *Is this you?*\n\nPlease select (1-${voters.length}):\n\n` :
                lang === 'mr' ? `🔍 *हे तुम्हीच आहात का?*\n\nकृपया निवडा (१-${voters.length}):\n\n` :
                    `🔍 *क्या यह आप हैं?*\n\nकृपया चुनें (1-${voters.length}):\n\n`;

            voters.forEach((v, i) => {
                const n = lang === 'mr' ? (v.name_marathi || v.name_english) : v.name_english;
                const addr = lang === 'mr' ? (v.address_marathi || v.address_english) : v.address_english;
                const epic = v.epic_no || 'N/A';
                const house = v.house_no || '';
                const ward = v.ward_no || 'N/A';
                const mobile = v.mobile ? `\n   📱 Mobile: ${v.mobile}` : '';

                listMsg += `${i + 1}️⃣ *${n}*\n`;
                listMsg += `   🆔 EPIC: ${epic} (Ward: ${ward})\n`;
                listMsg += `   📍 Address: ${house ? house + ', ' : ''}${addr ? addr.substring(0, 60) : 'N/A'}${mobile}\n\n`;
            });
            listMsg += `\n0️⃣ None of these (New Voter)`;
            await sock.sendMessage(userId, { text: listMsg });
        } else {
            // Not found
            const msg = lang === 'en' ? "Welcome new voter! Proceeding with your complaint." :
                lang === 'mr' ? "नवीन मतदाराचे स्वागत! तुमच्या तक्रारीसह पुढे जात आहोत." :
                    "नये मतदाता का स्वागत है! आपकी शिकायत के साथ आगे बढ़ रहे हैं।";
            await sock.sendMessage(userId, { text: msg });
            session.currentMenu = MENU_STATES.COMPLAINT_FORM_MOBILE;
            await sock.sendMessage(userId, { text: MESSAGES.complaint_mobile_prompt[lang] });
        }
    }

    async handleComplaintVoterVerify(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        if (input === '0') {
            const msg = lang === 'en' ? "Okay, registering as a new voter." :
                lang === 'mr' ? "ठीक आहे, नवीन मतदार म्हणून नोंदणी करत आहोत." :
                    "ठीक है, नए मतदाता के रूप में पंजीकरण कर रहे हैं।";
            await sock.sendMessage(userId, { text: msg });
            delete session.votersFound;
            session.currentMenu = MENU_STATES.COMPLAINT_FORM_MOBILE;
            await sock.sendMessage(userId, { text: MESSAGES.complaint_mobile_prompt[lang] });
            return;
        }

        const idx = parseInt(input) - 1;
        if (idx >= 0 && idx < (session.votersFound?.length || 0)) {
            const voter = session.votersFound[idx];
            session.formData.voter_id = voter.id;
            session.formData.name = lang === 'mr' ? (voter.name_marathi || voter.name_english) : voter.name_english;
            session.formData.original_address = lang === 'mr' ? (voter.address_marathi || voter.address_english) : voter.address_english;
            session.formData.mobile = voter.mobile;

            delete session.votersFound;
            session.voterOriginMenu = MENU_STATES.COMPLAINT_VOTER_VERIFY;
            return await this.showVoterProfileUpdateMenu(sock, userId, voter);
        } else {
            await sock.sendMessage(userId, { text: MESSAGES.invalid_option[lang] });
        }
    }

    async handleComplaintFormMobile(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        let cleanMobile = input.replace(/\D/g, '');

        // Check if user selected '1' for confirmed mobile
        if (input === '1' && session.tempVoterMobile) {
            cleanMobile = session.tempVoterMobile;
            delete session.tempVoterMobile;
        } else {
            if (cleanMobile.length !== 10) {
                const errorMsg = lang === 'en' ? '❌ Please enter a valid 10-digit mobile number' :
                    lang === 'mr' ? '❌ कृपया वैध १० अंकी मोबाइल नंबर प्रविष्ट करा' :
                        '❌ कृपया एक वैध 10 अंकों का मोबाइल नंबर दर्ज करें';
                await sock.sendMessage(userId, { text: errorMsg + '\n\n' + MESSAGES.complaint_mobile_prompt[lang] });
                return;
            }
            delete session.tempVoterMobile;
        }

        session.formData.mobile = cleanMobile;
        session.currentMenu = MENU_STATES.COMPLAINT_FORM_TYPE;
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
        let prompt = MESSAGES.complaint_location_prompt[lang];
        if (session.formData.original_address) {
            prompt = lang === 'en' ? `📍 Please provide the location/area:\n\n1️⃣ Use Linked Address: ${session.formData.original_address}\n\n_Or enter a new location:_` :
                lang === 'mr' ? `📍 कृपया ठिकाण/भाग सांगा:\n\n1️⃣ लिंक केलेला पत्ता वापरा: ${session.formData.original_address}\n\n_किंवा नवीन ठिकाण प्रविष्ट करा:_` :
                    `📍 कृपया स्थान/क्षेत्र बताएं:\n\n1️⃣ लिंक किया गया पता उपयोग करें: ${session.formData.original_address}\n\n_या नया स्थान दर्ज करें:_`;
        }
        await sock.sendMessage(userId, { text: prompt });
    }

    async handleComplaintFormLocation(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        if (input === '1' && session.formData.original_address) {
            session.formData.location = session.formData.original_address;
        } else {
            session.formData.location = input.trim();
        }
        session.currentMenu = MENU_STATES.COMPLAINT_FORM_PHOTO;
        await sock.sendMessage(userId, { text: MESSAGES.complaint_photo_prompt[lang] });
    }

    async handleComplaintFormPhoto(sock, tenantId, userId, input, msg = null) {
        const session = this.getSession(userId);
        const lang = session.language;
        const cleanInput = input.trim();

        console.log(`[DEBUG] handleComplaintFormPhoto input: '${input}', clean: '${cleanInput}', media: ${!!(msg?.message?.imageMessage)}`);

        // 1. Check if user wants to skip photo
        if (cleanInput === '0' || cleanInput.toLowerCase() === 'skip') {
            console.log('[DEBUG] Skipping photo, saving complaint...');
            return await this.saveComplaint(sock, tenantId, userId);
        }

        // 2. Check if the message contains an image
        if (msg?.message?.imageMessage) {
            try {
                console.log('[DEBUG] Sending "Uploading..." notification');
                await sock.sendMessage(userId, { text: lang === 'mr' ? '📸 फोटो अपलोड होत आहे, कृपया प्रतीक्षा करा...' : '📸 Uploading photo, please wait...' });

                // Download media
                const buffer = await downloadMediaMessage(
                    msg,
                    'buffer',
                    {},
                    {
                        logger: console,
                        reEntrant: true
                    }
                );

                if (!buffer) throw new Error('Failed to download media buffer');

                // Initialize Supabase (we need the client here)
                const supabaseUrl = process.env.VITE_SUPABASE_URL;
                const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
                const supabase = createClient(supabaseUrl, supabaseKey);

                const fileName = `${tenantId}/${Date.now()}_${msg.key.id}.jpg`;

                // Upload to Supabase Storage (bucket named 'complaints')
                const { data, error } = await supabase.storage
                    .from('complaints')
                    .upload(fileName, buffer, {
                        contentType: 'image/jpeg',
                        upsert: true
                    });

                if (error) throw error;

                // Save relative path instead of getting public URL
                const relativePath = `complaints/${fileName}`;

                console.log(`[DEBUG] Photo uploaded successfully: ${relativePath}`);
                session.formData.image_url = relativePath;

                return await this.saveComplaint(sock, tenantId, userId);

            } catch (err) {
                console.error('Error uploading bot photo:', err);
                const errorMsg = lang === 'mr' ? '❌ फोटो अपलोड करण्यात अडचण आली. फोटोशिवाय तक्रार जतन करत आहोत...' : '❌ Error uploading photo. Saving complaint without photo...';
                await sock.sendMessage(userId, { text: errorMsg });
                return await this.saveComplaint(sock, tenantId, userId);
            }
        }

        // 3. Fallback: If it's text but not 0, and not an image
        console.log('[DEBUG] Input received (not 0 and no image), asking again or saving...');
        const promptAgain = lang === 'mr' ? '📸 कृपया फोटो पाठवा किंवा वगळण्यासाठी 0 टाइप करा.' : '📸 Please send a photo or type 0 to skip.';
        await sock.sendMessage(userId, { text: promptAgain });
    }

    async handleStaffAssignment(sock, staffMobile, complaintData, tenantId) {
        if (!staffMobile) return;

        // Ensure mobile format
        const staffJid = staffMobile.includes('@') ? staffMobile : `${staffMobile.replace(/\D/g, '')}@s.whatsapp.net`;

        // 1. Notify Staff
        const staffLang = 'mr'; // Default to Marathi for staff for now, or fetch from session if possible
        // Ideally we should get staff language preference, but standardizing on Marathi/English is fine.

        const taskMsg = `🆕 *नवीन तक्रार सोपवण्यात आली आहे*
(New Task Assigned)

🆔 *ID:* #${complaintData.id}
📂 *विषय:* ${complaintData.category}
📍 *ठिकाण:* ${complaintData.location || 'N/A'}
👤 *नागरिक:* ${complaintData.voter ? (complaintData.voter.name_marathi || complaintData.voter.name_english) : (complaintData.user_name || 'नागरिक')}
📱 *मोबाईल:* ${complaintData.voter ? complaintData.voter.mobile : (complaintData.mobile || 'N/A')}

📝 *तक्रार:*
${complaintData.problem}

---
सदर काम पूर्ण करण्यासाठी अंदाजित तारीख आणि वेळ द्या.
(Please reply with estimated date and time for completion)
उदा. 25/10/2023 05:00 PM`;

        await sock.sendMessage(staffJid, { text: taskMsg });

        // Set Staff Session State to wait for estimate
        const staffSession = this.getSession(staffJid);
        staffSession.currentMenu = MENU_STATES.STAFF_TASK_DATE_ESTIMATE;
        staffSession.currentTask = complaintData;
        staffSession.currentComplaintId = complaintData.id; // Fix: Add this for handleStaffTaskDateEstimate

        // 2. Notify Citizen
        const citizenMobile = complaintData.user_id || (complaintData.voter ? complaintData.voter.mobile : null);
        if (citizenMobile) {
            const citizenJid = citizenMobile.includes('@') ? citizenMobile : `${citizenMobile.replace(/\D/g, '')}@s.whatsapp.net`;

            // Get citizen language preference
            const citizenSession = this.getSession(citizenJid);
            const citizenLang = citizenSession.language || 'mr';

            const staffName = complaintData.assignedStaff ? complaintData.assignedStaff.name : 'Staff';
            const staffPhone = complaintData.assignedStaff ? complaintData.assignedStaff.mobile : '';

            let updateMsg = '';
            if (citizenLang === 'mr') {
                updateMsg = `🎫 *तक्रार अपडेट* (ID: #${complaintData.id})

तुमची तक्रार *${staffName}* (${staffPhone}) यांच्याकडे सोपवण्यात आली आहे.
ते लवकरच यावर कार्यवाही करतील.`;
            } else if (citizenLang === 'hi') {
                updateMsg = `🎫 *शिकायत अपडेट* (ID: #${complaintData.id})

आपकी शिकायत *${staffName}* (${staffPhone}) को सौंप दी गई है।
वे जल्द ही इस पर कार्रवाई करेंगे।`;
            } else {
                updateMsg = `🎫 *Ticket Update* (ID: #${complaintData.id})

Your complaint has been assigned to *${staffName}* (${staffPhone}).
They will take action on it soon.`;
            }

            await sock.sendMessage(citizenJid, { text: updateMsg });
        }
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
                tenantId: tenantId,
                voter_id: session.formData.voter_id
            };

            // Save to database
            const result = await this.store.saveComplaint(complaint);

            // Get the complaint ID from result
            const complaintId = result?.id || 'XXXX';

            // Send success message with ID
            const successMsg = MESSAGES.complaint_registered[lang].replace('#{id}', complaintId);
            await sock.sendMessage(userId, { text: successMsg });

            // Check for Auto-Assignment
            if (result?.assignedStaff) {
                console.log(`[Auto-Assign] Triggering notification for Ticket #${complaintId}`);

                // Construct complaintData for notification (Matching structure used in handleStaffAssignment)
                const notificationData = {
                    id: complaintId,
                    category: session.formData.typeDisplay || complaint.type, // Use Display Name if available
                    location: complaint.location,
                    problem: complaint.description,
                    user_name: complaint.user_name,
                    mobile: complaint.mobile,
                    voter: null, // We don't have full voter object here, but user_name/mobile fallbacks work
                    assignedStaff: result.assignedStaff
                };

                await this.handleStaffAssignment(sock, result.assignedStaff.mobile, notificationData, tenantId);
            }

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
                session.currentMenu = MENU_STATES.SCHEME_QUESTION_AGE;
                session.formData = session.formData || {};
                await sock.sendMessage(userId, { text: MESSAGES.scheme_question_age[lang] });
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
        let title = lang === 'en' ? `🏛️ *Government Schemes* (Showing ${schemes.length} schemes)\n\n` :
            lang === 'mr' ? `🏛️ *सरकारी योजना* (${schemes.length} योजना दर्शवित)\n\n` :
                `🏛️ *सरकारी योजनाएं* (${schemes.length} योजनाएं दिखा रहे हैं)\n\n`;

        let schemeText = title;
        schemes.forEach((scheme, index) => {
            // Favor Marathi content if language is Marathi, otherwise fall back to English
            let name = scheme.name;
            let desc = scheme.description;
            let benefits = scheme.benefits;

            if (lang === 'mr') {
                name = scheme.name_mr || scheme.name;
                desc = scheme.description_mr || scheme.description;
                benefits = scheme.benefits_mr || scheme.benefits;
            } else if (lang === 'hi') {
                name = scheme.name_hi || scheme.name;
                desc = scheme.description_hi || scheme.description;
                benefits = scheme.benefits_hi || scheme.benefits;
            }

            // --- Robust Split Logic ---
            // Helper to extract the correct language part from a dual-lang string
            const getLangPart = (text, targetLang) => {
                if (!text) return '';

                // 1. Try common separators: " / ", " | ", or ". " (if dot is followed by a space and it's not an abbreviation)
                let parts = [];
                if (text.includes(' / ')) parts = text.split(' / ');
                else if (text.includes(' | ')) parts = text.split(' | ');
                else if (text.includes('. ') && text.match(/[a-zA-Z]\. [अ-ज्ञ]/)) parts = text.split('. '); // Split if dot space followed by Marathi

                if (parts.length >= 2) {
                    // Usually English is first, Marathi is second in this DB
                    return targetLang === 'mr' ? parts[parts.length - 1] : parts[0];
                }

                // 2. Character Set Detection (Look for Marathi characters)
                const hasMarathi = /[अ-ज्ञ]/.test(text);
                const hasEnglish = /[a-zA-Z]/.test(text);

                if (hasMarathi && hasEnglish) {
                    // Try to finding the boundary where characters change from Latn to Deva or vice versa
                    // This is complex, but often there's a dot or specific word boundary.
                    // For now, let's use a simpler approach: if it has both, and we want MR, 
                    // we try to keep only the part starting from the first Marathi character.
                    if (targetLang === 'mr') {
                        const firstMr = text.search(/[अ-ज्ञ]/);
                        return firstMr !== -1 ? text.substring(firstMr) : text;
                    } else {
                        // For English, we want to strip the Marathi part
                        const firstMr = text.search(/[अ-ज्ञ]/);
                        return firstMr !== -1 ? text.substring(0, firstMr) : text;
                    }
                }

                return text;
            };

            const cleanName = getLangPart(name, lang);
            const cleanDesc = getLangPart(desc, lang);

            schemeText += `${offset + index + 1}. *${cleanName.trim()}*\n`;
            if (cleanDesc) {
                schemeText += `   ${cleanDesc.trim().substring(0, 150)}...\n`;
            }
            if (benefits) schemeText += `   💰 ${benefits}\n`;
            schemeText += `\n`;
        });
        await sock.sendMessage(userId, { text: schemeText });
    }

    async handleSchemeQuestionAge(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        const age = parseInt(input.trim());
        if (isNaN(age) || age < 1 || age > 120) {
            const errorMsg = lang === 'en' ? '❌ Please enter a valid age number.' : lang === 'mr' ? '❌ कृपया वैध वय प्रविष्ट करा.' : '❌ कृपया एक वैध आयु दर्ज करें।';
            await sock.sendMessage(userId, { text: errorMsg + '\n\n' + MESSAGES.scheme_question_age[lang] });
            return;
        }

        session.formData.age = age;
        session.currentMenu = MENU_STATES.SCHEME_QUESTION_GENDER;
        await sock.sendMessage(userId, { text: MESSAGES.scheme_question_gender[lang] });
    }

    async handleSchemeQuestionGender(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        const genderMap = { '1': 'Male', '2': 'Female', '3': 'Other' };
        if (!genderMap[input]) {
            await sock.sendMessage(userId, { text: MESSAGES.invalid_option[lang] + '\n\n' + MESSAGES.scheme_question_gender[lang] });
            return;
        }

        session.formData.gender = genderMap[input];
        session.currentMenu = MENU_STATES.SCHEME_QUESTION_CATEGORY;
        await sock.sendMessage(userId, { text: MESSAGES.scheme_question_category[lang] });
    }

    async handleSchemeQuestionCategory(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        const categoryMap = { '1': 'SC/ST', '2': 'OBC', '3': 'General', '4': 'EWS', '5': 'VJNT' };
        if (!categoryMap[input]) {
            await sock.sendMessage(userId, { text: MESSAGES.invalid_option[lang] + '\n\n' + MESSAGES.scheme_question_category[lang] });
            return;
        }

        session.formData.category = categoryMap[input];

        const recommendationMsg = lang === 'en' ? `✅ *Information Received*\n\nFinding the best schemes for a ${session.formData.age} year old ${session.formData.gender} (${session.formData.category})...` :
            lang === 'mr' ? `✅ *माहिती प्राप्त झाली*\n\n${session.formData.age} वर्षीय ${session.formData.gender === 'Female' ? 'स्त्री' : 'पुरुष'} (${session.formData.category}) साठी सर्वोत्तम योजना शोधत आहोत...` :
                `✅ *जानकारी प्राप्त हुई*\n\n${session.formData.age} वर्षीय ${session.formData.gender} (${session.formData.category}) के लिए सर्वोत्तम योजनाएं खोज रहे हैं...`;

        await sock.sendMessage(userId, { text: recommendationMsg });

        // Build search query based on profile
        let searchQuery = '';
        let excludeKeywords = [];

        if (session.formData.gender === 'Female') {
            searchQuery = 'महिला';
        } else if (session.formData.gender === 'Male') {
            // EXCLUDE Women-centric schemes for men
            excludeKeywords = ["महिला", "मुलगी", "स्री", "विधवा", "बहीण", "women", "lady", "girl", "sister", "widow", "female"];
        }

        if (session.formData.category !== 'General') {
            searchQuery += (searchQuery ? ' ' : '') + session.formData.category;
        }

        // Fetch schemes with exclusions
        const schemes = await this.store.getSchemes(tenantId, { limit: 10, offset: 0, searchQuery, excludeKeywords });

        if (!schemes || schemes.length === 0) {
            // Fallback to showing all if no specific match
            const allSchemes = await this.store.getSchemes(tenantId, { limit: 5, offset: 0 });
            await this.displaySchemes(sock, userId, allSchemes, lang, 0);
        } else {
            await this.displaySchemes(sock, userId, schemes, lang, 0);
        }

        session.currentMenu = MENU_STATES.SCHEMES_MENU;
        await this.showSchemesMenu(sock, userId, lang);
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
                    lang === 'mr' ? '🔍 *मतदार शोधा*\n\nनाव,मोबाइल नंबर किंवा मतदार आयडी प्रविष्ट करा:' :
                        '🔍 *मतदाता खोजें*\n\nनाम, मोबाइल नंबर या मतदाता ID दर्ज करें:';
                await sock.sendMessage(userId, { text: searchMsg });
                break;

            case '2': // Link WhatsApp to Voter
                session.currentMenu = MENU_STATES.VOTER_VERIFY_NAME_PROMPT;
                await sock.sendMessage(userId, { text: MESSAGES.voter_verify_name_prompt[lang] });
                break;

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
            const cardNum = voter.epic_no || 'N/A';
            const age = voter.age || 'N/A';
            const booth = voter.part_no || 'N/A';
            const ward = voter.ward_no || 'N/A';

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

    async handleVoterVerifyName(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;
        const nameQuery = input.trim();

        if (nameQuery.length < 3) {
            const errorMsg = lang === 'en' ? '❌ Please enter at least 3 characters for name.' :
                lang === 'mr' ? '❌ कृपया नावासाठी किमान ३ अक्षरे प्रविष्ट करा.' :
                    '❌ कृपया नाम के लिए कम से कम 3 अक्षर दर्ज करें।';
            await sock.sendMessage(userId, { text: errorMsg });
            return;
        }

        const voters = await this.store.searchVoters(tenantId, nameQuery, 'name', 5);

        if (!voters || voters.length === 0) {
            const noVoterMsg = lang === 'en' ? `❌ No voter found with name "${nameQuery}".\n\nLet's register you as a new voter. Please enter your Full Name:` :
                lang === 'mr' ? `❌ "${nameQuery}" नावाचा कोणताही मतदार सापडला नाही.\n\nचला नवीन मतदार म्हणून तुमची नोंदणी करूया. कृपया तुमचे पूर्ण नाव प्रविष्ट करा:` :
                    `❌ "${nameQuery}" नाम का कोई मतदाता नहीं मिला।\n\nआइए आपको एक नए मतदाता के रूप में पंजीकृत करें। कृपया अपना पूरा नाम दर्ज करें:`;
            await sock.sendMessage(userId, { text: noVoterMsg });
            session.voterRegisterData = {};
            session.currentMenu = MENU_STATES.VOTER_REGISTER_NAME;
            return;
        }

        if (voters.length === 1) {
            const voter = voters[0];
            session.voterMatch = voter;
            session.currentMenu = MENU_STATES.VOTER_VERIFY_CONFIRM;

            const name = lang === 'mr' ? (voter.name_marathi || voter.name_english) : voter.name_english;
            const confirmMsg = lang === 'en' ? `🔍 *Is this you?*\n\n👤 Name: ${name}\n🎂 Age: ${voter.age}\n🏘️ Ward: ${voter.ward_no}\n📍 Booth: ${voter.part_no}\n\n1️⃣ Yes, this is me\n2️⃣ No, search again\n9️⃣ Main Menu` :
                lang === 'mr' ? `🔍 *हे तुम्हीच आहात का?*\n\n👤 नाव: ${name}\n🎂 वय: ${voter.age}\n🏘️ प्रभाग: ${voter.ward_no}\n📍 बूथ: ${voter.part_no}\n\n1️⃣ हो, हे मीच आहे\n2️⃣ नाही, पुन्हा शोधा\n9️⃣ मुख्य मेनू` :
                    `🔍 *क्या यह आप हैं?*\n\n👤 नाम: ${name}\n🎂 उम्र: ${voter.age}\n🏘️ वार्ड: ${voter.ward_no}\n📍 बूथ: ${voter.part_no}\n\n1️⃣ हाँ, यह मैं हूँ\n2️⃣ नहीं, फिर से खोजें\n9️⃣ मुख्य मेनू`;
            await sock.sendMessage(userId, { text: confirmMsg });
        } else {
            // Multiple matches
            session.votersFound = voters;
            let listMsg = lang === 'en' ? `🔍 *Multiple matches found for "${nameQuery}"*\n\nPlease select who you are (1-${voters.length}):\n\n` :
                lang === 'mr' ? `🔍 *"${nameQuery}" साठी अनेक नोंदी सापडल्या*\n\nकृपया तुम्ही कोण आहात ते निवडा (१-${voters.length}):\n\n` :
                    `🔍 *"${nameQuery}" के लिए कई मिलान मिले*\n\nकृपया चुनें कि आप कौन हैं (1-${voters.length}):\n\n`;

            voters.forEach((v, i) => {
                const n = lang === 'mr' ? (v.name_marathi || v.name_english) : v.name_english;
                const addr = lang === 'mr' ? (v.address_marathi || v.address_english) : v.address_english;
                const epic = v.epic_no || 'N/A';
                const house = v.house_no || '';
                const ward = v.ward_no || 'N/A';
                const mobile = v.mobile ? `\n   📱 Mobile: ${v.mobile}` : '';

                listMsg += `${i + 1}️⃣ *${n}*\n`;
                listMsg += `   🆔 EPIC: ${epic} (Ward: ${ward})\n`;
                listMsg += `   📍 Address: ${house ? house + ', ' : ''}${addr ? addr.substring(0, 60) : 'N/A'}${mobile}\n\n`;
            });
            listMsg += `\n0️⃣ None of these (Register New)\n9️⃣ Main Menu`;

            await sock.sendMessage(userId, { text: listMsg });
            session.currentMenu = MENU_STATES.VOTER_VERIFY_CONFIRM;
        }
    }

    async handleVoterVerifyConfirm(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        if (session.votersFound) {
            if (input === '0') {
                const regMsg = lang === 'en' ? "Okay, let's register you. Please enter your Full Name:" :
                    lang === 'mr' ? "ठीक आहे, तुमची नोंदणी करूया. कृपया तुमचे पूर्ण नाव प्रविष्ट करा:" :
                        "ठीक है, आइए आपको पंजीकृत करते हैं। कृपया अपना पूरा नाम दर्ज करें:";
                await sock.sendMessage(userId, { text: regMsg });
                session.voterRegisterData = {};
                session.currentMenu = MENU_STATES.VOTER_REGISTER_NAME;
                delete session.votersFound;
                return;
            } else if (input === '9') {
                return await this.showMainMenu(sock, userId, lang);
            }

            const idx = parseInt(input) - 1;
            if (idx >= 0 && idx < session.votersFound.length) {
                session.voterMatch = session.votersFound[idx];
                delete session.votersFound;
                // Ask for final confirmation
                const confirmMsg = lang === 'en' ? `🔍 *Is this you?*\n\n👤 Name: ${name}\n🆔 EPIC: ${voter.epic_no || 'N/A'}\n🎂 Age: ${voter.age}\n🏘️ Ward: ${voter.ward_no}\n📍 Address: ${voter.house_no ? voter.house_no + ', ' : ''}${voter.address_english || 'N/A'}\n${voter.mobile ? '📱 Mobile: ' + voter.mobile + '\n' : ''}\n1️⃣ Yes, confirm linking\n2️⃣ No, search again` :
                    lang === 'mr' ? `🔍 *हे तुम्हीच आहात का?*\n\n👤 नाव: ${name}\n🆔 EPIC: ${voter.epic_no || 'N/A'}\n🎂 वय: ${voter.age}\n🏘️ प्रभाग: ${voter.ward_no}\n📍 पत्ता: ${voter.house_no ? voter.house_no + ', ' : ''}${voter.address_marathi || voter.address_english || 'N/A'}\n${voter.mobile ? '📱 मोबाईल: ' + voter.mobile + '\n' : ''}\n1️⃣ हो, लिंक करा\n2️⃣ नाही, पुन्हा शोधा` :
                        `🔍 *क्या यह आप हैं?*\n\n👤 नाम: ${name}\n🆔 EPIC: ${voter.epic_no || 'N/A'}\n🎂 उम्र: ${voter.age}\n🏘️ वार्ड: ${voter.ward_no}\n📍 पता: ${voter.house_no ? voter.house_no + ', ' : ''}${voter.address_english || 'N/A'}\n${voter.mobile ? '📱 मोबाइल: ' + voter.mobile + '\n' : ''}\n1️⃣ हाँ, लिंकिंग की पुष्टि करें\n2️⃣ नहीं, फिर से खोजें`;
                await sock.sendMessage(userId, { text: confirmMsg });
                return;
            } else {
                await sock.sendMessage(userId, { text: MESSAGES.invalid_option[lang] });
                return;
            }
        }

        if (input === '1') {
            const voter = session.voterMatch;
            const mobile = userId.replace('@s.whatsapp.net', '').replace('@lid', '');

            try {
                await this.store.updateVoterMobile(voter.id, mobile);
                const successMsg = lang === 'en' ? `✅ *Success!* Your WhatsApp number has been linked to your voter record.\n\nNow you can use voter-specific services easily.` :
                    lang === 'mr' ? `✅ *यश!* तुमचा व्हॉट्सॲप नंबर तुमच्या मतदार नोंदणीशी लिंक केला गेला आहे.\n\nआता तुम्ही मतदार-विशिष्ट सेवा आरामात वापरू शकता.` :
                        `✅ *सफलता!* आपका व्हाट्सएप नंबर आपके मतदाता रिकॉर्ड से जुड़ गया है।\n\nअब आप मतदाता-विशिष्ट सेवाओं का आसानी से उपयोग कर सकते हैं।`;
                await sock.sendMessage(userId, { text: successMsg });
                delete session.voterMatch;
                await this.showMainMenu(sock, userId, lang);
            } catch (err) {
                console.error('Error linking voter:', err);
                const errMsg = lang === 'en' ? '❌ Error linking record. Please try again later.' : '❌ त्रुटी आली. कृपया नंतर प्रयत्न करा.';
                await sock.sendMessage(userId, { text: errMsg });
                await this.showMainMenu(sock, userId, lang);
            }
        } else if (input === '2') {
            session.currentMenu = MENU_STATES.VOTER_VERIFY_NAME_PROMPT;
            await sock.sendMessage(userId, { text: MESSAGES.voter_verify_name_prompt[lang] });
            delete session.voterMatch;
        } else {
            await sock.sendMessage(userId, { text: MESSAGES.invalid_option[lang] });
        }
    }

    async handleVoterRegisterName(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;
        session.voterRegisterData.name = input.trim();
        session.currentMenu = MENU_STATES.VOTER_REGISTER_WARD;
        await sock.sendMessage(userId, { text: MESSAGES.voter_register_ward_prompt[lang] });
    }

    async handleVoterRegisterWard(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;
        session.voterRegisterData.ward = input.trim();

        const mobile = userId.replace('@s.whatsapp.net', '').replace('@lid', '');
        const voterData = {
            name_english: session.voterRegisterData.name,
            ward_no: session.voterRegisterData.ward,
            mobile: mobile,
            tenant_id: tenantId,
            is_verified: true
        };

        try {
            await this.store.createVoter(voterData);
            const successMsg = lang === 'en' ? `✅ *Registration Successful!*\n\nWelcome, ${session.voterRegisterData.name}. You are now registered in our voter database.` :
                lang === 'mr' ? `✅ *नोंदणी यशस्वी!*\n\nस्वागत आहे, ${session.voterRegisterData.name}. तुमची आमच्या मतदार डेटाबेसमध्ये नोंदणी झाली आहे.` :
                    `✅ *पंजीकरण सफल!*\n\nस्वागत है, ${session.voterRegisterData.name}। अब आप हमारे मतदाता डेटाबेस में पंजीकृत हैं।`;
            await sock.sendMessage(userId, { text: successMsg });
            delete session.voterRegisterData;
            await this.showMainMenu(sock, userId, lang);
        } catch (err) {
            console.error('Error creating voter:', err);
            const errMsg = lang === 'en' ? '❌ Error registering. Please try again later.' : '❌ नोंदणी करताना त्रुटी आली.';
            await sock.sendMessage(userId, { text: errMsg });
            await this.showMainMenu(sock, userId, lang);
        }
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
                // Correct column name is likely event_date
                const dateStr = event.event_date || event.date;
                const d = new Date(dateStr);
                const date = isNaN(d.getTime()) ? 'TBA' : d.toLocaleDateString(lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN');
                const time = event.event_time ? ` | 🕒 ${this.formatTimeTo12hr(event.event_time)}` : '';
                const location = event.location || 'TBA';
                eventText += `${index + 1}. *${title}*\n   📅 ${date}${time}\n   📍 ${location}\n\n`;
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
                session.areaFormData = {};
                session.currentMenu = MENU_STATES.AREA_PROBLEM_FORM_NAME;
                const namePrompt = lang === 'en' ? '👤 Please enter your full name:' :
                    lang === 'mr' ? '👤 कृपया तुमचे पूर्ण नाव प्रविष्ट करा:' :
                        '👤 कृपया अपना पूरा नाम दर्ज करें:';
                await sock.sendMessage(userId, { text: namePrompt });
                return;

            case '2': // My Problems
                try {
                    const problems = await this.store.getAreaProblemsByUser(userId, 5);
                    let problemsText = lang === 'en' ? '🚨 *My Reported Problems*\n\n' :
                        lang === 'mr' ? '🚨 *माझ्या नोंदवलेल्या समस्या*\n\n' :
                            '🚨 *मेरी दर्ज की गई समस्याएं*\n\n';

                    if (!problems || problems.length === 0) {
                        problemsText += lang === 'en' ? 'You haven\'t reported any problems yet.' :
                            lang === 'mr' ? 'तुम्ही अद्याप कोणतीही समस्या नोंदवलेली नाही.' :
                                'आपने अभी तक कोई समस्या दर्ज नहीं की है।';
                    } else {
                        problems.forEach((problem, idx) => {
                            const date = new Date(problem.created_at).toLocaleDateString();
                            const statusEmoji = problem.status === 'Resolved' ? '✅' : '🔴';
                            problemsText += `${idx + 1}. ${statusEmoji} *${problem.title}*\n`;
                            problemsText += `   Status: ${problem.status}\n`;
                            problemsText += `   📅 ${date} | 📍 ${problem.location || 'N/A'}\n\n`;
                        });
                    }

                    await sock.sendMessage(userId, { text: problemsText });
                } catch (error) {
                    console.error('Error fetching user problems:', error);
                }
                break;

            case '3': // Solved Problems (Ward-wide)
                try {
                    const resolved = await this.store.getAreaProblems(tenantId, 'Resolved', 10);
                    let resolvedText = lang === 'en' ? '✅ *Solved Ward Problems*\n\n' :
                        lang === 'mr' ? '✅ *सोडवलेल्या समस्या (प्रभाग)*\n\n' :
                            '✅ *हल की गई समस्याएं (वार्ड)*\n\n';

                    if (!resolved || resolved.length === 0) {
                        resolvedText += lang === 'en' ? 'No resolved problems to show.' :
                            lang === 'mr' ? 'दर्शवण्यासाठी कोणत्याही सोडवलेल्या समस्या नाहीत.' :
                                'दिखाने के लिए कोई हल की गई समस्या नहीं है।';
                    } else {
                        resolved.forEach((problem, idx) => {
                            const date = problem.resolved_at ? new Date(problem.resolved_at).toLocaleDateString() : 'N/A';
                            resolvedText += `${idx + 1}. *${problem.title}*\n`;
                            resolvedText += `   ✓ Resolved on ${date}\n   📍 ${problem.location || 'N/A'}\n\n`;
                        });
                    }

                    await sock.sendMessage(userId, { text: resolvedText });
                } catch (error) {
                    console.error('Error fetching resolved area problems:', error);
                }
                break;

            default:
                const errorMsg = MESSAGES.invalid_option[lang] + '\n\n' + MENUS.ward_problems[lang].text;
                await sock.sendMessage(userId, { text: errorMsg });
                return;
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
        const phone_number = config.phone_number || 'Not Available';
        const email = config.email_address || config.email || 'Not Available';
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
                contactText = lang === 'en' ? `📞 *Contact Numbers*\n\nNagarsevak: ${nameEn}\nPhone: ${phone_number}` :
                    lang === 'mr' ? `📞 *संपर्क क्रमांक*\n\nनगरसेवक: ${nameMr}\nफोन: ${phone_number}` :
                        `📞 *संपर्क नंबर*\n\nनगरसेवक: ${nameEn}\nफोन: ${phone_number}`;
                break;
            case '4': // Email
                contactText = lang === 'en' ? `📧 *Email Address*\n\n${email}` :
                    lang === 'mr' ? `📧 *ईमेल पत्ता*\n\n${email}` :
                        `📧 *ईमेल पता*\n\n${email}`;
                break;
            case '5': // Social Media
                const social = config.social_media_link || 'Not Available';
                contactText = lang === 'en' ? `📱 *Follow Us*\n\nSocial Media: ${social}` :
                    lang === 'mr' ? `📱 *आम्हाला फॉलो करा*\n\nसोशल मीडिया: ${social}` :
                        `📱 *हमें फॉलो करें*\n\nसोशल मीडिया: ${social}`;
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
        let menuText = lang === 'en' ? '📄 *Letter Request*\n\nSelect the type of letter you need:\n\n' :
            lang === 'mr' ? '📄 *पत्र विनंती*\n\nतुम्हाला आवश्यक असलेले पत्र प्रकार निवडा:\n\n' :
                '📄 *पत्र अनुरोध*\n\nआवश्यक पत्र प्रकार चुनें:\n\n';

        letterTypes.forEach((type, index) => {
            const displayName = (lang === 'mr' && type.name_marathi) ? type.name_marathi : type.name;
            menuText += `${index + 1}️⃣ ${displayName}\n`;
        });

        menuText += lang === 'en' ? '\n0️⃣ Main Menu\n\n_Reply with a number_' :
            lang === 'mr' ? '\n0️⃣ मुख्य मेनू\n\n_कृपया क्रमांक निवडा_' :
                '\n0️⃣ मुख्य मेनू\n\n_कृपया नंबर चुनें_';

        await sock.sendMessage(userId, { text: menuText });
    }

    async handleLetterTypeSelect(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        const index = parseInt(input) - 1;
        if (index >= 0 && index < session.letterTypes.length) {
            const selectedType = session.letterTypes[index];
            const templateText = selectedType.template_content || '';

            // Extract custom fields from template content
            const allPlaceholders = [];
            const regex = /{{(.*?)}}/g;
            let match;
            while ((match = regex.exec(templateText)) !== null) {
                const key = match[1].trim();
                if (!['name', 'text', 'purpose', 'subject', 'mobile', 'date', 'address', 'signature'].includes(key) && !allPlaceholders.includes(key)) {
                    allPlaceholders.push(key);
                }
            }

            session.letterFormData = {
                type: selectedType.name,
                typeName: (lang === 'mr' && selectedType.name_marathi) ? selectedType.name_marathi : selectedType.name,
                dynamicFieldKeys: allPlaceholders,
                dynamicFieldAnswers: {},
                currentDynamicFieldIndex: 0
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
        const nameQuery = input.trim();
        session.letterFormData.name = nameQuery;

        const voters = await this.store.searchVoters(tenantId, nameQuery, 'name', 5);

        if (voters && voters.length > 0) {
            session.votersFound = voters;
            session.currentMenu = MENU_STATES.LETTER_VOTER_VERIFY;

            let listMsg = lang === 'en' ? `🔍 *Is this you?*\n\nPlease select (1-${voters.length}):\n\n` :
                lang === 'mr' ? `🔍 *हे तुम्हीच आहात का?*\n\nकृपया निवडा (१-${voters.length}):\n\n` :
                    `🔍 *क्या यह आप हैं?*\n\nकृपया चुनें (1-${voters.length}):\n\n`;

            voters.forEach((v, i) => {
                const n = lang === 'mr' ? (v.name_marathi || v.name_english) : v.name_english;
                const addr = lang === 'mr' ? (v.address_marathi || v.address_english) : v.address_english;
                const epic = v.epic_no || 'N/A';
                const house = v.house_no || '';
                const ward = v.ward_no || 'N/A';
                const mobile = v.mobile ? `\n   📱 Mobile: ${v.mobile}` : '';

                listMsg += `${i + 1}️⃣ *${n}*\n`;
                listMsg += `   🆔 EPIC: ${epic} (Ward: ${ward})\n`;
                listMsg += `   📍 Address: ${house ? house + ', ' : ''}${addr ? addr.substring(0, 60) : 'N/A'}${mobile}\n\n`;
            });
            listMsg += `\n0️⃣ None of these (New Voter)`;
            await sock.sendMessage(userId, { text: listMsg });
        } else {
            // Not found
            const msg = lang === 'en' ? "Welcome new voter! Proceeding with your letter request." :
                lang === 'mr' ? "नवीन मतदाराचे स्वागत! तुमच्या पत्र विनंतीसह पुढे जात आहोत." :
                    "नये मतदाता का स्वागत है! आपके पत्र अनुरोध के साथ आगे बढ़ रहे हैं।";
            await sock.sendMessage(userId, { text: msg });
            session.currentMenu = MENU_STATES.LETTER_FORM_MOBILE;

            const mobilePrompt = lang === 'en' ? '📱 Please enter your mobile number (10 digits):' :
                lang === 'mr' ? '📱 कृपया तुमचा मोबाइल नंबर प्रविष्ट करा (१० अंक):' :
                    '📱 कृपया अपना मोबाइल नंबर दर्ज करें (10 अंक):';
            await sock.sendMessage(userId, { text: mobilePrompt });
        }
    }

    async handleLetterVoterVerify(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        if (input === '0') {
            const msg = lang === 'en' ? "Okay, registering as a new voter." :
                lang === 'mr' ? "ठीक आहे, नवीन मतदार म्हणून नोंदणी करत आहोत." :
                    "ठीक है, नए मतदाता के रूप में पंजीकरण कर रहे हैं।";
            await sock.sendMessage(userId, { text: msg });
            delete session.votersFound;
            session.currentMenu = MENU_STATES.LETTER_FORM_MOBILE;

            const mobilePrompt = lang === 'en' ? '📱 Please enter your mobile number (10 digits):' :
                lang === 'mr' ? '📱 कृपया तुमचा मोबाइल नंबर प्रविष्ट करा (१० अंक):' :
                    '📱 कृपया अपना मोबाइल नंबर दर्ज करें (10 अंक):';
            await sock.sendMessage(userId, { text: mobilePrompt });
            return;
        }

        const idx = parseInt(input) - 1;
        if (idx >= 0 && idx < (session.votersFound?.length || 0)) {
            const voter = session.votersFound[idx];
            session.letterFormData.voter_id = voter.id;
            session.letterFormData.name = lang === 'mr' ? (voter.name_marathi || voter.name_english) : voter.name_english;
            session.letterFormData.original_address = lang === 'mr' ? (voter.address_marathi || voter.address_english) : voter.address_english;
            session.letterFormData.mobile = voter.mobile;
            // Save voter gender so we don't have to ask again
            const g = (voter.gender || '').toLowerCase();
            if (g === 'm' || g === 'male') session.letterFormData.gender = 'Male';
            else if (g === 'f' || g === 'female') session.letterFormData.gender = 'Female';
            else if (g === 'o' || g === 'other') session.letterFormData.gender = 'Other';

            delete session.votersFound;
            session.voterOriginMenu = MENU_STATES.LETTER_VOTER_VERIFY;
            return await this.showVoterProfileUpdateMenu(sock, userId, voter);
        } else {
            await sock.sendMessage(userId, { text: MESSAGES.invalid_option[lang] });
        }
    }

    async handleLetterFormMobile(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        let cleanMobile = input.trim().replace(/\D/g, '');

        if (input === '1' && session.tempVoterMobile) {
            cleanMobile = session.tempVoterMobile;
            delete session.tempVoterMobile;
        } else {
            if (cleanMobile.length !== 10) {
                const invalidMsg = lang === 'en' ? '❌ Invalid mobile number. Please enter 10 digits.' :
                    lang === 'mr' ? '❌ चुकीचा मोबाईल नंबर. कृपया १० अंक प्रविष्ट करा.' :
                        '❌ अमान्य मोबाइल नंबर। कृपया 10 अंक दर्ज करें।';
                await sock.sendMessage(userId, { text: invalidMsg });
                return;
            }
            delete session.tempVoterMobile;
        }

        session.letterFormData.mobile = cleanMobile;
        await this.promptLetterGender(sock, userId, lang);
    }

    async promptLetterGender(sock, userId, lang) {
        const session = this.getSession(userId);
        // If gender is already known from voter link, skip this step
        const knownGender = session.letterFormData?.gender;
        if (knownGender && ['Male', 'Female', 'Other'].includes(knownGender)) {
            return await this.promptLetterAddress(sock, userId, lang);
        }
        session.currentMenu = MENU_STATES.LETTER_FORM_GENDER;
        const genderPrompt = lang === 'en' ?
            `⚖️ Please select gender:\n\n1️⃣ Male\n2️⃣ Female\n3️⃣ Other` :
            lang === 'mr' ?
                `⚖️ लिंग निवडा:\n\n1️⃣ पुरुष\n2️⃣ महिला\n3️⃣ इतर` :
                `⚖️ लिंग चुनें:\n\n1️⃣ पुरुष\n2️⃣ महिला\n3️⃣ अन्य`;
        await sock.sendMessage(userId, { text: genderPrompt });
    }

    async handleLetterFormGender(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;
        const genderMap = { '1': 'Male', '2': 'Female', '3': 'Other' };
        const gender = genderMap[input.trim()];
        if (!gender) {
            const invalidMsg = lang === 'en' ? '❌ Invalid option. Please enter 1, 2 or 3:' :
                lang === 'mr' ? '❌ चुकीचा पर्याय. कृपया 1, 2 किंवा 3 प्रविष्ट करा:' :
                    '❌ अमान्य विकल्प। कृपया 1, 2 या 3 दर्ज करें:';
            await sock.sendMessage(userId, { text: invalidMsg });
            return;
        }
        session.letterFormData.gender = gender;
        await this.promptLetterAddress(sock, userId, lang);
    }

    async promptLetterAddress(sock, userId, lang) {
        const session = this.getSession(userId);
        session.currentMenu = MENU_STATES.LETTER_FORM_ADDRESS;
        let addressPrompt = lang === 'en' ? '🏠 Please enter your full address:' :
            lang === 'mr' ? '🏠 कृपया तुमचा पूर्ण पत्ता प्रविष्ट करा:' :
                '🏠 कृपया अपना पूरा पता दर्ज करें:';
        if (session.letterFormData.original_address) {
            addressPrompt = lang === 'en' ? `🏠 Please enter your full address:\n\n1️⃣ Use Linked Address: ${session.letterFormData.original_address}\n\n_Or enter a new address:_` :
                lang === 'mr' ? `🏠 कृपया तुमचा पूर्ण पत्ता प्रविष्ट करा:\n\n1️⃣ लिंक केलेला पत्ता वापरा: ${session.letterFormData.original_address}\n\n_किंवा नवीन पत्ता प्रविष्ट करा:_` :
                    `🏠 कृपया अपना पूरा पता दर्ज करें:\n\n1️⃣ लिंक किया गया पता उपयोग करें: ${session.letterFormData.original_address}\n\n_या नया पता दर्ज करें:_`;
        }
        await sock.sendMessage(userId, { text: addressPrompt });
    }

    async handleLetterFormAddress(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        if (input === '1' && session.letterFormData.original_address) {
            session.letterFormData.address = session.letterFormData.original_address;
        } else {
            session.letterFormData.address = input.trim();
        }
        session.currentMenu = MENU_STATES.LETTER_FORM_PURPOSE;

        const purposePrompt = lang === 'en' ? '🎯 What is the purpose of this letter?\n\n_Example: For bank loan, school admission, etc._' :
            lang === 'mr' ? '🎯 या पत्राचा उद्देश काय?\n\n_उदाहरण: बँक कर्ज, शाळा प्रवेश इ._' :
                '🎯 इस पत्र का उद्देश्य क्या है?\n\n_उदाहरण: बैंक लोन, स्कूल प्रवेश आदि।_';
        await sock.sendMessage(userId, { text: purposePrompt });
    }

    async handleLetterFormPurpose(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        session.letterFormData.purpose = input.trim();

        // Check if there are dynamic fields to ask
        if (session.letterFormData.dynamicFieldKeys && session.letterFormData.dynamicFieldKeys.length > 0) {
            session.currentMenu = MENU_STATES.LETTER_FORM_DYNAMIC;
            await this.promptNextDynamicField(sock, userId, session.letterFormData, lang);
            return;
        }

        // Submit the letter request if no dynamic fields
        await this.submitLetterRequest(sock, tenantId, userId, session, lang);
    }

    async promptNextDynamicField(sock, userId, letterFormData, lang) {
        const index = letterFormData.currentDynamicFieldIndex;
        const fieldName = letterFormData.dynamicFieldKeys[index];
        // Format label nicely: replace underscores and capitalize
        const displayLabel = fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        // Let's check if there are translations available in LOCALES for these dynamic fields later on, 
        // but for now, generate a basic prompt based on the language.
        const prompt = lang === 'en' ? `📝 Please enter *${displayLabel}*:` :
            lang === 'mr' ? `📝 कृपया *${displayLabel}* प्रविष्ट करा:` :
                `📝 कृपया *${displayLabel}* दर्ज करें:`;

        await sock.sendMessage(userId, { text: prompt });
    }

    async handleLetterFormDynamic(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        const index = session.letterFormData.currentDynamicFieldIndex;
        const fieldName = session.letterFormData.dynamicFieldKeys[index];

        session.letterFormData.dynamicFieldAnswers[fieldName] = input.trim();
        session.letterFormData.currentDynamicFieldIndex++;

        if (session.letterFormData.currentDynamicFieldIndex < session.letterFormData.dynamicFieldKeys.length) {
            await this.promptNextDynamicField(sock, userId, session.letterFormData, lang);
        } else {
            // All finished, submit!
            await this.submitLetterRequest(sock, tenantId, userId, session, lang);
        }
    }

    async submitLetterRequest(sock, tenantId, userId, session, lang) {
        try {
            const details = {
                name: session.letterFormData.name,
                mobile: session.letterFormData.mobile,
                gender: session.letterFormData.gender || 'Male',
                text: session.letterFormData.address,
                purpose: session.letterFormData.purpose,
                ...(session.letterFormData.dynamicFieldAnswers || {})
            };

            const letterRequest = {
                user_id: userId,
                tenant_id: tenantId,
                type: session.letterFormData.type,
                voter_id: session.letterFormData.voter_id,
                area: '', // Optional
                details: details,
                status: 'Pending'
            };

            const result = await this.store.saveLetterRequest(letterRequest);

            if (result) {
                const successMsg = lang === 'en' ? `✅ *Letter Request Submitted!*

Type: ${session.letterFormData.typeName}
Name: ${session.letterFormData.name}
Mobile: ${session.letterFormData.mobile}

Your request has been sent to the office for approval. You will be notified once it's ready.` :
                    lang === 'mr' ? `✅ *पत्र विनंती सादर केली!*

प्रकार: ${session.letterFormData.typeName}
नाव: ${session.letterFormData.name}
मोबाइल: ${session.letterFormData.mobile}

तुमची विनंती मंजूरीसाठी कार्यालयात पाठवली आहे. तयार झाल्यावर तुम्हाला सूचित केले जाईल.` :
                        `✅ *पत्र अनुरोध जमा किया गया!*

प्रकार: ${session.letterFormData.typeName}
नाम: ${session.letterFormData.name}
मोबाइल: ${session.letterFormData.mobile}

आपका अनुरोध कार्यालय को मंजूरी के लिए भेजा गया है। तैयार होने पर आपको सूचित किया जाएगा।`;
                await sock.sendMessage(userId, { text: successMsg });
            }

            // Clear form data
            delete session.letterFormData;
            delete session.letterTypes;

            // Return to main menu
            await this.showMainMenu(sock, userId, lang);

        } catch (error) {
            console.error('Error saving letter request:', error);
            const errorMsg = lang === 'en' ? '❌ Failed to submit letter request. Please try again later.' :
                lang === 'mr' ? '❌ पत्र विनंती सादर करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.' :
                    '❌ पत्र अनुरोध जमा करने में विफल। कृपया बाद में पुनः प्रयास करें।';
            await sock.sendMessage(userId, { text: errorMsg });
            await this.showMainMenu(sock, userId, lang);
        }
    }

    async handleAreaProblemName(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;
        const nameQuery = input.trim();
        session.areaFormData.reporter_name = nameQuery;

        const voters = await this.store.searchVoters(tenantId, nameQuery, 'name', 5);

        if (voters && voters.length > 0) {
            session.votersFound = voters;
            session.currentMenu = MENU_STATES.AREA_PROBLEM_VOTER_VERIFY;

            let listMsg = lang === 'en' ? `🔍 *Is this you?*\n\nPlease select (1-${voters.length}):\n\n` :
                lang === 'mr' ? `🔍 *हे तुम्हीच आहात का?*\n\nकृपया निवडा (१-${voters.length}):\n\n` :
                    `🔍 *क्या यह आप हैं?*\n\nकृपया चुनें (1-${voters.length}):\n\n`;

            voters.forEach((v, i) => {
                const n = lang === 'mr' ? (v.name_marathi || v.name_english) : v.name_english;
                const addr = lang === 'mr' ? (v.address_marathi || v.address_english) : v.address_english;
                const epic = v.epic_no || 'N/A';
                const house = v.house_no || '';
                const ward = v.ward_no || 'N/A';
                const mobile = v.mobile ? `\n   📱 Mobile: ${v.mobile}` : '';

                listMsg += `${i + 1}️⃣ *${n}*\n`;
                listMsg += `   🆔 EPIC: ${epic} (Ward: ${ward})\n`;
                listMsg += `   📍 Address: ${house ? house + ', ' : ''}${addr ? addr.substring(0, 60) : 'N/A'}${mobile}\n\n`;
            });
            listMsg += `\n0️⃣ None of these (New Voter)`;
            await sock.sendMessage(userId, { text: listMsg });
        } else {
            // Not found
            const msg = lang === 'en' ? "Welcome new voter! Proceeding with your request." :
                lang === 'mr' ? "नवीन मतदाराचे स्वागत! तुमच्या विनंतीसह पुढे जात आहोत." :
                    "नये मतदाता का स्वागत है! आपकी शिकायत के साथ आगे बढ़ रहे हैं।";
            await sock.sendMessage(userId, { text: msg });
            session.currentMenu = MENU_STATES.AREA_PROBLEM_FORM_MOBILE;

            const mobilePrompt = lang === 'en' ? '📱 Please enter your mobile number:' :
                lang === 'mr' ? '📱 कृपया तुमचा मोबाईल नंबर प्रविष्ट करा:' :
                    '📱 कृपया अपना मोबाइल नंबर दर्ज करें:';
            await sock.sendMessage(userId, { text: mobilePrompt });
        }
    }

    async handleAreaProblemVoterVerify(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        if (input === '0') {
            const msg = lang === 'en' ? "Okay, registering as a new voter." :
                lang === 'mr' ? "ठीक आहे, नवीन मतदार म्हणून नोंदणी करत आहोत." :
                    "ठीक है, नए मतदाता के रूप में पंजीकरण कर रहे हैं।";
            await sock.sendMessage(userId, { text: msg });
            delete session.votersFound;
            session.currentMenu = MENU_STATES.AREA_PROBLEM_FORM_MOBILE;
            const mobilePrompt = lang === 'en' ? '📱 Please enter your mobile number:' :
                lang === 'mr' ? '📱 कृपया तुमचा मोबाईल नंबर प्रविष्ट करा:' :
                    '📱 कृपया अपना मोबाइल नंबर दर्ज करें:';
            await sock.sendMessage(userId, { text: mobilePrompt });
            return;
        }

        const idx = parseInt(input) - 1;
        if (idx >= 0 && idx < (session.votersFound?.length || 0)) {
            const voter = session.votersFound[idx];
            session.areaFormData.voter_id = voter.id;
            session.areaFormData.reporter_name = lang === 'mr' ? (voter.name_marathi || voter.name_english) : voter.name_english;
            session.areaFormData.original_address = lang === 'mr' ? (voter.address_marathi || voter.address_english) : voter.address_english;
            session.areaFormData.reporter_mobile = voter.mobile;

            delete session.votersFound;
            session.voterOriginMenu = MENU_STATES.AREA_PROBLEM_VOTER_VERIFY;
            return await this.showVoterProfileUpdateMenu(sock, userId, voter);
        } else {
            await sock.sendMessage(userId, { text: MESSAGES.invalid_option[lang] });
        }
    }

    async handleAreaProblemMobile(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        let cleanMobile = input.trim().replace(/\D/g, '');

        if (input === '1' && session.tempVoterMobile) {
            cleanMobile = session.tempVoterMobile;
            delete session.tempVoterMobile;
        } else {
            if (cleanMobile.length !== 10) {
                const invalidMsg = lang === 'en' ? '❌ Invalid mobile number. Please enter 10 digits:' :
                    lang === 'mr' ? '❌ अवैध मोबाइल नंबर. कृपया 10 अंकी नंबर प्रविष्ट करा:' :
                        '❌ अमान्य मोबाइल नंबर। कृपया 10 अंकों का नंबर दर्ज करें:';
                await sock.sendMessage(userId, { text: invalidMsg });
                return;
            }
            delete session.tempVoterMobile;
        }

        session.areaFormData.reporter_mobile = cleanMobile;
        session.currentMenu = MENU_STATES.AREA_PROBLEM_FORM_TITLE;

        const titlePrompt = lang === 'en' ? '📝 What is the title of the problem?\n\n_Example: Broken street light, Road damage, etc._' :
            lang === 'mr' ? '📝 समस्याचे शीर्षक काय आहे?\n\n_उदाहरण: तुटलेला रस्ता दिवा, रस्त्याचे नुकसान, इ._' :
                '📝 समस्या का शीर्षक क्या है?\n\n_उदाहरण: टूटी हुई स्ट्रीटलाइट, सड़क क्षति, आदि।_';
        await sock.sendMessage(userId, { text: titlePrompt });
    }

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

        let locPrompt = lang === 'en' ? '📍 Where is this problem located?\n\n_Example: Near bus stand, Main road, etc._' :
            lang === 'mr' ? '📍 ही समस्या कुठे आहे?\n\n_उदाहरण: बस स्थानकाजवळ, मुख्य रस्ता, इ._' :
                '📍 यह समस्या कहाँ है?\n\n_उदाहरण: बस स्टैंड के पास, मुख्य सड़क, आदि।_';

        if (session.areaFormData.original_address) {
            locPrompt = lang === 'en' ? `📍 Where is this problem located?\n\n1️⃣ Use Linked Address: ${session.areaFormData.original_address}\n\n_Or enter a new location (e.g., Near bus stand):_` :
                lang === 'mr' ? `📍 ही समस्या कुठे आहे?\n\n1️⃣ लिंक केलेला पत्ता वापरा: ${session.areaFormData.original_address}\n\n_किंवा नवीन ठिकाण प्रविष्ट करा (उदा. बस स्थानकाजवळ):_` :
                    `📍 यह समस्या कहाँ है?\n\n1️⃣ लिंक किया गया पता उपयोग करें: ${session.areaFormData.original_address}\n\n_या नया स्थान दर्ज करें (जैसे बस स्टैंड के पास):_`;
        }
        await sock.sendMessage(userId, { text: locPrompt });
    }

    async handleAreaProblemLocation(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        if (input === '1' && session.areaFormData.original_address) {
            session.areaFormData.location = session.areaFormData.original_address;
        } else {
            session.areaFormData.location = input.trim();
        }

        // Submit the area problem
        try {
            const problemData = {
                tenant_id: tenantId,
                user_id: userId, // Use full ID for robustness
                reporter_name: session.areaFormData.reporter_name,
                reporter_mobile: session.areaFormData.reporter_mobile,
                voter_id: session.areaFormData.voter_id || null, // Add voter_id, default to null
                title: session.areaFormData.title,
                description: session.areaFormData.description,
                location: session.areaFormData.location,
                status: 'Open', // Change status to 'Open'
                created_at: new Date().toISOString() // Add created_at timestamp
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
            case '1': // Events & Programs
                return await this.showEventsMenu(sock, userId, lang);
            case '2': // Development Works
                return await this.showWorksMenu(sock, userId, lang);
            case '3': // Contact Information
                return await this.showContactMenu(sock, userId, lang);
            case '4': // Meeting Diary
            case '5': // Photo Gallery
            case '6': // Newspaper Clippings
            case '7': // Ward Budget Info
            default:
                const errorMsg = MESSAGES.invalid_option[lang] + '\n\n' + MENUS.other[lang].text;
                await sock.sendMessage(userId, { text: errorMsg });
                return;
        }

        await sock.sendMessage(userId, { text: response });
        await this.showOtherMenu(sock, userId, lang);
    }

    /**
     * Personal Request Flow Handlers
     */
    async handlePersonalRequestMenu(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        const categories = {
            '1': 'Education/Admission',
            '2': 'Medical Help/Hospital',
            '3': 'Financial Assistance',
            '4': 'General Help',
            '5': 'Other Help'
        };

        if (categories[input]) {
            session.personalFormData = { category: categories[input] };
            session.currentMenu = MENU_STATES.PERSONAL_REQUEST_FORM_NAME;
            await sock.sendMessage(userId, { text: MESSAGES.complaint_name_prompt[lang] });
        } else if (input === '6') {
            session.currentMenu = MENU_STATES.PERSONAL_REQUEST_TRACK_MOBILE;
            await sock.sendMessage(userId, { text: MESSAGES.personal_request_track_prompt[lang] });
        } else {
            await sock.sendMessage(userId, { text: MESSAGES.invalid_option[lang] + '\n\n' + PERSONAL_REQUEST_MENU[lang].text });
        }
    }

    async handlePersonalRequestName(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;
        const nameQuery = input.trim();
        session.personalFormData.reporter_name = nameQuery;

        const voters = await this.store.searchVoters(tenantId, nameQuery, 'name', 5);

        if (voters && voters.length > 0) {
            session.votersFound = voters;
            session.currentMenu = MENU_STATES.PERSONAL_REQUEST_VOTER_VERIFY;

            let listMsg = lang === 'en' ? `🔍 *Is this you?*\n\nPlease select (1-${voters.length}):\n\n` :
                lang === 'mr' ? `🔍 *हे तुम्हीच आहात का?*\n\nकृपया निवडा (१-${voters.length}):\n\n` :
                    `🔍 *क्या यह आप हैं?*\n\nकृपया चुनें (1-${voters.length}):\n\n`;

            voters.forEach((v, i) => {
                const n = lang === 'mr' ? (v.name_marathi || v.name_english) : v.name_english;
                const addr = lang === 'mr' ? (v.address_marathi || v.address_english) : v.address_english;
                const epic = v.epic_no || 'N/A';
                const house = v.house_no || '';
                const ward = v.ward_no || 'N/A';
                const mobile = v.mobile ? `\n   📱 Mobile: ${v.mobile}` : '';

                listMsg += `${i + 1}️⃣ *${n}*\n`;
                listMsg += `   🆔 EPIC: ${epic} (Ward: ${ward})\n`;
                listMsg += `   📍 Address: ${house ? house + ', ' : ''}${addr ? addr.substring(0, 60) : 'N/A'}${mobile}\n\n`;
            });
            listMsg += `\n0️⃣ None of these (New Voter)`;
            await sock.sendMessage(userId, { text: listMsg });
        } else {
            // Not found
            const msg = lang === 'en' ? "Welcome new voter! Proceeding with your request." :
                lang === 'mr' ? "नवीन मतदाराचे स्वागत! तुमच्या विनंतीसह पुढे जात आहोत." :
                    "नये मतदाता का स्वागत है! आपकी शिकायत के साथ आगे बढ़ रहे हैं।";
            await sock.sendMessage(userId, { text: msg });
            session.currentMenu = MENU_STATES.PERSONAL_REQUEST_FORM_MOBILE;
            await sock.sendMessage(userId, { text: MESSAGES.complaint_mobile_prompt[lang] });
        }
    }

    async handlePersonalRequestVoterVerify(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        if (input === '0') {
            const msg = lang === 'en' ? "Okay, registering as a new voter." :
                lang === 'mr' ? "ठीक आहे, नवीन मतदार म्हणून नोंदणी करत आहोत." :
                    "ठीक है, नए मतदाता के रूप में पंजीकरण कर रहे हैं।";
            await sock.sendMessage(userId, { text: msg });
            delete session.votersFound;
            session.currentMenu = MENU_STATES.PERSONAL_REQUEST_FORM_MOBILE;
            await sock.sendMessage(userId, { text: MESSAGES.complaint_mobile_prompt[lang] });
            return;
        }

        const idx = parseInt(input) - 1;
        if (idx >= 0 && idx < (session.votersFound?.length || 0)) {
            const voter = session.votersFound[idx];
            session.personalFormData.voter_id = voter.id;
            session.personalFormData.reporter_name = lang === 'mr' ? (voter.name_marathi || voter.name_english) : voter.name_english;
            session.personalFormData.original_address = lang === 'mr' ? (voter.address_marathi || voter.address_english) : voter.address_english;
            session.personalFormData.reporter_mobile = voter.mobile;

            delete session.votersFound;
            session.voterOriginMenu = MENU_STATES.PERSONAL_REQUEST_VOTER_VERIFY;
            return await this.showVoterProfileUpdateMenu(sock, userId, voter);
        } else {
            await sock.sendMessage(userId, { text: MESSAGES.invalid_option[lang] });
        }
    }

    async handlePersonalRequestMobile(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        let cleanMobile = input.trim().replace(/\D/g, '');

        if (input === '1' && session.tempVoterMobile) {
            cleanMobile = session.tempVoterMobile;
            delete session.tempVoterMobile;
        } else {
            if (cleanMobile.length !== 10) {
                await sock.sendMessage(userId, { text: MESSAGES.complaint_mobile_prompt[lang] });
                return;
            }
            delete session.tempVoterMobile;
        }

        session.personalFormData.reporter_mobile = cleanMobile;
        session.currentMenu = MENU_STATES.PERSONAL_REQUEST_FORM_DESC;
        await sock.sendMessage(userId, { text: MESSAGES.personal_request_desc_prompt[lang] });
    }

    async handlePersonalRequestDesc(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;
        session.personalFormData.description = input.trim();

        try {
            const requestData = {
                tenant_id: tenantId,
                user_id: userId,
                reporter_name: session.personalFormData.reporter_name,
                reporter_mobile: session.personalFormData.reporter_mobile,
                request_type: session.personalFormData.category,
                description: session.personalFormData.description,
                status: 'Pending',
                voter_id: session.personalFormData.voter_id
            };

            await this.store.savePersonalRequest(requestData);

            const successMsg = lang === 'en' ? '✅ *Personal Request Submitted!*\n\nOur team will contact you soon.' :
                lang === 'mr' ? '✅ *वैयक्तिक विनंती यशस्वीरित्या नोंदवली!*\n\nआमची टीम लवकरच तुमच्याशी संपर्क साधेल.' :
                    '✅ *व्यक्तिगत अनुरोध सफलतापूर्वक सबमिट किया गया!*\n\nहमारी टीम जल्द ही आपसे संपर्क करेगी।';

            await sock.sendMessage(userId, { text: successMsg });
            await this.showMainMenu(sock, userId, lang);
        } catch (error) {
            console.error('Error saving personal request:', error);
            const errMsg = lang === 'en' ? 'Error submitting request.' : 'त्रुटी.';
            await sock.sendMessage(userId, { text: errMsg });
        }
    }

    async handlePersonalRequestTrackMobile(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;
        const mobile = input.trim().replace(/\D/g, '');

        if (mobile.length !== 10) {
            await sock.sendMessage(userId, { text: MESSAGES.complaint_mobile_prompt[lang] });
            return;
        }

        const requests = await this.store.getPersonalRequestsByMobile(tenantId, mobile);

        if (!requests || requests.length === 0) {
            const noRequests = lang === 'en' ? '❌ No personal requests found linked to this mobile number.' :
                lang === 'mr' ? '❌ या मोबाईल नंबरवर कोणत्याही वैयक्तिक विनंत्या सापडल्या नाहीत.' :
                    '❌ इस मोबाइल नंबर से जुड़ा कोई व्यक्तिगत अनुरोध नहीं मिला।';
            await sock.sendMessage(userId, { text: noRequests });
        } else {
            let listText = lang === 'en' ? `📋 *Your Personal Requests* (${requests.length}) \n\n` :
                lang === 'mr' ? `📋 *तुमच्या वैयक्तिक विनंत्या* (${requests.length})\n\n` :
                    `📋 *आपके व्यक्तिगत अनुरोध* (${requests.length})\n\n`;

            requests.forEach((req, index) => {
                const statusEmoji = req.status === 'Resolved' ? '✅' : req.status === 'In Progress' ? '⏳' : '🔴';
                const date = new Date(req.created_at).toLocaleDateString(lang === 'mr' ? 'mr-IN' : 'en-IN');

                listText += `${index + 1}. ${statusEmoji} *${req.request_type}*\n`;
                listText += `   Status: ${req.status}\n`;
                listText += `   Date: ${date}\n\n`;
            });

            await sock.sendMessage(userId, { text: listText });
        }

        session.currentMenu = MENU_STATES.PERSONAL_REQUEST_MENU;
        await sock.sendMessage(userId, { text: PERSONAL_REQUEST_MENU[lang].text });
    }

    async handleVoterProfileUpdateMenu(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;

        if (input === '1') {
            session.currentMenu = MENU_STATES.VOTER_UPDATE_MOBILE_VAL;
            const msg = lang === 'en' ? '📱 Please enter your new 10-digit mobile number:' :
                lang === 'mr' ? '📱 कृपया तुमचा नवीन १०-अंकी मोबाईल नंबर प्रविष्ट करा:' :
                    '📱 कृपया अपना नया 10-अंकों का मोबाइल नंबर दर्ज करें:';
            await sock.sendMessage(userId, { text: msg });
        } else if (input === '2') {
            session.currentMenu = MENU_STATES.VOTER_UPDATE_ADDRESS_VAL;
            const msg = lang === 'en' ? '🏠 Please enter your new full address:' :
                lang === 'mr' ? '🏠 कृपया तुमचा नवीन पूर्ण पत्ता प्रविष्ट करा:' :
                    '🏠 कृपया अपना नया पूरा पता दर्ज करें:';
            await sock.sendMessage(userId, { text: msg });
        } else if (input === '3') {
            // Everything correct, return to original flow
            return await this.resumeVoterFlow(sock, tenantId, userId);
        } else {
            await sock.sendMessage(userId, { text: MESSAGES.invalid_option[lang] });
        }
    }

    async handleVoterUpdateMobileVal(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;
        const mobile = input.trim().replace(/\D/g, '');

        if (mobile.length !== 10) {
            const msg = lang === 'en' ? '❌ Invalid mobile number. Please enter 10 digits:' :
                lang === 'mr' ? '❌ अवैध मोबाईल नंबर. कृपया १० अंक प्रविष्ट करा:' :
                    '❌ अमान्य मोबाइल नंबर। कृपया 10 अंक दर्ज करें:';
            await sock.sendMessage(userId, { text: msg });
            return;
        }

        const voterId = session.formData?.voter_id || session.letterFormData?.voter_id || session.areaFormData?.voter_id || session.personalFormData?.voter_id;

        if (voterId) {
            try {
                await this.store.updateVoter(voterId, { mobile: mobile });
                // Update session data
                if (session.formData) session.formData.mobile = mobile;
                if (session.letterFormData) session.letterFormData.mobile = mobile;
                if (session.areaFormData) session.areaFormData.reporter_mobile = mobile;
                if (session.personalFormData) session.personalFormData.reporter_mobile = mobile;

                const success = lang === 'en' ? '✅ Mobile number updated successfully!' :
                    lang === 'mr' ? '✅ मोबाईल नंबर यशस्वीरित्या अपडेट केला!' :
                        '✅ मोबाइल नंबर सफलतापूर्वक अपडेट किया गया!';
                await sock.sendMessage(userId, { text: success });
            } catch (err) {
                console.error('Failed to update voter mobile:', err);
            }
        }
        return await this.resumeVoterFlow(sock, tenantId, userId);
    }

    async handleVoterUpdateAddressVal(sock, tenantId, userId, input) {
        const session = this.getSession(userId);
        const lang = session.language;
        const address = input.trim();

        if (!address) return;

        const voterId = session.formData?.voter_id || session.letterFormData?.voter_id || session.areaFormData?.voter_id || session.personalFormData?.voter_id;

        if (voterId) {
            try {
                const updateData = {};
                if (lang === 'mr') {
                    updateData.address_marathi = address;
                } else {
                    updateData.address_english = address;
                }
                await this.store.updateVoter(voterId, updateData);

                // Update session data
                if (session.formData) session.formData.original_address = address;
                if (session.letterFormData) session.letterFormData.original_address = address;
                if (session.areaFormData) session.areaFormData.original_address = address;
                if (session.personalFormData) session.personalFormData.original_address = address;

                const success = lang === 'en' ? '✅ Address updated successfully!' :
                    lang === 'mr' ? '✅ पत्ता यशस्वीरित्या अपडेट केला!' :
                        '✅ पता सफलतापूर्वक अपडेट किया गया!';
                await sock.sendMessage(userId, { text: success });
            } catch (err) {
                console.error('Failed to update voter address:', err);
            }
        }
        return await this.resumeVoterFlow(sock, tenantId, userId);
    }

    async showVoterProfileUpdateMenu(sock, userId, voter) {
        const session = this.getSession(userId);
        const lang = session.language;

        // Check if mobile is missing or N/A
        if (!voter.mobile || voter.mobile === 'null' || voter.mobile.toUpperCase() === 'N/A' || voter.mobile.trim() === '') {
            // Auto-prompt for mobile update
            session.currentMenu = MENU_STATES.VOTER_UPDATE_MOBILE_VAL;

            const profileInfo = lang === 'mr' ?
                `✅ *मतदार लिंक केला!*\n\n👤 नाव: ${voter.name_marathi || voter.name_english}\n🆔 EPIC: ${voter.epic_no || 'N/A'}\n📍 पत्ता: ${voter.address_marathi || voter.address_english || 'N/A'}` :
                `✅ *Voter Linked!*\n\n👤 Name: ${voter.name_english}\n🆔 EPIC: ${voter.epic_no || 'N/A'}\n📍 Address: ${voter.address_english || 'N/A'}`;

            const missingMobileMsg = lang === 'mr' ?
                `${profileInfo}\n\n⚠️ *मोबाईल नंबर उपलब्ध नाही.*\nकृपया चालू असलेल्या विनंतीसाठी तुमचा मोबाईल नंबर प्रविष्ट करा:` :
                `${profileInfo}\n\n⚠️ *Mobile Number Missing.*\nPlease enter your mobile number for this request:`;

            await sock.sendMessage(userId, { text: missingMobileMsg });
            return;
        }

        session.currentMenu = MENU_STATES.VOTER_PROFILE_UPDATE_MENU;

        const profileInfo = lang === 'mr' ?
            `✅ *मतदार लिंक केला!*\n\n👤 नाव: ${voter.name_marathi || voter.name_english}\n🆔 EPIC: ${voter.epic_no || 'N/A'}\n📍 पत्ता: ${voter.address_marathi || voter.address_english || 'N/A'}\n📱 मोबाईल: ${voter.mobile || 'N/A'}` :
            `✅ *Voter Linked!*\n\n👤 Name: ${voter.name_english}\n🆔 EPIC: ${voter.epic_no || 'N/A'}\n📍 Address: ${voter.address_english || 'N/A'}\n📱 Mobile: ${voter.mobile || 'N/A'}`;

        const menuText = lang === 'mr' ?
            `${profileInfo}\n\nतुम्ही तुमची नोंदणीकृत माहिती बदलू इच्छिता का?\n\n1️⃣ मोबाईल नंबर बदला\n2️⃣ पत्ता बदला\n3️⃣ सर्व माहिती बरोबर आहे, पुढे सुरू ठेवा` :
            `${profileInfo}\n\nWould you like to update your registered details?\n\n1️⃣ Update Mobile\n2️⃣ Update Address\n3️⃣ Everything is correct, continue with request`;

        await sock.sendMessage(userId, { text: menuText });
    }

    async resumeVoterFlow(sock, tenantId, userId) {
        const session = this.getSession(userId);
        const lang = session.language;

        const origin = session.voterOriginMenu;
        delete session.voterOriginMenu;

        if (origin === MENU_STATES.COMPLAINT_VOTER_VERIFY) {
            session.currentMenu = MENU_STATES.COMPLAINT_FORM_TYPE;
            await sock.sendMessage(userId, { text: MESSAGES.complaint_type_prompt[lang] });
        } else if (origin === MENU_STATES.LETTER_VOTER_VERIFY) {
            // If voter already has mobile saved, skip to gender prompt; otherwise ask for mobile
            const formMobile = session.letterFormData?.mobile;
            const hasMobile = formMobile && formMobile !== 'null' && formMobile.trim() !== '' && formMobile.toUpperCase() !== 'N/A';
            if (hasMobile) {
                await this.promptLetterGender(sock, userId, lang);
            } else {
                session.currentMenu = MENU_STATES.LETTER_FORM_MOBILE;
                const mobilePrompt = lang === 'en' ? '📱 Please enter your mobile number (10 digits):' :
                    lang === 'mr' ? '📱 कृपया तुमचा मोबाइल नंबर प्रविष्ट करा (१० अंक):' :
                        '📱 कृपया अपना मोबाइल नंबर दर्ज करें (10 अंक):';
                await sock.sendMessage(userId, { text: mobilePrompt });
            }
        } else if (origin === MENU_STATES.AREA_PROBLEM_VOTER_VERIFY) {
            session.currentMenu = MENU_STATES.AREA_PROBLEM_FORM_MOBILE;
            const mobilePrompt = lang === 'en' ? '📱 Please enter your mobile number:' :
                lang === 'mr' ? '📱 कृपया तुमचा मोबाईल नंबर प्रविष्ट करा:' :
                    '📱 कृपया अपना मोबाइल नंबर दर्ज करें:';
            await sock.sendMessage(userId, { text: mobilePrompt });
        } else if (origin === MENU_STATES.PERSONAL_REQUEST_VOTER_VERIFY) {
            session.currentMenu = MENU_STATES.PERSONAL_REQUEST_FORM_MOBILE;
            await sock.sendMessage(userId, { text: MESSAGES.complaint_mobile_prompt[lang] });
        } else {
            await this.showMainMenu(sock, userId, lang);
        }
    }
}

module.exports = MenuNavigator;
