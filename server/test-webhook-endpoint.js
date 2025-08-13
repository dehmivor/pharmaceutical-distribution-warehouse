const axios = require('axios');

// Test webhook endpoint
async function testWebhookEndpoint() {
  const baseUrl = process.env.BASE_URL || 'https://anyf.onrender.com';
  const webhookUrl = `${baseUrl}/api/stripe/webhook`;

  console.log('Testing webhook endpoint:', webhookUrl);

  try {
    // Test GET request (should return 200 with message)
    console.log('\n1. Testing GET request...');
    const getResponse = await axios.get(webhookUrl);
    console.log('GET Response:', getResponse.status, getResponse.data);

    // Test POST request with invalid data (should return 400)
    console.log('\n2. Testing POST request with invalid data...');
    const postResponse = await axios.post(
      webhookUrl,
      { test: 'data' },
      {
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'invalid_signature',
        },
      },
    );
    console.log('POST Response:', postResponse.status, postResponse.data);
  } catch (error) {
    if (error.response) {
      console.log('Expected error response:', error.response.status, error.response.data);
    } else {
      console.error('Unexpected error:', error.message);
    }
  }
}

// Test bill status update
async function testBillStatusUpdate() {
  const baseUrl = process.env.BASE_URL || 'https://anyf.onrender.com';
  const billId = process.env.TEST_BILL_ID || 'test_bill_id';

  console.log('\n3. Testing bill status update...');
  console.log('Bill ID:', billId);

  try {
    const response = await axios.get(`${baseUrl}/api/bills/${billId}`);
    console.log('Bill status:', response.data.status);
  } catch (error) {
    if (error.response) {
      console.log('Bill fetch error:', error.response.status, error.response.data);
    } else {
      console.error('Unexpected error:', error.message);
    }
  }
}

// Run tests
async function runTests() {
  console.log('=== Webhook Endpoint Test ===');
  await testWebhookEndpoint();
  await testBillStatusUpdate();
  console.log('\n=== Test Complete ===');
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testWebhookEndpoint, testBillStatusUpdate };
