const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// To run this script:
// 1. npm install @supabase/supabase-js dotenv
// 2. SUPABASE_SERVICE_ROLE_KEY="your_service_role_key" node scripts/upload_category_images.js

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xqxnezvhrmyndpsfmrbc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("ERROR: Please provide SUPABASE_SERVICE_ROLE_KEY as an environment variable.");
  console.error("Usage: SUPABASE_SERVICE_ROLE_KEY='<your-key>' node scripts/upload_category_images.js");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = 'category-images';
const IMAGES_DIR = path.join(__dirname, '../public/images/categories');

const categoriesToSeed = [
  { title: 'Shirts', slug: 'shirts', route: '/collections/shirts', fileName: 'shirts_1782999677203.png', color: '#F5F5DC' },
  { title: 'Oxford Shirts', slug: 'oxford-shirts', route: '/collections/oxford-shirts', fileName: 'oxford_shirts_1782999687538.png', color: '#F0E68C' },
  { title: 'Printed Shirts', slug: 'printed-shirts', route: '/collections/printed-shirts', fileName: 'printed_shirts_1782999700299.png', color: '#F8DE7E' },
  { title: 'Oversized T-Shirts', slug: 'oversized-tshirts', route: '/collections/oversized-tshirts', fileName: 'oversized_tshirts_1782999710372.png', color: '#FFFDD0' },
  { title: 'Polo T-Shirts', slug: 'polo-tshirts', route: '/collections/polo-tshirts', fileName: 'polo_tshirts_1782999729942.png', color: '#808000' },
  { title: 'Formal Shirts', slug: 'formal-shirts', route: '/collections/formal-shirts', fileName: 'formal_shirts_1782999741005.png', color: '#BDB76B' },
  { title: 'Baggy Shirts', slug: 'baggy-shirts', route: '/collections/baggy-shirts', fileName: 'baggy_shirts_1782999752110.png', color: '#EEE8AA' },
  { title: 'Korean Shirts', slug: 'korean-shirts', route: '/collections/korean-shirts', fileName: 'korean_shirts_1782999763636.png', color: '#DAA520' },
  { title: 'Trousers', slug: 'trousers', route: '/collections/trousers', fileName: 'trousers_1782999782089.png', color: '#C2B280' },
  { title: 'Formal Pants', slug: 'formal-pants', route: '/collections/formal-pants', fileName: 'formal_pants_1782999794308.png', color: '#B8860B' },
  { title: 'Cargo Pants', slug: 'cargo-pants', route: '/collections/cargo-pants', fileName: 'cargo_pants_1782999805504.png', color: '#B5651D' },
  { title: 'Baggy Pants', slug: 'baggy-pants', route: '/collections/baggy-pants', fileName: 'baggy_pants_1782999816436.png', color: '#D2691E' },
  { title: 'Jeans', slug: 'jeans', route: '/collections/jeans', fileName: 'jeans_1782999835670.png', color: '#1560BD' },
  { title: 'Baggy Jeans', slug: 'baggy-jeans', route: '/collections/baggy-jeans', fileName: 'baggy_jeans_1782999848204.png', color: '#4682B4' },
  { title: 'Shorts', slug: 'shorts', route: '/collections/shorts', fileName: 'beige_korean_shirt_1781860857623.png', color: '#708090' },
  { title: 'Joggers', slug: 'joggers', route: '/collections/joggers', fileName: 'baggy_pants_1781859636470.png', color: '#2F4F4F' },
  { title: 'Jackets', slug: 'jackets', route: '/collections/jackets', fileName: 'jackets_1782999862529.png', color: '#A9A9A9' },
  { title: 'Blazers', slug: 'blazers', route: '/collections/blazers', fileName: 'blazers_1781973264858.png', color: '#800000' },
  { title: 'Hoodies', slug: 'hoodies', route: '/collections/hoodies', fileName: 'hoodies_1782999874119.png', color: '#808080' },
  { title: 'Sweatshirts', slug: 'sweatshirts', route: '/collections/sweatshirts', fileName: 'sweatshirts_1782999892937.png', color: '#696969' },
  { title: 'Co-Ord Sets', slug: 'co-ord-sets', route: '/collections/co-ord-sets', fileName: 'weekend_collection_1781859935252.png', color: '#556B2F' },
  { title: 'Ethnic Wear', slug: 'ethnic-wear', route: '/collections/ethnic-wear', fileName: 'formal_wear_1781859656251.png', color: '#FFDB58' },
  { title: 'Casual Wear', slug: 'casual-wear', route: '/collections/casual-wear', fileName: 'sky_blue_casual_shirt_1781860871849.png', color: '#D2B48C' },
  { title: 'Winter Collection', slug: 'winter-collection', route: '/collections/winter-collection', fileName: 'hoodies_1781973206421.png', color: '#ADD8E6' },
  { title: 'Accessories', slug: 'accessories', route: '/collections/accessories', fileName: 'accessories_1781859683256.png', color: '#FFFFF0' },
  { title: 'Shoes', slug: 'shoes', route: '/collections/shoes', fileName: 'shoes_1781859704333.png', color: '#36454F' },
  { title: 'Traditional Wear', slug: 'traditional', route: '/collections/traditional', fileName: 'formal_wear.png', color: '#FFDB58' },
  { title: 'Festival Collection', slug: 'festival', route: '/collections/festival', fileName: 'festival_collection_1781859912718.png', color: '#FFD700' },
  { title: 'New Arrivals', slug: 'new-arrivals', route: '/new-in', fileName: 'premium_white_oxford_shirt_1781860824337.png', color: '#FFD700' },
  { title: 'Best Sellers', slug: 'best-sellers', route: '/best-sellers', fileName: 'olive_green_linen_shirt_1781860883707.png', color: '#FFA500' },
  { title: 'Clearance Sale', slug: 'clearance-sale', route: '/clearance', fileName: 'striped_office_shirt_1781860896799.png', color: '#DC143C' },
];

