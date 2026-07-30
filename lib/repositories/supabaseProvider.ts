/**
 * GR STYLES – Supabase Provider
 * ================================
 * Implements all repository interfaces using Supabase.
 * Activated automatically when NEXT_PUBLIC_SUPABASE_URL is set in .env.local
 * 
 * To switch from Mock → Supabase:
 * 1. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local
 * 2. Run the seed script: node scratch/seed_supabase.js
 * 3. No code changes needed!
 */

import { Product } from '@/lib/data/products';
import { getClient, getAdminClient } from '@/lib/supabase';
const sb = () => getClient()!;
import { mapDbProduct } from '@/services/productService';
import { normalizeCategory, normalizeSlug, normalizeCollection, matchCategory } from '../utils/categoryImageMap';
import { validateAndCalculateCoupon } from '@/lib/utils/couponEngine';
import {
  IProductRepository,
  IOrderRepository,
  ICouponRepository,
  IStorageRepository,
  IAnalyticsRepository,
  IBannerRepository,
  IShippingRepository,
  ShippingSettings,
  Banner,
  InventoryEntry,
  CreateOrderInput,
  DashboardStats,
  FullAnalytics,
  MockCoupon,
  MockOrder,
} from './interfaces';

// Type definition for stock columns
type StockColumn = 'shirt_stock' | 'pant_stock' | 'shoe_stock' | 'overall_stock';
type StockData = {
  [K in StockColumn]?: Record<string, number> | number;
};

// ─── Supabase Product Repository ──────────────────────────────────────────────

export class SupabaseProductRepository implements IProductRepository {
  async getAll(): Promise<Product[]> {
    const productsRes = await sb().from('products').select('*').order('created_at', { ascending: false });
    if (productsRes.error) throw productsRes.error;
    return (productsRes.data || []).map((p: any) => mapDbProduct(p));
  }

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await sb()
      .from('products')
      .select('*, product_coupons(coupon_code)')
      .eq('id', id)
      .maybeSingle();
      
