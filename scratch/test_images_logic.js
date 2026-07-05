// Copied mapDbProduct implementation to test behavior locally
function mapDbProduct(db, imageRows) {
  const mrp = Number(db.mrp || db.mrp_price || 0);
  const selling = Number(db.selling_price || 0);
  const discount = mrp > 0 ? Math.round(((mrp - selling) / mrp) * 100) : 0;

  let imageColors = [];
  let images = db.images || [];
  let colors = db.color ? [db.color] : [];
  let primaryColor = db.color || '';

  if (imageRows && imageRows.length > 0) {
    imageColors = imageRows.map((row) => ({
      image_url: row.image_url,
      color_name: row.color_name,
      display_order: row.display_order
    }));
    images = imageColors.map(x => x.image_url);
    colors = Array.from(new Set(imageColors.map(x => x.color_name))).filter(Boolean);
    primaryColor = colors[0] || db.color || '';
  } else {
    // Backwards compatibility fallback
    imageColors = images.map((img, idx) => ({
      image_url: img,
      color_name: primaryColor || 'Original',
      display_order: idx
    }));
  }

  return {
    id: db.product_id || db.id,
    images,
    color: primaryColor,
    colors,
    imageColors,
  };
}

// Simulated DB response for legacy product
const legacyDbProduct = {
  id: 'legacy-p-1',
  sku: 'GR-TS-9912',
  name: 'Vintage Black Tee',
  slug: 'vintage-black-tee',
  category: 't-shirts',
  mrp: 999,
  selling_price: 499,
  images: [
    'https://example.com/vintage_black_1.png',
    'https://example.com/vintage_black_2.png'
  ],
  color: 'Black'
};

// Simulated DB response for new product with separate image rows
const newDbProduct = {
  id: 'new-p-123',
  sku: 'GR-TS-1234',
  name: 'Multi Color Cargo Pant',
  slug: 'multi-color-cargo-pant',
  category: 'trousers',
  mrp: 1499,
  selling_price: 999,
  images: [
    'https://example.com/cargo_green.png',
    'https://example.com/cargo_black.png'
  ],
  color: 'Green'
};

const productImagesRows = [
  { product_id: 'new-p-123', image_url: 'https://example.com/cargo_green.png', color_name: 'Green', display_order: 0 },
  { product_id: 'new-p-123', image_url: 'https://example.com/cargo_black.png', color_name: 'Black', display_order: 1 }
];

function runTests() {
  console.log('--- RUNNING DATABASE MODELING TESTS ---');

  // Test 1: Legacy product fallback mapping
  console.log('\nTest 1: Legacy product mapping (no product_images rows)...');
  const mappedLegacy = mapDbProduct(legacyDbProduct);
  console.log('  Primary Color:', mappedLegacy.color);
  console.log('  Colors List:', mappedLegacy.colors);
  console.log('  Images Count:', mappedLegacy.images.length);
  console.log('  ImageColors List:', mappedLegacy.imageColors);

  // Assertions for Test 1
  if (mappedLegacy.color !== 'Black') throw new Error('Primary color mismatch');
  if (mappedLegacy.colors[0] !== 'Black') throw new Error('Colors list mismatch');
  if (mappedLegacy.imageColors[0].color_name !== 'Black') throw new Error('Fallback color mismatch');
  console.log('  ✓ Test 1 Passed!');

  // Test 2: New product mapping with image_rows
  console.log('\nTest 2: New product mapping with product_images rows...');
  const mappedNew = mapDbProduct(newDbProduct, productImagesRows);
  console.log('  Primary Color:', mappedNew.color);
  console.log('  Colors List:', mappedNew.colors);
  console.log('  Images Count:', mappedNew.images.length);
  console.log('  ImageColors List:', mappedNew.imageColors);

  // Assertions for Test 2
  if (mappedNew.color !== 'Green') throw new Error('Primary color mismatch');
  if (mappedNew.colors.length !== 2 || !mappedNew.colors.includes('Black') || !mappedNew.colors.includes('Green')) {
    throw new Error('Colors list mapping failed');
  }
  if (mappedNew.imageColors[1].color_name !== 'Black') throw new Error('Second image color mismatch');
  console.log('  ✓ Test 2 Passed!');

  // Test 3: Customer gallery switching filter
  console.log('\nTest 3: Customer gallery switching visibility check...');
  const visibleImagesGreen = mappedNew.imageColors
    .filter(img => !mappedNew.colors[0] || img.color_name === 'Green')
    .map(img => img.image_url);
  console.log('  Visible Green Images:', visibleImagesGreen);
  if (visibleImagesGreen.length !== 1 || visibleImagesGreen[0] !== 'https://example.com/cargo_green.png') {
    throw new Error('Green visible images filtering failed');
  }

  const visibleImagesBlack = mappedNew.imageColors
    .filter(img => !mappedNew.colors[0] || img.color_name === 'Black')
    .map(img => img.image_url);
  console.log('  Visible Black Images:', visibleImagesBlack);
  if (visibleImagesBlack.length !== 1 || visibleImagesBlack[0] !== 'https://example.com/cargo_black.png') {
    throw new Error('Black visible images filtering failed');
  }
  console.log('  ✓ Test 3 Passed!');

  console.log('\n--- ALL VERIFICATION TESTS PASSED ---');
}

try {
  runTests();
} catch (err) {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
}
