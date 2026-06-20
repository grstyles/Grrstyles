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
 * 
 * To add Supabase later: just set env vars. Zero code changes.
 */

import { isSupabaseConfigured } from '@/lib/supabase';

import {
  IProductRepository,
  IOrderRepository,
  ICouponRepository,
  IStorageRepository,
  IAnalyticsRepository,
} from './interfaces';
export type { IUserRepository, UserProfile } from './userRepository';
import { IUserRepository, MockUserRepository, SupabaseUserRepository } from './userRepository';

import {
  MockProductRepository,
  MockOrderRepository,
  MockCouponRepository,
  MockStorageRepository,
  MockAnalyticsRepository,
} from './mockProvider';

import {
  SupabaseProductRepository,
  SupabaseOrderRepository,
  SupabaseCouponRepository,
  SupabaseStorageRepository,
  SupabaseAnalyticsRepository,
} from './supabaseProvider';

// â”€â”€â”€ Repository Set â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface RepositorySet {
  products: IProductRepository;
  orders: IOrderRepository;
  coupons: ICouponRepository;
  storage: IStorageRepository;
  analytics: IAnalyticsRepository;
  users: IUserRepository;
}

// â”€â”€â”€ Factory Function â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function createRepositories(): RepositorySet {
  if (isSupabaseConfigured()) {
    // âœ… Supabase Mode â€“ live data
    return {
      products: new SupabaseProductRepository(),
      orders: new SupabaseOrderRepository(),
      coupons: new SupabaseCouponRepository(),
      storage: new SupabaseStorageRepository(),
      analytics: new SupabaseAnalyticsRepository(),
      users: new SupabaseUserRepository(),
    };
  }

  // âœ… Demo / Mock Mode â€“ in-memory data
  return {
    products: new MockProductRepository(),
    orders: new MockOrderRepository(),
    coupons: new MockCouponRepository(),
    storage: new MockStorageRepository(),
    analytics: new MockAnalyticsRepository(),
    users: new MockUserRepository(),
  };
}

// â”€â”€â”€ Singleton â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
} from './interfaces';