    if (error) {
      console.warn(`Error fetching product by id ${id}:`, error);
      return null;
    }
    if (!data) return null;
    return mapDbProduct(data);
  }

  async getBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await sb()
      .from('products')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapDbProduct(data);
  }

  async getByCategory(category: string): Promise<Product[]> {
    const products = await this.getAll();
    const targetSlug = normalizeSlug(category);
    return products.filter((p) => matchCategory(p, targetSlug));
  }

  async getByCollection(collection: string): Promise<Product[]> {
    const products = await this.getAll();
    const targetSlug = normalizeSlug(collection);
    return products.filter((p) => matchCategory(p, targetSlug));
  }

  private async generateUniqueSlug(baseName: string, currentId?: string): Promise<string> {
    const baseSlug = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      const { data, error } = await sb()
        .from('products')
        .select('id')
        .eq('slug', candidate)
        .maybeSingle();
      
      if (error) throw error;
      
      // If no product found, or the product found is the one we're currently editing
      if (!data || (currentId && data.id === currentId)) {
        return candidate;
      }
      
      candidate = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async create(product: Product): Promise<Product | null> {
    console.log('Using Provider: Supabase');
    
    const finalSlug = await this.generateUniqueSlug(product.slug || product.name);

    const mapped = {
      sku: product.sku,
      name: product.name,
      slug: finalSlug,
      category: normalizeCategory(product.category),
      collection: product.collection ? normalizeCollection(product.collection) : '',
      images: product.images,
      color: product.color || '',
      image_colors: (product as any).imageColors || null,
      sizes: product.sizes || [],
      shirt_stock: product.shirtStock || {},
      pant_stock: product.pantStock || {},
      shoe_stock: product.shoeStock || {},
      overall_stock: product.overallStock || 0,
      mrp: product.mrpPrice,
      selling_price: product.sellingPrice,
      description: product.description,
      featured: product.metadata?.featured || false,
      trending: product.bestSeller || false,
      new_arrival: product.isNew || false,
      deal_of_day: product.metadata?.dealOfDay || false,
      brand: product.brand || 'GR STYLES',
    };

    const { data, error } = await sb()
      .from('products')
      .insert(mapped)
      .select('*')
      .single();
      
    if (error) {
      if (error.code === '23505' && error.message.includes('slug')) {
        throw new Error('A product with this slug already exists. Please try a different name.');
      }
      throw error;
    }

    if (data && product.coupons && product.coupons.length > 0) {
      try {
        const pcRows = product.coupons.map((c: string) => ({
          product_id: data.id,
          coupon_code: c
        }));
        await sb().from('product_coupons').insert(pcRows);
      } catch (err) {
        console.warn('Failed to save product_coupons in repo on create:', err);
      }
    }

    return data ? mapDbProduct(data) : null;
  }

  async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    const mapped: any = {};
    if (updates.name) mapped.name = updates.name;
    
    if (updates.slug) {
      mapped.slug = await this.generateUniqueSlug(updates.slug, id);
    } else if (updates.name) {
      mapped.slug = await this.generateUniqueSlug(updates.name, id);
    }
    
    if (updates.category) mapped.category = normalizeCategory(updates.category);
    if (updates.collection !== undefined) mapped.collection = updates.collection ? normalizeCollection(updates.collection) : '';
    if (updates.sellingPrice) mapped.selling_price = updates.sellingPrice;
    if (updates.mrpPrice) mapped.mrp = updates.mrpPrice;
    if (updates.sizes !== undefined) mapped.sizes = updates.sizes;
    if (updates.shirtStock !== undefined) mapped.shirt_stock = updates.shirtStock;
    if (updates.pantStock !== undefined) mapped.pant_stock = updates.pantStock;
    if (updates.shoeStock !== undefined) mapped.shoe_stock = updates.shoeStock;
    if (updates.overallStock !== undefined) mapped.overall_stock = updates.overallStock;
    if (updates.description) mapped.description = updates.description;
    if (updates.isNew !== undefined) mapped.new_arrival = updates.isNew;
    if (updates.bestSeller !== undefined) mapped.trending = updates.bestSeller;
    if (updates.metadata?.dealOfDay !== undefined) mapped.deal_of_day = updates.metadata.dealOfDay;
    if (updates.metadata?.featured !== undefined) mapped.featured = updates.metadata.featured;
    if (updates.brand) mapped.brand = updates.brand;
    if (updates.images) mapped.images = updates.images;
    if (updates.color !== undefined) mapped.color = updates.color;
    if ((updates as any).imageColors) mapped.image_colors = (updates as any).imageColors;

    console.log('[DEBUG SupabaseProvider Flow] 4. Payload sent to Supabase (update):', JSON.stringify(mapped.image_colors, null, 2));

    const { data, error } = await sb()
      .from('products')
      .update(mapped)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    
    console.log('[DEBUG SupabaseProvider Flow] 5. Database row immediately after update:', JSON.stringify(data.image_colors, null, 2));

    if (data && updates.coupons !== undefined) {
      try {
        await sb().from('product_coupons').delete().eq('product_id', data.id);
        if (updates.coupons.length > 0) {
          const pcRows = updates.coupons.map((c: string) => ({
            product_id: data.id,
            coupon_code: c
          }));
          await sb().from('product_coupons').insert(pcRows);
        }
      } catch (err) {
        console.warn('Failed to update product_coupons in repo:', err);
      }
    }

    return data ? mapDbProduct(data) : null;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await sb()
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;

    try {
      await sb().from('product_coupons').delete().eq('product_id', id);
    } catch (err) {
      console.warn('Failed to delete product references in repo on delete:', err);
    }

    return true;
  }

  async search(query: string): Promise<Product[]> {
    const productsRes = await sb().from('products').select('*').or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`);
    if (productsRes.error) throw productsRes.error;
    return (productsRes.data || []).map((p: any) => mapDbProduct(p));
  }

  async getInventory(): Promise<InventoryEntry[]> {
    const { data, error } = await sb()
      .from('products')
      .select('id, name, slug, category, sizes, shirt_stock, pant_stock, shoe_stock, overall_stock')
      .order('category');
    if (error) throw error;

    return (data || []).map((d: any) => {
      // ── Resolve the sizes array ──────────────────────────────────────────────
      let sizes: string[] = [];
      if (Array.isArray(d.sizes)) {
        // Supabase may return the old [{size,stock}] format OR new ["S","M"] format
        if (d.sizes.length > 0 && typeof d.sizes[0] === 'object' && d.sizes[0] !== null) {
          // OLD format: [{size: "S", stock: 5}, ...] — extract just the size labels
          sizes = d.sizes.map((x: any) => String(x.size || ''));
        } else {
          sizes = d.sizes.map((s: any) => String(s));
        }
      } else if (typeof d.sizes === 'string') {
        try {
          const parsed = JSON.parse(d.sizes);
          if (Array.isArray(parsed)) {
            if (parsed.length > 0 && typeof parsed[0] === 'object') {
              sizes = parsed.map((x: any) => String(x.size || ''));
            } else {
              sizes = parsed.map(String);
            }
          }
        } catch(e) { sizes = []; }
      }
      sizes = sizes.filter(Boolean);

      // ── Pick the right per-size stock JSONB column based on category ─────────
      // Uses the same broader keyword list as updateStock() for consistency.
      const categoryLower = (d.category || '').toLowerCase();
      let rawStock: Record<string, number> = {};

      if (
        categoryLower.includes('shoe') ||
        categoryLower.includes('footwear') ||
        categoryLower.includes('sneaker') ||
        categoryLower.includes('boot') ||
        categoryLower.includes('slipper')
      ) {
        rawStock = d.shoe_stock || {};
      } else if (
        categoryLower.includes('pant') ||
        categoryLower.includes('jean') ||
        categoryLower.includes('trouser') ||
        categoryLower.includes('track') ||
        categoryLower.includes('short') ||
        categoryLower.includes('chino') ||
        categoryLower.includes('bottom')
      ) {
        rawStock = d.pant_stock || {};
      } else {
        // Default: shirt-type column covers shirts, jackets, T-shirts, etc.
        rawStock = d.shirt_stock || {};
      }

      // ── Build sizeStock array ────────────────────────────────────────────────
      let sizeStock: { size: string; stock: number }[] = [];

      if (Object.keys(rawStock).length > 0) {
        // JSONB column has real per-size data — always prefer this as source of truth.
        // Merge with sizes array so we display in the correct order.
        if (sizes.length > 0) {
          // Show sizes in defined order, reading stock from JSONB column
          sizeStock = sizes.map((s) => ({
            size: s,
            stock: rawStock[s] !== undefined ? Number(rawStock[s]) : 0,
          }));
          // Include any extra sizes in the JSONB that aren't in the sizes array
          for (const [s, qty] of Object.entries(rawStock)) {
            if (!sizes.includes(s)) {
              sizeStock.push({ size: s, stock: Number(qty) || 0 });
            }
          }
        } else {
          // No sizes array — build from JSONB keys directly
          sizeStock = Object.entries(rawStock).map(([size, stock]) => ({
            size,
            stock: Number(stock) || 0,
          }));
        }
      } else if (sizes.length > 0) {
        // JSONB columns are empty but sizes array exists — fall back to overall_stock
        // split evenly. This covers newly-created products before any stock update.
        const fallbackPerSize = Math.floor(Number(d.overall_stock || 0) / sizes.length);
        sizeStock = sizes.map((s) => ({
          size: s,
          stock: fallbackPerSize,
        }));
      } else {
        // No per-size data at all — show as single 'One Size' entry using overall_stock
        sizeStock = [{ size: 'One Size', stock: Number(d.overall_stock) || 0 }];
      }

      return {
        id: d.id,
        name: d.name,
        slug: d.slug,
        category: d.category,
        sizes,
        sizeStock,
      };
    });
  }

  /**
   * Atomically updates stock for ALL sizes of a product in a single Supabase call.
   * BUG FIX: The previous implementation called this per-size concurrently which
   * caused race conditions — each concurrent fetch saw stale data and overwrote
   * the others' writes. Now we accept the entire { [size]: qty } map and write
   * everything in one update, recalculating overall_stock from the full map.
   */
  async updateStock(productId: string, sizeStockMap: { [size: string]: number }): Promise<boolean> {
    console.log('[Inventory] updateStock called for product:', productId);
    console.log('[Inventory] New size-stock map:', sizeStockMap);

    // ── Step 1: Fetch current product to determine category & current stock ──
    const { data: prod, error: fetchErr } = await sb()
      .from('products')
      .select('category, shirt_stock, pant_stock, shoe_stock, overall_stock')
      .eq('id', productId)
      .maybeSingle();

    if (fetchErr || !prod) {
      console.error('[Inventory] Failed to fetch product for stock update:', fetchErr);
      throw fetchErr || new Error('Product not found');
    }

    console.log('[Inventory] Previous overall_stock:', prod.overall_stock);

    // ── Step 2: Determine which stock column to use ──────────────────────────
    const categoryLower = (prod.category || '').toLowerCase();
    let column: 'shirt_stock' | 'pant_stock' | 'shoe_stock' | null = null;

    if (
      categoryLower.includes('shoe') ||
      categoryLower.includes('footwear') ||
      categoryLower.includes('sneaker') ||
      categoryLower.includes('boot') ||
      categoryLower.includes('slipper')
    ) {
      column = 'shoe_stock';
    } else if (
      categoryLower.includes('pant') ||
      categoryLower.includes('jean') ||
      categoryLower.includes('trouser') ||
      categoryLower.includes('track') ||
      categoryLower.includes('short') ||
      categoryLower.includes('chino') ||
      categoryLower.includes('bottom')
    ) {
      column = 'pant_stock';
    } else {
      // Default: shirt column for shirts, jackets, T-shirts, and all other
      column = 'shirt_stock';
    }

    // ── Step 3: Handle 'One Size' products ──────────────────────────────────
    if (sizeStockMap['One Size'] !== undefined) {
      const newOverall = Math.max(0, Number(sizeStockMap['One Size']));
      console.log('[Inventory] One-size product. Saving overall_stock:', newOverall);

      const { error: updateError, data: updatedRow } = await sb()
        .from('products')
        .update({ overall_stock: newOverall })
        .eq('id', productId)
        .select('overall_stock')
        .single();

      if (updateError) {
        console.error('[Inventory] Supabase update failed:', updateError);
        throw updateError;
      }
      console.log('[Inventory] Supabase confirmed overall_stock after save:', updatedRow?.overall_stock);
      return true;
    }

    // ── Step 4: Merge new sizes into the existing JSONB column ───────────────
    const existingStock: Record<string, number> = (prod as any)[column] || {};
    const updatedStock: Record<string, number> = { ...existingStock };

    for (const [size, qty] of Object.entries(sizeStockMap)) {
      updatedStock[size] = Math.max(0, Number(qty));
    }

    // ── Step 5: Recalculate total from the complete updated map ─────────────
    // Single source of truth: overall_stock ALWAYS equals sum of all sizes.
    const totalStock = Object.values(updatedStock).reduce(
      (sum, qty) => sum + Number(qty || 0),
      0
    );

    console.log('[Inventory] Updated size quantities:', updatedStock);
    console.log('[Inventory] Calculated total stock:', totalStock);

    // ── Step 6: Single atomic Supabase update ────────────────────────────────
    const { error: updateError, data: updatedRow } = await sb()
      .from('products')
      .update({
        [column]: updatedStock,
        overall_stock: totalStock,
      })
      .eq('id', productId)
      .select('overall_stock, ' + column)
      .single();

    if (updateError) {
      console.error('[Inventory] Supabase update failed:', updateError);
      throw updateError;
    }

    console.log('[Inventory] Supabase response after save — overall_stock:', (updatedRow as any)?.overall_stock);
    console.log('[Inventory] Supabase response after save — ' + column + ':', (updatedRow as any)?.[column]);
    return true;
  }
}

// ─── Supabase Order Repository ────────────────────────────────────────────────

export class SupabaseOrderRepository implements IOrderRepository {
  async getAll(): Promise<MockOrder[]> {
    const { data, error } = await sb()
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    if (error || !data) throw error;
      return data.map((d: any) => {
        const items = (d.order_items || []).map((item: any) => ({
          productId: item.product_id,
          productName: item.product_name,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: Number(item.price)
        }));
        const itemsSum = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
        const discount = Number(d.discount_amount || 0);
        const tax = d.tax_amount != null ? Number(d.tax_amount) : 0;
        const total = Number(d.total_amount);
        const subtotal = d.subtotal != null ? Number(d.subtotal) : itemsSum;
        const shipping = d.shipping_amount != null 
          ? Number(d.shipping_amount) 
          : Math.max(0, total - subtotal + discount - tax);

        return {
          id: d.id,
          orderNumber: d.order_number,
          customerName: d.customer_name,
          email: d.customer_email || '',
          phone: d.customer_phone || '',
          itemsCount: items.reduce((s: number, i: any) => s + i.quantity, 0),
          totalAmount: total,
          discountAmount: discount,
          couponId: d.coupon_id || undefined,
          couponCode: d.coupon_code || undefined,
          discountType: d.discount_type || undefined,
          discountValue: d.discount_value != null ? Number(d.discount_value) : undefined,
          actualDiscountApplied: d.actual_discount_applied != null ? Number(d.actual_discount_applied) : discount,
          finalTotalAfterDiscount: d.final_total_after_discount != null ? Number(d.final_total_after_discount) : total,
          subtotal,
          shippingAmount: shipping,
          taxAmount: tax,
          status: d.status as MockOrder['status'],
          paymentStatus: d.payment_status as MockOrder['paymentStatus'],
          paymentMethod: d.payment_method || 'Prepaid',
          date: new Date(d.created_at).toISOString().split('T')[0],
          shippingAddress: d.shipping_address,
          razorpay_order_id: d.razorpay_order_id,
          razorpay_payment_id: d.razorpay_payment_id,
          payment_signature: d.payment_signature,
          gateway: d.gateway,
          transaction_time: d.transaction_time,
          invoice_number: d.invoice_number,
          payment_verified: d.payment_verified,
          gateway_response: d.gateway_response,
          tracking_id: d.tracking_id,
          tracking_url: d.tracking_url,
          courier_partner: d.courier_partner,
          dispatch_date: d.dispatch_date,
          expected_delivery_date: d.expected_delivery_date,
          delivered_date: d.delivered_date,
          items,
        };
      });
    }

  async getById(id: string): Promise<MockOrder | null> {
    const { data } = await sb()
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .maybeSingle();
    if (!data) return null;

    const items = (data.order_items || []).map((item: any) => ({
      productId: item.product_id,
      productName: item.product_name,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: Number(item.price)
    }));
    const itemsSum = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
    const discount = Number(data.discount_amount || 0);
    const tax = data.tax_amount != null ? Number(data.tax_amount) : 0;
    const total = Number(data.total_amount);
    const subtotal = data.subtotal != null ? Number(data.subtotal) : itemsSum;
    const shipping = data.shipping_amount != null 
      ? Number(data.shipping_amount) 
      : Math.max(0, total - subtotal + discount - tax);

    return {
      id: data.id,
      orderNumber: data.order_number,
      customerName: data.customer_name,
      email: data.customer_email || '',
      phone: data.customer_phone || '',
      itemsCount: items.reduce((s: number, i: any) => s + i.quantity, 0),
      totalAmount: total,
      discountAmount: discount,
      couponId: data.coupon_id || undefined,
      couponCode: data.coupon_code || undefined,
      discountType: data.discount_type || undefined,
      discountValue: data.discount_value != null ? Number(data.discount_value) : undefined,
      actualDiscountApplied: data.actual_discount_applied != null ? Number(data.actual_discount_applied) : discount,
      finalTotalAfterDiscount: data.final_total_after_discount != null ? Number(data.final_total_after_discount) : total,
      subtotal,
      shippingAmount: shipping,
      taxAmount: tax,
      status: data.status,
      paymentStatus: data.payment_status,
      paymentMethod: data.payment_method || 'Prepaid',
      date: new Date(data.created_at).toISOString().split('T')[0],
      items,
      shippingAddress: data.shipping_address,
      razorpay_order_id: data.razorpay_order_id,
      razorpay_payment_id: data.razorpay_payment_id,
      payment_signature: data.payment_signature,
      gateway: data.gateway,
      transaction_time: data.transaction_time,
      invoice_number: data.invoice_number,
      payment_verified: data.payment_verified,
      gateway_response: data.gateway_response,
      tracking_id: data.tracking_id,
      tracking_url: data.tracking_url,
      courier_partner: data.courier_partner,
      dispatch_date: data.dispatch_date,
      expected_delivery_date: data.expected_delivery_date,
      delivered_date: data.delivered_date,
    };
  }

  async updateStatus(id: string, status: MockOrder['status']): Promise<boolean> {
    const { error } = await sb()
      .from('orders')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
    return true;
  }

  async updateShipping(id: string, shippingData: Partial<MockOrder>): Promise<boolean> {
    const { error } = await sb()
      .from('orders')
      .update({
        tracking_id: shippingData.tracking_id,
        tracking_url: shippingData.tracking_url,
        courier_partner: shippingData.courier_partner,
        dispatch_date: shippingData.dispatch_date,
        expected_delivery_date: shippingData.expected_delivery_date,
        delivered_date: shippingData.delivered_date,
      })
      .eq('id', id);
    if (error) throw error;
    return true;
  }

  async updatePaymentStatus(id: string, paymentStatus: MockOrder['paymentStatus']): Promise<boolean> {
    const { error } = await sb()
      .from('orders')
      .update({ payment_status: paymentStatus })
      .eq('id', id);
    if (error) throw error;
    return true;
  }
}

// ─── Supabase Coupon Repository ───────────────────────────────────────────────

export class SupabaseCouponRepository implements ICouponRepository {
  async getAll(): Promise<MockCoupon[]> {
    const { data, error } = await sb().from('coupons').select('*, product_coupons(product_id)');
    if (error || !data) return [];
    return data.map((c: any) => ({
      id: c.id,
      code: c.code,
      name: c.name || c.description,
      discountType: (c.discount_type === 'flat' || c.discount_type === 'fixed') ? 'fixed' : 'percentage',
      discountValue: Number(c.discount_value ?? c.discount ?? 0),
      maximumDiscount: c.maximum_discount != null ? Number(c.maximum_discount) : null,
      minimumPurchase: Number(c.minimum_purchase ?? c.min_order_value ?? 0),
      minOrderValue: Number(c.minimum_purchase ?? c.min_order_value ?? 0),
      maxCartValue: c.max_cart_value != null ? Number(c.max_cart_value) : null,
      description: c.description || '',
      isActive: c.is_active ?? c.active ?? true,
      startDate: c.start_date,
      endDate: c.expiry_date || c.end_date,
      expiryDate: c.expiry_date || c.end_date,
      usageLimit: c.usage_limit != null ? Number(c.usage_limit) : null,
      usagePerUser: c.usage_per_user != null ? Number(c.usage_per_user) : 1,
      usageCount: Number(c.used_count ?? c.usage_count ?? 0),
      applicableProducts: c.product_coupons?.map((pc: any) => pc.product_id) || [],
      applicableCategories: c.applicable_categories || [],
      excludeSaleProducts: Boolean(c.exclude_sale_products),
      firstOrderOnly: Boolean(c.first_order_only),
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  }

  async apply(code: string, validationData?: { subtotal: number; productIds: string[] }): Promise<{ valid: boolean; discountValue: number; discountType: 'percentage' | 'flat'; message: string }> {
    const cleanCode = code.toUpperCase().trim();
    const { data } = await sb()
      .from('coupons')
      .select('*, product_coupons(product_id)')
      .eq('code', cleanCode)
      .maybeSingle();
      
    if (!data) return { valid: false, discountValue: 0, discountType: 'percentage', message: 'Invalid coupon code.' };
    
    const couponObj: MockCoupon = {
      id: data.id,
      code: data.code,
      name: data.name,
      discountType: (data.discount_type === 'flat' || data.discount_type === 'fixed') ? 'fixed' : 'percentage',
      discountValue: Number(data.discount_value ?? data.discount ?? 0),
      maximumDiscount: data.maximum_discount != null ? Number(data.maximum_discount) : null,
      minimumPurchase: Number(data.minimum_purchase ?? data.min_order_value ?? 0),
      minOrderValue: Number(data.minimum_purchase ?? data.min_order_value ?? 0),
      maxCartValue: data.max_cart_value != null ? Number(data.max_cart_value) : null,
      description: data.description || '',
      isActive: data.is_active ?? data.active ?? true,
      startDate: data.start_date,
      endDate: data.expiry_date || data.end_date,
      expiryDate: data.expiry_date || data.end_date,
      usageLimit: data.usage_limit != null ? Number(data.usage_limit) : null,
      usagePerUser: data.usage_per_user != null ? Number(data.usage_per_user) : 1,
      usageCount: Number(data.used_count ?? data.usage_count ?? 0),
      firstOrderOnly: Boolean(data.first_order_only),
      excludeSaleProducts: Boolean(data.exclude_sale_products),
    };

    const subtotal = validationData?.subtotal || 0;
    const res = validateAndCalculateCoupon(couponObj, subtotal);

    return {
      valid: res.valid,
      discountValue: res.calculatedDiscount,
      discountType: res.discountType === 'fixed' ? 'flat' : 'percentage',
      message: res.valid
        ? `Coupon applied! ${res.discountType === 'percentage' ? `${res.discountValue}% off` : `₹${res.discountValue} off`} – ${res.couponName}`
        : res.message,
    };
  }

  async create(coupon: Omit<MockCoupon, 'usageCount'>): Promise<MockCoupon | null> {
    const payload: any = {
      code: coupon.code.toUpperCase().trim(),
      name: coupon.name || coupon.description || coupon.code,
      discount_type: coupon.discountType === 'fixed' ? 'fixed' : 'percentage',
      discount_value: coupon.discountValue,
      discount: coupon.discountValue,
      maximum_discount: coupon.maximumDiscount != null ? coupon.maximumDiscount : null,
      minimum_purchase: coupon.minimumPurchase ?? coupon.minOrderValue ?? 0,
      min_order_value: coupon.minimumPurchase ?? coupon.minOrderValue ?? 0,
      max_cart_value: coupon.maxCartValue != null ? coupon.maxCartValue : null,
      description: coupon.description,
      is_active: coupon.isActive,
      active: coupon.isActive,
      start_date: coupon.startDate || null,
      expiry_date: coupon.expiryDate || coupon.endDate || null,
      end_date: coupon.expiryDate || coupon.endDate || null,
      usage_limit: coupon.usageLimit || null,
      usage_per_user: coupon.usagePerUser || 1,
      used_count: 0,
      first_order_only: coupon.firstOrderOnly || false,
      exclude_sale_products: coupon.excludeSaleProducts || false,
    };

    const { data, error } = await sb()
      .from('coupons')
      .insert(payload)
      .select('*')
      .single();
      
    if (error) throw new Error(error.message);
    if (!data) return null;
    
    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      const pcRows = coupon.applicableProducts.map(pid => ({
        coupon_code: data.code,
        product_id: pid
      }));
      await sb().from('product_coupons').insert(pcRows);
    }
    
    return { 
      id: data.id,
      code: data.code, 
      name: data.name,
      discountType: (data.discount_type === 'flat' || data.discount_type === 'fixed') ? 'fixed' : 'percentage', 
      discountValue: Number(data.discount_value ?? data.discount ?? 0), 
      maximumDiscount: data.maximum_discount,
      minimumPurchase: Number(data.minimum_purchase ?? data.min_order_value ?? 0),
      maxCartValue: data.max_cart_value,
      description: data.description, 
      isActive: data.is_active ?? data.active ?? true,
      startDate: data.start_date,
      endDate: data.expiry_date || data.end_date,
      expiryDate: data.expiry_date || data.end_date,
      usageLimit: data.usage_limit,
      usagePerUser: data.usage_per_user,
      usageCount: 0,
      applicableProducts: coupon.applicableProducts || []
    };
  }

  async toggle(code: string, isActive: boolean): Promise<boolean> {
    const { error } = await sb().from('coupons').update({ active: isActive, is_active: isActive }).eq('code', code);
    return !error;
  }

  async delete(code: string): Promise<boolean> {
    const { error } = await sb().from('coupons').delete().eq('code', code);
    return !error;
  }
}

// ─── Supabase Banner Repository ──────────────────────────────────────────────

export class SupabaseBannerRepository implements IBannerRepository {
  // Helper to map DB row to TS Banner
  private mapToBanner(dbRow: any): Banner {
    return {
      ...dbRow,
      link_url: dbRow.link,
      is_active: dbRow.active,
      display_order: dbRow.sort_order,
    };
  }

  // Helper to map TS Banner to DB row
  private mapToDbRow(banner: Partial<Banner>): any {
    const row = { ...banner } as any;
    if (row.link_url !== undefined) { row.link = row.link_url; delete row.link_url; }
    if (row.is_active !== undefined) { row.active = row.is_active; delete row.is_active; }
    if (row.display_order !== undefined) { row.sort_order = row.display_order; delete row.display_order; }
    return row;
  }

  async getAll(): Promise<Banner[]> {
    try {
      const { data, error } = await sb().from('banners').select('*').order('sort_order', { ascending: true });
      if (error) {
        console.error('Error fetching banners:', error);
        return [];
      }
      return (data || []).map(this.mapToBanner);
    } catch (e) {
      console.error('Exception fetching banners:', e);
      return [];
    }
  }

  async getActive(): Promise<Banner[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await sb()
        .from('banners')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        return [];
      }

      const filtered = (data || []).filter((b) => {
        if (b.start_date && new Date(b.start_date).toISOString() > now) return false;
        if (b.end_date && new Date(b.end_date).toISOString() < now) return false;
        return true;
      });
      return filtered.map(this.mapToBanner);
    } catch (e) {
      return [];
    }
  }
  

  async getById(id: string): Promise<Banner | null> {
    const { data, error } = await sb().from('banners').select('*').eq('id', id).single();
    if (error) return null;
    return this.mapToBanner(data);
  }

  async create(banner: Omit<Banner, 'id' | 'created_at' | 'updated_at'>): Promise<Banner | null> {
    const dbRow = this.mapToDbRow(banner);
    const { data, error } = await sb().from('banners').insert([dbRow]).select('*').single();
    if (error) {
      console.error('Error creating banner:', error);
      return null;
    }
    return this.mapToBanner(data);
  }

  async update(id: string, banner: Partial<Banner>): Promise<Banner | null> {
    const dbRow = this.mapToDbRow(banner);
    const { data, error } = await sb().from('banners').update(dbRow).eq('id', id).select('*').single();
    if (error) {
      console.error('Error updating banner:', error);
      return null;
    }
    return this.mapToBanner(data);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await sb().from('banners').delete().eq('id', id);
    if (error) {
      console.error('Error deleting banner:', error);
      return false;
    }
    return true;
  }
}

// ─── Supabase Shipping Repository ────────────────────────────────────────────

export class SupabaseShippingRepository implements IShippingRepository {
  // The service-role (admin) client bypasses RLS and is needed for WRITES.
  // Reads use the public anon client (sb()) because the SELECT policy is USING(true).
  // IMPORTANT: getAdminClient() only works server-side (SUPABASE_SERVICE_ROLE_KEY has no
  // NEXT_PUBLIC_ prefix), so never call it from browser code such as useEffect in pages.
  private adminDb = () => {
    const client = getAdminClient();
    if (!client) {
      throw new Error('[ShippingRepo] Admin client missing – SUPABASE_SERVICE_ROLE_KEY not set');
    }
    return client;
  };

  async getSettings(): Promise<ShippingSettings> {

    const defaultSettings: ShippingSettings = {
      shippingCharge: 100,
      freeShippingAbove: 999,
      freeDelivery: false,
    };

    try {
      // Fetch settings using the public anon client – the SELECT policy on
      // shipping_settings is USING(true) so no service-role key is needed here.
      // IMPORTANT: adminDb() requires SUPABASE_SERVICE_ROLE_KEY which is only
      // available server-side; calling it from browser code throws an error.
      const { data, error } = await sb()
        .from('shipping_settings')
        .select('*')
        .eq('id', 1)
        .limit(1);

      if (error) {
        console.error('[ShippingRepo] getSettings error (code=%s): %s', error.code, error.message);
        return defaultSettings;
      }

      // data is an array due to limit(1); take first element if exists.
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        // No row found – return defaults (row should have been created via Admin API)
        console.warn('[ShippingRepo] No shipping settings row found, returning defaults');
        // Log raw data for debugging
        console.debug('[ShippingRepo] Raw data from query:', data);
        return defaultSettings;
      }

      console.log('Shipping settings loaded:', row);

      const mappedSettings: ShippingSettings = {
        shippingCharge: Number(row.shipping_charge ?? defaultSettings.shippingCharge),
        freeShippingAbove: Number(row.free_shipping_above ?? defaultSettings.freeShippingAbove),
        freeDelivery: Boolean(row.free_delivery ?? defaultSettings.freeDelivery),
      };

      console.log('Shipping settings after mapping:', mappedSettings);

      return mappedSettings;
    } catch (e) {
      console.error('[ShippingRepo] Unexpected error in getSettings:', e);
      return defaultSettings;
    }
  }

  async updateSettings(settings: Partial<ShippingSettings>): Promise<boolean> {
    try {
      // Resolve values: use what was passed, fall back to current DB values.
      const current = await this.getSettings();

      const payload = {
        shipping_charge:
          settings.shippingCharge !== undefined
            ? Number(settings.shippingCharge)
            : current.shippingCharge,
        free_shipping_above:
          settings.freeShippingAbove !== undefined
            ? Number(settings.freeShippingAbove)
            : current.freeShippingAbove,
        free_delivery:
          settings.freeDelivery !== undefined
            ? Boolean(settings.freeDelivery)
            : current.freeDelivery,
        updated_at: new Date().toISOString(),
      };

      console.log('[ShippingRepo] updateSettings payload:', payload);

      // Always update the singleton row (id = 1). Never insert.
      const { error } = await this.adminDb()
        .from('shipping_settings')
        .update(payload)
        .eq('id', 1);

      if (error) {
        console.error('[ShippingRepo] updateSettings error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        return false;
      }

      console.log('[ShippingRepo] ✅ Shipping settings updated successfully (id=1)');
      return true;
    } catch (e) {
      console.error('[ShippingRepo] Unexpected error in updateSettings:', e);
      return false;
    }
  }
}

// ─── Supabase Storage Repository ─────────────────────────────────────────────

export class SupabaseStorageRepository implements IStorageRepository {
  async uploadImage(file: File, bucket: 'product-images' | 'banners' | 'collections' | 'navigation-images'): Promise<string | null> {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      console.error('File size exceeds 5MB limit');
      return null;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      return null;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
    if (!ext || !allowedExts.includes(ext)) {
      console.error('Invalid file extension:', ext);
      return null;
    }

    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    try {
      const client = sb();
      if (client) {
        const { data, error } = await client.storage.from(bucket).upload(path, file);
        if (!error && data) {
          const { data: pubData } = client.storage.from(bucket).getPublicUrl(path);
          if (pubData?.publicUrl) {
            return pubData.publicUrl;
          }
        }
      }
    } catch (e) {
      // Fallthrough to Data URL fallback
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  async deleteImage(url: string, bucket: 'product-images' | 'banners' | 'collections' | 'navigation-images'): Promise<boolean> {
    if (!url || url.startsWith('data:') || url.startsWith('/images/')) return true;
    try {
      const path = url.split(`/${bucket}/`)[1] || url.split('/storage/v1/object/public/')[1];
      if (!path) return false;
      const { error } = await sb().storage.from(bucket).remove([path]);
      return !error;
    } catch (e) {
      return true;
    }
  }

  getImageUrl(path: string, bucket: 'product-images' | 'banners' | 'collections' | 'navigation-images'): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('/')) {
      return path;
    }
    try {
      const { data } = sb().storage.from(bucket).getPublicUrl(path);
      return data?.publicUrl || path;
    } catch (e) {
      return path;
    }
  }
}

// ─── Supabase Analytics Repository ───────────────────────────────────────────

export class SupabaseAnalyticsRepository implements IAnalyticsRepository {
  async getDashboardStats(): Promise<DashboardStats> {
    const full = await this.getFullAnalytics();
    return {
      totalProducts: full.totalProducts,
      totalOrders: full.totalOrders,
      totalRevenue: full.totalRevenue,
      totalCoupons: full.totalCoupons,
      lowStockCount: full.lowStockCount,
      pendingOrders: full.pendingOrders,
    };
  }

  async getFullAnalytics(): Promise<FullAnalytics> {
    const [
      { data: productsData, error: productsError },
      { data: ordersData, error: ordersError },
      { count: couponCount, error: couponError },
    ] = await Promise.all([
      sb().from('products').select('id, name, shirt_stock, pant_stock, shoe_stock, overall_stock, category, sku'),
      sb().from('orders').select('id, order_number, customer_name, total_amount, status, payment_method, payment_status, created_at, items'),
      sb().from('coupons').select('*', { count: 'exact', head: true }).eq('active', true),
    ]);

    if (productsError) throw productsError;
    if (ordersError) throw ordersError;
    if (couponError) throw couponError;

    const products = productsData || [];
    const orders = ordersData || [];

    const totalProducts = products.length;
    const totalOrders = orders.length;
    const totalCoupons = couponCount || 0;

    const pendingOrders = orders.filter((o: any) => o.status === 'Pending').length;
    const validOrders = orders.filter(
      (o: any) => o.status !== 'Cancelled' && o.status !== 'Returned'
    );
    const totalRevenue = validOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);
    const avgOrderValue =
      validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

    const couponsUsed = 0;

    // 1. Map of products for lookup
    const productMap: Record<string, { sku: string; category: string }> = {};
    for (const p of products) {
      productMap[p.id] = {
        sku: p.sku || '',
        category: p.category || 'Other',
      };
    }

    // 2. Top selling products
    const productSales: Record<
      string,
      { name: string; sku: string; sales: number; revenue: number }
    > = {};
    for (const order of validOrders) {
      for (const item of order.items || []) {
        const key = item.productId;
        if (!key) continue;
        if (!productSales[key]) {
          const dbProd = productMap[key];
          productSales[key] = {
            name: item.productName || 'Unknown Product',
            sku: dbProd?.sku || `GR-${key.slice(0, 6).toUpperCase()}`,
            sales: 0,
            revenue: 0,
          };
        }
        productSales[key].sales += item.quantity || 0;
        productSales[key].revenue += (item.price || 0) * (item.quantity || 0);
      }
    }

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 3. Top categories
    const categoryRevenue: Record<string, number> = {};
    for (const order of validOrders) {
      for (const item of order.items || []) {
        const key = item.productId;
        const dbProd = productMap[key];
        const cat = dbProd?.category || 'Other';
        categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (item.price || 0) * (item.quantity || 0);
      }
    }
    const totalCategoryRevenue = Object.values(categoryRevenue).reduce((a, b) => a + b, 0) || 1;
    const topCategories = Object.entries(categoryRevenue)
      .map(([name, revenue]) => ({
        name,
        value: Math.round((revenue / totalCategoryRevenue) * 100),
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    // 4. Recent orders
    const recentOrders = orders.slice(0, 6).map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      customerName: o.customer_name,
      totalAmount: Number(o.total_amount || 0),
      status: o.status,
      date: new Date(o.created_at).toISOString().split('T')[0],
    }));

    // 5. Low stock products
    const lowStockProducts: {
      productId: string;
      name: string;
      size: string;
      stock: number;
    }[] = [];
    for (const p of products) {
      const checkStock = (stockObj: Record<string, number>) => {
        if (!stockObj) return;
        for (const [size, stock] of Object.entries(stockObj)) {
          if (stock >= 0 && stock <= 5) {
            lowStockProducts.push({
              productId: p.id,
              name: p.name,
              size,
              stock,
            });
          }
        }
      };
      checkStock(p.shirt_stock);
      checkStock(p.pant_stock);
      checkStock(p.shoe_stock);
      if (p.overall_stock >= 0 && p.overall_stock <= 5) {
        lowStockProducts.push({
          productId: p.id,
          name: p.name,
          size: 'Overall',
          stock: p.overall_stock,
        });
      }
    }
    lowStockProducts.sort((a, b) => a.stock - b.stock);
    const lowStockCount = lowStockProducts.length;

    // 6. Monthly performance
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap: Record<string, { revenue: number; orders: number }> = {};
    for (const order of validOrders) {
      const d = new Date(order.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { revenue: 0, orders: 0 };
      }
      monthlyMap[key].revenue += Number(order.total_amount || 0);
      monthlyMap[key].orders += 1;
    }
    const monthlyPerformance = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, data]) => {
        const monthIdx = parseInt(key.split('-')[1], 10);
        return {
          month: monthNames[monthIdx],
          revenue: data.revenue,
          orders: data.orders,
        };
      });

    // 7. Order status breakdown
    const statusLabels = [
      'Pending',
      'Confirmed',
      'Packed',
      'Shipped',
      'Delivered',
      'Cancelled',
      'Returned',
    ];
    const orderStatusBreakdown = statusLabels.map((label) => ({
      label,
      count: orders.filter((o: any) => o.status === label).length,
    }));

    // COD analytics
    const codOrders = orders.filter((o: any) => o.payment_method === 'cod');
    const onlineOrders = orders.filter((o: any) => o.payment_method !== 'cod');
    const totalCodOrders = codOrders.length;
    const totalOnlineOrders = onlineOrders.length;
    const pendingCodAmount = codOrders
      .filter((o: any) => o.payment_status === 'Pending' && o.status !== 'Cancelled' && o.status !== 'Returned')
      .reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);
    const paidCodAmount = codOrders
      .filter((o: any) => o.payment_status === 'Paid')
      .reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);

    return {
      totalProducts,
      totalOrders,
      totalRevenue,
      totalCoupons,
      lowStockCount,
      pendingOrders,
      avgOrderValue,
      couponsUsed,
      topProducts,
      topCategories,
      recentOrders,
      lowStockProducts: lowStockProducts.slice(0, 10),
      monthlyPerformance,
      orderStatusBreakdown,
      totalCodOrders,
      totalOnlineOrders,
      pendingCodAmount,
      paidCodAmount,
    };
  }
}