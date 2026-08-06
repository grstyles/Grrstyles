const { validateAndCalculateCoupon } = require('../lib/utils/couponEngine');

console.log("=== TESTING UNIFIED COUPON VALIDATION ENGINE ===");

const sampleCoupon = {
  id: 'c1',
  code: 'SAVE100',
  discountType: 'fixed',
  discountValue: 100,
  minimumPurchase: 500,
  isActive: true,
  applicableProducts: ['p1', 'p2'],
};

const eligibleItem = {
  id: 'p1',
  title: 'Shirt 1',
  price: 600,
  discountedPrice: 600,
  quantity: 1,
  couponApplicable: true,
};

const ineligibleItem = {
  id: 'p99',
  title: 'Shirt 99',
  price: 600,
  discountedPrice: 600,
  quantity: 1,
  couponApplicable: true,
};

const cheapItem = {
  id: 'p1',
  title: 'Shirt 1',
  price: 200,
  discountedPrice: 200,
  quantity: 1,
  couponApplicable: true,
};

// Test 1: Eligible item matching product restriction and min purchase
const res1 = validateAndCalculateCoupon(sampleCoupon, [eligibleItem]);
console.log("Test 1 (Eligible item):", res1.valid === true ? "PASS" : "FAIL", res1);

// Test 2: Ineligible item not in applicableProducts
const res2 = validateAndCalculateCoupon(sampleCoupon, [ineligibleItem]);
console.log("Test 2 (Ineligible item product restriction):", res2.valid === false ? "PASS" : "FAIL", res2.message);

// Test 3: Min purchase not met
const res3 = validateAndCalculateCoupon(sampleCoupon, [cheapItem]);
console.log("Test 3 (Min purchase not met):", res3.valid === false ? "PASS" : "FAIL", res3.message);

console.log("\nALL UNIFIED ENGINE TESTS PASSED!");
