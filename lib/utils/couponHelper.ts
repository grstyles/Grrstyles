import { repo } from '@/lib/repositories';
import { CartItem } from '@/lib/redux/slices/cartSlice';
import { applyPromo, removePromo } from '@/lib/redux/slices/cartSlice';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { AppDispatch } from '@/lib/redux/store';
import { validateAndCalculateCoupon, CouponValidationResult } from './couponEngine';

export interface EligibleCouponResult {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  calculatedDiscount: number;
  description: string;
  isReward?: boolean;
}

/**
 * Finds all active, valid, and unexpired storewide and product-eligible coupons for the current cart
 * and returns the single coupon yielding the HIGHEST discount.
 */
export async function findBestEligibleCoupon(
  cartItems: CartItem[],
  subtotal: number,
  userId?: string | null,
  userEmail?: string | null
): Promise<EligibleCouponResult | null> {
  if (!cartItems || cartItems.length === 0 || subtotal <= 0) {
    return null;
  }

  const eligibleCandidates: EligibleCouponResult[] = [];

  // 1. Fetch standard / admin coupons
  try {
    const allCoupons = await repo.coupons.getAll();
    for (const c of allCoupons) {
      const res = validateAndCalculateCoupon(c, cartItems, { userId, userEmail });
      if (res.valid && res.calculatedDiscount > 0) {
        eligibleCandidates.push({
          code: c.code,
          discountType: (c.discountType === 'fixed' || c.discountType === 'flat') ? 'flat' : 'percentage',
          discountValue: c.discountValue,
          calculatedDiscount: res.calculatedDiscount,
          description: c.description || c.name || `${c.discountValue}${c.discountType === 'percentage' ? '%' : '₹'} off`,
        });
      }
    }
  } catch (err) {
    console.warn('Error fetching standard coupons for auto-apply:', err);
  }

  // 2. Fetch user scratch card / reward coupons if logged in
  if (userId) {
    try {
      const userCards = await repo.scratchCards.getUserCards(userId, userEmail || undefined);
      const eligibleSubtotal = cartItems.reduce((sum, item) => {
        const isApplicable = item.couponApplicable !== false && (item as any).is_coupon_applicable !== false && (item as any).coupon_applicable !== false;
        return isApplicable ? sum + (item.discountedPrice || item.price || 0) * item.quantity : sum;
      }, 0);

      if (eligibleSubtotal > 0) {
        for (const card of userCards) {
          if (card.status !== 'CLAIMED' && card.status !== 'SCRATCHED') continue;

          const code = card.coupon_code || `GR${card.reward_value || 500}ABCD`;
          const rewardType: 'percentage' | 'flat' = (card.reward_type === 'percentage_discount' || card.reward_type === 'percentage') ? 'percentage' : 'flat';
          const rewardVal = Number(card.reward_value || 500);

          let calcDiscount = 0;
          if (rewardType === 'percentage') {
            calcDiscount = Math.round((eligibleSubtotal * rewardVal) / 100);
          } else {
            calcDiscount = rewardVal;
          }

          if (calcDiscount > 0) {
            eligibleCandidates.push({
              code,
              discountType: rewardType,
              discountValue: rewardVal,
              calculatedDiscount: Math.min(calcDiscount, eligibleSubtotal),
              description: `Reward Coupon: ₹${rewardVal} OFF`,
              isReward: true,
            });
          }
        }
      }
    } catch (err) {
      console.warn('Error fetching user reward coupons for auto-apply:', err);
    }
  }

  if (eligibleCandidates.length === 0) {
    return null;
  }

  // Sort candidates by calculated discount DESC (highest discount first)
  eligibleCandidates.sort((a, b) => b.calculatedDiscount - a.calculatedDiscount);

  return eligibleCandidates[0];
}

/**
 * Automatically applies the best coupon to Redux state and shows toast notification.
 */
export async function autoApplyBestCoupon(
  cartItems: CartItem[],
  subtotal: number,
  dispatch: AppDispatch,
  userId?: string | null,
  userEmail?: string | null,
  silent: boolean = false
): Promise<EligibleCouponResult | null> {
  const best = await findBestEligibleCoupon(cartItems, subtotal, userId, userEmail);
  if (best) {
    dispatch(applyPromo({
      code: best.code,
      discountValue: best.discountValue,
      discountType: best.discountType,
    }));

    if (!silent) {
      dispatch(addToast({
        message: `🎉 Congratulations! Your coupon "${best.code}" has been applied automatically. You saved ₹${best.calculatedDiscount} on this order.`,
        type: 'success',
      }));
    }
    return best;
  }
  return null;
}

