import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { CartItem } from '@/lib/redux/slices/cartSlice';
import { Product } from '@/lib/data/products';

export const syncService = {
  // ==========================================
  // CART SYNC
  // ==========================================
  async fetchDbCart(userId: string): Promise<CartItem[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await supabase!
        .from('cart')
        .select(`
          quantity,
          size,
          products (*)
        `)
        .eq('user_id', userId);

      if (error || !data) throw error || new Error('No data');

      return data.map((item: any) => {
        const p = item.products;
        return {
          id: p.product_id || p.id,
          slug: p.slug,
          title: p.name,
          brand: p.brand || 'GR STYLES',
          price: Number(p.mrp_price),
          discountedPrice: Number(p.selling_price),
          image: p.images?.[0] || '/placeholder.png',
          quantity: item.quantity,
          size: item.size || 'One Size',
          color: p.color,
        };
      });
    } catch (e) {
      console.error('Error fetching cart from DB:', e);
      return [];
    }
  },

  async syncCartItem(userId: string, item: CartItem) {
    if (!isSupabaseConfigured()) return;
    try {
      // Find database UUID for the product
      const { data: prod, error: prodError } = await supabase!
        .from('products')
        .select('id')
        .or(`id.eq.${item.id},product_id.eq.${item.id}`)
        .maybeSingle();

      if (prodError || !prod) {
        console.error('Could not find product matching ID for cart sync:', item.id);
        return;
      }

      const { error } = await supabase!
        .from('cart')
        .upsert({
          user_id: userId,
          product_id: prod.id,
          size: item.size || 'One Size',
          quantity: item.quantity,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,product_id,size'
        });

      if (error) console.error('Error upserting cart item to DB:', error.message);
    } catch (e) {
      console.error('Error syncing cart item:', e);
    }
  },

  async removeCartItem(userId: string, productId: string, size?: string) {
    if (!isSupabaseConfigured()) return;
    try {
      const { data: prod } = await supabase!
        .from('products')
        .select('id')
        .or(`id.eq.${productId},product_id.eq.${productId}`)
        .maybeSingle();

      if (!prod) return;

      const { error } = await supabase!
        .from('cart')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', prod.id)
        .eq('size', size || 'One Size');

      if (error) console.error('Error deleting cart item from DB:', error.message);
    } catch (e) {
      console.error('Error removing cart item from DB:', e);
    }
  },

  async clearCart(userId: string) {
    if (!isSupabaseConfigured()) return;
    try {
      const { error } = await supabase!
        .from('cart')
        .delete()
        .eq('user_id', userId);
      if (error) console.error('Error clearing DB cart:', error.message);
    } catch (e) {
      console.error(e);
    }
  },

  // ==========================================
  // WISHLIST SYNC
  // ==========================================
  async fetchDbWishlist(userId: string): Promise<string[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await supabase!
        .from('wishlist')
        .select(`
          products (product_id, id)
        `)
        .eq('user_id', userId);

      if (error || !data) throw error;
      return data.map((item: any) => item.products?.product_id || item.products?.id).filter(Boolean);
    } catch (e) {
      console.error('Error fetching wishlist from DB:', e);
      return [];
    }
  },

  async addToWishlist(userId: string, productId: string) {
    if (!isSupabaseConfigured()) return;
    try {
      const { data: prod } = await supabase!
        .from('products')
        .select('id')
        .or(`id.eq.${productId},product_id.eq.${productId}`)
        .maybeSingle();

      if (!prod) return;

      const { error } = await supabase!
        .from('wishlist')
        .upsert({
          user_id: userId,
          product_id: prod.id,
        }, {
          onConflict: 'user_id,product_id'
        });

      if (error) console.error('Error adding to DB wishlist:', error.message);
    } catch (e) {
      console.error(e);
    }
  },

  async removeFromWishlist(userId: string, productId: string) {
    if (!isSupabaseConfigured()) return;
    try {
      const { data: prod } = await supabase!
        .from('products')
        .select('id')
        .or(`id.eq.${productId},product_id.eq.${productId}`)
        .maybeSingle();

      if (!prod) return;

      const { error } = await supabase!
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', prod.id);

      if (error) console.error('Error removing from DB wishlist:', error.message);
    } catch (e) {
      console.error(e);
    }
  }
};
