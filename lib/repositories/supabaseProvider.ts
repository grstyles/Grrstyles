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
    try {
      const { data, error } = await supabase!
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data) throw error || new Error('No data');
      return data.map(mapDbProduct);
    } catch (e) {
      console.error('Supabase ProductRepository.getAll failed:', e);
      return [];
    }
  }

  async getBySlug(slug: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase!
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return mapDbProduct(data);
    } catch (e) {
      console.error(`Supabase ProductRepository.getBySlug failed for ${slug}:`, e);
      return null;
    }
  }

  async getByCategory(category: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase!
        .from('products')
        .select('*')
        .ilike('category', category)
        .order('created_at', { ascending: false });
      if (error || !data) throw error || new Error('No data');
      return data.map(mapDbProduct);
    } catch (e) {
      console.error(`Supabase ProductRepository.getByCategory failed for ${category}:`, e);
      return [];
    }
  }

  async getByCollection(collection: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase!
        .from('products')
        .select('*')
        .ilike('collection', collection)
        .order('created_at', { ascending: false });
      if (error || !data) throw error || new Error('No data');
      return data.map(mapDbProduct);
    } catch (e) {
      console.error(`Supabase ProductRepository.getByCollection failed for ${collection}:`, e);
      return [];
    }
  }

  async create(product: Product): Promise<Product | null> {
    console.log('Using Provider: Supabase');
    try {
      const mapped = {
        sku: product.sku || `GR-${product.category.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        name: product.name,
        slug: product.slug ? normalizeSlug(product.slug) : normalizeSlug(product.name || product.title),
        category: normalizeCategory(product.category),
        collection: product.collection ? normalizeCollection(product.collection) : '',
        images: product.images,
        sizes: product.sizes,
        stock: product.sizes?.reduce((sum: number, s: any) => sum + (s.stock || 0), 0) || 0,
        mrp: product.mrpPrice,
        selling_price: product.sellingPrice,
        description: product.description,
        brand: product.brand || 'GR STYLES',
        new_arrival: product.isNew || false,
        trending: product.bestSeller || false,
        deal_of_day: product.metadata?.dealOfDay || false,
        featured: product.metadata?.featured || false,
      };
      const { data, error } = await supabase!
        .from('products')
        .insert(mapped)
        .select('*')
        .single();
      if (error || !data) throw error || new Error('No data');
      return mapDbProduct(data);
    } catch (e) {
      console.error('Supabase ProductRepository.create failed:', e);
      return null;
    }
  }

  async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    try {
      const mapped: any = {};
      if (updates.name) mapped.name = updates.name;
      if (updates.slug) mapped.slug = normalizeSlug(updates.slug);
      else if (updates.name) mapped.slug = normalizeSlug(updates.name);
      if (updates.category) mapped.category = normalizeCategory(updates.category);
      if (updates.collection !== undefined) mapped.collection = updates.collection ? normalizeCollection(updates.collection) : '';
      if (updates.sellingPrice) mapped.selling_price = updates.sellingPrice;
      if (updates.mrpPrice) mapped.mrp = updates.mrpPrice;
      if (updates.sizes) {
        mapped.sizes = updates.sizes;
        mapped.stock = updates.sizes.reduce((sum: number, s: any) => sum + (s.stock || 0), 0);
      }
      if (updates.description) mapped.description = updates.description;
      if (updates.isNew !== undefined) mapped.new_arrival = updates.isNew;
      if (updates.bestSeller !== undefined) mapped.trending = updates.bestSeller;
      if (updates.metadata?.dealOfDay !== undefined) mapped.deal_of_day = updates.metadata.dealOfDay;
      if (updates.metadata?.featured !== undefined) mapped.featured = updates.metadata.featured;
      if (updates.brand) mapped.brand = updates.brand;

      const { data, error } = await supabase!
        .from('products')
        .update(mapped)
        .or(`id.eq.${id},product_id.eq.${id}`)
        .select('*')
        .single();
      if (error || !data) throw error || new Error('No data');
      return mapDbProduct(data);
    } catch (e) {
      console.error(`Supabase ProductRepository.update failed for ${id}:`, e);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from('products')
        .delete()
        .or(`id.eq.${id},product_id.eq.${id}`);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error(`Supabase ProductRepository.delete failed for ${id}:`, e);
      return false;
    }
  }

  async search(query: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase!
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`);
      if (error || !data) throw error || new Error('No data');
      return data.map(mapDbProduct);
    } catch (e) {
      console.error(`Supabase ProductRepository.search failed for ${query}:`, e);
      return [];
    }
  }

  async getInventory(): Promise<InventoryEntry[]> {
    try {
      const { data, error } = await supabase!
        .from('products')
        .select('id, name, slug, category, sizes')
        .order('category');
      if (error || !data) throw error || new Error('No data');
      return data.map((d: any) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
        category: d.category,
        sizeStock: d.sizes || [],
      }));
    } catch (e) {
      console.error('Supabase ProductRepository.getInventory failed:', e);
      return [];
    }
  }

  async updateStock(productId: string, size: string, newStock: number): Promise<boolean> {
    try {
      const { data, error } = await supabase!
        .from('products')
        .select('sizes')
        .or(`id.eq.${productId},product_id.eq.${productId}`)
        .maybeSingle();
      if (error || !data) throw error || new Error('No data');

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
      if (updateError) throw updateError;
      return true;
    } catch (e) {
      console.error(`Supabase ProductRepository.updateStock failed for ${productId}:`, e);
      return false;
    }
  }
}

