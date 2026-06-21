/**
 * GR STYLES – Mock Store (In-Memory State)
 * ==========================================
 * Acts as the single source of truth for all entities in demo/mock mode.
 * Supports real-time CRUD: products added in admin immediately appear on frontend.
 * 
 * Architecture: Singleton pattern ensures all imports share the same state.
 * When Supabase is configured, this is bypassed entirely.
 */

import { Product, products as seedProducts } from '@/lib/data/products';
import { normalizeCategory, normalizeSlug, normalizeCollection } from '../utils/categoryImageMap';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MockOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone?: string;
  itemsCount: number;
  totalAmount: number;
  status: 'Pending' | 'Confirmed' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  paymentMethod: string;
  shippingAddress?: any;
  couponCode?: string;
  discountAmount?: number;
  date: string;
  items?: MockOrderItem[];
}

export interface MockOrderItem {
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  price: number;
}

export interface MockCoupon {
  code: string;
  discountPercent: number;
  description: string;
  isActive: boolean;
  usageCount: number;
  maxUsage?: number;
  expiresAt?: string;
}

// ─── Singleton Store ───────────────────────────────────────────────────────────

class MockStore {
  private _products: Product[];
  private _orders: MockOrder[];
  private _coupons: MockCoupon[];
  private _users: { id: string; email: string; fullName: string; role: 'customer' | 'admin'; avatar?: string }[];