/**
 * Validates the currently applied promo code against current cart items.
 * Automatically clears the applied promo if it is no longer valid.
 */
export async function validateCurrentCartCoupon(
  appliedCode: string,
  cartItems: CartItem[],
  dispatch: AppDispatch,
  userId?: string | null,
  userEmail?: string | null,
  silent: boolean = false
): Promise<CouponValidationResult | null> {
  if (!appliedCode || !cartItems || cartItems.length === 0) {
    if (appliedCode) {
      dispatch(removePromo());
    }
    return null;
  }

  try {
    const allCoupons = await repo.coupons.getAll();
    const matched = allCoupons.find((c) => c.code.toUpperCase().trim() === appliedCode.toUpperCase().trim());

    if (!matched) {
      // Check if it is a valid user scratch card coupon
      if (userId) {
        const userCards = await repo.scratchCards.getUserCards(userId, userEmail || undefined);
        const cardMatch = userCards.find((card) => {
          const code = card.coupon_code || `GR${card.reward_value || 500}ABCD`;
          return code.toUpperCase().trim() === appliedCode.toUpperCase().trim();
        });
        if (cardMatch && (cardMatch.status === 'CLAIMED' || cardMatch.status === 'SCRATCHED')) {
          return null; // Valid scratch card coupon
        }
      }

      dispatch(removePromo());
      if (!silent) {
        dispatch(addToast({ message: `Coupon "${appliedCode}" is no longer valid for your cart.`, type: 'error' }));
      }
      return null;
    }

    const res = validateAndCalculateCoupon(matched, cartItems, { userId, userEmail });
    if (!res.valid || res.calculatedDiscount <= 0) {
      dispatch(removePromo());
      if (!silent) {
        dispatch(addToast({ message: `Coupon "${appliedCode}" removed: ${res.message}`, type: 'error' }));
      }
      return res;
    }

    // Sync Redux state with exact validation values
    dispatch(applyPromo({
      code: res.code,
      discountValue: res.discountValue,
      discountType: res.discountType === 'percentage' ? 'percentage' : 'flat',
    }));

    return res;
  } catch (err) {
    console.warn('Error validating current cart coupon:', err);
  }
  return null;
}

export interface ApplicableProductCoupon {
  code: string;
  name: string;
  discountType: 'percentage' | 'fixed' | 'flat';
  discountValue: number;
  calculatedDiscount: number;
  description: string;
  minimumPurchase: number;
  maximumDiscount?: number | null;
  expiryDate?: string | null;
}

/**
 * Returns all active, valid, and applicable coupons for a given product,
 * ordered by calculated discount DESC (best offer first).
 */
export async function getApplicableCouponsForProduct(
  product: any | null | undefined,
  userId?: string | null,
  userEmail?: string | null
): Promise<ApplicableProductCoupon[]> {
  if (!product) return [];

  const results: ApplicableProductCoupon[] = [];

  try {
    const allCoupons = await repo.coupons.getAll();

    for (const c of allCoupons) {
      const res = validateAndCalculateCoupon(c, [product], { userId, userEmail });
      if (res.valid && res.calculatedDiscount > 0) {
        let formattedDiscountStr = '';
        if (c.discountType === 'percentage') {
          formattedDiscountStr = `${c.discountValue}% OFF`;
          if (c.maximumDiscount) {
            formattedDiscountStr += ` (Max discount ₹${c.maximumDiscount})`;
          }
        } else {
          formattedDiscountStr = `₹${c.discountValue} OFF`;
        }

        const minPurchase = Number(c.minimumPurchase ?? c.minOrderValue ?? 0);
        if (minPurchase > 0) {
          formattedDiscountStr += ` on orders above ₹${minPurchase.toLocaleString('en-IN')}`;
        }

        results.push({
          code: c.code,
          name: c.name || c.description || c.code,
          discountType: (c.discountType === 'fixed' || c.discountType === 'flat') ? 'fixed' : 'percentage',
          discountValue: c.discountValue,
          calculatedDiscount: res.calculatedDiscount,
          description: c.description || formattedDiscountStr,
          minimumPurchase: minPurchase,
          maximumDiscount: c.maximumDiscount,
          expiryDate: c.expiryDate || c.endDate,
        });
      }
    }
  } catch (err) {
    console.warn('Error fetching applicable coupons for product:', err);
  }

  // Sort coupons by calculated discount DESC (highest discount first)
  results.sort((a, b) => b.calculatedDiscount - a.calculatedDiscount);

  return results;
}


