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
import { supabase } from '@/lib/supabase';
import { mapDbProduct } from '@/services/productService';
import { normalizeCategory, normalizeSlug, normalizeCollection } from '../utils/categoryImageMap';
import {
  IProductRepository,
  IOrderRepository,
  ICouponRepository,
  IStorageRepository,
  IAnalyticsRepository,
  InventoryEntry,
  CreateOrderInput,
  DashboardStats,
  FullAnalytics,
} from './interfaces';
import { MockCoupon, MockOrder } from '../providers/mockStore';

// ─── Supabase Product Repository ──────────────────────────────────────────────

export class SupabaseProductRepository implements IProductRepository {
  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase!
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) throw error;
    return data.map(mapDbProduct);
  }

  async getBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await supabase!
      .from('products')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error || !data) return null;
    return mapDbProduct(data);
  }

  async getByCategory(category: string): Promise<Product[]> {
    const { data, error } = await supabase!
      .from('products')
      .select('*')
      .ilike('category', category)
      .order('created_at', { ascending: false });
    if (error || !data) throw error;
    return data.map(mapDbProduct);
  }

  async getByCollection(collection: string): Promise<Product[]> {
    const { data, error } = await supabase!
      .from('products')
      .select('*')
      .ilike('collection', collection)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(mapDbProduct);
  }

  async create(product: Product): Promise<Product | null> {
    const mapped = {
      name: product.name,
      slug: product.slug ? normalizeSlug(product.slug) : normalizeSlug(product.name || product.title),
      category: normalizeCategory(product.category),
      collection: product.collection ? normalizeCollection(product.collection) : '',
      color: product.color,
      images: product.images,
      sizes: product.sizes,
      mrp_price: product.mrpPrice,
      selling_price: product.sellingPrice,
      discount_percent: product.discountPercent || 0,
      label: product.label || '',
      description: product.description,
      brand: product.brand || 'GR STYLES',
      new_arrival: product.isNew || false,
      trending: product.bestSeller || false,
    };
    const { data, error } = await supabase!
      .from('products')
      .insert(mapped)
      .select('*')
      .single();
    if (error || !data) return null;
    return mapDbProduct(data);
  }

  async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    const mapped: any = {};
    if (updates.name) mapped.name = updates.name;
    if (updates.slug) mapped.slug = normalizeSlug(updates.slug);
    else if (updates.name) mapped.slug = normalizeSlug(updates.name);
    if (updates.category) mapped.category = normalizeCategory(updates.category);
    if (updates.collection !== undefined) mapped.collection = updates.collection ? normalizeCollection(updates.collection) : '';
    if (updates.sellingPrice) mapped.selling_price = updates.sellingPrice;
    if (updates.mrpPrice) mapped.mrp_price = updates.mrpPrice;
    if (updates.sizes) mapped.sizes = updates.sizes;
    if (updates.label !== undefined) mapped.label = updates.label;
    if (updates.description) mapped.description = updates.description;
    if (updates.isNew !== undefined) mapped.new_arrival = updates.isNew;
    if (updates.bestSeller !== undefined) mapped.trending = updates.bestSeller;

    const { data, error } = await supabase!
      .from('products')
      .update(mapped)
      .or(`id.eq.${id},product_id.eq.${id}`)
      .select('*')
      .single();
    if (error || !data) return null;
    return mapDbProduct(data);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase!
      .from('products')
      .delete()
      .or(`id.eq.${id},product_id.eq.${id}`);
    return !error;
  }

  async search(query: string): Promise<Product[]> {
    const { data, error } = await supabase!
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`);
    if (error || !data) return [];
    return data.map(mapDbProduct);
  }

  async getInventory(): Promise<InventoryEntry[]> {
    const { data, error } = await supabase!
      .from('products')
      .select('id, name, slug, category, sizes')
      .order('category');
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      category: d.category,
      sizeStock: d.sizes || [],
    }));
  }

  async updateStock(productId: string, size: string, newStock: number): Promise<boolean> {
    const { data, error } = await supabase!
      .from('products')
      .select('sizes')
      .or(`id.eq.${productId},product_id.eq.${productId}`)
      .maybeSingle();
    if (error || !data) return false;

    const current = data.sizes || [];
    const updated = current.map((s: any) =>
      s.size === size ? { ...s, stock: Math.max(0, newStock) } : s
    );
    if (!current.some((s: any) => s.size === size)) {
      updated.push({ size, stock: Math.max(0, newStock) });
    }

    const { error: updateError } = await supabase!
      .from('products')
      .update({ sizes: updated })
      .or(`id.eq.${productId},product_id.eq.${productId}`);
    return !updateError;
  }
}

// ─── Supabase Order Repository ────────────────────────────────────────────────

export class SupabaseOrderRepository implements IOrderRepository {
  async getAll(): Promise<MockOrder[]> {
    const { data, error } = await supabase!
      .from('orders')
      .select('*, order_items(quantity)')
      .order('created_at', { ascending: false });
    if (error || !data) throw error;
    return data.map((d: any) => ({
      id: d.id,
      orderNumber: d.order_number,
      customerName: d.customer_name,
      email: d.email,
      phone: d.phone,
      itemsCount: (d.order_items || []).reduce((s: number, i: any) => s + i.quantity, 0),
      totalAmount: Number(d.total_amount),
      status: d.status as MockOrder['status'],
      paymentStatus: d.payment_status as MockOrder['paymentStatus'],
      paymentMethod: d.payment_method || 'Unknown',
      date: new Date(d.created_at).toISOString().split('T')[0],
    }));
  }

  async getById(id: string): Promise<MockOrder | null> {
    const { data } = await supabase!
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      orderNumber: data.order_number,
      customerName: data.customer_name,
      email: data.email,
      itemsCount: 0,
      totalAmount: Number(data.total_amount),
      status: data.status,
      paymentStatus: data.payment_status,
      paymentMethod: data.payment_method,
      date: new Date(data.created_at).toISOString().split('T')[0],
    };
  }

  async create(input: CreateOrderInput): Promise<string | null> {
    const orderNumber = `GR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const { data, error } = await supabase!
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: input.customerName,
        email: input.email,
        phone: input.phone,
        shipping_address: input.shippingAddress,
        payment_method: input.paymentMethod,
        total_amount: input.totalAmount,
        discount_amount: input.discountAmount || 0,
        coupon_code: input.couponCode || null,
        status: 'Pending',
        payment_status: input.paymentStatus || 'Pending',
      })
      .select('*')
      .single();
    if (error || !data) return null;

    // Insert order items
    for (const item of input.items) {
      await supabase!.from('order_items').insert({
        order_id: data.id,
        product_id: item.productId,
        product_name: item.productName,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
      });
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('gr_last_order_number', orderNumber);
    }
    return orderNumber;
  }

  async updateStatus(id: string, status: MockOrder['status']): Promise<boolean> {
    const { error } = await supabase!
      .from('orders')
      .update({ status })
      .eq('id', id);
    return !error;
  }
}