  constructor() {
    // Initialize users
    this._users = [
      {
        id: 'demo-admin-001',
        email: 'grstyles955@gmail.com',
        fullName: 'Admin User',
        role: 'admin',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin',
      },
      {
        id: 'demo-customer-001',
        email: 'customer@grstyles.com',
        fullName: 'Demo Customer',
        role: 'customer',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=customer',
      },
    ];

    // Initialize products from seed data with normalized categories, collections, and slugs
    this._products = seedProducts.map((p) => {
      let catVal = p.category;
      // Map watch products specifically to watches
      if (catVal === 'Accessories' && (p.name.toLowerCase().includes('watch') || p.title.toLowerCase().includes('watch'))) {
        catVal = 'watches';
      }
      return {
        ...p,
        category: normalizeCategory(catVal),
        collection: p.collection ? normalizeCollection(p.collection) : '',
        slug: p.slug ? normalizeSlug(p.slug) : normalizeSlug(p.name || p.title),
      };
    });

    // Initialize mock orders
    this._orders = [
      {
        id: 'ORD-2026-108',
        orderNumber: 'GR-2026-100108',
        customerName: 'Rahul Kumar',
        email: 'rahul.k@gmail.com',
        phone: '+91 9876500108',
        itemsCount: 2,
        totalAmount: 2798,
        status: 'Pending',
        paymentStatus: 'Pending',
        paymentMethod: 'COD',
        date: '2026-06-19',
        items: [
          { productId: '1', productName: 'Premium White Oxford Shirt', size: 'L', quantity: 1, price: 1999 },
          { productId: 'bp-white-001', productName: 'White Baggy Pant', size: '32', quantity: 1, price: 599 },
        ],
      },
      {
        id: 'ORD-2026-107',
        orderNumber: 'GR-2026-100107',
        customerName: 'Arjun Sharma',
        email: 'arjun.s@gmail.com',
        phone: '+91 9876500107',
        itemsCount: 1,
        totalAmount: 1499,
        status: 'Confirmed',
        paymentStatus: 'Paid',
        paymentMethod: 'Razorpay',
        date: '2026-06-19',
        items: [
          { productId: '3', productName: 'Beige Korean Shirt', size: 'M', quantity: 1, price: 1499 },
        ],
      },
      {
        id: 'ORD-2026-106',
        orderNumber: 'GR-2026-100106',
        customerName: 'Vikram Singh',
        email: 'vikram.s@gmail.com',
        phone: '+91 9876500106',
        itemsCount: 3,
        totalAmount: 4497,
        status: 'Packed',
        paymentStatus: 'Paid',
        paymentMethod: 'Razorpay',
        date: '2026-06-18',
      },
      {
        id: 'ORD-2026-105',
        orderNumber: 'GR-2026-100105',
        customerName: 'Sanjay Patel',
        email: 'sanjay.p@gmail.com',
        phone: '+91 9876500105',
        itemsCount: 2,
        totalAmount: 3398,
        status: 'Shipped',
        paymentStatus: 'Paid',
        paymentMethod: 'Razorpay',
        date: '2026-06-18',
      },
      {
        id: 'ORD-2026-104',
        orderNumber: 'GR-2026-100104',
        customerName: 'Nikhil Mehta',
        email: 'nikhil.m@gmail.com',
        phone: '+91 9876500104',
        itemsCount: 1,
        totalAmount: 1199,
        status: 'Delivered',
        paymentStatus: 'Paid',
        paymentMethod: 'COD',
        date: '2026-06-17',
      },
      {
        id: 'ORD-2026-103',
        orderNumber: 'GR-2026-100103',
        customerName: 'Rohan Verma',
        email: 'rohan.v@gmail.com',
        phone: '+91 9876500103',
        itemsCount: 3,
        totalAmount: 5697,
        status: 'Delivered',
        paymentStatus: 'Paid',
        paymentMethod: 'Razorpay',
        date: '2026-06-17',
      },
      {
        id: 'ORD-2026-102',
        orderNumber: 'GR-2026-100102',
        customerName: 'Deepak Nair',
        email: 'deepak.n@gmail.com',
        phone: '+91 9876500102',
        itemsCount: 1,
        totalAmount: 1999,
        status: 'Cancelled',
        paymentStatus: 'Refunded',
        paymentMethod: 'Razorpay',
        date: '2026-06-16',
      },
      {
        id: 'ORD-2026-101',
        orderNumber: 'GR-2026-100101',
        customerName: 'Aakash Gupta',
        email: 'aakash.g@gmail.com',
        phone: '+91 9876500101',
        itemsCount: 2,
        totalAmount: 3298,
        status: 'Returned',
        paymentStatus: 'Refunded',
        paymentMethod: 'Razorpay',
        date: '2026-06-15',
      },
    ];

    // Initialize coupons
    this._coupons = [
      {
        code: 'WELCOME10',
        discountPercent: 10,
        description: '10% off on your first order',
        isActive: true,
        usageCount: 34,
      },
      {
        code: 'WEEKEND10',
        discountPercent: 10,
        description: '10% off on weekend orders',
        isActive: true,
        usageCount: 18,
      },
      {
        code: 'FESTIVAL20',
        discountPercent: 20,
        description: '20% off during festival season',
        isActive: true,
        usageCount: 10,
      },
    ];
  }

  // ─── Product Methods ─────────────────────────────────────────────────────────

  getProducts(): Product[] {
    return this._products;
  }

  getProductBySlug(slug: string): Product | undefined {
    return this._products.find((p) => p.slug === slug);
  }

  getProductById(id: string): Product | undefined {
    return this._products.find((p) => p.id === id || p.productId === id);
  }

  getProductsByCategory(category: string): Product[] {
    const cat = category.toLowerCase();
    return this._products.filter((p) => p.category.toLowerCase() === cat);
  }

