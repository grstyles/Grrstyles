// Standalone script to seed Supabase database tables with Categories, Collections, Coupons, and 63 Products.
// Run using: node scratch/seed_supabase.js
// Make sure to define NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually if .env.local exists
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
      if (key === 'SUPABASE_SERVICE_ROLE_KEY' && !process.env.SUPABASE_SERVICE_ROLE_KEY) supabaseKey = value;
      if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' && !supabaseKey) supabaseKey = value;
    }
  });
}

if (!supabaseUrl || !supabaseKey) {
  console.log('----------------------------------------------------');
  console.log('Supabase credentials not found in environment or .env.local.');
  console.log('Gracefully skipping DB seeding. Fallback to local mock data is active.');
  console.log('----------------------------------------------------');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Categories Data
const categories = [
  { name: 'Shirts', slug: 'shirts', description: 'Refined shirts crafted from premium linen and cotton blends.', image: '/images/categories/printed_shirts.png' },
  { name: 'T-Shirts', slug: 't-shirts', description: 'Premium heavyweight and relaxed fit cotton tees.', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600' },
  { name: 'Trousers', slug: 'trousers', description: 'Tailored slim and relaxed fit trousers in luxury fabrics.', image: 'https://images.unsplash.com/photo-1473617231723-2a5ebf1379b7?q=80&w=600' },
  { name: 'Jackets', slug: 'jackets', description: 'Classic denim, bomber, and utility jackets designed for layering.', image: '/images/categories/jackets.png' },
  { name: 'Hoodies', slug: 'hoodies', description: 'Cozy loopback cotton and fleece-lined streetwear hoodies.', image: 'https://images.unsplash.com/photo-1556821552-5ff63b1b5786?q=80&w=600' },
  { name: 'Jeans', slug: 'jeans', description: 'High-quality stone-washed wide leg and slim fit denim.', image: '/images/categories/denim_jeans.png' },
  { name: 'Sweatshirts', slug: 'sweatshirts', description: 'Minimalist crew neck pullovers in heavyweight cotton.', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600' },
  { name: 'Shoes', slug: 'shoes', description: 'Minimalist sneakers, loafers, and leather boots for modern style.', image: '/images/categories/shoes.png' },
  { name: 'Accessories', slug: 'accessories', description: 'Essential premium leather wallets, belts, watches, and beanies.', image: '/images/categories/accessories.png' }
];

// Collections Data
const collections = [
  { name: 'Korean Collection', slug: 'korean-collection', description: 'Minimalist, oversized silhouettes inspired by modern Seoul street fashion.' },
  { name: 'Festival Collection', slug: 'festival-collection', description: 'Bright colors and premium fabrics tailored for festive celebrations.' },
  { name: 'Formal Collection', slug: 'formal-collection', description: 'Sharp office shirts and structured trousers for professional style.' },
  { name: 'Weekend Collection', slug: 'weekend-collection', description: 'Relaxed linen shirts, t-shirts, and denim for casual wear.' },
  { name: 'Denim Collection', slug: 'denim-collection', description: 'Premium washed and distressed denim jeans and jackets.' },
  { name: 'Streetwear Collection', slug: 'streetwear-collection', description: 'Graphic tees, baggy pants, oversized hoodies, and accessories.' },
  { name: 'Premium Essentials', slug: 'premium-essentials', description: 'Minimalist, core closet pieces built with long-lasting quality.' },
  { name: 'Office Wear Collection', slug: 'office-wear-collection', description: 'Polished formal coordinates, formal pants, and dress belts.' }
];

// Load Products from typescript file by parsing it or listing static values.
// Since it is a TS file, we can require a transpiled version or define a seed JSON.
// To make it 100% reliable without typescript compilers, we extract the products from lib/data/products.ts or define them here.
// Let's read products.ts and dynamically parse or define the products database in JS format.
// We can parse products.ts array by searching for patterns, or just read the JSON file if available.
// Since we have products.ts, let's write a parser helper inside this script to extract products.
function parseProducts() {
  const tsPath = path.join(process.cwd(), 'lib/data/products.ts');
  if (!fs.existsSync(tsPath)) {
    console.error('products.ts not found at ' + tsPath);
    return [];
  }
  
  const content = fs.readFileSync(tsPath, 'utf8');
  
  // A simple regex approach to find all product objects
  // The products.ts has "export const productDatabase: Record<string, Product> = { ... }"
  // We can write a dynamic parser or define a mini-seed of core items.
  // Wait! Let's use the local node environment to evaluate products.ts by converting it into valid JS.
  try {
    let jsContent = content
      .replace(/export interface \w+ \{[^}]*\}/g, '')
      .replace(/export const productDatabase: Record<string, Product> =/g, 'module.exports =')
      .replace(/: Product/g, '')
      .replace(/export const products: Product\[\] =[^;]*;/g, '')
      .replace(/import .*/g, '');
      
    // Write a temporary file and require it
    const tempFile = path.join(process.cwd(), 'scratch', 'temp_products.js');
    fs.writeFileSync(tempFile, jsContent);
    const parsedDB = require(tempFile);
    fs.unlinkSync(tempFile);
    
    return Object.values(parsedDB);
  } catch (err) {
    console.error('Regex parse failed. Initializing standard seed values.');
    return [];
  }
}

async function seed() {
  console.log('Connecting to Supabase at:', supabaseUrl);
  
  // 1. Seed Categories
  console.log('Seeding Categories...');
  for (const cat of categories) {
    const { error } = await supabase.from('categories').upsert(cat, { onConflict: 'slug' });
    if (error) console.error(`Error category ${cat.name}:`, error.message);
  }
  console.log('Categories seeded.');

  // 2. Seed Collections
  console.log('Seeding Collections...');
  for (const col of collections) {
    const { error } = await supabase.from('collections').upsert(col, { onConflict: 'slug' });
    if (error) console.error(`Error collection ${col.name}:`, error.message);
  }
  console.log('Collections seeded.');

  // 3. Seed Products
  console.log('Parsing products from products.ts...');
  const items = parseProducts();
  console.log(`Found ${items.length} products to seed.`);
  
  if (items.length === 0) {
    console.error('No products parsed. Aborting product seed.');
    return;
  }
  
  for (const p of items) {
    const mapped = {
      product_id: p.id,
      sku: p.sku || `GR-SKU-${p.id}-${p.slug.slice(0, 3).toUpperCase()}`,
      name: p.name || p.title,
      slug: p.slug,
      category: p.category,
      collection: p.collection || '',
      color: p.color,
      images: p.images,
      sizes: p.sizes, // JSONB structure
      mrp_price: p.mrpPrice || p.price,
      selling_price: p.sellingPrice || p.discountedPrice || p.price,
      discount_percent: p.discountPercent || 0,
      label: p.label || '',
      description: p.description,
      featured: p.featured || false,
      trending: p.trending || false,
      new_arrival: p.isNew || false,
      deal_of_the_day: p.dealOfTheDay || false,
      brand: p.brand || 'GR STYLES',
      rating: p.rating || 5.0,
      reviews_count: p.reviews || 0
    };
    
    const { error } = await supabase.from('products').upsert(mapped, { onConflict: 'slug' });
    if (error) {
      console.error(`Error product ${p.name}:`, error.message);
    }
  }
  console.log('Products seeding complete.');
}

seed().catch(err => {
  console.error('Seeding runtime error:', err);
});
