/**
 * One-time migration: sync overall_stock = sum of shirt_stock / pant_stock / shoe_stock
 * for every product where they're out of sync.
 *
 * Run from project root:
 *   node scripts/sync_overall_stock.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

function sumJsonb(obj) {
  if (!obj || typeof obj !== 'object') return 0;
  return Object.values(obj).reduce((acc, v) => acc + (Number(v) || 0), 0);
}

async function main() {
  console.log('Fetching all products...');
  const { data, error } = await sb
    .from('products')
    .select('id, name, category, shirt_stock, pant_stock, shoe_stock, overall_stock');

  if (error) { console.error('Fetch error:', error); process.exit(1); }

  console.log(`Found ${data.length} products. Checking for mismatches...\n`);

  let fixed = 0, skipped = 0;

  for (const p of data) {
    const catLower = (p.category || '').toLowerCase();
    let columnStock = 0;

    if (catLower.includes('shoe') || catLower.includes('footwear') || catLower.includes('sneaker') || catLower.includes('boot') || catLower.includes('slipper')) {
      columnStock = sumJsonb(p.shoe_stock);
    } else if (catLower.includes('pant') || catLower.includes('jean') || catLower.includes('trouser') || catLower.includes('track') || catLower.includes('short') || catLower.includes('chino') || catLower.includes('bottom')) {
      columnStock = sumJsonb(p.pant_stock);
    } else {
      columnStock = sumJsonb(p.shirt_stock);
    }

    // If JSONB sum disagrees with overall_stock, update overall_stock
    if (columnStock !== Number(p.overall_stock)) {
      console.log(`FIXING: ${p.name}`);
      console.log(`  category: ${p.category}`);
      console.log(`  current overall_stock: ${p.overall_stock}  →  correct value: ${columnStock}`);

      const { error: updateErr } = await sb
        .from('products')
        .update({ overall_stock: columnStock })
        .eq('id', p.id);

      if (updateErr) {
        console.error(`  ERROR updating ${p.name}:`, updateErr.message);
      } else {
        console.log(`  ✓ Fixed`);
        fixed++;
      }
    } else {
      skipped++;
    }
  }

  console.log(`\nDone. Fixed: ${fixed} | Already in sync: ${skipped}`);
}

main();
