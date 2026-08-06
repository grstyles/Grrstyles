'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Check, Copy, Sparkles, ChevronDown } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { Product } from '@/lib/data/products';
import { useAuth } from '@/lib/context/AuthContext';
import { getApplicableCouponsForProduct, ApplicableProductCoupon } from '@/lib/utils/couponHelper';
import { applyPromo } from '@/lib/redux/slices/cartSlice';
import { addToast } from '@/lib/redux/slices/uiSlice';

interface ProductCouponBadgeProps {
  product: Product;
  className?: string;
}

export default function ProductCouponBadge({ product, className = '' }: ProductCouponBadgeProps) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<ApplicableProductCoupon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showAll, setShowAll] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProductCoupons() {
      if (!product) {
        setCoupons([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const applicable = await getApplicableCouponsForProduct(product, user?.id, user?.email);
        if (isMounted) {
          setCoupons(applicable);
        }
      } catch (err) {
        console.error('Failed to load product coupons:', err);
        if (isMounted) setCoupons([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProductCoupons();

    return () => {
      isMounted = false;
    };
  }, [product, user?.id, user?.email]);

  const handleCopy = (coupon: ApplicableProductCoupon, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(coupon.code);
    setCopiedCode(coupon.code);

    dispatch(applyPromo({
      code: coupon.code,
      discountValue: coupon.discountValue,
      discountType: coupon.discountType === 'percentage' ? 'percentage' : 'flat',
    }));
    dispatch(addToast({
      message: `🎉 Coupon "${coupon.code}" copied and applied to your order!`,
      type: 'success',
    }));

    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  if (loading || !coupons || coupons.length === 0) {
    return null;
  }

  const bestCoupon = coupons[0];

  const getDiscountLabel = (coupon: ApplicableProductCoupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}% OFF`;
    }
    return `₹${coupon.discountValue} OFF`;
  };

  return (
    <div className={`my-4 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-emerald-100/30 border border-emerald-200/80 shadow-sm transition-all ${className}`}>
      {/* Primary / Best Coupon Offer */}
      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm flex-shrink-0">
            <Tag size={18} className="stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300/60">
                Special Offer
              </span>
              <span className="text-sm font-extrabold text-emerald-950">
                {getDiscountLabel(bestCoupon)}
              </span>
            </div>
            <p className="text-xs text-emerald-800/90 mt-0.5 truncate max-w-xs sm:max-w-md font-medium">
              {bestCoupon.description || (bestCoupon.minimumPurchase > 0 ? `On orders over ₹${bestCoupon.minimumPurchase}` : 'Applicable on this item')}
            </p>
          </div>
        </div>

        {/* Coupon Code Pill with One-Click Copy */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto sm:ml-0">
          <button
            type="button"
            onClick={(e) => handleCopy(bestCoupon, e)}
            className="group relative flex items-center gap-1.5 bg-white hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-dashed border-emerald-500 shadow-sm transition-all text-xs font-mono font-bold text-emerald-950 active:scale-95 cursor-pointer"
            title="Click to copy coupon code"
          >
            <span className="tracking-wider text-xs font-bold">{bestCoupon.code}</span>
            {copiedCode === bestCoupon.code ? (
              <span className="flex items-center gap-0.5 text-emerald-600 font-sans font-semibold text-[11px]">
                <Check size={14} className="stroke-[3]" /> Applied!
              </span>
            ) : (
              <Copy size={13} className="text-emerald-600 group-hover:text-emerald-800" />
            )}
          </button>
        </div>
      </div>

      {/* Multiple Coupons Toggle */}
      {coupons.length > 1 && (
        <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1.5 font-semibold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
          >
            <Sparkles size={13} className="text-emerald-600" />
            <span>{showAll ? 'Hide extra offers' : `+${coupons.length - 1} more offer${coupons.length - 1 > 1 ? 's' : ''} available`}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}

      {/* Expanded List for Additional Coupons */}
      {showAll && coupons.length > 1 && (
        <div className="mt-2.5 space-y-2 pt-1 animate-fadeIn">
          {coupons.slice(1).map((c, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 bg-white/90 rounded-xl border border-emerald-100/90 shadow-2xs text-xs">
              <div className="pr-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {c.code}
                  </span>
                  <span className="font-bold text-emerald-800">
                    {getDiscountLabel(c)}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 mt-0.5">{c.description}</p>
              </div>
              <button
                type="button"
                onClick={(e) => handleCopy(c, e)}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex-shrink-0"
              >
                {copiedCode === c.code ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <Check size={12} className="stroke-[3]" /> Applied
                  </span>
                ) : (
                  <>
                    <Copy size={12} /> Copy & Apply
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