async function run() {
  console.log(`Checking database...`);
  
  // 1. Verify table exists
  const { error: tableCheckError } = await supabase.from('category_carousel').select('id').limit(1);
  if (tableCheckError) {
    if (tableCheckError.message.includes('Could not find the table') || tableCheckError.message.includes('relation "public.category_carousel" does not exist')) {
      console.error("\ncategory_carousel table not found.\nPlease run the SQL migration first.\n");
      process.exit(1);
    } else {
      console.error("\nDatabase connection error: " + tableCheckError.message + "\n");
      process.exit(1);
    }
  }

  // 2. Check storage bucket
  const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(BUCKET_NAME);
  if (bucketError) {
    console.error(`\nBucket ${BUCKET_NAME} not found or inaccessible. Error: ${bucketError.message}\n`);
    process.exit(1);
  }

  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`\nDirectory not found: ${IMAGES_DIR}\n`);
    process.exit(1);
  }

  const files = fs.readdirSync(IMAGES_DIR);
  let priorityCounter = 0;
  let failedCategories = 0;
  const failureReasons = [];
  
  for (const cat of categoriesToSeed) {
    const matchedFile = cat.fileName || 'category-placeholder.png';
    const filePath = path.join(IMAGES_DIR, matchedFile);
    
    let publicUrl = '';
    
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      
      console.log(`[UPLOAD] Uploading ${matchedFile} for category ${cat.title}...`);
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(matchedFile, fileBuffer, {
          contentType: 'image/png',
          upsert: true
        });
        
      if (error) {
        console.error(`[ERROR] Failed to upload ${matchedFile}:`, error.message);
        failedCategories++;
        failureReasons.push(`Upload failed for ${cat.title}: ${error.message}`);
        continue; // Skip DB upsert if upload fails
      }
      
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(matchedFile);
      publicUrl = urlData.publicUrl;
    } else {
      console.warn(`[WARN] File not found for ${cat.title}, using placeholder url`);
      publicUrl = '/images/category-placeholder.png';
    }
    
    let redirectLink = null;
    if (cat.route !== `/collections/${cat.slug}`) {
       redirectLink = cat.route;
    }
    
    console.log(`[DB] Upserting ${cat.title}...`);
    const { error: dbError } = await supabase
      .from('category_carousel')
      .upsert({
        title: cat.title,
        slug: cat.slug,
        image_url: publicUrl,
        bg_color: cat.color,
        priority: priorityCounter++,
        enabled: true,
        featured: priorityCounter <= 5,
        redirect_link: redirectLink
      }, { onConflict: 'slug' });
      
    if (dbError) {
      console.error(`[DB ERROR] Failed to upsert ${cat.title}:`, dbError.message);
      failedCategories++;
      failureReasons.push(`DB upsert failed for ${cat.title}: ${dbError.message}`);
    } else {
      console.log(`[DB SUCCESS] Upserted ${cat.title}`);
    }
  }
  
  if (failedCategories > 0) {
    console.error(`\nDatabase seeding failed.`);
    console.error(`Number of failed categories: ${failedCategories}`);
    console.error(`Reason:\n` + failureReasons.join('\n'));
    process.exit(1);
  }
  
  console.log('\nComplete! All categories seeded with image URLs.');
}

run();
