import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// syncService is browser-only (called from useEffect). We use supabaseAuth
// so that all requests carry the user's JWT — required for RLS auth.uid() checks.
const sb = () => supabase;
import { CartItem } from '@/lib/redux/slices/cartSlice';
import { Product } from '@/lib/data/products';

// Guard: returns true only when there is a valid authenticated session.
// This prevents RLS violations when sync functions are called after sign-out.
async function hasActiveSession(): Promise<boolean> {
  try {
    if (!supabase) return false;
    const { data } = await supabase.auth.getSession();
    return !!data?.session?.user;
  } catch {
    return false;
  }
}

export const syncService = {
  // Helper to get or create cart_id for user
  async getOrCreateCartId(userId: string): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;
    if (!await hasActiveSession()) return null;
    try {
      const { data: sessionData } = await supabase!.auth.getSession();
      const activeUserId = sessionData?.session?.user?.id || userId;
      if (!activeUserId) return null;

      const { data, error } = await sb()!
        .from('carts')
        .upsert({ user_id: activeUserId }, { onConflict: 'user_id' })
        .select('id')
        .single();
        
      if (error || !data) {
        // Fallback query if upsert fails or cart already exists
        const { data: existingCart } = await sb()!
          .from('carts')
          .select('id')
          .eq('user_id', activeUserId)
          .maybeSingle();

        if (existingCart) return existingCart.id;

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
    if (!await hasActiveSession()) return null;
    try {
      const { data: sessionData } = await supabase!.auth.getSession();
      const activeUserId = sessionData?.session?.user?.id || userId;
      if (!activeUserId) return null;

      const { data, error } = await sb()!
        .from('wishlists')
        .upsert({ user_id: activeUserId }, { onConflict: 'user_id' })
        .select('id')
        .single();
        
      if (error || !data) {
        // Fallback query if upsert fails or wishlist already exists
        const { data: existingWishlist } = await sb()!
          .from('wishlists')
          .select('id')
          .eq('user_id', activeUserId)
          .maybeSingle();

        if (existingWishlist) return existingWishlist.id;

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
    if (!await hasActiveSession()) return [];
    try {
      const cartId = await this.getOrCreateCartId(userId);
      if (!cartId) return [];

      const { data, error } = await sb()!
        .from('cart_items')
        .select(`
          id,
          cart_id,
          product_id,
          size,
          shirt_size,
          pant_size,
          shoe_size,
          selected_color,
          selected_image,
          quantity,
          custom_images,
          products (*)
        `)
        .eq('cart_id', cartId);

      if (error || !data) throw error || new Error('No data');

      return data
        .filter((item: any) => item && item.products)
        .map((item: any) => {
          const p = item.products;
          const mrp = Number(p.mrp ?? p.mrp_price ?? p.price ?? 0);
          const selling = Number(p.selling_price ?? p.discountedPrice ?? mrp);
          const isCouponEnabled = p.is_coupon_applicable !== false && 
            p.coupon_applicable !== false && 
            p.is_coupon_applicable !== 0 && 
            p.coupon_applicable !== 0;

          return {
            id: p.id,
            slug: p.slug,
            title: p.name,
            brand: p.brand || 'GR STYLES',
            price: mrp,
            discountedPrice: selling,
            image: item.selected_image || p.images?.[0] || '/placeholder.png',
            quantity: Math.max(1, item.quantity || 1),
            size: item.size || undefined,
            shirtSize: item.shirt_size || undefined,
            pantSize: item.pant_size || undefined,
            shoeSize: item.shoe_size || undefined,
            color: item.selected_color || p.color || undefined,
            custom_images: item.custom_images || [],
            sku: p.sku || undefined,
            deliveryChargeEnabled: p.delivery_charge_enabled === true || p.delivery_charge_enabled === 'true',
            deliveryCharge: Number(p.delivery_charge || 0),
            delivery_charge_enabled: p.delivery_charge_enabled === true || p.delivery_charge_enabled === 'true',
            delivery_charge: Number(p.delivery_charge || 0),
            couponApplicable: isCouponEnabled,
            is_coupon_applicable: isCouponEnabled,
            coupon_applicable: isCouponEnabled,
            stock: Number(p.overall_stock ?? p.stockCount ?? p.stock ?? 99),
            selected: true,
          };
        });
    } catch (e) {
      console.error('Error fetching cart from DB:', e);
      return [];
    }
  },

  async syncCartItem(userId: string, item: CartItem) {
    if (!isSupabaseConfigured()) return;
    if (!await hasActiveSession()) return;
    try {
      const cartId = await this.getOrCreateCartId(userId);
      if (!cartId) return;

      // Find database UUID for the product
      let { data: prod, error: prodError } = await sb()!
        .from('products')
        .select('id')
        .eq('id', item.id)
        .maybeSingle();

      if (!prod && item.id) {
        const { data: altProd } = await sb()!
          .from('products')
          .select('id')
          .or(`product_id.eq.${item.id},slug.eq.${item.id}`)
          .maybeSingle();
        prod = altProd;
      }

      if (prodError || !prod) {
        console.warn('Could not find product matching ID for cart sync:', item.id);
        return;
      }

      const sizeVal = item.size || '';
      const shirtSizeVal = item.shirtSize || '';
      const pantSizeVal = item.pantSize || '';
      const shoeSizeVal = item.shoeSize || '';
      const colorVal = item.color || '';

      const { data: existing } = await sb()!
        .from('cart_items')
        .select('id')
        .eq('cart_id', cartId)
        .eq('product_id', prod.id)
        .eq('size', sizeVal)
        .eq('shirt_size', shirtSizeVal)
        .eq('pant_size', pantSizeVal)
        .eq('shoe_size', shoeSizeVal)
        .eq('selected_color', colorVal)
        .maybeSingle();

      if (existing) {
        const { error } = await sb()!
          .from('cart_items')
          .update({
            quantity: Math.max(1, item.quantity),
            selected_image: item.image || '',
            custom_images: item.custom_images || [],
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (error) console.warn('Cart item update note:', error.message || error);
      } else {
        const { error } = await sb()!
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: prod.id,
            size: sizeVal,
            shirt_size: shirtSizeVal,
            pant_size: pantSizeVal,
            shoe_size: shoeSizeVal,
            selected_color: colorVal,
            selected_image: item.image || '',
            quantity: Math.max(1, item.quantity),
            custom_images: item.custom_images || [],
            updated_at: new Date().toISOString(),
          });
        if (error) {
          if (error.code === '42703' || (error.message && error.message.includes('Could not find'))) {
            console.error('CRITICAL DB ERROR: The cart_items table is missing required columns (shirt_size, pant_size, etc.). Please run the final_combo_migration.sql!');
          } else {
            console.warn('Cart item insert note:', error.message || error);
          }
        }
      }
    } catch (e: any) {
      if (e?.code === '42703' || e?.message?.includes('Could not find')) {
        console.error('CRITICAL DB ERROR: The cart_items table is missing required columns. Please run final_combo_migration.sql!');
      } else {
        console.warn('Cart item sync notice:', e?.message || e);
      }
    }
  },

  async removeCartItem(userId: string, productId: string, size?: string, shirtSize?: string, pantSize?: string, shoeSize?: string, color?: string) {
    if (!isSupabaseConfigured()) return;
    if (!await hasActiveSession()) return;
    try {
      const cartId = await this.getOrCreateCartId(userId);
      if (!cartId) return;

      let { data: prod } = await sb()!
        .from('products')
        .select('id')
        .eq('id', productId)
        .maybeSingle();

      if (!prod && productId) {
        const { data: altProd } = await sb()!
          .from('products')
          .select('id')
          .or(`product_id.eq.${productId},slug.eq.${productId}`)
          .maybeSingle();
        prod = altProd;
      }

      if (!prod) return;

      const { error } = await sb()!
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId)
        .eq('product_id', prod.id)
        .eq('size', size || '')
        .eq('shirt_size', shirtSize || '')
        .eq('pant_size', pantSize || '')
        .eq('shoe_size', shoeSize || '')
        .eq('selected_color', color || '');

      if (error) console.error('Error deleting cart item from DB:', error.message);
    } catch (e) {
      console.error('Error removing cart item from DB:', e);
    }
  },

  async clearCart(userId: string) {
    if (!isSupabaseConfigured()) return;
    if (!await hasActiveSession()) return;
    try {
      const cartId = await this.getOrCreateCartId(userId);
      if (!cartId) return;

      const { error } = await sb()!
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
    if (!await hasActiveSession()) return [];
    try {
      const wishlistId = await this.getOrCreateWishlistId(userId);
      if (!wishlistId) return [];

      const { data, error } = await sb()!
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
    if (!await hasActiveSession()) return;
    try {
      const wishlistId = await this.getOrCreateWishlistId(userId);
      if (!wishlistId) return;

      let { data: prod } = await sb()!
        .from('products')
        .select('id')
        .eq('id', productId)
        .maybeSingle();

      if (!prod && productId) {
        const { data: altProd } = await sb()!
          .from('products')
          .select('id')
          .or(`product_id.eq.${productId},slug.eq.${productId}`)
          .maybeSingle();
        prod = altProd;
      }

      if (!prod) return;

      const { data: existing } = await sb()!
        .from('wishlist_items')
        .select('id')
        .eq('wishlist_id', wishlistId)
        .eq('product_id', prod.id)
        .maybeSingle();

      if (!existing) {
        const { error } = await sb()!
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
    if (!await hasActiveSession()) return;
    try {
      const wishlistId = await this.getOrCreateWishlistId(userId);
      if (!wishlistId) return;

      let { data: prod } = await sb()!
        .from('products')
        .select('id')
        .eq('id', productId)
        .maybeSingle();

      if (!prod && productId) {
        const { data: altProd } = await sb()!
          .from('products')
          .select('id')
          .or(`product_id.eq.${productId},slug.eq.${productId}`)
          .maybeSingle();
        prod = altProd;
      }

      if (!prod) return;

      const { error } = await sb()!
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
