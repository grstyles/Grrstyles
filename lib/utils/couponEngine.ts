import { MockCoupon } from '@/lib/repositories/interfaces';

export interface CartItemForCoupon {
  id?: string;
  productId?: string;
  slug?: string;
  sku?: string;
  category?: string;
  price?: number;
  discountedPrice?: number;
  sellingPrice?: number;
  quantity?: number;
  couponApplicable?: boolean;
  is_coupon_applicable?: boolean;
  coupon_applicable?: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  couponName?: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  maximumDiscount?: number | null;
  minimumPurchase: number;
  maxCartValue?: number | null;
  calculatedDiscount: number;
  finalTotal: number;
  message: string;
  errorType?: 
    | 'INVALID_CODE'
    | 'INACTIVE'
    | 'EXPIRED'
    | 'NOT_STARTED'
    | 'USAGE_LIMIT_REACHED'
    | 'MIN_PURCHASE_NOT_MET'
    | 'MAX_CART_EXCEEDED'
    | 'FIRST_ORDER_ONLY'
    | 'USER_LIMIT_REACHED'
    | 'NO_ELIGIBLE_ITEMS';
}

export interface CouponUserContext {
  userId?: string | null;
  userEmail?: string | null;
  userPastOrderCount?: number;
  userCouponUsageCount?: number;
}

/**
 * Shared authoritative dual coupon validation & pricing engine.
 * Validates cart items / subtotal and user context against configured admin coupon rules.
 */
