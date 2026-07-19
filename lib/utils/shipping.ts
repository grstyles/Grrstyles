import { ShippingSettings } from '../repositories/interfaces';

export interface CartItemLike {
  price: number;
  discountedPrice?: number;
  sellingPrice?: number;
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
  // Calculate subtotal using selling/discounted price
  const subtotal = items.reduce((sum, item) => {
    const price =
      item.discountedPrice ??
      item.sellingPrice ??
      item.price ??
      0;

    return sum + price * item.quantity;
  }, 0);

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