// ─── Supabase Coupon Repository ───────────────────────────────────────────────

export class SupabaseCouponRepository implements ICouponRepository {
  async getAll(): Promise<MockCoupon[]> {
    const { data, error } = await supabase!.from('coupons').select('*');
    if (error || !data) return [];
    return data.map((c: any) => ({
      code: c.code,
      discountPercent: Number(c.discount_percent),
      description: c.description,
      isActive: c.is_active,
      usageCount: c.usage_count || 0,
    }));
  }

  async apply(code: string): Promise<{ valid: boolean; discount: number; message: string }> {
    const { data } = await supabase!
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .maybeSingle();
    if (!data) return { valid: false, discount: 0, message: 'Invalid coupon code.' };
    await supabase!.from('coupons').update({ usage_count: (data.usage_count || 0) + 1 }).eq('code', code);
    return {
      valid: true,
      discount: Number(data.discount_percent),
      message: `Coupon applied! ${data.discount_percent}% off – ${data.description}`,
    };
  }

  async create(coupon: Omit<MockCoupon, 'usageCount'>): Promise<MockCoupon | null> {
    const { data, error } = await supabase!
      .from('coupons')
      .insert({
        code: coupon.code,
        discount_percent: coupon.discountPercent,
        description: coupon.description,
        is_active: coupon.isActive,
        usage_count: 0,
      })
      .select('*')
      .single();
    if (error || !data) return null;
    return { code: data.code, discountPercent: data.discount_percent, description: data.description, isActive: data.is_active, usageCount: 0 };
  }

  async toggle(code: string, isActive: boolean): Promise<boolean> {
    const { error } = await supabase!.from('coupons').update({ is_active: isActive }).eq('code', code);
    return !error;
  }

  async delete(code: string): Promise<boolean> {
    const { error } = await supabase!.from('coupons').delete().eq('code', code);
    return !error;
  }
}

// ─── Supabase Storage Repository ─────────────────────────────────────────────

export class SupabaseStorageRepository implements IStorageRepository {
  async uploadImage(file: File, bucket: 'products' | 'banners' | 'collections'): Promise<string | null> {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase!.storage.from(bucket).upload(path, file);
    if (error) return null;
    const { data } = supabase!.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async deleteImage(url: string, bucket: 'products' | 'banners' | 'collections'): Promise<boolean> {
    const path = url.split(`/${bucket}/`)[1];
    if (!path) return false;
    const { error } = await supabase!.storage.from(bucket).remove([path]);
    return !error;
  }

  getImageUrl(path: string, bucket: 'products' | 'banners' | 'collections'): string {
    const { data } = supabase!.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
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
      { count: productCount },
      { count: orderCount },
      { count: couponCount },
      { data: revenueData },
      { data: ordersData },
    ] = await Promise.all([
      supabase!.from('products').select('*', { count: 'exact', head: true }),
      supabase!.from('orders').select('*', { count: 'exact', head: true }),
      supabase!.from('coupons').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase!.from('orders').select('total_amount, status, created_at, order_number, customer_name, id').neq('status', 'Cancelled').neq('status', 'Returned'),
      supabase!.from('orders').select('*').order('created_at', { ascending: false }).limit(6),
    ]);

    const validOrders = revenueData || [];
    const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const totalOrders = orderCount || 0;
    const avgOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

    return {
      totalProducts: productCount || 0,
      totalOrders,
      totalRevenue,
      totalCoupons: couponCount || 0,
      lowStockCount: 0,
      pendingOrders: 0,
      avgOrderValue,
      couponsUsed: 0,
      topProducts: [],
      topCategories: [],
      recentOrders: (ordersData || []).map((o: any) => ({
        id: o.id,
        orderNumber: o.order_number,
        customerName: o.customer_name,
        totalAmount: Number(o.total_amount),
        status: o.status,
        date: new Date(o.created_at).toISOString().split('T')[0],
      })),
      lowStockProducts: [],
      monthlyPerformance: [],
      orderStatusBreakdown: [],
    };
  }
}
