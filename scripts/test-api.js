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
  console.log(' Starting EcoCycle Admin & Citizen Authentication Tests');
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
    assert(health.status === 200 && health.data.database?.connected, 'GET /api/health (SQL Server connected)');

    // 2. Fixed Admin Login
    const adminLoginRes = await request('POST', '/api/auth/admin/login', {
      email: 'admin@ecocycle.com',
      password: 'EcoAdmin@2026'
    });
    assert(
      adminLoginRes.status === 200 && adminLoginRes.data.user?.role === 'admin' && adminLoginRes.data.token,
      'POST /api/auth/admin/login (Valid credentials -> role: admin)'
    );
    const adminToken = adminLoginRes.data.token;

    // 3. Fixed Admin Login with invalid password
    const adminBadLogin = await request('POST', '/api/auth/admin/login', {
      email: 'admin@ecocycle.com',
      password: 'WrongPassword123'
    });
    assert(
      adminBadLogin.status === 401,
      'POST /api/auth/admin/login (Wrong password rejected with 401)'
    );

    // 4. Citizen Registration in SQL Server
    const testCitizenEmail = `citizen.${Date.now()}@ecocycle-test.org`;
    const regRes = await request('POST', '/api/auth/citizen/register', {
      name: 'Pooja Narang',
      email: testCitizenEmail,
      phone: '+91 99887 76655',
      password: 'CitizenSecurePass@123',
      confirmPassword: 'CitizenSecurePass@123',
      role: 'admin' // Attempting privilege escalation - backend MUST ignore and enforce 'citizen'
    });
    assert(
      regRes.status === 201 && regRes.data.user?.role === 'citizen',
      'POST /api/auth/citizen/register (New citizen saved with role: citizen in SQL Server)'
    );
    const registeredCitizenToken = regRes.data.token;

    // 5. Duplicate Citizen Registration rejected
    const dupRes = await request('POST', '/api/auth/citizen/register', {
      name: 'Pooja Narang',
      email: testCitizenEmail,
      phone: '+91 99887 76655',
      password: 'CitizenSecurePass@123'
    });
    assert(
      dupRes.status === 409,
      'POST /api/auth/citizen/register (Duplicate email rejected with 409 Conflict)'
    );

    // 6. Citizen Login with registered credentials
    const citizenLoginRes = await request('POST', '/api/auth/citizen/login', {
      email: testCitizenEmail,
      password: 'CitizenSecurePass@123'
    });
    assert(
      citizenLoginRes.status === 200 && citizenLoginRes.data.user?.role === 'citizen' && citizenLoginRes.data.token,
      'POST /api/auth/citizen/login (Citizen authenticated with SQL Server credentials)'
    );
    const citizenToken = citizenLoginRes.data.token;

    // 7. Citizen Login with invalid password
    const citizenBadLogin = await request('POST', '/api/auth/citizen/login', {
      email: testCitizenEmail,
      password: 'WrongPassword'
    });
    assert(
      citizenBadLogin.status === 401,
      'POST /api/auth/citizen/login (Wrong password rejected with 401)'
    );

    // 8. Security Guard: Citizen CANNOT access Admin endpoints
    const forbiddenAdminCheck = await request('GET', '/api/requests', null, citizenToken);
    assert(
      forbiddenAdminCheck.status === 403,
      'GET /api/requests (Citizen token blocked from admin API with 403 Forbidden)'
    );

    // 9. Admin CAN access Admin endpoints
    const adminAccessCheck = await request('GET', '/api/requests', null, adminToken);
    assert(
      adminAccessCheck.status === 200 && Array.isArray(adminAccessCheck.data.requests),
      'GET /api/requests (Admin token successfully accesses all requests)'
    );

    // 10. Citizen CAN create pickup requests
    const newReqRes = await request('POST', '/api/requests', {
      itemName: 'Citizen Old Laptop & Charger',
      categoryId: 1,
      quantity: 1,
      condition: 'Partially Working / Repairable',
      estimatedWeight: 2.8,
      pickupAddress: 'Block C, Sector 18',
      city: 'Bengaluru',
      pincode: '560038',
      preferredPickupDate: '2026-10-28',
      preferredTimeSlot: 'Morning (09:00 AM - 12:00 PM)',
      contactPhone: '+91 99887 76655'
    }, citizenToken);
    assert(
      newReqRes.status === 201 && newReqRes.data.request?.trackingNumber,
      `POST /api/requests (Citizen creates request: ${newReqRes.data.request?.trackingNumber})`
    );
    const createdReq = newReqRes.data.request;

    // 11. Citizen CAN view only their own requests
    const myRequestsRes = await request('GET', '/api/requests/my-requests', null, citizenToken);
    assert(
      myRequestsRes.status === 200 && myRequestsRes.data.requests.length >= 1,
      `GET /api/requests/my-requests (Citizen views only their own ${myRequestsRes.data.requests?.length} requests)`
    );

    // 12. Citizen Dashboard stats
    const dashRes = await request('GET', '/api/reports/user-dashboard', null, citizenToken);
    assert(
      dashRes.status === 200 && dashRes.data.dashboard?.totalRequests >= 1,
      'GET /api/reports/user-dashboard (Citizen dashboard metrics calculated)'
    );

    // 13. Public tracking lookup
    const trackRes = await request('GET', `/api/requests/track/${createdReq.trackingNumber}`);
    assert(
      trackRes.status === 200 && trackRes.data.request?.status === 'Pending',
      'GET /api/requests/track/:id (Public lifecycle timeline accessible)'
    );

    // 14. Admin schedules pickup and assigns agent
    const scheduleRes = await request('PUT', `/api/requests/${createdReq.id}/schedule`, {
      scheduledDate: '2026-10-29 11:00:00',
      assignedAgentName: 'Rahul Sharma',
      timeSlot: 'Morning (11:00 AM - 01:00 PM)'
    }, adminToken);
    assert(
      scheduleRes.status === 200 && scheduleRes.data.request?.status === 'Pickup Scheduled',
      'PUT /api/requests/:id/schedule (Admin assigns agent and sets pickup)'
    );

    // 15. Admin updates status
    const statusRes = await request('PUT', `/api/requests/${createdReq.id}/status`, {
      status: 'Collected',
      notes: 'Items collected from doorstep by agent'
    }, adminToken);
    assert(
      statusRes.status === 200 && statusRes.data.request?.status === 'Collected',
      'PUT /api/requests/:id/status (Admin progresses request to Collected)'
    );

    // 16. Reports Summary
    const summaryRes = await request('GET', '/api/reports/summary', null, adminToken);
    assert(
      summaryRes.status === 200 && summaryRes.data.summary?.totalRequests > 0,
      'GET /api/reports/summary (Admin views real-time recycling reports)'
    );

    console.log('\n============================================================');
    console.log(` Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('============================================================');

    if (failed === 0) {
      console.log('\n ALL ADMIN & CITIZEN AUTHENTICATION TESTS PASSED! \n');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
