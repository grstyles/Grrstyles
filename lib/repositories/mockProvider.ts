/**
 * GR STYLES – Mock Provider
 * ==========================
 * Implements all repository interfaces using the in-memory MockStore.
 * Used when Supabase is NOT configured (demo/development mode).
 * 
 * All operations are immediate (no network latency) with simulated delays
 * to mimic real API behavior.
 */

import { Product } from '@/lib/data/products';
import { mockStore, MockOrder, MockCoupon } from '@/lib/providers/mockStore';
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

const delay = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Mock Product Repository ──────────────────────────────────────────────────

export class MockProductRepository implements IProductRepository {
  async getAll(): Promise<Product[]> {
    await delay();
    return mockStore.getProducts();
  }

  async getBySlug(slug: string): Promise<Product | null> {
    await delay();
    return mockStore.getProductBySlug(slug) ?? null;
  }

  async getByCategory(category: string): Promise<Product[]> {
    await delay();
    const normalizedSlug = category.toLowerCase().trim();
    const slugMap: Record<string, string> = {
      'shirts': 'Shirts',
      't-shirts': 'T-Shirts',
      'tshirts': 'T-Shirts',
      'trousers': 'Trousers',
      'jackets': 'Jackets',
      'hoodies': 'Hoodies',
      'jeans': 'Jeans',
      'sweatshirts': 'Sweatshirts',
      'shoes': 'Shoes',
      'footwear': 'Shoes',
      'accessories': 'Accessories',
      'baggy-pants': 'Trousers',
      'baggy': 'Trousers',
      'formal': 'Shirts',
      'blazers': 'Jackets',
      'sneakers': 'Shoes',
    };
    const dbCategory = slugMap[normalizedSlug] || category;
    return mockStore.getProducts().filter((p) =>
      p.category.toLowerCase() === dbCategory.toLowerCase()
    );
  }

  async getByCollection(collection: string): Promise<Product[]> {
    await delay();
    const slug = collection.toLowerCase().trim();
    const all = mockStore.getProducts();

    const byField = all.filter(
      (p) => p.collection && p.collection.toLowerCase() === collection.toLowerCase()
    );
    if (byField.length > 0) return byField;

    if (slug === 'korean-collection') {
      return all.filter((p) =>
        p.name.toLowerCase().includes('korean') || p.description.toLowerCase().includes('korean')
      );
    }
    if (slug === 'festival-collection' || slug === 'festival-wear') {
      return all.filter((p) => p.label === 'HOT' || p.discountPercent > 20 || p.label === 'NEW');
    }
    if (slug === 'formal-collection' || slug === 'formal-wear' || slug === 'office-wear-collection') {
      return all.filter(
        (p) =>
          p.name.toLowerCase().includes('formal') ||
          p.description.toLowerCase().includes('formal') ||
          p.name.toLowerCase().includes('office')
      );
    }
    if (slug === 'weekend-collection' || slug === 'weekend-offers') {
      return all.filter(
        (p) =>
          p.name.toLowerCase().includes('casual') ||
          p.name.toLowerCase().includes('weekend') ||
          p.description.toLowerCase().includes('weekend')
      );
    }
    if (slug === 'denim-collection') {
      return all.filter(
        (p) => p.category === 'Jeans' || p.name.toLowerCase().includes('denim')
      );
    }
    if (slug === 'streetwear-collection') {
      return all.filter(
        (p) =>
          p.name.toLowerCase().includes('oversized') ||
          p.category === 'Hoodies' ||
          p.category === 'Sweatshirts'
      );
    }
    if (slug === 'premium-essentials') {
      return all.filter((p) => p.name.toLowerCase().includes('premium'));
    }

    return all.slice(0, 8);
  }

  async create(product: Product): Promise<Product | null> {
    console.log('Using Provider: Mock');
    await delay();
    return mockStore.addProduct(product);
  }

  async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    await delay();
    return mockStore.updateProduct(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    await delay();
    return mockStore.deleteProduct(id);
  }

