#!/usr/bin/env node
const http = require('http');

const API_BASE = 'http://localhost:5000/api';
const TEST_ENDPOINT = '/auth/login';
const MAX_REQUESTS = 12;
const REQUEST_DELAY = 100; // ms between requests

function makeRequest(index) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      username: 'test_user',
      password: 'test_password'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api' + TEST_ENDPOINT,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const rateLimit = {
          limit: res.headers['x-ratelimit-limit'],
          remaining: res.headers['x-ratelimit-remaining'],
          retryAfter: res.headers['retry-after'],
        };
        
        console.log(`Request ${index}: Status ${res.statusCode} | Remaining: ${rateLimit.remaining} | Retry-After: ${rateLimit.retryAfter || 'N/A'}`);
        resolve({ status: res.statusCode, rateLimit });
      });
    });

    req.on('error', (error) => {
      console.error(`Request ${index}: Error - ${error.message}`);
      resolve({ status: 0, error: error.message });
    });

    req.write(postData);
    req.end();
  });
}

async function runTest() {
  console.log(`\n🧪 Testing Redis Rate Limiter: ${MAX_REQUESTS} requests to ${TEST_ENDPOINT}`);
  console.log(`Limit: 10 requests/10 minutes (based on LOGIN_RATE_LIMIT_MAX)\n`);

  let blockedCount = 0;
  
  for (let i = 1; i <= MAX_REQUESTS; i++) {
    const result = await makeRequest(i);
    
    if (result.status === 429) {
      blockedCount++;
      console.log(`  ⛔ Request blocked by rate limiter\n`);
    }
    
    // Small delay between requests
    if (i < MAX_REQUESTS) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
    }
  }

  console.log(`\n✅ Test Summary:`);
  console.log(`   Total Requests: ${MAX_REQUESTS}`);
  console.log(`   Allowed: ${MAX_REQUESTS - blockedCount}`);
  console.log(`   Blocked (429): ${blockedCount}`);
  console.log(`\n${blockedCount > 0 ? '✓ Rate limiting is working!' : '⚠ Rate limiting may not be active'}\n`);
}

runTest().catch(console.error);
