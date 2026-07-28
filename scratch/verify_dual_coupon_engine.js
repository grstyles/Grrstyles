const path = require('path');

// Inline couponEngine logic matching lib/utils/couponEngine.ts
function validateAndCalculateCoupon(coupon, subtotal, userContext = {}) {
  if (!coupon || !coupon.code) {
    return {
      valid: false,
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      minimumPurchase: 0,
      calculatedDiscount: 0,
      finalTotal: subtotal,
      message: 'Invalid Coupon Code',
      errorType: 'INVALID_CODE',
    };
  }

  const cleanCode = coupon.code.toUpperCase().trim();
  const dType = (coupon.discountType === 'flat' || coupon.discountType === 'fixed') ? 'fixed' : 'percentage';
  const dVal = Number(coupon.discountValue || 0);
  const minVal = Number(coupon.minimumPurchase ?? coupon.minOrderValue ?? 0);
  const maxCartVal = coupon.maxCartValue != null ? Number(coupon.maxCartValue) : null;
  const maxDiscCap = coupon.maximumDiscount != null ? Number(coupon.maximumDiscount) : null;

  if (coupon.isActive === false) {
    return {
      valid: false,
      code: cleanCode,
      couponName: coupon.name || coupon.description,
      discountType: dType,
      discountValue: dVal,
      minimumPurchase: minVal,
      maxCartValue: maxCartVal,
      maximumDiscount: maxDiscCap,
      calculatedDiscount: 0,
      finalTotal: subtotal,
      message: 'Coupon Inactive',
      errorType: 'INACTIVE',
    };
  }

  const now = new Date();
  if (coupon.startDate && new Date(coupon.startDate) > now) {
    return {
      valid: false,
      code: cleanCode,
      couponName: coupon.name || coupon.description,
      discountType: dType,
      discountValue: dVal,
      minimumPurchase: minVal,
      maxCartValue: maxCartVal,
      maximumDiscount: maxDiscCap,
      calculatedDiscount: 0,
      finalTotal: subtotal,
      message: 'Coupon is not yet active',
      errorType: 'NOT_STARTED',
    };
  }

  const expDate = coupon.expiryDate || coupon.endDate;
  if (expDate && new Date(expDate) < now) {
    return {
      valid: false,
      code: cleanCode,
      couponName: coupon.name || coupon.description,
      discountType: dType,
      discountValue: dVal,
      minimumPurchase: minVal,
      maxCartValue: maxCartVal,
      maximumDiscount: maxDiscCap,
      calculatedDiscount: 0,
      finalTotal: subtotal,
      message: 'Coupon Expired',
      errorType: 'EXPIRED',
    };
  }

  if (coupon.usageLimit && coupon.usageLimit > 0 && (coupon.usageCount || 0) >= coupon.usageLimit) {
    return {
      valid: false,
      code: cleanCode,
      couponName: coupon.name || coupon.description,
      discountType: dType,
      discountValue: dVal,
      minimumPurchase: minVal,
      maxCartValue: maxCartVal,
      maximumDiscount: maxDiscCap,
      calculatedDiscount: 0,
      finalTotal: subtotal,
      message: 'Coupon Usage Limit Reached',
      errorType: 'USAGE_LIMIT_REACHED',
    };
  }

  if (minVal > 0 && subtotal < minVal) {
    return {
      valid: false,
      code: cleanCode,
      couponName: coupon.name || coupon.description,
      discountType: dType,
      discountValue: dVal,
      minimumPurchase: minVal,
      maxCartValue: maxCartVal,
      maximumDiscount: maxDiscCap,
      calculatedDiscount: 0,
      finalTotal: subtotal,
      message: `Minimum Purchase ₹${minVal.toLocaleString('en-IN')} Required`,
      errorType: 'MIN_PURCHASE_NOT_MET',
    };
  }

  if (maxCartVal !== null && maxCartVal > 0 && subtotal > maxCartVal) {
    return {
      valid: false,
      code: cleanCode,
      couponName: coupon.name || coupon.description,
      discountType: dType,
      discountValue: dVal,
      minimumPurchase: minVal,
      maxCartValue: maxCartVal,
      maximumDiscount: maxDiscCap,
      calculatedDiscount: 0,
      finalTotal: subtotal,
      message: `Cart Total Exceeds Maximum Limit of ₹${maxCartVal.toLocaleString('en-IN')}`,
      errorType: 'MAX_CART_EXCEEDED',
    };
  }

  let rawDiscount = 0;
  if (dType === 'percentage') {
    rawDiscount = Math.round((subtotal * dVal) / 100);
    if (maxDiscCap !== null && maxDiscCap > 0) {
      rawDiscount = Math.min(rawDiscount, maxDiscCap);
    }
  } else {
    rawDiscount = dVal;
  }

  const finalDiscountApplied = Math.max(0, Math.min(rawDiscount, subtotal));
  const finalTotalAfterDiscount = Math.max(0, subtotal - finalDiscountApplied);

  return {
    valid: true,
    code: cleanCode,
    couponName: coupon.name || coupon.description || cleanCode,
    discountType: dType,
    discountValue: dVal,
    minimumPurchase: minVal,
    maxCartValue: maxCartVal,
    maximumDiscount: maxDiscCap,
    calculatedDiscount: finalDiscountApplied,
    finalTotal: finalTotalAfterDiscount,
    message: 'Coupon Applied Successfully',
  };
}

