const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function runE2ETest() {
  console.log('--- STARTING E2E SCRATCH CARDS VERIFICATION TEST ---');

  const { repo } = require('../lib/repositories');

  // 1. Get default settings
  console.log('1. Testing getSettings()...');
  const settings = await repo.scratchCards.getSettings();
  console.log('Settings:', settings);

  // 2. Update settings
  console.log('\n2. Testing updateSettings()...');
  const updatedSettings = await repo.scratchCards.updateSettings({
    min_order_amount: 2000,
    award_trigger: 'on_every_eligible_order',
  });
  console.log('Updated Settings:', updatedSettings);

  // 3. Create Scratch Card
  console.log('\n3. Testing createCard()...');
  const newCard = await repo.scratchCards.createCard({
    title: 'E2E Gold Reward',
    subtitle: 'Scratch & Win Big!',
    description: 'Special test card for automated verification',
    reward_type: 'flat_discount',
    reward_value: 500,
    coupon_code: 'GOLD500',
    winning_probability: 1.0,
    max_global_claims: 100,
    max_claims_per_user: 1,
    is_active: true,
  });
  console.log('Created Card:', newCard);

  // 4. Test evaluateAndAssignForOrder with order amount below threshold (1500 < 2000)
  console.log('\n4. Testing evaluateAndAssignForOrder below threshold (₹1500)...');
  const belowCards = await repo.scratchCards.evaluateAndAssignForOrder({
    totalAmount: 1500,
    userEmail: 'testuser@grstyles.com',
    userId: 'user-test-e2e',
    orderNumber: 'GR-E2E-BELOW',
  });
  console.log('Assigned Cards below threshold:', belowCards.length);

  // 5. Test evaluateAndAssignForOrder with qualifying order (2500 >= 2000)
  console.log('\n5. Testing evaluateAndAssignForOrder qualifying order (₹2500)...');
  const assignedCards = await repo.scratchCards.evaluateAndAssignForOrder({
    totalAmount: 2500,
    userEmail: 'testuser@grstyles.com',
    userId: 'user-test-e2e',
    orderNumber: 'GR-E2E-QUALIFY',
  });
  console.log('Assigned Cards for qualifying order:', assignedCards.length);
  if (assignedCards.length > 0) {
    console.log('Assigned Card:', assignedCards[0]);
  }

  // 6. Fetch user scratch cards
  console.log('\n6. Testing getUserCards()...');
  const userCards = await repo.scratchCards.getUserCards('user-test-e2e', 'testuser@grstyles.com');
  console.log('User Cards Count:', userCards.length);

  // 7. Claim reward for assigned card
  if (userCards.length > 0) {
    const targetCard = userCards[0];
    console.log(`\n7. Testing claimReward() for card ${targetCard.id}...`);
    const claimRes = await repo.scratchCards.claimReward(targetCard.id, 'user-test-e2e');
    console.log('Claim Result:', claimRes);

    // Test duplicate claim prevention
    console.log('\n8. Testing duplicate claim prevention...');
    const dupClaimRes = await repo.scratchCards.claimReward(targetCard.id, 'user-test-e2e');
    console.log('Duplicate Claim Result:', dupClaimRes);
  }

  // 8. Test Dashboard stats
  console.log('\n9. Testing getDashboardStats()...');
  const stats = await repo.scratchCards.getDashboardStats();
  console.log('Dashboard Stats:', stats);

  console.log('\n--- E2E SCRATCH CARDS VERIFICATION COMPLETED SUCCESSFULLY ---');
}

runE2ETest().catch((err) => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