  addProduct(product: Product): Product {
    // Normalize category, collection, and slug values
    product.category = normalizeCategory(product.category);
    product.collection = product.collection ? normalizeCollection(product.collection) : '';
    product.slug = product.slug ? normalizeSlug(product.slug) : normalizeSlug(product.name || product.title);

    // Remove duplicate if same slug/id
    this._products = this._products.filter(
      (p) => p.id !== product.id && p.slug !== product.slug
    );
    this._products.unshift(product);
    return product;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const idx = this._products.findIndex((p) => p.id === id || p.productId === id);
    if (idx === -1) return null;

    if (updates.category) {
      updates.category = normalizeCategory(updates.category);
    }
    if (updates.collection !== undefined) {
      updates.collection = updates.collection ? normalizeCollection(updates.collection) : '';
    }
    if (updates.slug) {
      updates.slug = normalizeSlug(updates.slug);
    } else if (updates.name) {
      updates.slug = normalizeSlug(updates.name);
    }

    this._products[idx] = { ...this._products[idx], ...updates };
    return this._products[idx];
  }

  deleteProduct(id: string): boolean {
    const before = this._products.length;
    this._products = this._products.filter((p) => p.id !== id && p.productId !== id);
    return this._products.length < before;
  }

  updateInventory(productId: string, size: string, newStock: number): boolean {
    const product = this.getProductById(productId);
    if (!product) return false;

    const sizeIdx = product.sizes.findIndex((s) => s.size === size);
    if (sizeIdx !== -1) {
      product.sizes[sizeIdx].stock = Math.max(0, newStock);
    } else {
      product.sizes.push({ size, stock: Math.max(0, newStock) });
    }
    product.stockCount = product.sizes.reduce((sum, s) => sum + s.stock, 0);
    product.inStock = product.stockCount > 0;
    return true;
  }

  // ─── Order Methods ───────────────────────────────────────────────────────────

  getOrders(): MockOrder[] {
    return this._orders;
  }

  getOrderById(id: string): MockOrder | undefined {
    return this._orders.find((o) => o.id === id);
  }

  createOrder(order: Omit<MockOrder, 'id'>): MockOrder {
    const newOrder: MockOrder = {
      ...order,
      id: `ORD-2026-${String(Date.now()).slice(-6)}`,
      status: order.status || 'Pending',
    };
    this._orders.unshift(newOrder);

    if (order.couponCode) {
      const coupon = this.getCouponByCode(order.couponCode);
      if (coupon) coupon.usageCount++;
    }

    if (order.items) {
      for (const item of order.items) {
        const product = this.getProductById(item.productId);
        const currentStock =
          product?.sizes.find((s) => s.size === item.size)?.stock ?? 0;
        this.updateInventory(
          item.productId,
          item.size,
          Math.max(0, currentStock - item.quantity)
        );
      }
    }
    return newOrder;
  }

  updateOrderStatus(id: string, status: MockOrder['status']): boolean {
    const order = this.getOrderById(id);
    if (!order) return false;
    order.status = status;
    return true;
  }

  // ─── Coupon Methods ──────────────────────────────────────────────────────────

  getCoupons(): MockCoupon[] {
    return this._coupons;
  }

  getCouponByCode(code: string): MockCoupon | undefined {
    return this._coupons.find((c) => c.code === code.toUpperCase().trim());
  }

  addCoupon(coupon: MockCoupon): MockCoupon {
    this._coupons.unshift(coupon);
    return coupon;
  }

  updateCoupon(code: string, updates: Partial<MockCoupon>): MockCoupon | null {
    const idx = this._coupons.findIndex((c) => c.code === code);
    if (idx === -1) return null;
    this._coupons[idx] = { ...this._coupons[idx], ...updates };
    return this._coupons[idx];
  }

  deleteCoupon(code: string): boolean {
    const before = this._coupons.length;
    this._coupons = this._coupons.filter((c) => c.code !== code);
    return this._coupons.length < before;
  }

  applyCoupon(code: string): { valid: boolean; discount: number; message: string } {
    const coupon = this.getCouponByCode(code);
    if (!coupon) return { valid: false, discount: 0, message: 'Invalid coupon code.' };
    if (!coupon.isActive) return { valid: false, discount: 0, message: 'This coupon is currently inactive.' };
    return {
      valid: true,
      discount: coupon.discountPercent,
      message: `Coupon applied! ${coupon.discountPercent}% off – ${coupon.description}`,
    };
  }