function runTests() {
  console.log('====================================================');
  console.log('   GR STYLES - DUAL COUPON ENGINE VERIFICATION TEST');
  console.log('====================================================\n');

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

  // Test 1: Fixed Amount ₹100 OFF, no min or max cart value
  console.log('--- Test 1: Fixed Amount ₹100 OFF, no min/max ---');
  const couponFixed100 = { code: 'FIXED100', discountType: 'fixed', discountValue: 100, isActive: true };
  [300, 800, 1500, 5000].forEach((subtotal) => {
    const res = validateAndCalculateCoupon(couponFixed100, subtotal);
    assert(res.valid === true, `Valid for subtotal ₹${subtotal}`);
    assert(res.calculatedDiscount === 100, `Discount is ₹100 for subtotal ₹${subtotal}`);
    assert(res.finalTotal === subtotal - 100, `Final total is ₹${subtotal - 100}`);
  });

  // Test 2: Percentage 20% OFF, no min or max cart value
  console.log('\n--- Test 2: Percentage 20% OFF, no min/max ---');
  const couponPct20 = { code: 'PCT20', discountType: 'percentage', discountValue: 20, isActive: true };
  const res2 = validateAndCalculateCoupon(couponPct20, 1000);
  assert(res2.valid === true, '20% coupon valid for subtotal ₹1000');
  assert(res2.calculatedDiscount === 200, 'Calculated discount is ₹200 (20% of 1000)');
  assert(res2.finalTotal === 800, 'Final total is ₹800');

  // Test 3: Percentage 20% OFF with Maximum Discount Cap ₹500
  console.log('\n--- Test 3: Percentage 20% OFF with Max Discount Cap ₹500 ---');
  const couponPct20Capped = { code: 'PCT20CAP', discountType: 'percentage', discountValue: 20, maximumDiscount: 500, isActive: true };
  const res3 = validateAndCalculateCoupon(couponPct20Capped, 4000);
  assert(res3.valid === true, 'Capped 20% coupon valid for subtotal ₹4000');
  assert(res3.calculatedDiscount === 500, 'Calculated discount capped at ₹500 (instead of 20% of 4000 = 800)');
  assert(res3.finalTotal === 3500, 'Final total is ₹3500');

  // Test 4: ₹100 OFF, Minimum Cart Value = ₹1000
  console.log('\n--- Test 4: ₹100 OFF with Minimum Cart Value ₹1000 ---');
  const couponMin1000 = { code: 'MIN1000', discountType: 'fixed', discountValue: 100, minimumPurchase: 1000, isActive: true };
  const res4Fail = validateAndCalculateCoupon(couponMin1000, 800);
  assert(res4Fail.valid === false, 'Invalid when cart subtotal ₹800 < min ₹1000');
  assert(res4Fail.message.includes('Minimum Purchase'), `Error message explains minimum purchase: "${res4Fail.message}"`);
  const res4Pass = validateAndCalculateCoupon(couponMin1000, 1200);
  assert(res4Pass.valid === true, 'Valid when cart subtotal ₹1200 >= min ₹1000');
  assert(res4Pass.calculatedDiscount === 100, 'Discount is ₹100');

  // Test 5: ₹100 OFF, Maximum Cart Value = ₹600
  console.log('\n--- Test 5: ₹100 OFF with Maximum Cart Value ₹600 ---');
  const couponMax600 = { code: 'MAX600', discountType: 'fixed', discountValue: 100, maxCartValue: 600, isActive: true };
  const res5Pass = validateAndCalculateCoupon(couponMax600, 500);
  assert(res5Pass.valid === true, 'Valid when cart subtotal ₹500 <= max ₹600');
  assert(res5Pass.calculatedDiscount === 100, 'Discount is ₹100');
  const res5Fail = validateAndCalculateCoupon(couponMax600, 700);
  assert(res5Fail.valid === false, 'Invalid when cart subtotal ₹700 > max ₹600');
  assert(res5Fail.message.includes('Exceeds Maximum'), `Error message explains max cart limit: "${res5Fail.message}"`);

  // Test 6: ₹100 OFF, Minimum = ₹1000 and Maximum = ₹5000
  console.log('\n--- Test 6: ₹100 OFF with Min ₹1000 and Max ₹5000 ---');
  const couponRange = { code: 'RANGE100', discountType: 'fixed', discountValue: 100, minimumPurchase: 1000, maxCartValue: 5000, isActive: true };
  const res6Below = validateAndCalculateCoupon(couponRange, 500);
  assert(res6Below.valid === false, 'Fails when subtotal ₹500 < min ₹1000');
  const res6Inside = validateAndCalculateCoupon(couponRange, 2000);
  assert(res6Inside.valid === true, 'Passes when subtotal ₹2000 is between ₹1000 and ₹5000');
  assert(res6Inside.calculatedDiscount === 100, 'Discount is ₹100');
  const res6Above = validateAndCalculateCoupon(couponRange, 6000);
  assert(res6Above.valid === false, 'Fails when subtotal ₹6000 > max ₹5000');

  console.log('\n====================================================');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
