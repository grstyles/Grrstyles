const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xqxnezvhrmyndpsfmrbc.supabase.co').replace(/\/rest\/v1\/?$/, '');
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function run() {
  console.log("=== FIXING GLITCHED PRODUCTS IN SUPABASE ===");
  const { data: products, error } = await supabase.from('products').select('*');
  
  if (error) {
    console.error("Error fetching products:", error);
    process.exit(1);
  }

  for (const p of products) {
    const updates = {};

    // 1. Trim trailing/leading whitespace in name
    const trimmedName = p.name ? p.name.trim() : '';
    if (trimmedName !== p.name) {
      updates.name = trimmedName;
    }

    // 2. Fix sizes and stock if null/empty/0
    const cat = (p.category || '').toLowerCase();
    let defaultSizes = ['S', 'M', 'L', 'XL', 'XXL'];
    if (cat.includes('shoe')) {
      defaultSizes = ['6', '7', '8', '9', '10'];
    } else if (cat.includes('pant') || cat.includes('jeans')) {
      defaultSizes = ['28', '30', '32', '34', '36'];
    }

    if (!p.sizes || !Array.isArray(p.sizes) || p.sizes.length === 0) {
      updates.sizes = defaultSizes;
    }

    if (!p.overall_stock || p.overall_stock <= 0) {
      updates.overall_stock = 50;
      if (cat.includes('shoe')) {
        updates.shoe_stock = { '6': 10, '7': 10, '8': 10, '9': 10, '10': 10 };
      } else if (cat.includes('pant')) {
        updates.pant_stock = { '28': 10, '30': 10, '32': 10, '34': 10, '36': 10 };
      } else {
        updates.shirt_stock = { 'S': 10, 'M': 10, 'L': 10, 'XL': 10, 'XXL': 10 };
      }
    }

    if (Object.keys(updates).length > 0) {
      console.log(`Updating product [${p.id}] "${p.name}" with updates:`, JSON.stringify(updates, null, 2));
      const { error: updateErr } = await supabase.from('products').update(updates).eq('id', p.id);
      if (updateErr) {
        console.error(`Error updating product ${p.id}:`, updateErr);
      } else {
        console.log(`Product ${p.id} successfully updated!`);
      }
    } else {
      console.log(`Product [${p.id}] "${p.name}" is already healthy.`);
    }
  }

  console.log("\nAll products checked and updated successfully!");
  process.exit(0);
}

run();
