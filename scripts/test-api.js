const http = require('http');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('============================================================');
  console.log(' Starting EcoCycle Backend Automated Integration Tests');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(`PASS: ${testName}`);
      passed++;
    } else {
      console.error(`FAIL: ${testName} - ${extraInfo}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.data.database.connected, 'GET /api/health (SQL Server connected)');

    // 2. Categories
    const categories = await request('GET', '/api/public/categories');
    assert(categories.status === 200 && categories.data.categories.length > 0, `GET /api/public/categories (Found ${categories.data.categories?.length} categories)`);

    // 3. Public Stats
    const stats = await request('GET', '/api/public/stats');
    assert(stats.status === 200 && stats.data.stats.totalEwasteCollectedKg >= 0, 'GET /api/public/stats');

    // 4. Impact Calculator
    const calc = await request('POST', '/api/public/calculate-impact', { categoryId: 1, weight: 12.5 });
    assert(calc.status === 200 && calc.data.impact.co2SavedKg > 0, `POST /api/public/calculate-impact (CO2 saved: ${calc.data.impact?.co2SavedKg}kg)`);

    // 5. User Login
    const login = await request('POST', '/api/auth/login', { email: 'meghana@example.com', password: 'password123' });
    assert(login.status === 200 && login.data.token, `POST /api/auth/login (User: ${login.data.user?.name})`);
    const userToken = login.data.token;

    // 6. Admin Login
    const adminLogin = await request('POST', '/api/auth/login', { email: 'admin@ecocycle.com', password: 'password123' });
    assert(adminLogin.status === 200 && adminLogin.data.user.role === 'admin', 'POST /api/auth/login (Admin verified)');
    const adminToken = adminLogin.data.token;

    // 7. Get Current User Profile
    const me = await request('GET', '/api/auth/me', null, userToken);
    assert(me.status === 200 && me.data.user.email === 'meghana@example.com', 'GET /api/auth/me');

    // 8. User Dashboard Stats
    const dashboard = await request('GET', '/api/reports/user-dashboard', null, userToken);
    assert(dashboard.status === 200 && dashboard.data.dashboard.totalRequests >= 0, `GET /api/reports/user-dashboard (Total requests: ${dashboard.data.dashboard?.totalRequests})`);

    // 9. Create New Pickup Request
    const newReq = await request('POST', '/api/requests', {
      itemName: 'Old Mac Mini & Keyboards',
      categoryId: 1,
      quantity: 3,
      condition: 'Partially Working / Repairable',
      estimatedWeight: 4.5,
      pickupAddress: 'Flat 402, Sunshine Heights, Indiranagar',
      city: 'Bengaluru',
      pincode: '560038',
      preferredPickupDate: '2026-10-25',
      preferredTimeSlot: 'Morning (9 AM - 12 PM)',
      contactPhone: '+91 98765 99999',
      userNotes: 'Includes original cables and power adapter'
    }, userToken);
    assert(newReq.status === 201 && newReq.data.request?.trackingNumber, `POST /api/requests (Created tracking #${newReq.data.request?.trackingNumber})`);
    const trackingNumber = newReq.data.request?.trackingNumber;
    const createdId = newReq.data.request?.id;

    // 10. Public Tracking Lookup
    const track = await request('GET', `/api/requests/track/${trackingNumber}`);
    assert(track.status === 200 && track.data.request.status === 'Pending', `GET /api/requests/track/:trackingNumber (Status: ${track.data.request?.status})`);

    // 11. Admin Schedule Pickup and Assign Agent
    const schedule = await request('PUT', `/api/requests/${createdId}/schedule`, {
      scheduledDate: '2026-10-26 10:00:00',
      assignedAgentName: 'Rahul Sharma',
      timeSlot: 'Morning (10 AM - 12 PM)',
      notes: 'Customer requested gate call 15 minutes before arrival'
    }, adminToken);
    assert(schedule.status === 200 && schedule.data.request.status === 'Pickup Scheduled', 'PUT /api/requests/:id/schedule');

    // 12. Notifications List
    const notifs = await request('GET', '/api/notifications', null, userToken);
    assert(notifs.status === 200 && notifs.data.notifications.length > 0, `GET /api/notifications (Unread: ${notifs.data.unreadCount})`);

    // 13. Recycling Management Batches
    const recycling = await request('GET', '/api/recycling', null, adminToken);
    assert(recycling.status === 200 && recycling.data.batches.length > 0, `GET /api/recycling (Found ${recycling.data.batches?.length} batches)`);

    // 14. Reports Summary
    const summary = await request('GET', '/api/reports/summary', null, adminToken);
    assert(summary.status === 200 && summary.data.summary.totalRequests > 0, 'GET /api/reports/summary');

    // 15. Reports Monthly Trends
    const monthly = await request('GET', '/api/reports/monthly', null, adminToken);
    assert(monthly.status === 200 && Array.isArray(monthly.data.monthlyData), 'GET /api/reports/monthly');

    // 16. Admin User Management
    const users = await request('GET', '/api/users', null, adminToken);
    assert(users.status === 200 && users.data.users.length >= 6, `GET /api/users (Found ${users.data.users?.length} registered users)`);

    console.log('\n============================================================');
    console.log(` Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('============================================================');

    if (failed === 0) {
      console.log('\n ALL 16 BACKEND INTEGRATION TESTS PASSED PERFECTLY! ');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution exception:', err);
    process.exit(1);
  }
}

runTests();
