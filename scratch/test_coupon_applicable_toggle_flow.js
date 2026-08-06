const { repo } = require('../lib/repositories');
const { validateAndCalculateCoupon } = require('../lib/utils/couponEngine');
const { findBestEligibleCoupon } = require('../lib/utils/couponHelper');

async function runTests() {
  console.log('================================================================');
  console.log('   PRODUCT CATALOG COUPON APPLICABLE TOGGLE BUG FIX TEST SUITE  ');
  console.log('================================================================\n');

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

  // ----------------------------------------------------------------
  // Scenario 1: Verify product creation with couponApplicable = false
  // ----------------------------------------------------------------
  console.log('--- Scenario 1: Creating Product with Coupon Applicable = OFF (false) ---');
  const prodOffData = {
    name: 'Test Non-Coupon Jacket ' + Date.now(),
    slug: 'test-non-coupon-jacket-' + Date.now(),
    category: 'jackets',
    images: ['/test.png'],
    color: 'Black',
    mrpPrice: 2000,
    sellingPrice: 1500,
    label: 'TEST',
    description: 'Test jacket not eligible for coupons',
    couponApplicable: false,
  };

  let createdOffProd = null;
  try {
    createdOffProd = await repo.products.create(prodOffData as any);
    assert(createdOffProd !== null, 'Product created successfully');
    if (createdOffProd) {
      assert(createdOffProd.couponApplicable === false, `couponApplicable stored as false (got ${createdOffProd.couponApplicable})`);
    }
  } catch (err) {
    console.error('Error creating OFF product:', err);
    failed++;
  }

  // ----------------------------------------------------------------
  // Scenario 2: Verify product creation with couponApplicable = true
  // ----------------------------------------------------------------
  console.log('\n--- Scenario 2: Creating Product with Coupon Applicable = ON (true) ---');
  const prodOnData = {
    name: 'Test Coupon Shirt ' + Date.now(),
    slug: 'test-coupon-shirt-' + Date.now(),
    category: 'shirts',
    images: ['/test.png'],
    color: 'White',
    mrpPrice: 1200,
    sellingPrice: 1000,
    label: 'TEST',
    description: 'Test shirt eligible for coupons',
    couponApplicable: true,
  };

  let createdOnProd = null;
  try {
    createdOnProd = await repo.products.create(prodOnData as any);
    assert(createdOnProd !== null, 'Product created successfully');
    if (createdOnProd) {
      assert(createdOnProd.couponApplicable === true, `couponApplicable stored as true (got ${createdOnProd.couponApplicable})`);
    }
  } catch (err) {
    console.error('Error creating ON product:', err);
    failed++;
  }

  // ----------------------------------------------------------------
  // Scenario 3: Verify updating product preserves couponApplicable = false
  // ----------------------------------------------------------------
  if (createdOffProd) {
    console.log('\n--- Scenario 3: Updating Product (Name update only) preserves couponApplicable = false ---');
    try {
      const updated = await repo.products.update(createdOffProd.id, { name: createdOffProd.name + ' Updated' });
      assert(updated !== null, 'Product updated');
      if (updated) {
        assert(updated.couponApplicable === false, `couponApplicable remains false after name update (got ${updated.couponApplicable})`);
      }
    } catch (err) {
      console.error('Error updating product:', err);
      failed++;
    }
  }

  // ----------------------------------------------------------------
  // Scenario 4: Coupon Calculation on Cart with ONLY Coupon Applicable = OFF Product
  // ----------------------------------------------------------------
  console.log('\n--- Scenario 4: Cart containing ONLY Coupon Applicable = OFF Product ---');
  const cartOnlyOff = [
    {
      id: createdOffProd?.id || 'off-1',
      slug: createdOffProd?.slug || 'off-1',
      title: 'Non Coupon Product',
      brand: 'GR STYLES',
      price: 1500,
      discountedPrice: 1500,
      image: '/test.png',
      quantity: 1,
      couponApplicable: false,
    }
  ];

  const totalOnlyOff = 1500;
  const eligibleSubtotalOff = cartOnlyOff.reduce((sum, item) => {
    return item.couponApplicable !== false ? sum + item.discountedPrice * item.quantity : sum;
  }, 0);

  assert(eligibleSubtotalOff === 0, `Eligible subtotal is ₹0 for OFF-only cart (got ₹${eligibleSubtotalOff})`);

  const dummyCoupon = {
    code: 'TEST20',
    discountType: 'percentage' as const,
    discountValue: 20,
    isActive: true,
  };

  const resOnlyOff = validateAndCalculateCoupon(dummyCoupon, eligibleSubtotalOff);
  assert(resOnlyOff.calculatedDiscount === 0, `Discount is ₹0 when subtotal is ₹0 (got ₹${resOnlyOff.calculatedDiscount})`);

  // ----------------------------------------------------------------
  // Scenario 5: Cart containing MIXED Products (1 ON @ ₹1000, 1 OFF @ ₹1500)
  // ----------------------------------------------------------------
  console.log('\n--- Scenario 5: Cart containing MIXED Products (1 ON @ ₹1000, 1 OFF @ ₹1500) ---');
  const cartMixed = [
    {
      id: createdOnProd?.id || 'on-1',
      slug: createdOnProd?.slug || 'on-1',
      title: 'Coupon Eligible Product',
      brand: 'GR STYLES',
      price: 1000,
      discountedPrice: 1000,
      image: '/test.png',
      quantity: 1,
      couponApplicable: true,
    },
    {
      id: createdOffProd?.id || 'off-1',
      slug: createdOffProd?.slug || 'off-1',
      title: 'Non Coupon Product',
      brand: 'GR STYLES',
      price: 1500,
      discountedPrice: 1500,
      image: '/test.png',
      quantity: 1,
      couponApplicable: false,
    }
  ];

  const totalMixed = 2500;
  const eligibleSubtotalMixed = cartMixed.reduce((sum, item) => {
    return item.couponApplicable !== false ? sum + item.discountedPrice * item.quantity : sum;
  }, 0);

  assert(eligibleSubtotalMixed === 1000, `Eligible subtotal is ₹1000 (excluding OFF item of ₹1500, got ₹${eligibleSubtotalMixed})`);

  // 20% Coupon on mixed cart: 20% of ₹1000 = ₹200 discount (NOT 20% of ₹2500 = ₹500)
  const resMixed = validateAndCalculateCoupon(dummyCoupon, eligibleSubtotalMixed);
  assert(resMixed.valid === true, 'Coupon is valid for mixed cart');
  assert(resMixed.calculatedDiscount === 200, `Discount is ₹200 calculated ONLY on eligible item (got ₹${resMixed.calculatedDiscount})`);
  assert(resMixed.finalTotal === 800, `Eligible item total after discount is ₹800 (got ₹${resMixed.finalTotal})`);

  // ----------------------------------------------------------------
  // Clean up test products
  // ----------------------------------------------------------------
  if (createdOffProd) {
    try { await repo.products.delete(createdOffProd.id); } catch(e){}
  }
  if (createdOnProd) {
    try { await repo.products.delete(createdOnProd.id); } catch(e){}
  }

  // Summary
  console.log('\n================================================================');
  console.log(`  TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