export function validateAndCalculateCoupon(
  coupon: MockCoupon | null | undefined,
  subtotalOrItems: number | CartItemForCoupon[],
  userContext: CouponUserContext = {}
): CouponValidationResult {
  if (!coupon || !coupon.code) {
    return {
      valid: false,
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      minimumPurchase: 0,
      calculatedDiscount: 0,
      finalTotal: typeof subtotalOrItems === 'number' ? subtotalOrItems : 0,
      message: 'Invalid Coupon Code',
      errorType: 'INVALID_CODE',
    };
  }

  const cleanCode = coupon.code.toUpperCase().trim();
  const dType: 'fixed' | 'percentage' = (coupon.discountType === 'flat' || coupon.discountType === 'fixed') ? 'fixed' : 'percentage';
  const dVal = Number(coupon.discountValue || 0);
  const minVal = Number(coupon.minimumPurchase ?? coupon.minOrderValue ?? 0);
  const maxCartVal = coupon.maxCartValue != null ? Number(coupon.maxCartValue) : null;
  const maxDiscCap = coupon.maximumDiscount != null ? Number(coupon.maximumDiscount) : null;

  let totalCartAmount = 0;
  let eligibleSubtotal = 0;

  if (Array.isArray(subtotalOrItems)) {
    const items = subtotalOrItems;
    totalCartAmount = items.reduce((sum, item) => {
      const price = Number(item.sellingPrice ?? item.discountedPrice ?? item.price ?? 0);
      const qty = Number(item.quantity || 1);
      return sum + price * qty;
    }, 0);

    const eligibleItems = items.filter((item) => {
      // 1. Check Product-Level Coupon Enabled Flag
      const isEnabled =
        item.couponApplicable !== false &&
        item.is_coupon_applicable !== false &&
        item.coupon_applicable !== false;
      if (!isEnabled) return false;

      // 2. Check Exclude Sale Products
      if (coupon.excludeSaleProducts) {
        const itemPrice = Number(item.price || item.sellingPrice || 0);
        const itemDiscPrice = Number(item.discountedPrice || item.sellingPrice || itemPrice);
        if (itemDiscPrice < itemPrice) return false;
      }

      // 3. Check Applicable Products Restriction
      if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
        const pId = item.id || item.productId || '';
        const pSlug = item.slug || '';
        const pSku = item.sku || '';
        const matched = coupon.applicableProducts.some(
          (ap) => ap === pId || ap === pSlug || (pSku && ap === pSku)
        );
        if (!matched) return false;
      }

      // 4. Check Applicable Categories Restriction
      if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
        const itemCat = (item.category || '').toLowerCase().trim();
        const matched = coupon.applicableCategories.some(
          (ac) => ac.toLowerCase().trim() === itemCat
        );
        if (!matched) return false;
      }

      return true;
    });

    eligibleSubtotal = eligibleItems.reduce((sum, item) => {
      const price = Number(item.sellingPrice ?? item.discountedPrice ?? item.price ?? 0);
      const qty = Number(item.quantity || 1);
      return sum + price * qty;
    }, 0);

    if (eligibleSubtotal <= 0) {
      return {
        valid: false,
        code: cleanCode,
        couponName: coupon.name || coupon.description,
        discountType: dType,
        discountValue: dVal,
        minimumPurchase: minVal,
        maxCartValue: maxCartVal,
        maximumDiscount: maxDiscCap,
        calculatedDiscount: 0,
        finalTotal: totalCartAmount,
        message: 'None of the items in your cart are eligible for this coupon code.',
        errorType: 'NO_ELIGIBLE_ITEMS',
      };
    }
  } else {
    totalCartAmount = Number(subtotalOrItems || 0);
    eligibleSubtotal = totalCartAmount;
  }

  // 1. Check Active Status
  if (coupon.isActive === false) {
    return {
      valid: false,
      code: cleanCode,
      couponName: coupon.name || coupon.description,
      discountType: dType,
      discountValue: dVal,
      minimumPurchase: minVal,
      maxCartValue: maxCartVal,
      maximumDiscount: maxDiscCap,
      calculatedDiscount: 0,
      finalTotal: totalCartAmount,
      message: 'Coupon Inactive',
      errorType: 'INACTIVE',
    };
  }

  // 2. Check Date Validity
  const now = new Date();
  if (coupon.startDate && new Date(coupon.startDate) > now) {
    return {
      valid: false,
      code: cleanCode,
      couponName: coupon.name || coupon.description,
      discountType: dType,
      discountValue: dVal,
      minimumPurchase: minVal,
      maxCartValue: maxCartVal,
      maximumDiscount: maxDiscCap,
      calculatedDiscount: 0,
      finalTotal: totalCartAmount,
      message: 'Coupon is not yet active',
      errorType: 'NOT_STARTED',
    };
  }

  const expDate = coupon.expiryDate || coupon.endDate;
  if (expDate && new Date(expDate) < now) {
    return {
      valid: false,
      code: cleanCode,
      couponName: coupon.name || coupon.description,
      discountType: dType,
      discountValue: dVal,
      minimumPurchase: minVal,
      maxCartValue: maxCartVal,
      maximumDiscount: maxDiscCap,
      calculatedDiscount: 0,
      finalTotal: totalCartAmount,
      message: 'Coupon Expired',
      errorType: 'EXPIRED',
    };
  }

  // 3. Check Overall Usage Limit
  if (coupon.usageLimit && coupon.usageLimit > 0 && (coupon.usageCount || 0) >= coupon.usageLimit) {
    return {
      valid: false,
      code: cleanCode,
      couponName: coupon.name || coupon.description,
      discountType: dType,
      discountValue: dVal,
      minimumPurchase: minVal,
      maxCartValue: maxCartVal,
      maximumDiscount: maxDiscCap,
      calculatedDiscount: 0,
      finalTotal: totalCartAmount,
      message: 'Coupon Usage Limit Reached',
      errorType: 'USAGE_LIMIT_REACHED',
    };
  }

  // 4. Check Per-User Limit
  if (coupon.usagePerUser && coupon.usagePerUser > 0 && userContext.userCouponUsageCount != null) {
    if (userContext.userCouponUsageCount >= coupon.usagePerUser) {
      return {
        valid: false,
        code: cleanCode,
        couponName: coupon.name || coupon.description,
        discountType: dType,
        discountValue: dVal,
        minimumPurchase: minVal,
        maxCartValue: maxCartVal,
        maximumDiscount: maxDiscCap,
        calculatedDiscount: 0,
        finalTotal: totalCartAmount,
        message: 'Coupon Already Used',
        errorType: 'USER_LIMIT_REACHED',
      };
    }
  }

  // 5. Check First Order Only
  if (coupon.firstOrderOnly && userContext.userPastOrderCount != null && userContext.userPastOrderCount > 0) {
    return {
      valid: false,
      code: cleanCode,
      couponName: coupon.name || coupon.description,
      discountType: dType,
      discountValue: dVal,
      minimumPurchase: minVal,
      maxCartValue: maxCartVal,
      maximumDiscount: maxDiscCap,
      calculatedDiscount: 0,
      finalTotal: totalCartAmount,
      message: 'Coupon Available For First Order Only',
      errorType: 'FIRST_ORDER_ONLY',
    };
  }

  // 6. Check Minimum Purchase Value on Eligible Subtotal
  if (minVal > 0 && eligibleSubtotal < minVal) {
    return {
      valid: false,
      code: cleanCode,
      couponName: coupon.name || coupon.description,
      discountType: dType,
      discountValue: dVal,
      minimumPurchase: minVal,
      maxCartValue: maxCartVal,
      maximumDiscount: maxDiscCap,
      calculatedDiscount: 0,
      finalTotal: totalCartAmount,
      message: `Minimum Purchase of ₹${minVal.toLocaleString('en-IN')} Required`,
      errorType: 'MIN_PURCHASE_NOT_MET',
    };
  }

  // 7. Check Maximum Cart Value on Eligible Subtotal
  if (maxCartVal !== null && maxCartVal > 0 && eligibleSubtotal > maxCartVal) {
    return {
      valid: false,
      code: cleanCode,
      couponName: coupon.name || coupon.description,
      discountType: dType,
      discountValue: dVal,
      minimumPurchase: minVal,
      maxCartValue: maxCartVal,
      maximumDiscount: maxDiscCap,
      calculatedDiscount: 0,
      finalTotal: totalCartAmount,
      message: `Cart Total Exceeds Maximum Limit of ₹${maxCartVal.toLocaleString('en-IN')}`,
      errorType: 'MAX_CART_EXCEEDED',
    };
  }

  // 8. Calculate Discount Amount
  let rawDiscount = 0;
  if (dType === 'percentage') {
    rawDiscount = Math.round((eligibleSubtotal * dVal) / 100);
    if (maxDiscCap !== null && maxDiscCap > 0) {
      rawDiscount = Math.min(rawDiscount, maxDiscCap);
    }
  } else {
    rawDiscount = dVal;
  }

  // Ensure discount does not exceed eligibleSubtotal
  const finalDiscountApplied = Math.max(0, Math.min(rawDiscount, eligibleSubtotal));
  const finalTotalAfterDiscount = Math.max(0, totalCartAmount - finalDiscountApplied);

  return {
    valid: true,
    code: cleanCode,
    couponName: coupon.name || coupon.description || cleanCode,
    discountType: dType,
    discountValue: dVal,
    minimumPurchase: minVal,
    maxCartValue: maxCartVal,
    maximumDiscount: maxDiscCap,
    calculatedDiscount: finalDiscountApplied,
    finalTotal: finalTotalAfterDiscount,
    message: 'Coupon Applied Successfully',
  };
}

