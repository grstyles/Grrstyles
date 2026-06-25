import { Product } from '@/lib/data/products';
import { supabase } from '@/lib/supabase';
import { normalizeSlug, matchCategory } from '@/lib/utils/categoryImageMap';

// Helper to map DB columns to frontend Product schema
export function mapDbProduct(db: any, imageRows?: any[]): Product {
  const mrp = Number(db.mrp || db.mrp_price || 0);
  const selling = Number(db.selling_price || 0);
  const discount = mrp > 0 ? Math.round(((mrp - selling) / mrp) * 100) : 0;

  let imageColors: { image_url: string; color_name: string; display_order: number }[] = [];
  let images = db.images || [];
  let colors = db.color ? [db.color] : [];
  let primaryColor = db.color || '';

  if (imageRows && imageRows.length > 0) {
    imageColors = imageRows.map((row: any) => ({
      image_url: row.image_url,
      color_name: row.color_name,
      display_order: row.display_order
    }));
    images = imageColors.map(x => x.image_url);
    colors = Array.from(new Set(imageColors.map(x => x.color_name))).filter(Boolean);
    primaryColor = colors[0] || db.color || '';
  } else {
    // Backwards compatibility fallback
    imageColors = images.map((img: string, idx: number) => ({
      image_url: img,
      color_name: primaryColor || 'Original',
      display_order: idx
    }));
  }

  return {
    id: db.product_id || db.id,
    productId: db.product_id || db.id,
    sku: db.sku || '',
    name: db.name,
    title: db.name,
    slug: db.slug,
    category: db.category,
    collection: db.collection || '',
    images,
    color: primaryColor,
    colors,
    imageColors,
    mrpPrice: mrp,
    price: mrp,
    sellingPrice: selling,
    discountedPrice: selling,
    discountPercent: discount,
    label: db.label || '',
    description: db.description,
    sizes: db.sizes || [],
    brand: db.brand || 'GR STYLES',
    rating: Number(db.rating || 5.0),
    reviews: Number(db.reviews_count || 0),
    isNew: !!db.new_arrival,
    bestSeller: !!db.trending,
    inStock: (db.sizes || []).some((s: any) => s.stock > 0),
    stockCount: db.stock !== undefined ? Number(db.stock) : (db.sizes || []).reduce((sum: number, s: any) => sum + (s.stock || 0), 0),
    metadata: {
      dealOfDay: !!(db.deal_of_day || db.deal_of_the_day),
      featured: !!db.featured,
      tags: db.tags || [],
    },
  };
}

// Helpers for product images mapping
async function getProductImagesMap(): Promise<Record<string, any[]>> {
  const imageMap: Record<string, any[]> = {};
  try {
    const { data, error } = await supabase!
      .from('product_images')
      .select('*')
      .order('display_order', { ascending: true });
    if (!error && data) {
      data.forEach((row: any) => {
        const pId = row.product_id;
        if (!imageMap[pId]) imageMap[pId] = [];
        imageMap[pId].push(row);
      });
    }
  } catch (err) {
    console.warn('Could not query product_images table, using fallback:', err);
  }
  return imageMap;
}

async function getProductImagesForId(productId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase!
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });
    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('Could not query product_images for ID, using fallback:', err);
  }
  return [];
}

