#!/usr/bin/env node
/**
 * Multi-Instance Load Balancer Test
 * Verifies that requests are distributed across 3 backend instances
 * Usage: node test-multi-instance.js
 */

const http = require('http');

const NGINX_URL = 'http://localhost:80';
const NUM_REQUESTS = 30;

function makeRequest(index) {
  return new Promise((resolve) => {
    const url = new URL('/api/health', NGINX_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Load-Balancer-Test/1.0',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            status: res.statusCode,
            instance: response.instance,
            uptime: response.uptime,
          });
        } catch (e) {
          resolve({ status: res.statusCode, instance: 'unknown', error: true });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`  ✗ Request ${index}: Error - ${error.message}`);
      resolve({ status: 0, instance: 'error', error: error.message });
    });

    req.setTimeout(5000, () => {
      console.log(`  ✗ Request ${index}: Timeout`);
      req.destroy();
      resolve({ status: 0, instance: 'timeout' });
    });

    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 Multi-Instance Load Balancer Test\n');
  console.log(`Target: ${NGINX_URL}`);
  console.log(`Requests: ${NUM_REQUESTS}\n`);
  console.log('Testing distribution across 3 backend instances...\n');

  const instanceCounts = {
    backend_1: 0,
    backend_2: 0,
    backend_3: 0,
    unknown: 0,
    error: 0,
  };

  const instances = [];

  for (let i = 1; i <= NUM_REQUESTS; i++) {
    const result = await makeRequest(i);
    
    if (result.status === 200) {
      console.log(`${i.toString().padStart(2)}. Status: ${result.status} | Instance: ${result.instance} | Uptime: ${result.uptime.toFixed(2)}s`);
      
      if (result.instance in instanceCounts) {
        instanceCounts[result.instance]++;
        instances.push(result.instance);
      } else {
        instanceCounts.unknown++;
      }
    } else {
      console.log(`${i.toString().padStart(2)}. Status: ${result.status} | Error: ${result.error}`);
      instanceCounts.error++;
    }

    // Small delay between requests for clarity
    if (i < NUM_REQUESTS) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  console.log('\n📊 Load Distribution Summary:\n');
  console.log(`Total Requests: ${NUM_REQUESTS}`);
  console.log(`Successful: ${NUM_REQUESTS - instanceCounts.error}\n`);

  console.log('Instance Distribution:');
  Object.entries(instanceCounts).forEach(([instance, count]) => {
    if (count > 0) {
      const percentage = ((count / NUM_REQUESTS) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(count / 2));
      console.log(`  ${instance.padEnd(15)} ${count.toString().padStart(2)} requests (${percentage}%) ${bar}`);
    }
  });

  // Calculate distribution evenness
  const active = Object.entries(instanceCounts)
    .filter(([k, v]) => k.startsWith('backend_') && v > 0)
    .map(([k, v]) => v);

  if (active.length > 0) {
    const avg = NUM_REQUESTS / active.length;
    const variance = active.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / active.length;
    const stdDev = Math.sqrt(variance);

    console.log(`\n📈 Distribution Evenness:`);
    console.log(`  Expected per instance: ${(avg).toFixed(1)} requests`);
    console.log(`  Standard Deviation: ${stdDev.toFixed(1)}`);
    
    if (stdDev < 2) {
      console.log('  ✓ Load is well-balanced across instances!\n');
    } else if (stdDev < 5) {
      console.log('  ⚠ Load is fairly balanced, but could be better\n');
    } else {
      console.log('  ⚠ Load distribution is uneven. Check if all instances are healthy.\n');
    }
  }

  // Verify all 3 instances are being used
  const activeInstances = Object.entries(instanceCounts)
    .filter(([k, v]) => k.startsWith('backend_') && v > 0)
    .map(([k]) => k);

  console.log(`🏥 Instance Health:`);
  console.log(`  Active instances: ${activeInstances.length}/3 (${activeInstances.join(', ')})`);
  
  if (activeInstances.length === 3) {
    console.log('  ✓ All 3 instances are healthy and receiving traffic!\n');
  } else {
    console.log(`  ⚠ Only ${activeInstances.length} instance(s) healthy. Check container status:\n`);
    console.log('     docker ps | grep backend');
    console.log('     docker logs infosys_backend_X\n');
  }
}

runTests().catch(console.error);