  async search(query: string): Promise<Product[]> {
    await delay();
    const q = query.toLowerCase();
    return mockStore.getProducts().filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  async getInventory(): Promise<InventoryEntry[]> {
    await delay();
    return mockStore.getProducts().map((p) => ({
      id: p.id,
      name: p.name || p.title || '',
      slug: p.slug,
      category: p.category,
      sizeStock: p.sizes || [],
    }));
  }

  async updateStock(productId: string, size: string, newStock: number): Promise<boolean> {
    await delay();
    return mockStore.updateInventory(productId, size, newStock);
  }
}

// ─── Mock Order Repository ────────────────────────────────────────────────────

export class MockOrderRepository implements IOrderRepository {
  async getAll(): Promise<MockOrder[]> {
    await delay();
    return mockStore.getOrders();
  }

  async getById(id: string): Promise<MockOrder | null> {
    await delay();
    return mockStore.getOrderById(id) ?? null;
  }

  async create(input: CreateOrderInput): Promise<string | null> {
    await delay();
    const orderNumber = `GR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const order = mockStore.createOrder({
      orderNumber,
      customerName: input.customerName,
      email: input.email,
      phone: input.phone,
      itemsCount: input.items.reduce((sum, i) => sum + i.quantity, 0),
      totalAmount: input.totalAmount,
      status: input.status || 'Pending',
      paymentStatus: (input.paymentStatus as MockOrder['paymentStatus']) || 'Pending',
      paymentMethod: input.paymentMethod,
      shippingAddress: input.shippingAddress,
      couponCode: input.couponCode,
      discountAmount: input.discountAmount,
      date: new Date().toISOString().split('T')[0],
      items: input.items,
    });

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('gr_last_order_number', orderNumber);
    }
    return order.orderNumber;
  }

  async updateStatus(id: string, status: MockOrder['status']): Promise<boolean> {
    await delay();
    return mockStore.updateOrderStatus(id, status);
  }
}

// ─── Mock Coupon Repository ───────────────────────────────────────────────────

export class MockCouponRepository implements ICouponRepository {
  async getAll(): Promise<MockCoupon[]> {
    await delay();
    return mockStore.getCoupons();
  }

  async apply(code: string): Promise<{ valid: boolean; discount: number; message: string }> {
    await delay();
    return mockStore.applyCoupon(code);
  }

  async create(coupon: Omit<MockCoupon, 'usageCount'>): Promise<MockCoupon | null> {
    await delay();
    const existing = mockStore.getCouponByCode(coupon.code);
    if (existing) return null; // duplicate
    return mockStore.addCoupon({ ...coupon, usageCount: 0 });
  }

  async toggle(code: string, isActive: boolean): Promise<boolean> {
    await delay();
    const result = mockStore.updateCoupon(code, { isActive });
    return !!result;
  }

  async delete(code: string): Promise<boolean> {
    await delay();
    return mockStore.deleteCoupon(code);
  }
}

// ─── Mock Storage Repository ──────────────────────────────────────────────────

export class MockStorageRepository implements IStorageRepository {
  async uploadImage(
    file: File,
    _bucket: 'products' | 'banners' | 'collections'
  ): Promise<string | null> {
    await delay(600);
    // Return a data URL (for demo mode — no actual upload)
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  async deleteImage(
    _url: string,
    _bucket: 'products' | 'banners' | 'collections'
  ): Promise<boolean> {
    await delay();
    return true; // No-op in demo mode
  }

  getImageUrl(path: string, _bucket: 'products' | 'banners' | 'collections'): string {
    return path; // In demo mode, paths are already URLs
  }
}

// ─── Mock Analytics Repository ────────────────────────────────────────────────

export class MockAnalyticsRepository implements IAnalyticsRepository {
  async getDashboardStats(): Promise<DashboardStats> {
    await delay();
    return mockStore.getStats();
  }

  async getFullAnalytics(): Promise<FullAnalytics> {
    await delay();
    return mockStore.getFullAnalytics();
  }
}
