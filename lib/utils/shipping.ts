import { ShippingSettings } from '../repositories/interfaces';

export interface CartItemLike {
  price: number;
  discountedPrice?: number;
  sellingPrice?: number;
  originalPrice?: number;
  quantity: number;
}

export interface OrderPricingBreakdown {
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
}

/**
 * Centralized shipping & order total calculation.
 * This is the single source of truth used by Checkout,
 * Razorpay Order API, COD API, and Order Verification.
 */
export function calculateOrderTotals(
  items: CartItemLike[],
  shippingCfg: Partial<ShippingSettings>,
  couponDiscount: number = 0
): OrderPricingBreakdown {
  if (!items || items.length === 0) {
    return {
      subtotal: 0,
      shipping: 0,
      discount: 0,
      tax: 0,
      total: 0,
    };
  }

  // Calculate subtotal using selling/discounted price
  const subtotal = items.reduce((sum, item) => {
    const price =
      item.discountedPrice ??
      item.sellingPrice ??
      item.price ??
      0;

    return sum + Math.max(0, price) * (item.quantity || 1);
  }, 0);

  if (subtotal <= 0) {
    return {
      subtotal: 0,
      shipping: 0,
      discount: 0,
      tax: 0,
      total: 0,
    };
  }

  // Shipping calculation
  let shipping = 0;

  // Global free delivery
  if (shippingCfg.freeDelivery) {
    shipping = 0;
  }
  // Free shipping above threshold
  else if (
    (shippingCfg.freeShippingAbove ?? 0) > 0 &&
    subtotal >= (shippingCfg.freeShippingAbove ?? 0)
  ) {
    shipping = 0;
  }
  // Normal shipping charge
  else {
    shipping = Number(shippingCfg.shippingCharge ?? 0);
  }

  // Tax (currently disabled)
  const tax = 0;

  const total = Math.max(
    0,
    subtotal - couponDiscount + shipping + tax
  );

  console.log('📦 Shipping Calculation');
  console.table({
    subtotal,
    discount: couponDiscount,
    shippingCharge: shippingCfg.shippingCharge,
    freeShippingAbove: shippingCfg.freeShippingAbove,
    freeDelivery: shippingCfg.freeDelivery,
    shipping,
    tax,
    total,
  });

  return {
    subtotal,
    shipping,
    discount: couponDiscount,
    tax,
    total,
  };
}

/**
 * Calculates total savings on an order from product price discounts and coupon discount.
 *
 * Savings per item = (Original Price - Selling Price) * Quantity
 * Total Product Savings = Sum of savings of all cart items
 * Final Savings = Product Savings + Coupon Discount
 */
export function calculateTotalSavings(
  items: CartItemLike[],
  couponDiscount: number = 0
): number {
  if (!items || items.length === 0) return 0;

  const productSavings = items.reduce((sum, item) => {
    const originalPrice = Number(item.originalPrice ?? item.price ?? 0);
    const sellingPrice = Number(item.sellingPrice ?? item.discountedPrice ?? item.price ?? 0);
    const itemSavings = Math.max(0, originalPrice - sellingPrice) * (item.quantity || 1);
    return sum + itemSavings;
  }, 0);

  return productSavings + Math.max(0, couponDiscount);
}