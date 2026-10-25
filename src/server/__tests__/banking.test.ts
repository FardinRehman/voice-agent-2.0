import { db } from '../db.ts';
import { executeBankingTool, ToolExecutionContext } from '../tools.ts';
import { telephonyAdapter } from '../telephony.ts';

async function runAcceptanceTests() {
  console.log('=== RUNNING XYZ BANK AI VOICE PLATFORM ACCEPTANCE TESTS ===');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail || ''}`);
      failed++;
    }
  }

  // Reset database to ensure clean state
  db.seed();

  const mockContext: ToolExecutionContext = {
    callId: 'CALL-TEST-001',
    authenticatedCustomerId: undefined,
    setAuthenticatedCustomerId: (id: string) => {
      mockContext.authenticatedCustomerId = id;
    },
    callerPhone: '+91 98765 43210',
  };

  // Test 1: Unauthenticated balance request is blocked
  const res1 = await executeBankingTool('get_account_balance', {}, mockContext);
  assert(
    res1.status === 'FAILED' && res1.result.error === 'AUTHENTICATION_REQUIRED',
    '1. Unauthenticated balance request is denied'
  );

  // Test 2: Simulated OTP verification
  const otpRes = await executeBankingTool(
    'verify_customer',
    { mobileNumber: '+91 98765 43210', requestOtp: true },
    mockContext
  );
  assert(
    otpRes.result.otpSent === true && !!otpRes.result.simulationDevOtp,
    '2. Simulated OTP generated successfully'
  );

  const otp = otpRes.result.simulationDevOtp;
  const authRes = await executeBankingTool(
    'verify_customer',
    { mobileNumber: '+91 98765 43210', otp },
    mockContext
  );
  assert(
    authRes.result.authenticated === true && mockContext.authenticatedCustomerId === 'CUST-1001',
    '3. Authenticated customer with valid OTP'
  );

  // Test 3: Authenticated customer retrieves balance
  // CUST-1001 has 2 accounts, so without args it asks which one or handles disambiguation
  const res3 = await executeBankingTool('get_account_balance', { last4Digits: '4821' }, mockContext);
  assert(
    res3.status === 'SUCCESS' && res3.result.availableBalance === 148500.5,
    '4. Balance retrieval matches exact database record (₹1,48,500.50)'
  );

  // Test 4: Transaction history
  const res4 = await executeBankingTool('get_transaction_history', { limit: 5 }, mockContext);
  assert(
    res4.status === 'SUCCESS' && res4.result.transactions.length > 0,
    '5. Transaction history returns actual seeded transactions'
  );

  // Test 5: Urgent card blocking
  const res5 = await executeBankingTool(
    'block_card',
    { cardIdOrLast4: '4829', reason: 'Lost card near market', confirmedByCustomer: true },
    mockContext
  );
  assert(
    res5.status === 'SUCCESS' && res5.result.newStatus === 'TEMPORARILY_BLOCKED',
    '6. Card blocking executed and status updated in database'
  );

  // Verify database record directly
  const cardInDb = db.getCardById('CARD-3001');
  assert(
    cardInDb?.status === 'TEMPORARILY_BLOCKED',
    '7. Database persistence verified for blocked card'
  );

  // Test 6: Ineligible card unblocking (Permanently blocked card)
  // Switch to CUST-1005 (Vikram Joshi who has CARD-3006 PERMANENTLY_BLOCKED)
  mockContext.authenticatedCustomerId = 'CUST-1005';
  const res6 = await executeBankingTool(
    'unblock_card',
    { cardIdOrLast4: '5588', reason: 'Found it', confirmedByCustomer: true },
    mockContext
  );
  assert(
    res6.status === 'FAILED' && res6.result.message.includes('permanently blocked'),
    '8. Ineligible permanently blocked card cannot be unblocked'
  );

  // Test 7: Branch discovery
  const res7 = await executeBankingTool('find_nearby_branches', { query: 'Indiranagar' }, mockContext);
  assert(
    res7.status === 'SUCCESS' && res7.result.branches.length > 0 && res7.result.branches[0].name.includes('Indiranagar'),
    '9. Branch locator finds exact matching branch and hours'
  );

  // Test 8: Complaint creation
  mockContext.authenticatedCustomerId = 'CUST-1001';
  const res8 = await executeBankingTool(
    'create_complaint',
    {
      category: 'Failed UPI Transaction',
      description: 'Debited Rs 500 at metro station, ticket not issued',
      confirmedByCustomer: true,
    },
    mockContext
  );
  assert(
    res8.status === 'SUCCESS' && res8.result.ticketId.startsWith('TICK-'),
    '10. Complaint registered with unique ticket ID'
  );

  // Test 9: Cross-customer access prevention
  // CUST-1001 attempting to modify CUST-1005's card
  const crossRes = db.blockCard('CARD-3006', 'CUST-1001', 'Malicious attempt');
  assert(
    crossRes.success === false,
    '11. Cross-customer card modification rejected by backend authorization'
  );

  // Test 10: Telephony webhook generation
  const webhook = telephonyAdapter.handleInboundCall({
    callSid: 'CA-TEST-12345',
    from: '+919876543210',
    to: '+918040009999',
    callStatus: 'in-progress',
  });
  assert(
    webhook.xmlResponse.includes('<Stream url="') && !!webhook.sessionId,
    '12. Inbound telephony call creates valid TwiML media stream instruction'
  );

  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAcceptanceTests().catch(console.error);
