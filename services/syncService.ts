import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { CartItem } from '@/lib/redux/slices/cartSlice';
import { Product } from '@/lib/data/products';

export const syncService = {
  // Helper to get or create cart_id for user
  async getOrCreateCartId(userId: string): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await supabase!
        .from('carts')
        .upsert({ user_id: userId }, { onConflict: 'user_id' })
        .select('id')
        .single();
        
      if (error || !data) {
        console.error('Error getting or creating cart for user:', error?.message);
        return null;
      }
      return data.id;
    } catch (e) {
      console.error('getOrCreateCartId error:', e);
      return null;
    }
  },

  // Helper to get or create wishlist_id for user
  async getOrCreateWishlistId(userId: string): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await supabase!
        .from('wishlists')
        .upsert({ user_id: userId }, { onConflict: 'user_id' })
        .select('id')
        .single();
        
      if (error || !data) {
        console.error('Error getting or creating wishlist for user:', error?.message);
        return null;
      }
      return data.id;
    } catch (e) {
      console.error('getOrCreateWishlistId error:', e);
      return null;
    }
  },

  // ==========================================
  // CART SYNC
  // ==========================================
  async fetchDbCart(userId: string): Promise<CartItem[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const cartId = await this.getOrCreateCartId(userId);
      if (!cartId) return [];

      const { data, error } = await supabase!
        .from('cart_items')
        .select(`
          quantity,
          size,
          custom_images,
          products (*)
        `)
        .eq('cart_id', cartId);

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
          custom_images: item.custom_images || [],
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
      const cartId = await this.getOrCreateCartId(userId);
      if (!cartId) return;

      // Find database UUID for the product
      const { data: prod, error: prodError } = await supabase!
        .from('products')
        .select('id')
        .eq('id', item.id)
        .maybeSingle();

      if (prodError || !prod) {
        console.error('Could not find product matching ID for cart sync:', item.id);
        return;
      }

      const { data: existing } = await supabase!
        .from('cart_items')
        .select('id')
        .eq('cart_id', cartId)
        .eq('product_id', prod.id)
        .eq('size', item.size || 'One Size')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase!
          .from('cart_items')
          .update({
            quantity: item.quantity,
            custom_images: item.custom_images || [],
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (error) console.error('Error updating cart item in DB:', error.message);
      } else {
        const { error } = await supabase!
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: prod.id,
            size: item.size || 'One Size',
            quantity: item.quantity,
            custom_images: item.custom_images || [],
            updated_at: new Date().toISOString(),
          });
        if (error) console.error('Error inserting cart item to DB:', error.message);
      }
    } catch (e) {
      console.error('Error syncing cart item:', e);
    }
  },

  async removeCartItem(userId: string, productId: string, size?: string) {
    if (!isSupabaseConfigured()) return;
    try {
      const cartId = await this.getOrCreateCartId(userId);
      if (!cartId) return;

      const { data: prod } = await supabase!
        .from('products')
        .select('id')
        .eq('id', productId)
        .maybeSingle();

      if (!prod) return;

      const { error } = await supabase!
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId)
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
      const cartId = await this.getOrCreateCartId(userId);
      if (!cartId) return;

      const { error } = await supabase!
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);
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
      const wishlistId = await this.getOrCreateWishlistId(userId);
      if (!wishlistId) return [];

      const { data, error } = await supabase!
        .from('wishlist_items')
        .select('product_id')
        .eq('wishlist_id', wishlistId);

      if (error || !data) throw error;
      return data.map((item: any) => item.product_id).filter(Boolean);
    } catch (e) {
      console.error('Error fetching wishlist from DB:', e);
      return [];
    }
  },

  async addToWishlist(userId: string, productId: string) {
    if (!isSupabaseConfigured()) return;
    try {
      const wishlistId = await this.getOrCreateWishlistId(userId);
      if (!wishlistId) return;

      const { data: prod } = await supabase!
        .from('products')
        .select('id')
        .eq('id', productId)
        .maybeSingle();

      if (!prod) return;

      const { data: existing } = await supabase!
        .from('wishlist_items')
        .select('id')
        .eq('wishlist_id', wishlistId)
        .eq('product_id', prod.id)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase!
          .from('wishlist_items')
          .insert({
            wishlist_id: wishlistId,
            product_id: prod.id,
          });

        if (error) console.error('Error adding to DB wishlist:', error.message);
      }
    } catch (e) {
      console.error(e);
    }
  },

  async removeFromWishlist(userId: string, productId: string) {
    if (!isSupabaseConfigured()) return;
    try {
      const wishlistId = await this.getOrCreateWishlistId(userId);
      if (!wishlistId) return;

      const { data: prod } = await supabase!
        .from('products')
        .select('id')
        .eq('id', productId)
        .maybeSingle();

      if (!prod) return;

      const { error } = await supabase!
        .from('wishlist_items')
        .delete()
        .eq('wishlist_id', wishlistId)
        .eq('product_id', prod.id);

      if (error) console.error('Error removing from DB wishlist:', error.message);
    } catch (e) {
      console.error(e);
    }
  }
};
