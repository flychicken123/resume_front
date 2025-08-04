// Test script to verify authentication flow
console.log('Testing authentication flow...');

// Test 1: Check if localStorage is working
localStorage.setItem('test', 'value');
const testValue = localStorage.getItem('test');
console.log('localStorage test:', testValue === 'value' ? 'PASS' : 'FAIL');

// Test 2: Check if token is stored after login
const token = localStorage.getItem('resumeToken');
const user = localStorage.getItem('resumeUser');
console.log('Current auth state:', { token: !!token, user: !!user });

// Test 3: Test API call with auth headers
async function testAPI() {
  try {
    const token = localStorage.getItem('resumeToken');
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('✅ Token found, will include in API calls');
    } else {
      console.log('❌ No token found, API calls will fail');
    }
    
    // Test the PDF generation endpoint
    const response = await fetch('http://localhost:8081/api/resume/generate-pdf', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        summary: 'Test summary',
        experience: 'Test experience',
        education: 'Test education',
        skills: ['Test', 'Skills'],
        format: 'temp1'
      })
    });
    
    console.log('API Response Status:', response.status);
    
    if (response.ok) {
      console.log('✅ API call successful');
    } else {
      const error = await response.json();
      console.log('❌ API call failed:', error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Run the test
testAPI(); 