export const productService = {
  async getProducts(): Promise<Product[]> {
    const [productsRes, imagesMap] = await Promise.all([
      supabase!.from('products').select('*').order('created_at', { ascending: false }),
      getProductImagesMap()
    ]);

    if (productsRes.error || !productsRes.data) throw productsRes.error || new Error('No data');
    return productsRes.data.map(p => mapDbProduct(p, imagesMap[p.id]));
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await supabase!
      .from('products')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    const images = await getProductImagesForId(data.id);
    return mapDbProduct(data, images);
  },

  async getProductsByCategory(categorySlug: string): Promise<Product[]> {
    const normalizedSlug = normalizeSlug(categorySlug);
    // Query all products and then filter dynamically via matchCategory
    const [productsRes, imagesMap] = await Promise.all([
      supabase!.from('products').select('*'),
      getProductImagesMap()
    ]);

    if (productsRes.error || !productsRes.data) throw productsRes.error || new Error('No data');
    return productsRes.data.map(p => mapDbProduct(p, imagesMap[p.id])).filter((p) => matchCategory(p, normalizedSlug));
  },

  async getProductsByCollection(collectionSlug: string): Promise<Product[]> {
    const slug = collectionSlug.toLowerCase().trim();
    let query = supabase!.from('products').select('*');

    const colMap: Record<string, string> = {
      'korean-collection': 'Korean Collection',
      'festival-collection': 'Festival Collection',
      'festival-wear': 'Festival Collection',
      'formal-collection': 'Formal Collection',
      'formal-wear': 'Formal Collection',
      'weekend-collection': 'Weekend Collection',
      'weekend-offers': 'Weekend Collection',
      'denim-collection': 'Denim Collection',
      'streetwear-collection': 'Streetwear Collection',
      'premium-essentials': 'Premium Essentials',
      'office-wear-collection': 'Office Wear Collection'
    };

    const dbCol = colMap[slug];
    if (dbCol) {
      query = query.eq('collection', dbCol);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    const imagesMap = await getProductImagesMap();

    if (!data || data.length === 0) {
      // Fallback to text query filtering on DB products
      const { data: allProds, error: allErr } = await supabase!.from('products').select('*');
      if (allErr) throw allErr;
      if (allProds) {
        return allProds.map(p => mapDbProduct(p, imagesMap[p.id])).filter(p => {
          if (slug === 'korean-collection') return p.name.toLowerCase().includes('korean') || p.description.toLowerCase().includes('korean');
          if (slug === 'festival-collection' || slug === 'festival-wear') return p.label === 'HOT' || p.discountPercent > 20 || p.label === 'NEW';
          if (slug === 'formal-collection' || slug === 'formal-wear') return p.name.toLowerCase().includes('formal') || p.description.toLowerCase().includes('formal') || p.name.toLowerCase().includes('office');
          if (slug === 'weekend-collection') return p.name.toLowerCase().includes('weekend') || p.name.toLowerCase().includes('casual');
          if (slug === 'denim-collection') return p.category === 'Jeans' || p.name.toLowerCase().includes('denim');
          if (slug === 'streetwear-collection') return p.name.toLowerCase().includes('streetwear') || p.name.toLowerCase().includes('oversized') || p.category === 'Hoodies';
          if (slug === 'premium-essentials') return p.name.toLowerCase().includes('premium') || p.name.toLowerCase().includes('basic');
          if (slug === 'office-wear-collection') return p.name.toLowerCase().includes('office') || p.name.toLowerCase().includes('formal');
          return true;
        });
      }
      return [];
    }

    return data.map(p => mapDbProduct(p, imagesMap[p.id]));
  },

  async getProductsByBrand(brandSlug: string): Promise<Product[]> {
    const cleanBrand = brandSlug.replace(/-/g, ' ').toLowerCase();
    const [productsRes, imagesMap] = await Promise.all([
      supabase!.from('products').select('*').ilike('brand', `%${cleanBrand}%`),
      getProductImagesMap()
    ]);
    if (productsRes.error) throw productsRes.error;
    return (productsRes.data || []).map(p => mapDbProduct(p, imagesMap[p.id]));
  },

  async getProductsByFestival(festivalSlug: string): Promise<Product[]> {
    return this.getProductsByCollection('festival-collection');
  },

  async getProductsByCombo(comboSlug: string): Promise<Product[]> {
    return this.getProducts();
  },

  async getRelatedProducts(slug: string): Promise<Product[]> {
    const current = await this.getProductBySlug(slug);
    if (!current) return [];

    const { data, error } = await supabase!
      .from('products')
      .select('*')
      .eq('category', current.category)
      .neq('slug', slug)
      .limit(4);

    if (error) throw error;
    const imagesMap = await getProductImagesMap();
    return (data || []).map(p => mapDbProduct(p, imagesMap[p.id]));
  },

  async createProduct(p: Product): Promise<Product | null> {
    const mapped: any = {
      sku: p.sku || `GR-${p.category.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      name: p.name,
      slug: p.slug,
      category: p.category,
      collection: p.collection || '',
      images: p.images,
      color: p.color || '',
      sizes: p.sizes,
      stock: p.sizes?.reduce((sum: number, s: any) => sum + (s.stock || 0), 0) || 0,
      mrp: p.mrpPrice,
      selling_price: p.sellingPrice,
      description: p.description,
      featured: p.metadata?.featured || false,
      trending: p.bestSeller || false,
      new_arrival: p.isNew || false,
      deal_of_day: p.metadata?.dealOfDay || false,
      brand: p.brand || 'GR STYLES',
    };
    const { data, error } = await supabase!
      .from('products')
      .insert(mapped)
      .select('*')
      .single();
    if (error || !data) throw error || new Error('Product creation failed');

    // Save to product_images
    if ((p as any).imageColors) {
      try {
        const rows = (p as any).imageColors.map((ic: any, idx: number) => ({
          product_id: data.id,
          image_url: ic.image_url,
          color_name: ic.color_name,
          display_order: idx
        }));
        await supabase!.from('product_images').insert(rows);
      } catch (err) {
        console.warn('Failed to save product_images on creation:', err);
      }
    }

    const images = await getProductImagesForId(data.id);
    return mapDbProduct(data, images);
  },

  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await supabase!
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      const { error: err2 } = await supabase!
        .from('products')
        .delete()
        .eq('product_id', id);
      if (err2) throw err2;
    }
    
    // Also try deleting corresponding product_images (cascade handles it but good as secondary)
    try {
      await supabase!.from('product_images').delete().eq('product_id', id);
    } catch (err) {
      console.warn('Could not delete product_images on product deletion:', err);
    }
    
    return true;
  },

  async createOrder(order: any, items: any[]): Promise<string | null> {
    const orderNumber = `GR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // 1. Insert order
    const { data: orderRow, error: orderError } = await supabase!
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: order.customerName,
        customer_email: order.email,
        customer_phone: order.phone,
        shipping_address: order.shippingAddress,
        total_amount: order.totalAmount,
        status: 'Pending',
        payment_status: order.paymentStatus || 'Pending',
        items: items.map(item => ({
          productId: item.productId || item.id,
          productName: item.productName || item.title,
          size: item.size || 'One Size',
          quantity: item.quantity,
          price: item.discountedPrice || item.price
        }))
      })
      .select('*')
      .single();

    if (orderError || !orderRow) throw orderError || new Error('Order creation failed');

    // 2. Decrement stock
    for (const item of items) {
      const { data: prod, error: prodErr } = await supabase!
        .from('products')
        .select('id, sizes')
        .or(`id.eq.${item.id},product_id.eq.${item.id}`)
        .maybeSingle();

      if (prodErr) throw prodErr;

      if (prod) {
        // Decrement stock
        const currentSizes = prod.sizes || [];
        const updatedSizes = currentSizes.map((s: any) => {
          if (s.size === item.size) {
            return { ...s, stock: Math.max(0, s.stock - item.quantity) };
          }
          return s;
        });

        const { error: updateErr } = await supabase!
          .from('products')
          .update({ sizes: updatedSizes })
          .eq('id', prod.id);

        if (updateErr) throw updateErr;
      }
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('gr_last_order_number', orderNumber);
    }
    return orderNumber;
  },

  async getReviews(productId: string): Promise<any[]> {
    const { data, error } = await supabase!
      .from('product_reviews')
      .select('*, profiles(full_name)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
    return data || [];
  },

  async submitReview(review: {
    productId: string;
    userId: string;
    rating: number;
    reviewText: string;
    reviewImages: string[];
  }): Promise<any> {
    const { data, error } = await supabase!
      .from('product_reviews')
      .insert({
        product_id: review.productId,
        user_id: review.userId,
        rating: review.rating,
        review_text: review.reviewText,
        review_images: review.reviewImages,
      })
      .select()
      .single();

    if (error) throw error;

    try {
      const { data: allReviews } = await supabase!
        .from('product_reviews')
        .select('rating')
        .eq('product_id', review.productId);

      if (allReviews && allReviews.length > 0) {
        const count = allReviews.length;
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / count;
        await supabase!
          .from('products')
          .update({
            rating: Number(avg.toFixed(2)),
            reviews_count: count
          })
          .eq('id', review.productId);
      }
    } catch (err) {
      console.error('Failed to update product rating/reviews_count:', err);
    }

    return data;
  },

  async uploadReviewImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase!.storage.from('reviews').upload(path, file);
    if (error) throw error;
    const { data } = supabase!.storage.from('reviews').getPublicUrl(path);
    return data.publicUrl;
  },

  async uploadCustomImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase!.storage.from('custom_uploads').upload(path, file);
    if (error) throw error;
    const { data } = supabase!.storage.from('custom_uploads').getPublicUrl(path);
    return data.publicUrl;
  }
};;

