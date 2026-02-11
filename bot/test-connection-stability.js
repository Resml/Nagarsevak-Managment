// Test script to verify WhatsApp bot connection stability
const io = require('socket.io-client');

const SOCKET_URL = 'http://localhost:4000';
const TEST_TENANT_ID = 'test-tenant';

console.log('🧪 Testing WhatsApp Bot Connection Stability...\n');

const socket = io(SOCKET_URL);

let testResults = {
    connection: false,
    joinTenant: false,
    startSession: false,
    logout: false
};

socket.on('connect', () => {
    console.log('✅ Connected to Bot Server');
    testResults.connection = true;
    
    // Test joining tenant room
    console.log('📝 Testing tenant join...');
    socket.emit('join_tenant', { tenantId: TEST_TENANT_ID });
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from Bot Server');
    printResults();
});

socket.on('status', (status) => {
    console.log(`📊 Status update: ${status}`);
    
    if (status === 'scanning' || status === 'connecting') {
        testResults.startSession = true;
        console.log('✅ Session started successfully');
        
        // Test logout after 3 seconds
        setTimeout(() => {
            console.log('🔒 Testing logout functionality...');
            socket.emit('logout_session', { tenantId: TEST_TENANT_ID });
        }, 3000);
    } else if (status === 'disconnected') {
        testResults.logout = true;
        console.log('✅ Logout functionality works');
        
        // End test
        setTimeout(() => {
            socket.disconnect();
        }, 1000);
    }
});

socket.on('qr', (qr) => {
    if (qr) {
        console.log('📱 QR code received (connection test passed)');
        testResults.joinTenant = true;
    } else {
        console.log('🧹 QR code cleared');
    }
});

socket.on('logged_out', () => {
    console.log('✅ Logout confirmation received');
    testResults.logout = true;
});

function printResults() {
    console.log('\n📋 Test Results:');
    console.log('================');
    Object.entries(testResults).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const allPassed = Object.values(testResults).every(result => result);
    console.log(`\n🎯 Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    
    process.exit(allPassed ? 0 : 1);
}

// Timeout after 30 seconds
setTimeout(() => {
    console.log('⏰ Test timeout - disconnecting');
    printResults();
}, 30000);
