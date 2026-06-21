import { Product } from '@/lib/data/products';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/providers/mockStore';
import { normalizeSlug, matchCategory } from '@/lib/utils/categoryImageMap';

// Helper to map DB columns to frontend Product schema
export function mapDbProduct(db: any): Product {
  return {
    id: db.product_id || db.id,
    productId: db.product_id || db.id,
    sku: db.sku || '',
    name: db.name,
    title: db.name,
    slug: db.slug,
    category: db.category,
    collection: db.collection || '',
    images: db.images || [],
    color: db.color,
    colors: [db.color],
    mrpPrice: Number(db.mrp_price),
    price: Number(db.mrp_price),
    sellingPrice: Number(db.selling_price),
    discountedPrice: Number(db.selling_price),
    discountPercent: Number(db.discount_percent || 0),
    label: db.label || '',
    description: db.description,
    sizes: db.sizes || [],
    brand: db.brand || 'GR STYLES',
    rating: Number(db.rating || 5.0),
    reviews: Number(db.reviews_count || 0),
    isNew: !!db.new_arrival,
    bestSeller: !!db.trending,
    inStock: (db.sizes || []).some((s: any) => s.stock > 0),
    stockCount: (db.sizes || []).reduce((sum: number, s: any) => sum + (s.stock || 0), 0),
    metadata: {
      dealOfDay: !!db.deal_of_the_day,
      featured: !!db.featured,
      tags: db.tags || [],
    },
  };
}

