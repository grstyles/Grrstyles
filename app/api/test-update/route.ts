import { NextResponse } from 'next/server';
import { repo } from '@/lib/repositories';

export async function GET() {
  try {
    const products = await repo.products.getAll();
    const editingId = products[0].id; // test on the first product

    const imagesList = ['/img1.jpg', '/img2.jpg', '/img3.jpg'];
    const imageColorsState = ['White', 'Black', 'Blue'];
    const color = 'White';

    const productPayload: any = {
      id: editingId,
      name: 'Test update API',
      images: imagesList,
      color: color,
      imageColors: imagesList.map((img, idx) => ({
        image_url: img,
        color_name: imageColorsState[idx] || color || 'Original',
        display_order: idx
      }))
    };

    console.log('[DEBUG API] Payload:', JSON.stringify(productPayload.imageColors, null, 2));

    console.log('[DEBUG API] Before repo.products.update');
    const updated = await repo.products.update(editingId, productPayload);
    console.log('[DEBUG API] After repo.products.update');
    
    return NextResponse.json({
      success: true,
      originalProduct: products[0].slug,
      updatedImageColors: updated?.imageColors || null,
    });
  } catch (error: any) {
    console.log('[DEBUG API] Error inside catch:', error);
    return NextResponse.json({ success: false, error: error.message, stack: error.stack });
  }
}
