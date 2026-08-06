import { ShippingSettings } from '../repositories/interfaces';

export interface CartItemLike {
  price: number;
  discountedPrice?: number;
  sellingPrice?: number;
  originalPrice?: number;
  quantity: number;
  deliveryChargeEnabled?: boolean;
  deliveryCharge?: number;
  delivery_charge_enabled?: boolean;
  delivery_charge?: number;
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
 * Single source of truth supporting both product-level custom delivery charges
 * and global shipping settings.
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

  // Product-Level & Global Shipping Calculation
  let customShippingTotal = 0;
  let hasGlobalShippingItems = false;

  for (const item of items) {
    const isCustomEnabled = Boolean(
      item.deliveryChargeEnabled ?? item.delivery_charge_enabled ?? false
    );

    if (isCustomEnabled) {
      const customCharge = Math.max(
        0,
        Number(item.deliveryCharge ?? item.delivery_charge ?? 0)
      );
      customShippingTotal += customCharge * (item.quantity || 1);
    } else {
      hasGlobalShippingItems = true;
    }
  }

  let globalShippingTotal = 0;

  if (hasGlobalShippingItems) {
    if (shippingCfg.freeDelivery) {
      globalShippingTotal = 0;
    } else if (
      (shippingCfg.freeShippingAbove ?? 0) > 0 &&
      subtotal >= (shippingCfg.freeShippingAbove ?? 0)
    ) {
      globalShippingTotal = 0;
    } else {
      globalShippingTotal = Number(shippingCfg.shippingCharge ?? 0);
    }
  }

  const shipping = customShippingTotal + globalShippingTotal;

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
    customShippingTotal,
    globalShippingTotal,
    hasGlobalShippingItems,
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