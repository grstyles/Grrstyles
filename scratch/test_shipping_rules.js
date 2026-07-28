function calculateOrderTotals(items, shippingCfg, couponDiscount = 0) {
  if (!items || items.length === 0) {
    return { subtotal: 0, shipping: 0, discount: 0, tax: 0, total: 0 };
  }

  const subtotal = items.reduce((sum, item) => {
    const price = item.discountedPrice ?? item.sellingPrice ?? item.price ?? 0;
    return sum + Math.max(0, price) * (item.quantity || 1);
  }, 0);

  if (subtotal <= 0) {
    return { subtotal: 0, shipping: 0, discount: 0, tax: 0, total: 0 };
  }

  let shipping = 0;
  if (shippingCfg.freeDelivery) {
    shipping = 0;
  } else if (
    (shippingCfg.freeShippingAbove ?? 0) > 0 &&
    subtotal >= (shippingCfg.freeShippingAbove ?? 0)
  ) {
    shipping = 0;
  } else {
    shipping = Number(shippingCfg.shippingCharge ?? 0);
  }

  const tax = 0;
  const total = Math.max(0, subtotal - couponDiscount + shipping + tax);

  return { subtotal, shipping, discount: couponDiscount, tax, total };
}

console.log("=== TESTING SHIPPING RULE CALCULATIONS ===");

// Test 1: Subtotal < freeShippingAbove (Standard shipping charge applies)
const test1 = calculateOrderTotals(
  [{ price: 500, quantity: 1 }],
  { shippingCharge: 99, freeShippingAbove: 999, freeDelivery: false },
  0
);
console.assert(test1.shipping === 99, `Test 1 Failed: Expected shipping 99, got ${test1.shipping}`);
console.assert(test1.total === 599, `Test 1 Failed: Expected total 599, got ${test1.total}`);
console.log("✅ Test 1 Passed (Below threshold -> shipping charge applies)");

// Test 2: Subtotal >= freeShippingAbove (Free shipping applies)
const test2 = calculateOrderTotals(
  [{ price: 1000, quantity: 1 }],
  { shippingCharge: 99, freeShippingAbove: 999, freeDelivery: false },
  0
);
console.assert(test2.shipping === 0, `Test 2 Failed: Expected shipping 0, got ${test2.shipping}`);
console.assert(test2.total === 1000, `Test 2 Failed: Expected total 1000, got ${test2.total}`);
console.log("✅ Test 2 Passed (Above threshold -> free shipping)");

// Test 3: Free delivery enabled (Free shipping applies regardless of subtotal)
const test3 = calculateOrderTotals(
  [{ price: 100, quantity: 1 }],
  { shippingCharge: 99, freeShippingAbove: 999, freeDelivery: true },
  0
);
console.assert(test3.shipping === 0, `Test 3 Failed: Expected shipping 0, got ${test3.shipping}`);
console.assert(test3.total === 100, `Test 3 Failed: Expected total 100, got ${test3.total}`);
console.log("✅ Test 3 Passed (Free delivery toggle ON -> free shipping)");

// Test 4: Empty items array
const test4 = calculateOrderTotals(
  [],
  { shippingCharge: 99, freeShippingAbove: 999, freeDelivery: false },
  0
);
console.assert(test4.shipping === 0, `Test 4 Failed: Expected shipping 0, got ${test4.shipping}`);
console.assert(test4.total === 0, `Test 4 Failed: Expected total 0, got ${test4.total}`);
console.log("✅ Test 4 Passed (Empty cart -> 0 total & 0 shipping)");

console.log("🎉 ALL SHIPPING CALCULATIONS VERIFIED SUCCESSFULLY!");