  // ─── Analytics ───────────────────────────────────────────────────────────────

  getStats() {
    const validOrders = this._orders.filter(
      (o) => o.status !== 'Cancelled' && o.status !== 'Returned'
    );
    const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const lowStockProducts = this._products.filter((p) => {
      const total = (p.sizes || []).reduce((acc, s) => acc + (s.stock || 0), 0);
      return total > 0 && total <= 5;
    });

    return {
      totalProducts: this._products.length,
      totalOrders: this._orders.length,
      totalRevenue,
      totalCoupons: this._coupons.filter((c) => c.isActive).length,
      lowStockCount: lowStockProducts.length,
      pendingOrders: this._orders.filter((o) => o.status === 'Pending').length,
    };
  }

  getFullAnalytics() {
    const stats = this.getStats();
    const validOrders = this._orders.filter(
      (o) => o.status !== 'Cancelled' && o.status !== 'Returned'
    );
    const avgOrderValue =
      validOrders.length > 0 ? Math.round(stats.totalRevenue / validOrders.length) : 0;
    const couponsUsed = this._coupons.reduce((sum, c) => sum + c.usageCount, 0);

    const productSales: Record<
      string,
      { name: string; sku: string; sales: number; revenue: number }
    > = {};
    for (const order of validOrders) {
      for (const item of order.items || []) {
        const product = this.getProductById(item.productId);
        const key = item.productId;
        if (!productSales[key]) {
          productSales[key] = {
            name: item.productName,
            sku: product?.sku || `GR-${key.slice(0, 6).toUpperCase()}`,
            sales: 0,
            revenue: 0,
          };
        }
        productSales[key].sales += item.quantity;
        productSales[key].revenue += item.price * item.quantity;
      }
    }

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const categoryRevenue: Record<string, number> = {};
    for (const order of validOrders) {
      for (const item of order.items || []) {
        const product = this.getProductById(item.productId);
        const cat = product?.category || 'Other';
        categoryRevenue[cat] = (categoryRevenue[cat] || 0) + item.price * item.quantity;
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

    const recentOrders = this._orders.slice(0, 6).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      totalAmount: o.totalAmount,
      status: o.status,
      date: o.date,
    }));

    const lowStockProducts: {
      productId: string;
      name: string;
      size: string;
      stock: number;
    }[] = [];
    for (const p of this._products) {
      for (const s of p.sizes || []) {
        if (s.stock > 0 && s.stock <= 5) {
          lowStockProducts.push({
            productId: p.id,
            name: p.name || p.title,
            size: s.size,
            stock: s.stock,
          });
        }
      }
    }
    lowStockProducts.sort((a, b) => a.stock - b.stock);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap: Record<string, { revenue: number; orders: number }> = {};
    for (const order of validOrders) {
      const d = new Date(order.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { revenue: 0, orders: 0 };
      }
      monthlyMap[key].revenue += order.totalAmount;
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

    const statusLabels: MockOrder['status'][] = [
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
      count: this._orders.filter((o) => o.status === label).length,
    }));

    return {
      ...stats,
      avgOrderValue,
      couponsUsed,
      topProducts,
      topCategories,
      recentOrders,
      lowStockProducts: lowStockProducts.slice(0, 10),
      monthlyPerformance,
      orderStatusBreakdown,
    };
  }

  getUsers() {
    return this._users;
  }

  addUser(user: any) {
    this._users.push(user);
  }

  updateUser(id: string, updates: any) {
    const idx = this._users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this._users[idx] = { ...this._users[idx], ...updates };
    }
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

// Use globalThis to ensure single instance across hot reloads in dev
const globalKey = '__gr_mock_store__';
if (!(globalThis as any)[globalKey]) {
  (globalThis as any)[globalKey] = new MockStore();
}

export const mockStore: MockStore = (globalThis as any)[globalKey];
