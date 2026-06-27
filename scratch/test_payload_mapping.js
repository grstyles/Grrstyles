const productPayload = {
  id: 'p-1',
  name: 'Test',
  images: ['/img1.jpg', '/img2.jpg', '/img3.jpg'],
  imageColors: [
    { image_url: '/img1.jpg', color_name: 'White', display_order: 0 },
    { image_url: '/img2.jpg', color_name: 'White', display_order: 1 },
    { image_url: '/img3.jpg', color_name: 'White', display_order: 2 }
  ]
};

const updates = productPayload;
const mapped = {};
if (updates.name) mapped.name = updates.name;
if (updates.images) mapped.images = updates.images;
if ((updates).imageColors) mapped.image_colors = (updates).imageColors;

console.log('3. Payload sent to updateProduct():', JSON.stringify(productPayload.imageColors, null, 2));
console.log('4. Payload sent to Supabase:', JSON.stringify(mapped.image_colors, null, 2));
