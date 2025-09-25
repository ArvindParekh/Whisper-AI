// Debug script to test the init endpoint
// Run this with: node debug-init.js

const testInit = async () => {
    const meetingId = "bbbfcff0-14cf-4bec-9e37-a35d89fecf7e";
    const sessionId = "test-session-123";
    const authToken = "your-auth-token-here";
    
    const url = `https://agents-backend.aruparekh2.workers.dev/init?meetingId=${meetingId}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Session-ID': sessionId,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            console.log('✅ Agent initialized successfully!');
        } else {
            const errorText = await response.text();
            console.log('❌ Error response:', errorText);
        }
    } catch (error) {
        console.error('❌ Request failed:', error);
    }
};

// Check if we're in Node.js environment
if (typeof fetch === 'undefined') {
    console.log('This script requires a fetch implementation. Try running in a modern Node.js environment or browser.');
} else {
    testInit();
}
