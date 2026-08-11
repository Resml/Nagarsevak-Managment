/**
 * Politician WhatsApp Bot Service
 * Scalable multi-tenant service for politician detection, plan-gated dynamic menus,
 * state management, and real-time office data access.
 */

const { createClient } = require('@supabase/supabase-js');
const { POLITICIAN_MENUS } = require('./politicianMenus');
const visitorHandler = require('./politicianHandlers/visitorHandler');
const complaintHandler = require('./politicianHandlers/complaintHandler');
const letterHandler = require('./politicianHandlers/letterHandler');
const taskHandler = require('./politicianHandlers/taskHandler');
const diaryHandler = require('./politicianHandlers/diaryHandler');
const summaryHandler = require('./politicianHandlers/summaryHandler');

const { supabase } = require('./supabaseClient');

// In-Memory Politician Auth & Profile Cache (5 minute TTL)
const authCache = new Map(); // key: `${tenantId}_${cleanMobile}` -> { data, timestamp }
const CACHE_TTL_MS = 5 * 60 * 1000;

// Politician State Constants
const POLITICIAN_STATES = {
    MAIN_MENU: 'POLITICIAN_MAIN_MENU',
    VISITOR_MENU: 'POLITICIAN_VISITOR_MENU',
    VISITOR_DATE_PROMPT: 'POLITICIAN_VISITOR_DATE_PROMPT',
    VISITOR_SEARCH_PROMPT: 'POLITICIAN_VISITOR_SEARCH_PROMPT',
    COMPLAINTS_MENU: 'POLITICIAN_COMPLAINTS_MENU',
    LETTERS_MENU: 'POLITICIAN_LETTERS_MENU',
    LETTER_SEARCH_PROMPT: 'POLITICIAN_LETTER_SEARCH_PROMPT',
    TASKS_MENU: 'POLITICIAN_TASKS_MENU',
    DIARY_MENU: 'POLITICIAN_DIARY_MENU'
};

// Global default admin test numbers that can access politician menu for any tenant
const GLOBAL_ADMIN_NUMBERS = ['7058731515', '917058731515', '105029583282256', '105029583282256@lid'];

class PoliticianBotService {
    constructor() {
        this.sessions = {}; // userId -> { mode: 'admin'|'citizen', currentMenu, menuMapping, language, tenantInfo }
    }

    /**
     * Clean phone number to 10 digits
     */
    cleanNumber(jidOrPhone) {
        if (!jidOrPhone) return '';
        if (jidOrPhone.includes('105029583282256')) return '7058731515';
        const digits = jidOrPhone.replace(/\D/g, '');
        return digits.slice(-10);
    }

    /**
     * Check if sender is an authorized Politician / Admin for this tenant
     */
    async isPolitician(tenantId, userId) {
        if (!tenantId || !userId) return { isPolitician: false };

        const cleanMobile = this.cleanNumber(userId);
        const isGlobalAdmin = GLOBAL_ADMIN_NUMBERS.includes(userId) || 
                              GLOBAL_ADMIN_NUMBERS.includes(cleanMobile) || 
                              userId.includes('105029583282256');

        const cacheKey = `${tenantId}_${cleanMobile || userId}`;
        const cached = authCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
            return cached.data;
        }

