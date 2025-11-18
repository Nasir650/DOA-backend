const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_USER = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  password: 'TestPass123!',
  confirmPassword: 'TestPass123!',
  acceptTerms: true
};

let authToken = '';

// Helper function for API calls
async function apiCall(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n🔍 Testing Health Check...');
  const result = await apiCall('GET', '/health');
  
  if (result.success) {
    console.log('✅ Health check passed:', result.data);
  } else {
    console.log('❌ Health check failed:', result.error);
  }
  
  return result.success;
}

async function testUserRegistration() {
  console.log('\n👤 Testing User Registration...');
  const result = await apiCall('POST', '/auth/register', TEST_USER);
  
  if (result.success) {
    console.log('✅ User registration successful');
    authToken = result.data.data?.token;
    return true;
  } else {
    console.log('❌ User registration failed:', result.error);
    return false;
  }
}

async function testUserLogin() {
  console.log('\n🔐 Testing User Login...');
  const loginData = {
    email: TEST_USER.email,
    password: TEST_USER.password
  };
  
  const result = await apiCall('POST', '/auth/login', loginData);
  
  if (result.success) {
    console.log('✅ User login successful');
    authToken = result.data.data?.token;
    return true;
  } else {
    console.log('❌ User login failed:', result.error);
    return false;
  }
}

async function testAuthenticatedEndpoints() {
  if (!authToken) {
    console.log('❌ No auth token available for authenticated tests');
    return false;
  }
  
  console.log('\n🔒 Testing Authenticated Endpoints...');
  
  // Test get current user
  const meResult = await apiCall('GET', '/auth/me', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (meResult.success) {
    console.log('✅ Get current user successful');
  } else {
    console.log('❌ Get current user failed:', meResult.error);
  }
  
  // Test token verification
  const verifyResult = await apiCall('GET', '/auth/verify-token', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (verifyResult.success) {
    console.log('✅ Token verification successful');
  } else {
    console.log('❌ Token verification failed:', verifyResult.error);
  }
  
  return meResult.success && verifyResult.success;
}

async function testPublicEndpoints() {
  console.log('\n🌐 Testing Public Endpoints...');
  
  // Test leaderboard
  const leaderboardResult = await apiCall('GET', '/users/leaderboard');
  
  if (leaderboardResult.success) {
    console.log('✅ Leaderboard endpoint successful');
  } else {
    console.log('❌ Leaderboard endpoint failed:', leaderboardResult.error);
  }
  
  // Test votes health
  const votesHealthResult = await apiCall('GET', '/votes/health');
  
  if (votesHealthResult.success) {
    console.log('✅ Votes health endpoint successful');
  } else {
    console.log('❌ Votes health endpoint failed:', votesHealthResult.error);
  }
  
  // Test admin health
  const adminHealthResult = await apiCall('GET', '/admin/health');
  
  if (adminHealthResult.success) {
    console.log('✅ Admin health endpoint successful');
  } else {
    console.log('❌ Admin health endpoint failed:', adminHealthResult.error);
  }
  
  return leaderboardResult.success;
}

async function testContributionsEndpoint() {
  if (!authToken) {
    console.log('❌ No auth token available for contributions test');
    return false;
  }
  
  console.log('\n💰 Testing Contributions Endpoints...');
  
  // Test get user contributions
  const contributionsResult = await apiCall('GET', '/contributions/mine', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (contributionsResult.success) {
    console.log('✅ Get user contributions successful');
    return true;
  } else {
    console.log('❌ Get user contributions failed:', contributionsResult.error);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...');
  
  // Test invalid endpoint
  const invalidResult = await apiCall('GET', '/invalid-endpoint');
  
  if (invalidResult.status === 404) {
    console.log('✅ 404 error handling working correctly');
  } else {
    console.log('❌ 404 error handling not working properly');
  }
  
  // Test invalid login
  const invalidLoginResult = await apiCall('POST', '/auth/login', {
    email: 'invalid@example.com',
    password: 'wrongpassword'
  });
  
  if (!invalidLoginResult.success && invalidLoginResult.status === 400) {
    console.log('✅ Invalid login error handling working correctly');
  } else {
    console.log('❌ Invalid login error handling not working properly');
  }
  
  return true;
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting DOA Backend API Tests...');
  console.log(`📍 Testing API at: ${BASE_URL}`);
  
  const results = {
    healthCheck: false,
    registration: false,
    login: false,
    authenticated: false,
    public: false,
    contributions: false,
    errorHandling: false
  };
  
  try {
    results.healthCheck = await testHealthCheck();
    results.registration = await testUserRegistration();
    
    // If registration fails, try login with existing user
    if (!results.registration) {
      results.login = await testUserLogin();
    }
    
    results.authenticated = await testAuthenticatedEndpoints();
    results.public = await testPublicEndpoints();
    results.contributions = await testContributionsEndpoint();
    results.errorHandling = await testErrorHandling();
    
  } catch (error) {
    console.error('❌ Test runner error:', error.message);
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const testNames = {
    healthCheck: 'Health Check',
    registration: 'User Registration',
    login: 'User Login',
    authenticated: 'Authenticated Endpoints',
    public: 'Public Endpoints',
    contributions: 'Contributions Endpoints',
    errorHandling: 'Error Handling'
  };
  
  let passedTests = 0;
  const totalTests = Object.keys(results).length;
  
  for (const [key, passed] of Object.entries(results)) {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testNames[key]}`);
    if (passed) passedTests++;
  }
  
  console.log('========================');
  console.log(`📈 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the API configuration.');
  }
  
  return passedTests === totalTests;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, apiCall };
