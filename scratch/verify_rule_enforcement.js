const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function verifyRuleEnforcement() {
  console.log('--- TESTING SCRATCH CARD MINIMUM ORDER RULE ENFORCEMENT ---');

  const { repo } = require('../lib/repositories');

  // Step 1: Set min order amount to ₹1000
  console.log('\nStep 1: Setting minimum order amount to ₹1000...');
  await repo.scratchCards.updateSettings({
    global_enabled: true,
    min_order_amount: 1000,
    award_trigger: 'on_every_eligible_order',
    allow_multiple_per_customer: true,
  });

  // Step 2: Test Order of ₹500 (below ₹1000)
  console.log('\nStep 2: Placing order for ₹500 (Below threshold ₹1000)...');
  const res1 = await repo.scratchCards.evaluateAndAssignForOrder({
    totalAmount: 500,
    userEmail: 'rule_tester_500@grstyles.com',
    userId: 'user-500',
    orderNumber: 'TEST-500',
  });
  console.log('Result for ₹500 order (Expected 0):', res1.length);
  if (res1.length !== 0) throw new Error('Rule failure: Scratch card assigned for order below threshold!');

  // Step 3: Test Order of ₹1200 (above ₹1000)
  console.log('\nStep 3: Placing order for ₹1200 (Above threshold ₹1000)...');
  const res2 = await repo.scratchCards.evaluateAndAssignForOrder({
    totalAmount: 1200,
    userEmail: 'rule_tester_1200@grstyles.com',
    userId: 'user-1200',
    orderNumber: 'TEST-1200',
  });
  console.log('Result for ₹1200 order (Expected 1):', res2.length);
  if (res2.length === 0) throw new Error('Rule failure: No scratch card assigned for order meeting threshold!');

  // Step 4: Change min order threshold to ₹2000
  console.log('\nStep 4: Dynamically updating minimum order amount to ₹2000...');
  await repo.scratchCards.updateSettings({
    min_order_amount: 2000,
  });

  // Step 5: Test Order of ₹1500 (now below ₹2000)
  console.log('\nStep 5: Placing order for ₹1500 (Now below updated threshold ₹2000)...');
  const res3 = await repo.scratchCards.evaluateAndAssignForOrder({
    totalAmount: 1500,
    userEmail: 'rule_tester_1500@grstyles.com',
    userId: 'user-1500',
    orderNumber: 'TEST-1500',
  });
  console.log('Result for ₹1500 order (Expected 0):', res3.length);
  if (res3.length !== 0) throw new Error('Rule failure: Card assigned for ₹1500 order after limit raised to ₹2000!');

  // Step 6: Test Order of ₹2200 (above ₹2000)
  console.log('\nStep 6: Placing order for ₹2200 (Above updated threshold ₹2000)...');
  const res4 = await repo.scratchCards.evaluateAndAssignForOrder({
    totalAmount: 2200,
    userEmail: 'rule_tester_2200@grstyles.com',
    userId: 'user-2200',
    orderNumber: 'TEST-2200',
  });
  console.log('Result for ₹2200 order (Expected 1):', res4.length);
  if (res4.length === 0) throw new Error('Rule failure: No card assigned for ₹2200 order!');

  console.log('\n--- ALL MINIMUM ORDER AMOUNT RULES ENFORCED 100% PERFECTLY! ---');
}

verifyRuleEnforcement().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
