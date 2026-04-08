const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

// We configure a default axios instance that maintains the cookie per session
const adminClient = axios.create({ baseURL: API_URL, withCredentials: true });
const managerClient = axios.create({ baseURL: API_URL, withCredentials: true });

async function runTests() {
  console.log('--- 🚀 Starting Touchpoint E2E Backend Tests ---\n');

  try {
    // 1. Login as ADMIN
    console.log('1️⃣ Logging in as ADMIN (admin@voicefirst.com)...');
    let res = await adminClient.post('/auth/login', {
      email: 'admin@voicefirst.com',
      password: 'Admin@123!',
    });
    // Extract HttpOnly cookie automatically to the adminClient via manual header trick for this pure script
    const adminCookie = res.headers['set-cookie'][0];
    adminClient.defaults.headers.Cookie = adminCookie;
    console.log('✅ Admin Session Acquired\n');

    // 2. Fetch all Branches
    console.log('2️⃣ Admin Fetching All Branches...');
    res = await adminClient.get('/branches');
    const branches = res.data.data;
    console.log(`✅ Found ${branches.length} Branches.`);
    const mainBranchId = branches.find(b => b.code === 'HQ-V1').id;
    console.log(`📌 Using Main Branch ID: ${mainBranchId}\n`);

    // 3. Create a Touchpoint as Admin
    console.log('3️⃣ Admin Creating a new Touchpoint (Help Desk)...');
    const newTouchpoint = await adminClient.post('/touchpoints', {
      name: 'Main Lobby Help Desk',
      type: 'BRANCH_DESK',
      branchId: mainBranchId
    });
    console.log('✅ Touchpoint Created:', newTouchpoint.data.data.name);
    console.log(`🔗 Generated QR Token: ${newTouchpoint.data.data.token}\n`);

    // 4. Login as MANAGER
    console.log('4️⃣ Logging in as MANAGER (manager@voicefirst.com)...');
    res = await managerClient.post('/auth/login', {
      email: 'manager@voicefirst.com',
      password: 'Manager@123!',
    });
    const managerCookie = res.headers['set-cookie'][0];
    managerClient.defaults.headers.Cookie = managerCookie;
    console.log('✅ Manager Session Acquired\n');

    // 5. Manager Fetching Touchpoints (Should only see their own branch)
    console.log('5️⃣ Manager Fetching Allowed Touchpoints...');
    res = await managerClient.get('/touchpoints');
    console.log(`✅ Manager can see ${res.data.data.length} Touchpoints inside their scope.`);
    res.data.data.forEach(t => console.log(`   - ${t.name} (Type: ${t.type})`));
    
    console.log('\n✅ All tests passed successfully!');

  } catch (error) {
    console.error('❌ Test Failed:');
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

runTests();