        try {
            // 1. Fetch Tenant details
            const { data: tenant, error: tErr } = await supabase
                .from('tenants')
                .select('*')
                .eq('id', tenantId)
                .single();

            if (tErr || !tenant) {
                if (GLOBAL_ADMIN_NUMBERS.includes(cleanMobile)) {
                    const res = {
                        isPolitician: true,
                        politicianInfo: {
                            name: 'मा. लोकप्रतिनिधी',
                            ward: 'मुख्य कार्यालय',
                            plan: 'advance',
                            tier: 'nagarsevak',
                            tenantName: 'नगरसेवक कार्यालय',
                            config: {}
                        }
                    };
                    authCache.set(cacheKey, { data: res, timestamp: Date.now() });
                    return res;
                }
                const res = { isPolitician: false };
                authCache.set(cacheKey, { data: res, timestamp: Date.now() });
                return res;
            }

            const config = tenant.config || {};
            const plan = (tenant.plan || 'basic').toLowerCase();
            const tier = (tenant.tier || 'nagarsevak').toLowerCase();
            const polName = config.nagarsevak_name_marathi || config.nagarsevak_name_english || tenant.name || 'नगरसेवक';
            const wardName = config.ward_name ? `${config.ward_name} (${config.ward_number || ''})` : (config.ward_number ? `प्रभाग क्र. ${config.ward_number}` : 'कार्यालय');

            // 2. Check if mobile matches tenant config numbers
            const tenantMobiles = [
                this.cleanNumber(config.phone_number),
                this.cleanNumber(config.mobile),
                this.cleanNumber(config.nagarsevak_mobile),
                this.cleanNumber(config.bot_admin_mobile),
                this.cleanNumber(config.admin_mobile)
            ].filter(Boolean);

            if (Array.isArray(config.admin_numbers)) {
                config.admin_numbers.forEach(num => {
                    const c = this.cleanNumber(num);
                    if (c) tenantMobiles.push(c);
                });
            } else if (typeof config.admin_numbers === 'string') {
                config.admin_numbers.split(',').forEach(num => {
                    const c = this.cleanNumber(num);
                    if (c) tenantMobiles.push(c);
                });
            }

            // Check if global admin or in tenant config
            const isMatch = isGlobalAdmin || tenantMobiles.includes(cleanMobile) || (config.admin_lids && config.admin_lids.includes(userId));

            if (isMatch) {
                const res = {
                    isPolitician: true,
                    politicianInfo: {
                        name: polName,
                        ward: wardName,
                        plan,
                        tier,
                        tenantName: tenant.name,
                        config
                    }
                };
                authCache.set(cacheKey, { data: res, timestamp: Date.now() });
                return res;
            }

            // 3. Check staff table for Admin / Politician / Supervisor role
            const { data: staffList, error: sErr } = await supabase
                .from('staff')
                .select('*')
                .eq('tenant_id', tenantId)
                .ilike('mobile', `%${cleanMobile}%`)
                .limit(1);

            if (!sErr && staffList && staffList.length > 0) {
                const staff = staffList[0];
                const roleLower = (staff.role || '').toLowerCase();
                const catLower = (staff.category || '').toLowerCase();
                const perms = Array.isArray(staff.permissions) ? staff.permissions : [];

                const isAdminRole = ['admin', 'office admin', 'कार्यालय प्रशासक', 'supervisor', 'nagarsevak', 'amdar', 'khasdar', 'minister'].includes(roleLower) ||
                    catLower === 'office' || perms.includes('all') || perms.includes('visitors');

                if (isAdminRole) {
                    const res = {
                        isPolitician: true,
                        politicianInfo: {
                            name: staff.name || polName,
                            ward: wardName,
                            plan,
                            tier,
                            tenantName: tenant.name,
                            config
                        }
                    };
                    authCache.set(cacheKey, { data: res, timestamp: Date.now() });
                    return res;
                }
            }

            const res = { isPolitician: false };
            authCache.set(cacheKey, { data: res, timestamp: Date.now() });
            return res;
        } catch (error) {
            console.error('[PoliticianBotService] Auth resolution error:', error);
            return { isPolitician: false };
        }
    }

    /**
     * Get or create Politician session
     */
    getSession(userId) {
        if (!this.sessions[userId]) {
            this.sessions[userId] = {
                mode: 'admin', // 'admin' or 'citizen'
                currentMenu: POLITICIAN_STATES.MAIN_MENU,
                menuMapping: {},
                language: 'mr',
                politicianInfo: null
            };
        }
        return this.sessions[userId];
    }

    /**
     * Calculate enabled features based on plan & disabled_features list
     */
    getEnabledFeatures(plan = 'basic', disabledFeatures = []) {
        const normalizedPlan = (plan || 'basic').toLowerCase();
        const disabled = Array.isArray(disabledFeatures) ? disabledFeatures : [];

        // Feature hierarchy
        const basicFeatures = ['visitors', 'complaints', 'letters', 'tasks', 'ward_problems', 'voters'];
        const proFeatures = [...basicFeatures, 'schemes'];
        const advanceFeatures = [...proFeatures, 'gb_register'];

        let candidateFeatures = basicFeatures;
        if (normalizedPlan === 'pro') candidateFeatures = proFeatures;
        if (normalizedPlan === 'advance' || normalizedPlan === 'advanced') candidateFeatures = advanceFeatures;

        // Filter out disabled features
        return candidateFeatures.filter(f => !disabled.includes(f));
    }

    /**
     * Build dynamic master menu text & mapping
     */
    buildDynamicMenu(politicianInfo, lang = 'mr') {
        const plan = politicianInfo.plan || 'basic';
        const disabled = politicianInfo.config?.disabled_features || [];
        const enabledFeatures = this.getEnabledFeatures(plan, disabled);

        const greetingTpl = POLITICIAN_MENUS.greeting[lang] || POLITICIAN_MENUS.greeting.mr;
        const labels = POLITICIAN_MENUS.feature_labels;

        let title = greetingTpl.title.replace('{NAME}', politicianInfo.name);
        let subtitle = greetingTpl.subtitle
            .replace('{WARD}', politicianInfo.ward)
            .replace('{PLAN}', plan.toUpperCase());

        let menuText = `${title}\n${subtitle}\n━━━━━━━━━━━━━━━━━━━━━\n${greetingTpl.header}`;
        const mapping = {};

        // Option 1 is always 360° Executive Pulse
        mapping['1'] = 'daily_summary';
        menuText += `1️⃣ ${greetingTpl.daily_summary}\n`;

        // Dynamic Feature Options (2, 3, 4...)
        let optionNum = 2;
        enabledFeatures.forEach(featureKey => {
            const labelObj = labels[featureKey];
            if (labelObj) {
                const labelText = labelObj[lang] || labelObj.mr;
                mapping[String(optionNum)] = featureKey;
                menuText += `${this.numberEmoji(optionNum)} ${labelText}\n`;
                optionNum++;
            }
        });

        menuText += `\n━━━━━━━━━━━━━━━━━━━━━${greetingTpl.footer}`;

        return { menuText, mapping };
    }

    numberEmoji(n) {
        const map = {
            1: '1️⃣', 2: '2️⃣', 3: '3️⃣', 4: '4️⃣', 5: '5️⃣',
            6: '6️⃣', 7: '7️⃣', 8: '8️⃣', 9: '9️⃣', 10: '🔟'
        };
        return map[n] || `[${n}]`;
    }

    /**
     * Show Politician Main Menu
     */
    async showPoliticianMainMenu(sock, tenantId, userId, lang = 'mr') {
        const session = this.getSession(userId);
        session.mode = 'admin';
        session.currentMenu = POLITICIAN_STATES.MAIN_MENU;
        session.language = lang;

        const auth = await this.isPolitician(tenantId, userId);
        const polInfo = auth.politicianInfo || { name: 'नगरसेवक', ward: 'कार्यालय', plan: 'basic', config: {} };
        session.politicianInfo = polInfo;

        const { menuText, mapping } = this.buildDynamicMenu(polInfo, lang);
        session.menuMapping = mapping;

        await sock.sendMessage(userId, { text: menuText });
    }

    /**
     * Main Politician Message Handler
     */
    async handlePoliticianMessage(sock, tenantId, userId, messageText, polInfo) {
        const session = this.getSession(userId);
        session.politicianInfo = polInfo;
        const input = (messageText || '').trim();
        const lang = session.language || 'mr';

        // 1. Check for Mode Switch Commands
        if (input.toUpperCase() === 'CITIZEN' || input.toUpperCase() === 'CITIZEN_MODE') {
            session.mode = 'citizen';
            await sock.sendMessage(userId, {
                text: `🔄 *नागरिक मोड सुरू झाला आहे.*\n\nतुम्ही आता सर्वसामान्य नागरिकांप्रमाणे बॉट वापरू शकता.\nपुन्हा नगरसेवक ॲडमिन पोर्टलवर जाण्यासाठी *ADMIN* टाईप करा.`
            });
            return { handled: true, switchedToCitizen: true };
        }

        if (input.toUpperCase() === 'ADMIN' || input.toUpperCase() === 'POLITICIAN') {
            session.mode = 'admin';
            await this.showPoliticianMainMenu(sock, tenantId, userId, lang);
            return { handled: true };
        }

        // 2. Global Back to Main Menu
        if (input === '9' || input.toUpperCase() === 'MAIN' || input.toUpperCase() === 'MENU') {
            await this.showPoliticianMainMenu(sock, tenantId, userId, lang);
            return { handled: true };
        }

        // 3. Route according to current state
        switch (session.currentMenu) {
            case POLITICIAN_STATES.MAIN_MENU:
                return await this.handleMainMenuSelection(sock, tenantId, userId, input, lang);

            case POLITICIAN_STATES.VISITOR_MENU:
                return await this.handleVisitorMenuSelection(sock, tenantId, userId, input, lang);

            case POLITICIAN_STATES.VISITOR_DATE_PROMPT:
                return await this.handleVisitorDateInput(sock, tenantId, userId, input, lang);

            case POLITICIAN_STATES.VISITOR_SEARCH_PROMPT:
                return await this.handleVisitorSearchInput(sock, tenantId, userId, input, lang);

            case POLITICIAN_STATES.COMPLAINTS_MENU:
                return await this.handleComplaintsMenuSelection(sock, tenantId, userId, input, lang);

            case POLITICIAN_STATES.LETTERS_MENU:
                return await this.handleLettersMenuSelection(sock, tenantId, userId, input, lang);

            case POLITICIAN_STATES.LETTER_SEARCH_PROMPT:
                return await this.handleLetterSearchInput(sock, tenantId, userId, input, lang);

            case POLITICIAN_STATES.TASKS_MENU:
                return await this.handleTasksMenuSelection(sock, tenantId, userId, input, lang);

            case POLITICIAN_STATES.DIARY_MENU:
                return await this.handleDiaryMenuSelection(sock, tenantId, userId, input, lang);

            default:
                await this.showPoliticianMainMenu(sock, tenantId, userId, lang);
                return { handled: true };
        }
    }

    /**
     * Handle Main Menu Dynamic Selection
     */
    async handleMainMenuSelection(sock, tenantId, userId, input, lang) {
        const session = this.getSession(userId);
        const featureKey = session.menuMapping[input];

        if (!featureKey) {
            // Invalid selection: re-show main menu
            await this.showPoliticianMainMenu(sock, tenantId, userId, lang);
            return { handled: true };
        }

        switch (featureKey) {
            case 'daily_summary': {
                const sumText = await summaryHandler.get360ExecutiveSummary(
                    tenantId,
                    session.politicianInfo?.name,
                    session.politicianInfo?.ward,
                    lang
                );
                await sock.sendMessage(userId, { text: sumText });
                return { handled: true };
            }

            case 'visitors': {
                session.currentMenu = POLITICIAN_STATES.VISITOR_MENU;
                const menu = POLITICIAN_MENUS.visitors_menu[lang] || POLITICIAN_MENUS.visitors_menu.mr;
                await sock.sendMessage(userId, { text: menu.text });
                return { handled: true };
            }

            case 'complaints': {
                session.currentMenu = POLITICIAN_STATES.COMPLAINTS_MENU;
                const menu = POLITICIAN_MENUS.complaints_menu[lang] || POLITICIAN_MENUS.complaints_menu.mr;
                await sock.sendMessage(userId, { text: menu.text });
                return { handled: true };
            }

            case 'letters': {
                session.currentMenu = POLITICIAN_STATES.LETTERS_MENU;
                const menu = POLITICIAN_MENUS.letters_menu[lang] || POLITICIAN_MENUS.letters_menu.mr;
                await sock.sendMessage(userId, { text: menu.text });
                return { handled: true };
            }

            case 'tasks': {
                session.currentMenu = POLITICIAN_STATES.TASKS_MENU;
                const menu = POLITICIAN_MENUS.tasks_menu[lang] || POLITICIAN_MENUS.tasks_menu.mr;
                await sock.sendMessage(userId, { text: menu.text });
                return { handled: true };
            }

            case 'gb_register': {
                session.currentMenu = POLITICIAN_STATES.DIARY_MENU;
                const menu = POLITICIAN_MENUS.diary_menu[lang] || POLITICIAN_MENUS.diary_menu.mr;
                await sock.sendMessage(userId, { text: menu.text });
                return { handled: true };
            }

            case 'ward_problems': {
                const { data } = await supabase.from('complaints').select('*').eq('tenant_id', tenantId).neq('status', 'Resolved').limit(8);
                let txt = `⚠️ *प्रभाग समस्या आढावा*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
                if (!data || data.length === 0) txt += `सर्व प्रभाग समस्या सुरळीत आहेत.\n`;
                else {
                    data.forEach((p, i) => {
                        txt += `*${i + 1}. ${p.category || 'समस्या'}* - ${p.location || ''}\n   ${p.problem || ''}\n\n`;
                    });
                }
                txt += `_9️⃣ मुख्य मेनू_`;
                await sock.sendMessage(userId, { text: txt });
                return { handled: true };
            }

            case 'voters': {
                const { count: totalVoters } = await supabase.from('voters').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId);
                let txt = `🗳️ *मतदार माहिती व आकडेवारी*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
                txt += `👥 *प्रभागातील एकूण मतदार:* ${totalVoters || 0}\n\n_9️⃣ मुख्य मेनू_`;
                await sock.sendMessage(userId, { text: txt });
                return { handled: true };
            }

            default:
                await this.showPoliticianMainMenu(sock, tenantId, userId, lang);
                return { handled: true };
        }
    }

    /**
     * Handle Visitor Sub-Menu Selections
     */
    async handleVisitorMenuSelection(sock, tenantId, userId, input, lang) {
        const session = this.getSession(userId);

        switch (input) {
            case '1': { // Today's Visitors
                const text = await visitorHandler.getTodayVisitors(tenantId, lang);
                await sock.sendMessage(userId, { text });
                return { handled: true };
            }
            case '2': { // Yesterday's Visitors
                const text = await visitorHandler.getYesterdayVisitors(tenantId, lang);
                await sock.sendMessage(userId, { text });
                return { handled: true };
            }
            case '3': { // Date Filter Prompt
                session.currentMenu = POLITICIAN_STATES.VISITOR_DATE_PROMPT;
                const prompt = POLITICIAN_MENUS.prompts.date_input[lang] || POLITICIAN_MENUS.prompts.date_input.mr;
                await sock.sendMessage(userId, { text: prompt });
                return { handled: true };
            }
            case '4': { // Search Visitor Prompt
                session.currentMenu = POLITICIAN_STATES.VISITOR_SEARCH_PROMPT;
                const prompt = POLITICIAN_MENUS.prompts.visitor_search[lang] || POLITICIAN_MENUS.prompts.visitor_search.mr;
                await sock.sendMessage(userId, { text: prompt });
                return { handled: true };
            }
            case '5': { // Analytics
                const text = await visitorHandler.getVisitorAnalytics(tenantId, lang);
                await sock.sendMessage(userId, { text });
                return { handled: true };
            }
            default:
                await this.showPoliticianMainMenu(sock, tenantId, userId, lang);
                return { handled: true };
        }
    }

    /**
     * Handle Visitor Custom Date Input
     */
    async handleVisitorDateInput(sock, tenantId, userId, input, lang) {
        const session = this.getSession(userId);
        const text = await visitorHandler.getVisitorsByDate(tenantId, input, lang);
        session.currentMenu = POLITICIAN_STATES.VISITOR_MENU;
        await sock.sendMessage(userId, { text });
        return { handled: true };
    }

    /**
     * Handle Visitor Search Input
     */
    async handleVisitorSearchInput(sock, tenantId, userId, input, lang) {
        const session = this.getSession(userId);
        const text = await visitorHandler.searchVisitors(tenantId, input, lang);
        session.currentMenu = POLITICIAN_STATES.VISITOR_MENU;
        await sock.sendMessage(userId, { text });
        return { handled: true };
    }

    /**
     * Handle Complaints Sub-Menu Selections
     */
    async handleComplaintsMenuSelection(sock, tenantId, userId, input, lang) {
        switch (input) {
            case '1': { // Pending
                const text = await complaintHandler.getPendingComplaints(tenantId, lang);
                await sock.sendMessage(userId, { text });
                return { handled: true };
            }
            case '2': { // Resolved Today
                const text = await complaintHandler.getResolvedTodayComplaints(tenantId, lang);
                await sock.sendMessage(userId, { text });
                return { handled: true };
            }
            case '3': { // Urgent
                const text = await complaintHandler.getUrgentComplaints(tenantId, lang);
                await sock.sendMessage(userId, { text });
                return { handled: true };
            }
            case '4': { // Stats
                const text = await complaintHandler.getComplaintsStats(tenantId, lang);
                await sock.sendMessage(userId, { text });
                return { handled: true };
            }
            default:
                await this.showPoliticianMainMenu(sock, tenantId, userId, lang);
                return { handled: true };
        }
    }

    /**
     * Handle Letters Sub-Menu Selections
     */
    async handleLettersMenuSelection(sock, tenantId, userId, input, lang) {
        const session = this.getSession(userId);
        switch (input) {
            case '1': { // Incoming
                const text = await letterHandler.getIncomingLetters(tenantId, lang);
                await sock.sendMessage(userId, { text });
                return { handled: true };
            }
            case '2': { // Outgoing
                const text = await letterHandler.getOutgoingLetters(tenantId, lang);
                await sock.sendMessage(userId, { text });
                return { handled: true };
            }
            case '3': { // Search
                session.currentMenu = POLITICIAN_STATES.LETTER_SEARCH_PROMPT;
                const prompt = POLITICIAN_MENUS.prompts.letter_search[lang] || POLITICIAN_MENUS.prompts.letter_search.mr;
                await sock.sendMessage(userId, { text: prompt });
                return { handled: true };
            }
            default:
                await this.showPoliticianMainMenu(sock, tenantId, userId, lang);
                return { handled: true };
        }
    }

    /**
     * Handle Letter Search Input
     */
    async handleLetterSearchInput(sock, tenantId, userId, input, lang) {
        const session = this.getSession(userId);
        const text = await letterHandler.searchLetters(tenantId, input, lang);
        session.currentMenu = POLITICIAN_STATES.LETTERS_MENU;
        await sock.sendMessage(userId, { text });
        return { handled: true };
    }

    /**
     * Handle Tasks Sub-Menu Selections
     */
    async handleTasksMenuSelection(sock, tenantId, userId, input, lang) {
        switch (input) {
            case '1': { // Today's tasks
                const text = await taskHandler.getTodayTasks(tenantId, lang);
                await sock.sendMessage(userId, { text });
                return { handled: true };
            }
            case '2': { // Overdue
                const text = await taskHandler.getOverdueTasks(tenantId, lang);
                await sock.sendMessage(userId, { text });
                return { handled: true };
            }
            case '3': { // Team Status
                const text = await taskHandler.getTeamStatus(tenantId, lang);
                await sock.sendMessage(userId, { text });
                return { handled: true };
            }
            default:
                await this.showPoliticianMainMenu(sock, tenantId, userId, lang);
                return { handled: true };
        }
    }

    /**
     * Handle Diary Sub-Menu Selections
     */
    async handleDiaryMenuSelection(sock, tenantId, userId, input, lang) {
        switch (input) {
            case '1': { // Today's diary
                const text = await diaryHandler.getTodayDiary(tenantId, lang);
                await sock.sendMessage(userId, { text });
                return { handled: true };
            }
            case '2': { // Tomorrow's schedule
                const text = await diaryHandler.getTomorrowSchedule(tenantId, lang);
                await sock.sendMessage(userId, { text });
                return { handled: true };
            }
            default:
                await this.showPoliticianMainMenu(sock, tenantId, userId, lang);
                return { handled: true };
        }
    }
}

// Singleton instance
const politicianBotService = new PoliticianBotService();

module.exports = {
    politicianBotService,
    POLITICIAN_STATES
};
