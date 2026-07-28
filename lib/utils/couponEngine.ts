import { MockCoupon } from '@/lib/repositories/interfaces';

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
    | 'USER_LIMIT_REACHED';
}

export interface CouponUserContext {
  userId?: string | null;
  userEmail?: string | null;
  userPastOrderCount?: number;
  userCouponUsageCount?: number;
}

/**
 * Shared authoritative storewide dual coupon engine.
 * Validates cart subtotal and user context against configured admin coupon rules.
 */
export function validateAndCalculateCoupon(
  coupon: MockCoupon | null | undefined,
  subtotal: number,
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
      finalTotal: subtotal,
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
      finalTotal: subtotal,
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
      finalTotal: subtotal,
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
      finalTotal: subtotal,
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
      finalTotal: subtotal,
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
        finalTotal: subtotal,
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
      finalTotal: subtotal,
      message: 'Coupon Available For First Order Only',
      errorType: 'FIRST_ORDER_ONLY',
    };
  }

  // 6. Check Minimum Cart Value
  if (minVal > 0 && subtotal < minVal) {
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
      finalTotal: subtotal,
      message: `Minimum Purchase ₹${minVal.toLocaleString('en-IN')} Required`,
      errorType: 'MIN_PURCHASE_NOT_MET',
    };
  }

  // 7. Check Maximum Cart Value
  if (maxCartVal !== null && maxCartVal > 0 && subtotal > maxCartVal) {
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
      finalTotal: subtotal,
      message: `Cart Total Exceeds Maximum Limit of ₹${maxCartVal.toLocaleString('en-IN')}`,
      errorType: 'MAX_CART_EXCEEDED',
    };
  }

  // 8. Calculate Discount Amount
  let rawDiscount = 0;
  if (dType === 'percentage') {
    rawDiscount = Math.round((subtotal * dVal) / 100);
    if (maxDiscCap !== null && maxDiscCap > 0) {
      rawDiscount = Math.min(rawDiscount, maxDiscCap);
    }
  } else {
    rawDiscount = dVal;
  }

  // Ensure discount does not exceed subtotal
  const finalDiscountApplied = Math.max(0, Math.min(rawDiscount, subtotal));
  const finalTotalAfterDiscount = Math.max(0, subtotal - finalDiscountApplied);

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
