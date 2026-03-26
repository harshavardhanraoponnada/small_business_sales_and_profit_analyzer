#!/usr/bin/env node
/**
 * Nginx Load Balancer Test Script
 * Tests routing through Nginx reverse proxy
 * Usage: node test-nginx.js
 */

const http = require('http');

const NGINX_URL = 'http://localhost:80';
const TESTS = [
  { name: 'Health Check', path: '/health', method: 'GET' },
  { name: 'API - Auth Login', path: '/api/auth/login', method: 'POST', body: { username: 'test', password: 'test' } },
  { name: 'API - Categories', path: '/api/categories', method: 'GET' },
  { name: 'API - Sales', path: '/api/sales', method: 'GET' },
];

function makeRequest(test, index) {
  return new Promise((resolve) => {
    const url = new URL(test.path, NGINX_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Nginx-Test/1.0',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const upstream = res.headers['x-upstream-addr'] || 'unknown';
        const time = res.headers['x-response-time'] || 'N/A';
        
        console.log(`  ✓ Status: ${res.statusCode} | Upstream: ${upstream} | Response Time: ${time}ms`);
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });

    req.on('error', (error) => {
      console.log(`  ✗ Error: ${error.message}`);
      resolve({ status: 0, error: error.message });
    });

    req.setTimeout(5000, () => {
      console.log(`  ✗ Timeout after 5s`);
      req.destroy();
      resolve({ status: 0, error: 'timeout' });
    });

    if (test.body) {
      req.write(JSON.stringify(test.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 Testing Nginx Reverse Proxy\n');
  console.log(`Target: ${NGINX_URL}\n`);

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < TESTS.length; i++) {
    const test = TESTS[i];
    console.log(`${i + 1}. ${test.name} [${test.method}] ${test.path}`);
    
    const result = await makeRequest(test);
    
    if (result.status > 0 && result.status < 500) {
      passed++;
    } else {
      failed++;
    }

    // Small delay between tests
    if (i < TESTS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`\n✅ Summary: ${passed} passed, ${failed} failed\n`);
  
  if (failed === 0) {
    console.log('✓ Nginx reverse proxy is working correctly!\n');
  } else {
    console.log('⚠ Some tests failed. Verify Docker containers are running.\n');
  }
}

runTests().catch(console.error);
