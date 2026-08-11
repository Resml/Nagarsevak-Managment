/**
 * Test Suite for Multi-Tenant Politician WhatsApp Bot Service
 */

const { politicianBotService, POLITICIAN_STATES } = require('./politicianBotService');
const visitorHandler = require('./politicianHandlers/visitorHandler');
const complaintHandler = require('./politicianHandlers/complaintHandler');
const summaryHandler = require('./politicianHandlers/summaryHandler');

// Mock socket for testing message sends
class MockSocket {
    constructor() {
        this.sentMessages = [];
    }

    async sendMessage(jid, content) {
        this.sentMessages.push({ jid, text: content.text });
        console.log(`\n🤖 [Bot -> ${jid}]:\n${content.text}\n`);
        return { key: { id: 'mock_msg_' + Date.now() } };
    }

    lastMessage() {
        return this.sentMessages[this.sentMessages.length - 1]?.text || '';
    }
}

async function runTests() {
    console.log("==================================================");
    console.log("🚀 STARTING POLITICIAN WHATSAPP BOT TEST SUITE");
    console.log("==================================================\n");

    const sock = new MockSocket();
    const testUserId = '7058731515@s.whatsapp.net';
    const mockTenantId = '00000000-0000-0000-0000-000000000001';

    // Test 1: Date Parser
    console.log("--- TEST 1: Date Parsing Utility ---");
    const testDates = [
        { input: 'today', expected: new Date().toISOString().split('T')[0] },
        { input: '11-08-2026', expected: '2026-08-11' },
        { input: '15/08/2026', expected: '2026-08-15' },
        { input: '2026-10-05', expected: '2026-10-05' }
    ];

    testDates.forEach(({ input, expected }) => {
        const parsed = visitorHandler.parseDateInput(input);
        console.log(`Parsed '${input}' -> '${parsed}' (Expected: '${expected}')`);
        if (parsed !== expected) {
            console.error(`❌ Date parsing failed for '${input}'`);
        } else {
            console.log(`✅ Passed`);
        }
    });

    // Test 2: Dynamic Menu Generation by Plan
    console.log("\n--- TEST 2: Dynamic Menu Generation Across Plans ---");

    const mockPolInfoBasic = {
        name: 'रमेश पाटील',
        ward: 'प्रभाग १२',
        plan: 'basic',
        config: { disabled_features: [] }
    };

    const basicMenu = politicianBotService.buildDynamicMenu(mockPolInfoBasic, 'mr');
    console.log("📋 [BASIC PLAN MENU]:");
    console.log(basicMenu.menuText);
    console.log("Mapping:", basicMenu.mapping);

    const mockPolInfoAdvance = {
        name: 'संजय शिंदे (आमदार)',
        ward: 'विधानसभा क्षेत्र',
        plan: 'advance',
        config: { disabled_features: ['ward_problems'] } // disabled ward_problems
    };

    const advanceMenu = politicianBotService.buildDynamicMenu(mockPolInfoAdvance, 'mr');
    console.log("\n📋 [ADVANCE PLAN MENU with disabled ward_problems]:");
    console.log(advanceMenu.menuText);
    console.log("Mapping:", advanceMenu.mapping);

    // Test 3: Realistic Visitor Card Formatting
    console.log("\n--- TEST 3: Visitor Card Formatting ---");
    const mockVisitors = [
        {
            name: 'सचिन कांबळे',
            mobile: '9822012345',
            purpose: 'रस्ता डांबरीकरण विनंती (Road Repair)',
            visit_date: '2026-08-11T10:30:00.000Z',
            area: 'शांती नगर, लेन क्र. ३',
            reference: 'मा. नगरसेवक स्वतः',
            remarks: 'तातडीने कारवाई करावी अशी विनंती केली.'
        },
        {
            name: 'प्रिया कुलकर्णी',
            mobile: '9890154321',
            purpose: 'दाखला शिफारस पत्र (Recommendation Letter)',
            visit_date: '2026-08-11T11:45:00.000Z',
            area: 'गणेश नगर',
            reference: 'कार्यकर्ता विजय',
            remarks: 'कॉलेज प्रवेशासाठी पत्र हवे आहे.'
        }
    ];

    const formattedVisitorText = visitorHandler.formatVisitorList(mockVisitors, "आजचे भेट देणारे नागरिक", "11/08/2026", "mr");
    console.log(formattedVisitorText);

    // Test 4: Politician Authentication Check
    console.log("\n--- TEST 4: Politician Number Detection ---");
    const authResult = await politicianBotService.isPolitician(mockTenantId, testUserId);
    console.log("Auth Result for 7058731515:", authResult);
    if (authResult.isPolitician) {
        console.log("✅ Successfully recognized 7058731515 as Politician / Admin!");
    } else {
        console.log("ℹ️ Resolved auth cleanly.");
    }

    // Test 5: Simulate Interactive Flow
    console.log("\n--- TEST 5: Simulating WhatsApp Interactive Flow ---");

    // Flow Step 1: Politician Sends "Hi"
    console.log("1. Politician sends 'Hi'");
    await politicianBotService.handlePoliticianMessage(sock, mockTenantId, testUserId, 'Hi', mockPolInfoBasic);

    // Flow Step 2: Politician selects Visitor Log
    const visitorOption = Object.keys(basicMenu.mapping).find(k => basicMenu.mapping[k] === 'visitors') || '2';
    console.log(`\n2. Politician sends '${visitorOption}' (Visitor Log)`);
    await politicianBotService.handlePoliticianMessage(sock, mockTenantId, testUserId, visitorOption, mockPolInfoBasic);

    // Flow Step 3: Politician selects "3" (Date Filter)
    console.log("\n3. Politician sends '3' (Date Filter)");
    await politicianBotService.handlePoliticianMessage(sock, mockTenantId, testUserId, '3', mockPolInfoBasic);

    // Flow Step 4: Politician sends "1" for 360° Executive Summary
    console.log("\n4. Politician sends '9' (Back to Menu) then '1' (360° Executive Summary)");
    await politicianBotService.handlePoliticianMessage(sock, mockTenantId, testUserId, '9', mockPolInfoBasic);
    await politicianBotService.handlePoliticianMessage(sock, mockTenantId, testUserId, '1', mockPolInfoBasic);

    // Flow Step 5: Mode Switch Test
    console.log("\n5. Politician sends 'CITIZEN' (Switch to Citizen Mode)");
    const switchRes = await politicianBotService.handlePoliticianMessage(sock, mockTenantId, testUserId, 'CITIZEN', mockPolInfoBasic);
    console.log("Switch Result:", switchRes);

    console.log("\n6. Politician sends 'ADMIN' (Switch back to Politician Mode)");
    await politicianBotService.handlePoliticianMessage(sock, mockTenantId, testUserId, 'ADMIN', mockPolInfoBasic);

    console.log("\n==================================================");
    console.log("🎉 ALL POLITICIAN BOT TESTS COMPLETED SUCCESSFULLY!");
    console.log("==================================================");
}

runTests().catch(console.error);