export const productService = {
  async getProducts(): Promise<Product[]> {
    if (!isSupabaseConfigured()) {
      await new Promise((resolve) => setTimeout(resolve, 80));
      return mockStore.getProducts(); // Live from singleton — reflects admin CRUD
    }

    try {
      const { data, error } = await supabase!
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) throw error || new Error('No data');
      return data.map(mapDbProduct);
    } catch (err) {
      console.error('Failed to getProducts from Supabase, falling back:', err);
      return mockStore.getProducts();
    }
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    const products = mockStore.getProducts();
    if (!isSupabaseConfigured()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const prod = products.find((p) => p.slug === slug);
      return prod || null;
    }

    try {
      const { data, error } = await supabase!
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error || !data) return null;
      return mapDbProduct(data);
    } catch (err) {
      console.error('Failed to getProductBySlug from Supabase, falling back:', err);
      const prod = products.find((p) => p.slug === slug);
      return prod || null;
    }
  },

  async getProductsByCategory(categorySlug: string): Promise<Product[]> {
    if (!isSupabaseConfigured()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.getLocalByCategory(categorySlug);
    }

    try {
      const normalizedSlug = normalizeSlug(categorySlug);
      // Query all products and then filter dynamically via matchCategory
      const { data, error } = await supabase!
        .from('products')
        .select('*');

      if (error || !data) throw error || new Error('No data');
      return data.map(mapDbProduct).filter((p) => matchCategory(p, normalizedSlug));
    } catch (err) {
      console.error('Failed to getProductsByCategory from Supabase, falling back:', err);
      return this.getLocalByCategory(categorySlug);
    }
  },

  getLocalByCategory(categorySlug: string): Product[] {
    const products = mockStore.getProducts();
    const normalizedSlug = normalizeSlug(categorySlug);
    return products.filter((p) => matchCategory(p, normalizedSlug));
  },

  async getProductsByCollection(collectionSlug: string): Promise<Product[]> {
    if (!isSupabaseConfigured()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.getLocalByCollection(collectionSlug);
    }

    try {
      const slug = collectionSlug.toLowerCase().trim();
      let query = supabase!.from('products').select('*');

      // We can query by collection column in public.products table
      // If collection is set dynamically, query it directly
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
      if (error || !data || data.length === 0) {
        // Fallback to text query filtering on DB products
        const { data: allProds } = await supabase!.from('products').select('*');
        if (allProds) {
          const filtered = allProds.map(mapDbProduct).filter(p => {
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
          if (filtered.length > 0) return filtered;
        }
        return this.getLocalByCollection(collectionSlug);
      }

      return data.map(mapDbProduct);
    } catch (err) {
      console.error('Failed to getProductsByCollection from Supabase, falling back:', err);
      return this.getLocalByCollection(collectionSlug);
    }
  },

  getLocalByCollection(collectionSlug: string): Product[] {
    const products = mockStore.getProducts();
    const slug = collectionSlug.toLowerCase().trim();
    if (slug === 'korean-collection') {
      return products.filter((p) => p.title.toLowerCase().includes('korean') || p.description.toLowerCase().includes('korean'));
    }
    if (slug === 'festival-collection' || slug === 'festival-wear') {
      return products.filter((p) => p.label === 'HOT' || p.discountPercent > 20 || p.label === 'NEW');
    }
    if (slug === 'formal-collection' || slug === 'formal-wear') {
      return products.filter((p) => p.title.toLowerCase().includes('formal') || p.description.toLowerCase().includes('formal') || p.title.toLowerCase().includes('office'));
    }
    if (slug === 'weekend-collection' || slug === 'weekend-offers') {
      return products.filter((p) => p.title.toLowerCase().includes('weekend') || p.title.toLowerCase().includes('casual') || p.description.toLowerCase().includes('weekend'));
    }
    if (slug === 'denim-collection') {
      return products.filter((p) => p.category === 'Jeans' || p.title.toLowerCase().includes('denim') || p.description.toLowerCase().includes('denim'));
    }
    if (slug === 'streetwear-collection') {
      return products.filter((p) => p.title.toLowerCase().includes('streetwear') || p.title.toLowerCase().includes('oversized') || p.category === 'Hoodies' || p.category === 'Sweatshirts');
    }
    if (slug === 'premium-essentials') {
      return products.filter((p) => p.title.toLowerCase().includes('premium') || p.title.toLowerCase().includes('basic'));
    }
    if (slug === 'office-wear-collection') {
      return products.filter((p) => p.title.toLowerCase().includes('office') || p.title.toLowerCase().includes('formal'));
    }
    return products.slice(0, 8);
  },

  async getProductsByBrand(brandSlug: string): Promise<Product[]> {
    const products = mockStore.getProducts();
    if (!isSupabaseConfigured()) {
      return products.filter((p) => (p.brand || '').toLowerCase() === brandSlug.replace(/-/g, ' ').toLowerCase());
    }
    try {
      const cleanBrand = brandSlug.replace(/-/g, ' ').toLowerCase();
      const { data, error } = await supabase!
        .from('products')
        .select('*')
        .ilike('brand', `%${cleanBrand}%`);
      if (error || !data) throw error;
      return data.map(mapDbProduct);
    } catch (e) {
      return products.filter((p) => (p.brand || '').toLowerCase() === brandSlug.replace(/-/g, ' ').toLowerCase());
    }
  },

  async getProductsByFestival(festivalSlug: string): Promise<Product[]> {
    return this.getProductsByCollection('festival-collection');
  },

  async getProductsByCombo(comboSlug: string): Promise<Product[]> {
    // Combos represent complementary products. Handled by client configs
    return this.getProducts();
  },

  async getRelatedProducts(slug: string): Promise<Product[]> {
    const products = mockStore.getProducts();
    if (!isSupabaseConfigured()) {
      return products.filter((p) => p.slug !== slug).slice(0, 4);
    }
    try {
      const current = await this.getProductBySlug(slug);
      if (!current) return products.slice(0, 4);

      const { data, error } = await supabase!
        .from('products')
        .select('*')
        .eq('category', current.category)
        .neq('slug', slug)
        .limit(4);

      if (error || !data || data.length === 0) {
        return products.filter((p) => p.slug !== slug).slice(0, 4);
      }
      return data.map(mapDbProduct);
    } catch (e) {
      return products.filter((p) => p.slug !== slug).slice(0, 4);
    }
  },

  async createProduct(p: Product): Promise<Product | null> {
    if (!isSupabaseConfigured()) {
      return mockStore.addProduct(p); // Sync with mockStore singleton
    }
    try {
      const mapped: any = {
        product_id: p.id,
        sku: `GR-${p.category.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        name: p.name,
        slug: p.slug,
        category: p.category,
        collection: '',
        color: p.color,
        images: p.images,
        sizes: p.sizes,
        mrp_price: p.mrpPrice,
        selling_price: p.sellingPrice,
        discount_percent: p.discountPercent || 0,
        label: p.label || '',
        description: p.description,
        featured: false,
        trending: p.bestSeller || false,
        new_arrival: p.isNew || false,
        brand: p.brand || 'GR STYLES',
      };
      const { data, error } = await supabase!
        .from('products')
        .insert(mapped)
        .select('*')
        .single();
      if (error || !data) throw error;
      return mapDbProduct(data);
    } catch (e) {
      console.error('Failed to create product in Supabase:', e);
      mockStore.addProduct(p);
      return p;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return mockStore.deleteProduct(id); // Sync with mockStore singleton
    }
    try {
      // Try by UUID
      const { error } = await supabase!
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        // Try by product_id string (legacy support)
        const { error: err2 } = await supabase!
          .from('products')
          .delete()
          .eq('product_id', id);
        return !err2;
      }
      return !error;
    } catch (e) {
      return false;
    }
  },

  async createOrder(order: any, items: any[]): Promise<string | null> {
    const orderNumber = `GR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    
    if (!isSupabaseConfigured()) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('gr_last_order_number', orderNumber);
      }
      return orderNumber;
    }

    try {
      // Get current profile
      const { data: { session } } = await supabase!.auth.getSession();
      const userId = session?.user?.id || null;

      // 1. Insert order
      const { data: orderRow, error: orderError } = await supabase!
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: userId,
          customer_name: order.customerName,
          email: order.email,
          phone: order.phone,
          shipping_address: order.shippingAddress,
          payment_method: order.paymentMethod,
          total_amount: order.totalAmount,
          discount_amount: order.discountAmount,
          coupon_code: order.couponCode || null,
          status: 'Pending',
          payment_status: order.paymentStatus || 'Pending',
        })
        .select('*')
        .single();

      if (orderError || !orderRow) throw orderError || new Error('Order creation failed');

      // 2. Insert items and decrement stock
      for (const item of items) {
        // Find UUID product
        const { data: prod } = await supabase!
          .from('products')
          .select('id, sizes')
          .or(`id.eq.${item.id},product_id.eq.${item.id}`)
          .maybeSingle();

        if (prod) {
          // Insert order item
          await supabase!
            .from('order_items')
            .insert({
              order_id: orderRow.id,
              product_id: prod.id,
              product_name: item.title,
              size: item.size || 'One Size',
              quantity: item.quantity,
              price: item.discountedPrice,
            });

          // Decrement stock
          const currentSizes = prod.sizes || [];
          const updatedSizes = currentSizes.map((s: any) => {
            if (s.size === item.size) {
              return { ...s, stock: Math.max(0, s.stock - item.quantity) };
            }
            return s;
          });

          await supabase!
            .from('products')
            .update({ sizes: updatedSizes })
            .eq('id', prod.id);
        }
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('gr_last_order_number', orderNumber);
      }
      return orderNumber;
    } catch (e) {
      console.error('Failed to create order in Supabase, running fallback:', e);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('gr_last_order_number', orderNumber);
      }
      return orderNumber;
    }
  }
};