// ─── Supabase Order Repository ────────────────────────────────────────────────

export class SupabaseOrderRepository implements IOrderRepository {
  async getAll(): Promise<MockOrder[]> {
    const { data, error } = await supabase!
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) throw error;
    return data.map((d: any) => ({
      id: d.id,
      orderNumber: d.order_number,
      customerName: d.customer_name,
      email: d.customer_email || '',
      phone: d.customer_phone || '',
      itemsCount: (d.items || []).reduce((s: number, i: any) => s + i.quantity, 0),
      totalAmount: Number(d.total_amount),
      status: d.status as MockOrder['status'],
      paymentStatus: d.payment_status as MockOrder['paymentStatus'],
      paymentMethod: 'Prepaid',
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
      email: data.customer_email || '',
      itemsCount: (data.items || []).reduce((s: number, i: any) => s + i.quantity, 0),
      totalAmount: Number(data.total_amount),
      status: data.status,
      paymentStatus: data.payment_status,
      paymentMethod: 'Prepaid',
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
        customer_email: input.email,
        customer_phone: input.phone,
        shipping_address: input.shippingAddress,
        total_amount: input.totalAmount,
        status: 'Pending',
        payment_status: input.paymentStatus || 'Pending',
        items: input.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          size: item.size,
          quantity: item.quantity,
          price: item.price
        }))
      })
      .select('*')
      .single();
    if (error || !data) return null;

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
      isActive: c.active,
      usageCount: 0,
    }));
  }

  async apply(code: string): Promise<{ valid: boolean; discount: number; message: string }> {
    const { data } = await supabase!
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('active', true)
      .maybeSingle();
    if (!data) return { valid: false, discount: 0, message: 'Invalid coupon code.' };
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
        active: coupon.isActive,
      })
      .select('*')
      .single();
    if (error || !data) return null;
    return { code: data.code, discountPercent: data.discount_percent, description: data.description, isActive: data.active, usageCount: 0 };
  }

  async toggle(code: string, isActive: boolean): Promise<boolean> {
    const { error } = await supabase!.from('coupons').update({ active: isActive }).eq('code', code);
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
    try {
      const [
        { data: productsData, error: productsError },
        { data: ordersData, error: ordersError },
        { count: couponCount, error: couponError },
      ] = await Promise.all([
        supabase!.from('products').select('id, name, sizes, category, sku'),
        supabase!.from('orders').select('id, order_number, customer_name, total_amount, status, created_at, items'),
        supabase!.from('coupons').select('*', { count: 'exact', head: true }).eq('active', true),
      ]);

      if (productsError) throw productsError;
      if (ordersError) throw ordersError;
      if (couponError) throw couponError;

      const products = productsData || [];
      const orders = ordersData || [];

      const totalProducts = products.length;
      const totalOrders = orders.length;
      const totalCoupons = couponCount || 0;

      const pendingOrders = orders.filter((o) => o.status === 'Pending').length;
      const validOrders = orders.filter(
        (o) => o.status !== 'Cancelled' && o.status !== 'Returned'
      );
      const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
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
      const recentOrders = orders.slice(0, 6).map((o) => ({
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
        const sizesArray = p.sizes || [];
        for (const s of sizesArray) {
          if (s.stock >= 0 && s.stock <= 5) {
            lowStockProducts.push({
              productId: p.id,
              name: p.name,
              size: s.size,
              stock: s.stock,
            });
          }
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
        count: orders.filter((o) => o.status === label).length,
      }));

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
      };
    } catch (e) {
      console.error('SupabaseAnalyticsRepository.getFullAnalytics failed:', e);
      return {
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalCoupons: 0,
        lowStockCount: 0,
        pendingOrders: 0,
        avgOrderValue: 0,
        couponsUsed: 0,
        topProducts: [],
        topCategories: [],
        recentOrders: [],
        lowStockProducts: [],
        monthlyPerformance: [],
        orderStatusBreakdown: [],
      };
    }
  }
}
