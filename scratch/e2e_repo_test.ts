import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { repo } from '../lib/repositories';

async function run() {
  const products = await repo.products.getAll();
  const editingId = products[0].id;
  
  const productPayload = {
    id: editingId,
    name: 'Test Name',
    images: ['/img1.jpg', '/img2.jpg'],
    color: 'White',
    imageColors: [
      { image_url: '/img1.jpg', color_name: 'White', display_order: 0 },
      { image_url: '/img2.jpg', color_name: 'Black', display_order: 1 }
    ]
  };

  const updated = await repo.products.update(editingId, productPayload);
  console.log('Update result imageColors:', updated?.imageColors);
}

run().catch(console.error);
