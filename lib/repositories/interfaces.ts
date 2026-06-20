/**
 * GR STYLES – Repository Interfaces
 * ====================================
 * Abstract contracts that both MockProvider and SupabaseProvider must implement.
 * The frontend ONLY interacts with these interfaces – never with the provider directly.
 * 
 * Swap between providers by changing a single config flag (NEXT_PUBLIC_SUPABASE_URL).
 */

import { Product } from '@/lib/data/products';
import { MockOrder, MockCoupon } from '@/lib/providers/mockStore';

// ─── Product Repository ───────────────────────────────────────────────────────

export interface IProductRepository {
  /** Return all products */
  getAll(): Promise<Product[]>;

  /** Return single product by URL slug */
  getBySlug(slug: string): Promise<Product | null>;

  /** Return products filtered by category name */
  getByCategory(category: string): Promise<Product[]>;

  /** Return products filtered by collection name */
  getByCollection(collection: string): Promise<Product[]>;

  /** Create a new product. Returns the saved product or null on failure. */
  create(product: Product): Promise<Product | null>;

  /** Update a product by ID. Returns updated product or null. */
  update(id: string, updates: Partial<Product>): Promise<Product | null>;

  /** Delete a product by ID. Returns true on success. */
  delete(id: string): Promise<boolean>;

  /** Search products by name/description */
  search(query: string): Promise<Product[]>;

  /** Get all inventory entries (product + size-wise stock) */
  getInventory(): Promise<InventoryEntry[]>;

  /** Update stock for a specific size of a product */
  updateStock(productId: string, size: string, newStock: number): Promise<boolean>;
}

export interface InventoryEntry {
  id: string;
  name: string;
  slug: string;
  category: string;
  sizeStock: { size: string; stock: number }[];
}

// ─── Order Repository ─────────────────────────────────────────────────────────

export interface IOrderRepository {
  /** Get all orders, newest first */
  getAll(): Promise<MockOrder[]>;

  /** Get order by ID */
  getById(id: string): Promise<MockOrder | null>;

  /** Create a new order from checkout */
  create(orderData: CreateOrderInput): Promise<string | null>; // returns order number

  /** Update order status */
  updateStatus(id: string, status: MockOrder['status']): Promise<boolean>;
}

export interface CreateOrderInput {
  customerName: string;
  email: string;
  phone?: string;
  shippingAddress?: any;
  paymentMethod: string;
  paymentStatus?: string;
  status?: MockOrder['status'];
  totalAmount: number;
  discountAmount?: number;
  couponCode?: string;
  items: {
    productId: string;
    productName: string;
    size: string;
    quantity: number;
    price: number;
  }[];
}

// ─── Coupon Repository ────────────────────────────────────────────────────────

export interface ICouponRepository {
  /** Get all coupons */
  getAll(): Promise<MockCoupon[]>;

  /** Validate and apply a coupon code */
  apply(code: string): Promise<{ valid: boolean; discount: number; message: string }>;

  /** Create a new coupon */
  create(coupon: Omit<MockCoupon, 'usageCount'>): Promise<MockCoupon | null>;

  /** Toggle coupon active/inactive */
  toggle(code: string, isActive: boolean): Promise<boolean>;

  /** Delete coupon */
  delete(code: string): Promise<boolean>;
}

// ─── Storage Repository ───────────────────────────────────────────────────────

export interface IStorageRepository {
  /** Upload an image file, returns public URL */
  uploadImage(file: File, bucket: 'products' | 'banners' | 'collections'): Promise<string | null>;

  /** Delete an image by URL or path */
  deleteImage(url: string, bucket: 'products' | 'banners' | 'collections'): Promise<boolean>;

  /** Get public URL for a stored asset */
  getImageUrl(path: string, bucket: 'products' | 'banners' | 'collections'): string;
}

// ─── Analytics Repository ─────────────────────────────────────────────────────

export interface IAnalyticsRepository {
  getDashboardStats(): Promise<DashboardStats>;
  getFullAnalytics(): Promise<FullAnalytics>;
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCoupons: number;
  lowStockCount: number;
  pendingOrders: number;
}

export interface AnalyticsTopProduct {
  name: string;
  sku: string;
  sales: number;
  revenue: number;
}

export interface AnalyticsCategoryBreakdown {
  name: string;
  value: number;
  revenue: number;
}

export interface AnalyticsRecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  date: string;
}

export interface AnalyticsLowStockItem {
  productId: string;
  name: string;
  size: string;
  stock: number;
}

export interface AnalyticsMonthlyData {
  month: string;
  revenue: number;
  orders: number;
}

export interface AnalyticsOrderStatusCount {
  label: string;
  count: number;
}

export interface FullAnalytics extends DashboardStats {
  avgOrderValue: number;
  couponsUsed: number;
  topProducts: AnalyticsTopProduct[];
  topCategories: AnalyticsCategoryBreakdown[];
  recentOrders: AnalyticsRecentOrder[];
  lowStockProducts: AnalyticsLowStockItem[];
  monthlyPerformance: AnalyticsMonthlyData[];
  orderStatusBreakdown: AnalyticsOrderStatusCount[];
}
