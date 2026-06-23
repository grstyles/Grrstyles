/**
 * GR STYLES â€“ Repository Factory
 * ================================
 * Single entry point for all data access.
 * 
 * Automatically selects the correct provider:
 * - Mock Provider: When Supabase env vars are NOT set
 * - Supabase Provider: When NEXT_PUBLIC_SUPABASE_URL is set
 * 
 * Usage example:
 *   import { repo } from '@/lib/repositories'
 *   const products = await repo.products.getAll()
 *   const orders = await repo.orders.getAll()
 */

import {
  IProductRepository,
  IOrderRepository,
  ICouponRepository,
  IStorageRepository,
  IAnalyticsRepository,
} from './interfaces';
export type { IUserRepository, UserProfile } from './userRepository';
import { IUserRepository, SupabaseUserRepository } from './userRepository';

import {
  SupabaseProductRepository,
  SupabaseOrderRepository,
  SupabaseCouponRepository,
  SupabaseStorageRepository,
  SupabaseAnalyticsRepository,
} from './supabaseProvider';

// ─── Repository Set ─────────────────────────────────────────────────────────────

interface RepositorySet {
  products: IProductRepository;
  orders: IOrderRepository;
  coupons: ICouponRepository;
  storage: IStorageRepository;
  analytics: IAnalyticsRepository;
  users: IUserRepository;
}

// ─── Factory Function ──────────────────────────────────────────────────────────

function createRepositories(): RepositorySet {
  // ✅ Supabase Mode Only
  return {
    products: new SupabaseProductRepository(),
    orders: new SupabaseOrderRepository(),
    coupons: new SupabaseCouponRepository(),
    storage: new SupabaseStorageRepository(),
    analytics: new SupabaseAnalyticsRepository(),
    users: new SupabaseUserRepository(),
  };
}

// ──────────────────────────────────────────────────────────────────────────────

const repoKey = '__gr_repositories__';
if (!(globalThis as any)[repoKey]) {
  (globalThis as any)[repoKey] = createRepositories();
}

/**
 * The global repository object.
 * All data access should go through this.
 * 
 * @example
 * import { repo } from '@/lib/repositories'
 * 
 * const products = await repo.products.getAll()
 * const order = await repo.orders.getById('ORD-2026-108')
 * const coupon = await repo.coupons.apply('WELCOME10')
 */
export const repo: RepositorySet = (globalThis as any)[repoKey];

// Re-export interfaces for convenience
export type {
  IProductRepository,
  IOrderRepository,
  ICouponRepository,
  IStorageRepository,
  IAnalyticsRepository,
  InventoryEntry,
  CreateOrderInput,
  DashboardStats,
  FullAnalytics,
  AnalyticsTopProduct,
  AnalyticsCategoryBreakdown,
  AnalyticsRecentOrder,
  AnalyticsLowStockItem,
  AnalyticsMonthlyData,
  MockOrder,
  MockOrderItem,
  MockCoupon,
} from './interfaces';

