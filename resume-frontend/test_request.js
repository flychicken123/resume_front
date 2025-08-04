// Test script to debug API request issues
console.log('Testing API request...');

async function testRequest() {
  try {
    // Check if we have a token
    const token = localStorage.getItem('resumeToken');
    console.log('Token exists:', !!token);
    
    if (!token) {
      console.log('❌ No token found - need to login first');
      return;
    }
    
    console.log('Token (first 20 chars):', token.substring(0, 20) + '...');
    
    // Test the request
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    console.log('Request headers:', headers);
    
    const response = await fetch('http://localhost:8081/api/resume/generate-pdf', {
      method: 'POST',
      headers: headers,
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
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success:', result);
    } else {
      const error = await response.json();
      console.log('❌ Error:', error);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Run the test
testRequest(); 