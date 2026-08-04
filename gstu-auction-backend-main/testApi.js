const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const { calculateMinRaise } = require('./auctionSocket');

const BASE_URL = 'http://localhost:5000';

async function apiRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function isServerRunning() {
  try {
    const res = await apiRequest('/api/v1/system/state');
    return res.status === 200;
  } catch (e) {
    return false;
  }
}

async function runTests() {
  console.log('===================================================');
  console.log('  RUNNING AUTOMATED BACKEND API & STATE MACHINE TESTS');
  console.log('===================================================');

  let serverProcess = null;

  // Check if server is running; if not, spawn it programmatically
  const running = await isServerRunning();
  if (!running) {
    console.log('⚡ Server on port 5000 not running. Starting server process for API test suite...');
    serverProcess = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
      stdio: 'pipe'
    });

    // Wait for server to boot up
    let attempts = 0;
    while (attempts < 10) {
      await new Promise(r => setTimeout(r, 500));
      if (await isServerRunning()) break;
      attempts++;
    }
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(` ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(` ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Test System State
    const stateRes = await apiRequest('/api/v1/system/state');
    assert(stateRes.status === 200 && stateRes.data.success, 'System state endpoint returns 200 OK');

    // 2. Test Bidding Raise Math
    const raiseTiers = [
      { minPct: 0, maxPct: 3, raisePct: 0.15 },
      { minPct: 3, maxPct: 10, raisePct: 0.50 },
      { minPct: 10, maxPct: 25, raisePct: 1.00 },
      { minPct: 25, maxPct: 100, raisePct: 2.50 }
    ];
    const budget = 100000000;
    const minRaise1 = calculateMinRaise(1000000, budget, raiseTiers);
    assert(minRaise1 === 150000, 'Min raise math calculation for 1% budget correctly equals $150,000');

    const minRaise2 = calculateMinRaise(15000000, budget, raiseTiers);
    assert(minRaise2 === 1000000, 'Min raise math calculation for 15% budget correctly equals $1,000,000');

    // 3. Test Phase Locking: Shift to AUCTION and attempt registration
    await apiRequest('/api/v1/system/phase', 'POST', { phase: 'AUCTION' });
    const regRes = await apiRequest('/api/v1/players/register', 'POST', { name: 'Test Player', studentId: 'TEST-123', jerseyName: 'T1', primaryPosition: 'ST' });
    assert(regRes.status === 403, 'Registration endpoint correctly locked (403) during AUCTION phase');

    // 4. Test Phase Locking: Shift to TOURNAMENT and attempt auction route
    await apiRequest('/api/v1/system/phase', 'POST', { phase: 'TOURNAMENT' });
    const auctionRes = await apiRequest('/api/v1/auction/min-raise?currentBid=5000000');
    assert(auctionRes.status === 403, 'Auction endpoint correctly locked (403) during TOURNAMENT phase');

    // 5. Test Lifecycle Reset (Nuke Protocol)
    const nukeRes = await apiRequest('/api/v1/admin/nuke', 'POST');
    assert(nukeRes.status === 200 && nukeRes.data.success, 'Nuke protocol endpoint returns 200 OK and resets system');

    const postNukeState = await apiRequest('/api/v1/system/state');
    assert(postNukeState.data.data.phase === 'SETUP', 'System phase reset back to SETUP after Nuke');

    console.log('\n---------------------------------------------------');
    console.log(` TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('---------------------------------------------------');

    if (serverProcess) serverProcess.kill();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('API Test runner error:', err.message);
    if (serverProcess) serverProcess.kill();
    process.exit(1);
  }
}

runTests();
