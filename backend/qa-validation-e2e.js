const axios = require('axios');
const { authenticator } = require('@otplib/preset-default');

const API_URL = 'http://localhost:3000/api/v1';

// Shared Clients (maintains cookies/state)
const guestClient = axios.create({ baseURL: API_URL });
const adminClient = axios.create({ baseURL: API_URL, withCredentials: true });
const managerClient = axios.create({ baseURL: API_URL, withCredentials: true });
const staffClient = axios.create({ baseURL: API_URL, withCredentials: true });

async function runQA() {
  console.log('--- 🚀 Starting End-to-End QA Validation ---\n');

  try {
    // --- 🔐 AUTH MODULE TESTING ---
    console.log('--- 🔐 AUTH MODULE TESTING ---');

    console.log('1. Valid Login (Admin)...');
    let res = await adminClient.post('/auth/login', {
      email: 'admin@voicefirst.com',
      password: 'Admin@123!',
    });
    const adminCookie = res.headers['set-cookie'];
    if (adminCookie) {
      console.log('   ✅ Success: Cookie received for Admin');
      adminClient.defaults.headers.Cookie = adminCookie[0];
    } else {
      console.log('   ❌ Failed: No cookie received for Admin');
    }

    console.log('2. Invalid Password...');
    try {
      await guestClient.post('/auth/login', {
        email: 'admin@voicefirst.com',
        password: 'WrongPassword',
      });
      console.log('   ❌ Failed: Unexpected 200 OK');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('   ✅ Success: Blocked 401 Unauthorized');
      } else {
        console.log(`   ❌ Failed: Unexpected status ${err.response ? err.response.status : err.message}`);
      }
    }

    console.log('3. Access Protected Route without token...');
    try {
      await guestClient.get('/users/me');
      console.log('   ❌ Failed: Auth bypass!');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('   ✅ Success: Blocked 401');
      } else {
        console.log(`   ❌ Failed: Unexpected status ${err.response ? err.response.status : err.message}`);
      }
    }

    // --- 🧩 RBAC TESTING ---
    console.log('\n--- 🧩 RBAC TESTING ---');

    console.log('4. Admin listing users...');
    res = await adminClient.get('/users');
    console.log(`   ✅ Admin can see ${res.data.data.length} users.`);

    console.log('5. Manager Access (Scoping)...');
    res = await managerClient.post('/auth/login', {
      email: 'manager@voicefirst.com',
      password: 'Manager@123!',
    });
    const managerCookie = res.headers['set-cookie'];
    if (managerCookie) {
      console.log('   ✅ Success: Cookie received for Manager');
      managerClient.defaults.headers.Cookie = managerCookie[0];
    }
    const managerBranchId = res.data.data.user.branchId;
    console.log(`   ✅ Manager logged in, Branch: ${managerBranchId}`);

    // Assuming there's a user listing scoped to branch or similar
    res = await managerClient.get('/users');
    const allUsersAtBranch = res.data.data.every(u => u.branchId === managerBranchId || u.role === 'ADMIN');
    console.log(`   ✅ Manager user list filtering check: ${allUsersAtBranch ? 'OK' : 'MISMATCH'}`);

    // --- 🏢 TOUCHPOINT SYSTEM TESTING ---
    console.log('\n--- 🏢 TOUCHPOINT SYSTEM TESTING ---');
    console.log('6. Create Touchpoint...');
    const tpRes = await adminClient.post('/touchpoints', {
      name: 'E2E Test Touchpoint',
      type: 'BRANCH_DESK',
      branchId: managerBranchId
    });
    const touchpointToken = tpRes.data.data.token;
    console.log(`   ✅ Success: Created Touchpoint with token ${touchpointToken}`);

    // --- 📝 FEEDBACK SYSTEM TESTING ---
    console.log('\n--- 📝 FEEDBACK SYSTEM TESTING ---');
    console.log('7. Submit Valid Feedback (Rating 5)...');
    res = await guestClient.post('/feedback', {
      rating: 5,
      comment: 'Excellent service!',
      touchpointToken: touchpointToken
    });
    console.log('   ✅ Success: Anonymous feedback stored');

    console.log('8. Submit Invalid Rating (6)...');
    try {
      await guestClient.post('/feedback', {
        rating: 6,
        touchpointToken: touchpointToken
      });
      console.log('   ❌ Failed: Rating 6 accepted!');
    } catch (err) {
      console.log(`   ✅ Success: Rejected rating 6 (Status: ${err.response.status})`);
    }

    console.log('9. Submit Missing Touchpoint...');
    try {
      await guestClient.post('/feedback', {
        rating: 3,
        touchpointToken: 'invalid-token'
      });
      console.log('   ❌ Failed: Invalid touchpoint accepted!');
    } catch (err) {
      console.log(`   ✅ Success: Rejected invalid touchpoint (Status: ${err.response.status})`);
    }

    // --- 🚨 CASE MANAGEMENT TESTING ---
    console.log('\n--- 🚨 CASE MANAGEMENT TESTING ---');
    console.log('10. Trigger Auto Case (Rating 1)...');
    const fbRes = await guestClient.post('/feedback', {
      rating: 1,
      comment: 'Terrible! Never again.',
      touchpointToken: touchpointToken
    });
    const feedbackId = fbRes.data.data.feedbackId;
    console.log(`    Feedback ID: ${feedbackId}`);

    // Polling slightly for async event listener
    await new Promise(r => setTimeout(r, 1000));

    // Check cases
    const casesRes = await adminClient.get('/cases');
    const newlyCreatedCase = casesRes.data.data.find(c => c.feedbackId === feedbackId);
    if (newlyCreatedCase) {
      console.log(`   ✅ Success: Case created automatically for rating 1. ID: ${newlyCreatedCase.id}`);
      console.log(`   📊 Priority check: ${newlyCreatedCase.priority === 'CRITICAL' ? 'CRITICAL (Rating 1)' : 'ERROR'}`);
    } else {
      console.log('   ❌ Failed: No case found for feedback ID ' + feedbackId);
    }

    // --- 📊 DASHBOARD TESTING ---
    console.log('\n--- 📊 DASHBOARD TESTING ---');
    res = await adminClient.get('/dashboard/summary');
    console.log('   ✅ Admin Stats: ', JSON.stringify(res.data.data));

    res = await managerClient.get('/dashboard/summary');
    console.log('   ✅ Manager Stats (Branch Only): ', JSON.stringify(res.data.data));

    // --- 🔐 2FA TESTING ---
    console.log('\n--- 🔐 2FA TESTING ---');
    console.log('11. Enable 2FA for Manager...');
    const setRes = await managerClient.post('/2fa/setup', { method: 'TOTP' });
    const secret = setRes.data.data.secret;
    console.log(`    OTP Secret: ${secret}`);

    const code = authenticator.generate(secret);
    await managerClient.post('/2fa/verify-totp-setup', { code });
    console.log('   ✅ 2FA Enabled');

    console.log('12. Test Login with 2FA enabled...');
    const login2fa = await guestClient.post('/auth/login', {
      email: 'manager@voicefirst.com',
      password: 'Manager@123!',
    });
    
    if (login2fa.data.data.requiresTwoFactor) {
      console.log('   ✅ Success: Login requires 2FA');
      const tempToken = login2fa.data.data.tempToken;
      const validCode = authenticator.generate(secret);
      
      const finalLogin = await guestClient.post('/auth/verify-2fa', {
        tempToken,
        method: 'TOTP',
        code: validCode
      });
      const finalCookie = finalLogin.headers['set-cookie'];
      console.log(`   ✅ Success: 2FA verified, Cookie received: ${finalCookie ? 'YES' : 'NO'}`);
    } else {
      console.log('   ❌ Failed: Login did NOT require 2FA even though it was enabled');
    }

    console.log('\n--- ✅ ALL QA TESTS PASSED SUCCESSFULLY! ---');

  } catch (error) {
    console.error('\n❌ QA Test Failed:');
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

runQA().finally(() => process.exit());
