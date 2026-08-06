const { calculateOrderTotals } = require('../lib/utils/shipping');

const globalConfig = {
  shippingCharge: 49,
  freeShippingAbove: 999,
  freeDelivery: false,
};

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

// 1. Single product with OFF -> uses global shipping
const case1 = calculateOrderTotals(
  [{ price: 500, quantity: 1, deliveryChargeEnabled: false, deliveryCharge: 99 }],
  globalConfig
);
assert(case1.shipping === 49, `Case 1 (OFF -> Global ₹49): expected 49, got ${case1.shipping}`);

// 2. Single product with ON + ₹99 -> returns ₹99
const case2 = calculateOrderTotals(
  [{ price: 500, quantity: 1, deliveryChargeEnabled: true, deliveryCharge: 99 }],
  globalConfig
);
assert(case2.shipping === 99, `Case 2 (ON + ₹99): expected 99, got ${case2.shipping}`);

// 3. Single product with ON + ₹0 -> Free Delivery
const case3 = calculateOrderTotals(
  [{ price: 500, quantity: 1, deliveryChargeEnabled: true, deliveryCharge: 0 }],
  globalConfig
);
assert(case3.shipping === 0, `Case 3 (ON + ₹0): expected 0, got ${case3.shipping}`);

// 4. Product ON + ₹99 and Product ON + ₹0 -> returns ₹99
const case4 = calculateOrderTotals(
  [
    { price: 300, quantity: 1, deliveryChargeEnabled: true, deliveryCharge: 99 },
    { price: 400, quantity: 1, deliveryChargeEnabled: true, deliveryCharge: 0 },
  ],
  globalConfig
);
assert(case4.shipping === 99, `Case 4 (ON ₹99 + ON ₹0): expected 99, got ${case4.shipping}`);

// 5. Product ON + ₹99 and Product OFF (global ₹49) -> returns ₹148
const case5 = calculateOrderTotals(
  [
    { price: 300, quantity: 1, deliveryChargeEnabled: true, deliveryCharge: 99 },
    { price: 200, quantity: 1, deliveryChargeEnabled: false, deliveryCharge: 0 },
  ],
  globalConfig
);
assert(case5.shipping === 148, `Case 5 (ON ₹99 + Global ₹49): expected 148, got ${case5.shipping}`);

// 6. Product ON + ₹0 and Product OFF (global ₹49) -> returns ₹49
const case6 = calculateOrderTotals(
  [
    { price: 300, quantity: 1, deliveryChargeEnabled: true, deliveryCharge: 0 },
    { price: 200, quantity: 1, deliveryChargeEnabled: false, deliveryCharge: 0 },
  ],
  globalConfig
);
assert(case6.shipping === 49, `Case 6 (ON ₹0 + Global ₹49): expected 49, got ${case6.shipping}`);

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
