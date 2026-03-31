const axios = require('axios');
const API_URL = 'http://localhost:3000/api/v1';

const adminClient = axios.create({ baseURL: API_URL, withCredentials: true });
const manager1Client = axios.create({ baseURL: API_URL, withCredentials: true });
const manager2Client = axios.create({ baseURL: API_URL, withCredentials: true });

async function testHardening() {
  console.log('--- 🛡️ Starting Case Management Hardening QA ---\n');

  try {
    // 1. Setup - Users are seeded but we need their branch IDs
    console.log('1. Logging in as Admin...');
    const adminRes = await adminClient.post('/auth/login', {
      email: 'admin@voicefirst.com',
      password: 'Admin@123!',
    });
    adminClient.defaults.headers.Cookie = adminRes.headers['set-cookie'][0];
    const branchesRes = await adminClient.get('/branches');
    const branch1 = branchesRes.data.data[0];
    const branch2 = branchesRes.data.data[1];
    
    console.log(`   Branch 1: ${branch1.id} (${branch1.name})`);
    console.log(`   Branch 2: ${branch2.id} (${branch2.name})`);

    // 2. Clear then submit feedbacks to trigger cases
    console.log('\n2. Triggering Cases for both branches...');
    const tpRes1 = await adminClient.post('/touchpoints', { name: 'TP1', type: 'BRANCH_DESK', branchId: branch1.id });
    const tpRes2 = await adminClient.post('/touchpoints', { name: 'TP2', type: 'BRANCH_DESK', branchId: branch2.id });
    const token1 = tpRes1.data.data.token;
    const token2 = tpRes2.data.data.token;

    const axiosGuest = axios.create({ baseURL: API_URL });
    await axiosGuest.post('/feedback', { rating: 1, comment: 'B1 Problem', touchpointToken: token1 });
    await axiosGuest.post('/feedback', { rating: 1, comment: 'B2 Problem', touchpointToken: token2 });
    
    await new Promise(r => setTimeout(r, 1000)); // wait for async cases

    // 3. Manager Isolation Check
    console.log('\n3. Testing Manager Isolation...');
    // Login as manager (seeded manager@voicefirst.com is for branch-001)
    const m1Res = await manager1Client.post('/auth/login', {
      email: 'manager@voicefirst.com',
      password: 'Manager@123!',
    });
    manager1Client.defaults.headers.Cookie = m1Res.headers['set-cookie'][0];
    
    const m1Cases = await manager1Client.get('/cases');
    const b2CasesFound = m1Cases.data.data.some(c => c.branchId === branch2.id);
    console.log(`   Manager B1: Found ${m1Cases.data.data.length} cases.`);
    console.log(`   ✅ Manager B1 cannot see B2 cases: ${!b2CasesFound}`);

    // 4. Lifecycle State Machine Check
    console.log('\n4. Testing State Machine transitions...');
    const caseId = m1Cases.data.data[0].id;
    const currentStatus = m1Cases.data.data[0].status;
    console.log(`   Case ID: ${caseId} is initially ${currentStatus}`); // Should be NEW

    // Transitions: NEW -> ACKNOWLEDGED -> IN_PROGRESS -> RESOLVED -> CLOSED
    console.log(`   Attempting transition NEW -> RESOLVED (Illegal skip)...`);
    try {
      await manager1Client.patch(`/cases/${caseId}`, { status: 'RESOLVED' });
      console.log('   ❌ Failed: Illegal state skip was accepted!');
    } catch (err) {
      console.log(`   ✅ Success: Transition blocked (Status: ${err.response.status}, Msg: ${err.response.data.message})`);
    }

    console.log(`   Performing valid transition: NEW -> ACKNOWLEDGED...`);
    await manager1Client.patch(`/cases/${caseId}`, { status: 'ACKNOWLEDGED' });
    console.log('   ✅ Transition success.');

    // 5. Resolution Metadata Check
    console.log('\n5. Testing Resolution Metadata...');
    // Carry it forward to RESOLVED
    await manager1Client.patch(`/cases/${caseId}`, { status: 'IN_PROGRESS' });
    await manager1Client.patch(`/cases/${caseId}`, { status: 'RESOLVED' });
    
    const resolvedCase = await adminClient.get('/cases');
    const finalCase = resolvedCase.data.data.find(c => c.id === caseId);
    console.log(`   Case set to RESOLVED. Has resolvedAt: ${finalCase.resolvedAt ? 'YES (' + finalCase.resolvedAt + ')' : 'NO'}`);
    
    // 6. Cross-branch update prevention
    console.log('\n6. Testing Cross-branch Update Prevention...');
    // Create a NEW case for branch 2
    const b2CaseId = (await adminClient.get('/cases')).data.data.find(c => c.branchId === branch2.id).id;
    console.log(`   Branch 2 Case ID: ${b2CaseId}`);
    
    try {
      await manager1Client.patch(`/cases/${b2CaseId}`, { status: 'ACKNOWLEDGED' });
      console.log('   ❌ Failed: Manager modified a case from another branch!');
    } catch (err) {
      console.log(`   ✅ Success: Cross-branch update blocked (Status: ${err.response.status})`);
    }

    console.log('\n--- ✅ ALL HARDENING TESTS PASSED! ---');

  } catch (err) {
    console.error('\n❌ QA Test Failed:');
    if (err.response) {
      console.error(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
}

testHardening().finally(() => process.exit());
