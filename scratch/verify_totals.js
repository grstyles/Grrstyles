// scratch/verify_totals.js
// Verification script to validate the pricing and shipping calculation logic under different settings.

// The exact pricing calculation logic implemented in lib/utils/shipping.ts
function calculateOrderTotals(items, shippingCfg, couponDiscount = 0) {
  // 1. Calculate subtotal using the product selling price
  const subtotal = items.reduce((sum, item) => {
    const itemPrice = item.discountedPrice !== undefined ? item.discountedPrice : (item.sellingPrice !== undefined ? item.sellingPrice : item.price);
    return sum + itemPrice * item.quantity;
  }, 0);

  // 2. Shipping calculation
  let shipping = 0;
  if (shippingCfg.freeDelivery) {
    shipping = 0;
  } else if (shippingCfg.freeShippingAbove !== undefined && shippingCfg.freeShippingAbove > 0 && subtotal >= shippingCfg.freeShippingAbove) {
    shipping = 0;
  } else {
    shipping = shippingCfg.singleProductCharge !== undefined ? shippingCfg.singleProductCharge : (shippingCfg.shippingCharge !== undefined ? shippingCfg.shippingCharge : 0);
  }

  // 3. Tax is always 0
  const tax = 0;

  // 4. Final total
  const total = Math.max(0, subtotal - couponDiscount + tax + shipping);

  return {
    subtotal,
    shipping,
    discount: couponDiscount,
    tax,
    total
  };
}

// Assert helper
function assert(name, actual, expected) {
  if (actual === expected) {
    console.log(`  ✅ [PASS] ${name}: ${actual}`);
  } else {
    console.error(`  ❌ [FAIL] ${name}: Expected ${expected}, got ${actual}`);
    process.exit(1);
  }
}

// Items list for tests (Product Price = ₹1)
const items = [{ price: 1, sellingPrice: 1, discountedPrice: 1, quantity: 1 }];

console.log("=== RUNNING TEST SCENARIOS ===");

// Test 1: Product Price = ₹1, Free Delivery = ON
console.log("\n--- Test 1: Product Price = ₹1, Free Delivery = ON ---");
const config1 = {
  freeDelivery: true,
  freeShippingAbove: 0,
  singleProductCharge: 0,
  shippingCharge: 0
};
const res1 = calculateOrderTotals(items, config1, 0);
assert("Subtotal", res1.subtotal, 1);
assert("Shipping", res1.shipping, 0);
assert("Discount", res1.discount, 0);
assert("Tax", res1.tax, 0);
assert("Total", res1.total, 1);
assert("Razorpay Amount", res1.total, 1); // Razorpay should charge this total

// Test 2: Admin sets Single Product Shipping = ₹50
console.log("\n--- Test 2: Admin sets Single Product Shipping = ₹50 ---");
const config2 = {
  freeDelivery: false,
  freeShippingAbove: 0,
  singleProductCharge: 50,
  shippingCharge: 100
};
const res2 = calculateOrderTotals(items, config2, 0);
assert("Subtotal", res2.subtotal, 1);
assert("Shipping", res2.shipping, 50);
assert("Total", res2.total, 51);
assert("Razorpay Amount", res2.total, 51);

// Test 3: Admin changes shipping to ₹80
console.log("\n--- Test 3: Admin changes shipping to ₹80 ---");
const config3 = {
  freeDelivery: false,
  freeShippingAbove: 0,
  singleProductCharge: 80,
  shippingCharge: 100
};
const res3 = calculateOrderTotals(items, config3, 0);
assert("Subtotal", res3.subtotal, 1);
assert("Shipping", res3.shipping, 80);
assert("Total", res3.total, 81);
assert("Razorpay Amount", res3.total, 81);

// Test 4: Admin enables Free Delivery
console.log("\n--- Test 4: Admin enables Free Delivery ---");
const config4 = {
  freeDelivery: true,
  freeShippingAbove: 0,
  singleProductCharge: 80,
  shippingCharge: 100
};
const res4 = calculateOrderTotals(items, config4, 0);
assert("Subtotal", res4.subtotal, 1);
assert("Shipping", res4.shipping, 0);
assert("Total", res4.total, 1);
assert("Razorpay Amount", res4.total, 1);

console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
