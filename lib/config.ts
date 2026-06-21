/**
 * GR STYLES - Centralized Environment Configuration
 * -------------------------------------------------
 * Single source of truth for runtime configuration.
 * UI and feature code must import from here — never process.env.
 */

const env = process.env;

export const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const RAZORPAY_KEY_ID = env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_demo_placeholder';
export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
export const ADMIN_ID = 'demo-admin-001';
export const IS_PRODUCTION = env.NODE_ENV === 'production';

export const IS_SUPABASE_CONFIGURED = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('YOUR_SUPABASE_URL') &&
  !SUPABASE_URL.includes('PASTE_SUPABASE_URL_HERE')
);

export const IS_RAZORPAY_CONFIGURED = Boolean(
  env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
  !env.NEXT_PUBLIC_RAZORPAY_KEY_ID.toLowerCase().includes('demo') &&
  !env.NEXT_PUBLIC_RAZORPAY_KEY_ID.toLowerCase().includes('placeholder')
);

export const IS_DEMO_MODE = !IS_SUPABASE_CONFIGURED;

export const STORE_NAME = 'GR STYLES';
export const STORE_TAGLINE = "Men's Fashion Store";
export const STORE_CURRENCY = 'INR';
export const STORE_CURRENCY_SYMBOL = 'Rs.';
export const FREE_SHIPPING_ABOVE = 999;
export const GST_PERCENT = 18;

export const STORAGE_BUCKETS = {
  PRODUCTS: 'products',
  BANNERS: 'banners',
  COLLECTIONS: 'collections',
  BRANDS: 'brands',
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export const FEATURES = {
  RAZORPAY_PAYMENTS: IS_RAZORPAY_CONFIGURED,
  REALTIME_SYNC: IS_SUPABASE_CONFIGURED,
  DEMO_BANNERS: IS_DEMO_MODE,
  PRODUCT_REVIEWS: true,
  WISHLIST: true,
} as const;

export const DEFAULT_COUPONS = [
  { code: 'WELCOME10', discountPercent: 10, description: '10% off on your first order' },
  { code: 'WEEKEND10', discountPercent: 10, description: '10% off on weekend orders' },
  { code: 'FESTIVAL20', discountPercent: 20, description: '20% off during festival season' },
] as const;

export const COLLECTIONS = [
  'Korean Collections',
  'Trending Collections',
  'Baggy Pants',
  'Korean Trousers',
  'Shoes',
  'Traditional Collections',
  'Festival Collections',
  'Combo Offers',
  'Festival Offers',
  'Weekend Offers',
  'Formal Combos',
  'Deal Of The Day',
] as const;

export type CollectionName = (typeof COLLECTIONS)[number];

export const PRODUCT_CATEGORIES = [
  'Shirts',
  'Printed Shirts',
  'T-Shirts',
  'Jackets',
  'Night Tracks',
  'Accessories',
  'Formal Pant',
  'Formal Shirts',
  'Trousers',
  'Denim Jeans',
  'Shoes',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Packed',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Primary configuration object — use this in application code. */
export const config = {
  demoMode: IS_DEMO_MODE,
  isProduction: IS_PRODUCTION,
  isSupabaseConfigured: IS_SUPABASE_CONFIGURED,
  isRazorpayConfigured: IS_RAZORPAY_CONFIGURED,
  adminEmail: ADMIN_EMAIL,
  adminPassword: ADMIN_PASSWORD,
  adminId: ADMIN_ID,
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_ANON_KEY,
  razorpayKey: RAZORPAY_KEY_ID,
  storeName: STORE_NAME,
  storeTagline: STORE_TAGLINE,
  currency: STORE_CURRENCY,
  currencySymbol: STORE_CURRENCY_SYMBOL,
  freeShippingAbove: FREE_SHIPPING_ABOVE,
  gstPercent: GST_PERCENT,
  features: FEATURES,
} as const;

export default config;
