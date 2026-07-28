import { repo } from '@/lib/repositories';
import { CartItem } from '@/lib/redux/slices/cartSlice';
import { applyPromo } from '@/lib/redux/slices/cartSlice';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { AppDispatch } from '@/lib/redux/store';
import { validateAndCalculateCoupon } from './couponEngine';

export interface EligibleCouponResult {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  calculatedDiscount: number;
  description: string;
  isReward?: boolean;
}

/**
 * Finds all active, valid, and unexpired storewide coupons for the current cart/subtotal
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

  // 1. Fetch storewide / public coupons
  try {
    const allCoupons = await repo.coupons.getAll();
    for (const c of allCoupons) {
      const res = validateAndCalculateCoupon(c, subtotal, { userId, userEmail });
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
      for (const card of userCards) {
        if (card.status !== 'CLAIMED' && card.status !== 'SCRATCHED') continue;

        const code = card.coupon_code || `GR${card.reward_value || 500}ABCD`;
        const rewardType: 'percentage' | 'flat' = (card.reward_type === 'percentage_discount' || card.reward_type === 'percentage') ? 'percentage' : 'flat';
        const rewardVal = Number(card.reward_value || 500);

        let calcDiscount = 0;
        if (rewardType === 'percentage') {
          calcDiscount = Math.round((subtotal * rewardVal) / 100);
        } else {
          calcDiscount = rewardVal;
        }

        if (calcDiscount > 0) {
          eligibleCandidates.push({
            code,
            discountType: rewardType,
            discountValue: rewardVal,
            calculatedDiscount: Math.min(calcDiscount, subtotal),
            description: `Reward Coupon: ₹${rewardVal} OFF`,
            isReward: true,
          });
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
